"""
AgentVerse — Proposal Intelligence Pydantic Schemas (Agent 3)
================================================================
Data transfer objects for Agent 3 proposal summaries, recommendations,
and project assignment operations.
"""

import uuid
from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, ConfigDict, Field

from app.schemas.freelancer import FreelancerResponse
from app.schemas.project_match import ProjectMatchResponse


class ProposalSummaryResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    match_id: uuid.UUID
    project_id: uuid.UUID
    freelancer_id: uuid.UUID
    ai_summary: str = Field(..., description="Human-friendly summary (max 120 words)")
    why_matched: Optional[str] = Field(None, description="Reasons why candidate matches intent")
    strengths: List[str] = Field(default_factory=list, description="Key candidate strengths")
    confidence_score: float = Field(..., description="AI confidence percentage (0-100%)")
    recommendation_badge: str = Field(..., description="Recommendation badge text")
    selection_status: str = Field(..., description="Selection state (PENDING, ASSIGNED, NOT_SELECTED)")
    created_at: datetime
    updated_at: datetime
    freelancer: FreelancerResponse
    match: Optional[ProjectMatchResponse] = None


class AssignProjectRequest(BaseModel):
    freelancer_id: uuid.UUID = Field(..., description="Target freelancer UUID to assign the project to")


class AssignProjectResponse(BaseModel):
    project_id: uuid.UUID
    assigned_freelancer_id: uuid.UUID
    freelancer_name: str
    project_status: str
    message: str


class FreelancerAssignmentNotification(BaseModel):
    has_assignment: bool
    project_id: Optional[uuid.UUID] = None
    project_title: Optional[str] = None
    client_name: Optional[str] = None
    client_company: Optional[str] = None
    assigned_at: Optional[datetime] = None
    match_score: Optional[float] = None
