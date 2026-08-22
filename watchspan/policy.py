"""The approval policy: what deserves to reach a human.

The naive policy escalates everything above a fixed risk threshold. Watchspan's
calibrated policy moves that threshold with the remaining attention budget:
low budget raises the bar, so fewer requests escalate and each one lands on a
reviewer who still has attention to give.

That trade has a floor. Raising the bar to protect attention must never buy the
saving by letting a genuinely dangerous action run unseen, so risk above
ALWAYS_ESCALATE_ABOVE reaches a human whatever the budget says. Without it the
calibrated threshold climbs to 0.85 on an empty budget and actions between 0.70
and 0.85 auto-execute, which is the opposite of what the calibration is for.
"""

from __future__ import annotations

from dataclasses import dataclass

# No amount of reviewer fatigue justifies auto-running an action this risky.
ALWAYS_ESCALATE_ABOVE = 0.7


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
        if risk_score >= ALWAYS_ESCALATE_ABOVE:
            return True
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
