"""
Admin Videos Endpoints
"""
from math import ceil
from typing import Optional
from uuid import UUID
from datetime import datetime

from fastapi import APIRouter, HTTPException, Query, status
from sqlalchemy import select, func, or_, desc
from sqlalchemy.orm import selectinload
from pydantic import BaseModel

from app.core.dependencies import CurrentAdminUser, DBSession
from app.models.video import Video, VideoStatus
from app.models.user import User


router = APIRouter()


class AdminVideoResponse(BaseModel):
    """Video response for admin."""
    id: str
    title: Optional[str] = None
    source_url: str
    youtube_id: Optional[str] = None
    user_id: str
    user_email: str
    user_name: Optional[str] = None
    status: str
    progress_percent: int = 0
    output_language: str
    voice_type: str
    credits_used: int
    duration_seconds: Optional[int] = None
    video_url: Optional[str] = None
    error_message: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class AdminVideoListResponse(BaseModel):
    """List response for admin videos."""
    videos: list[AdminVideoResponse]
    total: int
    page: int
    page_size: int
    total_pages: int


class AdminVideoUpdate(BaseModel):
    """Update video (admin)."""
    status: Optional[str] = None
    error_message: Optional[str] = None


@router.get("", response_model=AdminVideoListResponse)
async def list_videos(
    db: DBSession,
    current_user: CurrentAdminUser,
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=10, ge=1, le=100),
    search: Optional[str] = Query(default=None),
    status: Optional[str] = Query(default=None),
    user_id: Optional[str] = Query(default=None),
    sort_by: str = Query(default="created_at"),
    sort_order: str = Query(default="desc"),
):
    """
    List all videos (Admin only).
    
    - **search**: Search by title, URL, or user email
    - **status**: Filter by status (pending, processing, completed, failed)
    - **user_id**: Filter by user ID
    - **sort_by**: Sort by field (created_at, title, status)
    - **sort_order**: asc or desc
    """
    # Base query with user join
    query = select(Video).options(selectinload(Video.user))
    count_query = select(func.count(Video.id))
    
    # Search filter
    if search:
        search_filter = or_(
            Video.title.ilike(f"%{search}%"),
            Video.source_url.ilike(f"%{search}%"),
            Video.youtube_id.ilike(f"%{search}%"),
        )
        # Also search by user email - need subquery
        user_subquery = select(User.id).where(User.email.ilike(f"%{search}%"))
        search_filter = or_(search_filter, Video.user_id.in_(user_subquery))
        query = query.where(search_filter)
        count_query = count_query.where(search_filter)
    
    # Status filter
    if status:
        query = query.where(Video.status == status)
        count_query = count_query.where(Video.status == status)
    
    # User filter
    if user_id:
        try:
            uid = UUID(user_id)
            query = query.where(Video.user_id == uid)
            count_query = count_query.where(Video.user_id == uid)
        except ValueError:
            pass
    
    # Get total count
    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0
    
    # Sorting
    sort_column = getattr(Video, sort_by, Video.created_at)
    if sort_order == "desc":
        query = query.order_by(desc(sort_column))
    else:
        query = query.order_by(sort_column)
    
    # Pagination
    offset = (page - 1) * page_size
    query = query.offset(offset).limit(page_size)
    
    # Execute
    result = await db.execute(query)
    videos = result.scalars().all()
    
    # Format response
    video_responses = []
    for video in videos:
        video_responses.append(
            AdminVideoResponse(
                id=str(video.id),
                title=video.title or video.source_title,
                source_url=video.source_url,
                youtube_id=video.youtube_id,
                user_id=str(video.user_id),
                user_email=video.user.email if video.user else "Unknown",
                user_name=video.user.name if video.user else None,
                status=video.status,
                progress_percent=video.progress_percent,
                output_language=video.output_language,
                voice_type=video.voice_type,
                credits_used=video.credits_used,
                duration_seconds=video.duration_seconds,
                video_url=video.video_url,
                error_message=video.error_message,
                created_at=video.created_at,
                updated_at=video.updated_at,
            )
        )
    
    return AdminVideoListResponse(
        videos=video_responses,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=ceil(total / page_size) if total > 0 else 1,
    )


@router.get("/{video_id}", response_model=AdminVideoResponse)
async def get_video(
    video_id: UUID,
    db: DBSession,
    current_user: CurrentAdminUser,
):
    """
    Get video details (Admin only).
    """
    result = await db.execute(
        select(Video)
        .options(selectinload(Video.user))
        .where(Video.id == video_id)
    )
    video = result.scalar_one_or_none()
    
    if not video:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Video not found",
        )
    
    return AdminVideoResponse(
        id=str(video.id),
        title=video.title or video.source_title,
        source_url=video.source_url,
        youtube_id=video.youtube_id,
        user_id=str(video.user_id),
        user_email=video.user.email if video.user else "Unknown",
        user_name=video.user.name if video.user else None,
        status=video.status,
        progress_percent=video.progress_percent,
        output_language=video.output_language,
        voice_type=video.voice_type,
        credits_used=video.credits_used,
        duration_seconds=video.duration_seconds,
        video_url=video.video_url,
        error_message=video.error_message,
        created_at=video.created_at,
        updated_at=video.updated_at,
    )


@router.patch("/{video_id}", response_model=AdminVideoResponse)
async def update_video(
    video_id: UUID,
    update_data: AdminVideoUpdate,
    db: DBSession,
    current_user: CurrentAdminUser,
):
    """
    Update video (Admin only).
    """
    result = await db.execute(
        select(Video)
        .options(selectinload(Video.user))
        .where(Video.id == video_id)
    )
    video = result.scalar_one_or_none()
    
    if not video:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Video not found",
        )
    
    # Update fields
    if update_data.status is not None:
        video.status = update_data.status
    if update_data.error_message is not None:
        video.error_message = update_data.error_message
    
    await db.commit()
    await db.refresh(video)
    
    return AdminVideoResponse(
        id=str(video.id),
        title=video.title or video.source_title,
        source_url=video.source_url,
        youtube_id=video.youtube_id,
        user_id=str(video.user_id),
        user_email=video.user.email if video.user else "Unknown",
        user_name=video.user.name if video.user else None,
        status=video.status,
        progress_percent=video.progress_percent,
        output_language=video.output_language,
        voice_type=video.voice_type,
        credits_used=video.credits_used,
        duration_seconds=video.duration_seconds,
        video_url=video.video_url,
        error_message=video.error_message,
        created_at=video.created_at,
        updated_at=video.updated_at,
    )


@router.delete("/{video_id}")
async def delete_video(
    video_id: UUID,
    db: DBSession,
    current_user: CurrentAdminUser,
):
    """
    Delete video (Admin only).
    """
    result = await db.execute(
        select(Video).where(Video.id == video_id)
    )
    video = result.scalar_one_or_none()
    
    if not video:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Video not found",
        )
    
    await db.delete(video)
    await db.commit()
    
    return {"message": "Video deleted successfully"}
