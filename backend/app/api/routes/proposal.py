"""
AgentVerse — Proposal Intelligence API Routes (Agent 3)
=========================================================
API endpoints for Agent 3 proposal summaries, AI recommendations,
project assignment, and freelancer assignment notifications.
"""

import uuid
from typing import List

from fastapi import APIRouter, Depends, status, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db, get_current_client, get_current_freelancer
from app.models.client import Client
from app.models.freelancer import Freelancer
from app.schemas.proposal import (
    ProposalSummaryResponse,
    AssignProjectRequest,
    AssignProjectResponse,
    FreelancerAssignmentNotification,
)
from app.services.proposal_service import ProposalService
from app.utils.logger import get_logger

logger = get_logger(__name__)

router = APIRouter(tags=["Proposal Intelligence Agent (Agent 3)"])


@router.get(
    "/projects/{project_id}/proposals",
    response_model=List[ProposalSummaryResponse],
    status_code=status.HTTP_200_OK,
    summary="Get Agent 3 AI proposal recommendations for accepted freelancers",
    description=(
        "Retrieves AI-generated proposal summaries, confidence scores, strengths, "
        "and recommendation badges for all freelancers who accepted invitations for this project."
    ),
)
async def get_proposal_summaries(
    project_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_client: Client = Depends(get_current_client),
) -> List[ProposalSummaryResponse]:
    """Get AI proposal recommendations for accepted freelancers."""
    service = ProposalService(db=db)
    proposals = await service.get_or_generate_proposals(project_id=project_id)
    return [ProposalSummaryResponse.model_validate(p) for p in proposals]


@router.post(
    "/projects/{project_id}/assign",
    response_model=AssignProjectResponse,
    status_code=status.HTTP_200_OK,
    summary="Assign project to selected freelancer",
    description=(
        "Assigns the project to the selected freelancer. Updates project status to IN_PROGRESS, "
        "sets selected match status to ASSIGNED, and sets other accepted matches to NOT_SELECTED."
    ),
)
async def assign_project(
    project_id: uuid.UUID,
    request: AssignProjectRequest,
    db: AsyncSession = Depends(get_db),
    current_client: Client = Depends(get_current_client),
) -> AssignProjectResponse:
    """Assign project to a freelancer."""
    service = ProposalService(db=db)
    return await service.assign_project(
        project_id=project_id,
        freelancer_id=request.freelancer_id,
    )


@router.get(
    "/freelancer/assignment",
    response_model=FreelancerAssignmentNotification,
    status_code=status.HTTP_200_OK,
    summary="Get active assignment notification for logged-in freelancer",
    description="Returns assignment notification details if freelancer was selected for a project.",
)
async def get_freelancer_assignment(
    current_freelancer: Freelancer = Depends(get_current_freelancer),
    db: AsyncSession = Depends(get_db),
) -> FreelancerAssignmentNotification:
    """Check if freelancer was selected for a project."""
    service = ProposalService(db=db)
    return await service.get_freelancer_assignment(freelancer=current_freelancer)
