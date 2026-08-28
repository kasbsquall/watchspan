"""One orchestrator per browser, not one per process.

THE FAILURE THIS PREVENTS, confirmed against the deployed service before it was
written. `api/main.py` held a single module-level `Orchestrator`, and `/simulate`
defaults to `reset=True`, so every run replaced the state of everyone else on the
site. Judges evaluate in parallel and the README tells them to run the fleet and
then approve the recalibration, which means the second judge's run deleted the
first judge's pending proposal and their approve click returned HTTP 404 on the
single control the entire product exists to protect.

Sessions live in process and evaporate when Cloud Run scales to zero. That is
the right trade for this: nothing here outlives one page visit, and the
alternative is standing up a database for state with a one-visit lifetime. The
cap exists so a crawler cannot grow the map without bound.
"""

from __future__ import annotations

import time
import uuid
from collections import OrderedDict

from watchspan.orchestrator import Orchestrator

TTL_S = 3600
CAP = 64

_sessions: "OrderedDict[str, tuple[float, Orchestrator]]" = OrderedDict()


def _evict(now: float) -> None:
    for key in [k for k, (seen, _) in _sessions.items() if now - seen > TTL_S]:
        _sessions.pop(key, None)
    while len(_sessions) > CAP:
        _sessions.popitem(last=False)


def resolve(session_id: str | None) -> tuple[str, Orchestrator]:
    """The orchestrator for this session id, creating one if it is new."""
    now = time.time()
    _evict(now)
    sid = session_id or uuid.uuid4().hex
    existing = _sessions.get(sid)
    orch = existing[1] if existing else Orchestrator()
    _sessions[sid] = (now, orch)
    _sessions.move_to_end(sid)
    return sid, orch


def replace(session_id: str) -> Orchestrator:
    """Start this session over. Only this session."""
    orch = Orchestrator()
    _sessions[session_id] = (time.time(), orch)
    _sessions.move_to_end(session_id)
    return orch


def count() -> int:
    return len(_sessions)
