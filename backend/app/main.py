"""
RecapVideo.AI - FastAPI Main Application
"""
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from loguru import logger

from app.core.config import settings
from app.api.v1.router import api_router
from app.core.database import engine, Base


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
