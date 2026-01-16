"""
Token Blacklist Service

Token revocation နဲ့ blacklist management အတွက် service

Features:
- Token blacklisting (logout/revoke)
- Blacklist checking (token verify တိုင်း check)
- Expired tokens cleanup
- Token family revocation (security breach detection)
"""
from datetime import datetime, timezone
from typing import Optional
import uuid

from sqlalchemy import select, delete
from sqlalchemy.ext.asyncio import AsyncSession
from loguru import logger

from app.models.token_blacklist import TokenBlacklist, RefreshTokenFamily
from app.core.security import verify_token, get_token_expiry


class TokenBlacklistService:
    """Service for managing token blacklist."""
    
    async def blacklist_token(
        self,
        db: AsyncSession,
        token: str,
        user_id: str,
        reason: str = "logout"
    ) -> bool:
        """
        Add token to blacklist.
        
        Args:
            db: Database session
            token: JWT token to blacklist
            user_id: User ID who owns the token
            reason: Reason for blacklisting
            
        Returns:
            True if successful, False otherwise
        """
        try:
            # Verify and decode token to get JTI
            payload = verify_token(token, token_type="access")
            if not payload:
                # Try as refresh token
                payload = verify_token(token, token_type="refresh")
            
            if not payload or not payload.jti:
                logger.warning("Cannot blacklist token without JTI")
                return False
            
            # Get expiry time
            expires_at = payload.exp
            
            # Check if already blacklisted
            result = await db.execute(
                select(TokenBlacklist).where(TokenBlacklist.jti == payload.jti)
            )
            if result.scalar_one_or_none():
                logger.debug(f"Token {payload.jti[:8]}... already blacklisted")
                return True
            
            # Add to blacklist
            blacklist_entry = TokenBlacklist(
                jti=payload.jti,
                token_type=payload.type,
                user_id=uuid.UUID(user_id),
                expires_at=expires_at,
                reason=reason,
            )
            db.add(blacklist_entry)
            await db.commit()
            
            logger.info(f"Token {payload.jti[:8]}... blacklisted for user {user_id[:8]}...")
            return True
            
        except Exception as e:
            logger.error(f"Failed to blacklist token: {e}")
            await db.rollback()
            return False
    
    async def blacklist_all_user_tokens(
        self,
        db: AsyncSession,
        user_id: str,
        reason: str = "logout_all"
    ) -> bool:
        """
        Blacklist all tokens for a user (logout from all devices).
        
        This invalidates all refresh token families for the user.
        """
        try:
            # Invalidate all refresh token families
            result = await db.execute(
                select(RefreshTokenFamily).where(
                    RefreshTokenFamily.user_id == uuid.UUID(user_id),
                    RefreshTokenFamily.is_valid == True
                )
            )
            families = result.scalars().all()
            
            for family in families:
                family.is_valid = False
            
            await db.commit()
            
            logger.info(f"Invalidated {len(families)} token families for user {user_id[:8]}...")
            return True
            
        except Exception as e:
            logger.error(f"Failed to blacklist all tokens: {e}")
            await db.rollback()
            return False
    
    async def is_token_blacklisted(
        self,
        db: AsyncSession,
        jti: str
    ) -> bool:
        """
        Check if a token JTI is blacklisted.
        
        Args:
            db: Database session
            jti: JWT ID to check
            
        Returns:
            True if blacklisted, False otherwise
        """
        try:
            result = await db.execute(
                select(TokenBlacklist).where(TokenBlacklist.jti == jti)
            )
            return result.scalar_one_or_none() is not None
        except Exception as e:
            logger.error(f"Error checking blacklist: {e}")
            # Fail-closed: treat as blacklisted if we can't check
            return True
    
    async def cleanup_expired_tokens(
        self,
        db: AsyncSession
    ) -> int:
        """
        Remove expired tokens from blacklist.
        
        Should be called periodically by a background task.
        
        Returns:
            Number of tokens removed
        """
        try:
            result = await db.execute(
                delete(TokenBlacklist).where(
                    TokenBlacklist.expires_at < datetime.now(timezone.utc)
                ).returning(TokenBlacklist.id)
            )
            deleted_count = len(result.fetchall())
            await db.commit()
            
            logger.info(f"Cleaned up {deleted_count} expired blacklist entries")
            return deleted_count
            
        except Exception as e:
            logger.error(f"Failed to cleanup expired tokens: {e}")
            await db.rollback()
            return 0
    
    # ============ Refresh Token Family Management ============
    
    async def create_token_family(
        self,
        db: AsyncSession,
        user_id: str,
        jti: str,
        family_id: str,
        device_info: Optional[str] = None,
        ip_address: Optional[str] = None,
    ) -> RefreshTokenFamily:
        """Create a new refresh token family for a login session."""
        family = RefreshTokenFamily(
            family_id=family_id,
            user_id=uuid.UUID(user_id),
            current_jti=jti,
            device_info=device_info,
            ip_address=ip_address,
        )
        db.add(family)
        await db.commit()
        await db.refresh(family)
        
        logger.debug(f"Created token family {family_id[:8]}... for user {user_id[:8]}...")
        return family
    
    async def rotate_refresh_token(
        self,
        db: AsyncSession,
        family_id: str,
        old_jti: str,
        new_jti: str,
    ) -> Optional[RefreshTokenFamily]:
        """
        Rotate refresh token within a family.
        
        Returns None if family is invalid or old JTI doesn't match (reuse attack).
        """
        try:
            result = await db.execute(
                select(RefreshTokenFamily).where(
                    RefreshTokenFamily.family_id == family_id
                )
            )
            family = result.scalar_one_or_none()
            
            if not family:
                logger.warning(f"Token family {family_id[:8]}... not found")
                return None
            
            if not family.is_valid:
                logger.warning(f"Token family {family_id[:8]}... is already invalidated")
                return None
            
            if family.current_jti != old_jti:
                # Token reuse detected! Invalidate entire family
                logger.warning(f"Token reuse detected in family {family_id[:8]}! Invalidating.")
                family.is_valid = False
                await db.commit()
                return None
            
            # Valid rotation
            family.current_jti = new_jti
            family.last_rotated_at = datetime.now(timezone.utc)
            await db.commit()
            await db.refresh(family)
            
            return family
            
        except Exception as e:
            logger.error(f"Failed to rotate refresh token: {e}")
            await db.rollback()
            return None
    
    async def is_token_family_valid(
        self,
        db: AsyncSession,
        family_id: str,
        jti: str,
    ) -> bool:
        """Check if a refresh token is valid within its family."""
        try:
            result = await db.execute(
                select(RefreshTokenFamily).where(
                    RefreshTokenFamily.family_id == family_id,
                    RefreshTokenFamily.current_jti == jti,
                    RefreshTokenFamily.is_valid == True,
                )
            )
            return result.scalar_one_or_none() is not None
        except Exception as e:
            logger.error(f"Error checking token family: {e}")
            # Fail-closed
            return False
    
    async def invalidate_family(
        self,
        db: AsyncSession,
        family_id: str,
    ) -> bool:
        """Invalidate a token family (logout from specific device)."""
        try:
            result = await db.execute(
                select(RefreshTokenFamily).where(
                    RefreshTokenFamily.family_id == family_id
                )
            )
            family = result.scalar_one_or_none()
            
            if family:
                family.is_valid = False
                await db.commit()
                logger.info(f"Invalidated token family {family_id[:8]}...")
                return True
            return False
            
        except Exception as e:
            logger.error(f"Failed to invalidate family: {e}")
            await db.rollback()
            return False


# Singleton instance
token_blacklist_service = TokenBlacklistService()
