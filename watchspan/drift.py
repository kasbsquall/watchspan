"""DRIFT: the rubber-stamp detector.

The exact signature of oversight degradation: time per decision falls while
the actions being reviewed do not get any simpler, approval rate climbs, and
review depth drops. Drift compares the older half of the window against the
newer half and declares, with evidence, the moment oversight stopped being
effective.
"""

from __future__ import annotations

from dataclasses import dataclass

from attention.signals import SignalWindow

# Minimum decisions before Drift will say anything.
MIN_DECISIONS = 12
# Newer-half median decision time must fall below this fraction of the older half.
TIME_DROP_RATIO = 0.6
# Complexity is considered "not simpler" if it stayed within this tolerance.
COMPLEXITY_TOLERANCE = 0.85
# Newer-half approval rate above this is a stamping signal.
APPROVAL_RATE_ALERT = 0.9
# Newer-half mean review depth below this is a stamping signal.
DEPTH_ALERT = 0.5


@dataclass(frozen=True)
class DriftVerdict:
    degraded: bool
    reason: str
    evidence: dict


def assess(window: SignalWindow) -> DriftVerdict:
    if len(window.decisions) < MIN_DECISIONS:
        return DriftVerdict(
            degraded=False,
            reason="insufficient data",
            evidence={"decisions": len(window.decisions), "required": MIN_DECISIONS},
        )

    older, newer = window.split_halves()
    evidence = {
        "older_median_time_s": older.median_decision_time(),
        "newer_median_time_s": newer.median_decision_time(),
        "older_median_complexity": older.median_complexity(),
        "newer_median_complexity": newer.median_complexity(),
        "newer_approval_rate": newer.approval_rate(),
        "newer_mean_review_depth": newer.mean_review_depth(),
        "decisions": len(window.decisions),
    }

    time_collapsed = (
        older.median_decision_time() > 0
        and newer.median_decision_time()
        <= older.median_decision_time() * TIME_DROP_RATIO
    )
    not_simpler = (
        newer.median_complexity()
        >= older.median_complexity() * COMPLEXITY_TOLERANCE
    )
    stamping_signals = sum(
        [
            newer.approval_rate() >= APPROVAL_RATE_ALERT,
            newer.mean_review_depth() <= DEPTH_ALERT,
        ]
    )

    if time_collapsed and not_simpler and stamping_signals >= 1:
        return DriftVerdict(
            degraded=True,
            reason=(
                "decision time collapsed while action complexity held: "
                "oversight is no longer effective"
            ),
            evidence=evidence,
        )
    return DriftVerdict(degraded=False, reason="within normal range", evidence=evidence)
