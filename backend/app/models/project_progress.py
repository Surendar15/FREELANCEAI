"""
AgentVerse — Project Progress ORM Model (Agent 6)
===================================================
Stores individual milestone task tracking records, planned/actual dates,
status states (PENDING, IN_PROGRESS, COMPLETED, OVERDUE, FAILED), and proof remarks.
"""

import uuid
from datetime import datetime

from sqlalchemy import String, Text, Integer, DateTime, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base
from app.models.types import GUID


class ProjectProgress(Base):
    """
    ProjectProgress model — represents Agent 6 milestone task progress.
    """

    __tablename__ = "project_progress"

    id: Mapped[uuid.UUID] = mapped_column(
        GUID,
        primary_key=True,
        default=uuid.uuid4,
        index=True,
    )

    project_id: Mapped[uuid.UUID] = mapped_column(
        GUID,
        ForeignKey("projects.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    milestone_number: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=1,
        comment="Milestone phase index (1-5)",
    )

    task_name: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
        comment="Milestone task title",
    )

    description: Mapped[str] = mapped_column(
        Text,
        nullable=True,
        comment="Task description or phase deliverable info",
    )

    planned_start_date: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
    )

    planned_end_date: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
    )

    actual_completion_date: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    status: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        default="PENDING",
        comment="PENDING, IN_PROGRESS, COMPLETED, OVERDUE, FAILED",
    )

    remarks: Mapped[str] = mapped_column(
        Text,
        nullable=True,
        comment="Progress proof notes, github commit URLs, screenshot/file paths",
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

    # Relationship
    project: Mapped["Project"] = relationship(  # type: ignore[name-defined]
        "Project",
        lazy="selectin",
    )

    def __repr__(self) -> str:
        return f"<ProjectProgress id={self.id} task='{self.task_name}' status={self.status}>"
