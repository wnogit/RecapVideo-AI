"""
Authentication Endpoints with Anti-Abuse Protection

Supports:
- Google OAuth (primary)
- Email/Password (secondary)
- VPN/Proxy detection
- Device fingerprinting
- IP rate limiting
"""
import secrets
from datetime import datetime, timedelta, timezone
from typing import Optional, Dict, Any

from fastapi import APIRouter, HTTPException, status, Request
from sqlalchemy import select, func
from pydantic import BaseModel, EmailStr, Field, field_validator
from loguru import logger
from user_agents import parse as parse_user_agent

from app.core.config import settings
from app.core.dependencies import DBSession
from app.core.security import (
    create_access_token,
    create_refresh_token,
    verify_token,
    get_password_hash,
    verify_password,
)
from app.models.user import User
from app.models.device import DeviceFingerprint, IPSignupLog
from app.services.ip_service import ip_service
from app.services.rate_limit_service import rate_limit_service
from app.services.email_service import email_service
from app.schemas.user import (
    UserResponse,
    Token,
    TokenRefresh,
)
from app.core.rate_limiter import limiter, AUTH_RATE_LIMITS
from app.api.v1.endpoints.site_settings import get_setting_json


router = APIRouter()


# ============ Constants ============

# Allowed email domains for signup
ALLOWED_EMAIL_DOMAINS = [
    "gmail.com",
    "yahoo.com",
    "yahoo.co.uk",
    "outlook.com",
    "hotmail.com",
    "live.com",
]

# Trial credits for new users
TRIAL_CREDITS = 4


# ============ Helper Functions ============

def get_device_info_from_request(request: Request) -> Dict[str, Any]:
    """Parse user-agent header to extract device information."""
    user_agent_string = request.headers.get("user-agent", "")
    
    if not user_agent_string:
        return {
            "browser": None,
            "browser_version": None,
            "os": None,
            "os_version": None,
            "device_type": "desktop",
        }
    
    try:
        user_agent = parse_user_agent(user_agent_string)
        
        # Determine device type
        if user_agent.is_mobile:
            device_type = "mobile"
        elif user_agent.is_tablet:
            device_type = "tablet"
        else:
            device_type = "desktop"
        
        return {
            "browser": user_agent.browser.family if user_agent.browser.family else None,
            "browser_version": user_agent.browser.version_string if user_agent.browser.version_string else None,
            "os": user_agent.os.family if user_agent.os.family else None,
            "os_version": user_agent.os.version_string if user_agent.os.version_string else None,
            "device_type": device_type,
        }
    except Exception as e:
        logger.warning(f"Failed to parse user-agent: {e}")
        return {
            "browser": None,
            "browser_version": None,
            "os": None,
            "os_version": None,
            "device_type": "desktop",
        }


# ============ Additional Schemas ============

class GoogleAuthRequest(BaseModel):
    """Google OAuth login/signup request."""
    code: str  # Google authorization code
    redirect_uri: str  # The redirect URI used
    device_id: Optional[str] = None  # FingerprintJS visitor ID


class EmailSignupRequest(BaseModel):
    """Email/Password signup request."""
    email: EmailStr
    password: str = Field(..., min_length=8)
    name: str = Field(..., min_length=2, max_length=100)
    device_id: Optional[str] = None
    
    @field_validator('email')
    @classmethod
    def validate_email_domain(cls, v: str) -> str:
        domain = v.lower().split('@')[1]
        if domain not in ALLOWED_EMAIL_DOMAINS:
            raise ValueError(
                f"Only Gmail, Yahoo, Outlook, Hotmail, and Live email addresses are allowed. "
                f"Your domain '{domain}' is not supported."
            )
        return v.lower()


class EmailLoginRequest(BaseModel):
    """Email/Password login request."""
    email: EmailStr
    password: str
    device_id: Optional[str] = None
    remember_me: bool = False


class EmailVerifyRequest(BaseModel):
    """Email verification request."""
    token: str


class ResendVerificationRequest(BaseModel):
    """Resend verification email request."""
    email: EmailStr


