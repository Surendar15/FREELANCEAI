"""
AgentVerse — Submission Repository (Agent 6)
==============================================
Database layer for querying and updating final project delivery submissions.
"""

import uuid
from typing import Optional
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.project import Project
from app.models.project_submission import ProjectSubmission
from app.utils.logger import get_logger

logger = get_logger(__name__)


class SubmissionRepository:
    """
    Repository encapsulating database operations for final project submissions.
    """

    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def get_submission(self, project_id: uuid.UUID) -> Optional[ProjectSubmission]:
        """Fetch submission for project."""
        res = await self.db.execute(
            select(ProjectSubmission).where(ProjectSubmission.project_id == project_id)
        )
        return res.scalar_one_or_none()

    async def save_submission(self, submission: ProjectSubmission) -> ProjectSubmission:
        """Save or update project submission."""
        self.db.add(submission)
        await self.db.commit()
        await self.db.refresh(submission)
        return submission
