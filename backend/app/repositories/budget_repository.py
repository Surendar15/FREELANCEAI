"""
AgentVerse — Budget Repository
================================
Database layer for querying and persisting project budget recommendations,
client budget offers, and budget response state transitions.
"""

import uuid
from typing import Optional, List
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.project import Project, ProjectStatus
from app.models.project_match import ProjectMatch, MatchStatus
from app.models.budget_recommendation import ProjectBudgetRecommendation
from app.utils.logger import get_logger

logger = get_logger(__name__)


class BudgetRepository:
    """
    Repository encapsulating database operations for Agent 4.
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

    async def get_budget_recommendation(
        self, project_id: uuid.UUID
    ) -> Optional[ProjectBudgetRecommendation]:
        """Fetch budget recommendation for project."""
        res = await self.db.execute(
            select(ProjectBudgetRecommendation).where(
                ProjectBudgetRecommendation.project_id == project_id
            )
        )
        return res.scalar_one_or_none()

    async def save_budget_recommendation(
        self, rec: ProjectBudgetRecommendation
    ) -> ProjectBudgetRecommendation:
        """Save budget recommendation."""
        self.db.add(rec)
        await self.db.commit()
        await self.db.refresh(rec)
        return rec

    async def get_assigned_match(
        self, project_id: uuid.UUID
    ) -> Optional[ProjectMatch]:
        """Fetch ASSIGNED or STARTED match for a project."""
        res = await self.db.execute(
            select(ProjectMatch)
            .options(
                selectinload(ProjectMatch.freelancer),
                selectinload(ProjectMatch.project),
            )
            .where(
                ProjectMatch.project_id == project_id,
                ProjectMatch.status.in_([MatchStatus.ASSIGNED, MatchStatus.STARTED]),
            )
        )
        return res.scalar_one_or_none()

    async def get_remaining_accepted_matches(
        self, project_id: uuid.UUID
    ) -> List[ProjectMatch]:
        """Fetch other accepted matches for a project excluding declined ones."""
        res = await self.db.execute(
            select(ProjectMatch)
            .options(selectinload(ProjectMatch.freelancer))
            .where(
                ProjectMatch.project_id == project_id,
                ProjectMatch.status.in_([
                    MatchStatus.ACCEPTED,
                    MatchStatus.NOT_SELECTED,
                ]),
            )
        )
        return list(res.scalars().all())

    async def update_budget_offer(
        self, project_id: uuid.UUID, client_budget: float
    ) -> ProjectBudgetRecommendation:
        """Update client entered budget offer and set status to OFFERED."""
        rec = await self.get_budget_recommendation(project_id)
        if not rec:
            raise ValueError(f"Budget recommendation for project '{project_id}' not found.")

        rec.client_entered_budget = client_budget
        rec.budget_status = "OFFERED"
        await self.db.commit()
        await self.db.refresh(rec)
        return rec

    async def get_freelancer_budget_offer(
        self, freelancer_id: uuid.UUID
    ) -> Optional[ProjectMatch]:
        """Fetch active project match with OFFERED budget for logged-in freelancer."""
        res = await self.db.execute(
            select(ProjectMatch)
            .options(
                selectinload(ProjectMatch.project).selectinload(Project.client),
                selectinload(ProjectMatch.freelancer),
            )
            .where(
                ProjectMatch.freelancer_id == freelancer_id,
                ProjectMatch.status == MatchStatus.ASSIGNED,
            )
            .order_by(ProjectMatch.updated_at.desc())
        )
        return res.scalars().first()
