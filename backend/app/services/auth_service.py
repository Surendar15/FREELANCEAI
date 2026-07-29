"""
AgentVerse — Authentication Service
======================================
Business logic for client registration and authentication.
Uses the repository pattern — all DB operations are in this service,
keeping routes thin and testable.
"""

import uuid
from datetime import datetime, timezone

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.exceptions import AuthenticationError, ConflictError, NotFoundError
from app.core.security import hash_password, verify_password, create_access_token
from app.config.settings import settings
from app.models.client import Client
from app.schemas.client import (
    ClientRegisterRequest,
    ClientLoginRequest,
    ClientResponse,
    LoginResponse,
)
from app.utils.logger import get_logger

logger = get_logger(__name__)


class AuthService:
    """
    Authentication service — handles client registration and login.
    
    All database operations use async SQLAlchemy for non-blocking I/O.
    """

    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def register_client(self, request: ClientRegisterRequest) -> LoginResponse:
        """
        Register a new client account.
        
        Args:
            request: Validated registration data
            
        Returns:
            LoginResponse with JWT token and client profile
            
        Raises:
            ConflictError: If email is already registered
        """
        logger.info("Registering new client", email=request.email)

        # Check for existing email
        existing = await self.db.execute(
            select(Client).where(Client.email == request.email.lower())
        )
        if existing.scalar_one_or_none():
            raise ConflictError(
                message=f"An account with email '{request.email}' already exists.",
                details={"email": request.email},
            )

        # Create client
        client = Client(
            email=request.email.lower(),
            hashed_password=hash_password(request.password),
            full_name=request.full_name,
            company_name=request.company_name,
            is_active=True,
            is_verified=False,  # Email verification can be added later
        )

        self.db.add(client)
        await self.db.flush()  # Get ID without committing (commit is in get_db)
        await self.db.refresh(client)

        logger.info("Client registered successfully", client_id=str(client.id), email=client.email)

        # Generate token
        access_token = create_access_token(subject=str(client.id))

        return LoginResponse(
            access_token=access_token,
            token_type="bearer",
            expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
            client=ClientResponse.model_validate(client),
        )

    async def login_client(self, request: ClientLoginRequest) -> LoginResponse:
        """
        Authenticate a client and return a JWT token.
        
        Args:
            request: Login credentials (email + password)
            
        Returns:
            LoginResponse with JWT token and client profile
            
        Raises:
            AuthenticationError: If credentials are invalid or account is inactive
        """
        logger.info("Login attempt", email=request.email)

        # Fetch client by email
        result = await self.db.execute(
            select(Client).where(Client.email == request.email.lower())
        )
        client = result.scalar_one_or_none()

        # Use consistent error to prevent email enumeration attacks
        if not client or not verify_password(request.password, client.hashed_password):
            logger.warning("Failed login attempt", email=request.email)
            raise AuthenticationError(message="Invalid email or password")

        if not client.is_active:
            raise AuthenticationError(message="Your account has been deactivated. Contact support.")

        # Update last login
        client.last_login_at = datetime.now(timezone.utc)
        await self.db.flush()

        logger.info("Client logged in successfully", client_id=str(client.id))

        # Generate token
        access_token = create_access_token(subject=str(client.id))

        return LoginResponse(
            access_token=access_token,
            token_type="bearer",
            expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
            client=ClientResponse.model_validate(client),
        )

    async def get_client_by_id(self, client_id: uuid.UUID) -> Client:
        """
        Retrieve a client by their UUID.
        
        Args:
            client_id: Client's UUID
            
        Returns:
            Client ORM instance
            
        Raises:
            NotFoundError: If client doesn't exist
        """
        result = await self.db.execute(
            select(Client).where(Client.id == client_id)
        )
        client = result.scalar_one_or_none()

        if not client:
            raise NotFoundError(resource="Client", resource_id=client_id)

        return client
