"""
Payment Method Schemas
"""
from datetime import datetime
from typing import List, Optional
from uuid import UUID

from pydantic import BaseModel, Field


class PaymentMethodCreate(BaseModel):
    """Schema for creating a payment method."""
    phone: str = Field(..., min_length=5, max_length=20, description="Phone number")
    account_name: str = Field(..., min_length=1, max_length=100, description="Account holder name")
    payment_types: List[str] = Field(..., min_length=1, description="List of payment types like ['kbzpay', 'wavepay']")
    qr_code_url: Optional[str] = Field(None, max_length=500, description="QR code image URL")
    is_active: bool = Field(True)
    display_order: int = Field(0)


class PaymentMethodUpdate(BaseModel):
    """Schema for updating a payment method."""
    phone: Optional[str] = Field(None, min_length=5, max_length=20)
    account_name: Optional[str] = Field(None, min_length=1, max_length=100)
    payment_types: Optional[List[str]] = Field(None, min_length=1)
    qr_code_url: Optional[str] = Field(None, max_length=500)
    is_active: Optional[bool] = None
    display_order: Optional[int] = None


class PaymentMethodResponse(BaseModel):
    """Schema for payment method response."""
    id: UUID
    phone: str
    account_name: str
    payment_types: List[str]
    qr_code_url: Optional[str] = None
    is_active: bool
    display_order: int
    created_at: datetime
    updated_at: datetime
    
    model_config = {"from_attributes": True}


class PaymentMethodListResponse(BaseModel):
    """Schema for payment method list response."""
    payment_methods: List[PaymentMethodResponse]
    total: int


class PaymentTypeInfo(BaseModel):
    """Schema for payment type info (static data)."""
    id: str
    name: str
    color: str
