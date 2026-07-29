"""
AgentVerse — Dashboard Routes
================================
Provides aggregated statistics for the client dashboard.

Endpoints:
    GET /api/dashboard/stats — Dashboard statistics for current client
"""

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_client
from app.database.session import get_db
from app.models.client import Client
from app.schemas.client import DashboardStats
from app.services.project_service import ProjectService

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get(
    "/stats",
    response_model=DashboardStats,
    summary="Get dashboard statistics",
    description="Returns aggregated project and analysis statistics for the current client.",
)
async def get_dashboard_stats(
    db: AsyncSession = Depends(get_db),
    current_client: Client = Depends(get_current_client),
) -> DashboardStats:
    """Get dashboard statistics for the authenticated client."""
    service = ProjectService(db=db)
    return await service.get_dashboard_stats(client_id=current_client.id)
