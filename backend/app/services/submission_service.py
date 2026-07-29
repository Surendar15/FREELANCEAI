"""
AgentVerse — Submission Service (Agent 6)
===========================================
Business logic layer for final project submission artifacts (ZIP, GitHub URL, live deployment URL, PDF docs) and client final approval.
"""

import uuid
from datetime import datetime, timezone
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import NotFoundError, BadRequestError
from app.models.project import Project, ProjectStatus
from app.models.project_submission import ProjectSubmission
from app.repositories.submission_repository import SubmissionRepository
from app.repositories.progress_repository import ProgressRepository
from app.schemas.progress import ProjectSubmissionResponse, SubmitProjectRequest
from app.utils.logger import get_logger

logger = get_logger(__name__)


class SubmissionService:
    """
    SubmissionService — handles final project delivery artifacts and approval workflow.
    """

    def __init__(self, db: AsyncSession) -> None:
        self.db = db
        self.repo = SubmissionRepository(db=db)
        self.prog_repo = ProgressRepository(db=db)

    async def submit_project(
        self, project_id: uuid.UUID, req: SubmitProjectRequest
    ) -> ProjectSubmissionResponse:
        """
        Creates or updates final delivery submission record.
        """
        project = await self.prog_repo.get_project(project_id)
        if not project:
            raise NotFoundError(resource="Project", resource_id=project_id)

        submission = await self.repo.get_submission(project_id)
        now_utc = datetime.now(timezone.utc)

        if submission:
            submission.github_url = req.github_url or submission.github_url
            submission.zip_file_path = req.zip_file_path or submission.zip_file_path
            submission.deployment_url = req.deployment_url or submission.deployment_url
            submission.documentation_path = req.documentation_path or submission.documentation_path
            submission.submitted_at = now_utc
        else:
            submission = ProjectSubmission(
                project_id=project_id,
                github_url=req.github_url,
                zip_file_path=req.zip_file_path,
                deployment_url=req.deployment_url,
                documentation_path=req.documentation_path,
                submitted_at=now_utc,
            )

        saved = await self.repo.save_submission(submission)
        project.status = ProjectStatus.COMPLETED
        await self.db.commit()
        logger.info("Final project submission submitted — project marked COMPLETED", project_id=str(project_id))
        return ProjectSubmissionResponse.model_validate(saved)

    async def get_submission(
        self, project_id: uuid.UUID
    ) -> Optional[ProjectSubmissionResponse]:
        """
        Fetch submission details for project.
        """
        sub = await self.repo.get_submission(project_id)
        if not sub:
            return None
        return ProjectSubmissionResponse.model_validate(sub)

    async def accept_submission(
        self, project_id: uuid.UUID
    ) -> ProjectSubmissionResponse:
        """
        Client accepts final submission: updates Project.status to COMPLETED and sets approved_at.
        """
        project = await self.prog_repo.get_project(project_id)
        if not project:
            raise NotFoundError(resource="Project", resource_id=project_id)

        submission = await self.repo.get_submission(project_id)
        if not submission:
            raise BadRequestError("No final project submission found to approve.")

        now_utc = datetime.now(timezone.utc)
        submission.approved_at = now_utc
        project.status = ProjectStatus.COMPLETED

        saved = await self.repo.save_submission(submission)
        await self.db.commit()

        logger.info("Client accepted final project submission — project COMPLETED", project_id=str(project_id))
        return ProjectSubmissionResponse.model_validate(saved)
