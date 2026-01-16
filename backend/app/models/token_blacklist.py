"""
Token Blacklist Model - For secure logout and token revocation

ဒီ model က logout လုပ်တဲ့အခါ token ကို blacklist ထဲထည့်ပြီး
နောက်ထပ် အသုံးပြုမှု ကို block လုပ်ပေးပါတယ်။
"""
import uuid
from datetime import datetime, timezone

from sqlalchemy import DateTime, String, Text, func, Index
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class TokenBlacklist(Base):
    """
    Blacklisted tokens table.
    
    Token logout/revoke လုပ်တဲ့အခါ ဒီ table ထဲ ထည့်ပါတယ်။
    verify_token လုပ်တိုင်း ဒီ table ကို check ရပါမယ်။
    """
    
    __tablename__ = "token_blacklist"
    
    # Primary key
    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    
    # Token JTI (JWT ID) - unique identifier for each token
    # We store JTI instead of full token to save space
    jti: Mapped[str] = mapped_column(
        String(255),
        unique=True,
        index=True,
        nullable=False,
    )
    
    # Token type: access or refresh
    token_type: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        default="access",
    )
    
    # User ID who owned the token
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        nullable=False,
        index=True,
    )
    
    # When the token was blacklisted
    blacklisted_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
    
    # When the token would have expired (for cleanup)
    expires_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
    )
    
    # Reason for blacklisting
    reason: Mapped[str | None] = mapped_column(
        String(100),
        nullable=True,
        default="logout",
    )
    
    # Indexes for efficient querying
    __table_args__ = (
        Index('idx_token_blacklist_jti', 'jti'),
        Index('idx_token_blacklist_user_id', 'user_id'),
        Index('idx_token_blacklist_expires_at', 'expires_at'),
    )
    
    def __repr__(self) -> str:
        return f"<TokenBlacklist {self.jti[:8]}... user={self.user_id}>"


class RefreshTokenFamily(Base):
    """
    Refresh Token Family for token rotation security.
    
    Refresh token rotation: refresh လုပ်တိုင်း အသစ် issue လုပ်ပြီး
    အဟောင်းကို revoke လုပ်ပါတယ်။ Token reuse detect ရင် 
    whole family ကို revoke လုပ်ပါတယ် (security breach indication)
    """
    
    __tablename__ = "refresh_token_families"
    
    # Primary key
    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    
    # Family ID - all tokens in same login session share this
    family_id: Mapped[str] = mapped_column(
        String(255),
        unique=True,
        index=True,
        nullable=False,
    )
    
    # User who owns this token family
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        nullable=False,
        index=True,
    )
    
    # Current valid refresh token JTI
    current_jti: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )
    
    # Is this family still valid?
    is_valid: Mapped[bool] = mapped_column(
        default=True,
    )
    
    # Created at
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
    )
    
    # Last rotated at
    last_rotated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
    )
    
    # Device/client info
    device_info: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )
    
    # IP address at creation
    ip_address: Mapped[str | None] = mapped_column(
        String(50),
        nullable=True,
    )
    
    def __repr__(self) -> str:
        return f"<RefreshTokenFamily {self.family_id[:8]}... user={self.user_id}>"
