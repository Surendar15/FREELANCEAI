"""
AgentVerse — Configuration Module
==================================
Centralised settings using Pydantic BaseSettings.
All values are read from environment variables / .env file.
This is the single source of truth for all configuration.
"""

from functools import lru_cache
from typing import List

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """
    Application settings loaded from environment variables.
    
    Using Pydantic BaseSettings ensures:
    - Type validation on all config values
    - Automatic .env file loading
    - Easy override via environment variables
    """

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # ── Application ──────────────────────────────────────────────
    APP_NAME: str = "AgentVerse - AI Freelancing Platform"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False
    ENVIRONMENT: str = "development"

    # ── Database ─────────────────────────────────────────────────
    DATABASE_URL: str = "sqlite+aiosqlite:///agentverse.db"
    DATABASE_URL_SYNC: str = ""

    # ── JWT Authentication ────────────────────────────────────────
    SECRET_KEY: str = "agentverse-production-secret-key-change-in-env-32-chars-min"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440  # 24 hours

    # ── OpenRouter AI ─────────────────────────────────────────────
    OPENROUTER_API_KEY: str = ""
    OPENROUTER_BASE_URL: str = "https://openrouter.ai/api/v1"
    OPENROUTER_MODEL: str = "deepseek/deepseek-chat-v3-0324:free"
    OPENROUTER_TIMEOUT: int = 120
    OPENROUTER_MAX_RETRIES: int = 3

    # ── CORS ──────────────────────────────────────────────────────
    ALLOWED_ORIGINS: str = "http://localhost:5173,http://localhost:3000"

    # ── File Upload ───────────────────────────────────────────────
    MAX_FILE_SIZE_MB: int = 10
    UPLOAD_DIR: str = "uploads/"

    @field_validator("DATABASE_URL", mode="before")
    @classmethod
    def assemble_db_url(cls, v: str) -> str:
        if isinstance(v, str) and v.strip():
            v = v.strip()
            # Render and other clouds give postgres:// which SQLAlchemy deprecated
            if v.startswith("postgres://"):
                return v.replace("postgres://", "postgresql+asyncpg://", 1)
            elif v.startswith("postgresql://") and not v.startswith("postgresql+"):
                return v.replace("postgresql://", "postgresql+asyncpg://", 1)
        return v or "sqlite+aiosqlite:///agentverse.db"

    @field_validator("DATABASE_URL_SYNC", mode="before")
    @classmethod
    def assemble_sync_db_url(cls, v: str) -> str:
        if isinstance(v, str) and v.strip():
            v = v.strip()
            if v.startswith("postgres://"):
                return v.replace("postgres://", "postgresql://", 1)
            elif v.startswith("postgresql+asyncpg://"):
                return v.replace("postgresql+asyncpg://", "postgresql://", 1)
            return v
        return ""

    def model_post_init(self, __context) -> None:
        super().model_post_init(__context)
        # If DATABASE_URL_SYNC is not explicitly set, auto-derive from DATABASE_URL
        if not self.DATABASE_URL_SYNC:
            if "sqlite+aiosqlite:///" in self.DATABASE_URL:
                self.DATABASE_URL_SYNC = self.DATABASE_URL.replace("sqlite+aiosqlite:///", "sqlite:///")
            elif "postgresql+asyncpg://" in self.DATABASE_URL:
                self.DATABASE_URL_SYNC = self.DATABASE_URL.replace("postgresql+asyncpg://", "postgresql://")
            else:
                self.DATABASE_URL_SYNC = self.DATABASE_URL

    @property
    def allowed_origins_list(self) -> List[str]:
        """Parse comma-separated CORS origins into a list."""
        return [origin.strip() for origin in self.ALLOWED_ORIGINS.split(",") if origin.strip()]

    @property
    def max_file_size_bytes(self) -> int:
        """Convert MB to bytes for file size validation."""
        return self.MAX_FILE_SIZE_MB * 1024 * 1024


@lru_cache()
def get_settings() -> Settings:
    """
    Return cached settings instance.
    Using lru_cache ensures settings are only loaded once,
    improving performance in production.
    """
    return Settings()


# Convenience export — import `settings` directly in other modules
settings = get_settings()
