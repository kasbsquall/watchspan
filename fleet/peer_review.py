"""Agents reviewing each other, with consequence.

WHY. Two platform reviewers scored the same weakness: the track asks for agents
that work together, and this fleet's three institutional agents each took a task
and acted alone. The coordinator delegated, which is routing, and routing is not
collaboration. Nothing in the system had one agent look at another's work.

Watchspan's whole argument is that one overloaded reviewer stops reading and
starts stamping. The fleet had the same defect one level down: an agent scored
its own risk and nobody checked it. `watchspan/risk.py` closed that from the
outside, deterministically. This closes it from the inside, agentically: before
a consequential action is submitted, a different agent in the fleet reads it and
gives its own number.

The review has to cost something or it is theatre, so the peer's score is
binding in one direction. It can raise the risk and it cannot lower it. An agent
cannot talk its way past the gate by finding a lenient colleague, and a peer who
sees something the proposer did not gets that concern onto the record and into
the routing decision.

Peer selection is round-robin over whatever the Agent Registry returned, so the
reviewer is never the proposer and never a fixed judge.
"""

from __future__ import annotations

import contextvars
import json
import re

# Written by request_peer_review, read by submit_approval_request in the same
# turn. Per run, not per process: this was a module global that `run_live`
# cleared at the start of every call, so two judges hitting /fleet/live at once
# wiped each other's reviews. Session isolation was built carefully for the
# orchestrator and skipped here.
_REVIEWS: contextvars.ContextVar = contextvars.ContextVar(
    "watchspan_peer_reviews", default=None
)
# Fallback for direct use outside a run, and what the tests address.
REVIEWS: dict[str, dict] = {}


def reviews() -> dict:
    """This run's reviews, or the process-wide fallback outside one."""
    current = _REVIEWS.get()
    return REVIEWS if current is None else current


def begin_run() -> object:
    """Give this run its own review store. Returns a token for `end_run`."""
    return _REVIEWS.set({})


def end_run(token) -> None:
    _REVIEWS.reset(token)


def find_review(agent_id: str, action: str, store: dict | None = None) -> dict | None:
    """This agent's review of this action, tolerating the model renaming it.

    Reviews were looked up by an exact `agent:action` key, which required the
    model to emit a byte-identical action string across two separate tool calls.
    It does not. A reviewer watched a peer raise a table drop and the raise get
    discarded with no error, because the agent called it one thing when asking
    for review and another when submitting. The ratchet silently no-opped and
    the response still carried `raised_the_risk: true`, which reads as a
    fabrication rather than as the bug it was.

    Exact match first, then the best token overlap among this agent's reviews,
    on the same half-overlap rule the risk assessor uses for the same reason.
    """
    store = reviews() if store is None else store
    exact = store.get(review_key(agent_id, action))
    if exact is not None:
        return exact

    want = _tokens(action)
    if not want:
        return None
    best, best_score = None, 0.0
    prefix = f"{agent_id}:"
    for key, review in store.items():
        if not key.startswith(prefix):
            continue
        have = _tokens(key[len(prefix):])
        overlap = len(want & have) / len(want | have) if (want | have) else 0.0
        if overlap > best_score:
            best, best_score = review, overlap
    return best if best_score >= 0.5 else None

REVIEW_INSTRUCTION = (
    "You are reviewing another agent's proposed action before it reaches the "
    "human approval queue. You did not propose it and you do not benefit from "
    "it being approved. Judge what the action would actually do: whether it is "
    "reversible, whether it touches production, whether it moves money or hands "
    "out access, and whether the proposer's own risk score reads as honest.\n"
    "Reply with JSON only, no prose around it:\n"
    '{"risk": <0.0 to 1.0>, "verdict": "endorse" or "object", "concern": "<one short sentence>"}'
)


def _tokens(text: str) -> set[str]:
    return {t for t in re.split(r"[^a-z0-9]+", text.lower()) if t}


def review_key(agent_id: str, action: str) -> str:
    return f"{agent_id}:{action}"


