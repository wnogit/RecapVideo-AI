"""
API Key Management Service

Provides centralized access to API keys stored in the database.
Falls back to environment variables if database keys are not found.
Supports priority-based provider selection and random key rotation.
"""
import json
import random
from datetime import datetime, timezone
from typing import Optional, Dict, Any, List
from functools import lru_cache

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession
from loguru import logger

from app.core.config import settings
from app.core.database import create_worker_session_maker
from app.models.api_key import APIKey, APIKeyType


class APIKeyService:
    """Service for managing and retrieving API keys."""
    
    # In-memory cache for frequently accessed keys
    _cache: Dict[str, Dict[str, Any]] = {}
    _cache_ttl: int = 300  # 5 minutes
    _cache_timestamps: Dict[str, datetime] = {}
    
    async def get_key(
        self,
        key_type: str,
        db: Optional[AsyncSession] = None,
        use_cache: bool = True,
    ) -> Optional[str]:
        """
        Get an API key by type.
        
        Priority:
        1. Database (primary key for type)
        2. Environment variable fallback
        
        Args:
            key_type: The type of API key to retrieve
            db: Optional database session
            use_cache: Whether to use cached value
        
        Returns:
            The API key value or None
        """
        # Check cache first
        if use_cache and self._is_cache_valid(key_type):
            cached = self._cache.get(key_type)
            if cached:
                return cached.get("key_value")
        
        # Try database
        try:
            if db:
                key_value = await self._get_from_db(key_type, db)
            else:
                # Create worker-safe session factory
                worker_session = create_worker_session_maker()
                async with worker_session() as session:
                    key_value = await self._get_from_db(key_type, session)
            
            if key_value:
                self._update_cache(key_type, key_value)
                return key_value
                
        except Exception as e:
            logger.warning(f"Failed to get API key from database: {e}")
        
        # Fallback to environment variables
        return self._get_from_env(key_type)
    
    async def get_key_with_config(
        self,
        key_type: str,
        db: Optional[AsyncSession] = None,
    ) -> Optional[Dict[str, Any]]:
        """
        Get an API key with its configuration.
        
        Returns:
            Dict with key_value and config, or None
        """
        try:
            if db:
                return await self._get_full_from_db(key_type, db)
            else:
                async with async_session_maker() as session:
                    return await self._get_full_from_db(key_type, session)
        except Exception as e:
            logger.warning(f"Failed to get API key config: {e}")
            return None
    
    async def _get_from_db(
        self,
        key_type: str,
        db: AsyncSession,
    ) -> Optional[str]:
        """Get API key value from database (random from active keys)."""
        # Get all active keys for this type, ordered by priority
        result = await db.execute(
            select(APIKey)
            .where(
                APIKey.key_type == key_type,
                APIKey.is_active == True,
            )
            .order_by(APIKey.priority.asc())
        )
        all_keys = result.scalars().all()
        
        if not all_keys:
            return None
        
        # Pick random key from available active keys
        api_key = random.choice(all_keys)
        
        # Update usage stats
        await db.execute(
            update(APIKey)
            .where(APIKey.id == api_key.id)
            .values(
                last_used_at=datetime.now(timezone.utc),
                usage_count=APIKey.usage_count + 1,
            )
        )
        await db.commit()
        return api_key.key_value
    
    async def _get_full_from_db(
        self,
        key_type: str,
        db: AsyncSession,
    ) -> Optional[Dict[str, Any]]:
        """Get API key with config from database."""
        result = await db.execute(
            select(APIKey)
            .where(
                APIKey.key_type == key_type,
                APIKey.is_active == True,
                APIKey.is_primary == True,
            )
            .limit(1)
        )
        api_key = result.scalar_one_or_none()
        
        if not api_key:
            result = await db.execute(
                select(APIKey)
                .where(
                    APIKey.key_type == key_type,
                    APIKey.is_active == True,
                )
                .limit(1)
            )
            api_key = result.scalar_one_or_none()
        
        if api_key:
            config = {}
            if api_key.config:
                try:
                    config = json.loads(api_key.config)
                except json.JSONDecodeError:
                    pass
            
            return {
                "key_value": api_key.key_value,
                "config": config,
                "name": api_key.name,
            }
        
        return None
    
    def _get_from_env(self, key_type: str) -> Optional[str]:
        """Get API key from environment variables as fallback."""
        env_mapping = {
            "transcript_api": settings.TRANSCRIPT_API_KEY,
            "gemini": settings.GEMINI_API_KEY,
            "groq": getattr(settings, 'GROQ_API_KEY', None),
            "poe": getattr(settings, 'POE_API_KEY', None),
            "openrouter": getattr(settings, 'OPENROUTER_API_KEY', None),
            "deepinfra": getattr(settings, 'DEEPINFRA_API_KEY', None),
            "resend": settings.RESEND_API_KEY,
            "r2_access_key": settings.R2_ACCESS_KEY_ID,
            "r2_secret_key": settings.R2_SECRET_ACCESS_KEY,
        }
        
        value = env_mapping.get(key_type)
        if value:
            logger.debug(f"Using environment variable for {key_type}")
        return value if value else None
    
    def _is_cache_valid(self, key_type: str) -> bool:
        """Check if cache entry is still valid."""
        timestamp = self._cache_timestamps.get(key_type)
        if not timestamp:
            return False
        
        age = (datetime.now(timezone.utc) - timestamp).total_seconds()
        return age < self._cache_ttl
    
    def _update_cache(self, key_type: str, key_value: str):
        """Update cache with new value."""
        self._cache[key_type] = {"key_value": key_value}
        self._cache_timestamps[key_type] = datetime.now(timezone.utc)
    
    def clear_cache(self, key_type: Optional[str] = None):
        """Clear cache for a specific key type or all keys."""
        if key_type:
            self._cache.pop(key_type, None)
            self._cache_timestamps.pop(key_type, None)
        else:
            self._cache.clear()
            self._cache_timestamps.clear()
    
    # Convenience methods for specific key types
    async def get_transcript_api_key(self, db: Optional[AsyncSession] = None) -> Optional[str]:
        return await self.get_key("transcript_api", db)
    
    async def get_gemini_key(self, db: Optional[AsyncSession] = None) -> Optional[str]:
        return await self.get_key("gemini", db)
    
    async def get_groq_key(self, db: Optional[AsyncSession] = None) -> Optional[str]:
        return await self.get_key("groq", db)
    
    async def get_poe_key(self, db: Optional[AsyncSession] = None) -> Optional[str]:
        return await self.get_key("poe", db)
    
    async def get_openrouter_key(self, db: Optional[AsyncSession] = None) -> Optional[str]:
        return await self.get_key("openrouter", db)
    
    async def get_deepinfra_key(self, db: Optional[AsyncSession] = None) -> Optional[str]:
        return await self.get_key("deepinfra", db)
    
    async def get_resend_key(self, db: Optional[AsyncSession] = None) -> Optional[str]:
        return await self.get_key("resend", db)
    
    async def get_r2_credentials(self, db: Optional[AsyncSession] = None) -> Dict[str, str]:
        """Get R2 access and secret keys."""
        access_key = await self.get_key("r2_access_key", db)
        secret_key = await self.get_key("r2_secret_key", db)
        return {
            "access_key": access_key or "",
            "secret_key": secret_key or "",
        }
    
    # ============== NEW: Priority-based AI Provider Selection ==============
    
    async def get_ai_providers_by_priority(
        self,
        db: Optional[AsyncSession] = None,
    ) -> List[Dict[str, Any]]:
        """
        Get all AI providers ordered by priority.
        Returns list of providers with their keys, models, and priority.
        
        Example return:
        [
            {"provider": "openrouter", "keys": [...], "model": "google/gemini-2.5-flash", "priority": 1},
            {"provider": "deepinfra", "keys": [...], "model": "google/gemini-2.5-flash", "priority": 2},
            {"provider": "gemini", "keys": [...], "model": None, "priority": 3},
        ]
        """
        ai_provider_types = ["deepinfra", "openrouter", "groq", "gemini", "poe"]
        
        try:
            if db:
                return await self._get_ai_providers_from_db(ai_provider_types, db)
            else:
                worker_session = create_worker_session_maker()
                async with worker_session() as session:
                    return await self._get_ai_providers_from_db(ai_provider_types, session)
        except Exception as e:
            logger.warning(f"Failed to get AI providers from DB: {e}")
            # Fallback to environment variables with default priority
            return self._get_ai_providers_from_env(ai_provider_types)
    
    async def _get_ai_providers_from_db(
        self,
        provider_types: List[str],
        db: AsyncSession,
    ) -> List[Dict[str, Any]]:
        """Get AI providers from database ordered by priority."""
        providers = []
        
        for provider_type in provider_types:
            result = await db.execute(
                select(APIKey)
                .where(
                    APIKey.key_type == provider_type,
                    APIKey.is_active == True,
                )
                .order_by(APIKey.priority.asc())
            )
            keys = result.scalars().all()
            
            if keys:
                # Get the lowest priority (highest rank) for this provider
                min_priority = min(k.priority for k in keys)
                # Get model from first key (or use default)
                model = keys[0].model
                
                providers.append({
                    "provider": provider_type,
                    "keys": [{"id": str(k.id), "key_value": k.key_value, "model": k.model} for k in keys],
                    "model": model,
                    "priority": min_priority,
                })
        
        # Sort by priority (lower number = higher priority)
        providers.sort(key=lambda x: x["priority"])
        return providers
    
    def _get_ai_providers_from_env(self, provider_types: List[str]) -> List[Dict[str, Any]]:
        """Fallback: Get AI providers from environment variables."""
        providers = []
        default_priority = {
            "deepinfra": 1,
            "openrouter": 2,
            "groq": 3,
            "gemini": 4,
            "poe": 5,
        }
        default_models = {
            "deepinfra": "google/gemini-2.5-flash",
            "openrouter": "google/gemini-2.5-flash",
            "groq": "llama-3.3-70b-versatile",
            "gemini": "gemini-pro",
            "poe": "claude-3-5-sonnet",
        }
        
        for provider_type in provider_types:
            key = self._get_from_env(provider_type)
            if key:
                providers.append({
                    "provider": provider_type,
                    "keys": [{"id": None, "key_value": key, "model": default_models.get(provider_type)}],
                    "model": default_models.get(provider_type),
                    "priority": default_priority.get(provider_type, 100),
                })
        
        providers.sort(key=lambda x: x["priority"])
        return providers
    
    async def get_random_key_for_provider(
        self,
        provider_type: str,
        db: Optional[AsyncSession] = None,
    ) -> Optional[Dict[str, Any]]:
        """
        Get a random key for a specific provider.
        Returns dict with key_value and model.
        """
        try:
            if db:
                return await self._get_random_key_from_db(provider_type, db)
            else:
                worker_session = create_worker_session_maker()
                async with worker_session() as session:
                    return await self._get_random_key_from_db(provider_type, session)
        except Exception as e:
            logger.warning(f"Failed to get random key for {provider_type}: {e}")
            # Fallback to env
            key = self._get_from_env(provider_type)
            if key:
                return {"key_value": key, "model": None}
            return None
    
    async def _get_random_key_from_db(
        self,
        provider_type: str,
        db: AsyncSession,
    ) -> Optional[Dict[str, Any]]:
        """Get random key from database for a provider."""
        result = await db.execute(
            select(APIKey)
            .where(
                APIKey.key_type == provider_type,
                APIKey.is_active == True,
            )
        )
        keys = result.scalars().all()
        
        if not keys:
            return None
        
        # Random selection
        selected = random.choice(keys)
        
        # Update usage
        await db.execute(
            update(APIKey)
            .where(APIKey.id == selected.id)
            .values(
                last_used_at=datetime.now(timezone.utc),
                usage_count=APIKey.usage_count + 1,
            )
        )
        await db.commit()
        
        return {
            "key_value": selected.key_value,
            "model": selected.model,
        }


# Singleton instance
api_key_service = APIKeyService()
