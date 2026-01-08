"""
Order Endpoints
"""
from datetime import datetime, timezone
from decimal import Decimal
from math import ceil
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, HTTPException, Query, status, UploadFile, File, BackgroundTasks
from sqlalchemy import func, select

from app.core.dependencies import CurrentActiveUser, DBSession
from app.models.order import Order, OrderStatus
from app.models.credit import CreditTransaction, TransactionType
from app.schemas.order import (
    OrderCreate,
    OrderResponse,
    OrderListResponse,
)
from app.schemas.credit import CREDIT_PACKAGES
from app.services.telegram_service import telegram_service


router = APIRouter()


def get_package_by_id(package_id: str):
    """Get credit package by ID."""
    for package in CREDIT_PACKAGES:
        if package.id == package_id:
            return package
    return None


@router.post("", response_model=OrderResponse, status_code=status.HTTP_201_CREATED)
async def create_order(
    order_data: OrderCreate,
    current_user: CurrentActiveUser,
    db: DBSession,
):
    """
    Create a new order for credit purchase.
    
    - **package_id**: Credit package ID (starter, basic, pro, business)
    - **payment_method**: Payment method (paypal, kbzpay)
    - **promo_code**: Optional promo code for discount
    """
    # Get package
    package = get_package_by_id(order_data.package_id)
    if not package:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid package ID",
        )
    
    # Validate payment method
    valid_methods = ["paypal", "kbzpay"]
    if order_data.payment_method not in valid_methods:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid payment method. Valid options: {valid_methods}",
        )
    
    # Calculate price (apply promo code discount if any)
    discount_percent = 0
    if order_data.promo_code:
        # TODO: Validate promo code and get discount
        pass
    
    price_usd = Decimal(str(package.price_usd))
    if discount_percent > 0:
        price_usd = price_usd * (100 - discount_percent) / 100
    
    # Create order
    order = Order(
        user_id=current_user.id,
        credits_amount=package.credits,
        price_usd=price_usd,
        price_mmk=Decimal(str(package.price_mmk)) if package.price_mmk else None,
        payment_method=order_data.payment_method,
        promo_code=order_data.promo_code,
        discount_percent=discount_percent,
    )
    
    db.add(order)
    await db.flush()
    await db.refresh(order)
    
    # TODO: Create payment with external provider (PayPal, etc.)
    # if order_data.payment_method == "paypal":
    #     paypal_order = await create_paypal_order(order)
    #     order.payment_id = paypal_order.id
    
    return OrderResponse.model_validate(order)


@router.get("", response_model=OrderListResponse)
async def list_orders(
    current_user: CurrentActiveUser,
    db: DBSession,
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=50),
    status_filter: Optional[str] = Query(None, alias="status"),
):
    """
    List current user's orders with pagination.
    """
    # Build query
    query = select(Order).where(Order.user_id == current_user.id)
    
    if status_filter:
        query = query.where(Order.status == status_filter)
    
    # Get total count
    count_query = select(func.count()).select_from(query.subquery())
    total = await db.scalar(count_query)
    
    # Get paginated results
    query = query.order_by(Order.created_at.desc())
    query = query.offset((page - 1) * page_size).limit(page_size)
    
    result = await db.execute(query)
    orders = result.scalars().all()
    
    return OrderListResponse(
        orders=[OrderResponse.model_validate(o) for o in orders],
        total=total or 0,
        page=page,
        page_size=page_size,
        total_pages=ceil((total or 0) / page_size),
    )


@router.get("/{order_id}", response_model=OrderResponse)
async def get_order(
    order_id: UUID,
    current_user: CurrentActiveUser,
    db: DBSession,
):
    """
    Get a specific order by ID.
    """
    result = await db.execute(
        select(Order).where(
            Order.id == order_id,
            Order.user_id == current_user.id,
        )
    )
    order = result.scalar_one_or_none()
    
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found",
        )
    
    return OrderResponse.model_validate(order)


