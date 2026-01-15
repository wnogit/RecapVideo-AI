"""
User Endpoints
"""
from datetime import datetime, timedelta, timezone
from typing import List, Optional
from fastapi import APIRouter, HTTPException, status, Query, Request
from sqlalchemy import select, or_, desc
from pydantic import BaseModel, Field
import httpx

from app.core.dependencies import CurrentActiveUser, DBSession
from app.core.config import settings
from app.core.security import verify_password, get_password_hash
from app.schemas.user import UserResponse, UserUpdate, UserPasswordUpdate
from app.models.video import Video, VideoStatus
from app.models.order import Order, OrderStatus


router = APIRouter()


# ============ Schemas for Account Linking ============

class SetPasswordRequest(BaseModel):
    """Schema for setting password (for OAuth-only users)."""
    new_password: str = Field(..., min_length=8, max_length=128)
    confirm_password: str = Field(..., min_length=8, max_length=128)


class ConnectGoogleRequest(BaseModel):
    """Schema for connecting Google account."""
    code: str
    redirect_uri: str


class DisconnectAccountRequest(BaseModel):
    """Schema for disconnecting an account."""
    account_type: str  # "google" or "password"
    current_password: Optional[str] = None  # Required if disconnecting password


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

    
    # Sort by timestamp descending
    notifications.sort(key=lambda x: x["timestamp"], reverse=True)
    
    # Return limited notifications
    return {
        "notifications": notifications[:limit],
        "unread_count": len(notifications),
    }


# ============ Account Linking Endpoints ============

@router.post("/me/set-password", status_code=status.HTTP_200_OK)
async def set_password(
    body: SetPasswordRequest,
    current_user: CurrentActiveUser,
    db: DBSession,
):
    """
    Set password for OAuth-only users.
    
    This allows users who signed up with Google to also use email/password login.
    """
    # Check if passwords match
    if body.new_password != body.confirm_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Passwords do not match",
        )
    
    # Check if user already has a password
    if current_user.has_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You already have a password set. Use change-password endpoint instead.",
        )
    
    # Set the password
    current_user.hashed_password = get_password_hash(body.new_password)
    await db.commit()
    
    return {
        "message": "Password set successfully. You can now login with email and password.",
        "has_password": True,
    }


@router.post("/me/connect-google", response_model=UserResponse)
async def connect_google_account(
    body: ConnectGoogleRequest,
    current_user: CurrentActiveUser,
    db: DBSession,
):
    """
    Connect Google account to existing user.
    
    This allows email/password users to also use Google login.
    """
    # Check if already connected
    if current_user.has_google:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Google account is already connected.",
        )
    
    # Exchange code for tokens
    try:
        async with httpx.AsyncClient() as client:
            token_response = await client.post(
                "https://oauth2.googleapis.com/token",
                data={
                    "code": body.code,
                    "client_id": settings.GOOGLE_CLIENT_ID,
                    "client_secret": settings.GOOGLE_CLIENT_SECRET,
                    "redirect_uri": body.redirect_uri,
                    "grant_type": "authorization_code",
                },
            )
            
            if token_response.status_code != 200:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Failed to connect Google account. Please try again.",
                )
            
            tokens = token_response.json()
            access_token = tokens.get("access_token")
            
            # Get user info from Google
            userinfo_response = await client.get(
                "https://www.googleapis.com/oauth2/v2/userinfo",
                headers={"Authorization": f"Bearer {access_token}"},
            )
            
            if userinfo_response.status_code != 200:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Failed to get Google account info.",
                )
            
            google_user = userinfo_response.json()
            google_id = google_user.get("id")
            google_email = google_user.get("email", "").lower()
            
            # Verify email matches
            if google_email != current_user.email.lower():
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Google account email ({google_email}) doesn't match your account email ({current_user.email}). Please use the same email.",
                )
            
            # Check if this Google account is already linked to another user
            from app.models.user import User
            existing = await db.execute(
                select(User).where(
                    User.oauth_id == google_id,
                    User.id != current_user.id,
                )
            )
            if existing.scalar_one_or_none():
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="This Google account is already linked to another user.",
                )
            
            # Connect Google account
            current_user.oauth_provider = "google"
            current_user.oauth_id = google_id
            if google_user.get("picture") and not current_user.avatar_url:
                current_user.avatar_url = google_user["picture"]
            
            await db.commit()
            await db.refresh(current_user)
            
            return UserResponse.model_validate(current_user)
            
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to connect Google account: {str(e)}",
        )


@router.post("/me/disconnect-google", response_model=UserResponse)
async def disconnect_google_account(
    current_user: CurrentActiveUser,
    db: DBSession,
):
    """
    Disconnect Google account from user.
    
    User must have a password set before disconnecting Google.
    """
    # Check if Google is connected
    if not current_user.has_google:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Google account is not connected.",
        )
    
    # Check if user has a password (must have at least one login method)
    if not current_user.has_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You must set a password before disconnecting Google. Otherwise, you won't be able to login.",
        )
    
    # Disconnect Google
    current_user.oauth_provider = None
    current_user.oauth_id = None
    
    await db.commit()
    await db.refresh(current_user)
    
    return UserResponse.model_validate(current_user)

