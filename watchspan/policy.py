"""The approval policy: what deserves to reach a human.

The naive policy escalates everything above a fixed risk threshold. Watchspan's
calibrated policy moves that threshold with the remaining attention budget:
low budget raises the bar, so fewer requests escalate and each one lands on a
reviewer who still has attention to give.
"""

from __future__ import annotations

from dataclasses import dataclass


@dataclass
class ApprovalPolicy:
    """Escalate when risk_score >= effective_threshold(budget_fraction)."""

    base_threshold: float = 0.3
    # How much the threshold rises as the budget empties. 0 = fixed policy.
    budget_sensitivity: float = 0.4
    version: int = 1

    def effective_threshold(self, budget_fraction: float) -> float:
        depletion = 1.0 - max(0.0, min(1.0, budget_fraction))
        return min(0.95, self.base_threshold + self.budget_sensitivity * depletion)

    def should_escalate(self, risk_score: float, budget_fraction: float) -> bool:
        return risk_score >= self.effective_threshold(budget_fraction)


@dataclass(frozen=True)
class PolicyProposal:
    """A calibrator proposal. Policy changes are rare and consequential, so
    they always wait for real human approval."""

    proposal_id: str
    current: ApprovalPolicy
    proposed: ApprovalPolicy
    rationale: str
    created_at: float
