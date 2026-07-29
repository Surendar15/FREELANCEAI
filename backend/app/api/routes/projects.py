"""
AgentVerse — Project Routes
==============================
Handles project creation, AI analysis, and retrieval.

Endpoints:
    POST /api/projects/analyze   — Analyze project with AI (creates + analyzes)
    GET  /api/projects           — List all projects for current client
    GET  /api/projects/{id}      — Get single project with AI analysis
"""

import uuid
from typing import Optional

from fastapi import APIRouter, Depends, Query, UploadFile, File, Form, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_client
from app.database.session import get_db
from app.models.client import Client
from app.schemas.project import (
    ProjectAnalyzeRequest,
    ProjectResponse,
    ProjectListResponse,
    AnalyzeResponse,
)
from app.services.project_service import ProjectService
from app.utils.logger import get_logger

logger = get_logger(__name__)

router = APIRouter(prefix="/projects", tags=["Projects"])


@router.post(
    "/analyze",
    response_model=AnalyzeResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Analyze project with AI",
    description=(
        "Submit a project description for AI-powered requirement analysis. "
        "The Requirement Intelligence Agent will extract technologies, skills, "
        "features, complexity, timeline, and budget estimates. "
        "Returns structured JSON analysis."
    ),
)
async def analyze_project(
    request: ProjectAnalyzeRequest,
    db: AsyncSession = Depends(get_db),
    current_client: Client = Depends(get_current_client),
) -> AnalyzeResponse:
    """
    Analyze a project with the Requirement Intelligence Agent.
    
    - **title**: Project title
    - **description**: Full description (min 50 chars) — more detail = better analysis
    - **budget**: Optional budget in USD
    - **deadline**: Optional deadline (ISO 8601 format)
    """
    service = ProjectService(db=db)
    result = await service.analyze_and_create_project(
        request=request,
        client=current_client,
    )
    logger.info(
        "Project analyzed via API",
        project_id=str(result.project.id),
        client_id=str(current_client.id),
    )
    return result


@router.get(
    "",
    response_model=ProjectListResponse,
    summary="List all projects",
    description="Get all projects created by the current client, ordered by creation date (newest first).",
)
async def list_projects(
    page: int = Query(default=1, ge=1, description="Page number"),
    per_page: int = Query(default=20, ge=1, le=100, description="Items per page"),
    db: AsyncSession = Depends(get_db),
    current_client: Client = Depends(get_current_client),
) -> ProjectListResponse:
    """List all projects for the authenticated client."""
    service = ProjectService(db=db)
    projects = await service.get_projects_by_client(
        client_id=current_client.id,
        page=page,
        per_page=per_page,
    )

    return ProjectListResponse(
        projects=[ProjectResponse.model_validate(p) for p in projects],
        total=len(projects),
        page=page,
        per_page=per_page,
    )


@router.get(
    "/{project_id}",
    response_model=ProjectResponse,
    summary="Get project by ID",
    description="Get a specific project with its full AI analysis result.",
)
async def get_project(
    project_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_client: Client = Depends(get_current_client),
) -> ProjectResponse:
    """Get a single project with AI analysis."""
    service = ProjectService(db=db)
    project = await service.get_project_by_id(
        project_id=project_id,
        client_id=current_client.id,
    )
    return ProjectResponse.model_validate(project)
