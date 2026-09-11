"""
AgentVerse — Progress Service (Agent 6)
========================================
Business logic layer for Agent 6 progress monitoring, delay detection,
grace period alerts, AI recovery summaries, and client continuation / candidate re-assignment.
"""

import uuid
from datetime import datetime, timedelta, timezone
from typing import Optional, List, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession

from app.agents.progress_monitoring_agent import progress_monitoring_agent
from app.core.exceptions import NotFoundError, BadRequestError
from app.models.project import Project, ProjectStatus
from app.models.project_progress import ProjectProgress
from app.repositories.progress_repository import ProgressRepository
from app.repositories.submission_repository import SubmissionRepository
from app.schemas.progress import (
    ProgressTaskResponse,
    ProjectProgressOverviewResponse,
    CompletionReport,
    ProjectSubmissionResponse,
)
from app.utils.logger import get_logger

logger = get_logger(__name__)


class ProgressService:
    """
    ProgressService — business logic for Agent 6 (Progress Monitoring & Recovery Agent).
    """

    def __init__(self, db: AsyncSession) -> None:
        self.db = db
        self.repo = ProgressRepository(db=db)
        self.sub_repo = SubmissionRepository(db=db)

    async def get_or_initialize_progress(
        self, project_id: uuid.UUID
    ) -> ProjectProgressOverviewResponse:
        """
        Fetches stored milestone tasks for a project. Initializes them from Agent 5 plan if none exist.
        Evaluates delay grace period and generates AI Recovery Summaries if needed.
        """
        logger.info("Executing Agent 6 progress monitoring workflow", project_id=str(project_id))

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
            return ProjectProgressOverviewResponse(
                project_id=project_id,
                tasks=[],
                overall_progress_percent=0.0,
                is_on_track=True,
                current_phase="Not Started",
                days_elapsed=0,
                total_estimated_days=0,
                delay_warning=None,
                ai_recovery_summary=None,
                is_delay_failed=False,
            )

        tasks = await self.repo.get_tasks_by_project(project_id)

        # 1. Initialize tasks from Agent 5 ProjectPlan if empty
        if not tasks:
            tasks = await self._initialize_tasks_from_plan(project_id, project)

        if not tasks:
            return ProjectProgressOverviewResponse(
                project_id=project_id,
                tasks=[],
                overall_progress_percent=0.0,
                is_on_track=True,
                current_phase="Not Started",
                days_elapsed=0,
                total_estimated_days=0,
                delay_warning=None,
                ai_recovery_summary=None,
                is_delay_failed=False,
            )

        # 2. Check for overdue/failed milestone status and grace period (2 days)
        now_utc = datetime.now(timezone.utc)
        delay_warning: Optional[str] = None
        ai_recovery_summary: Optional[str] = None
        is_delay_failed = False
        overdue_count = 0

        assigned_match = await self.repo.get_assigned_match(project_id)
        freelancer_name = assigned_match.freelancer.name if assigned_match and assigned_match.freelancer else "Assigned Freelancer"

        for task in tasks:
            if task.status in ["PENDING", "IN_PROGRESS", "OVERDUE", "FAILED"]:
                p_end = task.planned_end_date
                if p_end.tzinfo is None:
                    p_end = p_end.replace(tzinfo=timezone.utc)

                if now_utc > p_end and task.status != "COMPLETED":
                    days_overdue = (now_utc - p_end).days + 1
                    overdue_count += 1

                    # Grace Period logic: 2 Days
                    if (now_utc - p_end) <= timedelta(days=2):
                        if task.status != "OVERDUE":
                            task.status = "OVERDUE"
                            await self.repo.update_task(task)
                        delay_warning = (
                            "You have exceeded the scheduled completion date. "
                            "Please complete this milestone within 2 additional days."
                        )
                    else:
                        if task.status != "FAILED":
                            task.status = "FAILED"
                            await self.repo.update_task(task)
                        is_delay_failed = True
                        delay_warning = (
                            "The assigned freelancer has not completed the scheduled milestone even after the grace period."
                        )

                        # Generate OpenRouter AI Recovery Summary (<= 80 words)
                        ai_recovery_summary = await progress_monitoring_agent.generate_recovery_summary(
                            project_title=project.title,
                            overdue_task_name=task.task_name,
                            overdue_days=days_overdue,
                            freelancer_name=freelancer_name,
                            tech_stack=", ".join(project.ai_analysis.get("technologies", [])) if project.ai_analysis else None,
                        )
                        break

        # Calculate metrics
        completed_count = sum(1 for t in tasks if t.status == "COMPLETED")
        total_tasks = len(tasks) if tasks else 1
        progress_pct = round((completed_count / total_tasks) * 100.0, 1)
        pending_count = total_tasks - completed_count

        current_milestone = 1
        for t in tasks:
            if t.status != "COMPLETED":
                current_milestone = t.milestone_number
                break
        else:
            if tasks:
                current_milestone = tasks[-1].milestone_number

        # Remaining days calculation
        deadline_dt = project.created_at + timedelta(days=project.ai_analysis.get("estimated_timeline_weeks", 4) * 7) if project.ai_analysis else project.created_at + timedelta(days=30)
        if deadline_dt.tzinfo is None:
            deadline_dt = deadline_dt.replace(tzinfo=timezone.utc)
        rem_days = max(0, (deadline_dt - now_utc).days)

        # Check for final submission
        submission_obj = await self.sub_repo.get_submission(project_id)
        sub_resp = ProjectSubmissionResponse.model_validate(submission_obj) if submission_obj else None

        # Check for completion report if project completed
        report: Optional[CompletionReport] = None
        if project.status == ProjectStatus.COMPLETED and assigned_match:
            report = CompletionReport(
                total_duration_days=max(1, (now_utc - project.created_at.replace(tzinfo=timezone.utc)).days),
                approved_budget=project.budget or 1000.0,
                freelancer_name=freelancer_name,
                freelancer_title=assigned_match.freelancer.title if assigned_match.freelancer else "Specialist",
                milestones_completed_count=completed_count,
                completion_date=now_utc,
            )

        task_dtos = [ProgressTaskResponse.model_validate(t) for t in tasks]

        return ProjectProgressOverviewResponse(
            project_id=project_id,
            overall_progress_percentage=progress_pct,
            completed_tasks_count=completed_count,
            pending_tasks_count=pending_count,
            overdue_tasks_count=overdue_count,
            current_milestone_number=current_milestone,
            remaining_days=rem_days,
            delay_warning=delay_warning,
            ai_recovery_summary=ai_recovery_summary,
            is_delay_failed=is_delay_failed,
            tasks=task_dtos,
            submission=sub_resp,
            completion_report=report,
        )

    async def _initialize_tasks_from_plan(
        self, project_id: uuid.UUID, project: Project
    ) -> List[ProjectProgress]:
        """
        Creates milestone task records from Agent 5 ProjectPlan in database.
        """
        plan = await self.repo.get_plan_by_project(project_id)
        if not plan or not plan.plan_json:
            return []

        phases = plan.plan_json.get("phases", []) if plan and plan.plan_json else []

        created_tasks: List[ProjectProgress] = []
        curr_start = project.created_at.replace(tzinfo=timezone.utc) if project.created_at.tzinfo is None else project.created_at

        for idx, phase in enumerate(phases, start=1):
            dur_days = int(phase.get("duration_days", 3))
            phase_tasks = phase.get("tasks", ["Develop Phase Deliverables"])
            task_dur = max(1, dur_days // len(phase_tasks))

            for t_idx, t_name in enumerate(phase_tasks):
                p_end = curr_start + timedelta(days=task_dur)
                status_str = "IN_PROGRESS" if (idx == 1 and t_idx == 0) else "PENDING"

                prog = ProjectProgress(
                    project_id=project_id,
                    milestone_number=idx,
                    task_name=t_name,
                    description=f"{phase.get('phase_name', f'Phase {idx}')} — Deliverable: {phase.get('deliverable', 'Milestone Deliverable')}",
                    planned_start_date=curr_start,
                    planned_end_date=p_end,
                    status=status_str,
                )
                created_tasks.append(prog)
                curr_start = p_end

        if not created_tasks:
            return []

        return await self.repo.save_tasks(created_tasks)

    async def upload_progress(
        self,
        project_id: uuid.UUID,
        task_id: uuid.UUID,
        description: Optional[str],
        github_commit_url: Optional[str],
        file_path: Optional[str],
    ) -> ProjectProgressOverviewResponse:
        """
        Updates task remarks with progress proof details (Commit URL, notes, screenshot/file).
        """
        task = await self.repo.get_task_by_id(task_id)
        if not task or task.project_id != project_id:
            raise NotFoundError(resource="Progress Task", resource_id=task_id)

        remarks_parts = []
        if description:
            remarks_parts.append(f"Notes: {description}")
        if github_commit_url:
            remarks_parts.append(f"Commit: {github_commit_url}")
        if file_path:
            remarks_parts.append(f"File: {file_path}")

        task.remarks = " | ".join(remarks_parts)
        if task.status in ["PENDING", "OVERDUE"]:
            task.status = "IN_PROGRESS"

        await self.repo.update_task(task)
        logger.info("Progress update uploaded for task", task_id=str(task_id))
        return await self.get_or_initialize_progress(project_id)

    async def mark_task_complete(
        self, project_id: uuid.UUID, task_id: uuid.UUID
    ) -> ProjectProgressOverviewResponse:
        """
        Marks task COMPLETED, sets actual_completion_date, and unlocks next pending task.
        """
        task = await self.repo.get_task_by_id(task_id)
        if not task or task.project_id != project_id:
            raise NotFoundError(resource="Progress Task", resource_id=task_id)

        task.status = "COMPLETED"
        task.actual_completion_date = datetime.now(timezone.utc)
        await self.repo.update_task(task)

        # Unlock next pending task automatically
        all_tasks = await self.repo.get_tasks_by_project(project_id)
        for t in all_tasks:
            if t.status == "PENDING":
                t.status = "IN_PROGRESS"
                await self.repo.update_task(t)
                break

        logger.info("Milestone task marked complete", task_id=str(task_id))
        return await self.get_or_initialize_progress(project_id)

    async def handle_delay_action(
        self, project_id: uuid.UUID, action: str
    ) -> ProjectProgressOverviewResponse:
        """
        Processes client delay action:
        - CONTINUE: Resets failed/overdue status and extends deadline by 2 days.
        - CANCEL_REASSIGN: Cancels current freelancer, reopens Proposal Agent for remaining accepted candidates or re-triggers Talent Discovery Agent (Agent 2) if 0 candidates remain.
        """
        clean_action = action.strip().upper()
        logger.info("Handling client delay action", project_id=str(project_id), action=clean_action)

        if clean_action == "CONTINUE":
            tasks = await self.repo.get_tasks_by_project(project_id)
            now_utc = datetime.now(timezone.utc)
            for t in tasks:
                if t.status in ["OVERDUE", "FAILED"]:
                    t.status = "IN_PROGRESS"
                    t.planned_end_date = now_utc + timedelta(days=2)
                    await self.repo.update_task(t)
            logger.info("Project continued after delay warning", project_id=str(project_id))
        elif clean_action == "CANCEL_REASSIGN":
            # Cancel current freelancer via BudgetService logic fallback
            from app.services.budget_service import BudgetService
            b_service = BudgetService(db=self.db)
            assigned_match = await self.repo.get_assigned_match(project_id)
            if assigned_match:
                freelancer = assigned_match.freelancer
                await b_service.respond_budget_offer(project_id, freelancer, "DECLINE")

        return await self.get_or_initialize_progress(project_id)
