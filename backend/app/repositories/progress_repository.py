"""
AgentVerse — Progress Repository (Agent 6)
===========================================
Database layer for querying and updating project progress tasks.
"""

import uuid
from typing import List, Optional
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.project import Project
from app.models.project_plan import ProjectPlan
from app.models.project_progress import ProjectProgress
from app.models.project_match import ProjectMatch, MatchStatus
from app.utils.logger import get_logger

logger = get_logger(__name__)


class ProgressRepository:
    """
    Repository encapsulating database operations for Agent 6 project progress tasks.
    """

    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def get_project(self, project_id: uuid.UUID) -> Optional[Project]:
        """Fetch project by ID."""
        res = await self.db.execute(
            select(Project)
            .options(selectinload(Project.client))
            .where(Project.id == project_id)
        )
        return res.scalar_one_or_none()

    async def get_plan_by_project(self, project_id: uuid.UUID) -> Optional[ProjectPlan]:
        """Fetch Agent 5 execution plan."""
        res = await self.db.execute(
            select(ProjectPlan).where(ProjectPlan.project_id == project_id)
        )
        return res.scalar_one_or_none()

    async def get_tasks_by_project(self, project_id: uuid.UUID) -> List[ProjectProgress]:
        """Fetch all milestone tasks for a project ordered by milestone and start date."""
        res = await self.db.execute(
            select(ProjectProgress)
            .where(ProjectProgress.project_id == project_id)
            .order_by(ProjectProgress.milestone_number.asc(), ProjectProgress.planned_start_date.asc())
        )
        return list(res.scalars().all())

    async def get_task_by_id(self, task_id: uuid.UUID) -> Optional[ProjectProgress]:
        """Fetch task by ID."""
        res = await self.db.execute(
            select(ProjectProgress).where(ProjectProgress.id == task_id)
        )
        return res.scalar_one_or_none()

    async def save_tasks(self, tasks: List[ProjectProgress]) -> List[ProjectProgress]:
        """Save list of progress tasks."""
        self.db.add_all(tasks)
        await self.db.commit()
        return tasks

    async def update_task(self, task: ProjectProgress) -> ProjectProgress:
        """Update single task record."""
        await self.db.commit()
        await self.db.refresh(task)
        return task

    async def get_assigned_match(self, project_id: uuid.UUID) -> Optional[ProjectMatch]:
        """Fetch ASSIGNED or STARTED match for project."""
        res = await self.db.execute(
            select(ProjectMatch)
            .options(selectinload(ProjectMatch.freelancer))
            .where(
                ProjectMatch.project_id == project_id,
                ProjectMatch.status.in_([MatchStatus.ASSIGNED, MatchStatus.STARTED]),
            )
        )
        return res.scalar_one_or_none()
