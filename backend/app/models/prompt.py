"""
Prompt Model for AI Prompts Management
"""
import uuid
from datetime import datetime
from enum import Enum
from typing import Optional

from sqlalchemy import Boolean, DateTime, Integer, String, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class PromptCategory(str, Enum):
    """Prompt categories."""
    SCRIPT = "script"
    TRANSLATION = "translation"
    SUMMARY = "summary"
    TTS = "tts"
    OTHER = "other"


class Prompt(Base):
    """Prompt model for managing AI prompts."""
    
    __tablename__ = "prompts"
    
    # Primary key
    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    
    # Prompt info
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    key: Mapped[str] = mapped_column(String(100), unique=True, nullable=False, index=True)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    
    # Category
    category: Mapped[str] = mapped_column(
        String(50),
        default=PromptCategory.OTHER.value,
        index=True,
    )
    
    # Status
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, index=True)
    
    # Version tracking
    version: Mapped[int] = mapped_column(Integer, default=1)
    
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
        return f"<Prompt(id={self.id}, key={self.key}, category={self.category})>"
