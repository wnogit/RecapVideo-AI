"""
Cookie Utilities for Secure Token Storage

HttpOnly cookies ကို အသုံးပြုပြီး XSS attacks ကနေ tokens ကို ကာကွယ်ပါတယ်။

Features:
- HttpOnly: JavaScript access မရ
- Secure: HTTPS only
- SameSite: CSRF protection
- Domain: Subdomain sharing
"""
from datetime import timedelta
from typing import Optional

from fastapi import Response
from loguru import logger

from app.core.config import settings


def set_auth_cookies(
    response: Response,
    access_token: str,
    refresh_token: str,
    access_expires_minutes: Optional[int] = None,
    refresh_expires_days: Optional[int] = None,
) -> None:
    """
    Set authentication tokens as HttpOnly cookies.
    
    Args:
        response: FastAPI Response object
        access_token: JWT access token
        refresh_token: JWT refresh token
        access_expires_minutes: Optional custom expiry for access token
        refresh_expires_days: Optional custom expiry for refresh token
    """
    access_max_age = (access_expires_minutes or settings.ACCESS_TOKEN_EXPIRE_MINUTES) * 60
    refresh_max_age = (refresh_expires_days or settings.REFRESH_TOKEN_EXPIRE_DAYS) * 24 * 60 * 60
    
    # Determine cookie settings based on environment
    is_production = settings.ENVIRONMENT == "production"
    domain = settings.COOKIE_DOMAIN if is_production else None
    secure = settings.COOKIE_SECURE if is_production else False
    samesite = settings.COOKIE_SAMESITE
    
    # Set access token cookie
    response.set_cookie(
        key="access_token",
        value=access_token,
        max_age=access_max_age,
        expires=access_max_age,
        httponly=True,
        secure=secure,
        samesite=samesite,
        domain=domain,
        path="/",
    )
    
    # Set refresh token cookie
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        max_age=refresh_max_age,
        expires=refresh_max_age,
        httponly=True,
        secure=secure,
        samesite=samesite,
        domain=domain,
        path="/api/v1/auth",  # Only sent to auth endpoints
    )
    
    logger.debug(f"Set auth cookies (secure={secure}, domain={domain})")


def clear_auth_cookies(response: Response) -> None:
    """
    Clear authentication cookies on logout.
    """
    is_production = settings.ENVIRONMENT == "production"
    domain = settings.COOKIE_DOMAIN if is_production else None
    
    # Clear access token
    response.delete_cookie(
        key="access_token",
        domain=domain,
        path="/",
    )
    
    # Clear refresh token
    response.delete_cookie(
        key="refresh_token",
        domain=domain,
        path="/api/v1/auth",
    )
    
    logger.debug("Cleared auth cookies")


def get_cookie_from_request(request, cookie_name: str) -> Optional[str]:
    """
    Get cookie value from request.
    
    Args:
        request: FastAPI Request object
        cookie_name: Name of the cookie
        
    Returns:
        Cookie value or None
    """
    return request.cookies.get(cookie_name)
