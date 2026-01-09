"""
User Endpoints
"""
from datetime import datetime, timedelta, timezone
from typing import List
from fastapi import APIRouter, HTTPException, status, Query
from sqlalchemy import select, or_, desc

from app.core.dependencies import CurrentActiveUser, DBSession
from app.core.security import verify_password, get_password_hash
from app.schemas.user import UserResponse, UserUpdate, UserPasswordUpdate
from app.models.video import Video, VideoStatus
from app.models.order import Order, OrderStatus


router = APIRouter()


@router.get("/me", response_model=UserResponse)
async def get_current_user(current_user: CurrentActiveUser):
    """
    Get current authenticated user's profile.
    """
    return UserResponse.model_validate(current_user)


@router.patch("/me", response_model=UserResponse)
async def update_current_user(
    user_data: UserUpdate,
    current_user: CurrentActiveUser,
    db: DBSession,
):
    """
    Update current user's profile.
    
    - **name**: Display name (optional)
    - **phone**: Phone number (optional)
    - **avatar_url**: Avatar URL (optional)
    """
    update_data = user_data.model_dump(exclude_unset=True)
    
    for field, value in update_data.items():
        setattr(current_user, field, value)
    
    await db.flush()
    await db.refresh(current_user)
    
    return UserResponse.model_validate(current_user)


@router.post("/me/change-password", status_code=status.HTTP_200_OK)
async def change_password(
    password_data: UserPasswordUpdate,
    current_user: CurrentActiveUser,
    db: DBSession,
):
    """
    Change current user's password.
    
    - **current_password**: Current password
    - **new_password**: New strong password
    """
    # Verify current password
    if not verify_password(password_data.current_password, current_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect",
        )
    
    # Update password
    current_user.hashed_password = get_password_hash(password_data.new_password)
    await db.flush()
    
    return {"message": "Password changed successfully"}


@router.delete("/me", status_code=status.HTTP_200_OK)
async def delete_current_user(
    current_user: CurrentActiveUser,
    db: DBSession,
):
    """
    Deactivate current user's account.
    
    This doesn't actually delete the user, just marks them as inactive.
    """
    current_user.is_active = False
    await db.flush()
    
    return {"message": "Account deactivated successfully"}


@router.get("/me/notifications")
async def get_user_notifications(
    current_user: CurrentActiveUser,
    db: DBSession,
    limit: int = Query(default=10, le=50),
):
    """
    Get user notifications.
    
    Returns recent:
    - Completed/failed videos (last 7 days)
    - Approved/rejected/completed orders (last 7 days)
    """
    notifications = []
    seven_days_ago = datetime.now(timezone.utc) - timedelta(days=7)
    
    # Get recent completed/failed videos
    videos_query = select(Video).where(
        Video.user_id == current_user.id,
        Video.status.in_([VideoStatus.COMPLETED.value, VideoStatus.FAILED.value]),
        Video.updated_at >= seven_days_ago,
    ).order_by(desc(Video.updated_at)).limit(limit)
    
    videos_result = await db.execute(videos_query)
    videos = videos_result.scalars().all()
    
    for video in videos:
        if video.status == VideoStatus.COMPLETED.value:
            notifications.append({
                "id": str(video.id),
                "type": "video_completed",
                "title": "Video Ready",
                "message": f"Your video '{video.title or video.source_title or 'Untitled'}' is ready to download",
                "timestamp": video.updated_at.isoformat() if video.updated_at else video.created_at.isoformat(),
                "read": False,
                "link": "/videos",
            })
        elif video.status == VideoStatus.FAILED.value:
            notifications.append({
                "id": str(video.id),
                "type": "video_failed",
                "title": "Video Failed",
                "message": f"Failed to process '{video.title or video.source_title or 'Untitled'}'",
                "timestamp": video.updated_at.isoformat() if video.updated_at else video.created_at.isoformat(),
                "read": False,
                "link": "/videos",
            })
    
    # Get recent order updates
    orders_query = select(Order).where(
        Order.user_id == current_user.id,
        Order.status.in_([
            OrderStatus.COMPLETED.value,
            OrderStatus.REJECTED.value,
            OrderStatus.FAILED.value,
        ]),
        Order.updated_at >= seven_days_ago,
    ).order_by(desc(Order.updated_at)).limit(limit)
    
    orders_result = await db.execute(orders_query)
    orders = orders_result.scalars().all()
    
    for order in orders:
        if order.status == OrderStatus.COMPLETED.value:
            notifications.append({
                "id": str(order.id),
                "type": "order_approved",
                "title": "Order Approved",
                "message": f"Your order for {order.credits_amount} credits has been approved!",
                "timestamp": order.updated_at.isoformat() if order.updated_at else order.created_at.isoformat(),
                "read": False,
                "link": "/orders",
            })
        elif order.status == OrderStatus.REJECTED.value:
            notifications.append({
                "id": str(order.id),
                "type": "order_rejected",
                "title": "Order Rejected",
                "message": f"Your order for {order.credits_amount} credits was rejected",
                "timestamp": order.updated_at.isoformat() if order.updated_at else order.created_at.isoformat(),
                "read": False,
                "link": "/orders",
            })
        elif order.status == OrderStatus.FAILED.value:
            notifications.append({
                "id": str(order.id),
                "type": "order_failed",
                "title": "Order Failed",
                "message": f"Your order for {order.credits_amount} credits failed",
                "timestamp": order.updated_at.isoformat() if order.updated_at else order.created_at.isoformat(),
                "read": False,
                "link": "/orders",
            })
    
    # Sort by timestamp descending
    notifications.sort(key=lambda x: x["timestamp"], reverse=True)
    
    # Return limited notifications
    return {
        "notifications": notifications[:limit],
        "unread_count": len(notifications),
    }

