"""
AgentVerse — Project Planning API Routes (Agent 5)
===================================================
API endpoints for Agent 5 project execution plan generation and stored roadmap retrieval.
"""

import uuid
from typing import Optional

from fastapi import APIRouter, Depends, status, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db
from app.schemas.project_plan import ProjectPlanResponse
from app.services.project_plan_service import ProjectPlanService
from app.utils.logger import get_logger

logger = get_logger(__name__)

router = APIRouter(tags=["Project Planning Intelligence Agent (Agent 5)"])


@router.post(
    "/projects/{project_id}/generate-plan",
    response_model=ProjectPlanResponse,
    status_code=status.HTTP_200_OK,
    summary="Generate Agent 5 project execution roadmap",
    description="Generates execution plan for project once and persists to PostgreSQL.",
)
async def generate_project_plan(
    project_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),

) -> ProjectPlanResponse:
    """Generate project execution roadmap once."""
    service = ProjectPlanService(db=db)
    plan = await service.get_or_generate_plan(project_id=project_id)
    return ProjectPlanResponse.model_validate(plan)


@router.get(
    "/projects/{project_id}/plan",
    response_model=Optional[ProjectPlanResponse],
    status_code=status.HTTP_200_OK,
    summary="Get stored project execution plan",
    description="Loads stored project execution roadmap from PostgreSQL.",
)
async def get_project_plan(
    project_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),

) -> Optional[ProjectPlanResponse]:
    """Get stored project plan."""
    service = ProjectPlanService(db=db)
    plan = await service.get_plan(project_id=project_id)
    if not plan:
        return None
    return ProjectPlanResponse.model_validate(plan)
