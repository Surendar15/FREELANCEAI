"""
AgentVerse — Project Plan Service (Agent 5)
============================================
Service layer orchestrating Agent 5 execution roadmap generation and
database persistence. Ensures strict one-time generation and database reuse.
"""

import uuid
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession

from app.agents.project_planning_agent import project_planning_agent
from app.core.exceptions import NotFoundError, BadRequestError
from app.models.project import Project
from app.models.project_plan import ProjectPlan
from app.repositories.project_plan_repository import ProjectPlanRepository
from app.utils.logger import get_logger

logger = get_logger(__name__)


class ProjectPlanService:
    """
    ProjectPlanService — business logic for Agent 5 (Project Planning Intelligence Agent).
    """

    def __init__(self, db: AsyncSession) -> None:
        self.db = db
        self.repo = ProjectPlanRepository(db=db)

    async def get_or_generate_plan(
        self, project_id: uuid.UUID
    ) -> ProjectPlan:
        """
        Retrieves existing stored project plan from PostgreSQL.
        If none exists, generates execution roadmap once via Agent 5 and stores it permanently.
        """
        logger.info("Executing Agent 5 project planning workflow", project_id=str(project_id))

        # 1. Verify project & check if freelancer has accepted budget / project started
        project = await self.repo.get_project(project_id)
        if not project:
            raise NotFoundError(resource="Project", resource_id=project_id)

        from app.models.project import ProjectStatus
        from app.models.project_match import MatchStatus

        assigned_match = await self.repo.get_assigned_match(project_id)
        is_started = (
            project.status in [ProjectStatus.IN_PROGRESS, ProjectStatus.COMPLETED]
            or (assigned_match and assigned_match.status == MatchStatus.STARTED)
        )
        if not is_started:
            raise BadRequestError(
                message="Project plan cannot be generated until the freelancer accepts the budget recommendation and starts the project."
            )

        # 2. Check if project plan already exists in database (PERMANENT DB REUSE RULE)
        existing_plan = await self.repo.get_plan_by_project(project_id)
        if existing_plan:
            logger.info("Loaded stored project plan from PostgreSQL — zero AI re-run", project_id=str(project_id))
            return existing_plan

        # 3. Fetch assigned freelancer & approved budget for prompt context
        freelancer = assigned_match.freelancer if assigned_match else None
        freelancer_dict = {
            "id": str(freelancer.id),
            "name": freelancer.name,
            "title": freelancer.title,
            "experience": freelancer.experience,
        } if freelancer else {}

        budget_rec = await self.repo.get_budget_recommendation(project_id)
        approved_budget = (
            budget_rec.client_entered_budget or budget_rec.recommended_budget
        ) if budget_rec else project.budget

        # 4. Generate new project plan via Agent 5
        ai_res = await project_planning_agent.generate_project_plan(
            project_title=project.title,
            project_description=project.description,
            ai_analysis=project.ai_analysis,
            freelancer_data=freelancer_dict,
            approved_budget=approved_budget,
        )

        overview_text = ai_res.get(
            "overview",
            f"Official 5-phase execution plan for '{project.title}' targeting completion in {ai_res.get('estimated_completion_days', 23)} days.",
        )

        total_days = int(ai_res.get("estimated_completion_days", 23))

        plan_obj = ProjectPlan(
            project_id=project_id,
            overview=overview_text,
            estimated_completion_days=total_days,
            plan_json=ai_res,
        )

        saved_plan = await self.repo.save_plan(plan_obj)
        logger.info(
            "Project plan generated and stored in PostgreSQL successfully",
            project_id=str(project_id),
            total_days=total_days,
        )

        return saved_plan

    async def get_plan(self, project_id: uuid.UUID) -> Optional[ProjectPlan]:
        """
        Get stored project plan if present and project has been started.
        """
        project = await self.repo.get_project(project_id)
        if not project:
            return None

        from app.models.project import ProjectStatus
        from app.models.project_match import MatchStatus

        assigned_match = await self.repo.get_assigned_match(project_id)
        is_started = (
            project.status in [ProjectStatus.IN_PROGRESS, ProjectStatus.COMPLETED]
            or (assigned_match and assigned_match.status == MatchStatus.STARTED)
        )
        if not is_started:
            return None

        return await self.repo.get_plan_by_project(project_id)