class IPCheckRequest(BaseModel):
    """IP check request (called before OAuth)."""
    device_id: Optional[str] = None


class IPCheckResponse(BaseModel):
    """IP check response."""
    allowed: bool
    reason: Optional[str] = None
    is_vpn: bool = False
    is_datacenter: bool = False


def get_client_ip(request: Request) -> str:
    """Get real client IP, handling proxies."""
    forwarded_for = request.headers.get("X-Forwarded-For")
    if forwarded_for:
        return forwarded_for.split(",")[0].strip()
    
    real_ip = request.headers.get("X-Real-IP")
    if real_ip:
        return real_ip.strip()
    
    return request.client.host if request.client else "unknown"


async def exchange_google_code(code: str, redirect_uri: str) -> dict:
    """Exchange Google authorization code for tokens and get user info."""
    import httpx
    
    try:
        async with httpx.AsyncClient() as client:
            # Step 1: Exchange code for tokens
            token_response = await client.post(
                "https://oauth2.googleapis.com/token",
                data={
                    "code": code,
                    "client_id": settings.GOOGLE_CLIENT_ID,
                    "client_secret": settings.GOOGLE_CLIENT_SECRET,
                    "redirect_uri": redirect_uri,
                    "grant_type": "authorization_code",
                }
            )
            
            if token_response.status_code != 200:
                logger.error(f"Token exchange failed: {token_response.text}")
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Failed to exchange authorization code"
                )
            
            tokens = token_response.json()
            access_token = tokens.get("access_token")
            
            # Step 2: Get user info using access token
            userinfo_response = await client.get(
                "https://www.googleapis.com/oauth2/v3/userinfo",
                headers={"Authorization": f"Bearer {access_token}"}
            )
            
            if userinfo_response.status_code != 200:
                logger.error(f"Userinfo request failed: {userinfo_response.text}")
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Failed to get user info from Google"
                )
            
            data = userinfo_response.json()
            
            return {
                "email": data["email"],
                "name": data.get("name", data["email"].split("@")[0]),
                "picture": data.get("picture"),
                "google_id": data["sub"],
                "email_verified": data.get("email_verified", False),
            }
            
    except httpx.HTTPError as e:
        logger.error(f"Google OAuth failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Failed to authenticate with Google"
        )


# ============ Anti-Abuse Endpoints ============

@router.get("/check-ip", response_model=IPCheckResponse)
async def check_ip(request: Request, db: DBSession, device_id: str = None):
    """
    Check if user's IP is allowed (not VPN/Proxy).
    Call this BEFORE showing Google OAuth button.
    
    IP addresses in 'login_allowed_ips' setting bypass VPN/Datacenter check.
    """
    client_ip = get_client_ip(request)
    
    # Check if IP is whitelisted (bypass VPN/Datacenter check)
    allowed_ips = await get_setting_json(db, "login_allowed_ips", [])
    allowed_ip_list = []
    for item in allowed_ips:
        if isinstance(item, str):
            allowed_ip_list.append(item)
        elif isinstance(item, dict) and 'ip' in item:
            allowed_ip_list.append(item['ip'])
    
    if client_ip in allowed_ip_list:
        logger.info(f"IP {client_ip} is whitelisted for login, bypassing VPN/Datacenter check")
        return IPCheckResponse(allowed=True)
    
    # Check VPN/Proxy
    ip_result = await ip_service.check_ip(client_ip)
    
    if not ip_result["allowed"]:
        return IPCheckResponse(
            allowed=False,
            reason=ip_result.get("reason", "VPN or Proxy detected. Please disconnect to continue."),
            is_vpn=ip_result.get("is_proxy", False),
            is_datacenter=ip_result.get("is_datacenter", False),
        )
    
    # Check device limit
    if device_id:
        device_allowed, _ = await rate_limit_service.check_device_limit(device_id)
        if not device_allowed:
            return IPCheckResponse(
                allowed=False,
                reason="Too many accounts from this device.",
            )
    
    # Check IP rate limit
    ip_allowed, _ = await rate_limit_service.check_signup_limit(client_ip)
    if not ip_allowed:
        return IPCheckResponse(
            allowed=False,
            reason="Too many signups from this IP today. Please try again tomorrow.",
        )
    
    return IPCheckResponse(allowed=True)


