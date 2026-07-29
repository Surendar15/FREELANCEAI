# app/agents/__init__.py
"""
AgentVerse — AI Agents Registry
==================================
All agents are registered here for easy discovery.
Import from this module in services.

Phase 1 (Active):
    - RequirementIntelligenceAgent

Phase 2-7 (Placeholder):
    - TalentDiscoveryAgent
    - ProposalIntelligenceAgent
    - BudgetIntelligenceAgent
    - ProjectPlanningAgent
    - ProgressMonitoringAgent
    - QualityAssuranceAgent
"""

from app.agents.requirement_agent import RequirementIntelligenceAgent, requirement_agent
from app.agents.talent_agent import TalentDiscoveryAgent
from app.agents.proposal_agent import ProposalIntelligenceAgent
from app.agents.budget_agent import BudgetIntelligenceAgent
from app.agents.planning_agent import ProjectPlanningAgent
from app.agents.progress_agent import ProgressMonitoringAgent
from app.agents.quality_agent import QualityAssuranceAgent

__all__ = [
    # Active Agents
    "RequirementIntelligenceAgent",
    "requirement_agent",
    # Placeholder Agents
    "TalentDiscoveryAgent",
    "ProposalIntelligenceAgent",
    "BudgetIntelligenceAgent",
    "ProjectPlanningAgent",
    "ProgressMonitoringAgent",
    "QualityAssuranceAgent",
]
