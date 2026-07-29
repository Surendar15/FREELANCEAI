"""
AgentVerse — Requirement Intelligence Agent
=============================================
The first and currently only active AI agent in the platform.

Responsibilities:
    1. Receive a project title + description from the client
    2. Build a structured prompt for the LLM
    3. Send to OpenRouter via the shared OpenRouterService
    4. Parse and validate the JSON response
    5. Return a typed AIAnalysisResult object

Design Principles:
    - ONLY returns valid JSON (never markdown, never explanations)
    - Validates every field against AIAnalysisResult Pydantic schema
    - Falls back to a safe partial result on parse errors (never crashes the API)
    - Fully extensible: other agents follow the same pattern

Architecture Note for Future Agents:
    Each new agent (TalentAgent, ProposalAgent, etc.) should:
    1. Create a new file in app/agents/
    2. Import OpenRouterService (do NOT create a new one)
    3. Define its own prompt-building method
    4. Define its own response schema in app/schemas/
    5. Define its own service method in app/services/
"""

import json
from typing import Optional

from app.config.settings import settings
from app.core.exceptions import RequirementAgentError, InvalidAIResponseError
from app.schemas.project import AIAnalysisResult
from app.services.openrouter_service import OpenRouterService, OpenRouterMessage
from app.utils.logger import get_logger

logger = get_logger(__name__)


