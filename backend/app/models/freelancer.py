"""
AgentVerse — Freelancer ORM Model
===================================
Represents a freelancer in the platform database.
Stores freelancer credentials, technical skills, experience, rating, and availability.
"""

import uuid
from datetime import datetime

from sqlalchemy import String, Text, Float, Integer, DateTime, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base
from app.models.types import GUID, JSON_TYPE


class Freelancer(Base):
    """
    Freelancer model — represents registered talent candidates.
    
    Fields:
        id: Primary key UUID
        name: Full name of freelancer
        email: Unique email address
        profile_image: URL/path to profile avatar
        title: Professional role title (e.g. Senior React Developer)
        skills: List of skills stored as JSON array
        experience: Years of professional experience
        rating: Rating out of 5.0 (e.g. 4.9)
        completed_projects: Number of completed platform projects
        availability: Work availability ("Available", "Part-Time", "Busy")
        status: Profile status ("Active", "Inactive")
        bio: Short professional biography
    """

    __tablename__ = "freelancers"

    id: Mapped[uuid.UUID] = mapped_column(
        GUID,
        primary_key=True,
        default=uuid.uuid4,
        index=True,
    )

    name: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )

    email: Mapped[str] = mapped_column(
        String(255),
        unique=True,
        nullable=False,
        index=True,
    )

    hashed_password: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True,
        comment="Bcrypt hashed password for freelancer authentication",
    )

    profile_image: Mapped[str] = mapped_column(
        String(1000),
        nullable=False,
    )

    title: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )

    skills: Mapped[list] = mapped_column(
        JSON_TYPE,
        nullable=False,
        default=list,
        comment="JSON array of technical skills and frameworks",
    )

    experience: Mapped[float] = mapped_column(
        Float,
        nullable=False,
        default=0.0,
        comment="Years of professional experience",
    )

    rating: Mapped[float] = mapped_column(
        Float,
        nullable=False,
        default=5.0,
        comment="Rating out of 5.0",
    )

    completed_projects: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=0,
        comment="Total completed projects count",
    )

    availability: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
        default="Available",
    )

    status: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        default="Active",
    )

    bio: Mapped[str] = mapped_column(
        Text,
        nullable=True,
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
    matches: Mapped[list["ProjectMatch"]] = relationship(  # type: ignore[name-defined]
        "ProjectMatch",
        back_populates="freelancer",
        cascade="all, delete-orphan",
    )

    def __repr__(self) -> str:
        return f"<Freelancer id={self.id} name={self.name!r} title={self.title!r}>"
