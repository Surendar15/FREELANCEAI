"""
AgentVerse — Database Session & Connection Pool
=================================================
Async SQLAlchemy setup with connection pooling.
Provides `get_db` dependency for FastAPI route injection.
"""

from typing import AsyncGenerator

from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy.pool import NullPool

from app.config.settings import settings
from app.utils.logger import get_logger

logger = get_logger(__name__)

# ── Async Engine ───────────────────────────────────────────────────────────

engine = create_async_engine(
    settings.DATABASE_URL,
    echo=settings.DEBUG,          # Log SQL queries in debug mode
    pool_size=10,                  # Connection pool size
    max_overflow=20,               # Extra connections under load
    pool_pre_ping=True,            # Verify connections before use
    pool_recycle=3600,             # Recycle connections every hour
)

# ── Session Factory ────────────────────────────────────────────────────────

AsyncSessionFactory = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,        # Don't expire objects after commit
    autocommit=False,
    autoflush=False,
)


# ── FastAPI Dependency ─────────────────────────────────────────────────────

async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """
    FastAPI dependency that provides a database session per request.
    
    Usage in routes:
        @router.get("/")
        async def my_route(db: AsyncSession = Depends(get_db)):
            ...
    
    Guarantees:
        - Session is always closed after the request
        - Uncommitted changes are rolled back on exception
    """
    async with AsyncSessionFactory() as session:
        try:
            yield session
            await session.commit()
        except Exception as exc:
            await session.rollback()
            logger.error("Database session error — rolling back", error=str(exc))
            raise
        finally:
            await session.close()
