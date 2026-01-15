"""
Credit Schemas
"""
from datetime import datetime
from typing import List, Optional
from uuid import UUID

from pydantic import BaseModel


class CreditBalanceResponse(BaseModel):
    """Schema for credit balance response."""
    balance: int
    total_earned: int
    total_spent: int


class CreditTransactionResponse(BaseModel):
    """Schema for credit transaction response."""
    id: UUID
    transaction_type: str
    amount: int
    balance_after: int
    reference_type: Optional[str] = None
    reference_id: Optional[str] = None
    description: Optional[str] = None
    created_at: datetime
    
    model_config = {"from_attributes": True}


class CreditTransactionListResponse(BaseModel):
    """Schema for paginated credit transaction list."""
    transactions: List[CreditTransactionResponse]
    total: int
    page: int
    page_size: int
    total_pages: int


class CreditPackage(BaseModel):
    """Schema for credit package (pricing)."""
    id: str
    name: str
    credits: int
    price_usd: float
    price_mmk: Optional[float] = None
    popular: bool = False
    discount_percent: int = 0
    description: Optional[str] = None


# Predefined credit packages
CREDIT_PACKAGES = [
    CreditPackage(
        id="starter",
        name="Starter",
        credits=5,
        price_usd=4.99,
        price_mmk=15000,
        description="Perfect for trying out",
    ),
    CreditPackage(
        id="basic",
        name="Basic",
        credits=15,
        price_usd=12.99,
        price_mmk=40000,
        discount_percent=13,
        description="Most popular for beginners",
    ),
    CreditPackage(
        id="pro",
        name="Pro",
        credits=50,
        price_usd=39.99,
        price_mmk=120000,
        popular=True,
        discount_percent=20,
        description="Best value for creators",
    ),
    CreditPackage(
        id="business",
        name="Business",
        credits=150,
        price_usd=99.99,
        price_mmk=300000,
        discount_percent=33,
        description="For professional use",
    ),
]
