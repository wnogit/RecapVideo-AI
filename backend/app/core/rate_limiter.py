"""
Rate Limiter Configuration using SlowAPI

Provides rate limiting for authentication endpoints to prevent:
- Brute force attacks
- Credential stuffing
- API abuse
"""
from slowapi import Limiter
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from fastapi import Request
from fastapi.responses import JSONResponse
from loguru import logger


def get_client_ip(request: Request) -> str:
    """
    Get client IP from request, checking X-Forwarded-For header first.
    """
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


# Initialize limiter with IP-based key
limiter = Limiter(key_func=get_client_ip)


async def rate_limit_exceeded_handler(request: Request, exc: RateLimitExceeded) -> JSONResponse:
    """
    Custom handler for rate limit exceeded errors.
    Returns consistent error format.
    """
    client_ip = get_client_ip(request)
    logger.warning(f"Rate limit exceeded for IP {client_ip}: {exc.detail}")
    
    return JSONResponse(
        status_code=429,
        content={
            "code": "RATE_LIMIT_EXCEEDED",
            "message": "Too many requests. Please try again later.",
            "detail": str(exc.detail),
            "retry_after": getattr(exc, "retry_after", 60),
        }
    )


# Rate limit configurations
AUTH_RATE_LIMITS = {
    "login": "5/minute",           # 5 login attempts per minute
    "signup": "3/minute",          # 3 signups per minute
    "password_reset": "3/minute",  # 3 password reset requests per minute
    "verify_email": "5/minute",    # 5 verify email requests per minute
    "refresh": "10/minute",        # 10 token refreshes per minute
    "google_auth": "10/minute",    # 10 Google OAuth attempts per minute
}
