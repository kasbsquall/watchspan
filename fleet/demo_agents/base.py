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
        description=ACTION_DESCRIPTIONS.get(action, ""),
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
    from fleet.peer_review import find_review

    risk_score = max(0.0, min(1.0, float(risk_score)))
    declared_risk = risk_score

    # A peer that read this action and scored it higher wins. The review is
    # binding upwards only: a colleague cannot be talked into lowering the
    # number, which is what makes asking for one worth anything.
    peer = find_review(str(agent_id), str(action))
    if peer and peer.get("peer_risk", 0.0) > risk_score:
        risk_score = float(peer["peer_risk"])
        description = f"{description} [peer {peer['peer_agent']}: {peer.get('concern','')}]".strip()

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
                risk_score=risk_score,
                complexity=max(0.0, min(1.0, float(complexity))),
                batch_id=None,
                declared_risk=declared_risk,
                description=str(description),
                created_at=time.time(),
            )
        )
        return {
            "route": result.route,
            "effective_threshold": result.effective_threshold,
            "team_fraction": result.team_fraction,
            "alerts": [a.pattern for a in result.alerts],
            "risk_declared": declared_risk,
            "risk_submitted": risk_score,
            "peer_review": peer,
        }

    import requests

    api = os.environ.get("WATCHSPAN_API_URL", "http://localhost:8000")
    response = requests.post(
        f"{api}/requests",
        json={
            "agent_id": agent_id,
            "action": action,
            "risk_score": risk_score,
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
    from fleet.peer_review import request_peer_review
    from watchspan.guardrails import model_armor_before_model

    return LlmAgent(
        name=profile.agent_id,
        model=gemini_model(),
        description=profile.description,
        instruction=(
            f"You are {profile.display_name}, an institutional agent. "
            "Before any consequential action, call submit_approval_request with "
            "an honest risk assessment. Never minimize the described risk, and "
            "never describe a dangerous action as routine. "
            "If the action deletes something, moves money, changes access, or "
            "touches production, call request_peer_review FIRST and pass the "
            "peer's concern along. A peer who scores it higher than you is the "
            "score that gets submitted."
        ),
        tools=[submit_approval_request, request_peer_review],
        before_model_callback=model_armor_before_model,
    )


# What each catalogued action would actually do, in the one sentence a reviewer
# reads before deciding. The reviewer console served cards with an empty
# description: the screen built to measure whether a human read the request was
# giving them nothing to read, which a reviewer noticed and which makes the
# measurement meaningless as well as unfair.
ACTION_DESCRIPTIONS: dict[str, str] = {
    # procurement
    "create_purchase_order_under_500": (
        "Raise a purchase order for 480 USD with an existing, already-approved "
        "supplier. Within the standing delegation of authority."
    ),
    "renew_existing_vendor_contract": (
        "Renew a support contract for another twelve months on the same terms "
        "and the same annual value as the expiring one."
    ),
    "update_vendor_contact_details": (
        "Change the named contact and phone number on a supplier record. "
        "Payment details are not touched."
    ),
    "change_vendor_bank_account": (
        "Change the bank account that this supplier's invoices are paid into, "
        "on the strength of an emailed request. Every future payment to them "
        "goes to the new account, and reversing a payment already sent is not "
        "usually possible."
    ),
    "approve_payment_terms_extension": (
        "Extend this supplier's payment terms from 30 to 60 days. Cash timing "
        "changes; nothing about where the money goes does."
    ),
    # data ops
    "retry_failed_pipeline_run": (
        "Re-run a nightly pipeline job that failed on a transient error. Same "
        "inputs, same outputs, safe to repeat."
    ),
    "run_backfill_last_7_days": (
        "Recompute the last seven days of the reporting table from source "
        "events. Read-heavy, and it overwrites derived rows only."
    ),
    "apply_schema_patch_additive": (
        "Add two nullable columns to an analytics table. Existing rows and "
        "queries are unaffected."
    ),
    "clear_staging_table": (
        "Empty a staging table between pipeline runs. Staging holds no "
        "customer data and is rebuilt on the next run."
    ),
    "drop_deprecated_table": (
        "Drop a table marked deprecated three releases ago. Nothing in the "
        "current codebase reads it, and there is no undo once it is gone."
    ),
    "delete_production_backup_set": (
        "Delete a quarterly backup set from production storage to reclaim "
        "space. If a restore is needed for that quarter afterwards, there is "
        "nothing to restore from."
    ),
    # comms
    "send_internal_status_update": (
        "Post the weekly pipeline status to an internal channel. Staff only."
    ),
    "post_scheduled_social_update": (
        "Publish a scheduled product post to the company's social accounts at "
        "the planned time."
    ),
    "reply_to_customer_ticket": (
        "Send a reply on an open support ticket to the customer who raised it."
    ),
    "send_bulk_customer_email": (
        "Send one message to the full customer list. It cannot be recalled "
        "once it has left, and the list is not segmented."
    ),
    "publish_incident_statement": (
        "Publish a public statement about an ongoing incident, on the company "
        "blog and status page. It will be quoted, and a correction later does "
        "not replace the first version people read."
    ),
}


def describe(action: str) -> str:
    """The reviewer-facing sentence for an action, empty when uncatalogued."""
    return ACTION_DESCRIPTIONS.get(action, "")