@router.post("/google", response_model=Token)
@limiter.limit(AUTH_RATE_LIMITS["google_auth"])
async def google_auth(request: Request, body: GoogleAuthRequest, db: DBSession):
    """
    Authenticate with Google OAuth.
    Creates new account if user doesn't exist.
    """
    client_ip = get_client_ip(request)
    
    # Check if IP is whitelisted (bypass VPN/Datacenter check)
    allowed_ips = await get_setting_json(db, "login_allowed_ips", [])
    allowed_ip_list = []
    for item in allowed_ips:
        if isinstance(item, str):
            allowed_ip_list.append(item)
        elif isinstance(item, dict) and 'ip' in item:
            allowed_ip_list.append(item['ip'])
    
    is_whitelisted = client_ip in allowed_ip_list
    
    # Initialize ip_result for later use (device fingerprinting)
    ip_result = {"allowed": True, "country": None, "city": None, "isp": None}
    
    # Step 1: Check VPN/Proxy (skip if whitelisted)
    if not is_whitelisted:
        ip_result = await ip_service.check_ip(client_ip)
        
        if not ip_result["allowed"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail={
                    "code": "VPN_DETECTED",
                    "message": ip_result.get("reason", "Please disconnect VPN/Proxy to continue."),
                }
            )
    else:
        logger.info(f"IP {client_ip} is whitelisted for Google login, bypassing VPN/Datacenter check")
    
    # Step 2: Exchange code for tokens and get user info
    google_user = await exchange_google_code(body.code, body.redirect_uri)
    
    # Step 3: Check if user exists
    result = await db.execute(
        select(User).where(User.email == google_user["email"].lower())
    )
    user = result.scalar_one_or_none()
    
    is_new_user = False
    
    if not user:
        # New user - check rate limits
        ip_allowed, _ = await rate_limit_service.check_signup_limit(client_ip)
        if not ip_allowed:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Too many signups from this IP today. Please try again tomorrow."
            )
        
        if body.device_id:
            device_allowed, _ = await rate_limit_service.check_device_limit(body.device_id)
            if not device_allowed:
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail="Too many accounts from this device."
                )
        
        # Create new user
        user = User(
            email=google_user["email"].lower(),
            name=google_user["name"],
            avatar_url=google_user.get("picture"),
            hashed_password="",  # No password for OAuth users
            is_verified=True,
            oauth_provider="google",
            oauth_id=google_user["google_id"],
            credit_balance=TRIAL_CREDITS,  # Trial credits
            signup_ip=client_ip,
            signup_device_id=body.device_id,
        )
        
        db.add(user)
        await db.flush()
        await db.refresh(user)
        
        is_new_user = True
        
        # Record for rate limiting
        await rate_limit_service.record_signup(client_ip)
        if body.device_id:
            await rate_limit_service.record_device_signup(body.device_id)
        
        # Log IP signup
        ip_log = IPSignupLog(
            ip_address=client_ip,
            user_id=user.id,
            country=ip_result.get("country"),
            city=ip_result.get("city"),
            isp=ip_result.get("isp"),
        )
        db.add(ip_log)
        
        logger.info(f"New user created via Google OAuth: {user.email}")
    
    else:
        # Existing user - update last login
        user.last_login_at = datetime.now(timezone.utc)
        if google_user.get("picture") and not user.avatar_url:
            user.avatar_url = google_user["picture"]
    
    # Track device fingerprint
    if body.device_id:
        # Parse user-agent for device info
        device_info = get_device_info_from_request(request)
        
        result = await db.execute(
            select(DeviceFingerprint).where(
                DeviceFingerprint.fingerprint_id == body.device_id,
                DeviceFingerprint.user_id == user.id,
            )
        )
        device = result.scalar_one_or_none()
        
        if device:
            device.last_seen = datetime.now(timezone.utc)
            device.login_count += 1
            device.ip_address = client_ip
            # Update device info on each login
            device.browser = device_info.get("browser") or device.browser
            device.browser_version = device_info.get("browser_version") or device.browser_version
            device.os = device_info.get("os") or device.os
            device.os_version = device_info.get("os_version") or device.os_version
            device.device_type = device_info.get("device_type") or device.device_type
        else:
            device = DeviceFingerprint(
                fingerprint_id=body.device_id,
                user_id=user.id,
                ip_address=client_ip,
                country=ip_result.get("country"),
                city=ip_result.get("city"),
                isp=ip_result.get("isp"),
                browser=device_info.get("browser"),
                browser_version=device_info.get("browser_version"),
                os=device_info.get("os"),
                os_version=device_info.get("os_version"),
                device_type=device_info.get("device_type"),
            )
            db.add(device)
            
            # Check multi-account abuse
            result = await db.execute(
                select(func.count(func.distinct(DeviceFingerprint.user_id))).where(
                    DeviceFingerprint.fingerprint_id == body.device_id
                )
            )
            device_user_count = result.scalar() or 0
            
            if device_user_count >= 2:
                user.is_suspicious = True
                device.is_suspicious = True
                device.suspicious_reason = f"Device has {device_user_count + 1} accounts"
                logger.warning(f"Suspicious device: {body.device_id[:8]}...")
    
    await db.commit()
    
    # Generate tokens
    access_token = create_access_token(subject=str(user.id))
    refresh_token = create_refresh_token(subject=str(user.id))
    
    return Token(
        access_token=access_token,
        refresh_token=refresh_token,
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        user=UserResponse.model_validate(user),
    )


