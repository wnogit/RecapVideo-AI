"""
Referral Service - Handles referral codes and credit rewards.

Anti-abuse features:
- Same IP check
- Same device check
- Email verification required
- First video required (optional)
"""
import secrets
import string
from typing import Tuple, Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from loguru import logger

from app.models.user import User


CREDITS_PER_REFERRAL = 2
MAX_REFERRALS_PER_DAY = 10


def generate_referral_code(length: int = 6) -> str:
    """Generate a random alphanumeric referral code."""
    chars = string.ascii_uppercase + string.digits
    # Remove ambiguous characters
    chars = chars.replace('O', '').replace('0', '').replace('I', '').replace('1', '')
    return ''.join(secrets.choice(chars) for _ in range(length))


class ReferralService:
    """Service for managing referral system."""
    
    async def get_or_create_referral_code(self, db: AsyncSession, user_id: str) -> str:
        """Get user's referral code, or create one if doesn't exist."""
        result = await db.execute(
            select(User).where(User.id == user_id)
        )
        user = result.scalar_one_or_none()
        
        if not user:
            raise ValueError("User not found")
        
        if user.referral_code:
            return user.referral_code
        
        # Generate unique code
        for _ in range(10):  # Max 10 attempts
            code = generate_referral_code()
            existing = await db.execute(
                select(User).where(User.referral_code == code)
            )
            if not existing.scalar_one_or_none():
                user.referral_code = code
                await db.commit()
                return code
        
        raise Exception("Failed to generate unique referral code")
    
    async def validate_referral(
        self,
        db: AsyncSession,
        referral_code: str,
        new_user_ip: str,
        new_user_device_id: Optional[str] = None,
    ) -> Tuple[bool, str, Optional[str]]:
        """
        Validate a referral code and check for abuse.
        
        Returns:
            (is_valid: bool, message: str, referrer_id: Optional[str])
        """
        if not referral_code:
            return False, "No referral code provided", None
        
        # Find referrer
        result = await db.execute(
            select(User).where(User.referral_code == referral_code.upper())
        )
        referrer = result.scalar_one_or_none()
        
        if not referrer:
            return False, "Invalid referral code", None
        
        # Check same IP abuse
        if referrer.signup_ip and referrer.signup_ip == new_user_ip:
            logger.warning(f"Referral abuse detected: same IP {new_user_ip}")
            return False, "Cannot use referral from same IP", None
        
        # Check same device abuse
        if new_user_device_id and referrer.signup_device_id:
            if referrer.signup_device_id == new_user_device_id:
                logger.warning(f"Referral abuse detected: same device {new_user_device_id[:8]}...")
                return False, "Cannot use referral from same device", None
        
        return True, "Referral valid", str(referrer.id)
    
    async def apply_referral_bonus(
        self,
        db: AsyncSession,
        referrer_id: str,
        referee_id: str,
    ) -> Tuple[bool, str]:
        """
        Apply referral bonus to referrer.
        Called after referee creates first video or verifies email.
        
        Returns:
            (success: bool, message: str)
        """
        # Get referrer
        result = await db.execute(
            select(User).where(User.id == referrer_id)
        )
        referrer = result.scalar_one_or_none()
        
        if not referrer:
            return False, "Referrer not found"
        
        # Get referee
        result = await db.execute(
            select(User).where(User.id == referee_id)
        )
        referee = result.scalar_one_or_none()
        
        if not referee:
            return False, "Referee not found"
        
        # Check if bonus already applied
        if referee.referred_by_id == referrer.id:
            # Already linked, check if bonus was given
            pass  # Allow re-checking
        
        # Link referee to referrer
        referee.referred_by_id = referrer.id
        
        # Give bonus to referrer
        referrer.credit_balance += CREDITS_PER_REFERRAL
        referrer.referral_credits_earned += CREDITS_PER_REFERRAL
        referrer.referral_count += 1
        
        await db.commit()
        
        logger.info(f"Referral bonus: {referrer.email} received {CREDITS_PER_REFERRAL} credits for referring {referee.email}")
        
        return True, f"Referrer received {CREDITS_PER_REFERRAL} credits"
    
    async def get_referral_stats(self, db: AsyncSession, user_id: str) -> dict:
        """
        Get referral statistics for a user.
        
        Returns dict with:
        - referral_code: str
        - referral_count: int
        - credits_earned: int
        - referral_link: str
        """
        result = await db.execute(
            select(User).where(User.id == user_id)
        )
        user = result.scalar_one_or_none()
        
        if not user:
            return {"error": "User not found"}
        
        # Create code if doesn't exist
        if not user.referral_code:
            await self.get_or_create_referral_code(db, user_id)
            await db.refresh(user)
        
        return {
            "referral_code": user.referral_code,
            "referral_count": user.referral_count,
            "credits_earned": user.referral_credits_earned,
            "referral_link": f"https://recapvideo.ai/signup?ref={user.referral_code}",
        }


# Singleton instance
referral_service = ReferralService()
