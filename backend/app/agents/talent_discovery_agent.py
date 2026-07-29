"""
AgentVerse — Talent Discovery Agent (Agent 2)
==============================================
Intelligent rule-based matching agent that evaluates candidates from the freelancer database
against structured project requirements produced by the Requirement Intelligence Agent (Agent 1).

Weighting Formula:
    - Skill Match: 50%
    - Experience Match: 20%
    - Rating Score: 15%
    - Availability: 10%
    - Completed Projects: 5%

Sorts candidates by Match Score and returns top matches.
"""

from typing import List, Dict, Any, Tuple
from app.models.freelancer import Freelancer
from app.utils.logger import get_logger

logger = get_logger(__name__)


class TalentDiscoveryAgent:
    """
    Talent Discovery Agent — evaluates and ranks freelancers using a multi-factor matching engine.
    """

    AGENT_NAME = "TalentDiscoveryAgent"

    def __init__(self) -> None:
        logger.info(f"{self.AGENT_NAME} initialized — Rule-based Matching Engine")

    def _extract_required_skills(self, ai_analysis: Dict[str, Any]) -> set:
        """
        Consolidate all required skills, programming languages, frameworks,
        databases, tools, and cloud services from Agent 1 analysis.
        """
        skills_set = set()

        # 1. Required skills list
        req_skills = ai_analysis.get("required_skills", [])
        for s in req_skills:
            if isinstance(s, str):
                skills_set.add(s.strip().lower())

        # 2. Nice to have skills
        nice_skills = ai_analysis.get("nice_to_have_skills", [])
        for s in nice_skills:
            if isinstance(s, str):
                skills_set.add(s.strip().lower())

        # 3. Required technologies dict
        tech = ai_analysis.get("required_technologies", {})
        if isinstance(tech, dict):
            for category in ["programming_languages", "frameworks", "databases", "tools", "cloud_services"]:
                items = tech.get(category, [])
                if isinstance(items, list):
                    for item in items:
                        if isinstance(item, str):
                            skills_set.add(item.strip().lower())

        return skills_set

    def _calculate_candidate_score(
        self,
        freelancer: Freelancer,
        ai_analysis: Dict[str, Any],
        required_skills_set: set,
    ) -> Tuple[float, Dict[str, Any]]:
        """
        Calculate compatibility score (0 to 100%) for a freelancer.
        
        Score components:
            - Skill Match (50 points max)
            - Experience (20 points max)
            - Rating (15 points max)
            - Availability (10 points max)
            - Completed Projects (5 points max)
        """
        freelancer_skills_set = {str(s).strip().lower() for s in freelancer.skills}
        matching_skills = []

        # 1. Skill Match Score (50%)
        if not required_skills_set:
            skill_score = 40.0
        else:
            matches_count = 0
            for req_skill in required_skills_set:
                # Direct or substring match check
                matched = any(
                    req_skill in f_skill or f_skill in req_skill
                    for f_skill in freelancer_skills_set
                )
                if matched:
                    matches_count += 1
                    # Find original string for display
                    orig = next(
                        (s for s in freelancer.skills if str(s).strip().lower() in req_skill or req_skill in str(s).strip().lower()),
                        req_skill
                    )
                    if orig not in matching_skills:
                        matching_skills.append(orig)

            ratio = matches_count / max(1, len(required_skills_set))
            # Boost score if candidate has at least 2 key matching skills
            skill_score = min(50.0, ratio * 50.0 + (5.0 if matches_count >= 2 else 0.0))

        # 2. Experience Match Score (20%)
        complexity = str(ai_analysis.get("estimated_complexity", "Moderate")).lower()
        ideal_exp = 5.0 if "high" in complexity or "enterprise" in complexity else (3.0 if "moderate" in complexity or "medium" in complexity else 2.0)
        
        if freelancer.experience >= ideal_exp:
            exp_score = 20.0
        else:
            exp_score = max(5.0, (freelancer.experience / max(1.0, ideal_exp)) * 20.0)

        # 3. Rating Score (15%)
        # Scale rating (0-5) to 15 points
        rating_score = (freelancer.rating / 5.0) * 15.0

        # 4. Availability Score (10%)
        avail = str(freelancer.availability).lower()
        if "available" in avail and "part" not in avail and "busy" not in avail:
            avail_score = 10.0
        elif "part" in avail or "part-time" in avail:
            avail_score = 6.5
        else:
            avail_score = 3.0

        # 5. Completed Projects Score (5%)
        # Max points for 30+ completed projects
        projects_score = min(5.0, (freelancer.completed_projects / 30.0) * 5.0)

        # Total Match Score
        total_score = round(min(99.0, skill_score + exp_score + rating_score + avail_score + projects_score), 1)

        score_breakdown = {
            "skill_match": round(skill_score, 1),
            "experience_match": round(exp_score, 1),
            "rating_match": round(rating_score, 1),
            "availability_match": round(avail_score, 1),
            "completed_projects_match": round(projects_score, 1),
            "matching_skills": matching_skills[:6],
        }

        return total_score, score_breakdown

    def rank_freelancers(
        self,
        freelancers: List[Freelancer],
        ai_analysis: Dict[str, Any],
        top_n: int = 3,
    ) -> List[Dict[str, Any]]:
        """
        Rank freelancers based on project requirements and return top N.
        
        Args:
            freelancers: List of candidate Freelancer ORM models
            ai_analysis: Structured JSON analysis from Agent 1
            top_n: Number of top candidates to return (default 3)
            
        Returns:
            List of dicts: {"freelancer": Freelancer, "match_score": float, "breakdown": dict}
        """
        logger.info(
            f"TalentDiscoveryAgent ranking {len(freelancers)} candidates",
            top_n=top_n,
        )

        required_skills = self._extract_required_skills(ai_analysis)
        scored_candidates = []

        for freelancer in freelancers:
            if freelancer.status.lower() != "active":
                continue

            score, breakdown = self._calculate_candidate_score(
                freelancer=freelancer,
                ai_analysis=ai_analysis,
                required_skills_set=required_skills,
            )

            scored_candidates.append({
                "freelancer": freelancer,
                "match_score": score,
                "score_breakdown": breakdown,
            })

        # Sort descending by match_score, then rating, then completed_projects
        scored_candidates.sort(
            key=lambda x: (x["match_score"], x["freelancer"].rating, x["freelancer"].completed_projects),
            reverse=True,
        )

        top_matches = scored_candidates[:top_n]

        logger.info(
            "TalentDiscoveryAgent ranking complete",
            top_scores=[m["match_score"] for m in top_matches],
        )

        return top_matches


# Global singleton instance
talent_discovery_agent = TalentDiscoveryAgent()
