"""
AgentVerse — Talent Matching Service
======================================
Service layer for matching projects with top freelancers.
Handles database queries, agent orchestration, match persistence, and status updates.
"""

import uuid
from typing import List
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from app.agents.talent_discovery_agent import talent_discovery_agent
from app.core.exceptions import NotFoundError, BadRequestError
from app.models.freelancer import Freelancer
from app.models.project import Project
from app.models.project_match import ProjectMatch, MatchStatus
from app.utils.logger import get_logger

logger = get_logger(__name__)


class TalentMatchingService:
    """
    TalentMatchingService — encapsulates business logic for Agent 2.
    """

    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def discover_and_save_matches(
        self,
        project_id: uuid.UUID,
    ) -> List[ProjectMatch]:
        """
        Run the Talent Discovery Agent matching engine for a project
        and save the top 3 matches into the database.
        
        Args:
            project_id: Project UUID
            
        Returns:
            List of created/updated ProjectMatch ORM objects
        """
        logger.info("Executing talent discovery workflow", project_id=str(project_id))

        # 1. Fetch Project
        project_res = await self.db.execute(
            select(Project).where(Project.id == project_id)
        )
        project = project_res.scalar_one_or_none()

        if not project:
            raise NotFoundError(resource="Project", resource_id=project_id)

        if not project.ai_analysis:
            raise BadRequestError(
                message="Project does not have AI requirement analysis results. Run Agent 1 first."
            )

        # 2. Fetch all active freelancers from DB
        freelancer_res = await self.db.execute(
            select(Freelancer).where(Freelancer.status == "Active")
        )
        freelancers = list(freelancer_res.scalars().all())

        if not freelancers:
            raise NotFoundError(resource="Freelancers", resource_id="active_pool")

        # 3. Run Talent Discovery Agent algorithm
        top_candidates = talent_discovery_agent.rank_freelancers(
            freelancers=freelancers,
            ai_analysis=project.ai_analysis,
            top_n=3,
        )

        # 4. Check existing matches for this project to update or replace
        existing_matches_res = await self.db.execute(
            select(ProjectMatch).where(ProjectMatch.project_id == project_id)
        )
        existing_matches = {m.freelancer_id: m for m in existing_matches_res.scalars().all()}

        saved_matches: List[ProjectMatch] = []

        for candidate in top_candidates:
            freelancer = candidate["freelancer"]
            score = candidate["match_score"]
            breakdown = candidate["score_breakdown"]

            if freelancer.id in existing_matches:
                match_obj = existing_matches[freelancer.id]
                match_obj.match_score = score
                match_obj.score_breakdown = breakdown
            else:
                match_obj = ProjectMatch(
                    project_id=project_id,
                    freelancer_id=freelancer.id,
                    match_score=score,
                    status=MatchStatus.NOTIFIED,
                    score_breakdown=breakdown,
                )
                self.db.add(match_obj)

            saved_matches.append(match_obj)

        await self.db.commit()
        
        # Refresh relationships for serialization
        for match in saved_matches:
            await self.db.refresh(match, attribute_names=["freelancer"])

        logger.info(
            "Talent discovery matches saved to DB",
            project_id=str(project_id),
            match_count=len(saved_matches),
        )

        return saved_matches

    async def get_project_matches(
        self,
        project_id: uuid.UUID,
    ) -> List[ProjectMatch]:
        """
        Get stored matches for a project. If none exist, runs discovery automatically.
        """
        result = await self.db.execute(
            select(ProjectMatch)
            .where(ProjectMatch.project_id == project_id)
            .order_by(ProjectMatch.match_score.desc())
        )
        matches = list(result.scalars().all())

        if not matches:
            matches = await self.discover_and_save_matches(project_id)

        return matches

    async def update_match_status(
        self,
        match_id: uuid.UUID,
        status: MatchStatus,
    ) -> ProjectMatch:
        """
        Update invitation response status (ACCEPTED or DECLINED) for a match.
        """
        logger.info("Updating project match status", match_id=str(match_id), status=status.value)

        result = await self.db.execute(
            select(ProjectMatch)
            .options(selectinload(ProjectMatch.freelancer))
            .where(ProjectMatch.id == match_id)
        )
        match_obj = result.scalar_one_or_none()

        if not match_obj:
            raise NotFoundError(resource="ProjectMatch", resource_id=match_id)

        match_obj.status = status
        await self.db.commit()

        res_fresh = await self.db.execute(
            select(ProjectMatch)
            .options(selectinload(ProjectMatch.freelancer))
            .where(ProjectMatch.id == match_id)
        )
        updated_match = res_fresh.scalar_one()

        logger.info("Project match status updated successfully", match_id=str(match_id), new_status=status.value)

        return updated_match
