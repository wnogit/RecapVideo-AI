"""
Database Configuration with SQLAlchemy 2.0 Async
"""
from contextlib import asynccontextmanager
from typing import AsyncGenerator

from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase
from sqlalchemy.pool import NullPool

from app.core.config import settings


# Create async engine
engine = create_async_engine(
    settings.DATABASE_URL,
    echo=settings.DEBUG,
    pool_size=settings.DATABASE_POOL_SIZE,
    max_overflow=settings.DATABASE_MAX_OVERFLOW,
    pool_pre_ping=True,
    # Use NullPool for testing
    poolclass=NullPool if settings.ENVIRONMENT == "testing" else None,
)

# Create async session factory
async_session_maker = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False,
)


class Base(DeclarativeBase):
    """Base class for all database models."""
    pass


async def get_db() -> AsyncSession:
    """Dependency for getting async database session."""
    async with async_session_maker() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


@asynccontextmanager
async def get_db_session() -> AsyncGenerator[AsyncSession, None]:
    """
    Context manager for getting async database session.
    Use this when you need a session outside of FastAPI dependency injection.
    """
    async with async_session_maker() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


def create_worker_session_maker():
    """
    Create a new async session maker for Celery workers.
    
    This creates a fresh engine and session factory that works
    with the worker's event loop, avoiding the 'attached to a different loop' error.
    """
    worker_engine = create_async_engine(
        settings.DATABASE_URL,
        echo=settings.DEBUG,
        pool_pre_ping=True,
        poolclass=NullPool,  # Use NullPool for workers to avoid connection issues
    )
    
    return async_sessionmaker(
        worker_engine,
        class_=AsyncSession,
        expire_on_commit=False,
        autoflush=False,
    )
