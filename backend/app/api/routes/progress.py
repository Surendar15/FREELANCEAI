"""
AgentVerse — Progress Monitoring API Routes (Agent 6)
======================================================
API endpoints for Agent 6 progress tracking, milestone updates, delay alerts, proof uploads, project submissions, and completion approval.
"""

import uuid
from typing import Optional

from fastapi import APIRouter, Depends, status, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db
from app.schemas.progress import (
    ProjectProgressOverviewResponse,
    UploadProgressRequest,
    SubmitProjectRequest,
    ProjectSubmissionResponse,
    DelayActionRequest,
)
from app.services.progress_service import ProgressService
from app.services.submission_service import SubmissionService
from app.utils.logger import get_logger

logger = get_logger(__name__)

router = APIRouter(tags=["Progress Monitoring & Recovery Agent (Agent 6)"])


@router.get(
    "/projects/{project_id}/progress",
    response_model=ProjectProgressOverviewResponse,
    status_code=status.HTTP_200_OK,
    summary="Get Agent 6 project progress overview",
    description="Loads progress overview, milestone tasks, delay grace alerts, and completion status.",
)
async def get_project_progress(
    project_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
) -> ProjectProgressOverviewResponse:
    """Get overall project progress overview."""
    service = ProgressService(db=db)
    return await service.get_or_initialize_progress(project_id=project_id)


@router.post(
    "/projects/{project_id}/progress",
    response_model=ProjectProgressOverviewResponse,
    status_code=status.HTTP_200_OK,
    summary="Upload progress update proof",
    description="Allows freelancer to submit commit URL, notes, and file proof for a task.",
)
async def upload_progress(
    project_id: uuid.UUID,
    req: UploadProgressRequest,
    db: AsyncSession = Depends(get_db),
) -> ProjectProgressOverviewResponse:
    """Upload progress proof."""
    service = ProgressService(db=db)
    return await service.upload_progress(
        project_id=project_id,
        task_id=req.task_id,
        description=req.description,
        github_commit_url=req.github_commit_url,
        file_path=req.file_path,
    )


@router.post(
    "/projects/{project_id}/mark-task-complete",
    response_model=ProjectProgressOverviewResponse,
    status_code=status.HTTP_200_OK,
    summary="Mark milestone task complete",
    description="Marks milestone task complete and unlocks next phase task.",
)
async def mark_task_complete(
    project_id: uuid.UUID,
    task_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
) -> ProjectProgressOverviewResponse:
    """Mark milestone task complete."""
    service = ProgressService(db=db)
    return await service.mark_task_complete(project_id=project_id, task_id=task_id)


@router.post(
    "/projects/{project_id}/handle-delay-action",
    response_model=ProjectProgressOverviewResponse,
    status_code=status.HTTP_200_OK,
    summary="Process client delay recovery action",
    description="Processes client decision to CONTINUE project or CANCEL_REASSIGN candidate.",
)
async def handle_delay_action(
    project_id: uuid.UUID,
    req: DelayActionRequest,
    db: AsyncSession = Depends(get_db),
) -> ProjectProgressOverviewResponse:
    """Handle client delay action."""
    service = ProgressService(db=db)
    return await service.handle_delay_action(project_id=project_id, action=req.action)


@router.post(
    "/projects/{project_id}/submit",
    response_model=ProjectSubmissionResponse,
    status_code=status.HTTP_200_OK,
    summary="Submit final project deliverables",
    description="Allows freelancer to upload ZIP, GitHub repository link, deployment URL, and documentation.",
)
async def submit_project(
    project_id: uuid.UUID,
    req: SubmitProjectRequest,
    db: AsyncSession = Depends(get_db),
) -> ProjectSubmissionResponse:
    """Submit final project deliverables."""
    service = SubmissionService(db=db)
    return await service.submit_project(project_id=project_id, req=req)


@router.get(
    "/projects/{project_id}/submission",
    response_model=Optional[ProjectSubmissionResponse],
    status_code=status.HTTP_200_OK,
    summary="Get project submission details",
    description="Fetches final project submission deliverables.",
)
async def get_submission(
    project_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
) -> Optional[ProjectSubmissionResponse]:
    """Get project submission details."""
    service = SubmissionService(db=db)
    return await service.get_submission(project_id=project_id)


@router.post(
    "/projects/{project_id}/accept-submission",
    response_model=ProjectSubmissionResponse,
    status_code=status.HTTP_200_OK,
    summary="Accept final submission & complete project",
    description="Client approves final submission, completing the project lifecycle.",
)
async def accept_submission(
    project_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
) -> ProjectSubmissionResponse:
    """Accept final submission."""
    service = SubmissionService(db=db)
    return await service.accept_submission(project_id=project_id)
