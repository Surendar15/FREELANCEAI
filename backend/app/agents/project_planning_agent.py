"""
AgentVerse — Project Planning Intelligence Agent (Agent 5)
============================================================
AI Agent responsible for generating a comprehensive, structured project
execution roadmap with phase milestones, tasks, deliverables, and initial
progress states ("Pending") ready for progress tracking.

Integrates with OpenRouter via the shared OpenRouterService.
"""

import json
from typing import Dict, Any, Optional

from app.config.settings import settings
from app.services.openrouter_service import OpenRouterService, OpenRouterMessage
from app.utils.logger import get_logger

logger = get_logger(__name__)


class ProjectPlanningAgent:
    """
    Project Planning Intelligence Agent (Agent 5)
    
    Generates a structured multi-phase project execution roadmap.
    """

    AGENT_NAME = "ProjectPlanningAgent"

    SYSTEM_PROMPT = """You are a Principal Software Delivery Architect and Agile Project Manager at AgentVerse.

Your task is to analyze project specifications, technology stack, complexity, approved budget, and freelancer profile to generate a structured 5-phase project execution plan.

CRITICAL CONSTRAINTS:
1. Return ONLY a raw, valid JSON object without markdown formatting, backticks, or preamble text.
2. Must contain exactly 5 core development phases:
   - Phase 1: Requirement Verification
   - Phase 2: Backend Development
   - Phase 3: Frontend Development
   - Phase 4: Testing & Optimization
   - Phase 5: Deployment & Launch
3. Every phase MUST have:
   - `phase_name`: String
   - `duration_days`: Integer > 0
   - `status`: String, MUST BE EXACTLY "Pending"
   - `tasks`: Array of strings (3-5 specific tasks)
   - `deliverable`: String (concrete milestone deliverable)
4. `suggested_daily_progress` MUST be a float representing daily completion percentage.
5. All phases combined `duration_days` MUST equal `estimated_completion_days`.

REQUIRED JSON SCHEMA:
{
  "overview": "Executive overview of project execution plan...",
  "estimated_completion_days": 23,
  "phases": [
    {
      "phase_name": "Phase 1: Requirement Verification",
      "duration_days": 2,
      "status": "Pending",
      "tasks": ["Review Requirements", "Finalize Architecture", "Create Repository"],
      "deliverable": "Project Blueprint"
    },
    {
      "phase_name": "Phase 2: Backend Development",
      "duration_days": 8,
      "status": "Pending",
      "tasks": ["Authentication", "Database Schema", "REST APIs", "Testing"],
      "deliverable": "Backend Ready"
    },
    {
      "phase_name": "Phase 3: Frontend Development",
      "duration_days": 8,
      "status": "Pending",
      "tasks": ["UI Components", "Dashboard Layout", "Form Controls", "API Integration"],
      "deliverable": "Responsive Frontend"
    },
    {
      "phase_name": "Phase 4: Testing & Optimization",
      "duration_days": 3,
      "status": "Pending",
      "tasks": ["Bug Fixes", "Performance Optimization", "E2E Testing"],
      "deliverable": "Quality Assured Build"
    },
    {
      "phase_name": "Phase 5: Deployment & Launch",
      "duration_days": 2,
      "status": "Pending",
      "tasks": ["Cloud Deployment", "Final Review", "Documentation Handoff"],
      "deliverable": "Production Live Release"
    }
  ],
  "testing_phase": "Testing & QA strategy description...",
  "deployment_phase": "Deployment & CI/CD launch strategy...",
  "suggested_daily_progress": 4.3,
  "potential_risks": ["Risk 1", "Risk 2"],
  "recommendations": ["Recommendation 1", "Recommendation 2"]
}"""

    def __init__(self, openrouter_service: Optional[OpenRouterService] = None) -> None:
        self.openrouter = openrouter_service or OpenRouterService()
        logger.info(f"{self.AGENT_NAME} initialized model={self.openrouter.default_model}")

    async def generate_project_plan(
        self,
        project_title: str,
        project_description: str,
        ai_analysis: Optional[Dict[str, Any]],
        freelancer_data: Optional[Dict[str, Any]],
        approved_budget: Optional[float],
    ) -> Dict[str, Any]:
        """
        Generates a complete project execution plan via OpenRouter.
        """
        logger.info(
            "Generating AI project plan roadmap",
            project_title=project_title,
            freelancer_name=freelancer_data.get("name") if freelancer_data else None,
        )

        user_prompt = self._build_prompt(
            project_title=project_title,
            project_description=project_description,
            ai_analysis=ai_analysis or {},
            freelancer_data=freelancer_data or {},
            approved_budget=approved_budget,
        )

        messages = [
            OpenRouterMessage.system(self.SYSTEM_PROMPT),
            OpenRouterMessage.user(user_prompt),
        ]

        try:
            raw_response = await self.openrouter.chat_completion(
                messages=messages,
                temperature=0.3,
                max_tokens=1000,
            )
            parsed = self._parse_json_response(raw_response)
            if parsed:
                return parsed
        except Exception as exc:
            logger.warning(
                "OpenRouter project plan generation call failed, using rule-based plan generator",
                error=str(exc),
            )

        # Fallback to rule-based project plan generator
        return self._generate_rule_based_fallback(
            project_title=project_title,
            ai_analysis=ai_analysis or {},
            freelancer_data=freelancer_data or {},
            approved_budget=approved_budget,
        )

    def _build_prompt(
        self,
        project_title: str,
        project_description: str,
        ai_analysis: Dict[str, Any],
        freelancer_data: Dict[str, Any],
        approved_budget: Optional[float],
    ) -> str:
        req_skills = ai_analysis.get("required_skills", [])
        tech_stack = ai_analysis.get("technologies", [])
        complexity = ai_analysis.get("complexity", "Medium")
        timeline_weeks = ai_analysis.get("estimated_timeline_weeks", 4)
        features = ai_analysis.get("features", [])

        budget_str = f"₹{approved_budget:,.2f} INR" if approved_budget else "Agreed Market Rate"

        return f"""
PROJECT SPECIFICATIONS:
- Title: {project_title}
- Description: {project_description}
- Extracted Tech Stack: {", ".join(tech_stack) if tech_stack else "Web/Mobile Stack"}
- Key Skills Matrix: {", ".join(req_skills) if req_skills else "Full Stack"}
- Complexity: {complexity}
- Estimated Target Timeline: {timeline_weeks} weeks ({timeline_weeks * 7} days)
- Key Features Count: {len(features)}
- Approved Project Budget: {budget_str}

ASSIGNED FREELANCER:
- Name: {freelancer_data.get("name", "Candidate")}
- Title: {freelancer_data.get("title", "Specialist")}
- Experience: {freelancer_data.get("experience", 5)} years

Generate the 5-phase JSON execution plan now:
"""

    def _parse_json_response(self, text: str) -> Optional[Dict[str, Any]]:
        clean_text = text.strip()
        if clean_text.startswith("```"):
            lines = clean_text.splitlines()
            clean_text = "\n".join([line for line in lines if not line.startswith("```")])

        try:
            data = json.loads(clean_text)
            if "phases" in data and len(data["phases"]) >= 3:
                # Enforce status = "Pending" for initial plan
                for p in data["phases"]:
                    p["status"] = "Pending"
                    p["duration_days"] = int(p.get("duration_days", 3))

                total_days = sum(p["duration_days"] for p in data["phases"])
                data["estimated_completion_days"] = total_days
                data["suggested_daily_progress"] = round(100.0 / max(total_days, 1), 1)

                return data
        except (json.JSONDecodeError, ValueError, KeyError):
            pass
        return None

    def _generate_rule_based_fallback(
        self,
        project_title: str,
        ai_analysis: Dict[str, Any],
        freelancer_data: Dict[str, Any],
        approved_budget: Optional[float],
    ) -> Dict[str, Any]:
        weeks = int(ai_analysis.get("estimated_timeline_weeks", 3))
        total_days = max(14, weeks * 7)

        p1_days = 2
        p2_days = max(4, int(total_days * 0.35))
        p3_days = max(4, int(total_days * 0.35))
        p4_days = max(2, int(total_days * 0.15))
        p5_days = max(2, total_days - (p1_days + p2_days + p3_days + p4_days))

        tech = ai_analysis.get("technologies", ["Web Application"])
        tech_str = ", ".join(tech[:3]) if tech else "Full Stack Architecture"
        f_name = freelancer_data.get("name", "Assigned Lead Developer")

        return {
            "overview": (
                f"Official execution plan for '{project_title}' assigned to {f_name}. "
                f"Structured into 5 core delivery phases spanning {total_days} total days."
            ),
            "estimated_completion_days": total_days,
            "phases": [
                {
                    "phase_name": "Phase 1: Requirement Verification",
                    "duration_days": p1_days,
                    "status": "Pending",
                    "tasks": [
                        "Review Project Specifications & Requirements",
                        f"Finalize Tech Stack & Architecture ({tech_str})",
                        "Setup Git Repository & CI/CD Pipeline Base",
                    ],
                    "deliverable": "Project Blueprint & Repository Initialization",
                },
                {
                    "phase_name": "Phase 2: Backend Development",
                    "duration_days": p2_days,
                    "status": "Pending",
                    "tasks": [
                        "Design Database Models & Migrations",
                        "Implement Authentication & Security Protocols",
                        "Develop REST API Endpoints for Core Features",
                        "Write Unit & Service Layer Tests",
                    ],
                    "deliverable": "Tested Core Backend API Services",
                },
                {
                    "phase_name": "Phase 3: Frontend Development",
                    "duration_days": p3_days,
                    "status": "Pending",
                    "tasks": [
                        "Build Design System & Component Library",
                        "Implement Interactive Dashboard & Views",
                        "Connect Frontend API Client to Backend Services",
                        "Optimize Responsive Layouts & UX Micro-animations",
                    ],
                    "deliverable": "Responsive Integrated Frontend Platform",
                },
                {
                    "phase_name": "Phase 4: Testing & Optimization",
                    "duration_days": p4_days,
                    "status": "Pending",
                    "tasks": [
                        "Conduct End-to-End System Testing",
                        "Audit API Response Times & DB Query Performance",
                        "Fix UI/UX Edge Case Bugs",
                    ],
                    "deliverable": "Production-Grade Quality Assured Build",
                },
                {
                    "phase_name": "Phase 5: Deployment & Launch",
                    "duration_days": p5_days,
                    "status": "Pending",
                    "tasks": [
                        "Deploy Production Cloud Infrastructure",
                        "Perform Final Live Review & Client Verification",
                        "Deliver System Documentation & Handoff",
                    ],
                    "deliverable": "Live Production Deployment",
                },
            ],
            "testing_phase": (
                "Automated API integration testing, cross-browser responsiveness verification, "
                "and database load optimization prior to launch."
            ),
            "deployment_phase": (
                "Automated containerized cloud deployment with SSL certificates, environment security, "
                "and production monitoring."
            ),
            "suggested_daily_progress": round(100.0 / total_days, 1),
            "potential_risks": [
                "Unanticipated third-party API integration bottlenecks",
                "Complex state management edge cases during high concurrency",
            ],
            "recommendations": [
                "Review phase deliverables upon completion of each milestone",
                "Maintain clear async communication on progress updates",
            ],
        }


project_planning_agent = ProjectPlanningAgent()