# ============ Logout Endpoint ============

@router.post("/logout", status_code=status.HTTP_200_OK)
async def logout():
    """
    Logout user.
    
    Note: JWT tokens are stateless, so this endpoint is primarily for
    frontend to clear tokens. In future, could add token blacklisting.
    """
    return {"message": "Logged out successfully"}


# ============ Token Refresh ============

@router.post("/refresh", response_model=Token)
@limiter.limit(AUTH_RATE_LIMITS["refresh"])
async def refresh_token(request: Request, token_data: TokenRefresh, db: DBSession):
    """
    Refresh access token using refresh token.
    
    - **refresh_token**: Valid refresh token
    """
    # Verify refresh token
    payload = verify_token(token_data.refresh_token, token_type="refresh")
    
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token",
        )
    
    # Get user
    result = await db.execute(
        select(User).where(User.id == payload.sub)
    )
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is deactivated",
        )
    
    # Generate new tokens
    access_token = create_access_token(subject=str(user.id))
    new_refresh_token = create_refresh_token(subject=str(user.id))
    
    return Token(
        access_token=access_token,
        refresh_token=new_refresh_token,
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        user=UserResponse.model_validate(user),
    )


# ============ Email/Password Signup ============

@router.post("/signup", response_model=dict)
@limiter.limit(AUTH_RATE_LIMITS["signup"])
async def email_signup(request: Request, body: EmailSignupRequest, db: DBSession):
    """
    Sign up with email and password.
    
    - Only Gmail, Yahoo, Outlook, Hotmail, Live domains are allowed.
    - Verification email will be sent.
    - Account must be verified before use.
    """
    client_ip = get_client_ip(request)
    
    # Step 1: Check VPN/Proxy
    ip_result = await ip_service.check_ip(client_ip)
    
    if not ip_result["allowed"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={
                "code": "VPN_DETECTED",
                "message": ip_result.get("reason", "Please disconnect VPN/Proxy to continue."),
            }
        )
    
    # Step 2: Check if email already exists
    result = await db.execute(
        select(User).where(User.email == body.email.lower())
    )
    existing_user = result.scalar_one_or_none()
    
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email already exists. Please login instead.",
        )
    
    # Step 3: Check rate limits
    ip_allowed, _ = await rate_limit_service.check_signup_limit(client_ip)
    if not ip_allowed:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many signups from this IP today. Please try again tomorrow.",
        )
    
    if body.device_id:
        device_allowed, _ = await rate_limit_service.check_device_limit(body.device_id)
        if not device_allowed:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Too many accounts from this device.",
            )
    
    # Step 4: Create user (unverified)
    verification_token = secrets.token_urlsafe(32)
    verification_expires = datetime.now(timezone.utc) + timedelta(hours=24)
    
    user = User(
        email=body.email.lower(),
        name=body.name,
        hashed_password=get_password_hash(body.password),
        is_verified=False,
        oauth_provider=None,
        oauth_id=None,
        credit_balance=0,  # Credits given after verification
        signup_ip=client_ip,
        signup_device_id=body.device_id,
        verification_token=verification_token,
        verification_expires=verification_expires,
    )
    
    db.add(user)
    await db.flush()
    await db.refresh(user)
    
    # Record for rate limiting
    await rate_limit_service.record_signup(client_ip)
    if body.device_id:
        await rate_limit_service.record_device_signup(body.device_id)
    
    # Log IP signup
    ip_log = IPSignupLog(
        ip_address=client_ip,
        user_id=user.id,
        country=ip_result.get("country"),
        city=ip_result.get("city"),
        isp=ip_result.get("isp"),
    )
    db.add(ip_log)
    
    await db.commit()
    
    # Step 5: Send verification email
    try:
        await email_service.send_verification_email(
            to=user.email,
            name=user.name,
            token=verification_token,
        )
    except Exception as e:
        logger.error(f"Failed to send verification email: {e}")
        # Don't fail signup if email fails
    
    logger.info(f"New user signed up: {user.email}")
    
    return {
        "message": "Account created successfully! Please check your email to verify your account.",
        "email": user.email,
    }


