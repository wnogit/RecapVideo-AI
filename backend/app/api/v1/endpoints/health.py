"""
Health Check Endpoints
"""
from fastapi import APIRouter
from pydantic import BaseModel


router = APIRouter()


class HealthResponse(BaseModel):
    """Health check response."""
    status: str
    version: str
    environment: str


@router.get("", response_model=HealthResponse)
async def health_check():
    """Check API health status."""
    from app.core.config import settings
    
    return HealthResponse(
        status="healthy",
        version="3.0.0",
        environment=settings.ENVIRONMENT,
    )


@router.get("/ready")
async def readiness_check():
    """Check if API is ready to serve requests."""
    # Could add database connectivity check here
    return {"status": "ready"}


@router.get("/live")
async def liveness_check():
    """Check if API is alive."""
    return {"status": "alive"}
