"""
RecapVideo.AI - FastAPI Main Application
"""
import asyncio
from contextlib import asynccontextmanager
from pathlib import Path
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.staticfiles import StaticFiles
from loguru import logger
from sqlalchemy import select

from app.core.config import settings
from app.api.v1.router import api_router
from app.core.database import engine, Base, async_session_maker


async def resume_pending_videos():
    """
    Resume processing of videos that were interrupted by server restart.
    
    Uses Celery to queue interrupted videos for reliable processing.
    Videos in 'processing' or 'pending' state will be re-queued.
    """
    from app.models.video import Video, VideoStatus
    from app.tasks.video_tasks import process_video_task
    
    try:
        async with async_session_maker() as db:
            # Find interrupted videos (processing or pending)
            result = await db.execute(
                select(Video).where(
                    Video.status.in_([
                        VideoStatus.PENDING.value,
                        VideoStatus.EXTRACTING_TRANSCRIPT.value,
                        VideoStatus.GENERATING_SCRIPT.value,
                        VideoStatus.GENERATING_AUDIO.value,
                        VideoStatus.RENDERING_VIDEO.value,
                    ])
                )
            )
            pending_videos = result.scalars().all()
            
            if pending_videos:
                logger.info(f"Found {len(pending_videos)} pending videos to resume")
                
                for video in pending_videos:
                    # Reset to pending to restart from beginning
                    video.status = VideoStatus.PENDING.value
                    video.status_message = "Resumed after server restart"
                    video.progress_percent = 0
                    
                await db.commit()
                
                # Re-queue each video via Celery (reliable)
                for video in pending_videos:
                    logger.info(f"Resuming video via Celery: {video.id}")
                    process_video_task.delay(str(video.id))
            else:
                logger.info("No pending videos to resume")
                
    except Exception as e:
        logger.error(f"Failed to resume pending videos: {e}")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events."""
    # Startup
    logger.info("Starting RecapVideo.AI Backend v3.0.0")
    logger.info(f"Environment: {settings.ENVIRONMENT}")
    
    # Create database tables (use Alembic in production)
    if settings.ENVIRONMENT == "development":
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        logger.info("Database tables created")
    
    # Resume pending video processing jobs
    await resume_pending_videos()
    
    yield
    
    # Shutdown
    logger.info("Shutting down RecapVideo.AI Backend")
    await engine.dispose()


def create_application() -> FastAPI:
    """Create and configure FastAPI application."""
    app = FastAPI(
        title=settings.PROJECT_NAME,
        description="AI-Powered Video Recap Generator",
        version="3.0.0",
        docs_url="/api/docs" if settings.ENVIRONMENT != "production" else None,
        redoc_url="/api/redoc" if settings.ENVIRONMENT != "production" else None,
        openapi_url="/api/openapi.json" if settings.ENVIRONMENT != "production" else None,
        lifespan=lifespan,
    )
    
    # CORS Middleware
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    
    # Gzip Middleware
    app.add_middleware(GZipMiddleware, minimum_size=1000)
    
    # Include API router
    app.include_router(api_router, prefix="/api/v1")
    
    # Health check endpoint
    @app.get("/health")
    async def health_check():
        return {"status": "healthy", "version": "3.0.0"}
    
    # Mount static files for payment screenshots
    static_dir = Path("static")
    static_dir.mkdir(exist_ok=True)
    (static_dir / "payment_screenshots").mkdir(exist_ok=True)
    (static_dir / "payment_qr").mkdir(exist_ok=True)
    app.mount("/static", StaticFiles(directory="static"), name="static")
    
    return app


app = create_application()


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.ENVIRONMENT == "development",
    )
