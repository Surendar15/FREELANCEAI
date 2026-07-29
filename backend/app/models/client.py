"""
AgentVerse — Client ORM Model
================================
Represents a client (project owner) in the system.
Uses UUID primary keys for security and scalability.
"""

import uuid
from datetime import datetime, timezone

from sqlalchemy import String, Boolean, DateTime, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base
from app.models.types import GUID


class Client(Base):
    """
    Client model — a user who posts projects and uses the platform.
    
    Relationships:
        - projects: One-to-many (a client can have many projects)
    """

    __tablename__ = "clients"

    # ── Primary Key ───────────────────────────────────────────────
    id: Mapped[uuid.UUID] = mapped_column(
        GUID,
        primary_key=True,
        default=uuid.uuid4,
        index=True,
    )

    # ── Identity ──────────────────────────────────────────────────
    email: Mapped[str] = mapped_column(
        String(255),
        unique=True,
        nullable=False,
        index=True,
        comment="Client email address — used as login identifier",
    )

    hashed_password: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
        comment="bcrypt-hashed password — never store plaintext",
    )

    full_name: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
        comment="Client's full display name",
    )

    company_name: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True,
        comment="Optional company or organisation name",
    )

    # ── Status ────────────────────────────────────────────────────
    is_active: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        nullable=False,
        comment="Soft-disable account without deleting",
    )

    is_verified: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False,
        comment="Email verification status",
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

    last_login_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
        comment="Timestamp of last successful login",
    )

    # ── Relationships ─────────────────────────────────────────────
    projects: Mapped[list["Project"]] = relationship(  # type: ignore[name-defined]
        "Project",
        back_populates="client",
        cascade="all, delete-orphan",
        lazy="selectin",
    )

    def __repr__(self) -> str:
        return f"<Client id={self.id} email={self.email}>"
