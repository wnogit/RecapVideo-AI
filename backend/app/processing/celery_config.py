"""
Celery Configuration - Foundation for worker scaling

This module sets up Celery for background task processing.
Currently not enabled in single-VPS mode but ready for scaling.
"""
from celery import Celery

from app.core.config import settings


# Create Celery app
celery_app = Celery(
    "recapvideo",
    broker=settings.REDIS_URL,
    backend=settings.REDIS_URL,
)

# Celery configuration
celery_app.conf.update(
    # Task settings
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    
    # Task execution settings
    task_acks_late=True,
    task_reject_on_worker_lost=True,
    
    # Worker settings
    worker_prefetch_multiplier=1,
    worker_concurrency=2,  # Adjust based on CPU cores
    
    # Result backend settings
    result_expires=3600,  # 1 hour
    
    # Task routing
    task_routes={
        "app.processing.tasks.process_video": {"queue": "video_processing"},
        "app.processing.tasks.send_email": {"queue": "emails"},
    },
    
    # Rate limiting
    task_annotations={
        "app.processing.tasks.process_video": {
            "rate_limit": "10/m",  # Max 10 videos per minute
        },
    },
)


# Task autodiscovery
celery_app.autodiscover_tasks(["app.processing"])


# Optional: Configure logging
# celery_app.conf.update(
#     worker_hijack_root_logger=False,
# )
