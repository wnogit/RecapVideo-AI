"""
Admin Order Endpoints
"""
from datetime import datetime, timezone
from math import ceil
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, HTTPException, Query, status
from sqlalchemy import func, select, or_

from app.core.dependencies import CurrentAdminUser, DBSession
from app.models.order import Order, OrderStatus
from app.models.user import User
from app.models.credit import CreditTransaction, TransactionType
from app.schemas.order import OrderResponse, OrderListResponse


router = APIRouter()


class AdminOrderResponse(OrderResponse):
    """Extended order response with user info for admin."""
    user_email: str
    user_name: Optional[str] = None
    
    class Config:
        from_attributes = True


class AdminOrderListResponse(OrderListResponse):
    """Admin order list response with extended info."""
    orders: list[AdminOrderResponse]


@router.get("", response_model=AdminOrderListResponse)
async def list_all_orders(
    current_user: CurrentAdminUser,
    db: DBSession,
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    status_filter: Optional[str] = Query(None, alias="status"),
    search: Optional[str] = Query(None),
):
    """
    List all orders (admin only).
    
    - **status**: Filter by status (pending, processing, completed, cancelled, rejected)
    - **search**: Search by user email
    """
    # Build query with user join
    query = select(Order, User).join(User, Order.user_id == User.id)
    
    if status_filter:
        query = query.where(Order.status == status_filter)
    
    if search:
        query = query.where(
            or_(
                User.email.ilike(f"%{search}%"),
                User.full_name.ilike(f"%{search}%"),
            )
        )
    
    # Get total count
    count_query = select(func.count()).select_from(
        select(Order.id).join(User, Order.user_id == User.id)
        .where(Order.status == status_filter if status_filter else True)
        .subquery()
    )
    if search:
        count_query = select(func.count()).select_from(
            select(Order.id).join(User, Order.user_id == User.id)
            .where(Order.status == status_filter if status_filter else True)
            .where(or_(
                User.email.ilike(f"%{search}%"),
                User.full_name.ilike(f"%{search}%"),
            ))
            .subquery()
        )
    total = await db.scalar(count_query)
    
    # Get paginated results
    query = query.order_by(Order.created_at.desc())
    query = query.offset((page - 1) * page_size).limit(page_size)
    
    result = await db.execute(query)
    rows = result.all()
    
    orders = []
    for order, user in rows:
        order_dict = OrderResponse.model_validate(order).model_dump()
        order_dict["user_email"] = user.email
        order_dict["user_name"] = user.full_name
        orders.append(AdminOrderResponse(**order_dict))
    
    return AdminOrderListResponse(
        orders=orders,
        total=total or 0,
        page=page,
        page_size=page_size,
        total_pages=ceil((total or 0) / page_size),
    )


@router.get("/{order_id}", response_model=AdminOrderResponse)
async def get_order(
    order_id: UUID,
    current_user: CurrentAdminUser,
    db: DBSession,
):
    """
    Get a specific order by ID (admin only).
    """
    result = await db.execute(
        select(Order, User)
        .join(User, Order.user_id == User.id)
        .where(Order.id == order_id)
    )
    row = result.first()
    
    if not row:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found",
        )
    
    order, user = row
    order_dict = OrderResponse.model_validate(order).model_dump()
    order_dict["user_email"] = user.email
    order_dict["user_name"] = user.full_name
    
    return AdminOrderResponse(**order_dict)


@router.post("/{order_id}/approve", response_model=AdminOrderResponse)
async def approve_order(
    order_id: UUID,
    current_user: CurrentAdminUser,
    db: DBSession,
):
    """
    Approve an order and add credits to user (admin only).
    """
    result = await db.execute(
        select(Order, User)
        .join(User, Order.user_id == User.id)
        .where(Order.id == order_id)
    )
    row = result.first()
    
    if not row:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found",
        )
    
    order, user = row
    
    if order.status == OrderStatus.COMPLETED.value:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Order already approved",
        )
    
    if order.status not in [OrderStatus.PENDING.value, OrderStatus.PROCESSING.value]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot approve order with status: {order.status}",
        )
    
    # Complete order
    order.status = OrderStatus.COMPLETED.value
    order.completed_at = datetime.now(timezone.utc)
    
    # Add credits to user
    user.credit_balance += order.credits_amount
    
    # Record transaction
    transaction = CreditTransaction(
        user_id=user.id,
        transaction_type=TransactionType.PURCHASE.value,
        amount=order.credits_amount,
        balance_after=user.credit_balance,
        reference_type="order",
        reference_id=str(order.id),
        description=f"Purchased {order.credits_amount} credits (approved by admin)",
    )
    db.add(transaction)
    
    await db.flush()
    await db.refresh(order)
    
    order_dict = OrderResponse.model_validate(order).model_dump()
    order_dict["user_email"] = user.email
    order_dict["user_name"] = user.full_name
    
    return AdminOrderResponse(**order_dict)


@router.post("/{order_id}/reject", response_model=AdminOrderResponse)
async def reject_order(
    order_id: UUID,
    current_user: CurrentAdminUser,
    db: DBSession,
    reason: Optional[str] = Query(None),
):
    """
    Reject an order (admin only).
    """
    result = await db.execute(
        select(Order, User)
        .join(User, Order.user_id == User.id)
        .where(Order.id == order_id)
    )
    row = result.first()
    
    if not row:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found",
        )
    
    order, user = row
    
    if order.status == OrderStatus.COMPLETED.value:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot reject completed order",
        )
    
    if order.status == OrderStatus.REJECTED.value:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Order already rejected",
        )
    
    # Reject order
    order.status = OrderStatus.REJECTED.value
    if reason:
        order.admin_note = reason
    
    await db.flush()
    await db.refresh(order)
    
    order_dict = OrderResponse.model_validate(order).model_dump()
    order_dict["user_email"] = user.email
    order_dict["user_name"] = user.full_name
    
    return AdminOrderResponse(**order_dict)


@router.get("/stats/summary")
async def get_order_stats(
    current_user: CurrentAdminUser,
    db: DBSession,
):
    """
    Get order statistics (admin only).
    """
    # Count by status
    status_counts = {}
    for status_val in [OrderStatus.PENDING, OrderStatus.PROCESSING, OrderStatus.COMPLETED, OrderStatus.CANCELLED, OrderStatus.REJECTED]:
        count = await db.scalar(
            select(func.count()).select_from(Order).where(Order.status == status_val.value)
        )
        status_counts[status_val.value] = count or 0
    
    # Total revenue (completed orders)
    total_revenue = await db.scalar(
        select(func.sum(Order.price_usd)).where(Order.status == OrderStatus.COMPLETED.value)
    )
    
    # Total credits sold
    total_credits = await db.scalar(
        select(func.sum(Order.credits_amount)).where(Order.status == OrderStatus.COMPLETED.value)
    )
    
    return {
        "status_counts": status_counts,
        "total_revenue_usd": float(total_revenue or 0),
        "total_credits_sold": total_credits or 0,
        "total_orders": sum(status_counts.values()),
    }
