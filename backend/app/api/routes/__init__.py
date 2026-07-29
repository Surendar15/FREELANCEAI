# app/api/routes/__init__.py
from fastapi import APIRouter

from app.api.routes.auth import router as auth_router
from app.api.routes.projects import router as projects_router
from app.api.routes.dashboard import router as dashboard_router
from app.api.routes.talent import router as talent_router
from app.api.routes.freelancer_routes import router as freelancer_router
from app.api.routes.proposal import router as proposal_router
from app.api.routes.budget import router as budget_router
from app.api.routes.project_plan import router as plan_router
from app.api.routes.progress import router as progress_router

# Master API router — mounts all sub-routers
api_router = APIRouter(prefix="/api")
api_router.include_router(auth_router)
api_router.include_router(projects_router)
api_router.include_router(dashboard_router)
api_router.include_router(talent_router)
api_router.include_router(freelancer_router)
api_router.include_router(proposal_router)
api_router.include_router(budget_router)
api_router.include_router(plan_router)
api_router.include_router(progress_router)

__all__ = ["api_router"]
