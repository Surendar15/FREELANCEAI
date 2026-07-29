"""
AgentVerse — Authentication Routes
=====================================
Handles client registration and login.

Endpoints:
    POST /api/auth/register  — Create new client account
    POST /api/auth/login     — Authenticate and get JWT token
    GET  /api/auth/me        — Get current client profile
"""

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_client
from app.database.session import get_db
from app.models.client import Client
from app.schemas.client import (
    ClientRegisterRequest,
    ClientLoginRequest,
    ClientResponse,
    LoginResponse,
)
from app.services.auth_service import AuthService
from app.utils.logger import get_logger

logger = get_logger(__name__)

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post(
    "/register",
    response_model=LoginResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new client account",
    description="Create a new client account with email and password. Returns JWT access token.",
)
async def register(
    request: ClientRegisterRequest,
    db: AsyncSession = Depends(get_db),
) -> LoginResponse:
    """
    Register a new client and return access token.
    
    - **full_name**: Client's full name (min 2 characters)
    - **email**: Unique email address
    - **password**: Min 8 characters, must have uppercase and digit
    - **company_name**: Optional company name
    """
    service = AuthService(db=db)
    result = await service.register_client(request)
    logger.info("Client registered via API", email=request.email)
    return result


@router.post(
    "/login",
    response_model=LoginResponse,
    summary="Login with email and password",
    description="Authenticate with email/password and receive a JWT access token.",
)
async def login(
    request: ClientLoginRequest,
    db: AsyncSession = Depends(get_db),
) -> LoginResponse:
    """
    Authenticate client and return JWT token.
    
    - **email**: Registered email address
    - **password**: Account password
    """
    service = AuthService(db=db)
    result = await service.login_client(request)
    return result


@router.get(
    "/me",
    response_model=ClientResponse,
    summary="Get current client profile",
    description="Returns the profile of the currently authenticated client.",
)
async def get_me(
    current_client: Client = Depends(get_current_client),
) -> ClientResponse:
    """Return the authenticated client's profile."""
    return ClientResponse.model_validate(current_client)
