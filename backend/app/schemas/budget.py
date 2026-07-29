"""
AgentVerse — Budget Intelligence Pydantic Schemas (Agent 4)
============================================================
Data transfer objects for Agent 4 budget recommendations, validation,
budget offer sending, and freelancer budget responses.
"""

import uuid
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field


class BudgetRecommendationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    project_id: uuid.UUID
    minimum_budget: float = Field(..., description="AI minimum budget floor (USD)")
    maximum_budget: float = Field(..., description="AI maximum budget ceiling (USD)")
    recommended_budget: float = Field(..., description="AI recommended target budget (USD)")
    budget_reason: str = Field(..., description="AI budget explanation (max 100 words)")
    client_entered_budget: Optional[float] = Field(None, description="Client submitted budget offer")
    budget_status: str = Field(..., description="Budget status: RECOMMENDED, OFFERED, ACCEPTED, DECLINED")
    created_at: datetime
    updated_at: datetime


class SendBudgetOfferRequest(BaseModel):
    offered_budget: float = Field(..., gt=0, description="Final budget offer in USD entered by client")


class SendBudgetOfferResponse(BaseModel):
    project_id: uuid.UUID
    offered_budget: float
    budget_status: str
    message: str


class RespondBudgetOfferRequest(BaseModel):
    action: str = Field(..., description="Response action: START or DECLINE")


class RespondBudgetOfferResponse(BaseModel):
    project_id: uuid.UUID
    action: str
    budget_status: str
    match_status: str
    message: str
    remaining_candidates_count: int = 0
    retriggered_discovery: bool = False


class FreelancerBudgetOfferNotification(BaseModel):
    has_offer: bool
    project_id: Optional[uuid.UUID] = None
    project_title: Optional[str] = None
    client_name: Optional[str] = None
    client_company: Optional[str] = None
    offered_budget: Optional[float] = None
    deadline: Optional[datetime] = None
    timeline_weeks: Optional[int] = None
    budget_status: Optional[str] = None
