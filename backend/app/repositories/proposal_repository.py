"""
AgentVerse — Proposal Repository
==================================
Database layer for querying and updating proposal summaries, project matches,
and project assignment status.
"""

import uuid
from typing import List, Optional
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.project import Project, ProjectStatus
from app.models.project_match import ProjectMatch, MatchStatus
from app.models.proposal_summary import ProposalSummary
from app.utils.logger import get_logger

logger = get_logger(__name__)


class ProposalRepository:
    """
    Repository encapsulating database operations for Agent 3.
    """

    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def get_project(self, project_id: uuid.UUID) -> Optional[Project]:
        """Fetch project by ID with client relationship loaded."""
        res = await self.db.execute(
            select(Project)
            .options(selectinload(Project.client))
            .where(Project.id == project_id)
        )
        return res.scalar_one_or_none()

    async def get_accepted_matches(self, project_id: uuid.UUID) -> List[ProjectMatch]:
        """Fetch all accepted or assigned matches for a project."""
        res = await self.db.execute(
            select(ProjectMatch)
            .options(
                selectinload(ProjectMatch.freelancer),
                selectinload(ProjectMatch.project),
            )
            .where(
                ProjectMatch.project_id == project_id,
                ProjectMatch.status.in_([
                    MatchStatus.ACCEPTED,
                    MatchStatus.ASSIGNED,
                    MatchStatus.STARTED,
                    MatchStatus.NOT_SELECTED,
                ])
            )
            .order_by(ProjectMatch.match_score.desc())
        )
        return list(res.scalars().all())

    async def get_proposal_summary_by_match(
        self, match_id: uuid.UUID
    ) -> Optional[ProposalSummary]:
        """Fetch existing proposal summary for a match."""
        res = await self.db.execute(
            select(ProposalSummary)
            .options(
                selectinload(ProposalSummary.freelancer),
                selectinload(ProposalSummary.match),
            )
            .where(ProposalSummary.match_id == match_id)
        )
        return res.scalar_one_or_none()

    async def save_proposal_summary(
        self, summary: ProposalSummary
    ) -> ProposalSummary:
        """Save new proposal summary record."""
        self.db.add(summary)
        await self.db.commit()
        await self.db.refresh(
            summary, attribute_names=["freelancer", "match", "project"]
        )
        return summary

    async def assign_project_to_freelancer(
        self,
        project_id: uuid.UUID,
        selected_freelancer_id: uuid.UUID,
    ) -> Project:
        """
        Atomic assignment transaction:
        1. Set Project.status = IN_PROGRESS
        2. Set selected match status = ASSIGNED
        3. Set other accepted matches status = NOT_SELECTED
        """
        # Fetch project
        proj = await self.get_project(project_id)
        if not proj:
            raise ValueError(f"Project with ID '{project_id}' not found.")

        # Update Project status
        proj.status = ProjectStatus.IN_PROGRESS

        # Fetch all matches for this project
        matches_res = await self.db.execute(
            select(ProjectMatch).where(ProjectMatch.project_id == project_id)
        )
        matches = matches_res.scalars().all()

        for m in matches:
            if m.freelancer_id == selected_freelancer_id:
                m.status = MatchStatus.ASSIGNED
            else:
                m.status = MatchStatus.NOT_SELECTED

        # Update ProposalSummary selection_status if exists
        summaries_res = await self.db.execute(
            select(ProposalSummary).where(ProposalSummary.project_id == project_id)
        )
        summaries = summaries_res.scalars().all()
        for s in summaries:
            if s.freelancer_id == selected_freelancer_id:
                s.selection_status = "ASSIGNED"
            else:
                s.selection_status = "NOT_SELECTED"

        await self.db.commit()
        await self.db.refresh(proj, attribute_names=["client"])

        logger.info(
            "Project assigned successfully",
            project_id=str(project_id),
            assigned_freelancer_id=str(selected_freelancer_id),
        )

        return proj

    async def get_freelancer_assignment(
        self, freelancer_id: uuid.UUID
    ) -> Optional[ProjectMatch]:
        """Fetch active ASSIGNED project match for a freelancer."""
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
