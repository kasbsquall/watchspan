"""CALIBRATOR: the policy recalibrator.

Crosses real risk with available attention. When the budget drops or Drift
declares degradation, it proposes raising the escalation bar: fewer requests
reach the human, each one better attended. Proposals wait for real human
approval, because policy changes are rare and consequential.
"""

from __future__ import annotations

import uuid
from dataclasses import dataclass, field

from watchspan.drift import DriftVerdict
from watchspan.policy import ApprovalPolicy, PolicyProposal

# Below this team budget fraction the calibrator starts proposing changes.
LOW_BUDGET_FRACTION = 0.35
# Step applied to base_threshold per proposal.
THRESHOLD_STEP = 0.15
MAX_BASE_THRESHOLD = 0.7


@dataclass
class Calibrator:
    policy: ApprovalPolicy = field(default_factory=ApprovalPolicy)
    pending: PolicyProposal | None = None
    history: list[PolicyProposal] = field(default_factory=list)

    def evaluate(
        self, team_fraction: float, drift: DriftVerdict, now: float
    ) -> PolicyProposal | None:
        """Return a new proposal if conditions warrant one, else None."""
        if self.pending is not None:
            return None
        low_budget = team_fraction <= LOW_BUDGET_FRACTION
        if not (low_budget or drift.degraded):
            return None
        if self.policy.base_threshold >= MAX_BASE_THRESHOLD:
            return None

        proposed = ApprovalPolicy(
            base_threshold=min(
                MAX_BASE_THRESHOLD, self.policy.base_threshold + THRESHOLD_STEP
            ),
            budget_sensitivity=self.policy.budget_sensitivity,
            version=self.policy.version + 1,
        )
        triggers = []
        if low_budget:
            triggers.append(
                f"team attention budget at {team_fraction:.0%}, below the "
                f"{LOW_BUDGET_FRACTION:.0%} floor"
            )
        if drift.degraded:
            triggers.append(f"drift detector: {drift.reason}")
        self.pending = PolicyProposal(
            proposal_id=uuid.uuid4().hex[:12],
            current=self.policy,
            proposed=proposed,
            rationale=(
                "Raise the escalation threshold from "
                f"{self.policy.base_threshold:.2f} to {proposed.base_threshold:.2f} "
                "so remaining attention concentrates on higher-risk actions. "
                "Triggered by: " + "; ".join(triggers)
            ),
            created_at=now,
        )
        return self.pending

    def resolve(self, proposal_id: str, approved: bool) -> ApprovalPolicy:
        """Apply or discard the pending proposal after human review."""
        if self.pending is None or self.pending.proposal_id != proposal_id:
            raise ValueError(f"no pending proposal with id {proposal_id}")
        if approved:
            self.policy = self.pending.proposed
        self.history.append(self.pending)
        self.pending = None
        return self.policy
