"""
Daily Credit Service - Handles daily free video logic for beta users.

Myanmar Standard Time (UTC+6:30) is used for daily reset.
"""
from datetime import datetime, timezone, timedelta
from typing import Tuple

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from loguru import logger

from app.models.user import User


# Myanmar is UTC+6:30
MYANMAR_UTC_OFFSET = timedelta(hours=6, minutes=30)
DAILY_FREE_LIMIT = 1
CREDITS_PER_FREE_VIDEO = 2  # Each video costs 2 credits, so give 2 credits for free video


class DailyCreditService:
    """Service for managing daily free video credits."""
    
    @staticmethod
    def get_myanmar_date(utc_time: datetime = None) -> datetime.date:
        """Convert UTC time to Myanmar date."""
        if utc_time is None:
            utc_time = datetime.now(timezone.utc)
        myanmar_time = utc_time + MYANMAR_UTC_OFFSET
        return myanmar_time.date()
    
    @staticmethod
    def get_next_reset_time() -> datetime:
        """Get the next daily reset time (Myanmar midnight) in UTC."""
        now_utc = datetime.now(timezone.utc)
        myanmar_now = now_utc + MYANMAR_UTC_OFFSET
        
        # Next Myanmar midnight
        myanmar_midnight = datetime(
            myanmar_now.year, myanmar_now.month, myanmar_now.day,
            0, 0, 0, tzinfo=timezone.utc
        )
        
        if myanmar_now.hour >= 0:  # Already past midnight, get next day
            myanmar_midnight += timedelta(days=1)
        
        # Convert back to UTC
        return myanmar_midnight - MYANMAR_UTC_OFFSET
    
    async def can_use_free_video(self, db: AsyncSession, user_id: str) -> Tuple[bool, str]:
        """
        Check if user can use daily free video.
        
        Returns:
            (can_use: bool, message: str)
        """
        result = await db.execute(
            select(User).where(User.id == user_id)
        )
        user = result.scalar_one_or_none()
        
        if not user:
            return False, "User not found"
        
        # Pro users don't need free videos (they have credits)
        if user.is_pro:
            return False, "Pro users don't need daily free video"
        
        today_myanmar = self.get_myanmar_date()
        
        # Check if user already used free video today
        if user.last_free_video_date:
            last_free_myanmar = self.get_myanmar_date(user.last_free_video_date)
            if last_free_myanmar == today_myanmar:
                next_reset = self.get_next_reset_time()
                hours_left = int((next_reset - datetime.now(timezone.utc)).total_seconds() / 3600)
                return False, f"နေ့စဥ် free video သုံးပြီးပါပြီ။ {hours_left} နာရီအတွင်း ထပ်ရပါမယ်။"
        
        return True, "Daily free video available"
    
    async def use_free_video(self, db: AsyncSession, user_id: str) -> Tuple[bool, str]:
        """
        Mark daily free video as used.
        
        Returns:
            (success: bool, message: str)
        """
        can_use, message = await self.can_use_free_video(db, user_id)
        if not can_use:
            return False, message
        
        result = await db.execute(
            select(User).where(User.id == user_id)
        )
        user = result.scalar_one_or_none()
        
        if not user:
            return False, "User not found"
        
        # Mark as used
        user.last_free_video_date = datetime.now(timezone.utc)
        await db.commit()
        
        logger.info(f"User {user.email} used daily free video")
        return True, "Daily free video used successfully"
    
    async def get_free_video_status(self, db: AsyncSession, user_id: str) -> dict:
        """
        Get daily free video status for user.
        
        Returns dict with:
        - can_use: bool
        - next_reset: datetime (UTC)
        - message: str
        """
        can_use, message = await self.can_use_free_video(db, user_id)
        
        return {
            "can_use": can_use,
            "next_reset": self.get_next_reset_time().isoformat(),
            "message": message,
        }


# Singleton instance
daily_credit_service = DailyCreditService()
