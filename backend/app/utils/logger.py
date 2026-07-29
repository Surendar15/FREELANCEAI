"""
AgentVerse — Structured Logging
================================
Configures structlog for consistent, structured JSON logging across all modules.
Supports both human-readable (development) and machine-parseable (production) output.
"""

import logging
import sys
from typing import Any

import structlog
from app.config.settings import settings


def configure_logging() -> None:
    """
    Configure structlog with appropriate processors based on environment.
    
    - Development: Pretty colored console output
    - Production: JSON format for log aggregation (ELK, Datadog, etc.)
    """
    shared_processors = [
        structlog.contextvars.merge_contextvars,
        structlog.processors.add_log_level,
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.StackInfoRenderer(),
    ]

    if settings.DEBUG:
        # Human-readable for development
        processors = shared_processors + [
            structlog.dev.ConsoleRenderer(colors=True)
        ]
    else:
        # JSON for production
        processors = shared_processors + [
            structlog.processors.dict_tracebacks,
            structlog.processors.JSONRenderer(),
        ]

    structlog.configure(
        processors=processors,
        wrapper_class=structlog.make_filtering_bound_logger(
            logging.DEBUG if settings.DEBUG else logging.INFO
        ),
        context_class=dict,
        logger_factory=structlog.PrintLoggerFactory(),
        cache_logger_on_first_use=True,
    )

    # Also configure stdlib logging
    logging.basicConfig(
        format="%(message)s",
        stream=sys.stdout,
        level=logging.DEBUG if settings.DEBUG else logging.INFO,
    )


def get_logger(name: str) -> Any:
    """
    Get a structlog logger instance for the given module.
    
    Usage:
        from app.utils.logger import get_logger
        logger = get_logger(__name__)
        logger.info("message", key="value")
    """
    return structlog.get_logger(name)
