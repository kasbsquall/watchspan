"""METER: the attention meter.

Consumes the stream of human decisions, charges the shared budget, and keeps
the rolling signal windows that Drift and Calibrator read.
"""

from __future__ import annotations

from dataclasses import dataclass, field

from attention.budget import TeamBudget
from attention.signals import Decision, SignalWindow


@dataclass
class MeterState:
    team_budget: TeamBudget = field(default_factory=TeamBudget)
    reviewer_windows: dict[str, SignalWindow] = field(default_factory=dict)
    team_window: SignalWindow = field(default_factory=lambda: SignalWindow(max_size=100))
    total_decisions: int = 0


class Meter:
    def __init__(self) -> None:
        self.state = MeterState()

    def record_decision(self, decision: Decision) -> dict:
        """Ingest one human decision: charge the budget, update windows."""
        budget = self.state.team_budget.get(decision.reviewer_id)
        cost = budget.spend(decision.complexity, decision.decided_at)

        window = self.state.reviewer_windows.setdefault(
            decision.reviewer_id, SignalWindow()
        )
        window.add(decision)
        self.state.team_window.add(decision)
        self.state.total_decisions += 1

        return {
            "reviewer_id": decision.reviewer_id,
            "cost": round(cost, 3),
            "reviewer_remaining": round(budget.remaining, 3),
            "reviewer_fraction": round(budget.fraction, 4),
            "team_fraction": round(
                self.state.team_budget.team_fraction(decision.decided_at), 4
            ),
        }

    def snapshot(self, now: float) -> dict:
        """Current budget picture for the dashboard and the other agents."""
        return {
            "team_fraction": round(self.state.team_budget.team_fraction(now), 4),
            "reviewers": {
                rid: {
                    "remaining": round(b.remaining, 3),
                    "capacity": b.capacity,
                    "fraction": round(b.fraction, 4),
                }
                for rid, b in self.state.team_budget.reviewers.items()
            },
            "total_decisions": self.state.total_decisions,
            "approval_rate": self.state.team_window.approval_rate(),
            "median_decision_time_s": self.state.team_window.median_decision_time(),
            "mean_review_depth": self.state.team_window.mean_review_depth(),
        }
