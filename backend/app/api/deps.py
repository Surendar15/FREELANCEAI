"""
AgentVerse — FastAPI Dependencies
====================================
Shared injectable dependencies for all route handlers.
Using FastAPI's Depends() system for dependency injection.
"""

import uuid

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import AuthenticationError, AuthorizationError
from app.core.security import extract_token_subject
from app.database.session import get_db
from app.models.client import Client
from app.utils.logger import get_logger
from sqlalchemy import select

logger = get_logger(__name__)

# ── HTTP Bearer Token Extractor ────────────────────────────────────────────
bearer_scheme = HTTPBearer(auto_error=False)


async def get_current_client(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: AsyncSession = Depends(get_db),
) -> Client:
    """
    Extract and verify the JWT token, return the authenticated client.
    
    Usage in routes:
        @router.get("/protected")
        async def protected_route(client: Client = Depends(get_current_client)):
            ...
            
    Raises:
        HTTPException 401: If token is missing or invalid
        HTTPException 404: If client no longer exists
    """
    if not credentials or not credentials.credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required. Please provide a Bearer token.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    try:
        client_id_str = extract_token_subject(credentials.credentials)
        client_id = uuid.UUID(client_id_str)
    except (AuthenticationError, ValueError) as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(exc),
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Fetch client from DB
    result = await db.execute(select(Client).where(Client.id == client_id))
    client = result.scalar_one_or_none()

    if not client:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Client account not found. Token may be stale.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not client.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your account has been deactivated.",
        )

    return client


async def get_active_client(
    client: Client = Depends(get_current_client),
) -> Client:
    """
    Alias for get_current_client — ensures client is active.
    Use this for routes that require account to be in good standing.
    """
    return client


async def get_current_freelancer(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: AsyncSession = Depends(get_db),
):
    """
    Extract and verify JWT token for a Freelancer.
    """
    from app.models.freelancer import Freelancer

    if not credentials or not credentials.credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Freelancer authentication required.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    try:
        subject = extract_token_subject(credentials.credentials)
        if subject.startswith("freelancer:"):
            subject = subject.replace("freelancer:", "")
        freelancer_id = uuid.UUID(subject)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid freelancer token.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    result = await db.execute(select(Freelancer).where(Freelancer.id == freelancer_id))
    freelancer = result.scalar_one_or_none()

    if not freelancer:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Freelancer account not found.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return freelancer
