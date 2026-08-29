"""Agent Runtime entrypoint: the governed fleet as an ADK app.

`adk deploy agent_engine fleet/agent_app.py` wraps this in
reasoning_engines.AdkApp and deploys it to GEAP Agent Runtime, where
sessions persist via VertexAiSessionService, memory via Memory Bank, and
OpenTelemetry tracing is enabled by default. Agent Identity is attached via
the identity config alongside this module at deploy time.
"""

from __future__ import annotations

from google.adk.agents import LlmAgent

from fleet.demo_agents.base import build_adk_agent, gemini_model
from fleet.discovery import discover
from watchspan.guardrails import model_armor_before_model

# The fleet is whatever the Agent Registry says exists and this host can run.
# It used to be a hardcoded tuple, which meant the Registry catalogued seven
# agents and nothing in the running system ever read it back.
FLEET = discover()
fleet_agents = [build_adk_agent(profile) for profile in FLEET.profiles]

root_agent = LlmAgent(
    name="watchspan_fleet_coordinator",
    model=gemini_model(),
    description=(
        "Coordinates the Watchspan demo fleet. Routes work to the "
        "institutional agents and emits approval requests to the Watchspan "
        "governance layer."
    ),
    instruction=(
        "You coordinate the institutional agents discovered in the Agent "
        "Registry. For any consequential action, emit an approval request with "
        "an honest risk score between 0 and 1. Never batch a high-risk "
        "action with routine ones, and never describe an action as routine "
        "to speed up its approval. Anything that deletes, moves money, changes "
        "access or touches production goes to a peer agent for review before "
        "it is submitted."
    ),
    sub_agents=fleet_agents,
    before_model_callback=model_armor_before_model,
)
