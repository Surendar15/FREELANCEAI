"""
AgentVerse — Project Plan ORM Model (Agent 5)
================================================
Stores AI-generated project execution plans, phase milestones, tasks,
deliverables, and milestone status fields for Progress Monitoring.
"""

import uuid
from datetime import datetime

from sqlalchemy import String, Text, Integer, DateTime, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base
from app.models.types import GUID, JSON_TYPE


class ProjectPlan(Base):
    """
    ProjectPlan model — represents Agent 5 execution roadmap.
    
    Fields:
        id: Primary key UUID
        project_id: Foreign key to projects.id
        overview: Executive summary text of the execution roadmap
        estimated_completion_days: Total estimated completion duration in days
        plan_json: Full JSON structure containing phases, milestones, tasks, deliverables, testing, deployment, risks
    """

    __tablename__ = "project_plans"

    id: Mapped[uuid.UUID] = mapped_column(
        GUID,
        primary_key=True,
        default=uuid.uuid4,
        index=True,
    )

    project_id: Mapped[uuid.UUID] = mapped_column(
        GUID,
        ForeignKey("projects.id", ondelete="CASCADE"),
        unique=True,
        nullable=False,
        index=True,
    )

    overview: Mapped[str] = mapped_column(
        Text,
        nullable=False,
        comment="Executive overview of the project plan",
    )

    estimated_completion_days: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=30,
        comment="Total estimated completion duration in days",
    )

    plan_json: Mapped[dict] = mapped_column(
        JSON_TYPE,
        nullable=False,
        comment="Full JSON payload storing phase milestones, tasks, deliverables, testing, deployment, and risks",
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    # Relationships
    project: Mapped["Project"] = relationship(  # type: ignore[name-defined]
        "Project",
        lazy="selectin",
    )

    def __repr__(self) -> str:
        return f"<ProjectPlan id={self.id} project_id={self.project_id} days={self.estimated_completion_days}>"
