"""
AgentVerse — Project Match ORM Model
======================================
Stores talent discovery matches between projects and freelancers.
Tracks the calculated match score and response status (NOTIFIED, ACCEPTED, DECLINED).
"""

import enum
import uuid
from datetime import datetime

from sqlalchemy import String, Float, DateTime, ForeignKey, func, Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base
from app.models.types import GUID, JSON_TYPE


class MatchStatus(str, enum.Enum):
    """
    Status of project invitation/matching to a freelancer.
    """
    NOTIFIED = "NOTIFIED"
    ACCEPTED = "ACCEPTED"
    DECLINED = "DECLINED"
    ASSIGNED = "ASSIGNED"
    NOT_SELECTED = "NOT_SELECTED"
    STARTED = "STARTED"
    DECLINED_BUDGET = "DECLINED_BUDGET"


class ProjectMatch(Base):
    """
    ProjectMatch model — maps top freelancers to projects.
    
    Fields:
        id: Primary key UUID
        project_id: Foreign key to projects.id
        freelancer_id: Foreign key to freelancers.id
        match_score: Calculated compatibility match percentage (0.0 to 100.0)
        status: Response status (NOTIFIED, ACCEPTED, DECLINED)
        score_breakdown: JSON breakdown of scoring components (Skill, Experience, etc.)
    """

    __tablename__ = "project_matches"

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

    freelancer_id: Mapped[uuid.UUID] = mapped_column(
        GUID,
        ForeignKey("freelancers.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    match_score: Mapped[float] = mapped_column(
        Float,
        nullable=False,
        comment="Overall compatibility match score (0–100%)",
    )

    status: Mapped[MatchStatus] = mapped_column(
        SAEnum(MatchStatus, name="match_status_enum", native_enum=False),
        default=MatchStatus.NOTIFIED,
        nullable=False,
        index=True,
    )

    score_breakdown: Mapped[dict | None] = mapped_column(
        JSON_TYPE,
        nullable=True,
        comment="Detailed percentage breakdown for skill, experience, rating, etc.",
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

    freelancer: Mapped["Freelancer"] = relationship(  # type: ignore[name-defined]
        "Freelancer",
        back_populates="matches",
        lazy="selectin",
    )

    def __repr__(self) -> str:
        return f"<ProjectMatch id={self.id} project_id={self.project_id} freelancer_id={self.freelancer_id} score={self.match_score}% status={self.status}>"
