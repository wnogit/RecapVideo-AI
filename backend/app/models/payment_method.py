"""
Payment Method Model - Multi-type payment accounts for order processing
"""
from datetime import datetime
from typing import List, Optional
from uuid import UUID, uuid4

from sqlalchemy import String, Text, Boolean, DateTime, func, JSON
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class PaymentMethod(Base):
    """Payment method/account for receiving payments"""
    
    __tablename__ = "payment_methods"
    
    id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True),
        primary_key=True,
        default=uuid4,
    )
    
    # Account info
    phone: Mapped[str] = mapped_column(String(20), nullable=False)
    account_name: Mapped[str] = mapped_column(String(100), nullable=False)
    
    # Payment types - JSON array of enabled types like ["kbzpay", "wavepay", "cbpay"]
    # Allows one phone number to support multiple payment apps
    payment_types: Mapped[List[str]] = mapped_column(
        JSON,
        nullable=False,
        default=list,
    )
    
    # QR Code image URL (optional)
    qr_code_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    
    # Status
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    
    # Display order for sorting in UI
    display_order: Mapped[int] = mapped_column(default=0)
    
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
        return f"<PaymentMethod {self.account_name} - {self.phone}>"


# Payment type constants for reference
PAYMENT_TYPES = [
    {"id": "kbzpay", "name": "KBZ Pay", "color": "blue"},
    {"id": "wavepay", "name": "Wave Pay", "color": "green"},
    {"id": "cbpay", "name": "CB Pay", "color": "purple"},
    {"id": "ayapay", "name": "AYA Pay", "color": "yellow"},
    {"id": "okdollar", "name": "OK$", "color": "orange"},
    {"id": "mpitesan", "name": "M-Pitesan", "color": "red"},
    {"id": "onepay", "name": "OnePay", "color": "teal"},
    {"id": "uabpay", "name": "UAB Pay", "color": "indigo"},
]
