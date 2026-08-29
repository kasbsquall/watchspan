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
    deterministic = (
        f"{len(meaningful)} of {len(decisions)} human decisions were made "
        "with meaningful attention (review depth above zero and more than "
        "10% of the reviewer's attention budget remaining). "
        f"{len(drift_events)} oversight degradation event(s) were declared "
        f"and {len(policy_events)} policy calibration event(s) recorded."
    )
    dossier["narrative"] = _grounded_narrative(dossier["summary"], deterministic)
    return dossier


def _grounded_narrative(summary: dict, deterministic: str) -> str:
    """Let Gemini write the prose, then check it against the numbers.

    An unchecked model call used to author this. It read well and it invented:
    one run produced "corrective calibration occurred by adjusting sentinel-pause
    sensitivity", which never happened, and another described the 7 Sentinel
    holds as 7 high-risk transactions when 2 were. This is the artifact an
    auditor reads. A compliance record embellished by a model is worse than a
    plain one, and in a project whose whole claim is that it measures instead of
    asserting, it was the one place we were asserting.

    So the model's output is treated the way this system treats an agent's
    self-declared risk: as a claim to be checked. Every figure it prints must
    appear in the summary it was given. One that does not, and the deterministic
    text ships instead. The check is on numbers because numbers are what an
    auditor acts on and what a hallucination gets wrong first.
    """
    import re

    allowed = _figures_in(summary)
    prose = llm.narrate(
        "Write a three-sentence auditor-facing summary of this human oversight "
        f"record under EU AI Act Article 14: {summary}. State plainly whether "
        "oversight remained effective. Use ONLY the figures given above and "
        "invent nothing: do not describe corrective measures that are not in "
        "the record.",
        fallback="",
    )
    if not prose:
        return deterministic

    printed = {_norm(m) for m in re.findall(r"\d+(?:[.,]\d+)?%?", prose)}
    unsupported = sorted(printed - allowed)
    if unsupported:
        return (
            f"{deterministic} (A model-written summary was discarded: it printed "
            f"{', '.join(unsupported[:4])}, which is not in this record.)"
        )
    return prose


def _norm(text: str) -> str:
    return text.replace(",", ".").rstrip("%").rstrip("0").rstrip(".") or "0"


def _figures_in(summary: dict) -> set[str]:
    """Every number an auditor could legitimately read off this record."""
    out: set[str] = {"14"}  # Article 14 itself
    for value in summary.values():
        if isinstance(value, (int, float)):
            out.add(_norm(f"{value}"))
            out.add(_norm(f"{value * 100:.2f}"))  # a ratio quoted as a percentage
            out.add(_norm(f"{value * 100:.1f}"))
            out.add(_norm(f"{round(value * 100)}"))
    return out

