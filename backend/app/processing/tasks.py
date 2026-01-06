"""
Celery Tasks - Background task definitions

These tasks will be processed by Celery workers when scaling is enabled.
"""
import asyncio
from loguru import logger

from app.processing.celery_config import celery_app


def run_async(coro):
    """Helper to run async functions in sync context."""
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    try:
        return loop.run_until_complete(coro)
    finally:
        loop.close()


@celery_app.task(
    bind=True,
    max_retries=3,
    default_retry_delay=60,  # 1 minute
)
def process_video(self, video_id: str):
    """
    Celery task for video processing.
    
    Args:
        video_id: UUID of the video to process
    
    This task will:
    1. Extract transcript from YouTube
    2. Generate script using Gemini
    3. Generate audio using Edge-TTS
    4. Render video with ffmpeg
    5. Upload to Cloudflare R2
    """
    logger.info(f"Celery task: Processing video {video_id}")
    
    try:
        from app.processing.video_processor import process_video_task
        result = run_async(process_video_task(video_id))
        
        if not result:
            logger.warning(f"Video processing returned False: {video_id}")
            
        return result
        
    except Exception as e:
        logger.error(f"Celery task failed: {e}")
        
        # Retry with exponential backoff
        raise self.retry(exc=e, countdown=60 * (2 ** self.request.retries))


@celery_app.task
def send_email(email_type: str, **kwargs):
    """
    Celery task for sending emails.
    
    Args:
        email_type: Type of email (welcome, password_reset, video_complete)
        **kwargs: Email-specific parameters
    """
    logger.info(f"Celery task: Sending {email_type} email")
    
    try:
        from app.services.email_service import email_service
        
        if email_type == "welcome":
            result = run_async(email_service.send_welcome_email(
                to=kwargs["to"],
                name=kwargs["name"],
            ))
        elif email_type == "password_reset":
            result = run_async(email_service.send_password_reset_email(
                to=kwargs["to"],
                reset_token=kwargs["reset_token"],
            ))
        elif email_type == "video_complete":
            result = run_async(email_service.send_video_complete_email(
                to=kwargs["to"],
                name=kwargs["name"],
                video_title=kwargs["video_title"],
                video_url=kwargs["video_url"],
            ))
        else:
            logger.warning(f"Unknown email type: {email_type}")
            result = False
        
        return result
        
    except Exception as e:
        logger.error(f"Email task failed: {e}")
        raise


@celery_app.task
def cleanup_temp_files():
    """
    Periodic task to clean up temporary files older than 1 hour.
    
    Schedule this in Celery Beat:
    celery_app.conf.beat_schedule = {
        'cleanup-temp-files': {
            'task': 'app.processing.tasks.cleanup_temp_files',
            'schedule': 3600.0,  # Every hour
        },
    }
    """
    import os
    import time
    from pathlib import Path
    from app.core.config import settings
    
    logger.info("Running temp file cleanup")
    
    temp_dir = Path(settings.TEMP_FILES_DIR)
    if not temp_dir.exists():
        return
    
    now = time.time()
    one_hour_ago = now - 3600
    
    cleaned = 0
    for file in temp_dir.iterdir():
        if file.is_file() and file.stat().st_mtime < one_hour_ago:
            try:
                file.unlink()
                cleaned += 1
            except Exception as e:
                logger.warning(f"Failed to delete {file}: {e}")
    
    logger.info(f"Cleaned up {cleaned} temp files")
    return cleaned
