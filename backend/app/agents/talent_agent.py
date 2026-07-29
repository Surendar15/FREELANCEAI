"""
AgentVerse — Talent Discovery Agent Module Export
===================================================
Exports TalentDiscoveryAgent and singleton instance.
"""

from app.agents.talent_discovery_agent import TalentDiscoveryAgent, talent_discovery_agent

__all__ = ["TalentDiscoveryAgent", "talent_discovery_agent"]
