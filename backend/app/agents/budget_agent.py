"""
AgentVerse — Budget Intelligence Agent (Agent 4)
=================================================
AI Agent responsible for analyzing project scope, tech stack, complexity,
risk, and timeline to calculate realistic, market-aware budget recommendations.

Integrates with OpenRouter via the shared OpenRouterService.
"""

import json
from typing import Dict, Any, Optional

from app.config.settings import settings
from app.services.openrouter_service import OpenRouterService, OpenRouterMessage
from app.utils.logger import get_logger

logger = get_logger(__name__)


class BudgetIntelligenceAgent:
    """
    Budget Intelligence Agent (Agent 4)
    
    Calculates minimum, maximum, and recommended project budget ranges along with
    an executive explanation under 100 words based on AI project analysis.
    """

    AGENT_NAME = "BudgetIntelligenceAgent"

    SYSTEM_PROMPT = """You are a Senior Technical Project Estimator and IT Budget Consultant at AgentVerse.

Your task is to analyze project requirements (complexity, technologies, timeline, features, risk) and recommend a realistic market budget range in INR (₹).

CRITICAL CONSTRAINTS:
1. Return ONLY a raw, valid JSON object without markdown formatting, backticks, or preamble text.
2. The `budget_reason` field MUST be an executive explanation paragraph under 100 words maximum.
3. `minimum_budget`, `maximum_budget`, and `recommended_budget` MUST be positive numbers where minimum_budget <= recommended_budget <= maximum_budget.
4. Ensure reasonable pricing for freelancing work in INR (e.g., ₹25,000 - ₹5,000,000 depending on complexity).

REQUIRED JSON SCHEMA:
{
  "minimum_budget": 45000.0,
  "maximum_budget": 65000.0,
  "recommended_budget": 50000.0,
  "budget_reason": "The recommended budget is based on the project's medium complexity, React + FastAPI stack, authentication, payment integration, estimated 30-day delivery, and current market rates."
}"""

    def __init__(self, openrouter_service: Optional[OpenRouterService] = None) -> None:
        self.openrouter = openrouter_service or OpenRouterService()
        logger.info(f"{self.AGENT_NAME} initialized model={self.openrouter.default_model}")

    async def calculate_budget_recommendation(
        self,
        project_title: str,
        project_description: str,
        ai_analysis: Optional[Dict[str, Any]],
        freelancer_data: Optional[Dict[str, Any]] = None,
        client_budget: Optional[float] = None,
    ) -> Dict[str, Any]:
        """
        Calculates recommended budget range and explanation for a project.
        """
        logger.info(
            "Calculating AI budget recommendation",
            project_title=project_title,
            client_budget=client_budget,
        )

        user_prompt = self._build_prompt(
            project_title=project_title,
            project_description=project_description,
            ai_analysis=ai_analysis or {},
            freelancer_data=freelancer_data or {},
            client_budget=client_budget,
        )

        messages = [
            OpenRouterMessage.system(self.SYSTEM_PROMPT),
            OpenRouterMessage.user(user_prompt),
        ]

        try:
            raw_response = await self.openrouter.chat_completion(
                messages=messages,
                temperature=0.2,
                max_tokens=400,
            )
            parsed = self._parse_json_response(raw_response)
            if parsed:
                return parsed
        except Exception as exc:
            logger.warning(
                "OpenRouter budget recommendation call failed, using rule-based estimator",
                error=str(exc),
            )

        # Fallback to rule-based budget calculation
        return self._generate_rule_based_fallback(
            project_title=project_title,
            ai_analysis=ai_analysis or {},
            client_budget=client_budget,
        )

    def _build_prompt(
        self,
        project_title: str,
        project_description: str,
        ai_analysis: Dict[str, Any],
        freelancer_data: Dict[str, Any],
        client_budget: Optional[float],
    ) -> str:
        req_skills = ai_analysis.get("required_skills", [])
        tech_stack = ai_analysis.get("technologies", [])
        complexity = ai_analysis.get("complexity", "Medium")
        timeline = ai_analysis.get("estimated_timeline_weeks", 4)
        features = ai_analysis.get("features", [])

        return f"""
PROJECT SPECIFICATIONS:
- Title: {project_title}
- Description: {project_description}
- Extracted Tech Stack: {", ".join(tech_stack) if tech_stack else "Standard Web App"}
- Required Skills: {", ".join(req_skills) if req_skills else "Full Stack"}
- Complexity Rating: {complexity}
- Estimated Timeline: {timeline} weeks
- Number of Features: {len(features)}
- Client Stated Budget: ${client_budget if client_budget else "Not Specified"}

SELECTED FREELANCER OVERVIEW:
- Name: {freelancer_data.get("name", "Assigned Candidate")}
- Role: {freelancer_data.get("title", "Specialist")}
- Experience: {freelancer_data.get("experience", 5)} years

Calculate the budget range (min, max, recommended) and executive explanation now:
"""

    def _parse_json_response(self, text: str) -> Optional[Dict[str, Any]]:
        clean_text = text.strip()
        if clean_text.startswith("```"):
            lines = clean_text.splitlines()
            clean_text = "\n".join([line for line in lines if not line.startswith("```")])

        try:
            data = json.loads(clean_text)
            if "recommended_budget" in data and "minimum_budget" in data and "maximum_budget" in data:
                min_b = float(data["minimum_budget"])
                max_b = float(data["maximum_budget"])
                rec_b = float(data["recommended_budget"])
                
                # Sanity adjustments
                if min_b > rec_b:
                    min_b = rec_b * 0.9
                if max_b < rec_b:
                    max_b = rec_b * 1.15

                return {
                    "minimum_budget": round(min_b, 2),
                    "maximum_budget": round(max_b, 2),
                    "recommended_budget": round(rec_b, 2),
                    "budget_reason": data.get("budget_reason", "").strip(),
                }
        except (json.JSONDecodeError, ValueError, KeyError):
            pass
        return None

    def _generate_rule_based_fallback(
        self,
        project_title: str,
        ai_analysis: Dict[str, Any],
        client_budget: Optional[float],
    ) -> Dict[str, Any]:
        complexity = str(ai_analysis.get("complexity", "medium")).lower()
        weeks = float(ai_analysis.get("estimated_timeline_weeks", 4))

        # Base rate per week based on complexity
        weekly_rate = 350.0
        if "simple" in complexity:
            weekly_rate = 250.0
        elif "complex" in complexity or "enterprise" in complexity:
            weekly_rate = 500.0

        base_rec = round(weekly_rate * max(weeks, 1.0), 2)
        if client_budget and client_budget > 0:
            # Blend client budget with baseline
            base_rec = round((client_budget * 0.6) + (base_rec * 0.4), 2)

        min_b = round(base_rec * 0.88, 2)
        max_b = round(base_rec * 1.15, 2)

        reason = (
            f"The recommended budget of ${base_rec:,.0f} is based on the project's {complexity} complexity, "
            f"estimated {weeks:.0f}-week timeline, required technology stack, feature scope, and current market rates."
        )

        return {
            "minimum_budget": min_b,
            "maximum_budget": max_b,
            "recommended_budget": base_rec,
            "budget_reason": reason,
        }


budget_agent = BudgetIntelligenceAgent()
