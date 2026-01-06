"""
API v1 Router - Combines all endpoint routers
"""
from fastapi import APIRouter

from app.api.v1.endpoints import auth, users, videos, credits, orders, health, admin_api_keys


api_router = APIRouter()

# Include all endpoint routers
api_router.include_router(
    health.router,
    prefix="/health",
    tags=["Health"],
)

api_router.include_router(
    auth.router,
    prefix="/auth",
    tags=["Authentication"],
)

api_router.include_router(
    users.router,
    prefix="/users",
    tags=["Users"],
)

api_router.include_router(
    videos.router,
    prefix="/videos",
    tags=["Videos"],
)

api_router.include_router(
    credits.router,
    prefix="/credits",
    tags=["Credits"],
)

api_router.include_router(
    orders.router,
    prefix="/orders",
    tags=["Orders"],
)

# Admin endpoints
api_router.include_router(
    admin_api_keys.router,
    prefix="/admin/api-keys",
    tags=["Admin - API Keys"],
)
