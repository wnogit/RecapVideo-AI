"""
Order Schemas
"""
from datetime import datetime
from decimal import Decimal
from typing import List, Optional
from uuid import UUID

from pydantic import BaseModel, Field


class OrderCreate(BaseModel):
    """Schema for order creation."""
    package_id: str = Field(..., description="Credit package ID")
    payment_method_id: Optional[UUID] = Field(None, description="Payment method ID from database")
    payment_method: str = Field(..., description="Payment type (kbzpay, wavepay, etc)")
    promo_code: Optional[str] = Field(None, max_length=50)


class OrderResponse(BaseModel):
    """Schema for order response."""
    id: UUID
    user_id: UUID
    
    # Order details
    credits_amount: int
    price_usd: Decimal
    price_mmk: Optional[Decimal] = None
    
    # Payment info
    payment_method: str
    payment_id: Optional[str] = None
    payment_status: Optional[str] = None
    
    # Status
    status: str
    
    # Promo
    promo_code: Optional[str] = None
    discount_percent: int
    
    # Screenshot for manual verification
    screenshot_url: Optional[str] = None
    
    # Notes
    notes: Optional[str] = None
    admin_note: Optional[str] = None
    
    # Timestamps
    created_at: datetime
    updated_at: datetime
    completed_at: Optional[datetime] = None
    
    model_config = {"from_attributes": True}


class OrderListResponse(BaseModel):
    """Schema for paginated order list."""
    orders: List[OrderResponse]
    total: int
    page: int
    page_size: int
    total_pages: int


class PayPalOrderCreate(BaseModel):
    """Schema for PayPal order creation response."""
    order_id: UUID
    paypal_order_id: str
    approval_url: str


class PayPalOrderCapture(BaseModel):
    """Schema for PayPal order capture request."""
    paypal_order_id: str
