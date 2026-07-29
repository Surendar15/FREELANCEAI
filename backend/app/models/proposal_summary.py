"""
AgentVerse — Proposal Summary ORM Model (Agent 3)
===================================================
Stores AI-generated proposal intelligence summaries, confidence scores,
strengths, and recommendation badges for accepted freelancers.
"""

import uuid
from datetime import datetime

from sqlalchemy import String, Text, Float, DateTime, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base
from app.models.types import GUID, JSON_TYPE


class ProposalSummary(Base):
    """
    ProposalSummary model — represents Agent 3 evaluation output.
    
    Fields:
        id: Primary key UUID
        match_id: Foreign key to project_matches.id
        project_id: Foreign key to projects.id
        freelancer_id: Foreign key to freelancers.id
        ai_summary: Human-friendly text summary (<= 120 words)
        why_matched: Key reasons why candidate matches requirement
        strengths: JSON list of technical & experience strengths
        confidence_score: AI confidence percentage (0-100%)
        recommendation_badge: Human-friendly recommendation badge (e.g. ⭐⭐ Highly Recommended)
        selection_status: Selection state ("PENDING", "ASSIGNED", "NOT_SELECTED")
    """

    __tablename__ = "proposal_summaries"

    id: Mapped[uuid.UUID] = mapped_column(
        GUID,
        primary_key=True,
        default=uuid.uuid4,
        index=True,
    )

    match_id: Mapped[uuid.UUID] = mapped_column(
        GUID,
        ForeignKey("project_matches.id", ondelete="CASCADE"),
        unique=True,
        nullable=False,
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

    ai_summary: Mapped[str] = mapped_column(
        Text,
        nullable=False,
        comment="Human-friendly summary (max 120 words)",
    )

    why_matched: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
        comment="Summary of why freelancer matches project intent",
    )

    strengths: Mapped[list | None] = mapped_column(
        JSON_TYPE,
        nullable=True,
        default=list,
        comment="JSON array of key candidate strengths",
    )

    confidence_score: Mapped[float] = mapped_column(
        Float,
        nullable=False,
        default=90.0,
        comment="AI confidence score percentage (0-100%)",
    )

    recommendation_badge: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
        default="⭐ Highly Recommended",
        comment="Recommendation badge string",
    )

    selection_status: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        default="PENDING",
        comment="Selection status: PENDING, ASSIGNED, NOT_SELECTED",
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
    match: Mapped["ProjectMatch"] = relationship(  # type: ignore[name-defined]
        "ProjectMatch",
        lazy="selectin",
    )

    project: Mapped["Project"] = relationship(  # type: ignore[name-defined]
        "Project",
        lazy="selectin",
    )

    freelancer: Mapped["Freelancer"] = relationship(  # type: ignore[name-defined]
        "Freelancer",
        lazy="selectin",
    )

    def __repr__(self) -> str:
        return f"<ProposalSummary id={self.id} project_id={self.project_id} freelancer_id={self.freelancer_id} status={self.selection_status}>"
