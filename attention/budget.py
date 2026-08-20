"""The attention budget: a shared, finite, replenishing pool per reviewer.

Core thesis: every approval request that reaches a human spends capacity.
Cost grows with complexity; capacity replenishes slowly with rest. When the
pool is low, additional escalations are reviewed with whatever attention is
left, which is how dangerous actions slip through.
"""

from __future__ import annotations

from dataclasses import dataclass, field

# Capacity units. One unit is roughly one careful review of a trivial action.
DEFAULT_CAPACITY = 40.0
# Units recovered per minute without incoming decisions.
REPLENISH_PER_MIN = 0.5
# Cost multiplier range by complexity: trivial costs BASE, dense costs BASE * (1 + SPAN).
BASE_COST = 1.0
COMPLEXITY_SPAN = 2.0


@dataclass
class ReviewerBudget:
    reviewer_id: str
    capacity: float = DEFAULT_CAPACITY
    remaining: float = DEFAULT_CAPACITY
    last_update: float | None = None  # unix seconds

    def replenish(self, now: float) -> None:
        if self.last_update is None:
            self.last_update = now
            return
        minutes = max(0.0, (now - self.last_update) / 60.0)
        self.remaining = min(self.capacity, self.remaining + minutes * REPLENISH_PER_MIN)
        self.last_update = now

    def spend(self, complexity: float, now: float) -> float:
        """Charge one review. Returns the cost. Remaining never goes below zero."""
        self.replenish(now)
        cost = BASE_COST * (1.0 + COMPLEXITY_SPAN * max(0.0, min(1.0, complexity)))
        self.remaining = max(0.0, self.remaining - cost)
        return cost

    @property
    def fraction(self) -> float:
        return self.remaining / self.capacity if self.capacity else 0.0


@dataclass
class TeamBudget:
    """Shared ledger. Two workflows escalating to the same team consume the
    same pool, whether they know about each other or not."""

    reviewers: dict[str, ReviewerBudget] = field(default_factory=dict)

    def get(self, reviewer_id: str) -> ReviewerBudget:
        if reviewer_id not in self.reviewers:
            self.reviewers[reviewer_id] = ReviewerBudget(reviewer_id=reviewer_id)
        return self.reviewers[reviewer_id]

    def team_fraction(self, now: float) -> float:
        if not self.reviewers:
            return 1.0
        for budget in self.reviewers.values():
            budget.replenish(now)
        total_capacity = sum(b.capacity for b in self.reviewers.values())
        total_remaining = sum(b.remaining for b in self.reviewers.values())
        return total_remaining / total_capacity if total_capacity else 0.0
