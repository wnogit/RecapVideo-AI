"""
Video Processing Celery Tasks

These tasks run in Celery workers, not in the FastAPI process.
This ensures video processing survives server restarts.
"""
import asyncio
from celery import shared_task
from loguru import logger


def run_async(coro):
    """Helper to run async code in sync Celery task."""
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    try:
        return loop.run_until_complete(coro)
    finally:
        loop.close()


@shared_task(
    bind=True,
    name="process_video",
    max_retries=3,
    default_retry_delay=60,
    autoretry_for=(Exception,),
    retry_backoff=True,
    retry_jitter=True,
)
def process_video_task(self, video_id: str):
    """
    Process a video in Celery worker.
    
    This task:
    1. Extracts transcript from YouTube
    2. Generates recap script with AI
    3. Generates audio with TTS
    4. Renders final video with FFmpeg
    5. Uploads to Cloudflare R2
    
    Args:
        video_id: UUID of the video to process
    """
    logger.info(f"[Celery] Starting video processing: {video_id}")
    
    try:
        # Import here to avoid circular imports
        from app.processing.video_processor import VideoProcessor
        
        processor = VideoProcessor()
        run_async(processor.process(video_id))
        
        logger.info(f"[Celery] Completed video processing: {video_id}")
        return {"status": "completed", "video_id": video_id}
        
    except Exception as e:
        logger.error(f"[Celery] Video processing failed: {video_id}, Error: {e}")
        
        # Update video status to failed
        try:
            from app.core.database import async_session_maker
            from app.models.video import Video, VideoStatus
            from sqlalchemy import select
            
            async def mark_failed():
                async with async_session_maker() as db:
                    result = await db.execute(
                        select(Video).where(Video.id == video_id)
                    )
                    video = result.scalar_one_or_none()
                    if video:
                        video.status = VideoStatus.FAILED.value
                        video.error_message = str(e)
                        await db.commit()
            
            run_async(mark_failed())
        except Exception as db_error:
            logger.error(f"Failed to update video status: {db_error}")
        
        # Re-raise for Celery retry mechanism
        raise


@shared_task(name="cleanup_temp_files")
def cleanup_temp_files_task():
    """Periodic task to clean up old temporary files."""
    import shutil
    from pathlib import Path
    from datetime import datetime, timedelta
    from app.core.config import settings
    
    temp_dir = Path(settings.TEMP_FILES_DIR)
    if not temp_dir.exists():
        return
    
    cutoff = datetime.now() - timedelta(hours=24)
    cleaned = 0
    
    for item in temp_dir.iterdir():
        if item.is_dir():
            # Check modification time
            mtime = datetime.fromtimestamp(item.stat().st_mtime)
            if mtime < cutoff:
                try:
                    shutil.rmtree(item)
                    cleaned += 1
                except Exception as e:
                    logger.warning(f"Failed to clean {item}: {e}")
    
    logger.info(f"Cleaned up {cleaned} temporary directories")
    return {"cleaned": cleaned}
