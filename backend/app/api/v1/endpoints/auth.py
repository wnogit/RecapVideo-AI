"""
Authentication Endpoints with Anti-Abuse Protection

Supports:
- Google OAuth (primary)
- VPN/Proxy detection
- Device fingerprinting
- IP rate limiting
"""
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, HTTPException, status, Request
from sqlalchemy import select, func
from pydantic import BaseModel
from loguru import logger

from app.core.config import settings
from app.core.dependencies import DBSession
from app.core.security import (
    create_access_token,
    create_refresh_token,
    get_password_hash,
    verify_password,
    verify_token,
    generate_password_reset_token,
    verify_password_reset_token,
)
from app.models.user import User
from app.models.device import DeviceFingerprint, IPSignupLog
from app.services.ip_service import ip_service
from app.services.rate_limit_service import rate_limit_service
from app.schemas.user import (
    UserCreate,
    UserLogin,
    UserResponse,
    Token,
    TokenRefresh,
    PasswordReset,
    PasswordResetConfirm,
)


router = APIRouter()


# ============ Additional Schemas ============

class GoogleAuthRequest(BaseModel):
    """Google OAuth login/signup request."""
    code: str  # Google authorization code
    redirect_uri: str  # The redirect URI used
    device_id: Optional[str] = None  # FingerprintJS visitor ID


class IPCheckRequest(BaseModel):
    """IP check request (called before OAuth)."""
    device_id: Optional[str] = None


class IPCheckResponse(BaseModel):
    """IP check response."""
    allowed: bool
    reason: Optional[str] = None
    is_vpn: bool = False
    is_datacenter: bool = False


# ============ Helper Functions ============

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
async def check_ip(request: Request, device_id: str = None):
    """
    Check if user's IP is allowed (not VPN/Proxy).
    Call this BEFORE showing Google OAuth button.
    """
    client_ip = get_client_ip(request)
    
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
async def google_auth(request: Request, body: GoogleAuthRequest, db: DBSession):
    """
    Authenticate with Google OAuth.
    Creates new account if user doesn't exist.
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
            credit_balance=3,  # Trial credits
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
        else:
            device = DeviceFingerprint(
                fingerprint_id=body.device_id,
                user_id=user.id,
                ip_address=client_ip,
                country=ip_result.get("country"),
                city=ip_result.get("city"),
                isp=ip_result.get("isp"),
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


# ============ Legacy Endpoints (Keep for compatibility) ============


@router.post("/signup", response_model=Token, status_code=status.HTTP_201_CREATED)
async def signup(user_data: UserCreate, db: DBSession):
    """
    Create a new user account.
    
    - **email**: Valid email address (unique)
    - **name**: User's display name
    - **password**: Strong password (min 8 chars, 1 uppercase, 1 lowercase, 1 digit)
    """
    # Check if email already exists
    result = await db.execute(
        select(User).where(User.email == user_data.email.lower())
    )
    if result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )
    
    # Create user
    user = User(
        email=user_data.email.lower(),
        name=user_data.name,
        hashed_password=get_password_hash(user_data.password),
        credit_balance=3,  # Welcome bonus credits
    )
    
    db.add(user)
    await db.flush()
    await db.refresh(user)
    
    # Generate tokens
    access_token = create_access_token(subject=str(user.id))
    refresh_token = create_refresh_token(subject=str(user.id))
    
    return Token(
        access_token=access_token,
        refresh_token=refresh_token,
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        user=UserResponse.model_validate(user),
    )


@router.post("/login", response_model=Token)
async def login(credentials: UserLogin, db: DBSession):
    """
    Authenticate user and return tokens.
    
    - **email**: Registered email address
    - **password**: User's password
    """
    # Find user
    result = await db.execute(
        select(User).where(User.email == credentials.email.lower())
    )
    user = result.scalar_one_or_none()
    
    if not user or not verify_password(credentials.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is deactivated",
        )
    
    # Update last login
    user.last_login_at = datetime.now(timezone.utc)
    await db.flush()
    
    # Generate tokens
    access_token = create_access_token(subject=str(user.id))
    refresh_token = create_refresh_token(subject=str(user.id))
    
    return Token(
        access_token=access_token,
        refresh_token=refresh_token,
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        user=UserResponse.model_validate(user),
    )


@router.post("/refresh", response_model=Token)
async def refresh_token(token_data: TokenRefresh, db: DBSession):
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


@router.post("/forgot-password", status_code=status.HTTP_200_OK)
async def forgot_password(data: PasswordReset, db: DBSession):
    """
    Request password reset email.
    
    - **email**: Registered email address
    """
    # Find user
    result = await db.execute(
        select(User).where(User.email == data.email.lower())
    )
    user = result.scalar_one_or_none()
    
    # Always return success to prevent email enumeration
    if user:
        # Generate reset token
        reset_token = generate_password_reset_token(user.email)
        
        # TODO: Send email with reset token
        # await send_password_reset_email(user.email, reset_token)
    
    return {"message": "If the email exists, a password reset link will be sent"}


@router.post("/reset-password", status_code=status.HTTP_200_OK)
async def reset_password(data: PasswordResetConfirm, db: DBSession):
    """
    Reset password using reset token.
    
    - **token**: Password reset token from email
    - **new_password**: New strong password
    """
    # Verify token
    email = verify_password_reset_token(data.token)
    
    if not email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired reset token",
        )
    
    # Find user
    result = await db.execute(
        select(User).where(User.email == email.lower())
    )
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User not found",
        )
    
    # Update password
    user.hashed_password = get_password_hash(data.new_password)
    await db.flush()
    
    return {"message": "Password has been reset successfully"}
