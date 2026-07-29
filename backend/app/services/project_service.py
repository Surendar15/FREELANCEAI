"""
AgentVerse — Project Service
==============================
Business logic for project CRUD and AI analysis orchestration.
Follows the repository pattern — all DB operations are encapsulated here.

The analyze_project method is the core workflow:
    1. Create project record (status=ANALYZING)
    2. Invoke RequirementIntelligenceAgent
    3. Store AI result as JSONB
    4. Update status to ANALYZED
    5. Return combined project + analysis response
"""

import uuid
from datetime import datetime, timezone
from typing import List, Optional

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func


from app.config.settings import settings
from app.core.exceptions import NotFoundError, DatabaseError, RequirementAgentError
from app.models.client import Client
from app.models.project import Project, ProjectStatus
from app.schemas.project import (
    ProjectAnalyzeRequest,
    ProjectResponse,
    AnalyzeResponse,
    AIAnalysisResult,
)
from app.schemas.client import DashboardStats
from app.utils.logger import get_logger

logger = get_logger(__name__)


class ProjectService:
    """
    Project service — CRUD operations and AI analysis orchestration.
    """

    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def analyze_and_create_project(
        self,
        request: ProjectAnalyzeRequest,
        client: Client,
    ) -> AnalyzeResponse:
        """
        Core workflow: analyze a project description with AI and save to DB.
        
        Steps:
            1. Create a project with status=ANALYZING
            2. Call RequirementIntelligenceAgent
            3. Save AI analysis as JSONB
            4. Update status to ANALYZED
            5. Return AnalyzeResponse
            
        Args:
            request: Validated project data from the client
            client: Authenticated client making the request
            
        Returns:
            AnalyzeResponse with project record and structured AI analysis
            
        Raises:
            RequirementAgentError: If AI analysis fails
            DatabaseError: If saving to DB fails
        """
        logger.info(
            "Starting project analysis workflow",
            client_id=str(client.id),
            title=request.title,
        )

        # Step 1: Create project record in ANALYZING state
        project = Project(
            client_id=client.id,
            title=request.title,
            description=request.description,
            budget=float(request.budget) if request.budget else None,
            deadline=request.deadline,
            status=ProjectStatus.ANALYZING,
        )

        try:
            self.db.add(project)
            await self.db.flush()  # Get ID assigned
            logger.info("Project record created", project_id=str(project.id))
        except Exception as exc:
            logger.error("Failed to create project record", error=str(exc))
            raise DatabaseError(message="Failed to create project in database")

        # Step 2: Invoke Requirement Intelligence Agent
        from app.agents.requirement_agent import requirement_agent
        try:
            analysis: AIAnalysisResult = await requirement_agent.analyze(
                title=request.title,
                description=request.description,
                budget=request.budget,
                deadline=request.deadline,
            )
        except RequirementAgentError:
            # Rollback project to DRAFT on agent failure
            project.status = ProjectStatus.DRAFT
            await self.db.flush()
            raise

        # Step 3: Store AI analysis and update status
        project.ai_analysis = analysis.model_dump()
        project.ai_model_used = settings.OPENROUTER_MODEL
        project.analysis_completed_at = datetime.now(timezone.utc)
        project.status = ProjectStatus.ANALYZED

        await self.db.flush()
        await self.db.refresh(project)

        logger.info(
            "Project analysis completed and saved",
            project_id=str(project.id),
            complexity=analysis.estimated_complexity,
        )

        return AnalyzeResponse(
            project=ProjectResponse.model_validate(project),
            analysis=analysis,
            message="Project analyzed successfully by the Requirement Intelligence Agent",
        )

    async def get_projects_by_client(
        self,
        client_id: uuid.UUID,
        page: int = 1,
        per_page: int = 20,
    ) -> List[Project]:
        """
        Get all projects for a specific client with pagination.
        
        Args:
            client_id: Client's UUID
            page: Page number (1-indexed)
            per_page: Items per page
            
        Returns:
            List of Project ORM instances
        """
        offset = (page - 1) * per_page

        result = await self.db.execute(
            select(Project)
            .where(Project.client_id == client_id)
            .order_by(Project.created_at.desc())
            .offset(offset)
            .limit(per_page)
        )

        return list(result.scalars().all())

    async def get_project_by_id(
        self,
        project_id: uuid.UUID,
        client_id: uuid.UUID,
    ) -> Project:
        """
        Get a specific project by ID, ensuring it belongs to the client.
        
        Args:
            project_id: Project UUID
            client_id: Client UUID (ownership check)
            
        Returns:
            Project ORM instance
            
        Raises:
            NotFoundError: If project doesn't exist or doesn't belong to client
        """
        result = await self.db.execute(
            select(Project).where(
                Project.id == project_id,
                Project.client_id == client_id,
            )
        )
        project = result.scalar_one_or_none()

        if not project:
            raise NotFoundError(resource="Project", resource_id=project_id)

        return project

    async def get_dashboard_stats(self, client_id: uuid.UUID) -> DashboardStats:
        """
        Calculate dashboard statistics for a client.
        
        Args:
            client_id: Client's UUID
            
        Returns:
            DashboardStats with counts
        """
        # Total projects
        total_result = await self.db.execute(
            select(func.count(Project.id)).where(Project.client_id == client_id)
        )
        total = total_result.scalar() or 0

        # Active projects (in_progress or published)
        active_result = await self.db.execute(
            select(func.count(Project.id)).where(
                Project.client_id == client_id,
                Project.status.in_([ProjectStatus.IN_PROGRESS, ProjectStatus.PUBLISHED]),
            )
        )
        active = active_result.scalar() or 0

        # Completed projects
        completed_result = await self.db.execute(
            select(func.count(Project.id)).where(
                Project.client_id == client_id,
                Project.status == ProjectStatus.COMPLETED,
            )
        )
        completed = completed_result.scalar() or 0

        # Projects with AI analysis
        analyzed_result = await self.db.execute(
            select(func.count(Project.id)).where(
                Project.client_id == client_id,
                Project.status.in_([ProjectStatus.ANALYZED, ProjectStatus.PUBLISHED, ProjectStatus.IN_PROGRESS, ProjectStatus.COMPLETED]),
            )
        )
        analyzed = analyzed_result.scalar() or 0

        return DashboardStats(
            total_projects=total,
            active_projects=active,
            completed_projects=completed,
            ai_analyses_completed=analyzed,
            notifications=0,  # Notification system to be added in future phases
        )
