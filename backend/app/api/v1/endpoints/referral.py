"""
Referral Endpoints - API for referral system.
"""
from typing import Optional

from fastapi import APIRouter, HTTPException, status, Request
from pydantic import BaseModel
from loguru import logger

from app.core.dependencies import DBSession, CurrentUser
from app.services.referral_service import referral_service
from app.services.daily_credit_service import daily_credit_service


router = APIRouter()


# ============ Schemas ============

class ReferralCodeResponse(BaseModel):
    referral_code: str
    referral_link: str


class ReferralStatsResponse(BaseModel):
    referral_code: str
    referral_count: int
    credits_earned: int
    referral_link: str


class DailyFreeStatusResponse(BaseModel):
    can_use: bool
    next_reset: str
    message: str


class ValidateReferralRequest(BaseModel):
    referral_code: str


class ValidateReferralResponse(BaseModel):
    valid: bool
    message: str


# ============ Referral Endpoints ============

@router.get("/code", response_model=ReferralCodeResponse)
async def get_referral_code(
    db: DBSession,
    current_user: CurrentUser,
):
    """
    Get current user's referral code.
    Creates one if it doesn't exist.
    
    သင့်ရဲ့ Referral code ကို ရယူပါ။
    """
    code = await referral_service.get_or_create_referral_code(db, str(current_user.id))
    
    return ReferralCodeResponse(
        referral_code=code,
        referral_link=f"https://recapvideo.ai/signup?ref={code}",
    )


@router.get("/stats", response_model=ReferralStatsResponse)
async def get_referral_stats(
    db: DBSession,
    current_user: CurrentUser,
):
    """
    Get referral statistics for current user.
    
    သင့်ရဲ့ Referral စာရင်းအင်း ကို ကြည့်ရှုပါ။
    """
    stats = await referral_service.get_referral_stats(db, str(current_user.id))
    
    if "error" in stats:
        raise HTTPException(status_code=404, detail=stats["error"])
    
    return ReferralStatsResponse(**stats)


@router.post("/validate", response_model=ValidateReferralResponse)
async def validate_referral_code(
    request: Request,
    body: ValidateReferralRequest,
    db: DBSession,
):
    """
    Validate a referral code (public endpoint).
    Used during signup to check if code is valid.
    
    Referral code မှန်/မမှန် စစ်ဆေးပါ။
    """
    # Get client IP for abuse checking
    client_ip = request.headers.get("X-Forwarded-For", "").split(",")[0].strip()
    if not client_ip:
        client_ip = request.headers.get("X-Real-IP", "")
    if not client_ip and request.client:
        client_ip = request.client.host
    
    device_id = request.headers.get("X-Device-ID")
    
    is_valid, message, _ = await referral_service.validate_referral(
        db=db,
        referral_code=body.referral_code,
        new_user_ip=client_ip,
        new_user_device_id=device_id,
    )
    
    return ValidateReferralResponse(valid=is_valid, message=message)


# ============ Daily Free Video Endpoints ============

@router.get("/daily-free/status", response_model=DailyFreeStatusResponse)
async def get_daily_free_status(
    db: DBSession,
    current_user: CurrentUser,
):
    """
    Get daily free video status for current user.
    
    နေ့စဥ် free video အခြေအနေ ကို ကြည့်ရှုပါ။
    """
    status = await daily_credit_service.get_free_video_status(db, str(current_user.id))
    return DailyFreeStatusResponse(**status)
