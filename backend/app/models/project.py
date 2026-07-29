"""
AgentVerse — Project ORM Model
=================================
Represents a project created by a client.
Stores both the original description AND the AI-structured analysis as JSONB/JSON.
"""

import enum
import uuid
from datetime import datetime

from sqlalchemy import String, Text, Numeric, DateTime, ForeignKey, func, Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base
from app.models.types import GUID, JSON_TYPE


class ProjectStatus(str, enum.Enum):
    """
    Project lifecycle states.
    
    Architecture Note:
        Add new states here as new agents are implemented.
        e.g., TALENT_MATCHING, PROPOSAL_REVIEW, IN_PROGRESS, QA_REVIEW
    """
    DRAFT = "draft"
    ANALYZING = "analyzing"
    ANALYZED = "analyzed"
    PUBLISHED = "published"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class Project(Base):
    """
    Project model — the central entity of the platform.
    
    Key design decisions:
        - ai_analysis stored as PostgreSQL JSONB / SQLite JSON for flexible schema evolution
        - supporting_file_path stores file location, not file content
        - status is an enum for type safety
    
    Relationships:
        - client: Many-to-one (each project belongs to one client)
    """

    __tablename__ = "projects"

    # ── Primary Key ───────────────────────────────────────────────
    id: Mapped[uuid.UUID] = mapped_column(
        GUID,
        primary_key=True,
        default=uuid.uuid4,
        index=True,
    )

    # ── Foreign Key ───────────────────────────────────────────────
    client_id: Mapped[uuid.UUID] = mapped_column(
        GUID,
        ForeignKey("clients.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    # ── Project Details ───────────────────────────────────────────
    title: Mapped[str] = mapped_column(
        String(500),
        nullable=False,
        comment="Project title as entered by the client",
    )

    description: Mapped[str] = mapped_column(
        Text,
        nullable=False,
        comment="Full project description — sent to AI for analysis",
    )

    budget: Mapped[float | None] = mapped_column(
        Numeric(precision=12, scale=2),
        nullable=True,
        comment="Optional budget in USD",
    )

    deadline: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
        comment="Optional project deadline",
    )

    supporting_file_path: Mapped[str | None] = mapped_column(
        String(1000),
        nullable=True,
        comment="Path to uploaded supporting file (PDF, DOCX, etc.)",
    )

    # ── AI Analysis ───────────────────────────────────────────────
    ai_analysis: Mapped[dict | None] = mapped_column(
        JSON_TYPE,
        nullable=True,
        comment="Structured AI analysis from Requirement Intelligence Agent",
    )

    ai_model_used: Mapped[str | None] = mapped_column(
        String(200),
        nullable=True,
        comment="The OpenRouter model used for analysis (for audit trail)",
    )

    analysis_completed_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
        comment="When the AI analysis was completed",
    )

    # ── Status ────────────────────────────────────────────────────
    status: Mapped[ProjectStatus] = mapped_column(
        SAEnum(ProjectStatus, name="project_status_enum", native_enum=False),
        default=ProjectStatus.DRAFT,
        nullable=False,
        index=True,
    )

    # ── Timestamps ────────────────────────────────────────────────
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

    # ── Relationships ─────────────────────────────────────────────
    client: Mapped["Client"] = relationship(  # type: ignore[name-defined]
        "Client",
        back_populates="projects",
        lazy="selectin",
    )

    def __repr__(self) -> str:
        return f"<Project id={self.id} title={self.title!r} status={self.status}>"
