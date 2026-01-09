"""
API Key Model - Store external API keys in database for admin management
"""
import uuid
from datetime import datetime
from enum import Enum
from typing import Optional

from sqlalchemy import Boolean, DateTime, String, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class APIKeyType(str, Enum):
    """Types of API keys stored in the system."""
    TRANSCRIPT_API = "transcript_api"       # TranscriptAPI.com
    GEMINI = "gemini"                       # Google Gemini
    RESEND = "resend"                       # Resend Email
    R2_ACCESS_KEY = "r2_access_key"         # Cloudflare R2 Access Key
    R2_SECRET_KEY = "r2_secret_key"         # Cloudflare R2 Secret Key
    TELEGRAM_BOT = "telegram_bot"           # Telegram Bot Token
    CUSTOM = "custom"                       # Custom/Other keys


class APIKey(Base):
    """API Key model for storing external service credentials."""
    
    __tablename__ = "api_keys"
    
    # Primary key
    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    
    # Key identification
    key_type: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        index=True,
    )
    name: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
    )
    description: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )
    
    # The actual API key (encrypted in production)
    key_value: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )
    
    # Additional config (JSON as text, e.g., base URLs, regions)
    config: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )
    
    # Status
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    is_primary: Mapped[bool] = mapped_column(Boolean, default=False)  # Primary key for this type
    
    # Usage tracking
    last_used_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )
    usage_count: Mapped[int] = mapped_column(default=0)
    
    # Timestamps
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
    )
    
    def __repr__(self) -> str:
        return f"<APIKey {self.key_type}: {self.name}>"
    
    @property
    def masked_value(self) -> str:
        """Return masked version of the key for display."""
        if len(self.key_value) <= 8:
            return "****"
        return f"{self.key_value[:4]}...{self.key_value[-4:]}"
