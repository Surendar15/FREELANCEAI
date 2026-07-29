"""
AgentVerse — Progress & Submission Schemas (Agent 6)
=====================================================
Data transfer objects for Agent 6 progress tracking, proof uploads,
delay recovery alerts, project submissions, and completion reports.
"""

import uuid
from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, ConfigDict, Field


class ProgressTaskResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    project_id: uuid.UUID
    milestone_number: int
    task_name: str
    description: Optional[str] = None
    planned_start_date: datetime
    planned_end_date: datetime
    actual_completion_date: Optional[datetime] = None
    status: str  # PENDING, IN_PROGRESS, COMPLETED, OVERDUE, FAILED
    remarks: Optional[str] = None
    created_at: datetime
    updated_at: datetime


class UploadProgressRequest(BaseModel):
    task_id: uuid.UUID = Field(..., description="ID of progress task")
    description: Optional[str] = Field(None, description="Progress update notes or description")
    github_commit_url: Optional[str] = Field(None, description="GitHub commit URL")
    file_path: Optional[str] = Field(None, description="Optional uploaded screenshot/PDF/ZIP path")


class SubmitProjectRequest(BaseModel):
    github_url: Optional[str] = Field(None, description="GitHub repository URL")
    zip_file_path: Optional[str] = Field(None, description="Project code ZIP file path")
    deployment_url: Optional[str] = Field(None, description="Optional live production deployment URL")
    documentation_path: Optional[str] = Field(None, description="Optional architecture PDF or doc path")


class ProjectSubmissionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    project_id: uuid.UUID
    github_url: Optional[str] = None
    zip_file_path: Optional[str] = None
    deployment_url: Optional[str] = None
    documentation_path: Optional[str] = None
    submitted_at: datetime
    approved_at: Optional[datetime] = None


class DelayActionRequest(BaseModel):
    action: str = Field(..., description="CONTINUE or CANCEL_REASSIGN")


class CompletionReport(BaseModel):
    total_duration_days: int
    approved_budget: float
    freelancer_name: str
    freelancer_title: str
    milestones_completed_count: int
    completion_date: datetime


class ProjectProgressOverviewResponse(BaseModel):
    project_id: uuid.UUID
    overall_progress_percentage: float
    completed_tasks_count: int
    pending_tasks_count: int
    overdue_tasks_count: int
    current_milestone_number: int
    remaining_days: int
    delay_warning: Optional[str] = None
    ai_recovery_summary: Optional[str] = None
    is_delay_failed: bool = False
    tasks: List[ProgressTaskResponse] = Field(default_factory=list)
    submission: Optional[ProjectSubmissionResponse] = None
    completion_report: Optional[CompletionReport] = None
    message: Optional[str] = None
