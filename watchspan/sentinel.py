"""SENTINEL: the fatigue-exploitation detector.

Recognizes the attack patterns cataloged as ATR-2026-00118 (Human Approval
Fatigue Exploitation): rapid request bursts, minimizing language that makes a
dangerous action read as routine, and risky operations hidden inside batches
of benign ones. On detection it flags the flow for out-of-band escalation.
"""

from __future__ import annotations

from dataclasses import dataclass, field

from attention.signals import ApprovalRequest

# Burst: more than BURST_COUNT requests from one agent within BURST_WINDOW_S.
# Tuned above normal fleet cadence (busiest demo agent ~6/min): only a rapid
# machine-speed burst crosses it.
BURST_COUNT = 6
BURST_WINDOW_S = 30.0
# Batch smuggling: a request this risky inside a batch this benign on average.
SMUGGLE_RISK = 0.7
SMUGGLE_BATCH_MEAN = 0.3
# Minimizing language, matched deterministically. There is no model in this
# path and there should not be: a detector whose verdict moves with the weather
# cannot be audited. An earlier version of this comment described a Gemini
# refinement step that does not exist anywhere in the codebase, which a reviewer
# caught. The phrases are adversarial signals in their own right per
# ATR-2026-00118, and the film is explicit that a phrase list is a floor rather
# than a ceiling: reword the request and it walks past this. What does not walk
# past it is the attention budget, which does not read the words at all.
MINIMIZING_PHRASES = (
    "just approve",
    "routine",
    "no need to review",
    "don't bother",
    "same as always",
    "quick rubber stamp",
    "trivial change",
    "nothing unusual",
)


@dataclass(frozen=True)
class SentinelAlert:
    pattern: str  # "burst" | "minimizing_language" | "batch_smuggling"
    request_id: str
    agent_id: str
    detail: str


@dataclass
class Sentinel:
    recent: dict[str, list[float]] = field(default_factory=dict)  # agent_id -> timestamps
    batches: dict[str, list[ApprovalRequest]] = field(default_factory=dict)
    alerts: list[SentinelAlert] = field(default_factory=list)

    def inspect(self, request: ApprovalRequest) -> list[SentinelAlert]:
        found: list[SentinelAlert] = []
        found += self._check_burst(request)
        found += self._check_language(request)
        found += self._check_batch(request)
        self.alerts.extend(found)
        return found

    def _check_burst(self, request: ApprovalRequest) -> list[SentinelAlert]:
        stamps = self.recent.setdefault(request.agent_id, [])
        stamps.append(request.created_at)
        cutoff = request.created_at - BURST_WINDOW_S
        stamps[:] = [t for t in stamps if t >= cutoff]
        if len(stamps) > BURST_COUNT:
            return [
                SentinelAlert(
                    pattern="burst",
                    request_id=request.request_id,
                    agent_id=request.agent_id,
                    detail=(
                        f"{len(stamps)} requests in {BURST_WINDOW_S:.0f}s "
                        f"(limit {BURST_COUNT})"
                    ),
                )
            ]
        return []

    def _check_language(self, request: ApprovalRequest) -> list[SentinelAlert]:
        text = f"{request.action} {request.description}".lower()
        hits = [p for p in MINIMIZING_PHRASES if p in text]
        if hits:
            return [
                SentinelAlert(
                    pattern="minimizing_language",
                    request_id=request.request_id,
                    agent_id=request.agent_id,
                    detail=f"minimizing phrases detected: {', '.join(hits)}",
                )
            ]
        return []

    def _check_batch(self, request: ApprovalRequest) -> list[SentinelAlert]:
        if not request.batch_id:
            return []
        batch = self.batches.setdefault(request.batch_id, [])
        batch.append(request)
        if len(batch) < 3:
            return []
        risky = [r for r in batch if r.risk_score >= SMUGGLE_RISK]
        if not risky:
            return []
        benign = [r for r in batch if r.risk_score < SMUGGLE_RISK]
        if not benign:
            return []
        mean_benign = sum(r.risk_score for r in benign) / len(benign)
        if mean_benign <= SMUGGLE_BATCH_MEAN:
            # ONE alert, about the batch, attached to whatever is being routed.
            #
            # It used to return one alert per risky member, each carrying that
            # member's risk in its text, while the orchestrator held whichever
            # request happened to be routing. So a cache flush at risk 0.12 was
            # held under a line reading "risk 0.90 hidden in batch", which reads
            # as though the cache flush were the dangerous one. Holding the whole
            # batch is right; describing every member as the smuggled action is
            # not. The detail now names the action it actually found.
            worst = max(risky, key=lambda r: r.risk_score)
            return [
                SentinelAlert(
                    pattern="batch_smuggling",
                    request_id=request.request_id,
                    agent_id=request.agent_id,
                    detail=(
                        f"batch {request.batch_id} carries {worst.action} at risk "
                        f"{worst.risk_score:.2f} among a benign mean of "
                        f"{mean_benign:.2f}; holding the batch"
                    ),
                )
            ]
        return []
