"""
AgentVerse — Project Plan Repository
======================================
Database layer for querying and storing project execution plans in PostgreSQL.
"""

import uuid
from typing import Optional
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.project import Project
from app.models.project_match import ProjectMatch, MatchStatus
from app.models.budget_recommendation import ProjectBudgetRecommendation
from app.models.project_plan import ProjectPlan
from app.utils.logger import get_logger

logger = get_logger(__name__)


class ProjectPlanRepository:
    """
    Repository encapsulating database operations for Agent 5.
    """

    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def get_project(self, project_id: uuid.UUID) -> Optional[Project]:
        """Fetch project by ID with client loaded."""
        res = await self.db.execute(
            select(Project)
            .options(selectinload(Project.client))
            .where(Project.id == project_id)
        )
        return res.scalar_one_or_none()

    async def get_plan_by_project(
        self, project_id: uuid.UUID
    ) -> Optional[ProjectPlan]:
        """Fetch existing project plan for project."""
        res = await self.db.execute(
            select(ProjectPlan)
            .options(selectinload(ProjectPlan.project))
            .where(ProjectPlan.project_id == project_id)
        )
        return res.scalar_one_or_none()

    async def save_plan(self, plan: ProjectPlan) -> ProjectPlan:
        """Save project execution plan."""
        self.db.add(plan)
        await self.db.commit()
        await self.db.refresh(plan, attribute_names=["project"])
        return plan

    async def get_assigned_match(
        self, project_id: uuid.UUID
    ) -> Optional[ProjectMatch]:
        """Fetch ASSIGNED or STARTED match for a project."""
        res = await self.db.execute(
            select(ProjectMatch)
            .options(selectinload(ProjectMatch.freelancer))
            .where(
                ProjectMatch.project_id == project_id,
                ProjectMatch.status.in_([MatchStatus.ASSIGNED, MatchStatus.STARTED]),
            )
        )
        return res.scalar_one_or_none()

    async def get_budget_recommendation(
        self, project_id: uuid.UUID
    ) -> Optional[ProjectBudgetRecommendation]:
        """Fetch budget recommendation for a project."""
        res = await self.db.execute(
            select(ProjectBudgetRecommendation).where(
                ProjectBudgetRecommendation.project_id == project_id
            )
        )
        return res.scalar_one_or_none()
