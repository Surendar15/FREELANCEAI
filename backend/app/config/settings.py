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
    DATABASE_URL: str
    DATABASE_URL_SYNC: str

    # ── JWT Authentication ────────────────────────────────────────
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440  # 24 hours

    # ── OpenRouter AI ─────────────────────────────────────────────
    OPENROUTER_API_KEY: str
    OPENROUTER_BASE_URL: str = "https://openrouter.ai/api/v1"
    OPENROUTER_MODEL: str = "deepseek/deepseek-chat-v3-0324:free"
    OPENROUTER_TIMEOUT: int = 120
    OPENROUTER_MAX_RETRIES: int = 3

    # ── CORS ──────────────────────────────────────────────────────
    ALLOWED_ORIGINS: str = "http://localhost:5173,http://localhost:3000"

    # ── File Upload ───────────────────────────────────────────────
    MAX_FILE_SIZE_MB: int = 10
    UPLOAD_DIR: str = "uploads/"

    @property
    def allowed_origins_list(self) -> List[str]:
        """Parse comma-separated CORS origins into a list."""
        return [origin.strip() for origin in self.ALLOWED_ORIGINS.split(",")]

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
