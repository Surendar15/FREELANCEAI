"""
AgentVerse — FastAPI Application Entry Point
==============================================
Production-ready FastAPI application with:
    - CORS middleware
    - Global exception handlers
    - Database initialization on startup
    - API versioning via /api prefix
    - OpenAPI documentation at /docs

Usage:
    uvicorn main:app --reload --host 0.0.0.0 --port 8000
"""

import os
from contextlib import asynccontextmanager
from typing import AsyncGenerator

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.staticfiles import StaticFiles

from app.api.routes import api_router
from app.config.settings import settings
from app.database.init_db import init_db
from app.middleware.error_handler import register_exception_handlers
from app.utils.logger import configure_logging, get_logger

# Initialise structured logging first
configure_logging()
logger = get_logger(__name__)


# ── Application Lifecycle ──────────────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator:
    """
    Application lifespan manager.
    Runs startup tasks before the app accepts requests,
    and cleanup tasks on shutdown.
    """
    # ── Startup ────────────────────────────────────────────────────────────
    logger.info(
        "AgentVerse starting up",
        version=settings.APP_VERSION,
        environment=settings.ENVIRONMENT,
        debug=settings.DEBUG,
    )

    # Create upload directory if it doesn't exist
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)

    # Initialise database tables
    await init_db()

    logger.info("AgentVerse startup complete — ready to accept requests")

    yield

    # ── Shutdown ───────────────────────────────────────────────────────────
    logger.info("AgentVerse shutting down...")


# ── Application Instance ───────────────────────────────────────────────────

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description=(
        "AI-Powered Freelancing Platform — Phase 1\n\n"
        "This API powers the AgentVerse platform, featuring:\n"
        "- Client authentication (JWT)\n"
        "- AI-powered requirement analysis (OpenRouter)\n"
        "- Project management\n"
        "- Extensible agent architecture (6 future agents)\n\n"
        "**Agents implemented:** Requirement Intelligence Agent\n"
        "**Agents planned:** Talent Discovery, Proposal Intelligence, "
        "Budget Intelligence, Project Planning, Progress Monitoring, Quality Assurance"
    ),
    docs_url="/docs" if settings.DEBUG else None,        # Disable docs in production
    redoc_url="/redoc" if settings.DEBUG else None,
    openapi_url="/openapi.json" if settings.DEBUG else None,
    lifespan=lifespan,
)

# ── Middleware ─────────────────────────────────────────────────────────────

# CORS — allow frontend to communicate with backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins_list,
    allow_origin_regex=r"https://.*\.netlify\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["X-Total-Count"],
)

# ── Exception Handlers ─────────────────────────────────────────────────────
register_exception_handlers(app)

# ── API Routes ─────────────────────────────────────────────────────────────
app.include_router(api_router)

# ── Static Files (for uploaded files) ────────────────────────────────────
os.makedirs("uploads", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")


# ── Health Check ───────────────────────────────────────────────────────────

@app.get("/health", tags=["Health"])
async def health_check() -> dict:
    """
    Health check endpoint for load balancers and monitoring.
    Returns 200 OK if the application is running.
    """
    return {
        "status": "healthy",
        "service": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "environment": settings.ENVIRONMENT,
    }


@app.get("/", tags=["Health"])
async def root() -> dict:
    """Root endpoint — API information."""
    return {
        "message": "Welcome to AgentVerse API",
        "version": settings.APP_VERSION,
        "docs": "/docs" if settings.DEBUG else "Documentation disabled in production",
        "health": "/health",
    }
