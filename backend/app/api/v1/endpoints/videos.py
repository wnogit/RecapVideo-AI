"""
Video Endpoints
"""
from math import ceil
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, HTTPException, Query, status
from sqlalchemy import func, select
from loguru import logger

from app.core.dependencies import CurrentActiveUser, DBSession
from app.models.video import Video, VideoStatus
from app.models.credit import CreditTransaction, TransactionType
from app.schemas.video import (
    VideoCreate,
    VideoResponse,
    VideoListResponse,
)
from app.utils.youtube import (
    validate_youtube_shorts_url,
    get_video_duration,
    validate_video_duration,
    MAX_VIDEO_DURATION_SECONDS,
)
from app.tasks.video_tasks import process_video_task


router = APIRouter()


# Credits per video
CREDITS_PER_VIDEO = 2


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
    - **options**: Video processing options (copyright, subtitles, logo, outro)
    
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
    
    # VP8 FIX: Validate video duration BEFORE credit deduction
    try:
        duration = await get_video_duration(video_id)
        if duration:
            is_valid_duration, duration_error = validate_video_duration(duration)
            if not is_valid_duration:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail={
                        "code": "VIDEO_TOO_LONG",
                        "message": duration_error or f"Video သည် {duration}s ရှိပြီး အများဆုံး {MAX_VIDEO_DURATION_SECONDS}s (5 min) သာ ခွင့်ပြုပါတယ်။",
                        "duration": duration,
                        "max_duration": MAX_VIDEO_DURATION_SECONDS,
                    }
                )
            logger.info(f"Video duration validated: {duration}s")
    except HTTPException:
        raise
    except Exception as e:
        # Don't block if duration check fails - will be checked during processing
        logger.warning(f"Could not validate video duration: {e}")
    
    # Check for duplicate video (same YouTube ID, same user, not failed/cancelled)
    existing_video = await db.execute(
        select(Video).where(
            Video.youtube_id == video_id,
            Video.user_id == current_user.id,
            Video.status.notin_([VideoStatus.FAILED.value, VideoStatus.CANCELLED.value])
        )
    )
    if existing_video.scalars().first():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={
                "code": "DUPLICATE_VIDEO",
                "message": "This video is already being processed or completed. Check your video list.",
            }
        )
    
    # Lock user row to prevent race condition in credit deduction
    from app.models.user import User
    user_result = await db.execute(
        select(User).where(User.id == current_user.id).with_for_update()
    )
    user = user_result.scalar_one()
    
    # Check credits - allow daily free video if no credits
    use_daily_free = False
    if user.credit_balance < CREDITS_PER_VIDEO:
        # Check if daily free video is available
        from app.services.daily_credit_service import daily_credit_service
        can_use_free, free_message = await daily_credit_service.can_use_free_video(db, str(user.id))
        
        if can_use_free:
            use_daily_free = True
            logger.info(f"User {user.email} using daily free video")
        else:
            raise HTTPException(
                status_code=status.HTTP_402_PAYMENT_REQUIRED,
                detail={
                    "code": "INSUFFICIENT_CREDITS",
                    "message": f"Credit မလုံလောက်ပါ။ လိုအပ်သည်: {CREDITS_PER_VIDEO}, ရှိသည်: {user.credit_balance}။ {free_message}",
                    "required": CREDITS_PER_VIDEO,
                    "available": user.credit_balance,
                    "daily_free_message": free_message,
                }
            )
    
    # Convert options to dict for JSONB storage
    options_dict = video_data.options.model_dump() if video_data.options else None
    
    # Create video
    video = Video(
        user_id=current_user.id,
        source_url=video_data.source_url,
        youtube_id=video_id,
        voice_type=video_data.voice_type,
        output_language=video_data.output_language,
        output_resolution=video_data.output_resolution,
        options=options_dict,
        credits_used=0 if use_daily_free else CREDITS_PER_VIDEO,
    )
    
    db.add(video)
    
    # Deduct credits or mark daily free as used
    if use_daily_free:
        # Mark daily free as used
        from app.services.daily_credit_service import daily_credit_service
        await daily_credit_service.use_free_video(db, str(user.id))
        
        # Record transaction for tracking
        transaction = CreditTransaction(
            user_id=current_user.id,
            transaction_type=TransactionType.USAGE.value,
            amount=0,
            balance_after=user.credit_balance,
            reference_type="video",
            reference_id=str(video.id),
            description=f"Daily free video: YouTube Shorts {video_id}",
        )
        db.add(transaction)
    else:
        # Deduct credits from locked user object - use trial credits first, then purchased
        user.credit_balance -= CREDITS_PER_VIDEO
        
        # Track purchased credits deduction properly
        # Trial credits are used first (trial = balance - purchased)
        if user.purchased_credits > 0:
            trial_credits_before = (user.credit_balance + CREDITS_PER_VIDEO) - user.purchased_credits
            if trial_credits_before < CREDITS_PER_VIDEO:
                # Some or all credits come from purchased
                credits_from_purchased = min(CREDITS_PER_VIDEO - max(0, trial_credits_before), user.purchased_credits)
                user.purchased_credits -= credits_from_purchased
        
        # Record transaction
        transaction = CreditTransaction(
            user_id=current_user.id,
            transaction_type=TransactionType.USAGE.value,
            amount=-CREDITS_PER_VIDEO,
            balance_after=user.credit_balance,
            reference_type="video",
            reference_id=str(video.id),
            description=f"Video creation: YouTube Shorts {video_id}",
        )
        db.add(transaction)
    
    await db.flush()
    await db.refresh(video)
    
    # Queue video processing via Celery (survives server restarts)
    process_video_task.delay(str(video.id))
    
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
