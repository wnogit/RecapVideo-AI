"""
API Key Schemas
"""
from datetime import datetime
from typing import Optional, List
from uuid import UUID

from pydantic import BaseModel, Field


class APIKeyCreate(BaseModel):
    """Schema for creating an API key."""
    key_type: str = Field(..., description="Type of API key (transcript_api, gemini, etc.)")
    name: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = None
    key_value: str = Field(..., min_length=1, description="The actual API key")
    config: Optional[str] = Field(None, description="JSON config (base_url, etc.)")
    is_active: bool = True
    is_primary: bool = False
    priority: int = Field(100, ge=1, le=999, description="Priority order (1=highest)")
    model: Optional[str] = Field(None, max_length=100, description="AI model name (e.g., google/gemini-2.5-flash)")


class APIKeyUpdate(BaseModel):
    """Schema for updating an API key."""
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    description: Optional[str] = None
    key_value: Optional[str] = Field(None, min_length=1)
    config: Optional[str] = None
    is_active: Optional[bool] = None
    is_primary: Optional[bool] = None
    priority: Optional[int] = Field(None, ge=1, le=999)
    model: Optional[str] = Field(None, max_length=100)


class APIKeyResponse(BaseModel):
    """Schema for API key response (masked value)."""
    id: UUID
    key_type: str
    name: str
    description: Optional[str] = None
    masked_value: str  # Only show masked version
    config: Optional[str] = None
    is_active: bool
    is_primary: bool
    priority: int = 100
    model: Optional[str] = None
    last_used_at: Optional[datetime] = None
    usage_count: int
    created_at: datetime
    updated_at: datetime
    
    model_config = {"from_attributes": True}


class APIKeyFullResponse(APIKeyResponse):
    """Schema for API key with full value (only for specific admin actions)."""
    key_value: str


class APIKeyListResponse(BaseModel):
    """Schema for paginated API key list."""
    keys: List[APIKeyResponse]
    total: int


class APIKeyTypeInfo(BaseModel):
    """Schema for API key type information."""
    key_type: str
    name: str
    description: str
    required: bool
    has_key: bool
    is_active: bool


# Predefined API key types with descriptions
API_KEY_TYPES = [
    {
        "key_type": "deepinfra",
        "name": "DeepInfra (Gemini 2.5 Flash)",
        "description": "PRIMARY AI - Gemini 2.5 Flash thinking model for best Burmese scripts",
        "required": True,
    },
    {
        "key_type": "poe",
        "name": "Poe API (Claude FREE)",
        "description": "FREE Claude 3.5 Sonnet access via Poe - Backup AI",
        "required": False,
    },
    {
        "key_type": "openrouter",
        "name": "OpenRouter",
        "description": "Pay-as-you-go AI API - Access to DeepSeek, Claude, GPT models",
        "required": False,
    },
    {
        "key_type": "groq",
        "name": "Groq (Llama 3.3)",
        "description": "FREE Llama 3.3 70B - Fast AI (English only, not for Burmese)",
        "required": False,
    },
    {
        "key_type": "gemini",
        "name": "Google Gemini Direct",
        "description": "AI script generation - Final Fallback",
        "required": False,
    },
    {
        "key_type": "transcript_api",
        "name": "TranscriptAPI.com",
        "description": "YouTube transcript extraction service",
        "required": True,
    },
    {
        "key_type": "resend",
        "name": "Resend",
        "description": "Email sending service",
        "required": True,
    },
    {
        "key_type": "r2_access_key",
        "name": "Cloudflare R2 Access Key",
        "description": "R2 storage access key ID",
        "required": True,
    },
    {
        "key_type": "r2_secret_key",
        "name": "Cloudflare R2 Secret Key",
        "description": "R2 storage secret access key",
        "required": True,
    },
]
