"""
AgentVerse — Global Exception Handlers
=========================================
Catches all application and framework exceptions and returns
consistent, structured JSON error responses.

Every exception returns:
{
    "error": "ERROR_CODE",
    "message": "Human-readable message",
    "details": { ... }
}
"""

from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from pydantic import ValidationError as PydanticValidationError

from app.core.exceptions import (
    AgentVerseException,
    AuthenticationError,
    AuthorizationError,
    NotFoundError,
    ConflictError,
    OpenRouterError,
    OpenRouterTimeoutError,
    RequirementAgentError,
    DatabaseError,
)
from app.utils.logger import get_logger

logger = get_logger(__name__)


def register_exception_handlers(app: FastAPI) -> None:
    """
    Register all exception handlers on the FastAPI application.
    
    Call this in main.py during app creation.
    
    Args:
        app: FastAPI application instance
    """

    @app.exception_handler(AgentVerseException)
    async def agentverse_exception_handler(
        request: Request, exc: AgentVerseException
    ) -> JSONResponse:
        """Handle all custom AgentVerse exceptions."""
        logger.warning(
            "AgentVerse exception",
            error_code=exc.error_code,
            message=exc.message,
            path=str(request.url),
        )
        return JSONResponse(
            status_code=exc.status_code,
            content=exc.to_dict(),
        )

    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(
        request: Request, exc: RequestValidationError
    ) -> JSONResponse:
        """Handle FastAPI request validation errors (422)."""
        errors = []
        for error in exc.errors():
            errors.append({
                "field": " -> ".join(str(loc) for loc in error["loc"]),
                "message": error["msg"],
                "type": error["type"],
            })

        logger.warning(
            "Request validation error",
            path=str(request.url),
            errors=errors,
        )

        return JSONResponse(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            content={
                "error": "VALIDATION_ERROR",
                "message": "Request validation failed",
                "details": {"errors": errors},
            },
        )

    @app.exception_handler(PydanticValidationError)
    async def pydantic_validation_handler(
        request: Request, exc: PydanticValidationError
    ) -> JSONResponse:
        """Handle Pydantic schema validation errors."""
        safe_errors = []
        for err in exc.errors():
            safe_errors.append({
                "loc": [str(x) for x in err.get("loc", [])],
                "msg": err.get("msg", ""),
                "type": err.get("type", ""),
            })
        return JSONResponse(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            content={
                "error": "SCHEMA_VALIDATION_ERROR",
                "message": "Data validation failed",
                "details": {"errors": safe_errors},
            },
        )

    @app.exception_handler(Exception)
    async def generic_exception_handler(
        request: Request, exc: Exception
    ) -> JSONResponse:
        """
        Catch-all handler for unexpected exceptions.
        Never exposes internal error details in production.
        """
        logger.error(
            "Unexpected server error",
            error=str(exc),
            error_type=type(exc).__name__,
            path=str(request.url),
            exc_info=True,
        )

        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={
                "error": "INTERNAL_SERVER_ERROR",
                "message": "An unexpected error occurred. Our team has been notified.",
                "details": {},
            },
        )
