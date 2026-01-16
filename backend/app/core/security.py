"""
Security utilities for JWT and password hashing

Includes:
- JWT token creation with JTI (for blacklisting)
- Token blacklist checking
- Password hashing
- Token rotation support
"""
import uuid
from datetime import datetime, timedelta, timezone
from typing import Any, Optional

import jwt
from jwt.exceptions import PyJWTError
from passlib.context import CryptContext
from pydantic import BaseModel

from app.core.config import settings


# Password hashing context
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


class TokenPayload(BaseModel):
    """JWT Token payload schema."""
    sub: str
    type: str
    exp: datetime
    iat: datetime
    jti: str  # JWT ID for blacklisting
    family_id: Optional[str] = None  # For refresh token family tracking


def generate_jti() -> str:
    """Generate unique JWT ID."""
    return str(uuid.uuid4())


def create_access_token(
    subject: str | Any,
    expires_delta: Optional[timedelta] = None,
    jti: Optional[str] = None,
) -> tuple[str, str]:
    """
    Create JWT access token.
    
    Returns: (token, jti) tuple
    """
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(
            minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
        )
    
    token_jti = jti or generate_jti()
    
    to_encode = {
        "sub": str(subject),
        "type": "access",
        "exp": expire,
        "iat": datetime.now(timezone.utc),
        "jti": token_jti,
    }
    
    token = jwt.encode(
        to_encode,
        settings.JWT_SECRET_KEY,
        algorithm=settings.JWT_ALGORITHM
    )
    
    return token, token_jti


def create_refresh_token(
    subject: str | Any,
    expires_delta: Optional[timedelta] = None,
    jti: Optional[str] = None,
    family_id: Optional[str] = None,
) -> tuple[str, str, str]:
    """
    Create JWT refresh token with family tracking.
    
    Returns: (token, jti, family_id) tuple
    """
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(
            days=settings.REFRESH_TOKEN_EXPIRE_DAYS
        )
    
    token_jti = jti or generate_jti()
    token_family_id = family_id or generate_jti()
    
    to_encode = {
        "sub": str(subject),
        "type": "refresh",
        "exp": expire,
        "iat": datetime.now(timezone.utc),
        "jti": token_jti,
        "family_id": token_family_id,
    }
    
    token = jwt.encode(
        to_encode,
        settings.JWT_SECRET_KEY,
        algorithm=settings.JWT_ALGORITHM
    )
    
    return token, token_jti, token_family_id


# Legacy functions for backward compatibility (return just token string)
def create_access_token_simple(
    subject: str | Any,
    expires_delta: Optional[timedelta] = None,
) -> str:
    """Create JWT access token (legacy - returns token only)."""
    token, _ = create_access_token(subject, expires_delta)
    return token


def create_refresh_token_simple(
    subject: str | Any,
    expires_delta: Optional[timedelta] = None,
) -> str:
    """Create JWT refresh token (legacy - returns token only)."""
    token, _, _ = create_refresh_token(subject, expires_delta)
    return token


def verify_token(token: str, token_type: str = "access") -> Optional[TokenPayload]:
    """Verify JWT token and return payload."""
    try:
        payload = jwt.decode(
            token,
            settings.JWT_SECRET_KEY,
            algorithms=[settings.JWT_ALGORITHM]
        )
        
        # Verify token type
        if payload.get("type") != token_type:
            return None
        
        return TokenPayload(
            sub=payload["sub"],
            type=payload["type"],
            exp=datetime.fromtimestamp(payload["exp"], tz=timezone.utc),
            iat=datetime.fromtimestamp(payload["iat"], tz=timezone.utc),
            jti=payload.get("jti", ""),  # Handle tokens without JTI (legacy)
            family_id=payload.get("family_id"),
        )
    except PyJWTError:
        return None


def get_token_expiry(token: str) -> Optional[datetime]:
    """Get token expiry time without full verification."""
    try:
        payload = jwt.decode(
            token,
            settings.JWT_SECRET_KEY,
            algorithms=[settings.JWT_ALGORITHM],
            options={"verify_exp": False}  # Don't fail on expired
        )
        return datetime.fromtimestamp(payload["exp"], tz=timezone.utc)
    except PyJWTError:
        return None


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash."""
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    """Hash a password."""
    return pwd_context.hash(password)


def generate_password_reset_token(email: str) -> str:
    """Generate password reset token (expires in 1 hour)."""
    expire = datetime.now(timezone.utc) + timedelta(hours=1)
    to_encode = {
        "sub": email,
        "type": "password_reset",
        "exp": expire,
    }
    return jwt.encode(
        to_encode,
        settings.JWT_SECRET_KEY,
        algorithm=settings.JWT_ALGORITHM
    )


def verify_password_reset_token(token: str) -> Optional[str]:
    """Verify password reset token and return email."""
    try:
        payload = jwt.decode(
            token,
            settings.JWT_SECRET_KEY,
            algorithms=[settings.JWT_ALGORITHM]
        )
        if payload.get("type") != "password_reset":
            return None
        return payload.get("sub")
    except PyJWTError:
        return None
