"""
Credit Package Endpoints - Public and Admin endpoints for credit packages
"""
from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, HTTPException, Query, status
from sqlalchemy import select, func

from app.core.dependencies import CurrentActiveUser, CurrentAdminUser, DBSession
from app.models.credit_package import CreditPackage
from pydantic import BaseModel, Field


router = APIRouter()


# ========== Schemas ==========

class CreditPackageCreate(BaseModel):
    """Schema for creating a credit package."""
    name: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = None
    credits: int = Field(..., gt=0)
    price_usd: float = Field(..., gt=0)
    price_mmk: Optional[float] = Field(None, gt=0)
    is_popular: bool = False
    discount_percent: int = Field(0, ge=0, le=100)
    display_order: int = 0
    is_active: bool = True


class CreditPackageUpdate(BaseModel):
    """Schema for updating a credit package."""
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    description: Optional[str] = None
    credits: Optional[int] = Field(None, gt=0)
    price_usd: Optional[float] = Field(None, gt=0)
    price_mmk: Optional[float] = Field(None, gt=0)
    is_popular: Optional[bool] = None
    discount_percent: Optional[int] = Field(None, ge=0, le=100)
    display_order: Optional[int] = None
    is_active: Optional[bool] = None


class CreditPackageResponse(BaseModel):
    """Schema for credit package response."""
    id: UUID
    name: str
    description: Optional[str] = None
    credits: int
    price_usd: float
    price_mmk: Optional[float] = None
    is_popular: bool
    discount_percent: int
    display_order: int
    is_active: bool
    
    model_config = {"from_attributes": True}


class CreditPackageListResponse(BaseModel):
    """Schema for credit package list response."""
    packages: List[CreditPackageResponse]
    total: int


# ========== Public Endpoints ==========

@router.get("/public", response_model=List[CreditPackageResponse])
async def get_public_packages(
    db: DBSession,
):
    """
    Get all active credit packages (public endpoint for buy page).
    
    No authentication required.
    """
    result = await db.execute(
        select(CreditPackage)
        .where(CreditPackage.is_active == True)
        .order_by(CreditPackage.display_order.asc(), CreditPackage.credits.asc())
    )
    packages = result.scalars().all()
    
    return [CreditPackageResponse.model_validate(p) for p in packages]


# ========== Admin Endpoints ==========

@router.get("", response_model=CreditPackageListResponse)
async def list_packages(
    current_user: CurrentAdminUser,
    db: DBSession,
    include_inactive: bool = Query(False, description="Include inactive packages"),
):
    """
    List all credit packages (admin only).
    """
    query = select(CreditPackage)
    
    if not include_inactive:
        query = query.where(CreditPackage.is_active == True)
    
    query = query.order_by(CreditPackage.display_order.asc(), CreditPackage.credits.asc())
    
    result = await db.execute(query)
    packages = result.scalars().all()
    
    # Get total count
    count_result = await db.execute(select(func.count()).select_from(CreditPackage))
    total = count_result.scalar() or 0
    
    return CreditPackageListResponse(
        packages=[CreditPackageResponse.model_validate(p) for p in packages],
        total=total,
    )


@router.post("", response_model=CreditPackageResponse, status_code=status.HTTP_201_CREATED)
async def create_package(
    data: CreditPackageCreate,
    current_user: CurrentAdminUser,
    db: DBSession,
):
    """
    Create a new credit package (admin only).
    """
    package = CreditPackage(
        name=data.name,
        description=data.description,
        credits=data.credits,
        price_usd=data.price_usd,
        price_mmk=data.price_mmk,
        is_popular=data.is_popular,
        discount_percent=data.discount_percent,
        display_order=data.display_order,
        is_active=data.is_active,
    )
    
    db.add(package)
    await db.flush()
    await db.refresh(package)
    
    return CreditPackageResponse.model_validate(package)


@router.get("/{package_id}", response_model=CreditPackageResponse)
async def get_package(
    package_id: UUID,
    current_user: CurrentAdminUser,
    db: DBSession,
):
    """
    Get a specific credit package by ID (admin only).
    """
    result = await db.execute(
        select(CreditPackage).where(CreditPackage.id == package_id)
    )
    package = result.scalar_one_or_none()
    
    if not package:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Credit package not found",
        )
    
    return CreditPackageResponse.model_validate(package)


@router.patch("/{package_id}", response_model=CreditPackageResponse)
async def update_package(
    package_id: UUID,
    data: CreditPackageUpdate,
    current_user: CurrentAdminUser,
    db: DBSession,
):
    """
    Update a credit package (admin only).
    """
    result = await db.execute(
        select(CreditPackage).where(CreditPackage.id == package_id)
    )
    package = result.scalar_one_or_none()
    
    if not package:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Credit package not found",
        )
    
    # Update fields
    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(package, field, value)
    
    await db.flush()
    await db.refresh(package)
    
    return CreditPackageResponse.model_validate(package)


@router.delete("/{package_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_package(
    package_id: UUID,
    current_user: CurrentAdminUser,
    db: DBSession,
):
    """
    Delete a credit package (admin only).
    
    Note: Consider deactivating instead of deleting to preserve order history.
    """
    result = await db.execute(
        select(CreditPackage).where(CreditPackage.id == package_id)
    )
    package = result.scalar_one_or_none()
    
    if not package:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Credit package not found",
        )
    
    await db.delete(package)
    await db.flush()


@router.post("/{package_id}/toggle", response_model=CreditPackageResponse)
async def toggle_package_status(
    package_id: UUID,
    current_user: CurrentAdminUser,
    db: DBSession,
):
    """
    Toggle a credit package's active status (admin only).
    """
    result = await db.execute(
        select(CreditPackage).where(CreditPackage.id == package_id)
    )
    package = result.scalar_one_or_none()
    
    if not package:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Credit package not found",
        )
    
    package.is_active = not package.is_active
    
    await db.flush()
    await db.refresh(package)
    
    return CreditPackageResponse.model_validate(package)
