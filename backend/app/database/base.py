"""
AgentVerse — SQLAlchemy Declarative Base
=========================================
Shared base class for all ORM models.
All models must inherit from `Base` to be discoverable by Alembic.
"""

from sqlalchemy.orm import DeclarativeBase, MappedColumn
from sqlalchemy import MetaData


# Use a naming convention for constraints to ensure consistent migration names
NAMING_CONVENTION = {
    "ix": "ix_%(column_0_label)s",
    "uq": "uq_%(table_name)s_%(column_0_name)s",
    "ck": "ck_%(table_name)s_%(constraint_name)s",
    "fk": "fk_%(table_name)s_%(column_0_name)s_%(referred_table_name)s",
    "pk": "pk_%(table_name)s",
}


class Base(DeclarativeBase):
    """
    Declarative base for all SQLAlchemy ORM models.
    
    Architecture Note:
        All models must:
        1. Inherit from this Base
        2. Be imported in app/database/__init__.py
        3. Have a corresponding Alembic migration
    """
    metadata = MetaData(naming_convention=NAMING_CONVENTION)
