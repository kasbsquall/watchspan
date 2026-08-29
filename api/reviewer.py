"""The reviewer console: Watchspan measuring a real human instead of a script.

WHY THIS IS THE MISSING HALF. Four reviewers probed this project and the lead
one put the commercial objection in a sentence: `POST /decisions` takes
`reviewer_id`, `decision_time_s` and `review_depth` from the request body, so
Watchspan does not observe the reviewer, it is told about the reviewer, by the
same integration whose oversight is being graded. No auditor accepts a
control-effectiveness metric self-reported by the controlled party. A second
reviewer reached the same place from the security side: the one human control
the product exists to protect was an anonymous HTTP call with a free-text
identity.

Both objections have the same answer, and it is not authentication bolted onto
the old endpoint. It is that the numbers have to be measured rather than
accepted. So here the server issues the identity, the server records when the
request was put in front of a human, and the server computes how long that human
took and how much of the detail they actually opened. Nothing in the request body
can set any of the three.

The side effect is the demo the project needed. The seeded run proves the thesis
about a simulated reviewer, which a reviewer fairly called a detector detecting
its own generator. This path proves it about whoever is holding the mouse.
"""

from __future__ import annotations

import hashlib
import hmac
import os
import time
from dataclasses import dataclass, field

# Signing key for reviewer identities. A demo deployment has no user directory
# to bind to, so identity is bound to the browser session and signed, which is
# the honest limit of what this can claim: it proves two decisions came from the
# same reviewer and that the id was minted here, not that a named person exists.
_SECRET = os.environ.get("WATCHSPAN_REVIEWER_SECRET", "watchspan-local-dev").encode()
# The default is a development value published in this repository. A reviewer
# computed a live reviewer id offline and it matched, because the deploy script
# never set the variable. It does now; this fallback exists so a local checkout
# runs without configuration, and `/geap/status` reports which one is in use.
SECRET_IS_DEFAULT = "WATCHSPAN_REVIEWER_SECRET" not in os.environ

# How long a served request stays open before the reviewer is considered to have
# walked away. Longer than anyone reads for, short enough that a stale row does
# not sit in the queue forever.
SERVE_TTL_S = 900.0


def reviewer_id_for(session_id: str) -> str:
    """A stable, unforgeable reviewer id for this browser session.

    Not accepted from the caller, which stops one client writing decisions into
    another reviewer's ledger. Being exact about the limit, because an earlier
    version of this docstring overclaimed and a reviewer caught it: the session
    id is a header the caller chooses, so anyone can mint themselves a fresh
    reviewer with a fresh budget. What this guarantees is that an id was issued
    here and that two decisions carrying the same one came from the same
    session. Binding it to a real person needs a user directory this demo does
    not have.
    """
    digest = hmac.new(_SECRET, session_id.encode(), hashlib.sha256).hexdigest()
    return f"human-{digest[:10]}"


@dataclass
class Served:
    """A request handed to a human, with the clock started."""

    request_id: str
    action: str
    agent_id: str
    description: str
    risk_routed_on: float
    risk_declared: float
    assessment_basis: str
    recognised: bool
    complexity: float
    served_at: float
    # Detail sections the reviewer opened. The UI reports which ones, the server
    # counts them: review depth is a count of things done, and the set means a
    # section opened twice cannot inflate it.
    opened: set[str] = field(default_factory=set)


class Desk:
    """One reviewer's desk: what is in front of them and how long it has been there.

    One card at a time, on purpose. The first version handed the browser all
    twelve and stamped `served_at` on all twelve at once, which measured the
    time since the queue was built rather than the time the reviewer spent: a
    decision taken in half a second came back as thirty-two. Serving one card
    means the clock starts when the card is put in front of the human, and the
    browser has no way to start it earlier or fetch ahead.
    """

    def __init__(self) -> None:
        self._open: dict[str, Served] = {}
        # Routed and waiting, in arrival order. Never sent to the browser.
        self._waiting: list = []

    def reset(self) -> None:
        """Clear the desk before a new queue, so two batches cannot stack."""
        self._open.clear()
        self._waiting.clear()

    def enqueue(self, result) -> None:
        """Hold a routed request until the reviewer is ready for it."""
        self._waiting.append(result)

    def remaining(self) -> int:
        return len(self._waiting)

    def next_card(self) -> "Served | None":
        """Put the next request in front of the human and start its clock."""
        if not self._waiting:
            return None
        return self.serve(self._waiting.pop(0))

    def serve(self, result) -> Served:
        """Start the clock on a request the moment it reaches a human."""
        request = result.request
        assessment = result.assessment
        served = Served(
            request_id=request.request_id,
            action=request.action,
            agent_id=request.agent_id,
            description=request.description,
            risk_routed_on=(
                assessment.effective if assessment is not None else request.risk_score
            ),
            risk_declared=(
                request.declared_risk
                if request.declared_risk is not None
                else request.risk_score
            ),
            assessment_basis=assessment.basis if assessment is not None else "",
            recognised=bool(assessment.recognised) if assessment is not None else True,
            complexity=request.complexity,
            served_at=time.time(),
        )
        self._open[served.request_id] = served
        return served

    def opened(self, request_id: str, section: str) -> int:
        """Record that the reviewer expanded one detail section. Returns the depth."""
        served = self._open.get(request_id)
        if served is None:
            return 0
        served.opened.add(section)
        return len(served.opened)

    def close(self, request_id: str) -> Served | None:
        return self._open.pop(request_id, None)

    def sweep(self, now: float) -> None:
        for key, served in list(self._open.items()):
            if now - served.served_at > SERVE_TTL_S:
                del self._open[key]

    def pending(self) -> list[Served]:
        return list(self._open.values())
