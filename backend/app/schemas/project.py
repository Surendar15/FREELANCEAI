"""
AgentVerse — Project & AI Analysis Pydantic Schemas
=====================================================
Defines the complete contract for project creation and AI analysis results.
The AIAnalysisResult schema is the canonical structured output of the
Requirement Intelligence Agent.
"""

import uuid
from datetime import datetime
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field


# ── AI Analysis Schema ─────────────────────────────────────────────────────

class RequiredTechnologies(BaseModel):
    """Technologies required for the project."""
    programming_languages: List[str] = Field(default_factory=list)
    frameworks: List[str] = Field(default_factory=list)
    databases: List[str] = Field(default_factory=list)
    cloud_services: List[str] = Field(default_factory=list)
    tools: List[str] = Field(default_factory=list)


class Feature(BaseModel):
    """A single project feature."""
    name: str
    description: str
    priority: str = Field(default="medium", description="high | medium | low")


class Risk(BaseModel):
    """A potential project risk."""
    risk: str
    impact: str = Field(default="medium", description="high | medium | low")
    mitigation: str


class BudgetRange(BaseModel):
    """Estimated budget range."""
    min_usd: int
    max_usd: int
    currency: str = "INR"


class AIAnalysisResult(BaseModel):
    """
    The canonical structured output of the Requirement Intelligence Agent.
    
    This schema is stored as JSONB in the database and returned to the frontend.
    Every field maps directly to what the LLM is instructed to produce.
    
    Architecture Note:
        Future agents (Budget, Planning, etc.) may extend this schema
        or add their own top-level fields to the JSONB column.
    """

    # ── Project Identity ──────────────────────────────────────────
    project_title: str = Field(..., description="Cleaned/formatted project title")
    project_type: str = Field(..., description="e.g., Web App, Mobile App, API, etc.")
    domain: str = Field(..., description="e.g., E-commerce, HealthTech, FinTech, etc.")

    # ── Technologies ──────────────────────────────────────────────
    required_technologies: RequiredTechnologies

    # ── Skills ────────────────────────────────────────────────────
    required_skills: List[str] = Field(default_factory=list)
    nice_to_have_skills: List[str] = Field(default_factory=list)

    # ── Features ──────────────────────────────────────────────────
    core_features: List[Feature] = Field(default_factory=list)
    optional_features: List[Feature] = Field(default_factory=list)

    # ── Estimates ─────────────────────────────────────────────────
    estimated_complexity: str = Field(
        ..., description="simple | moderate | complex | enterprise"
    )
    suggested_team_size: int = Field(..., description="Recommended number of developers")
    priority_level: str = Field(..., description="low | medium | high | critical")
    estimated_timeline_weeks: int = Field(..., description="Estimated duration in weeks")
    suggested_budget_range: BudgetRange

    # ── Risk & Deliverables ───────────────────────────────────────
    potential_risks: List[Risk] = Field(default_factory=list)
    deliverables: List[str] = Field(default_factory=list)
    dependencies: List[str] = Field(default_factory=list)

    # ── Meta ──────────────────────────────────────────────────────
    analysis_confidence: str = Field(
        default="medium",
        description="AI confidence in this analysis: low | medium | high",
    )
    analysis_notes: Optional[str] = Field(
        default=None,
        description="Any additional notes or clarifications from the AI",
    )


# ── Project Request Schemas ────────────────────────────────────────────────

class ProjectAnalyzeRequest(BaseModel):
    """Request schema for the /api/projects/analyze endpoint."""

    title: str = Field(
        ...,
        min_length=3,
        max_length=500,
        description="Project title",
        examples=["E-commerce Platform with AI Recommendations"],
    )

    description: str = Field(
        ...,
        min_length=50,
        max_length=10000,
        description="Detailed project description (minimum 50 characters)",
    )

    budget: Optional[float] = Field(
        default=None,
        ge=0,
        description="Optional budget in USD",
    )

    deadline: Optional[datetime] = Field(
        default=None,
        description="Optional project deadline (ISO 8601 format)",
    )


class ProjectCreateRequest(ProjectAnalyzeRequest):
    """Request schema for creating and saving a project."""
    pass


# ── Project Response Schemas ───────────────────────────────────────────────

class ProjectResponse(BaseModel):
    """Full project response including AI analysis."""

    model_config = {"from_attributes": True}

    id: uuid.UUID
    client_id: uuid.UUID
    title: str
    description: str
    budget: Optional[float] = None
    deadline: Optional[datetime] = None
    status: str
    ai_analysis: Optional[Dict[str, Any]] = None
    ai_model_used: Optional[str] = None
    analysis_completed_at: Optional[datetime] = None
    supporting_file_path: Optional[str] = None
    created_at: datetime
    updated_at: datetime


class ProjectListResponse(BaseModel):
    """Paginated list of projects."""

    projects: List[ProjectResponse]
    total: int
    page: int = 1
    per_page: int = 20


class AnalyzeResponse(BaseModel):
    """Response from the analyze endpoint — project + AI analysis."""

    project: ProjectResponse
    analysis: AIAnalysisResult
    message: str = "Project analyzed successfully"
