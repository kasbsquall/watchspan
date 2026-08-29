"""Attention signals: the observable facts about human review behavior.

Every model in Watchspan is built from these three primitives:
time per decision, approval rate, and review depth.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from statistics import median


@dataclass(frozen=True)
class ApprovalRequest:
    """A request from a fleet agent that may reach a human reviewer."""

    request_id: str
    agent_id: str
    action: str
    risk_score: float  # 0.0 (harmless) .. 1.0 (critical)
    complexity: float  # 0.0 (trivial to review) .. 1.0 (dense)
    batch_id: str | None = None
    description: str = ""
    created_at: float = 0.0  # unix seconds
    # What the caller declared before a peer review raised it. `risk_score` is
    # the number the request is routed on, so once a peer's higher score wins,
    # `risk_score` is no longer the declaration and a response that labels it
    # "declared by agent" is lying about its own column. None when nothing
    # revised it, in which case the declaration is `risk_score`.
    declared_risk: float | None = None


@dataclass(frozen=True)
class Decision:
    """What the human actually did with a request."""

    request_id: str
    reviewer_id: str
    approved: bool
    decision_time_s: float
    review_depth: int  # detail views opened before deciding (0 = blind stamp)
    decided_at: float  # unix seconds
    complexity: float  # copied from the request for windowed analysis


@dataclass
class SignalWindow:
    """Rolling window of decisions for one reviewer or one team."""

    decisions: list[Decision] = field(default_factory=list)
    max_size: int = 50

    def add(self, decision: Decision) -> None:
        self.decisions.append(decision)
        if len(self.decisions) > self.max_size:
            self.decisions.pop(0)

    def median_decision_time(self) -> float | None:
        if not self.decisions:
            return None
        return median(d.decision_time_s for d in self.decisions)

    def median_complexity(self) -> float | None:
        if not self.decisions:
            return None
        return median(d.complexity for d in self.decisions)

    def approval_rate(self) -> float | None:
        if not self.decisions:
            return None
        return sum(1 for d in self.decisions if d.approved) / len(self.decisions)

    def mean_review_depth(self) -> float | None:
        if not self.decisions:
            return None
        return sum(d.review_depth for d in self.decisions) / len(self.decisions)

    def split_halves(self) -> tuple["SignalWindow", "SignalWindow"]:
        """Older half vs newer half, for trend comparison."""
        mid = len(self.decisions) // 2
        older = SignalWindow(decisions=list(self.decisions[:mid]))
        newer = SignalWindow(decisions=list(self.decisions[mid:]))
        return older, newer
