"""
Rate Limit Service - IP-based rate limiting for signups

Uses Redis for distributed rate limiting.
Falls back to in-memory if Redis unavailable.
"""
from datetime import datetime, timezone, timedelta
from typing import Optional
from loguru import logger

from app.core.config import settings


class RateLimitService:
    """Service for IP-based rate limiting."""
    
    # Limits
    MAX_SIGNUPS_PER_IP_PER_DAY = 2
    MAX_SIGNUPS_PER_DEVICE_PER_DAY = 2
    MAX_LOGIN_ATTEMPTS_PER_IP = 10  # per hour
    
    def __init__(self):
        self._redis = None
        self._memory_store: dict = {}  # Fallback in-memory store
    
    async def _get_redis(self):
        """Lazy load Redis connection."""
        if self._redis is None:
            try:
                import redis.asyncio as redis
                self._redis = redis.from_url(settings.REDIS_URL)
                await self._redis.ping()
            except Exception as e:
                logger.warning(f"Redis unavailable, using memory store: {e}")
                self._redis = False  # Mark as unavailable
        return self._redis if self._redis else None
    
    async def check_signup_limit(self, ip: str) -> tuple[bool, int]:
        """
        Check if IP has exceeded signup limit.
        
        Returns:
            tuple of (allowed: bool, remaining: int)
        """
        key = f"signup_limit:{ip}:{datetime.now(timezone.utc).date()}"
        
        redis = await self._get_redis()
        
        if redis:
            try:
                count = await redis.get(key)
                count = int(count) if count else 0
                
                if count >= self.MAX_SIGNUPS_PER_IP_PER_DAY:
                    return False, 0
                
                return True, self.MAX_SIGNUPS_PER_IP_PER_DAY - count
            except Exception as e:
                logger.error(f"Redis error: {e}")
        
        # Fallback to memory
        count = self._memory_store.get(key, 0)
        if count >= self.MAX_SIGNUPS_PER_IP_PER_DAY:
            return False, 0
        
        return True, self.MAX_SIGNUPS_PER_IP_PER_DAY - count
    
    async def record_signup(self, ip: str) -> None:
        """Record a signup from this IP."""
        key = f"signup_limit:{ip}:{datetime.now(timezone.utc).date()}"
        
        redis = await self._get_redis()
        
        if redis:
            try:
                pipe = redis.pipeline()
                pipe.incr(key)
                pipe.expire(key, 86400)  # 24 hours
                await pipe.execute()
                return
            except Exception as e:
                logger.error(f"Redis error: {e}")
        
        # Fallback to memory
        self._memory_store[key] = self._memory_store.get(key, 0) + 1
    
    async def check_device_limit(self, device_id: str) -> tuple[bool, int]:
        """
        Check if device has exceeded account limit.
        
        Returns:
            tuple of (allowed: bool, remaining: int)
        """
        key = f"device_limit:{device_id}"
        
        redis = await self._get_redis()
        
        if redis:
            try:
                count = await redis.get(key)
                count = int(count) if count else 0
                
                if count >= self.MAX_SIGNUPS_PER_DEVICE_PER_DAY:
                    return False, 0
                
                return True, self.MAX_SIGNUPS_PER_DEVICE_PER_DAY - count
            except Exception as e:
                logger.error(f"Redis error: {e}")
        
        # Fallback to memory
        count = self._memory_store.get(key, 0)
        if count >= self.MAX_SIGNUPS_PER_DEVICE_PER_DAY:
            return False, 0
        
        return True, self.MAX_SIGNUPS_PER_DEVICE_PER_DAY - count
    
    async def record_device_signup(self, device_id: str) -> None:
        """Record a signup from this device."""
        key = f"device_limit:{device_id}"
        
        redis = await self._get_redis()
        
        if redis:
            try:
                pipe = redis.pipeline()
                pipe.incr(key)
                # Device limits don't expire (permanent tracking)
                await pipe.execute()
                return
            except Exception as e:
                logger.error(f"Redis error: {e}")
        
        # Fallback to memory
        self._memory_store[key] = self._memory_store.get(key, 0) + 1


# Global instance
rate_limit_service = RateLimitService()
