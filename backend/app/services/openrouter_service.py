"""
AgentVerse — OpenRouter Service
=================================
Modular HTTP client for the OpenRouter AI API.

Key Design Principles:
    1. Model is configurable — never hardcoded
    2. Retry logic with exponential backoff (tenacity)
    3. Comprehensive error handling and logging
    4. All AI agents reuse this single service (no duplication)
    5. Timeout handling with clear error messages

Architecture Note:
    All future AI agents (Talent, Proposal, Budget, Planning, Progress, Quality)
    should call this service via openrouter_service.chat_completion().
    This is the ONLY place where OpenRouter HTTP logic lives.
"""

import json
from typing import Any, Dict, List, Optional

import httpx
from tenacity import (
    retry,
    retry_if_exception_type,
    stop_after_attempt,
    wait_exponential,
    before_sleep_log,
)

from app.config.settings import settings
from app.core.exceptions import (
    OpenRouterError,
    OpenRouterTimeoutError,
    InvalidAIResponseError,
)
from app.utils.logger import get_logger

logger = get_logger(__name__)


class OpenRouterMessage:
    """
    Helper class to build OpenRouter-compatible message objects.
    """
    SYSTEM = "system"
    USER = "user"
    ASSISTANT = "assistant"

    @staticmethod
    def system(content: str) -> Dict[str, str]:
        return {"role": OpenRouterMessage.SYSTEM, "content": content}

    @staticmethod
    def user(content: str) -> Dict[str, str]:
        return {"role": OpenRouterMessage.USER, "content": content}

    @staticmethod
    def assistant(content: str) -> Dict[str, str]:
        return {"role": OpenRouterMessage.ASSISTANT, "content": content}


