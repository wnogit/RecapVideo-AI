"""
Admin Users Endpoints
"""
from typing import Optional
from uuid import UUID
from fastapi import APIRouter, HTTPException, status, Query
from sqlalchemy import select, func, or_, desc, asc
from sqlalchemy.orm import selectinload
from pydantic import BaseModel
from datetime import datetime

from app.core.dependencies import CurrentAdminUser, DBSession
from app.models.user import User
from app.models.device import DeviceFingerprint


router = APIRouter()


class LastDeviceInfo(BaseModel):
    """Last device info for admin view."""
    device_type: Optional[str] = None
    browser: Optional[str] = None
    os: Optional[str] = None
    ip_address: Optional[str] = None
    city: Optional[str] = None
    country: Optional[str] = None
    last_seen: Optional[datetime] = None


class AdminUserResponse(BaseModel):
    """User response for admin."""
    id: str
    email: str
    name: str
    avatar_url: Optional[str] = None
    phone: Optional[str] = None
    is_active: bool
    is_verified: bool
    is_admin: bool
    credit_balance: int
    created_at: datetime
    updated_at: datetime
    last_login_at: Optional[datetime] = None
    video_count: int = 0
    last_device: Optional[LastDeviceInfo] = None

    class Config:
        from_attributes = True


class AdminUserListResponse(BaseModel):
    """List response for admin users."""
    users: list[AdminUserResponse]
    total: int
    page: int
    page_size: int
    total_pages: int


class AdminUserUpdate(BaseModel):
    """Update user (admin)."""
    name: Optional[str] = None
    is_active: Optional[bool] = None
    is_admin: Optional[bool] = None
    credit_balance: Optional[int] = None


class AdminAddCreditsRequest(BaseModel):
    """Add credits request."""
    amount: int
    reason: Optional[str] = None


@router.get("", response_model=AdminUserListResponse)
async def list_users(
    db: DBSession,
    current_user: CurrentAdminUser,
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=10, ge=1, le=100),
    search: Optional[str] = Query(default=None),
    is_active: Optional[bool] = Query(default=None),
    is_admin: Optional[bool] = Query(default=None),
    sort_by: str = Query(default="created_at"),
    sort_order: str = Query(default="desc"),
):
    """
    List all users (Admin only).
    
    - **search**: Search by email or name
    - **is_active**: Filter by active status
    - **is_admin**: Filter by admin status
    - **sort_by**: Sort by field (created_at, name, email, credit_balance)
    - **sort_order**: asc or desc
    """
    # Base query
    query = select(User)
    count_query = select(func.count(User.id))
    
    # Search filter
    if search:
        search_filter = or_(
            User.email.ilike(f"%{search}%"),
            User.name.ilike(f"%{search}%"),
        )
        query = query.where(search_filter)
        count_query = count_query.where(search_filter)
    
    # Status filters
    if is_active is not None:
        query = query.where(User.is_active == is_active)
        count_query = count_query.where(User.is_active == is_active)
    
    if is_admin is not None:
        query = query.where(User.is_admin == is_admin)
        count_query = count_query.where(User.is_admin == is_admin)
    
    # Get total count
    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0
    
    # Sorting
    sort_column = getattr(User, sort_by, User.created_at)
    if sort_order == "asc":
        query = query.order_by(asc(sort_column))
    else:
        query = query.order_by(desc(sort_column))
    
    # Pagination
    offset = (page - 1) * page_size
    query = query.offset(offset).limit(page_size)
    
    # Execute
    result = await db.execute(query)
    users = result.scalars().all()
    
    # Get video counts for each user
    user_responses = []
    for user in users:
        # Count videos
        from app.models.video import Video
        video_count_result = await db.execute(
            select(func.count(Video.id)).where(Video.user_id == user.id)
        )
        video_count = video_count_result.scalar() or 0
        
        # Get last device info
        last_device_result = await db.execute(
            select(DeviceFingerprint)
            .where(DeviceFingerprint.user_id == user.id)
            .order_by(desc(DeviceFingerprint.last_seen))
            .limit(1)
        )
        last_device_row = last_device_result.scalar_one_or_none()
        
        last_device = None
        if last_device_row:
            last_device = LastDeviceInfo(
                device_type=last_device_row.device_type,
                browser=last_device_row.browser,
                os=last_device_row.os,
                ip_address=last_device_row.ip_address,
                city=last_device_row.city,
                country=last_device_row.country,
                last_seen=last_device_row.last_seen,
            )
        
        user_responses.append(AdminUserResponse(
            id=str(user.id),
            email=user.email,
            name=user.name,
            avatar_url=user.avatar_url,
            phone=user.phone,
            is_active=user.is_active,
            is_verified=user.is_verified,
            is_admin=user.is_admin,
            credit_balance=user.credit_balance,
            created_at=user.created_at,
            updated_at=user.updated_at,
            last_login_at=user.last_login_at,
            video_count=video_count,
            last_device=last_device,
        ))
    
    total_pages = (total + page_size - 1) // page_size
    
    return AdminUserListResponse(
        users=user_responses,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
    )


