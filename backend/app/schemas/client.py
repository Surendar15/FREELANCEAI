"""
AgentVerse — Client Pydantic Schemas
======================================
Request/response validation schemas for Client endpoints.
Separates API contract from ORM model — never expose ORM directly.
"""

import uuid
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, EmailStr, Field, field_validator


# ── Request Schemas ────────────────────────────────────────────────────────

class ClientRegisterRequest(BaseModel):
    """Schema for client registration."""

    full_name: str = Field(
        ...,
        min_length=2,
        max_length=255,
        description="Client's full name",
        examples=["John Doe"],
    )

    email: EmailStr = Field(
        ...,
        description="Valid email address used for login",
        examples=["john@example.com"],
    )

    password: str = Field(
        ...,
        min_length=8,
        max_length=128,
        description="Password (min 8 characters)",
    )

    company_name: Optional[str] = Field(
        default=None,
        max_length=255,
        description="Optional company or organisation name",
    )

    @field_validator("password")
    @classmethod
    def validate_password_strength(cls, v: str) -> str:
        """Ensure password meets minimum security requirements."""
        if not any(c.isupper() for c in v):
            raise ValueError("Password must contain at least one uppercase letter")
        if not any(c.isdigit() for c in v):
            raise ValueError("Password must contain at least one digit")
        return v


class ClientLoginRequest(BaseModel):
    """Schema for client login."""

    email: EmailStr = Field(..., description="Registered email address")
    password: str = Field(..., description="Account password")


# ── Response Schemas ───────────────────────────────────────────────────────

class ClientResponse(BaseModel):
    """Public-facing client profile (no sensitive fields)."""

    model_config = {"from_attributes": True}

    id: uuid.UUID
    email: str
    full_name: str
    company_name: Optional[str] = None
    is_active: bool
    is_verified: bool
    created_at: datetime


class TokenResponse(BaseModel):
    """JWT token response schema."""

    access_token: str = Field(..., description="JWT access token")
    token_type: str = Field(default="bearer", description="Token type")
    expires_in: int = Field(..., description="Token lifetime in seconds")
    client: ClientResponse = Field(..., description="Authenticated client profile")


class LoginResponse(BaseModel):
    """Full login response with token and client info."""

    access_token: str
    token_type: str = "bearer"
    expires_in: int
    client: ClientResponse


# ── Dashboard Schema ───────────────────────────────────────────────────────

class DashboardStats(BaseModel):
    """Dashboard statistics for the client."""

    total_projects: int = 0
    active_projects: int = 0
    completed_projects: int = 0
    ai_analyses_completed: int = 0
    notifications: int = 0
