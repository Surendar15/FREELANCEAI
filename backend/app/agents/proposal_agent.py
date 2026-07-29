"""
AgentVerse — Proposal Intelligence Agent (Agent 3)
===================================================
AI Agent responsible for evaluating accepted freelancers and generating
client-friendly proposal summaries, confidence scores, and recommendation badges.

Integrates with OpenRouter via the shared OpenRouterService.
"""

import json
from typing import Dict, Any, Optional

from app.config.settings import settings
from app.services.openrouter_service import OpenRouterService, OpenRouterMessage
from app.utils.logger import get_logger

logger = get_logger(__name__)


class ProposalIntelligenceAgent:
    """
    Proposal Intelligence Agent (Agent 3)
    
    Converts raw technical freelancer data and project requirements into a
    human-friendly, professional hiring recommendation for the client.
    """

    AGENT_NAME = "ProposalIntelligenceAgent"

    SYSTEM_PROMPT = """You are a Senior AI Software Architect and Executive Hiring Consultant at AgentVerse.

Your task is to analyze an ACCEPTED freelancer profile against the project requirements and generate a professional, client-friendly hiring summary.

CRITICAL CONSTRAINTS:
1. Return ONLY a raw, valid JSON object without markdown formatting, backticks, or preamble text.
2. Language must be simple, executive-level, professional, and client-friendly (NO overly dense technical jargon).
3. The `ai_summary` field MUST be a clear recommendation paragraph between 60 and 120 words maximum.
4. `confidence_score` must be a float between 85.0 and 99.0 reflecting AI confidence in candidate fit.
5. `recommendation_badge` must be one of: "⭐⭐ Highly Recommended", "⭐ Highly Suitable", or "Recommended Candidate".

REQUIRED JSON SCHEMA:
{
  "ai_summary": "Professional summary paragraph under 120 words explaining candidate suitability...",
  "why_matched": "2-3 key reasons why this freelancer matches the client's goals...",
  "strengths": ["Key Strength 1", "Key Strength 2", "Key Strength 3"],
  "confidence_score": 96.5,
  "recommendation_badge": "⭐⭐ Highly Recommended"
}"""

    def __init__(self, openrouter_service: Optional[OpenRouterService] = None) -> None:
        self.openrouter = openrouter_service or OpenRouterService()
        logger.info(f"{self.AGENT_NAME} initialized model={self.openrouter.default_model}")

    async def generate_summary(
        self,
        project_title: str,
        project_description: str,
        ai_analysis: Optional[Dict[str, Any]],
        freelancer_data: Dict[str, Any],
        match_score: float,
    ) -> Dict[str, Any]:
        """
        Generate AI proposal summary and recommendation for an accepted freelancer.
        """
        logger.info(
            "Generating AI proposal summary",
            project_title=project_title,
            freelancer_name=freelancer_data.get("name"),
        )

        user_prompt = self._build_prompt(
            project_title=project_title,
            project_description=project_description,
            ai_analysis=ai_analysis or {},
            freelancer_data=freelancer_data,
            match_score=match_score,
        )

        messages = [
            OpenRouterMessage.system(self.SYSTEM_PROMPT),
            OpenRouterMessage.user(user_prompt),
        ]

        try:
            raw_response = await self.openrouter.chat_completion(
                messages=messages,
                temperature=0.3,
                max_tokens=600,
            )
            parsed = self._parse_json_response(raw_response)
            if parsed:
                return parsed
        except Exception as exc:
            logger.warning(
                "OpenRouter AI summary generation call failed, using rule-based generator",
                error=str(exc),
            )

        # Fallback to rule-based summary if LLM call is unavailable
        return self._generate_rule_based_fallback(
            project_title=project_title,
            freelancer_data=freelancer_data,
            match_score=match_score,
        )

    def _build_prompt(
        self,
        project_title: str,
        project_description: str,
        ai_analysis: Dict[str, Any],
        freelancer_data: Dict[str, Any],
        match_score: float,
    ) -> str:
        req_skills = ai_analysis.get("required_skills", [])
        tech_stack = ai_analysis.get("technologies", [])
        complexity = ai_analysis.get("complexity", "Medium")

        return f"""
PROJECT OVERVIEW:
- Title: {project_title}
- Description: {project_description}
- Extracted Tech Stack: {", ".join(tech_stack) if tech_stack else "Standard Web/Mobile"}
- Key Required Skills: {", ".join(req_skills) if req_skills else "Full Stack Development"}
- Complexity Rating: {complexity}

ACCEPTED FREELANCER PROFILE:
- Name: {freelancer_data.get("name")}
- Role Title: {freelancer_data.get("title")}
- Years of Experience: {freelancer_data.get("experience")} years
- Platform Rating: ⭐ {freelancer_data.get("rating")} / 5.0
- Completed Projects: {freelancer_data.get("completed_projects")} projects
- Availability: {freelancer_data.get("availability")}
- Skills: {", ".join(freelancer_data.get("skills", []))}
- Bio: {freelancer_data.get("bio")}
- Calculated Match Compatibility: {match_score}% Match

Generate the JSON recommendation now:
"""

    def _parse_json_response(self, text: str) -> Optional[Dict[str, Any]]:
        clean_text = text.strip()
        if clean_text.startswith("```"):
            lines = clean_text.splitlines()
            clean_text = "\n".join([line for line in lines if not line.startswith("```")])

        try:
            data = json.loads(clean_text)
            if "ai_summary" in data:
                return {
                    "ai_summary": data.get("ai_summary", "").strip(),
                    "why_matched": data.get("why_matched", "").strip(),
                    "strengths": data.get("strengths", []),
                    "confidence_score": float(data.get("confidence_score", 94.0)),
                    "recommendation_badge": data.get("recommendation_badge", "⭐⭐ Highly Recommended"),
                }
        except json.JSONDecodeError:
            pass
        return None

    def _generate_rule_based_fallback(
        self,
        project_title: str,
        freelancer_data: Dict[str, Any],
        match_score: float,
    ) -> Dict[str, Any]:
        name = freelancer_data.get("name", "Candidate")
        title = freelancer_data.get("title", "Software Specialist")
        exp = freelancer_data.get("experience", 5)
        rating = freelancer_data.get("rating", 4.9)
        completed = freelancer_data.get("completed_projects", 20)
        skills = ", ".join(freelancer_data.get("skills", [])[:3])

        summary = (
            f"{name} is an experienced {title} with over {exp} years of professional expertise. "
            f"Their background in {skills} closely aligns with the requirements of '{project_title}'. "
            f"With a stellar {rating}-star rating and {completed} successfully delivered projects on the platform, "
            f"they are highly capable of delivering high-quality results efficiently."
        )

        badge = "⭐⭐ Highly Recommended" if match_score >= 90 else "⭐ Recommended Candidate"

        return {
            "ai_summary": summary,
            "why_matched": f"{name} brings proven experience in {skills} with a high client rating.",
            "strengths": [
                f"{exp}+ years professional experience as {title}",
                f"Proven track record with {completed} completed projects",
                f"Consistently high {rating}/5.0 client rating",
            ],
            "confidence_score": round(min(98.5, max(88.0, match_score + 2.0)), 1),
            "recommendation_badge": badge,
        }


proposal_agent = ProposalIntelligenceAgent()
