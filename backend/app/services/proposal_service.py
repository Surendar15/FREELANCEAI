"""
AgentVerse — Proposal Intelligence Service (Agent 3)
======================================================
Service layer orchestrating Agent 3 AI proposal generation, proposal summaries,
and project assignment transactions.
"""

import uuid
from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession

from app.agents.proposal_agent import proposal_agent
from app.core.exceptions import NotFoundError, BadRequestError
from app.models.freelancer import Freelancer
from app.models.project import Project, ProjectStatus
from app.models.project_match import ProjectMatch, MatchStatus
from app.models.proposal_summary import ProposalSummary
from app.repositories.proposal_repository import ProposalRepository
from app.schemas.proposal import (
    AssignProjectResponse,
    FreelancerAssignmentNotification,
)
from app.utils.logger import get_logger

logger = get_logger(__name__)


class ProposalService:
    """
    ProposalService — business logic for Agent 3 (Proposal Intelligence Agent).
    """

    def __init__(self, db: AsyncSession) -> None:
        self.db = db
        self.repo = ProposalRepository(db=db)

    async def get_or_generate_proposals(
        self, project_id: uuid.UUID
    ) -> List[ProposalSummary]:
        """
        Retrieves or generates AI proposal summaries for all freelancers
        who accepted invitations for the specified project.
        """
        logger.info("Executing Agent 3 proposal intelligence workflow", project_id=str(project_id))

        # 1. Verify project
        project = await self.repo.get_project(project_id)
        if not project:
            raise NotFoundError(resource="Project", resource_id=project_id)

        # 2. Get accepted/assigned matches
        matches = await self.repo.get_accepted_matches(project_id)
        if not matches:
            logger.info("No accepted freelancer matches for project", project_id=str(project_id))
            return []

        proposals: List[ProposalSummary] = []

        for match in matches:
            # Check existing proposal summary
            existing_summary = await self.repo.get_proposal_summary_by_match(match.id)

            if existing_summary:
                proposals.append(existing_summary)
                continue

            # Generate new AI summary via Proposal Intelligence Agent
            freelancer = match.freelancer
            freelancer_dict = {
                "id": str(freelancer.id),
                "name": freelancer.name,
                "title": freelancer.title,
                "skills": freelancer.skills,
                "experience": freelancer.experience,
                "rating": freelancer.rating,
                "completed_projects": freelancer.completed_projects,
                "availability": freelancer.availability,
                "bio": freelancer.bio or "",
            }

            ai_res = await proposal_agent.generate_summary(
                project_title=project.title,
                project_description=project.description,
                ai_analysis=project.ai_analysis,
                freelancer_data=freelancer_dict,
                match_score=match.match_score,
            )

            # Create ProposalSummary record
            summary_obj = ProposalSummary(
                match_id=match.id,
                project_id=project_id,
                freelancer_id=freelancer.id,
                ai_summary=ai_res.get("ai_summary", ""),
                why_matched=ai_res.get("why_matched", ""),
                strengths=ai_res.get("strengths", []),
                confidence_score=ai_res.get("confidence_score", 95.0),
                recommendation_badge=ai_res.get("recommendation_badge", "⭐⭐ Highly Recommended"),
                selection_status="ASSIGNED" if match.status == MatchStatus.ASSIGNED else "PENDING",
            )

            saved = await self.repo.save_proposal_summary(summary_obj)
            proposals.append(saved)

        return proposals

    async def assign_project(
        self, project_id: uuid.UUID, freelancer_id: uuid.UUID
    ) -> AssignProjectResponse:
        """
        Assigns the project to the selected freelancer.
        """
        logger.info(
            "Assigning project to freelancer",
            project_id=str(project_id),
            freelancer_id=str(freelancer_id),
        )

        proj = await self.repo.assign_project_to_freelancer(
            project_id=project_id,
            selected_freelancer_id=freelancer_id,
        )

        # Get assigned freelancer name
        match = await self.db.get(Freelancer, freelancer_id)
        freelancer_name = match.name if match else "Freelancer"

        return AssignProjectResponse(
            project_id=project_id,
            assigned_freelancer_id=freelancer_id,
            freelancer_name=freelancer_name,
            project_status="IN_PROGRESS",
            message=f"Project successfully assigned to {freelancer_name}. Status is now IN_PROGRESS.",
        )

    async def get_freelancer_assignment(
        self, freelancer: Freelancer
    ) -> FreelancerAssignmentNotification:
        """
        Checks if the current logged-in freelancer has been assigned a project.
        """
        assigned_match = await self.repo.get_freelancer_assignment(freelancer.id)

        if not assigned_match or not assigned_match.project:
            return FreelancerAssignmentNotification(has_assignment=False)

        proj = assigned_match.project
        client_name = proj.client.full_name if proj.client else "Client"
        client_company = proj.client.company_name if proj.client else None

        return FreelancerAssignmentNotification(
            has_assignment=True,
            project_id=proj.id,
            project_title=proj.title,
            client_name=client_name,
            client_company=client_company,
            assigned_at=assigned_match.updated_at,
            match_score=assigned_match.match_score,
        )
