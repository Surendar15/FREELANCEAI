"""
AgentVerse — Project Plan Pydantic Schemas (Agent 5)
=====================================================
Data transfer objects for Agent 5 project execution plans, milestones,
tasks, deliverables, and progress states.
"""

import uuid
from datetime import datetime
from typing import List, Optional, Any, Dict
from pydantic import BaseModel, ConfigDict, Field


class MilestoneSchema(BaseModel):
    phase_name: str = Field(..., description="Phase title (e.g. Requirement Verification)")
    duration_days: int = Field(..., description="Estimated phase duration in days")
    status: str = Field(default="Pending", description="Milestone status (Pending, In Progress, Completed)")
    tasks: List[str] = Field(default_factory=list, description="List of tasks in this phase")
    deliverable: str = Field(..., description="Key deliverable produced in this phase")


class ProjectPlanDetailSchema(BaseModel):
    overview: str = Field(..., description="Executive overview of execution roadmap")
    estimated_completion_days: int = Field(..., description="Total estimated days")
    phases: List[MilestoneSchema] = Field(default_factory=list, description="Ordered execution milestones")
    testing_phase: Optional[str] = Field(None, description="Testing & optimization strategy summary")
    deployment_phase: Optional[str] = Field(None, description="Deployment & launch strategy summary")
    suggested_daily_progress: float = Field(default=3.5, description="Recommended daily progress %")
    potential_risks: List[str] = Field(default_factory=list, description="Identified technical & timeline risks")
    recommendations: List[str] = Field(default_factory=list, description="AI recommendations for success")


class ProjectPlanResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    project_id: uuid.UUID
    overview: str
    estimated_completion_days: int
    plan_json: Dict[str, Any]
    created_at: datetime
    updated_at: datetime
