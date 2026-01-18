"""
API v1 Router - Combines all endpoint routers
"""
from fastapi import APIRouter

from app.api.v1.endpoints import auth, users, videos, credits, orders, health, admin_api_keys, admin_orders, admin_users, admin_dashboard, admin_videos, admin_prompts, telegram, voices, uploads, payment_methods, credit_packages, sessions, site_settings, referral


api_router = APIRouter()

# Include all endpoint routers
api_router.include_router(
    referral.router,
    prefix="/referral",
    tags=["Referral"],
)
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
    sessions.router,
    prefix="/users",
    tags=["User Sessions"],
)

api_router.include_router(
    videos.router,
    prefix="/videos",
    tags=["Videos"],
)

api_router.include_router(
    voices.router,
    prefix="/voices",
    tags=["Voices"],
)

api_router.include_router(
    uploads.router,
    prefix="/uploads",
    tags=["Uploads"],
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

api_router.include_router(
    payment_methods.router,
    prefix="/payment-methods",
    tags=["Payment Methods"],
)

api_router.include_router(
    credit_packages.router,
    prefix="/credit-packages",
    tags=["Credit Packages"],
)

api_router.include_router(
    telegram.router,
    prefix="/telegram",
    tags=["Telegram"],
)

# Admin endpoints
api_router.include_router(
    admin_api_keys.router,
    prefix="/admin/api-keys",
    tags=["Admin - API Keys"],
)

api_router.include_router(
    admin_orders.router,
    prefix="/admin/orders",
    tags=["Admin - Orders"],
)

api_router.include_router(
    admin_users.router,
    prefix="/admin/users",
    tags=["Admin - Users"],
)

api_router.include_router(
    admin_dashboard.router,
    prefix="/admin/dashboard",
    tags=["Admin - Dashboard"],
)

api_router.include_router(
    admin_videos.router,
    prefix="/admin/videos",
    tags=["Admin - Videos"],
)

api_router.include_router(
    admin_prompts.router,
    prefix="/admin/prompts",
    tags=["Admin - Prompts"],
)

api_router.include_router(
    site_settings.router,
    tags=["Site Settings"],
)
