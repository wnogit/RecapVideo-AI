"""
Celery Configuration for RecapVideo.AI

This provides reliable background task processing that survives server restarts.
Uses Redis as the message broker and result backend.
"""
from celery import Celery
from app.core.config import settings

# Create Celery app
celery_app = Celery(
    "recapvideo",
    broker=settings.REDIS_URL,
    backend=settings.REDIS_URL,
    include=["app.tasks.video_tasks"],
)

# Celery configuration
celery_app.conf.update(
    # Task settings
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="Asia/Yangon",
    enable_utc=True,
    
    # Task execution settings
    task_acks_late=True,  # Acknowledge after task completes (prevents loss)
    task_reject_on_worker_lost=True,  # Re-queue if worker dies
    worker_prefetch_multiplier=1,  # One task at a time per worker
    
    # Result settings
    result_expires=86400,  # 24 hours
    
    # Retry settings
    task_default_retry_delay=60,  # 1 minute
    task_max_retries=3,
    
    # Concurrency - adjust based on VPS resources
    worker_concurrency=2,  # 2 concurrent video tasks
    
    # Task time limits
    task_soft_time_limit=600,   # 10 minutes soft limit
    task_time_limit=900,        # 15 minutes hard limit
)

# Optional: Task routes for different queues
celery_app.conf.task_routes = {
    "app.tasks.video_tasks.*": {"queue": "video_processing"},
}
