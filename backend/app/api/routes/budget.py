"""
AgentVerse — Budget Intelligence API Routes (Agent 4)
======================================================
API endpoints for Agent 4 budget recommendations, client offer validation,
and freelancer offer acceptance/decline handling.
"""

import uuid
from typing import Optional

from fastapi import APIRouter, Depends, status, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db, get_current_client, get_current_freelancer
from app.models.client import Client
from app.models.freelancer import Freelancer
from app.schemas.budget import (
    BudgetRecommendationResponse,
    SendBudgetOfferRequest,
    SendBudgetOfferResponse,
    RespondBudgetOfferRequest,
    RespondBudgetOfferResponse,
    FreelancerBudgetOfferNotification,
)
from app.services.budget_service import BudgetService
from app.utils.logger import get_logger

logger = get_logger(__name__)

router = APIRouter(tags=["Budget Intelligence Agent (Agent 4)"])


@router.get(
    "/projects/{project_id}/budget-recommendation",
    response_model=Optional[BudgetRecommendationResponse],
    status_code=status.HTTP_200_OK,
    summary="Get Agent 4 AI budget recommendation",
    description="Retrieves AI recommended minimum, maximum, and recommended budget range after freelancer selection.",
)
async def get_budget_recommendation(
    project_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_client: Client = Depends(get_current_client),
) -> Optional[BudgetRecommendationResponse]:
    """Get AI budget recommendation."""
    service = BudgetService(db=db)
    rec = await service.get_or_generate_budget_recommendation(project_id=project_id)
    if not rec:
        return None
    return BudgetRecommendationResponse.model_validate(rec)


@router.post(
    "/projects/{project_id}/send-budget-offer",
    response_model=SendBudgetOfferResponse,
    status_code=status.HTTP_200_OK,
    summary="Client sends final validated budget offer",
    description="Validates that entered budget falls within AI recommended range and sends offer to selected freelancer.",
)
async def send_budget_offer(
    project_id: uuid.UUID,
    request: SendBudgetOfferRequest,
    db: AsyncSession = Depends(get_db),
    current_client: Client = Depends(get_current_client),
) -> SendBudgetOfferResponse:
    """Send budget offer."""
    service = BudgetService(db=db)
    return await service.send_budget_offer(
        project_id=project_id,
        client_budget=request.offered_budget,
    )


@router.post(
    "/projects/{project_id}/respond-budget-offer",
    response_model=RespondBudgetOfferResponse,
    status_code=status.HTTP_200_OK,
    summary="Freelancer responds to budget offer (START or DECLINE)",
    description="Freelancer starts project or declines budget offer. Reopens proposal selection or triggers new talent discovery if declined.",
)
async def respond_budget_offer(
    project_id: uuid.UUID,
    request: RespondBudgetOfferRequest,
    db: AsyncSession = Depends(get_db),
    current_freelancer: Freelancer = Depends(get_current_freelancer),
) -> RespondBudgetOfferResponse:
    """Respond to budget offer."""
    service = BudgetService(db=db)
    return await service.respond_budget_offer(
        project_id=project_id,
        freelancer=current_freelancer,
        action=request.action,
    )


@router.get(
    "/freelancer/budget-offer",
    response_model=FreelancerBudgetOfferNotification,
    status_code=status.HTTP_200_OK,
    summary="Get active budget offer for logged-in freelancer",
    description="Returns active budget offer notification details for logged-in freelancer.",
)
async def get_freelancer_budget_offer(
    current_freelancer: Freelancer = Depends(get_current_freelancer),
    db: AsyncSession = Depends(get_db),
) -> FreelancerBudgetOfferNotification:
    """Check active budget offer for freelancer."""
    service = BudgetService(db=db)
    return await service.get_freelancer_budget_offer(freelancer=current_freelancer)
