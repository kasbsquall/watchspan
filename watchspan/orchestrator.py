"""Orchestrator: wires the four governance agents around the request stream.

Flow per incoming request:
  1. Sentinel inspects for fatigue-exploitation patterns; a hit pauses the
     request out of band regardless of policy.
  2. The calibrated policy decides whether the request escalates to a human
     or auto-executes with audit.
Flow per human decision:
  3. Meter charges the budget and updates signal windows.
  4. Drift assesses degradation; Calibrator may raise a policy proposal.
"""

from __future__ import annotations

from dataclasses import dataclass, field

from attention.signals import ApprovalRequest, Decision
from watchspan import drift as drift_mod
from watchspan import llm
from watchspan.calibrator import Calibrator
from watchspan.meter import Meter
from watchspan.policy import PolicyProposal
from watchspan.sentinel import Sentinel, SentinelAlert


@dataclass
class RoutingResult:
    request: ApprovalRequest
    route: str  # "escalate" | "auto_execute" | "paused_sentinel"
    effective_threshold: float
    team_fraction: float
    alerts: list[SentinelAlert] = field(default_factory=list)


@dataclass
class Orchestrator:
    meter: Meter = field(default_factory=Meter)
    sentinel: Sentinel = field(default_factory=Sentinel)
    calibrator: Calibrator = field(default_factory=Calibrator)
    routed: list[RoutingResult] = field(default_factory=list)
    drift_declarations: list[dict] = field(default_factory=list)
    drift_active: bool = False
    audit_log: list[dict] = field(default_factory=list)

    def route_request(self, request: ApprovalRequest) -> RoutingResult:
        team_fraction = self.meter.state.team_budget.team_fraction(request.created_at)
        threshold = self.calibrator.policy.effective_threshold(team_fraction)

        alerts = self.sentinel.inspect(request)
        if alerts:
            route = "paused_sentinel"
        elif self.calibrator.policy.should_escalate(request.risk_score, team_fraction):
            route = "escalate"
        else:
            route = "auto_execute"

        result = RoutingResult(
            request=request,
            route=route,
            effective_threshold=round(threshold, 4),
            team_fraction=round(team_fraction, 4),
            alerts=alerts,
        )
        self.routed.append(result)
        self.audit_log.append(
            {
                "event": "route",
                "request_id": request.request_id,
                "agent_id": request.agent_id,
                "risk_score": request.risk_score,
                "route": route,
                "effective_threshold": result.effective_threshold,
                "team_fraction": result.team_fraction,
                "policy_version": self.calibrator.policy.version,
                "alerts": [a.pattern for a in alerts],
                "at": request.created_at,
            }
        )
        return result

    def record_decision(self, decision: Decision) -> dict:
        meter_out = self.meter.record_decision(decision)
        verdict = drift_mod.assess(self.meter.state.team_window)

        outcome = {
            "meter": meter_out,
            "drift_degraded": verdict.degraded,
            "proposal": None,
        }
        # Declare only on the transition into degradation, not on every
        # decision while it persists.
        if verdict.degraded and not self.drift_active:
            self.drift_active = True
            declaration = {
                "at": decision.decided_at,
                "reason": verdict.reason,
                "evidence": verdict.evidence,
                "narrative": llm.narrate(
                    "In two sentences, plain English, declare that human "
                    f"oversight degraded to rubber-stamping. Evidence: {verdict.evidence}",
                    fallback=verdict.reason,
                ),
            }
            self.drift_declarations.append(declaration)
            self.audit_log.append({"event": "drift_declared", **declaration})
        elif not verdict.degraded:
            self.drift_active = False

        proposal = self.calibrator.evaluate(
            meter_out["team_fraction"], verdict, decision.decided_at
        )
        if proposal is not None:
            outcome["proposal"] = proposal.proposal_id
            self.audit_log.append(
                {
                    "event": "policy_proposed",
                    "proposal_id": proposal.proposal_id,
                    "rationale": proposal.rationale,
                    "at": proposal.created_at,
                }
            )

        self.audit_log.append(
            {
                "event": "decision",
                "request_id": decision.request_id,
                "reviewer_id": decision.reviewer_id,
                "approved": decision.approved,
                "decision_time_s": decision.decision_time_s,
                "review_depth": decision.review_depth,
                "reviewer_fraction_after": meter_out["reviewer_fraction"],
                "at": decision.decided_at,
            }
        )
        return outcome

    def resolve_proposal(self, proposal_id: str, approved: bool) -> dict:
        policy = self.calibrator.resolve(proposal_id, approved)
        self.audit_log.append(
            {
                "event": "policy_resolved",
                "proposal_id": proposal_id,
                "approved": approved,
                "active_version": policy.version,
                "base_threshold": policy.base_threshold,
            }
        )
        return {"active_version": policy.version, "base_threshold": policy.base_threshold}

    def pending_proposal(self) -> PolicyProposal | None:
        return self.calibrator.pending