# ============ Email/Password Login ============

@router.post("/login", response_model=Token)
@limiter.limit(AUTH_RATE_LIMITS["login"])
async def email_login(request: Request, body: EmailLoginRequest, db: DBSession):
    """
    Login with email and password.
    
    - **email**: User's email
    - **password**: User's password
    - **remember_me**: If true, generates longer-lived refresh token
    """
    client_ip = get_client_ip(request)
    
    # Check if IP is whitelisted (bypass VPN/Datacenter check)
    allowed_ips = await get_setting_json(db, "login_allowed_ips", [])
    allowed_ip_list = []
    for item in allowed_ips:
        if isinstance(item, str):
            allowed_ip_list.append(item)
        elif isinstance(item, dict) and 'ip' in item:
            allowed_ip_list.append(item['ip'])
    
    is_whitelisted = client_ip in allowed_ip_list
    
    # Initialize ip_result for later use (device fingerprinting)
    ip_result = {"allowed": True, "country": None, "city": None, "isp": None}
    
    # Step 1: Check VPN/Proxy (skip if whitelisted)
    if not is_whitelisted:
        ip_result = await ip_service.check_ip(client_ip)
        
        if not ip_result["allowed"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail={
                    "code": "VPN_DETECTED",
                    "message": ip_result.get("reason", "Please disconnect VPN/Proxy to continue."),
                }
            )
    else:
        logger.info(f"IP {client_ip} is whitelisted for login, bypassing VPN/Datacenter check")
    
    # Step 2: Find user
    result = await db.execute(
        select(User).where(User.email == body.email.lower())
    )
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
        )
    
    # Step 3: Verify password
    if not user.hashed_password or not verify_password(body.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
        )
    
    # Step 4: Check if verified
    if not user.is_verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={
                "code": "EMAIL_NOT_VERIFIED",
                "message": "Please verify your email before logging in. Check your inbox for the verification link.",
            }
        )
    
    # Step 5: Check if active
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your account has been deactivated. Please contact support.",
        )
    
    # Step 6: Update last login
    user.last_login_at = datetime.now(timezone.utc)
    
    # Step 7: Handle remember me
    if body.remember_me:
        remember_token = secrets.token_urlsafe(32)
        user.remember_token = remember_token
        user.remember_expires = datetime.now(timezone.utc) + timedelta(days=30)
    
    # Track device fingerprint
    if body.device_id:
        # Parse user-agent for device info
        device_info = get_device_info_from_request(request)
        
        result = await db.execute(
            select(DeviceFingerprint).where(
                DeviceFingerprint.fingerprint_id == body.device_id,
                DeviceFingerprint.user_id == user.id,
            )
        )
        device = result.scalar_one_or_none()
        
        if device:
            device.last_seen = datetime.now(timezone.utc)
            device.login_count += 1
            device.ip_address = client_ip
            # Update device info on each login
            device.browser = device_info.get("browser") or device.browser
            device.browser_version = device_info.get("browser_version") or device.browser_version
            device.os = device_info.get("os") or device.os
            device.os_version = device_info.get("os_version") or device.os_version
            device.device_type = device_info.get("device_type") or device.device_type
        else:
            device = DeviceFingerprint(
                fingerprint_id=body.device_id,
                user_id=user.id,
                ip_address=client_ip,
                country=ip_result.get("country"),
                city=ip_result.get("city"),
                isp=ip_result.get("isp"),
                browser=device_info.get("browser"),
                browser_version=device_info.get("browser_version"),
                os=device_info.get("os"),
                os_version=device_info.get("os_version"),
                device_type=device_info.get("device_type"),
            )
            db.add(device)
    
    await db.commit()
    
    # Generate tokens
    access_token = create_access_token(subject=str(user.id))
    
    # Longer refresh token for remember me
    if body.remember_me:
        refresh_token = create_refresh_token(
            subject=str(user.id),
            expires_delta=timedelta(days=30)
        )
    else:
        refresh_token = create_refresh_token(subject=str(user.id))
    
    return Token(
        access_token=access_token,
        refresh_token=refresh_token,
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        user=UserResponse.model_validate(user),
    )