class OpenRouterService:
    """
    Service class for interacting with the OpenRouter AI API.
    
    Features:
        - Configurable model selection (per-call or global default)
        - Automatic retry with exponential backoff
        - Timeout handling
        - JSON response validation
        - Detailed logging for debugging
    
    Usage (in any AI agent):
        service = OpenRouterService()
        response = await service.chat_completion(messages=[...])
    """

    def __init__(self) -> None:
        self.api_key = settings.OPENROUTER_API_KEY
        self.base_url = settings.OPENROUTER_BASE_URL
        self.default_model = settings.OPENROUTER_MODEL
        self.timeout = settings.OPENROUTER_TIMEOUT
        self.max_retries = settings.OPENROUTER_MAX_RETRIES

        # Validate that API key is set
        if not self.api_key or self.api_key == "your-openrouter-api-key-here":
            logger.warning("OpenRouter API key is not configured — AI features will fail")

    def _build_headers(self) -> Dict[str, str]:
        """Build request headers for OpenRouter API."""
        return {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
            "HTTP-Referer": "https://agentverse.ai",     # Required by OpenRouter
            "X-Title": settings.APP_NAME,                # Optional — for OpenRouter dashboard
        }

    def _build_payload(
        self,
        messages: List[Dict[str, str]],
        model: Optional[str] = None,
        temperature: float = 0.3,
        max_tokens: int = 4096,
        response_format: Optional[Dict[str, str]] = None,
    ) -> Dict[str, Any]:
        """Build the request payload for the OpenRouter chat completions endpoint."""
        payload: Dict[str, Any] = {
            "model": model or self.default_model,
            "messages": messages,
            "temperature": temperature,
            "max_tokens": max_tokens,
        }

        if response_format:
            payload["response_format"] = response_format

        return payload

    async def chat_completion(
        self,
        messages: List[Dict[str, str]],
        model: Optional[str] = None,
        temperature: float = 0.3,
        max_tokens: int = 4096,
        expect_json: bool = True,
    ) -> str:
        """
        Send a chat completion request to OpenRouter with retry logic.
        
        Args:
            messages: List of message dicts with 'role' and 'content'
            model: Override model (defaults to OPENROUTER_MODEL from settings)
            temperature: Sampling temperature (0.0 = deterministic, 1.0 = creative)
            max_tokens: Maximum tokens in the response
            expect_json: If True, validates response is parseable JSON
            
        Returns:
            Raw response content string from the model
            
        Raises:
            OpenRouterTimeoutError: If request exceeds timeout
            OpenRouterError: If API returns an error
            InvalidAIResponseError: If response cannot be parsed
        """
        selected_model = model or self.default_model
        payload = self._build_payload(
            messages=messages,
            model=selected_model,
            temperature=temperature,
            max_tokens=max_tokens,
        )

        logger.info(
            "Sending request to OpenRouter",
            model=selected_model,
            message_count=len(messages),
        )

        raw_content = await self._execute_with_retry(payload)

        if expect_json:
            return self._extract_and_validate_json(raw_content)

        return raw_content

    @retry(
        retry=retry_if_exception_type((httpx.TimeoutException, httpx.ConnectError)),
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=2, max=10),
        reraise=True,
    )
    async def _execute_with_retry(self, payload: Dict[str, Any]) -> str:
        """
        Execute the HTTP request with automatic retry on transient failures.
        
        Retry conditions:
            - Connection errors (network issues)
            - Timeout errors (model overloaded)
        
        Does NOT retry on:
            - 4xx errors (auth, validation)
            - Invalid JSON responses
        """
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.post(
                    url=f"{self.base_url}/chat/completions",
                    headers=self._build_headers(),
                    json=payload,
                )

            logger.debug(
                "OpenRouter response received",
                status_code=response.status_code,
                model=payload.get("model"),
            )

            # Handle HTTP errors
            if response.status_code == 401:
                raise OpenRouterError(
                    message="Invalid OpenRouter API key. Check your OPENROUTER_API_KEY.",
                    details={"status_code": 401},
                )
            elif response.status_code == 429:
                raise OpenRouterError(
                    message="OpenRouter rate limit exceeded. Please wait before retrying.",
                    details={"status_code": 429, "hint": "Consider upgrading your OpenRouter plan."},
                )
            elif response.status_code >= 500:
                raise OpenRouterError(
                    message="OpenRouter server error. Please try again.",
                    details={"status_code": response.status_code},
                )
            elif response.status_code >= 400:
                error_detail = response.json() if response.content else {}
                raise OpenRouterError(
                    message=f"OpenRouter API error: {response.status_code}",
                    details={"status_code": response.status_code, "error": error_detail},
                )

            response_data = response.json()

            # Extract content from response
            content = (
                response_data
                .get("choices", [{}])[0]
                .get("message", {})
                .get("content", "")
            )

            if not content:
                raise OpenRouterError(
                    message="OpenRouter returned an empty response.",
                    details={"raw_response": str(response_data)[:500]},
                )

            logger.info(
                "OpenRouter response parsed successfully",
                content_length=len(content),
                model=response_data.get("model", "unknown"),
            )

            return content

        except httpx.TimeoutException:
            logger.error("OpenRouter request timed out", timeout=self.timeout)
            raise OpenRouterTimeoutError()
        except httpx.ConnectError as exc:
            logger.error("Cannot connect to OpenRouter", error=str(exc))
            raise OpenRouterError(
                message="Cannot connect to OpenRouter. Check network connectivity.",
                details={"error": str(exc)},
            )

    def _extract_and_validate_json(self, raw_content: str) -> str:
        """
        Extract and validate JSON from the model's response.
        
        Handles common cases where models wrap JSON in markdown code blocks.
        
        Args:
            raw_content: Raw string response from the model
            
        Returns:
            Validated JSON string
            
        Raises:
            InvalidAIResponseError: If no valid JSON can be extracted
        """
        content = raw_content.strip()

        # Strip markdown code blocks (```json ... ``` or ``` ... ```)
        if content.startswith("```"):
            lines = content.split("\n")
            # Remove first line (```json or ```) and last line (```)
            content = "\n".join(lines[1:-1]).strip()

        # Try to find JSON object boundaries
        start_idx = content.find("{")
        end_idx = content.rfind("}")

        if start_idx == -1 or end_idx == -1:
            logger.error("No JSON object found in AI response", preview=content[:200])
            raise InvalidAIResponseError(raw_response=raw_content)

        json_str = content[start_idx : end_idx + 1]

        # Validate it parses correctly
        try:
            json.loads(json_str)
            logger.debug("JSON extracted and validated successfully")
            return json_str
        except json.JSONDecodeError as exc:
            logger.error(
                "JSON parsing failed",
                error=str(exc),
                json_preview=json_str[:300],
            )
            raise InvalidAIResponseError(raw_response=raw_content)

    async def validate_connection(self) -> bool:
        """
        Test OpenRouter connectivity with a minimal request.
        Used for health checks.
        
        Returns:
            True if connection successful, False otherwise
        """
        try:
            test_messages = [OpenRouterMessage.user("Reply with the word: OK")]
            await self.chat_completion(messages=test_messages, max_tokens=10, expect_json=False)
            return True
        except Exception as exc:
            logger.warning("OpenRouter health check failed", error=str(exc))
            return False


# ── Module-level singleton ────────────────────────────────────────────────
# Reuse a single instance across all requests (connection pooling via httpx)
openrouter_service = OpenRouterService()
