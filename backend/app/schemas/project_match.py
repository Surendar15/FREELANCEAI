"""
AgentVerse — Project Match Pydantic Schemas
=============================================
Data transfer objects for project-freelancer matching API.
"""

import uuid
from datetime import datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, ConfigDict, Field

from app.models.project_match import MatchStatus
from app.schemas.freelancer import FreelancerResponse


class ScoreBreakdown(BaseModel):
    skill_match: float = Field(..., description="Skill match score (out of 50)")
    experience_match: float = Field(..., description="Experience match score (out of 20)")
    rating_match: float = Field(..., description="Rating score (out of 15)")
    availability_match: float = Field(..., description="Availability score (out of 10)")
    completed_projects_match: float = Field(..., description="Completed projects score (out of 5)")
    matching_skills: List[str] = Field(default_factory=list, description="Skills that matched requirement")


class ProjectMatchResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    project_id: uuid.UUID
    freelancer_id: uuid.UUID
    match_score: float = Field(..., description="Overall match percentage (0-100)")
    status: MatchStatus
    score_breakdown: Optional[Dict[str, Any]] = None
    created_at: datetime
    updated_at: datetime
    freelancer: FreelancerResponse


class TalentDiscoveryRequest(BaseModel):
    project_id: uuid.UUID = Field(..., description="Target project UUID for talent discovery")


class TalentDiscoveryResponse(BaseModel):
    project_id: uuid.UUID
    matches: List[ProjectMatchResponse]
    message: str


class UpdateMatchStatusRequest(BaseModel):
    status: MatchStatus = Field(..., description="Updated invitation status: ACCEPTED or DECLINED")
