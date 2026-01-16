"""
User Model
"""
import uuid
from datetime import datetime, timezone
from typing import List, TYPE_CHECKING

from sqlalchemy import Boolean, DateTime, Integer, String, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base

if TYPE_CHECKING:
    from app.models.video import Video
    from app.models.credit import CreditTransaction
    from app.models.order import Order
    from app.models.device import DeviceFingerprint, IPSignupLog


class User(Base):
    """User model for authentication and profile."""
    
    __tablename__ = "users"
    
    # Primary key
    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    
    # Authentication
    email: Mapped[str] = mapped_column(
        String(255),
        unique=True,
        index=True,
        nullable=False,
    )
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    
    # Profile
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    avatar_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    phone: Mapped[str | None] = mapped_column(String(50), nullable=True)
    
    # Status
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    is_verified: Mapped[bool] = mapped_column(Boolean, default=False)
    is_admin: Mapped[bool] = mapped_column(Boolean, default=False)
    
    # Credits
    credit_balance: Mapped[int] = mapped_column(Integer, default=0)
    purchased_credits: Mapped[int] = mapped_column(Integer, default=0)  # Track purchased credits for Pro tier
    
    # Preferences (JSON stored as text)
    preferences: Mapped[str | None] = mapped_column(Text, nullable=True)
    
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
    last_login_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )
    
    # Relationships - Use lazy="raise" to prevent N+1 queries
    # Must explicitly load relationships when needed with selectinload/joinedload
    videos: Mapped[List["Video"]] = relationship(
        "Video",
        back_populates="user",
        lazy="raise",  # Raises exception if accessed without explicit loading
    )
    credit_transactions: Mapped[List["CreditTransaction"]] = relationship(
        "CreditTransaction",
        back_populates="user",
        lazy="raise",
    )
    orders: Mapped[List["Order"]] = relationship(
        "Order",
        back_populates="user",
        lazy="raise",
    )
    devices: Mapped[List["DeviceFingerprint"]] = relationship(
        "DeviceFingerprint",
        back_populates="user",
        lazy="raise",
    )
    ip_logs: Mapped[List["IPSignupLog"]] = relationship(
        "IPSignupLog",
        back_populates="user",
        lazy="raise",
    )
    
    # OAuth provider info
    oauth_provider: Mapped[str | None] = mapped_column(String(50), nullable=True)  # google, facebook
    oauth_id: Mapped[str | None] = mapped_column(String(255), nullable=True)
    
    # Email verification
    verification_token: Mapped[str | None] = mapped_column(String(255), nullable=True)
    verification_expires: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    
    # Remember me token
    remember_token: Mapped[str | None] = mapped_column(String(255), nullable=True)
    remember_expires: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    
    # Anti-abuse tracking
    signup_ip: Mapped[str | None] = mapped_column(String(50), nullable=True)
    signup_device_id: Mapped[str | None] = mapped_column(String(100), nullable=True)
    is_suspicious: Mapped[bool] = mapped_column(Boolean, default=False)
    
    def __repr__(self) -> str:
        return f"<User {self.email}>"
    
    @property
    def has_password(self) -> bool:
        """Check if user has a password set (not just OAuth)."""
        return bool(self.hashed_password and self.hashed_password != "OAUTH_ONLY")
    
    @property
    def has_google(self) -> bool:
        """Check if user has Google account connected."""
        return self.oauth_provider == "google" and bool(self.oauth_id)
    
    @property
    def auth_provider(self) -> str:
        """Get primary auth provider."""
        if self.oauth_provider == "google":
            return "google"
        return "email"
    
    @property
    def has_credits(self) -> bool:
        """Check if user has any credits."""
        return self.credit_balance > 0
    
    def can_create_video(self, required_credits: int = 2) -> bool:
        """Check if user has enough credits to create a video."""
        return self.credit_balance >= required_credits
    
    @property
    def tier(self) -> str:
        """Get user tier based on purchased credits."""
        if self.purchased_credits > 0:
            return "PRO"
        return "FREE"
    
    @property
    def is_pro(self) -> bool:
        """Check if user is Pro tier."""
        return self.purchased_credits > 0
    
    @property
    def can_bypass_vpn(self) -> bool:
        """Check if user can bypass VPN detection."""
        return self.is_pro