# ============ Email Verification ============

@router.post("/verify-email", response_model=Token)
async def verify_email(body: EmailVerifyRequest, db: DBSession):
    """
    Verify email address using token from email.
    
    - **token**: Verification token from email link
    """
    # Find user by token
    result = await db.execute(
        select(User).where(User.verification_token == body.token)
    )
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid verification token.",
        )
    
    # Check if already verified
    if user.is_verified:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already verified. Please login.",
        )
    
    # Check if token expired
    if user.verification_expires and datetime.now(timezone.utc) > user.verification_expires:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Verification link has expired. Please request a new one.",
        )
    
    # Verify user and give trial credits
    user.is_verified = True
    user.verification_token = None
    user.verification_expires = None
    user.credit_balance = TRIAL_CREDITS
    
    await db.commit()
    
    logger.info(f"User verified: {user.email}")
    
    # Generate tokens and auto-login
    access_token = create_access_token(subject=str(user.id))
    refresh_token = create_refresh_token(subject=str(user.id))
    
    return Token(
        access_token=access_token,
        refresh_token=refresh_token,
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        user=UserResponse.model_validate(user),
    )


# ============ Resend Verification Email ============

@router.post("/resend-verification", response_model=dict)
async def resend_verification(body: ResendVerificationRequest, db: DBSession):
    """
    Resend verification email.
    
    - **email**: User's email address
    """
    # Find user
    result = await db.execute(
        select(User).where(User.email == body.email.lower())
    )
    user = result.scalar_one_or_none()
    
    if not user:
        # Don't reveal if email exists
        return {"message": "If the email exists, a verification link has been sent."}
    
    if user.is_verified:
        return {"message": "Email already verified. Please login."}
    
    # Generate new token
    verification_token = secrets.token_urlsafe(32)
    user.verification_token = verification_token
    user.verification_expires = datetime.now(timezone.utc) + timedelta(hours=24)
    
    await db.commit()
    
    # Send email
    try:
        await email_service.send_verification_email(
            to=user.email,
            name=user.name,
            token=verification_token,
        )
    except Exception as e:
        logger.error(f"Failed to send verification email: {e}")
    
    return {"message": "If the email exists, a verification link has been sent."}


# ============ Get Allowed Email Domains ============

@router.get("/allowed-domains", response_model=list)
async def get_allowed_domains():
    """
    Get list of allowed email domains for signup.
    """
    return ALLOWED_EMAIL_DOMAINS
