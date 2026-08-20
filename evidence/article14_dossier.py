"""EU AI Act Article 14 effective-oversight dossier.

Article 14 requires that human oversight of high-risk systems be effective,
not decorative. This module turns the audit log into the evidence an auditor
would ask for: who reviewed what, with how much attention available at that
moment, when oversight degraded, and what the system did about it.
"""

from __future__ import annotations

from watchspan import llm
from watchspan.orchestrator import Orchestrator


def build(orchestrator: Orchestrator, generated_at: float) -> dict:
    log = orchestrator.audit_log
    decisions = [e for e in log if e["event"] == "decision"]
    routes = [e for e in log if e["event"] == "route"]
    drift_events = [e for e in log if e["event"] == "drift_declared"]
    policy_events = [
        e for e in log if e["event"] in ("policy_proposed", "policy_resolved")
    ]

    meaningful = [
        d for d in decisions
        if d["review_depth"] > 0 and d["reviewer_fraction_after"] > 0.1
    ]
    dossier = {
        "standard": "EU AI Act, Article 14 (human oversight)",
        "generated_at": generated_at,
        "policy_version_active": orchestrator.calibrator.policy.version,
        "summary": {
            "requests_routed": len(routes),
            "escalated_to_human": sum(1 for r in routes if r["route"] == "escalate"),
            "auto_executed_with_audit": sum(
                1 for r in routes if r["route"] == "auto_execute"
            ),
            "paused_by_sentinel": sum(
                1 for r in routes if r["route"] == "paused_sentinel"
            ),
            "human_decisions": len(decisions),
            "decisions_with_meaningful_attention": len(meaningful),
            "meaningful_review_ratio": (
                round(len(meaningful) / len(decisions), 4) if decisions else None
            ),
        },
        "oversight_degradation_events": drift_events,
        "policy_calibration_events": policy_events,
        "decision_records": [
            {
                "request_id": d["request_id"],
                "reviewer_id": d["reviewer_id"],
                "approved": d["approved"],
                "decision_time_s": d["decision_time_s"],
                "review_depth": d["review_depth"],
                "attention_remaining_after": d["reviewer_fraction_after"],
                "meaningful": d in meaningful,
                "at": d["at"],
            }
            for d in decisions
        ],
    }
    dossier["narrative"] = llm.narrate(
        "Write a three-sentence auditor-facing summary of this human oversight "
        f"record under EU AI Act Article 14: {dossier['summary']}. State plainly "
        "whether oversight remained effective and what corrective calibration "
        "occurred.",
        fallback=(
            f"{len(meaningful)} of {len(decisions)} human decisions were made "
            "with meaningful attention (review depth above zero and more than "
            "10% of the reviewer's attention budget remaining). "
            f"{len(drift_events)} oversight degradation event(s) were declared "
            f"and {len(policy_events)} policy calibration event(s) recorded."
        ),
    )
    return dossier
