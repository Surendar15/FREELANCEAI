"""
AgentVerse — Budget Intelligence Service (Agent 4)
===================================================
Service layer orchestrating Agent 4 AI budget analysis, client offer validation,
freelancer budget response handling, and candidate fallback automation.
"""

import uuid
from typing import Optional, List
from sqlalchemy.ext.asyncio import AsyncSession

from app.agents.budget_agent import budget_agent
from app.agents.talent_discovery_agent import talent_discovery_agent
from app.core.exceptions import NotFoundError, BadRequestError
from app.models.freelancer import Freelancer
from app.models.project import Project, ProjectStatus
from app.models.project_match import ProjectMatch, MatchStatus
from app.models.budget_recommendation import ProjectBudgetRecommendation
from app.repositories.budget_repository import BudgetRepository
from app.schemas.budget import (
    SendBudgetOfferResponse,
    RespondBudgetOfferResponse,
    FreelancerBudgetOfferNotification,
)
from app.utils.logger import get_logger

logger = get_logger(__name__)


class BudgetService:
    """
    BudgetService — business logic for Agent 4 (Budget Intelligence Agent).
    """

    def __init__(self, db: AsyncSession) -> None:
        self.db = db
        self.repo = BudgetRepository(db=db)

    async def get_or_generate_budget_recommendation(
        self, project_id: uuid.UUID
    ) -> Optional[ProjectBudgetRecommendation]:
        """
        Retrieves or generates AI budget recommendation after a freelancer is assigned.
        """
        logger.info("Executing Agent 4 budget recommendation workflow", project_id=str(project_id))

        # 1. Fetch project
        project = await self.repo.get_project(project_id)
        if not project:
            raise NotFoundError(resource="Project", resource_id=project_id)

        # 2. Check if a freelancer has been assigned or started
        assigned_match = await self.repo.get_assigned_match(project_id)
        if not assigned_match:
            logger.info("No assigned freelancer for project — Agent 4 waiting for assignment", project_id=str(project_id))
            return None

        # 3. Check existing budget recommendation
        existing = await self.repo.get_budget_recommendation(project_id)
        if existing:
            return existing

        # 4. Generate new AI budget recommendation
        freelancer = assigned_match.freelancer
        freelancer_dict = {
            "id": str(freelancer.id),
            "name": freelancer.name,
            "title": freelancer.title,
            "experience": freelancer.experience,
            "rating": freelancer.rating,
        }

        ai_res = await budget_agent.calculate_budget_recommendation(
            project_title=project.title,
            project_description=project.description,
            ai_analysis=project.ai_analysis,
            freelancer_data=freelancer_dict,
            client_budget=project.budget,
        )

        rec_obj = ProjectBudgetRecommendation(
            project_id=project_id,
            minimum_budget=ai_res.get("minimum_budget", 450.0),
            maximum_budget=ai_res.get("maximum_budget", 550.0),
            recommended_budget=ai_res.get("recommended_budget", 500.0),
            budget_reason=ai_res.get("budget_reason", ""),
            budget_status="RECOMMENDED",
        )

        return await self.repo.save_budget_recommendation(rec_obj)

    async def send_budget_offer(
        self, project_id: uuid.UUID, client_budget: float
    ) -> SendBudgetOfferResponse:
        """
        Validates client entered budget range and sends offer to selected freelancer.
        """
        logger.info("Validating and sending budget offer", project_id=str(project_id), budget=client_budget)

        rec = await self.repo.get_budget_recommendation(project_id)
        if not rec:
            raise BadRequestError("AI Budget Recommendation has not been generated for this project yet.")

        # VALIDATION RULES:
        # Minimum check
        if client_budget < rec.minimum_budget:
            raise BadRequestError(
                f"The entered budget (${client_budget:,.2f}) is lower than the AI recommended range "
                f"(${rec.minimum_budget:,.2f} - ${rec.maximum_budget:,.2f}) and may reduce freelancer acceptance."
            )

        # Maximum check
        if client_budget > rec.maximum_budget:
            raise BadRequestError(
                f"The entered budget (${client_budget:,.2f}) exceeds the AI recommended range "
                f"(${rec.minimum_budget:,.2f} - ${rec.maximum_budget:,.2f}). Please review before sending."
            )

        updated_rec = await self.repo.update_budget_offer(project_id, client_budget)

        return SendBudgetOfferResponse(
            project_id=project_id,
            offered_budget=client_budget,
            budget_status=updated_rec.budget_status,
            message=f"Budget offer of ${client_budget:,.2f} sent successfully to selected freelancer.",
        )

    async def respond_budget_offer(
        self, project_id: uuid.UUID, freelancer: Freelancer, action: str
    ) -> RespondBudgetOfferResponse:
        """
        Handles freelancer budget acceptance (START) or decline (DECLINE).
        """
        clean_action = action.strip().upper()
        logger.info("Processing freelancer budget response", project_id=str(project_id), action=clean_action)

        rec = await self.repo.get_budget_recommendation(project_id)
        if not rec:
            raise BadRequestError("Budget recommendation record not found for project.")

        assigned_match = await self.repo.get_assigned_match(project_id)
        if not assigned_match or assigned_match.freelancer_id != freelancer.id:
            raise BadRequestError("Logged-in freelancer is not assigned to this project.")

        if clean_action == "START":
            # Update status to STARTED & IN_PROGRESS
            assigned_match.status = MatchStatus.STARTED
            rec.budget_status = "ACCEPTED"
            proj = await self.repo.get_project(project_id)
            if proj:
                proj.status = ProjectStatus.IN_PROGRESS

            await self.db.commit()

            # Trigger Agent 5 (Project Plan) -> Agent 6 (Progress Monitoring) in strict series
            try:
                from app.services.project_plan_service import ProjectPlanService
                plan_service = ProjectPlanService(db=self.db)
                await plan_service.get_or_generate_plan(project_id)

                from app.services.progress_service import ProgressService
                progress_service = ProgressService(db=self.db)
                await progress_service.get_or_initialize_progress(project_id)
            except Exception as plan_exc:
                logger.warning("Agent 5/6 auto-generation error on start", error=str(plan_exc))

            return RespondBudgetOfferResponse(
                project_id=project_id,
                action="START",
                budget_status="ACCEPTED",
                match_status="STARTED",
                message="Project Started Successfully! Project plan generated.",
            )

        elif clean_action == "DECLINE":
            # Update status to DECLINED_BUDGET
            assigned_match.status = MatchStatus.DECLINED_BUDGET
            rec.budget_status = "DECLINED"

            # Check remaining accepted matches
            remaining_matches = await self.repo.get_remaining_accepted_matches(project_id)

            retriggered_discovery = False

            if remaining_matches:
                # Re-enable remaining candidate matches to ACCEPTED
                for m in remaining_matches:
                    m.status = MatchStatus.ACCEPTED
                await self.db.commit()
                logger.info(
                    "Reopened Proposal Intelligence Agent for remaining accepted candidates",
                    project_id=str(project_id),
                    remaining_count=len(remaining_matches),
                )
            else:
                # 0 candidates remaining -> Automatically trigger Agent 2 Talent Discovery
                logger.info("No candidates remaining — re-triggering Agent 2 Talent Discovery", project_id=str(project_id))
                retriggered_discovery = True
                
                # Fetch project details for matching
                proj = await self.repo.get_project(project_id)
                if proj:
                    # Exclude previously declined freelancers
                    excluded_ids = [str(assigned_match.freelancer_id)]
                    new_matches = await talent_discovery_agent.discover_and_save_matches(
                        db=self.db,
                        project=proj,
                        exclude_freelancer_ids=excluded_ids,
                    )
                    logger.info("Generated new Top matches via Agent 2", new_count=len(new_matches))

            return RespondBudgetOfferResponse(
                project_id=project_id,
                action="DECLINE",
                budget_status="DECLINED",
                match_status="DECLINED_BUDGET",
                message=(
                    "Budget declined by freelancer. "
                    + ("Remaining candidates reopened." if remaining_matches else "New Talent Discovery triggered.")
                ),
                remaining_candidates_count=len(remaining_matches),
                retriggered_discovery=retriggered_discovery,
            )

        else:
            raise BadRequestError(f"Invalid response action '{action}'. Must be START or DECLINE.")

    async def get_freelancer_budget_offer(
        self, freelancer: Freelancer
    ) -> FreelancerBudgetOfferNotification:
        """
        Checks if logged-in freelancer has an active budget offer to accept/decline.
        """
        match = await self.repo.get_freelancer_budget_offer(freelancer.id)

        if not match or not match.project:
            return FreelancerBudgetOfferNotification(has_offer=False)

        proj = match.project
        rec = await self.repo.get_budget_recommendation(proj.id)

        if not rec or rec.budget_status != "OFFERED":
            return FreelancerBudgetOfferNotification(has_offer=False)

        client_name = proj.client.full_name if proj.client else "Client"
        client_company = proj.client.company_name if proj.client else None
        timeline_weeks = proj.ai_analysis.get("estimated_timeline_weeks", 4) if proj.ai_analysis else 4

        return FreelancerBudgetOfferNotification(
            has_offer=True,
            project_id=proj.id,
            project_title=proj.title,
            client_name=client_name,
            client_company=client_company,
            offered_budget=rec.client_entered_budget or rec.recommended_budget,
            deadline=proj.deadline,
            timeline_weeks=timeline_weeks,
            budget_status=rec.budget_status,
        )