class RequirementIntelligenceAgent:
    """
    Requirement Intelligence Agent — Phase 1 AI Agent.
    
    This agent analyses a project description and extracts structured
    requirements, technologies, features, risks, and estimates.
    
    It communicates with the LLM via the shared OpenRouterService,
    ensuring no duplicated API logic across agents.
    """

    AGENT_NAME = "RequirementIntelligenceAgent"

    # ── System Prompt ──────────────────────────────────────────────────────
    SYSTEM_PROMPT = """You are an expert software architect and project analyst with 15+ years of experience in software engineering, project management, and technology consulting.

Your task is to analyze a client's project description and extract structured requirements.

CRITICAL RULES:
1. You MUST return ONLY valid JSON — no markdown, no explanations, no code blocks
2. Every field in the JSON schema must be present
3. Use realistic, professional estimates based on industry standards
4. If information is not provided, make reasonable inferences from the context
5. All string values must be non-empty
6. All array values must contain at least one item

Return ONLY the JSON object. Nothing else."""

    # ── User Prompt Template ───────────────────────────────────────────────
    ANALYSIS_PROMPT_TEMPLATE = """Analyze the following project and return a structured JSON analysis.

PROJECT TITLE: {title}

PROJECT DESCRIPTION:
{description}

{budget_context}
{deadline_context}

Return ONLY this exact JSON structure (all fields required):

{{
  "project_title": "cleaned and formatted project title",
  "project_type": "Web App | Mobile App | API | Desktop App | Data Pipeline | ML System | Other",
  "domain": "e.g., E-commerce, HealthTech, FinTech, EdTech, SaaS, etc.",
  "required_technologies": {{
    "programming_languages": ["language1", "language2"],
    "frameworks": ["framework1", "framework2"],
    "databases": ["database1"],
    "cloud_services": ["service1"],
    "tools": ["tool1", "tool2"]
  }},
  "required_skills": ["skill1", "skill2", "skill3"],
  "nice_to_have_skills": ["skill1", "skill2"],
  "core_features": [
    {{
      "name": "Feature Name",
      "description": "What this feature does",
      "priority": "high"
    }}
  ],
  "optional_features": [
    {{
      "name": "Feature Name",
      "description": "What this feature does",
      "priority": "low"
    }}
  ],
  "estimated_complexity": "simple | moderate | complex | enterprise",
  "suggested_team_size": 4,
  "priority_level": "low | medium | high | critical",
  "estimated_timeline_weeks": 12,
  "suggested_budget_range": {{
    "min_usd": 10000,
    "max_usd": 30000,
    "currency": "INR"
  }},
  "potential_risks": [
    {{
      "risk": "Risk description",
      "impact": "high | medium | low",
      "mitigation": "How to mitigate this risk"
    }}
  ],
  "deliverables": ["Deliverable 1", "Deliverable 2"],
  "dependencies": ["Dependency 1", "Dependency 2"],
  "analysis_confidence": "low | medium | high",
  "analysis_notes": "Any important notes or assumptions made during analysis"
}}"""

    def __init__(self, openrouter_service: OpenRouterService) -> None:
        """
        Initialize the agent with a shared OpenRouterService instance.
        
        Args:
            openrouter_service: Shared service instance (dependency injected)
        """
        self.openrouter = openrouter_service
        logger.info(f"{self.AGENT_NAME} initialized", model=settings.OPENROUTER_MODEL)

    def _build_prompt(
        self,
        title: str,
        description: str,
        budget: Optional[float] = None,
        deadline: Optional[str] = None,
    ) -> str:
        """
        Build the analysis prompt with project context.
        
        Args:
            title: Project title
            description: Full project description
            budget: Optional budget hint
            deadline: Optional deadline string
            
        Returns:
            Formatted prompt string
        """
        budget_context = (
            f"CLIENT BUDGET: ₹{budget:,.0f} INR" if budget else
            "CLIENT BUDGET: Not specified — provide a realistic market estimate"
        )

        deadline_context = (
            f"CLIENT DEADLINE: {deadline}" if deadline else
            "CLIENT DEADLINE: Not specified — provide a realistic timeline estimate"
        )

        return self.ANALYSIS_PROMPT_TEMPLATE.format(
            title=title,
            description=description,
            budget_context=budget_context,
            deadline_context=deadline_context,
        )

    def _parse_and_validate(self, json_str: str) -> AIAnalysisResult:
        """
        Parse the JSON string and validate against AIAnalysisResult schema.
        
        Args:
            json_str: Validated JSON string from OpenRouter
            
        Returns:
            Typed AIAnalysisResult instance
            
        Raises:
            RequirementAgentError: If JSON cannot be validated against schema
        """
        try:
            data = json.loads(json_str)
            result = AIAnalysisResult(**data)
            logger.info(
                "AI analysis parsed and validated",
                project_type=result.project_type,
                complexity=result.estimated_complexity,
                team_size=result.suggested_team_size,
            )
            return result
        except Exception as exc:
            logger.error(
                "Failed to validate AI response against schema",
                error=str(exc),
                json_preview=json_str[:300],
            )
            raise RequirementAgentError(
                message=f"AI response did not match expected schema: {str(exc)}",
                details={"json_preview": json_str[:200]},
            )

    async def analyze(
        self,
        title: str,
        description: str,
        budget: Optional[float] = None,
        deadline: Optional[str] = None,
    ) -> AIAnalysisResult:
        """
        Perform AI-powered requirement analysis on a project.
        
        This is the main entry point for the agent.
        
        Args:
            title: Project title
            description: Full project description from the client
            budget: Optional budget in USD
            deadline: Optional deadline as string
            
        Returns:
            Fully validated AIAnalysisResult with structured requirements
            
        Raises:
            RequirementAgentError: If analysis fails for any reason
        """
        logger.info(
            "Starting requirement analysis",
            agent=self.AGENT_NAME,
            title=title,
            description_length=len(description),
        )

        try:
            # Build the structured prompt
            user_prompt = self._build_prompt(
                title=title,
                description=description,
                budget=budget,
                deadline=str(deadline) if deadline else None,
            )

            # Send to OpenRouter
            messages = [
                OpenRouterMessage.system(self.SYSTEM_PROMPT),
                OpenRouterMessage.user(user_prompt),
            ]

            json_response = await self.openrouter.chat_completion(
                messages=messages,
                temperature=0.2,      # Low temperature for consistent, structured output
                max_tokens=4096,
                expect_json=True,
            )

            # Parse and validate
            result = self._parse_and_validate(json_response)

            logger.info(
                "Requirement analysis completed successfully",
                agent=self.AGENT_NAME,
                project_title=result.project_title,
                complexity=result.estimated_complexity,
            )

            return result

        except RequirementAgentError:
            raise
        except Exception as exc:
            logger.error(
                "Unexpected error in requirement analysis",
                agent=self.AGENT_NAME,
                error=str(exc),
            )
            raise RequirementAgentError(
                message=f"Requirement analysis failed: {str(exc)}",
                details={"original_error": type(exc).__name__},
            )


# ── Module-level singleton ────────────────────────────────────────────────
# Import and reuse this instance in services — avoid creating multiple instances
from app.services.openrouter_service import openrouter_service

requirement_agent = RequirementIntelligenceAgent(openrouter_service=openrouter_service)
