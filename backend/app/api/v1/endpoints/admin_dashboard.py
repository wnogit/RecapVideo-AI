"""
Admin Dashboard Endpoints
"""
from datetime import datetime, timedelta, timezone
from typing import Optional
from pydantic import BaseModel

from fastapi import APIRouter
from sqlalchemy import select, func, and_
from sqlalchemy.orm import selectinload

from app.core.dependencies import CurrentAdminUser, DBSession
from app.models.user import User
from app.models.video import Video, VideoStatus
from app.models.order import Order


router = APIRouter()


class DashboardStats(BaseModel):
    """Dashboard statistics."""
    total_users: int
    total_videos: int
    total_orders: int
    total_revenue: float
    new_users_today: int
    videos_today: int
    pending_orders: int
    # Growth percentages (compared to last month)
    users_growth: float = 0
    videos_growth: float = 0
    orders_growth: float = 0
    revenue_growth: float = 0


class RecentUser(BaseModel):
    """Recent user for dashboard."""
    id: str
    email: str
    full_name: str
    avatar_url: Optional[str] = None
    created_at: datetime
    
    class Config:
        from_attributes = True


class RecentVideo(BaseModel):
    """Recent video for dashboard."""
    id: str
    title: Optional[str] = None
    source_url: str
    user_email: str
    status: str
    created_at: datetime
    
    class Config:
        from_attributes = True


@router.get("/stats", response_model=DashboardStats)
async def get_dashboard_stats(
    db: DBSession,
    current_user: CurrentAdminUser,
):
    """
    Get dashboard statistics (Admin only).
    """
    now = datetime.now(timezone.utc)
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    last_month_start = (now - timedelta(days=30)).replace(hour=0, minute=0, second=0, microsecond=0)
    two_months_ago = (now - timedelta(days=60)).replace(hour=0, minute=0, second=0, microsecond=0)
    
    # Total counts
    total_users_result = await db.execute(select(func.count(User.id)))
    total_users = total_users_result.scalar() or 0
    
    total_videos_result = await db.execute(select(func.count(Video.id)))
    total_videos = total_videos_result.scalar() or 0
    
    total_orders_result = await db.execute(select(func.count(Order.id)))
    total_orders = total_orders_result.scalar() or 0
    
    # Total revenue (completed orders)
    revenue_result = await db.execute(
        select(func.coalesce(func.sum(Order.price_usd), 0)).where(Order.status == "completed")
    )
    total_revenue = float(revenue_result.scalar() or 0)
    
    # Today's counts
    new_users_today_result = await db.execute(
        select(func.count(User.id)).where(User.created_at >= today_start)
    )
    new_users_today = new_users_today_result.scalar() or 0
    
    videos_today_result = await db.execute(
        select(func.count(Video.id)).where(Video.created_at >= today_start)
    )
    videos_today = videos_today_result.scalar() or 0
    
    # Pending orders - count orders awaiting admin approval
    pending_orders_result = await db.execute(
        select(func.count(Order.id)).where(Order.status == "pending")
    )
    pending_orders = pending_orders_result.scalar() or 0
    
    # Calculate growth (last 30 days vs previous 30 days)
    # Users growth
    users_last_month_result = await db.execute(
        select(func.count(User.id)).where(User.created_at >= last_month_start)
    )
    users_last_month = users_last_month_result.scalar() or 0
    
    users_prev_month_result = await db.execute(
        select(func.count(User.id)).where(
            and_(User.created_at >= two_months_ago, User.created_at < last_month_start)
        )
    )
    users_prev_month = users_prev_month_result.scalar() or 1  # Avoid division by zero
    users_growth = ((users_last_month - users_prev_month) / users_prev_month) * 100 if users_prev_month > 0 else 0
    
    # Videos growth
    videos_last_month_result = await db.execute(
        select(func.count(Video.id)).where(Video.created_at >= last_month_start)
    )
    videos_last_month = videos_last_month_result.scalar() or 0
    
    videos_prev_month_result = await db.execute(
        select(func.count(Video.id)).where(
            and_(Video.created_at >= two_months_ago, Video.created_at < last_month_start)
        )
    )
    videos_prev_month = videos_prev_month_result.scalar() or 1
    videos_growth = ((videos_last_month - videos_prev_month) / videos_prev_month) * 100 if videos_prev_month > 0 else 0
    
    # Orders growth
    orders_last_month_result = await db.execute(
        select(func.count(Order.id)).where(Order.created_at >= last_month_start)
    )
    orders_last_month = orders_last_month_result.scalar() or 0
    
    orders_prev_month_result = await db.execute(
        select(func.count(Order.id)).where(
            and_(Order.created_at >= two_months_ago, Order.created_at < last_month_start)
        )
    )
    orders_prev_month = orders_prev_month_result.scalar() or 1
    orders_growth = ((orders_last_month - orders_prev_month) / orders_prev_month) * 100 if orders_prev_month > 0 else 0
    
    # Revenue growth
    revenue_last_month_result = await db.execute(
        select(func.coalesce(func.sum(Order.price_usd), 0)).where(
            and_(Order.status == "completed", Order.created_at >= last_month_start)
        )
    )
    revenue_last_month = float(revenue_last_month_result.scalar() or 0)
    
    revenue_prev_month_result = await db.execute(
        select(func.coalesce(func.sum(Order.price_usd), 0)).where(
            and_(
                Order.status == "completed",
                Order.created_at >= two_months_ago,
                Order.created_at < last_month_start
            )
        )
    )
    revenue_prev_month = float(revenue_prev_month_result.scalar() or 1)
    revenue_growth = ((revenue_last_month - revenue_prev_month) / revenue_prev_month) * 100 if revenue_prev_month > 0 else 0
    
    return DashboardStats(
        total_users=total_users,
        total_videos=total_videos,
        total_orders=total_orders,
        total_revenue=total_revenue,
        new_users_today=new_users_today,
        videos_today=videos_today,
        pending_orders=pending_orders,
        users_growth=round(users_growth, 1),
        videos_growth=round(videos_growth, 1),
        orders_growth=round(orders_growth, 1),
        revenue_growth=round(revenue_growth, 1),
    )


@router.get("/recent-users", response_model=list[RecentUser])
async def get_recent_users(
    db: DBSession,
    current_user: CurrentAdminUser,
    limit: int = 5,
):
    """
    Get recently registered users (Admin only).
    """
    result = await db.execute(
        select(User)
        .order_by(User.created_at.desc())
        .limit(limit)
    )
    users = result.scalars().all()
    
    return [
        RecentUser(
            id=str(user.id),
            email=user.email,
            full_name=user.name or user.email.split("@")[0],
            avatar_url=user.avatar_url,
            created_at=user.created_at,
        )
        for user in users
    ]


@router.get("/recent-videos", response_model=list[RecentVideo])
async def get_recent_videos(
    db: DBSession,
    current_user: CurrentAdminUser,
    limit: int = 5,
):
    """
    Get recently created videos (Admin only).
    """
    result = await db.execute(
        select(Video)
        .options(selectinload(Video.user))
        .order_by(Video.created_at.desc())
        .limit(limit)
    )
    videos = result.scalars().all()
    
    return [
        RecentVideo(
            id=str(video.id),
            title=video.title or video.source_title or "Untitled Video",
            source_url=video.source_url,
            user_email=video.user.email if video.user else "Unknown",
            status=video.status,
            created_at=video.created_at,
        )
        for video in videos
    ]
