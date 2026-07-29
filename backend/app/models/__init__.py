# app/models/__init__.py
from app.models.client import Client
from app.models.project import Project, ProjectStatus
from app.models.freelancer import Freelancer
from app.models.project_match import ProjectMatch, MatchStatus
from app.models.proposal_summary import ProposalSummary
from app.models.budget_recommendation import ProjectBudgetRecommendation
from app.models.project_plan import ProjectPlan
from app.models.project_progress import ProjectProgress
from app.models.project_submission import ProjectSubmission

__all__ = [
    "Client",
    "Project",
    "ProjectStatus",
    "Freelancer",
    "ProjectMatch",
    "MatchStatus",
    "ProposalSummary",
    "ProjectBudgetRecommendation",
    "ProjectPlan",
    "ProjectProgress",
    "ProjectSubmission",
]
