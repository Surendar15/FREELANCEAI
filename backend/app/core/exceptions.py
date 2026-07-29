"""
AgentVerse — Custom Exception Hierarchy
=========================================
Centralised exception classes for the entire application.
All domain errors extend AgentVerseException for consistent error handling.

Architecture Note:
    Each new AI agent should define its own exception class here
    (e.g., TalentAgentError, ProposalAgentError) following the same pattern.
"""

from typing import Any, Dict, Optional


class AgentVerseException(Exception):
    """
    Base exception for all AgentVerse application errors.
    All custom exceptions must extend this class.
    """

    def __init__(
        self,
        message: str,
        error_code: str = "INTERNAL_ERROR",
        details: Optional[Dict[str, Any]] = None,
        status_code: int = 500,
    ) -> None:
        self.message = message
        self.error_code = error_code
        self.details = details or {}
        self.status_code = status_code
        super().__init__(self.message)

    def to_dict(self) -> Dict[str, Any]:
        """Serialize exception to API response format."""
        return {
            "error": self.error_code,
            "message": self.message,
            "details": self.details,
        }


# ── Authentication Exceptions ──────────────────────────────────────────────

class AuthenticationError(AgentVerseException):
    """Raised when authentication fails (invalid credentials, expired token)."""

    def __init__(self, message: str = "Authentication failed", details: Optional[Dict] = None) -> None:
        super().__init__(
            message=message,
            error_code="AUTHENTICATION_ERROR",
            details=details,
            status_code=401,
        )


class AuthorizationError(AgentVerseException):
    """Raised when user lacks permission to perform an action."""

    def __init__(self, message: str = "Insufficient permissions", details: Optional[Dict] = None) -> None:
        super().__init__(
            message=message,
            error_code="AUTHORIZATION_ERROR",
            details=details,
            status_code=403,
        )


class TokenExpiredError(AuthenticationError):
    """Raised when JWT token has expired."""

    def __init__(self) -> None:
        super().__init__(message="Access token has expired. Please login again.")


# ── Validation Exceptions ──────────────────────────────────────────────────

class ValidationError(AgentVerseException):
    """Raised when input validation fails."""

    def __init__(self, message: str, field: Optional[str] = None, details: Optional[Dict] = None) -> None:
        super().__init__(
            message=message,
            error_code="VALIDATION_ERROR",
            details={"field": field, **(details or {})},
            status_code=422,
        )


class BadRequestError(AgentVerseException):
    """Raised when request payload or action is invalid."""

    def __init__(self, message: str, details: Optional[Dict] = None) -> None:
        super().__init__(
            message=message,
            error_code="BAD_REQUEST",
            details=details,
            status_code=400,
        )


class NotFoundError(AgentVerseException):
    """Raised when a requested resource is not found."""

    def __init__(self, resource: str, resource_id: Any = None) -> None:
        super().__init__(
            message=f"{resource} not found",
            error_code="NOT_FOUND",
            details={"resource": resource, "id": str(resource_id) if resource_id else None},
            status_code=404,
        )


class ConflictError(AgentVerseException):
    """Raised when a resource already exists or conflicts with current state."""

    def __init__(self, message: str, details: Optional[Dict] = None) -> None:
        super().__init__(
            message=message,
            error_code="CONFLICT",
            details=details,
            status_code=409,
        )


# ── Database Exceptions ────────────────────────────────────────────────────

class DatabaseError(AgentVerseException):
    """Raised when a database operation fails."""

    def __init__(self, message: str = "A database error occurred", details: Optional[Dict] = None) -> None:
        super().__init__(
            message=message,
            error_code="DATABASE_ERROR",
            details=details,
            status_code=500,
        )


# ── AI Agent Exceptions ────────────────────────────────────────────────────

class AgentError(AgentVerseException):
    """Base exception for all AI agent errors."""

    def __init__(self, agent_name: str, message: str, details: Optional[Dict] = None) -> None:
        super().__init__(
            message=f"[{agent_name}] {message}",
            error_code="AGENT_ERROR",
            details={"agent": agent_name, **(details or {})},
            status_code=500,
        )


class RequirementAgentError(AgentError):
    """Raised when the Requirement Intelligence Agent fails."""

    def __init__(self, message: str, details: Optional[Dict] = None) -> None:
        super().__init__(agent_name="RequirementAgent", message=message, details=details)


class OpenRouterError(AgentVerseException):
    """Raised when communication with OpenRouter API fails."""

    def __init__(self, message: str, details: Optional[Dict] = None) -> None:
        super().__init__(
            message=message,
            error_code="OPENROUTER_ERROR",
            details=details,
            status_code=502,
        )


class OpenRouterTimeoutError(OpenRouterError):
    """Raised when OpenRouter request times out."""

    def __init__(self) -> None:
        super().__init__(
            message="AI service request timed out. Please try again.",
            details={"hint": "The model may be overloaded. Retry after a few seconds."},
        )


class InvalidAIResponseError(OpenRouterError):
    """Raised when the AI returns a response that cannot be parsed as valid JSON."""

    def __init__(self, raw_response: str = "") -> None:
        super().__init__(
            message="AI returned an invalid or unparseable response.",
            details={"raw_response_preview": raw_response[:200]},
        )


# ── Future Agent Exceptions (placeholder — implement when agent is built) ──

class TalentAgentError(AgentError):
    """Raised when the Talent Discovery Agent fails. (Phase 2)"""
    def __init__(self, message: str, details: Optional[Dict] = None) -> None:
        super().__init__(agent_name="TalentAgent", message=message, details=details)


class ProposalAgentError(AgentError):
    """Raised when the Proposal Intelligence Agent fails. (Phase 3)"""
    def __init__(self, message: str, details: Optional[Dict] = None) -> None:
        super().__init__(agent_name="ProposalAgent", message=message, details=details)


class BudgetAgentError(AgentError):
    """Raised when the Budget Intelligence Agent fails. (Phase 4)"""
    def __init__(self, message: str, details: Optional[Dict] = None) -> None:
        super().__init__(agent_name="BudgetAgent", message=message, details=details)


class PlanningAgentError(AgentError):
    """Raised when the Planning Agent fails. (Phase 5)"""
    def __init__(self, message: str, details: Optional[Dict] = None) -> None:
        super().__init__(agent_name="PlanningAgent", message=message, details=details)


class ProgressAgentError(AgentError):
    """Raised when the Progress Monitoring Agent fails. (Phase 6)"""
    def __init__(self, message: str, details: Optional[Dict] = None) -> None:
        super().__init__(agent_name="ProgressAgent", message=message, details=details)


class QualityAgentError(AgentError):
    """Raised when the Quality Assurance Agent fails. (Phase 7)"""
    def __init__(self, message: str, details: Optional[Dict] = None) -> None:
        super().__init__(agent_name="QualityAgent", message=message, details=details)
