"""
Video Endpoints
"""
import re
from math import ceil
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, HTTPException, Query, status
from sqlalchemy import func, select

from app.core.dependencies import CurrentActiveUser, DBSession
from app.models.video import Video, VideoStatus
from app.models.credit import CreditTransaction, TransactionType
from app.schemas.video import (
    VideoCreate,
    VideoResponse,
    VideoListResponse,
)


router = APIRouter()


# Credits per video
CREDITS_PER_VIDEO = 2

# YouTube Shorts URL patterns
YOUTUBE_SHORTS_PATTERNS = [
    r'^https?://(?:www\.)?youtube\.com/shorts/([a-zA-Z0-9_-]{11})(?:\?.*)?$',
    r'^https?://m\.youtube\.com/shorts/([a-zA-Z0-9_-]{11})(?:\?.*)?$',
]


def validate_youtube_shorts_url(url: str) -> tuple[bool, str | None]:
    """
    Validate that URL is a YouTube Shorts URL.
    
    Returns:
        (is_valid, video_id or error_message)
    """
    url = url.strip()
    
    for pattern in YOUTUBE_SHORTS_PATTERNS:
        match = re.match(pattern, url)
        if match:
            return True, match.group(1)
    
    # Check if it's a regular YouTube video (to give specific error)
    regular_patterns = [
        r'^https?://(?:www\.)?youtube\.com/watch\?v=',
        r'^https?://youtu\.be/',
        r'^https?://(?:www\.)?youtube\.com/playlist',
    ]
    
    for pattern in regular_patterns:
        if re.match(pattern, url):
            return False, "Only YouTube Shorts are supported. Please use a youtube.com/shorts/ link."
    
    return False, "Invalid URL. Please enter a valid YouTube Shorts URL (youtube.com/shorts/...)"


@router.post("", response_model=VideoResponse, status_code=status.HTTP_201_CREATED)
async def create_video(
    video_data: VideoCreate,
    current_user: CurrentActiveUser,
    db: DBSession,
):
    """
    Create a new video generation request.
    
    - **source_url**: YouTube Shorts URL only (youtube.com/shorts/xxx)
    - **voice_type**: Voice for TTS (optional, defaults to Burmese female)
    - **output_language**: Output language code (optional, defaults to "my")
    - **output_resolution**: Output resolution (optional, defaults to "1080p")
    
    Cost: 2 credits per video
    """
    # Validate YouTube Shorts URL
    is_valid, result = validate_youtube_shorts_url(video_data.source_url)
    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "code": "INVALID_URL",
                "message": result,
            }
        )
    
    video_id = result  # YouTube video ID
    
    # Check credits
    if not current_user.can_create_video(CREDITS_PER_VIDEO):
        raise HTTPException(
            status_code=status.HTTP_402_PAYMENT_REQUIRED,
            detail={
                "code": "INSUFFICIENT_CREDITS",
                "message": f"Insufficient credits. Required: {CREDITS_PER_VIDEO}, Available: {current_user.credit_balance}",
                "required": CREDITS_PER_VIDEO,
                "available": current_user.credit_balance,
            }
        )
    
    # Create video
    video = Video(
        user_id=current_user.id,
        source_url=video_data.source_url,
        youtube_id=video_id,
        voice_type=video_data.voice_type,
        output_language=video_data.output_language,
        output_resolution=video_data.output_resolution,
        credits_used=CREDITS_PER_VIDEO,
    )
    
    db.add(video)
    
    # Deduct credits
    current_user.credit_balance -= CREDITS_PER_VIDEO
    
    # Record transaction
    transaction = CreditTransaction(
        user_id=current_user.id,
        transaction_type=TransactionType.USAGE.value,
        amount=-CREDITS_PER_VIDEO,
        balance_after=current_user.credit_balance,
        reference_type="video",
        reference_id=str(video.id),
        description=f"Video creation: YouTube Shorts {video_id}",
    )
    db.add(transaction)
    
    await db.flush()
    await db.refresh(video)
    
    # TODO: Queue video processing task
    # await queue_video_processing(video.id)
    
    return VideoResponse.model_validate(video)


@router.get("", response_model=VideoListResponse)
async def list_videos(
    current_user: CurrentActiveUser,
    db: DBSession,
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=50),
    status_filter: Optional[str] = Query(None, alias="status"),
):
    """
    List current user's videos with pagination.
    
    - **page**: Page number (default: 1)
    - **page_size**: Items per page (default: 10, max: 50)
    - **status**: Filter by status (optional)
    """
    # Build query
    query = select(Video).where(Video.user_id == current_user.id)
    
    if status_filter:
        query = query.where(Video.status == status_filter)
    
    # Get total count
    count_query = select(func.count()).select_from(query.subquery())
    total = await db.scalar(count_query)
    
    # Get paginated results
    query = query.order_by(Video.created_at.desc())
    query = query.offset((page - 1) * page_size).limit(page_size)
    
    result = await db.execute(query)
    videos = result.scalars().all()
    
    return VideoListResponse(
        videos=[VideoResponse.model_validate(v) for v in videos],
        total=total or 0,
        page=page,
        page_size=page_size,
        total_pages=ceil((total or 0) / page_size),
    )


@router.get("/{video_id}", response_model=VideoResponse)
async def get_video(
    video_id: UUID,
    current_user: CurrentActiveUser,
    db: DBSession,
):
    """
    Get a specific video by ID.
    """
    result = await db.execute(
        select(Video).where(
            Video.id == video_id,
            Video.user_id == current_user.id,
        )
    )
    video = result.scalar_one_or_none()
    
    if not video:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Video not found",
        )
    
    return VideoResponse.model_validate(video)


@router.delete("/{video_id}", status_code=status.HTTP_200_OK)
async def cancel_video(
    video_id: UUID,
    current_user: CurrentActiveUser,
    db: DBSession,
):
    """
    Cancel a pending video.
    
    Only videos in PENDING status can be cancelled.
    Credits will be refunded.
    """
    result = await db.execute(
        select(Video).where(
            Video.id == video_id,
            Video.user_id == current_user.id,
        )
    )
    video = result.scalar_one_or_none()
    
    if not video:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Video not found",
        )
    
    if video.status != VideoStatus.PENDING.value:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only pending videos can be cancelled",
        )
    
    # Cancel video
    video.status = VideoStatus.CANCELLED.value
    video.status_message = "Cancelled by user"
    
    # Refund credits
    if not video.credits_refunded:
        current_user.credit_balance += video.credits_used
        video.credits_refunded = True
        
        # Record refund transaction
        transaction = CreditTransaction(
            user_id=current_user.id,
            transaction_type=TransactionType.REFUND.value,
            amount=video.credits_used,
            balance_after=current_user.credit_balance,
            reference_type="video",
            reference_id=str(video.id),
            description="Video cancelled - credits refunded",
        )
        db.add(transaction)
    
    await db.flush()
    
    return {"message": "Video cancelled successfully", "credits_refunded": video.credits_used}