@router.get("/{user_id}", response_model=AdminUserResponse)
async def get_user(
    user_id: UUID,
    db: DBSession,
    current_user: CurrentAdminUser,
):
    """
    Get user details (Admin only).
    """
    result = await db.execute(
        select(User).where(User.id == user_id)
    )
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )
    
    # Get video count
    from app.models.video import Video
    video_count_result = await db.execute(
        select(func.count(Video.id)).where(Video.user_id == user.id)
    )
    video_count = video_count_result.scalar() or 0
    
    # Get last device info
    last_device_result = await db.execute(
        select(DeviceFingerprint)
        .where(DeviceFingerprint.user_id == user.id)
        .order_by(desc(DeviceFingerprint.last_seen))
        .limit(1)
    )
    last_device_row = last_device_result.scalar_one_or_none()
    
    last_device = None
    if last_device_row:
        last_device = LastDeviceInfo(
            device_type=last_device_row.device_type,
            browser=last_device_row.browser,
            os=last_device_row.os,
            ip_address=last_device_row.ip_address,
            city=last_device_row.city,
            country=last_device_row.country,
            last_seen=last_device_row.last_seen,
        )
    
    return AdminUserResponse(
        id=str(user.id),
        email=user.email,
        name=user.name,
        avatar_url=user.avatar_url,
        phone=user.phone,
        is_active=user.is_active,
        is_verified=user.is_verified,
        is_admin=user.is_admin,
        credit_balance=user.credit_balance,
        created_at=user.created_at,
        updated_at=user.updated_at,
        last_login_at=user.last_login_at,
        video_count=video_count,
        last_device=last_device,
    )


@router.patch("/{user_id}", response_model=AdminUserResponse)
async def update_user(
    user_id: UUID,
    user_data: AdminUserUpdate,
    db: DBSession,
    current_user: CurrentAdminUser,
):
    """
    Update user (Admin only).
    
    - **name**: Update display name
    - **is_active**: Activate/deactivate user
    - **is_admin**: Grant/revoke admin privileges
    - **credit_balance**: Set credit balance
    """
    result = await db.execute(
        select(User).where(User.id == user_id)
    )
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )
    
    # Prevent self-demotion from admin
    if user.id == current_user.id and user_data.is_admin is False:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot remove your own admin privileges",
        )
    
    # Update fields
    update_data = user_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(user, field, value)
    
    await db.flush()
    await db.refresh(user)
    
    # Get video count
    from app.models.video import Video
    video_count_result = await db.execute(
        select(func.count(Video.id)).where(Video.user_id == user.id)
    )
    video_count = video_count_result.scalar() or 0
    
    # Get last device info
    last_device_result = await db.execute(
        select(DeviceFingerprint)
        .where(DeviceFingerprint.user_id == user.id)
        .order_by(desc(DeviceFingerprint.last_seen))
        .limit(1)
    )
    last_device_row = last_device_result.scalar_one_or_none()
    
    last_device = None
    if last_device_row:
        last_device = LastDeviceInfo(
            device_type=last_device_row.device_type,
            browser=last_device_row.browser,
            os=last_device_row.os,
            ip_address=last_device_row.ip_address,
            city=last_device_row.city,
            country=last_device_row.country,
            last_seen=last_device_row.last_seen,
        )
    
    return AdminUserResponse(
        id=str(user.id),
        email=user.email,
        name=user.name,
        avatar_url=user.avatar_url,
        phone=user.phone,
        is_active=user.is_active,
        is_verified=user.is_verified,
        is_admin=user.is_admin,
        credit_balance=user.credit_balance,
        created_at=user.created_at,
        updated_at=user.updated_at,
        last_login_at=user.last_login_at,
        video_count=video_count,
        last_device=last_device,
    )


@router.post("/{user_id}/add-credits")
async def add_credits(
    user_id: UUID,
    request: AdminAddCreditsRequest,
    db: DBSession,
    current_user: CurrentAdminUser,
):
    """
    Add credits to user account (Admin only).
    """
    result = await db.execute(
        select(User).where(User.id == user_id)
    )
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )
    
    # Add credits
    user.credit_balance += request.amount
    await db.flush()
    
    return {
        "message": f"Added {request.amount} credits to {user.email}",
        "new_balance": user.credit_balance,
    }


@router.post("/{user_id}/toggle-active")
async def toggle_user_active(
    user_id: UUID,
    db: DBSession,
    current_user: CurrentAdminUser,
):
    """
    Toggle user active status (Admin only).
    """
    result = await db.execute(
        select(User).where(User.id == user_id)
    )
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )
    
    # Prevent self-deactivation
    if user.id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot deactivate your own account",
        )
    
    user.is_active = not user.is_active
    await db.flush()
    
    status_text = "activated" if user.is_active else "deactivated"
    return {
        "message": f"User {user.email} has been {status_text}",
        "is_active": user.is_active,
    }


@router.post("/{user_id}/toggle-admin")
async def toggle_user_admin(
    user_id: UUID,
    db: DBSession,
    current_user: CurrentAdminUser,
):
    """
    Toggle user admin status (Admin only).
    """
    result = await db.execute(
        select(User).where(User.id == user_id)
    )
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )
    
    # Prevent self-demotion
    if user.id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot change your own admin status",
        )
    
    user.is_admin = not user.is_admin
    await db.flush()
    
    status_text = "granted admin" if user.is_admin else "removed admin"
    return {
        "message": f"User {user.email} has been {status_text}",
        "is_admin": user.is_admin,
    }
