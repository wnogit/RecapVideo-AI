"""
Payment Method Endpoints
"""
from typing import List
from uuid import UUID

from fastapi import APIRouter, HTTPException, Query, status, UploadFile, File
from sqlalchemy import select, func

from app.core.dependencies import CurrentActiveUser, CurrentAdminUser, DBSession
from app.models.payment_method import PaymentMethod, PAYMENT_TYPES
from app.schemas.payment_method import (
    PaymentMethodCreate,
    PaymentMethodUpdate,
    PaymentMethodResponse,
    PaymentMethodListResponse,
    PaymentTypeInfo,
)


router = APIRouter()


# ========== Public Endpoints ==========

@router.get("/active", response_model=List[PaymentMethodResponse])
async def get_active_payment_methods(
    db: DBSession,
):
    """
    Get all active payment methods (for user checkout).
    
    This is a public endpoint for the buy flow.
    """
    result = await db.execute(
        select(PaymentMethod)
        .where(PaymentMethod.is_active == True)
        .order_by(PaymentMethod.display_order.asc(), PaymentMethod.created_at.desc())
    )
    methods = result.scalars().all()
    
    return [PaymentMethodResponse.model_validate(m) for m in methods]


@router.get("/public", response_model=List[PaymentMethodResponse])
async def get_public_payment_methods(
    db: DBSession,
):
    """
    Alias for /active endpoint for compatibility.
    """
    result = await db.execute(
        select(PaymentMethod)
        .where(PaymentMethod.is_active == True)
        .order_by(PaymentMethod.display_order.asc(), PaymentMethod.created_at.desc())
    )
    methods = result.scalars().all()
    
    return [PaymentMethodResponse.model_validate(m) for m in methods]


@router.get("/types", response_model=List[PaymentTypeInfo])
async def get_payment_types():
    """
    Get list of available payment types (static data).
    
    Returns all supported payment types like KBZPay, Wave, CB Pay, etc.
    """
    return [PaymentTypeInfo(**t) for t in PAYMENT_TYPES]


# ========== Admin Endpoints ==========

@router.get("", response_model=PaymentMethodListResponse)
async def list_payment_methods(
    current_user: CurrentAdminUser,
    db: DBSession,
    include_inactive: bool = Query(False, description="Include inactive methods"),
):
    """
    List all payment methods (admin only).
    """
    query = select(PaymentMethod)
    
    if not include_inactive:
        query = query.where(PaymentMethod.is_active == True)
    
    query = query.order_by(PaymentMethod.display_order.asc(), PaymentMethod.created_at.desc())
    
    result = await db.execute(query)
    methods = result.scalars().all()
    
    # Get total count
    count_result = await db.execute(select(func.count()).select_from(PaymentMethod))
    total = count_result.scalar() or 0
    
    return PaymentMethodListResponse(
        payment_methods=[PaymentMethodResponse.model_validate(m) for m in methods],
        total=total,
    )


@router.post("", response_model=PaymentMethodResponse, status_code=status.HTTP_201_CREATED)
async def create_payment_method(
    data: PaymentMethodCreate,
    current_user: CurrentAdminUser,
    db: DBSession,
):
    """
    Create a new payment method (admin only).
    """
    # Validate payment types
    valid_type_ids = [t["id"] for t in PAYMENT_TYPES]
    for pt in data.payment_types:
        if pt not in valid_type_ids:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid payment type: {pt}. Valid types: {valid_type_ids}",
            )
    
    method = PaymentMethod(
        phone=data.phone,
        account_name=data.account_name,
        payment_types=data.payment_types,
        qr_code_url=data.qr_code_url,
        is_active=data.is_active,
        display_order=data.display_order,
    )
    
    db.add(method)
    await db.flush()
    await db.refresh(method)
    
    return PaymentMethodResponse.model_validate(method)


@router.get("/{method_id}", response_model=PaymentMethodResponse)
async def get_payment_method(
    method_id: UUID,
    current_user: CurrentAdminUser,
    db: DBSession,
):
    """
    Get a specific payment method by ID (admin only).
    """
    result = await db.execute(
        select(PaymentMethod).where(PaymentMethod.id == method_id)
    )
    method = result.scalar_one_or_none()
    
    if not method:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Payment method not found",
        )
    
    return PaymentMethodResponse.model_validate(method)


@router.patch("/{method_id}", response_model=PaymentMethodResponse)
async def update_payment_method(
    method_id: UUID,
    data: PaymentMethodUpdate,
    current_user: CurrentAdminUser,
    db: DBSession,
):
    """
    Update a payment method (admin only).
    """
    result = await db.execute(
        select(PaymentMethod).where(PaymentMethod.id == method_id)
    )
    method = result.scalar_one_or_none()
    
    if not method:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Payment method not found",
        )
    
    # Validate payment types if provided
    if data.payment_types is not None:
        valid_type_ids = [t["id"] for t in PAYMENT_TYPES]
        for pt in data.payment_types:
            if pt not in valid_type_ids:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Invalid payment type: {pt}. Valid types: {valid_type_ids}",
                )
    
    # Update fields
    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(method, field, value)
    
    await db.flush()
    await db.refresh(method)
    
    return PaymentMethodResponse.model_validate(method)


@router.delete("/{method_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_payment_method(
    method_id: UUID,
    current_user: CurrentAdminUser,
    db: DBSession,
):
    """
    Delete a payment method (admin only).
    """
    result = await db.execute(
        select(PaymentMethod).where(PaymentMethod.id == method_id)
    )
    method = result.scalar_one_or_none()
    
    if not method:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Payment method not found",
        )
    
    await db.delete(method)
    await db.flush()


@router.post("/{method_id}/qr-code", response_model=PaymentMethodResponse)
async def upload_qr_code(
    method_id: UUID,
    current_user: CurrentAdminUser,
    db: DBSession,
    qr_code: UploadFile = File(...),
):
    """
    Upload QR code image for a payment method (admin only).
    """
    import uuid as uuid_lib
    from pathlib import Path
    
    # Get method
    result = await db.execute(
        select(PaymentMethod).where(PaymentMethod.id == method_id)
    )
    method = result.scalar_one_or_none()
    
    if not method:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Payment method not found",
        )
    
    # Validate file type
    allowed_types = ["image/jpeg", "image/png", "image/jpg"]
    if qr_code.content_type not in allowed_types:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid file type. Only JPEG and PNG allowed.",
        )
    
    # Save file
    upload_dir = Path("static/payment_qr")
    upload_dir.mkdir(parents=True, exist_ok=True)
    
    file_ext = qr_code.filename.split(".")[-1] if qr_code.filename else "jpg"
    file_name = f"{method_id}_{uuid_lib.uuid4().hex[:8]}.{file_ext}"
    file_path = upload_dir / file_name
    
    content = await qr_code.read()
    with open(file_path, "wb") as f:
        f.write(content)
    
    # Update method
    method.qr_code_url = f"/static/payment_qr/{file_name}"
    
    await db.flush()
    await db.refresh(method)
    
    return PaymentMethodResponse.model_validate(method)
