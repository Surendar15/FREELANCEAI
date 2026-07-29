"""
AgentVerse — Progress Monitoring & Recovery Intelligence Agent (Agent 6)
========================================================================
AI Agent responsible for monitoring milestone execution, detecting delay risks,
and generating concise AI Recovery Summaries (maximum 80 words) for the client.

Integrates with OpenRouter via the shared OpenRouterService.
"""

from typing import Dict, Any, Optional
from app.services.openrouter_service import OpenRouterService, OpenRouterMessage
from app.utils.logger import get_logger

logger = get_logger(__name__)


class ProgressMonitoringAgent:
    """
    Progress Monitoring & Recovery Intelligence Agent (Agent 6)
    """

    AGENT_NAME = "ProgressMonitoringAgent"

    SYSTEM_PROMPT = """You are a Lead Delivery Recovery Specialist at AgentVerse.

Your task is to analyze an overdue or failed project milestone and generate a concise AI Recovery Summary for the client.

CRITICAL CONSTRAINTS:
1. Maximum length: EXACTLY 80 words or fewer.
2. Focus strictly on root cause, impact, and actionable recovery recommendations.
3. Keep tone professional, objective, and executive-ready.
4. Do NOT include preamble, greetings, or markdown code blocks."""

    def __init__(self, openrouter_service: Optional[OpenRouterService] = None) -> None:
        self.openrouter = openrouter_service or OpenRouterService()
        logger.info(f"{self.AGENT_NAME} initialized model={self.openrouter.default_model}")

    async def generate_recovery_summary(
        self,
        project_title: str,
        overdue_task_name: str,
        overdue_days: int,
        freelancer_name: str,
        tech_stack: Optional[str] = None,
    ) -> str:
        """
        Generates an AI Recovery Summary under 80 words for overdue project milestones.
        """
        logger.info(
            "Generating AI Recovery Summary",
            project_title=project_title,
            overdue_task=overdue_task_name,
            overdue_days=overdue_days,
        )

        user_prompt = f"""
OVERDUE MILESTONE METRICS:
- Project: {project_title}
- Assigned Freelancer: {freelancer_name}
- Overdue Task: {overdue_task_name}
- Days Overdue: {overdue_days} days
- Stack Context: {tech_stack or "Full Stack"}

Generate a concise recovery recommendation (MAXIMUM 80 WORDS) explaining the schedule impact and recovery strategy:
"""

        messages = [
            OpenRouterMessage.system(self.SYSTEM_PROMPT),
            OpenRouterMessage.user(user_prompt),
        ]

        try:
            summary = await self.openrouter.chat_completion(
                messages=messages,
                temperature=0.3,
                max_tokens=150,
            )
            clean_summary = summary.strip()
            # Enforce 80 word limit
            words = clean_summary.split()
            if len(words) > 80:
                clean_summary = " ".join(words[:80]) + "..."
            return clean_summary
        except Exception as exc:
            logger.warning(
                "OpenRouter recovery summary call failed, using rule-based recovery summary",
                error=str(exc),
            )

        return (
            f"The milestone '{overdue_task_name}' is currently overdue by {overdue_days} days. "
            f"Reassigning task scope or granting a timeline adjustment will enable {freelancer_name} to catch up on deliverables without sacrificing quality."
        )


progress_monitoring_agent = ProgressMonitoringAgent()
