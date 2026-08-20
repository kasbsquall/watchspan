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


def build_adk_agent(profile: AgentProfile):
    """ADK LlmAgent for this institutional agent (used in step 5 for Agent
    Registry cataloging and Agent Runtime deployment)."""
    from google.adk.agents import LlmAgent

    return LlmAgent(
        name=profile.agent_id,
        model="gemini-3.5-flash",
        description=profile.description,
        instruction=(
            f"You are {profile.display_name}, an institutional agent. "
            "Before any consequential action, emit an approval request with an "
            "honest risk assessment. Never minimize the described risk."
        ),
    )
