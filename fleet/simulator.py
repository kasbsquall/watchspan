"""Deterministic fleet simulator: reproduces the degradation story.

The fleet generates requests; a simulated reviewer behaves the way real
reviewers do under load: as their attention budget drains, time per decision
collapses, review depth drops, and approvals become automatic. Midway through
the run, an attacker hides a dangerous action inside a benign batch (the
ATR-2026-00118 scenario). With Watchspan calibrating, that action lands on a
reviewer who still has attention; without it, it gets stamped.
"""

from __future__ import annotations

import random
import time
from dataclasses import dataclass, field

from attention.signals import ApprovalRequest, Decision
from fleet.demo_agents import comms_agent, data_ops_agent, procurement_agent
from fleet.demo_agents.base import make_request
from watchspan.orchestrator import Orchestrator

PROFILES = (procurement_agent.PROFILE, data_ops_agent.PROFILE, comms_agent.PROFILE)

# Simulated reviewer behavior by remaining budget fraction:
# (min_fraction, decision_time_s, review_depth, p_approve)
REVIEWER_STAGES = (
    (0.6, 22.0, 3, 0.82),   # fresh: reads carefully
    (0.35, 9.0, 1, 0.93),   # tired: skims
    (0.0, 2.5, 0, 0.99),    # depleted: stamps
)


def reviewer_behavior(fraction: float) -> tuple[float, int, float]:
    for min_fraction, time_s, depth, p_approve in REVIEWER_STAGES:
        if fraction >= min_fraction:
            return time_s, depth, p_approve
    return REVIEWER_STAGES[-1][1:]


@dataclass
class SimulationResult:
    routed_total: int = 0
    escalated: int = 0
    auto_executed: int = 0
    paused_by_sentinel: int = 0
    dangerous_stamped: list[str] = field(default_factory=list)
    dangerous_caught: list[str] = field(default_factory=list)
    drift_declared_at: float | None = None
    timeline: list[dict] = field(default_factory=list)


def run(
    orchestrator: Orchestrator,
    minutes: float = 30.0,
    seed: int = 7,
    inject_attack: bool = True,
    reviewer_id: str = "reviewer-1",
) -> SimulationResult:
    rng = random.Random(seed)
    result = SimulationResult()
    # ONE CLOCK. The run used to stamp everything in relative seconds, 0 to 1800,
    # while every live request stamps `time.time()`. The two met inside the same
    # meter, so after a run that drained the budget to 0.02% the very next real
    # call saw a gap of roughly 28 million minutes of rest, replenished to full
    # and reported a wide-awake reviewer. `GET /attention`, which the README
    # calls the live attention picture, answered 1.0 immediately after measuring
    # 0.0002. Anchoring the run so that it ENDS now keeps a single timebase, and
    # a request posted after a run correctly meets the exhausted budget the film
    # says it should.
    origin = time.time() - minutes * 60.0
    now = origin
    attack_at = minutes * 60.0 * 0.55  # relative to origin
    attack_done = False

    events: list[ApprovalRequest] = []
    for profile in PROFILES:
        interval = 60.0 / profile.requests_per_minute
        t = rng.uniform(0, interval)
        while t < minutes * 60.0:
            events.append(make_request(profile, rng, origin + t))
            t += interval * rng.uniform(0.7, 1.3)

    if inject_attack:
        batch_id = "batch-quarterly-cleanup"
        for offset, (action, risk, complexity) in enumerate(
            [
                ("archive_old_logs", 0.1, 0.1),
                ("rotate_temp_credentials", 0.15, 0.2),
                ("delete_production_backup_set", 0.9, 0.4),
                ("clear_cdn_cache", 0.12, 0.1),
            ]
        ):
            events.append(
                ApprovalRequest(
                    request_id=f"atk-{offset}",
                    agent_id="data_ops",
                    action=action,
                    risk_score=risk,
                    complexity=complexity,
                    batch_id=batch_id,
                    description="routine quarterly cleanup, nothing unusual",
                    created_at=origin + attack_at + offset * 2.0,
                )
            )

    events.sort(key=lambda r: r.created_at)

    for request in events:
        now = request.created_at
        routing = orchestrator.route_request(request)
        result.routed_total += 1

        if routing.route == "paused_sentinel":
            result.paused_by_sentinel += 1
            if request.risk_score >= 0.7:
                result.dangerous_caught.append(request.request_id)
        elif routing.route == "auto_execute":
            result.auto_executed += 1
        else:
            result.escalated += 1
            budget = orchestrator.meter.state.team_budget.get(reviewer_id)
            budget.replenish(now)
            time_s, depth, p_approve = reviewer_behavior(budget.fraction)
            approved = rng.random() < p_approve
            decision = Decision(
                request_id=request.request_id,
                reviewer_id=reviewer_id,
                approved=approved,
                decision_time_s=time_s * rng.uniform(0.8, 1.2),
                review_depth=depth,
                decided_at=now + time_s,
                complexity=request.complexity,
            )
            outcome = orchestrator.record_decision(decision)
            if outcome["drift_degraded"] and result.drift_declared_at is None:
                result.drift_declared_at = decision.decided_at - origin
            if request.risk_score >= 0.7 and approved and depth == 0:
                result.dangerous_stamped.append(request.request_id)

        if request.batch_id and not attack_done and request.request_id.startswith("atk"):
            attack_done = True

        result.timeline.append(
            {
                # Absolute inside the meter, relative on the way out: the chart
                # and every published figure are "seconds into the run".
                "at": now - origin,
                "request_id": request.request_id,
                "agent_id": request.agent_id,
                "action": request.action,
                "risk_score": request.risk_score,
                "route": routing.route,
                "team_fraction": routing.team_fraction,
                "effective_threshold": routing.effective_threshold,
            }
        )

    return result


if __name__ == "__main__":
    orch = Orchestrator()
    res = run(orch)
    print(f"routed:   {res.routed_total}")
    print(f"escalated: {res.escalated}  auto: {res.auto_executed}  paused: {res.paused_by_sentinel}")
    print(f"drift declared at: {res.drift_declared_at}")
    print(f"dangerous stamped: {res.dangerous_stamped}")
    print(f"dangerous caught by sentinel: {res.dangerous_caught}")
    print(f"pending policy proposal: {orch.pending_proposal() is not None}")
