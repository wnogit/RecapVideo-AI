"""
Standard Error Response Schema

Provides consistent error response format across all API endpoints.
"""
from typing import Optional, Dict, Any
from pydantic import BaseModel


class ErrorDetail(BaseModel):
    """Standard error response detail."""
    code: str
    message: str
    details: Optional[Dict[str, Any]] = None


class APIError(Exception):
    """Custom API Error for consistent error handling."""
    
    def __init__(
        self,
        code: str,
        message: str,
        status_code: int = 400,
        details: Optional[Dict[str, Any]] = None,
    ):
        self.code = code
        self.message = message
        self.status_code = status_code
        self.details = details
        super().__init__(message)
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for JSON response."""
        result: Dict[str, Any] = {
            "code": self.code,
            "message": self.message,
        }
        if self.details:
            result["details"] = self.details
        return result


# Common error codes
class ErrorCodes:
    """Standard error codes used across the API."""
    
    # Authentication errors (401, 403)
    INVALID_CREDENTIALS = "INVALID_CREDENTIALS"
    UNAUTHORIZED = "UNAUTHORIZED"
    TOKEN_EXPIRED = "TOKEN_EXPIRED"
    TOKEN_INVALID = "TOKEN_INVALID"
    EMAIL_NOT_VERIFIED = "EMAIL_NOT_VERIFIED"
    ACCOUNT_DEACTIVATED = "ACCOUNT_DEACTIVATED"
    
    # Rate limiting errors (429)
    RATE_LIMIT_EXCEEDED = "RATE_LIMIT_EXCEEDED"
    TOO_MANY_SIGNUPS = "TOO_MANY_SIGNUPS"
    TOO_MANY_DEVICES = "TOO_MANY_DEVICES"
    
    # VPN/Security errors (403)
    VPN_DETECTED = "VPN_DETECTED"
    PROXY_DETECTED = "PROXY_DETECTED"
    DATACENTER_IP = "DATACENTER_IP"
    
    # Validation errors (400)
    INVALID_URL = "INVALID_URL"
    INVALID_EMAIL = "INVALID_EMAIL"
    INVALID_EMAIL_DOMAIN = "INVALID_EMAIL_DOMAIN"
    WEAK_PASSWORD = "WEAK_PASSWORD"
    
    # Resource errors (404, 409, 402)
    NOT_FOUND = "NOT_FOUND"
    DUPLICATE_VIDEO = "DUPLICATE_VIDEO"
    DUPLICATE_EMAIL = "DUPLICATE_EMAIL"
    INSUFFICIENT_CREDITS = "INSUFFICIENT_CREDITS"
    
    # Video processing errors
    VIDEO_TOO_LONG = "VIDEO_TOO_LONG"
    TRANSCRIPT_FAILED = "TRANSCRIPT_FAILED"
    PROCESSING_FAILED = "PROCESSING_FAILED"
    UPLOAD_FAILED = "UPLOAD_FAILED"
    
    # Server errors (500)
    INTERNAL_ERROR = "INTERNAL_ERROR"
    SERVICE_UNAVAILABLE = "SERVICE_UNAVAILABLE"
    DATABASE_ERROR = "DATABASE_ERROR"


# Common error messages (Burmese + English)
ERROR_MESSAGES = {
    ErrorCodes.INVALID_CREDENTIALS: "အီးမေးလ် သို့မဟုတ် စကားဝှက် မှားနေပါတယ်။",
    ErrorCodes.TOKEN_EXPIRED: "Session သက်တမ်းကုန်သွားပါပြီ။ ကျေးဇူးပြု၍ ပြန်လည် Login ဝင်ပါ။",
    ErrorCodes.EMAIL_NOT_VERIFIED: "အီးမေးလ် အတည်ပြုချက် မပြီးသေးပါ။ Inbox ကို စစ်ဆေးပါ။",
    ErrorCodes.VPN_DETECTED: "VPN/Proxy ကို ပိတ်ပြီးမှ ဆက်လက်လုပ်ဆောင်ပါ။",
    ErrorCodes.INSUFFICIENT_CREDITS: "Credit မလုံလောက်ပါ။ ကျေးဇူးပြု၍ Credit ဝယ်ယူပါ။",
    ErrorCodes.VIDEO_TOO_LONG: "Video သည် သတ်မှတ်ထားသော အချိန်ထက် ပိုရှည်နေပါတယ်။",
    ErrorCodes.RATE_LIMIT_EXCEEDED: "တောင်းဆိုမှုများလွန်းပါတယ်။ ခဏစောင့်ပြီး ပြန်လည်ကြိုးစားပါ။",
}