def _pick_peer(proposing_agent: str):
    """The next agent in Registry order that is not the one proposing."""
    from fleet.discovery import discover

    profiles = list(discover().profiles)
    others = [p for p in profiles if p.agent_id != proposing_agent]
    if not others:
        return None
    # Round-robin by action-independent position, so the reviewer rotates with
    # the proposer instead of one agent becoming the fleet's permanent judge.
    ids = [p.agent_id for p in profiles]
    start = ids.index(proposing_agent) if proposing_agent in ids else -1
    ordered = [profiles[(start + 1 + i) % len(profiles)] for i in range(len(profiles))]
    return next(p for p in ordered if p.agent_id != proposing_agent)


def _parse(text: str) -> dict:
    """Lenient JSON read: models fence their output and add a sentence."""
    match = re.search(r"\{.*\}", text, re.S)
    if not match:
        return {}
    try:
        return json.loads(match.group(0))
    except json.JSONDecodeError:
        return {}


async def request_peer_review(
    proposing_agent: str, action: str, description: str, proposed_risk: float
) -> dict:
    """Have another agent in the fleet independently assess this action.

    Call this before submit_approval_request for anything that deletes, moves
    money, changes access, or touches production.

    Args:
        proposing_agent: your own agent id.
        action: the action you intend to submit, in snake_case.
        description: one plain sentence describing what it would do.
        proposed_risk: the risk score you were going to submit, 0 to 1.

    Returns:
        The peer's own risk score, its verdict, and its concern. A peer score
        higher than yours becomes the score that is submitted.
    """
    from google.adk.agents import LlmAgent
    from google.adk.runners import InMemoryRunner
    from google.genai import types

    from fleet.demo_agents.base import gemini_model
    from watchspan.guardrails import model_armor_before_model

    peer = _pick_peer(str(proposing_agent))
    if peer is None:
        return {"reviewed": False, "reason": "no peer agent available"}

    reviewer = LlmAgent(
        name=f"{peer.agent_id}_as_reviewer",
        model=gemini_model(),
        description=f"{peer.display_name} reviewing a peer's proposed action.",
        instruction=f"You are {peer.display_name}. {REVIEW_INSTRUCTION}",
        # Screened like every other agent in the fleet. Without this, the one
        # Gemini call in the system that reads an action description written by
        # another agent was the only one Model Armor never saw, and a reviewer
        # found it by grepping for the callback. ADK does not inherit
        # before_model_callback from a parent, and this agent has no parent.
        before_model_callback=model_armor_before_model,
    )
    runner = InMemoryRunner(agent=reviewer, app_name="watchspan-peer-review")
    session = await runner.session_service.create_session(
        app_name="watchspan-peer-review", user_id="peer"
    )
    prompt = (
        f"Proposing agent: {proposing_agent}\n"
        f"Action: {action}\n"
        f"Description: {description}\n"
        f"Risk the proposer gave it: {float(proposed_risk):.2f}"
    )
    said = ""
    async for event in runner.run_async(
        user_id="peer",
        session_id=session.id,
        new_message=types.Content(role="user", parts=[types.Part(text=prompt)]),
    ):
        for part in (event.content.parts if event.content else []) or []:
            if getattr(part, "text", None):
                said += part.text

    parsed = _parse(said)
    try:
        peer_risk = max(0.0, min(1.0, float(parsed.get("risk", 0.0))))
    except (TypeError, ValueError):
        peer_risk = 0.0
    verdict = "object" if str(parsed.get("verdict", "")).lower() == "object" else "endorse"
    concern = str(parsed.get("concern", ""))[:240]

    result = {
        "reviewed": True,
        "peer_agent": peer.agent_id,
        "peer_display_name": peer.display_name,
        "peer_risk": round(peer_risk, 3),
        "verdict": verdict,
        "concern": concern,
        "raised_the_risk": peer_risk > float(proposed_risk) + 0.05,
    }
    reviews()[review_key(str(proposing_agent), str(action))] = result
    return result
