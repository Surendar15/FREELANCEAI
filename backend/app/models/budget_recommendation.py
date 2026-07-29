"""
AgentVerse — Project Budget Recommendation ORM Model (Agent 4)
=================================================================
Stores AI-generated budget recommendations, client entered budget offers,
and budget negotiation statuses.
"""

import uuid
from datetime import datetime

from sqlalchemy import String, Text, Float, DateTime, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base
from app.models.types import GUID


class ProjectBudgetRecommendation(Base):
    """
    ProjectBudgetRecommendation model — represents Agent 4 budget analysis.
    
    Fields:
        id: Primary key UUID
        project_id: Foreign key to projects.id
        minimum_budget: AI recommended minimum budget (USD)
        maximum_budget: AI recommended maximum budget (USD)
        recommended_budget: AI recommended target budget (USD)
        budget_reason: AI explanation paragraph (max 100 words)
        client_entered_budget: Final budget entered by client
        budget_status: RECOMMENDED, OFFERED, ACCEPTED, DECLINED
    """

    __tablename__ = "project_budget_recommendations"

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

    minimum_budget: Mapped[float] = mapped_column(
        Float,
        nullable=False,
        comment="AI calculated minimum budget floor in USD",
    )

    maximum_budget: Mapped[float] = mapped_column(
        Float,
        nullable=False,
        comment="AI calculated maximum budget ceiling in USD",
    )

    recommended_budget: Mapped[float] = mapped_column(
        Float,
        nullable=False,
        comment="AI recommended target budget in USD",
    )

    budget_reason: Mapped[str] = mapped_column(
        Text,
        nullable=False,
        comment="AI budget explanation paragraph (max 100 words)",
    )

    client_entered_budget: Mapped[float | None] = mapped_column(
        Float,
        nullable=True,
        comment="Final validated budget entered by client to offer",
    )

    budget_status: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        default="RECOMMENDED",
        comment="Budget status: RECOMMENDED, OFFERED, ACCEPTED, DECLINED",
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
        return f"<ProjectBudgetRecommendation id={self.id} project_id={self.project_id} recommended=${self.recommended_budget} status={self.budget_status}>"
