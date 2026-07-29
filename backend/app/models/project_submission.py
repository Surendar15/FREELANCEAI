"""
AgentVerse — Project Submission ORM Model (Agent 6)
=====================================================
Stores final project delivery artifacts (ZIP file, GitHub URL, live deployment URL, PDF documentation) and client approval timestamps.
"""

import uuid
from datetime import datetime

from sqlalchemy import String, Text, DateTime, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base
from app.models.types import GUID


class ProjectSubmission(Base):
    """
    ProjectSubmission model — represents final delivery submissions by freelancer.
    """

    __tablename__ = "project_submissions"

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

    zip_file_path: Mapped[str] = mapped_column(
        String(500),
        nullable=True,
        comment="Local or S3 path to project code ZIP file",
    )

    github_url: Mapped[str] = mapped_column(
        String(500),
        nullable=True,
        comment="Public or private GitHub repository URL",
    )

    deployment_url: Mapped[str] = mapped_column(
        String(500),
        nullable=True,
        comment="Live production deployment URL (e.g. Vercel, Render)",
    )

    documentation_path: Mapped[str] = mapped_column(
        String(500),
        nullable=True,
        comment="Project architecture PDF or markdown documentation path",
    )

    submitted_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    approved_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
        comment="Timestamp when client accepts final submission",
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
        return f"<ProjectSubmission id={self.id} project_id={self.project_id}>"
