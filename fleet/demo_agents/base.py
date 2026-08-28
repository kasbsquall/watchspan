"""Shared machinery for the demo fleet.

Each institutional agent has a profile: how often it asks for approval, how
risky and how complex its actions tend to be. Generation is deterministic
(seeded) so demo runs are reproducible. The ADK agent definition is what gets
cataloged in the Agent Registry and deployed to Agent Runtime in step 5.
"""

from __future__ import annotations

import random
import uuid
from dataclasses import dataclass

from attention.signals import ApprovalRequest


@dataclass(frozen=True)
class AgentProfile:
    agent_id: str
    display_name: str
    description: str
    requests_per_minute: float
    actions: tuple[tuple[str, float, float], ...]  # (action, risk, complexity)


def make_request(
    profile: AgentProfile,
    rng: random.Random,
    now: float,
    batch_id: str | None = None,
) -> ApprovalRequest:
    action, risk, complexity = rng.choice(profile.actions)
    jitter = rng.uniform(-0.05, 0.05)
    return ApprovalRequest(
        request_id=uuid.uuid4().hex[:12],
        agent_id=profile.agent_id,
        action=action,
        risk_score=max(0.0, min(1.0, risk + jitter)),
        complexity=max(0.0, min(1.0, complexity + jitter)),
        batch_id=batch_id,
        created_at=now,
    )


MODEL = "gemini-3.5-flash"


def gemini_model():
    """The model, pinned to the location that actually serves it.

    gemini-3.5-flash is served from `global` on Vertex AI and returns 404 in
    us-central1, which is where the rest of this stack lives. `watchspan/llm.py`
    already handles that for the direct client; ADK reads GOOGLE_CLOUD_LOCATION
    instead, so it has to be told separately or every agent call 404s.
    """
    import os

    from google.adk.models import Gemini

    return Gemini(
        model=MODEL,
        client_kwargs={
            "vertexai": True,
            "project": os.environ.get("GOOGLE_CLOUD_PROJECT"),
            "location": os.environ.get("WATCHSPAN_GEMINI_LOCATION", "global"),
        },
    )


def submit_approval_request(
    agent_id: str, action: str, risk_score: float, complexity: float, description: str
) -> dict:
    """Ask the Watchspan governance layer to approve an action.

    Args:
        agent_id: which institutional agent is asking.
        action: the action in snake_case, for example delete_production_backup_set.
        risk_score: 0 to 1, honestly assessed. Never understate it.
        complexity: 0 to 1, how much reading the reviewer must do.
        description: one plain sentence a reviewer would read.

    Returns:
        The routing decision: escalate, auto_execute or paused_sentinel, with the
        effective threshold and the attention budget that produced it.
    """
    import os
    import time

    from fleet.live import CURRENT_ORCHESTRATOR, next_request_id

    orchestrator = CURRENT_ORCHESTRATOR.get()
    if orchestrator is not None:
        # Driven in-process by /fleet/live: route straight into this session's
        # governance layer rather than back out over HTTP into a different one.
        from attention.signals import ApprovalRequest

        result = orchestrator.route_request(
            ApprovalRequest(
                request_id=next_request_id(),
                agent_id=str(agent_id),
                action=str(action),
                risk_score=max(0.0, min(1.0, float(risk_score))),
                complexity=max(0.0, min(1.0, float(complexity))),
                batch_id=None,
                description=str(description),
                created_at=time.time(),
            )
        )
        return {
            "route": result.route,
            "effective_threshold": result.effective_threshold,
            "team_fraction": result.team_fraction,
            "alerts": [a.pattern for a in result.alerts],
        }

    import requests

    api = os.environ.get("WATCHSPAN_API_URL", "http://localhost:8000")
    response = requests.post(
        f"{api}/requests",
        json={
            "agent_id": agent_id,
            "action": action,
            "risk_score": max(0.0, min(1.0, float(risk_score))),
            "complexity": max(0.0, min(1.0, float(complexity))),
            "description": description,
        },
        timeout=30,
    )
    response.raise_for_status()
    return response.json()


def build_adk_agent(profile: AgentProfile):
    """ADK LlmAgent for this institutional agent.

    THE TOOL IS THE POINT. Without it these agents were instructed to "emit an
    approval request" and given no mechanism to do so, which a reviewer noticed:
    the fleet existed in the deployment topology and could not act at runtime.
    With `submit_approval_request` the agent's own decision to ask for approval
    becomes a real request through the real governance layer.

    The Model Armor callback is attached per agent because ADK does not walk up
    to a parent for `before_model_callback`: setting it only on the coordinator
    left all three sub-agents unscreened.
    """
    from google.adk.agents import LlmAgent

    from fleet.demo_agents.base import gemini_model
    from watchspan.guardrails import model_armor_before_model

    return LlmAgent(
        name=profile.agent_id,
        model=gemini_model(),
        description=profile.description,
        instruction=(
            f"You are {profile.display_name}, an institutional agent. "
            "Before any consequential action, call submit_approval_request with "
            "an honest risk assessment. Never minimize the described risk, and "
            "never describe a dangerous action as routine."
        ),
        tools=[submit_approval_request],
        before_model_callback=model_armor_before_model,
    )
