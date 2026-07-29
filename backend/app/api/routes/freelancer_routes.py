"""
AgentVerse — Freelancer Portal Routes
======================================
API endpoints for freelancer registration, authentication, profile view, project invitations, and Accept/Decline responses.
"""

import uuid
from typing import List, Optional

from fastapi import APIRouter, Depends, status, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from pydantic import BaseModel

from app.api.deps import get_db, get_current_freelancer
from app.core.security import create_access_token, hash_password, verify_password
from app.core.exceptions import ConflictError, AuthenticationError
from app.models.freelancer import Freelancer
from app.models.project import Project
from app.models.project_match import ProjectMatch, MatchStatus
from app.schemas.freelancer import (
    FreelancerResponse,
    FreelancerRegisterRequest,
    FreelancerLoginRequest,
)
from app.schemas.project_match import ProjectMatchResponse, UpdateMatchStatusRequest
from app.services.talent_matching_service import TalentMatchingService
from app.utils.logger import get_logger

logger = get_logger(__name__)

router = APIRouter(prefix="/freelancer", tags=["Freelancer Portal Module"])


class FreelancerLoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    freelancer: FreelancerResponse


class ProjectInvitationResponse(BaseModel):
    match: ProjectMatchResponse
    project_title: str
    project_description: str
    client_name: str
    client_company: Optional[str] = None
    budget: Optional[float] = None
    deadline: Optional[str] = None
    project_status: Optional[str] = None


@router.post(
    "/register",
    response_model=FreelancerLoginResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new Freelancer account",
    description="Create a new freelancer profile with email, password, role title, skills, and experience.",
)
async def freelancer_register(
    request: FreelancerRegisterRequest,
    db: AsyncSession = Depends(get_db),
) -> FreelancerLoginResponse:
    """Register a new freelancer and return access token."""
    logger.info("Registering new freelancer", email=request.email)

    existing = await db.execute(
        select(Freelancer).where(Freelancer.email == request.email.lower())
    )
    if existing.scalar_one_or_none():
        raise ConflictError(message=f"An account with email '{request.email}' already exists.")

    freelancer = Freelancer(
        name=request.full_name,
        email=request.email.lower(),
        hashed_password=hash_password(request.password),
        title=request.title,
        skills=request.skills,
        experience=request.experience,
        bio=request.bio,
        profile_image="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=300",
        rating=5.0,
        completed_projects=0,
        availability="Available",
        status="Active",
    )

    db.add(freelancer)
    await db.flush()
    await db.refresh(freelancer)

    logger.info("Freelancer registered successfully", freelancer_id=str(freelancer.id))

    token = create_access_token(subject=f"freelancer:{freelancer.id}")
    return FreelancerLoginResponse(
        access_token=token,
        token_type="bearer",
        freelancer=FreelancerResponse.model_validate(freelancer),
    )


@router.post(
    "/login",
    response_model=FreelancerLoginResponse,
    summary="Freelancer login",
    description="Authenticate freelancer with email and password to receive JWT access token.",
)
async def freelancer_login(
    request: FreelancerLoginRequest,
    db: AsyncSession = Depends(get_db),
) -> FreelancerLoginResponse:
    """Log in freelancer by email and password."""
    logger.info("Freelancer login attempt", email=request.email)

    result = await db.execute(
        select(Freelancer).where(Freelancer.email == request.email.lower())
    )
    freelancer = result.scalar_one_or_none()

    if not freelancer:
        raise AuthenticationError(message="Invalid email or password")

    if freelancer.hashed_password:
        if not verify_password(request.password, freelancer.hashed_password):
            raise AuthenticationError(message="Invalid email or password")

    logger.info("Freelancer logged in successfully", freelancer_id=str(freelancer.id))

    token = create_access_token(subject=f"freelancer:{freelancer.id}")
    return FreelancerLoginResponse(
        access_token=token,
        token_type="bearer",
        freelancer=FreelancerResponse.model_validate(freelancer),
    )


@router.get(
    "/me",
    response_model=FreelancerResponse,
    summary="Get logged-in freelancer profile",
)
async def get_freelancer_me(
    current_freelancer: Freelancer = Depends(get_current_freelancer),
) -> FreelancerResponse:
    """Return authenticated freelancer profile."""
    return FreelancerResponse.model_validate(current_freelancer)


@router.get(
    "/invitations",
    response_model=List[ProjectInvitationResponse],
    summary="Get project invitations for logged-in freelancer",
    description="Retrieve all project invitations matched to the current freelancer.",
)
async def get_freelancer_invitations(
    current_freelancer: Freelancer = Depends(get_current_freelancer),
    db: AsyncSession = Depends(get_db),
) -> List[ProjectInvitationResponse]:
    """Get project invitations."""
    result = await db.execute(
        select(ProjectMatch)
        .options(selectinload(ProjectMatch.freelancer))
        .where(ProjectMatch.freelancer_id == current_freelancer.id)
        .order_by(ProjectMatch.created_at.desc())
    )
    matches = result.scalars().all()

    invitations = []
    for match in matches:
        proj_res = await db.execute(
            select(Project)
            .options(selectinload(Project.client))
            .where(Project.id == match.project_id)
        )
        proj = proj_res.scalar_one_or_none()

        client_name = "Client"
        client_company = None
        if proj and proj.client:
            client_name = proj.client.full_name
            client_company = proj.client.company_name

        invitations.append(
            ProjectInvitationResponse(
                match=ProjectMatchResponse.model_validate(match),
                project_title=proj.title if proj else "Project",
                project_description=proj.description if proj else "",
                client_name=client_name,
                client_company=client_company,
                budget=float(proj.budget) if proj and proj.budget else None,
                deadline=proj.deadline.isoformat() if proj and proj.deadline else None,
                project_status=proj.status.value if proj and proj.status else None,
            )
        )

    return invitations


@router.post(
    "/invitations/{match_id}/respond",
    response_model=ProjectMatchResponse,
    summary="Respond to project invitation (Accept / Decline)",
    description="Freelancer action endpoint to accept or decline a project invitation.",
)
async def respond_to_invitation(
    match_id: uuid.UUID,
    request: UpdateMatchStatusRequest,
    current_freelancer: Freelancer = Depends(get_current_freelancer),
    db: AsyncSession = Depends(get_db),
) -> ProjectMatchResponse:
    """Accept or decline project invitation."""
    service = TalentMatchingService(db=db)

    # Verify match belongs to this freelancer
    res = await db.execute(select(ProjectMatch).where(ProjectMatch.id == match_id))
    match_obj = res.scalar_one_or_none()

    if not match_obj:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invitation not found.",
        )

    if match_obj.freelancer_id != current_freelancer.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not authorized to respond to this invitation.",
        )

    updated_match = await service.update_match_status(
        match_id=match_id,
        status=request.status,
    )
    return ProjectMatchResponse.model_validate(updated_match)
