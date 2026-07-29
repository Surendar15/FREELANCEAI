# app/schemas/__init__.py
from app.schemas.client import (
    ClientRegisterRequest,
    ClientLoginRequest,
    ClientResponse,
    LoginResponse,
)
from app.schemas.project import (
    ProjectAnalyzeRequest,
    ProjectResponse,
    ProjectListResponse,
    AnalyzeResponse,
    AIAnalysisResult,
)
from app.schemas.freelancer import (
    FreelancerResponse,
    FreelancerCreate,
    FreelancerRegisterRequest,
    FreelancerLoginRequest,
)
from app.schemas.project_match import (
    ProjectMatchResponse,
    TalentDiscoveryRequest,
    TalentDiscoveryResponse,
    UpdateMatchStatusRequest,
    ScoreBreakdown,
)
from app.schemas.proposal import (
    ProposalSummaryResponse,
    AssignProjectRequest,
    AssignProjectResponse,
    FreelancerAssignmentNotification,
)
from app.schemas.budget import (
    BudgetRecommendationResponse,
    SendBudgetOfferRequest,
    SendBudgetOfferResponse,
    RespondBudgetOfferRequest,
    RespondBudgetOfferResponse,
    FreelancerBudgetOfferNotification,
)
from app.schemas.project_plan import (
    MilestoneSchema,
    ProjectPlanDetailSchema,
    ProjectPlanResponse,
)
from app.schemas.progress import (
    ProgressTaskResponse,
    UploadProgressRequest,
    SubmitProjectRequest,
    ProjectSubmissionResponse,
    DelayActionRequest,
    CompletionReport,
    ProjectProgressOverviewResponse,
)

__all__ = [
    "ClientRegisterRequest",
    "ClientLoginRequest",
    "ClientResponse",
    "LoginResponse",
    "ProjectAnalyzeRequest",
    "ProjectResponse",
    "ProjectListResponse",
    "AnalyzeResponse",
    "AIAnalysisResult",
    "FreelancerResponse",
    "FreelancerCreate",
    "FreelancerRegisterRequest",
    "FreelancerLoginRequest",
    "ProjectMatchResponse",
    "TalentDiscoveryRequest",
    "TalentDiscoveryResponse",
    "UpdateMatchStatusRequest",
    "ScoreBreakdown",
    "ProposalSummaryResponse",
    "AssignProjectRequest",
    "AssignProjectResponse",
    "FreelancerAssignmentNotification",
    "BudgetRecommendationResponse",
    "SendBudgetOfferRequest",
    "SendBudgetOfferResponse",
    "RespondBudgetOfferRequest",
    "RespondBudgetOfferResponse",
    "FreelancerBudgetOfferNotification",
    "MilestoneSchema",
    "ProjectPlanDetailSchema",
    "ProjectPlanResponse",
    "ProgressTaskResponse",
    "UploadProgressRequest",
    "SubmitProjectRequest",
    "ProjectSubmissionResponse",
    "DelayActionRequest",
    "CompletionReport",
    "ProjectProgressOverviewResponse",
]
