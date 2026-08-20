"""Tests for the deterministic core: budget, drift, sentinel, calibrator, policy."""

import pytest

from attention.budget import DEFAULT_CAPACITY, ReviewerBudget, TeamBudget
from attention.signals import ApprovalRequest, Decision, SignalWindow
from watchspan import drift
from watchspan.calibrator import Calibrator
from watchspan.orchestrator import Orchestrator
from watchspan.policy import ApprovalPolicy
from watchspan.sentinel import Sentinel


def make_decision(t, time_s, complexity, approved=True, depth=1, reviewer="r1"):
    return Decision(
        request_id=f"req-{t}",
        reviewer_id=reviewer,
        approved=approved,
        decision_time_s=time_s,
        review_depth=depth,
        decided_at=t,
        complexity=complexity,
    )


def make_request(t, risk, agent="a1", batch=None, description=""):
    return ApprovalRequest(
        request_id=f"req-{agent}-{t}",
        agent_id=agent,
        action="act",
        risk_score=risk,
        complexity=0.5,
        batch_id=batch,
        description=description,
        created_at=t,
    )


class TestBudget:
    def test_spend_reduces_remaining_and_never_goes_negative(self):
        budget = ReviewerBudget(reviewer_id="r1")
        for i in range(100):
            budget.spend(complexity=1.0, now=float(i))
        assert budget.remaining == 0.0

    def test_complex_reviews_cost_more(self):
        cheap = ReviewerBudget(reviewer_id="r1")
        dear = ReviewerBudget(reviewer_id="r2")
        cost_low = cheap.spend(complexity=0.0, now=1.0)
        cost_high = dear.spend(complexity=1.0, now=1.0)
        assert cost_high == pytest.approx(cost_low * 3.0)

    def test_replenish_over_time(self):
        budget = ReviewerBudget(reviewer_id="r1")
        budget.spend(complexity=1.0, now=0.0)
        drained = budget.remaining
        budget.replenish(now=600.0)  # 10 minutes
        assert budget.remaining > drained
        assert budget.remaining <= DEFAULT_CAPACITY

    def test_team_fraction_is_shared_pool(self):
        team = TeamBudget()
        team.get("r1").spend(complexity=1.0, now=0.0)
        assert 0.0 < team.team_fraction(0.0) < 1.0


class TestPolicy:
    def test_threshold_rises_as_budget_empties(self):
        policy = ApprovalPolicy(base_threshold=0.3, budget_sensitivity=0.4)
        assert policy.effective_threshold(1.0) == pytest.approx(0.3)
        assert policy.effective_threshold(0.0) == pytest.approx(0.7)

    def test_low_budget_stops_low_risk_escalation(self):
        policy = ApprovalPolicy(base_threshold=0.3, budget_sensitivity=0.4)
        assert policy.should_escalate(0.4, budget_fraction=1.0)
        assert not policy.should_escalate(0.4, budget_fraction=0.1)


class TestDrift:
    def test_needs_minimum_data(self):
        window = SignalWindow()
        verdict = drift.assess(window)
        assert not verdict.degraded
        assert verdict.reason == "insufficient data"

    def test_detects_time_collapse_at_constant_complexity(self):
        window = SignalWindow()
        for i in range(10):
            window.add(make_decision(t=i, time_s=20.0, complexity=0.5, depth=3))
        for i in range(10, 20):
            window.add(make_decision(t=i, time_s=3.0, complexity=0.5, depth=0))
        verdict = drift.assess(window)
        assert verdict.degraded

    def test_no_alarm_when_actions_got_simpler(self):
        window = SignalWindow()
        for i in range(10):
            window.add(make_decision(t=i, time_s=20.0, complexity=0.9, depth=3))
        for i in range(10, 20):
            window.add(make_decision(t=i, time_s=3.0, complexity=0.1, depth=2, approved=False))
        verdict = drift.assess(window)
        assert not verdict.degraded


class TestSentinel:
    def test_burst_detection(self):
        sentinel = Sentinel()
        alerts = []
        for i in range(8):
            alerts += sentinel.inspect(make_request(t=float(i), risk=0.1))
        assert any(a.pattern == "burst" for a in alerts)

    def test_minimizing_language(self):
        sentinel = Sentinel()
        alerts = sentinel.inspect(
            make_request(t=0.0, risk=0.8, description="routine change, just approve")
        )
        assert any(a.pattern == "minimizing_language" for a in alerts)

    def test_batch_smuggling(self):
        sentinel = Sentinel()
        alerts = []
        for i, risk in enumerate([0.1, 0.15, 0.9, 0.1]):
            alerts += sentinel.inspect(
                make_request(t=float(i * 100), risk=risk, batch="b1")
            )
        assert any(a.pattern == "batch_smuggling" for a in alerts)

    def test_normal_cadence_not_flagged(self):
        sentinel = Sentinel()
        alerts = []
        for i in range(10):
            alerts += sentinel.inspect(make_request(t=float(i * 15), risk=0.2))
        assert alerts == []


class TestCalibrator:
    def test_proposes_on_low_budget_and_waits_for_human(self):
        calibrator = Calibrator()
        verdict = drift.DriftVerdict(degraded=False, reason="", evidence={})
        proposal = calibrator.evaluate(team_fraction=0.2, drift=verdict, now=0.0)
        assert proposal is not None
        # Policy unchanged until a human resolves it.
        assert calibrator.policy.version == 1
        calibrator.resolve(proposal.proposal_id, approved=True)
        assert calibrator.policy.version == 2
        assert calibrator.policy.base_threshold > 0.3

    def test_rejection_keeps_policy(self):
        calibrator = Calibrator()
        verdict = drift.DriftVerdict(degraded=True, reason="x", evidence={})
        proposal = calibrator.evaluate(team_fraction=0.9, drift=verdict, now=0.0)
        calibrator.resolve(proposal.proposal_id, approved=False)
        assert calibrator.policy.version == 1

    def test_no_duplicate_proposals_while_pending(self):
        calibrator = Calibrator()
        verdict = drift.DriftVerdict(degraded=False, reason="", evidence={})
        first = calibrator.evaluate(team_fraction=0.1, drift=verdict, now=0.0)
        second = calibrator.evaluate(team_fraction=0.1, drift=verdict, now=1.0)
        assert first is not None and second is None


class TestOrchestrator:
    def test_sentinel_pause_overrides_policy(self):
        orch = Orchestrator()
        result = None
        for i, risk in enumerate([0.1, 0.15, 0.9, 0.1]):
            result = orch.route_request(
                make_request(t=float(i * 100), risk=risk, batch="b1")
            )
        paused = [r for r in orch.routed if r.route == "paused_sentinel"]
        assert paused, "smuggled risky request should be paused"

    def test_audit_log_records_every_event(self):
        orch = Orchestrator()
        request = make_request(t=0.0, risk=0.9)
        orch.route_request(request)
        orch.record_decision(
            make_decision(t=10.0, time_s=20.0, complexity=0.5)
        )
        events = [e["event"] for e in orch.audit_log]
        assert "route" in events and "decision" in events