@router.post("/{order_id}/complete", response_model=OrderResponse)
async def complete_order(
    order_id: UUID,
    current_user: CurrentActiveUser,
    db: DBSession,
):
    """
    Complete an order after successful payment.
    
    This would typically be called by a webhook from the payment provider.
    For now, it's a manual endpoint for testing.
    """
    result = await db.execute(
        select(Order).where(
            Order.id == order_id,
            Order.user_id == current_user.id,
        )
    )
    order = result.scalar_one_or_none()
    
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found",
        )
    
    if order.status == OrderStatus.COMPLETED.value:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Order already completed",
        )
    
    if order.status not in [OrderStatus.PENDING.value, OrderStatus.PROCESSING.value]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Order cannot be completed",
        )
    
    # Complete order
    order.status = OrderStatus.COMPLETED.value
    order.completed_at = datetime.now(timezone.utc)
    
    # Add credits to user
    current_user.credit_balance += order.credits_amount
    
    # Record transaction
    transaction = CreditTransaction(
        user_id=current_user.id,
        transaction_type=TransactionType.PURCHASE.value,
        amount=order.credits_amount,
        balance_after=current_user.credit_balance,
        reference_type="order",
        reference_id=str(order.id),
        description=f"Purchased {order.credits_amount} credits",
    )
    db.add(transaction)
    
    await db.flush()
    await db.refresh(order)
    
    return OrderResponse.model_validate(order)


@router.post("/{order_id}/cancel", response_model=OrderResponse)
async def cancel_order(
    order_id: UUID,
    current_user: CurrentActiveUser,
    db: DBSession,
):
    """
    Cancel a pending order.
    """
    result = await db.execute(
        select(Order).where(
            Order.id == order_id,
            Order.user_id == current_user.id,
        )
    )
    order = result.scalar_one_or_none()
    
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found",
        )
    
    if order.status != OrderStatus.PENDING.value:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only pending orders can be cancelled",
        )
    
    order.status = OrderStatus.CANCELLED.value
    await db.flush()
    await db.refresh(order)
    
    return OrderResponse.model_validate(order)


@router.post("/{order_id}/upload", response_model=OrderResponse)
async def upload_payment_screenshot(
    order_id: UUID,
    current_user: CurrentActiveUser,
    db: DBSession,
    background_tasks: BackgroundTasks,
    screenshot: UploadFile = File(...),
):
    """
    Upload payment screenshot for manual verification.
    
    - **screenshot**: Image file (JPEG, PNG)
    """
    import os
    import uuid as uuid_lib
    from pathlib import Path
    
    # Get order
    result = await db.execute(
        select(Order).where(
            Order.id == order_id,
            Order.user_id == current_user.id,
        )
    )
    order = result.scalar_one_or_none()
    
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found",
        )
    
    if order.status != OrderStatus.PENDING.value:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Can only upload screenshot for pending orders",
        )
    
    # Validate file type
    allowed_types = ["image/jpeg", "image/png", "image/jpg"]
    if screenshot.content_type not in allowed_types:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid file type. Only JPEG and PNG allowed.",
        )
    
    # Save file
    upload_dir = Path("static/payment_screenshots")
    upload_dir.mkdir(parents=True, exist_ok=True)
    
    file_ext = screenshot.filename.split(".")[-1] if screenshot.filename else "jpg"
    file_name = f"{order_id}_{uuid_lib.uuid4().hex[:8]}.{file_ext}"
    file_path = upload_dir / file_name
    
    content = await screenshot.read()
    with open(file_path, "wb") as f:
        f.write(content)
    
    # Update order
    order.screenshot_url = f"/static/payment_screenshots/{file_name}"
    order.status = OrderStatus.PROCESSING.value
    
    await db.flush()
    await db.refresh(order)
    
    # Get package info for notification
    package_name = f"{order.credits_amount} Credits"
    for pkg in CREDIT_PACKAGES:
        if pkg.credits == order.credits_amount:
            package_name = pkg.name
            break
    
    # Send Telegram notification in background
    async def send_telegram_notification():
        message_id = await telegram_service.send_order_notification(
            order_id=order.id,
            username=current_user.full_name or current_user.email.split("@")[0],
            email=current_user.email,
            package_name=package_name,
            credits=order.credits_amount,
            amount_usd=float(order.price_usd),
            amount_mmk=float(order.price_mmk) if order.price_mmk else None,
            payment_method=order.payment_method,
            screenshot_url=order.screenshot_url,
        )
        
        # Update order with telegram message ID for later updates
        if message_id:
            async with db.begin_nested():
                order.telegram_message_id = message_id
                await db.commit()
    
    background_tasks.add_task(send_telegram_notification)
    
    return OrderResponse.model_validate(order)
