"""
Order Model (Credit Purchases)
"""
import uuid
from datetime import datetime
from decimal import Decimal
from enum import Enum
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, ForeignKey, Integer, Numeric, String, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base

if TYPE_CHECKING:
    from app.models.user import User


class OrderStatus(str, Enum):
    """Order status."""
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"
    REFUNDED = "refunded"
    CANCELLED = "cancelled"
    REJECTED = "rejected"


class Order(Base):
    """Order model for credit purchases."""
    
    __tablename__ = "orders"
    
    # Primary key
    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    
    # Foreign key
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    
    # Order details
    credits_amount: Mapped[int] = mapped_column(Integer, nullable=False)
    price_usd: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    price_mmk: Mapped[Decimal | None] = mapped_column(Numeric(15, 2), nullable=True)
    
    # Payment info
    payment_method: Mapped[str] = mapped_column(String(50), nullable=False)  # paypal, kbzpay, etc.
    payment_id: Mapped[str | None] = mapped_column(String(255), nullable=True)  # External payment ID
    payment_status: Mapped[str | None] = mapped_column(String(50), nullable=True)
    
    # Status
    status: Mapped[str] = mapped_column(
        String(50),
        default=OrderStatus.PENDING.value,
        index=True,
    )
    
    # Promo code
    promo_code: Mapped[str | None] = mapped_column(String(50), nullable=True)
    discount_percent: Mapped[int] = mapped_column(Integer, default=0)
    
    # Screenshot for manual payment verification
    screenshot_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    
    # Notes
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    admin_note: Mapped[str | None] = mapped_column(Text, nullable=True)
    
    # Telegram message ID for updating notification
    telegram_message_id: Mapped[int | None] = mapped_column(Integer, nullable=True)
    
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
    completed_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )
    
    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="orders")
    
    def __repr__(self) -> str:
        return f"<Order {self.id} - {self.credits_amount} credits>"
    
    @property
    def is_completed(self) -> bool:
        """Check if order is completed."""
        return self.status == OrderStatus.COMPLETED.value
