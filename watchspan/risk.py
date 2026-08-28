"""Independent risk assessment at ingress.

THE HOLE THIS CLOSES. `POST /requests` took `risk_score` from the caller, and
`ALWAYS_ESCALATE_ABOVE` — the safety floor this project added after measuring
that a raised threshold let 34 dangerous actions run unseen — was evaluated
against that number. On the seeded path the caller is the simulator and the
scores come from a declared table, so it never mattered. On the live path the
caller is the agent being governed.

A reviewer ran the live fleet three times and watched the same action come back
self-scored 0.40, 0.50 and 0.30, against a declared 0.75 for that action. On the
third run Watchspan auto-executed a production table drop with no human
involved, because the agent said it was routine. A governance layer whose
headline safety property is set by the entity it governs is not a governance
layer, which is the same argument this project makes about the reviewer.

So the declared score is now a claim, not an input. Watchspan assesses the
action itself and routes on whichever is higher. Understating your risk cannot
get you past the gate; it can only get you escalated with the discrepancy on the
record.
"""

from __future__ import annotations

import re
from dataclasses import dataclass

from fleet.demo_agents import comms_agent, data_ops_agent, procurement_agent

# Verbs that destroy, move money, or hand out access. An action nobody has
# catalogued still cannot be called routine if it says one of these.
DESTRUCTIVE = {
    "delete": 0.85,
    "drop": 0.75,
    "purge": 0.85,
    "wipe": 0.9,
    "destroy": 0.9,
    "truncate": 0.75,
    "revoke": 0.6,
    "rotate": 0.55,
    "grant": 0.65,
    "escalate": 0.6,
    "disable": 0.6,
    "transfer": 0.7,
    "bank": 0.7,
    # "payment" is deliberately absent: it fires on approve_payment_terms_extension,
    # which changes terms rather than moving money, and a signal that broad
    # reclassifies ordinary procurement work as dangerous. "transfer" and "bank"
    # are the ones that actually mean money is moving.
    "credential": 0.6,
    "secret": 0.65,
    "production": 0.15,  # a modifier, not a verb: bumps whatever it attaches to
}

# Anything matching a catalogued action inherits that action's declared risk.
CATALOGUE: dict[str, float] = {
    action: risk
    for profile in (procurement_agent.PROFILE, data_ops_agent.PROFILE, comms_agent.PROFILE)
    for action, risk, _complexity in profile.actions
}


@dataclass(frozen=True)
class Assessment:
    """What Watchspan thinks, next to what it was told."""

    declared: float
    assessed: float
    effective: float
    basis: str
    understated: bool


def _tokens(text: str) -> set[str]:
    return {t for t in re.split(r"[^a-z0-9]+", text.lower()) if t}


def _closest_catalogued(action: str) -> tuple[str | None, float]:
    """The catalogued action this one most resembles.

    Agents invent names: a live run produced `drop_deprecated_staging_table`
    where the catalogue holds `drop_deprecated_table`. Exact matching would have
    missed it, so this compares token sets and takes the best overlap above a
    half. Jaccard rather than a substring test, because `clear_staging_table`
    and `drop_deprecated_table` share a suffix and are not the same risk.
    """
    want = _tokens(action)
    if not want:
        return None, 0.0
    best_name, best_score = None, 0.0
    for name in CATALOGUE:
        have = _tokens(name)
        overlap = len(want & have) / len(want | have)
        if overlap > best_score:
            best_name, best_score = name, overlap
    return (best_name, best_score) if best_score >= 0.5 else (None, best_score)


def assess(action: str, description: str = "", declared: float = 0.0) -> Assessment:
    """Score this action from what it says it does, ignoring what it claims to be worth."""
    assessed = 0.0
    basis = "no catalogued match and no destructive verb"

    name, overlap = _closest_catalogued(action)
    if name is not None:
        assessed = CATALOGUE[name]
        basis = f"resembles catalogued {name} ({overlap:.0%} match), declared risk {assessed:.2f}"

    words = _tokens(f"{action} {description}")
    verb_hits = {w: DESTRUCTIVE[w] for w in words if w in DESTRUCTIVE}
    if verb_hits:
        # "production" is a modifier: it raises whatever it is attached to.
        modifier = verb_hits.pop("production", 0.0)
        verb_floor = (max(verb_hits.values()) if verb_hits else 0.0) + modifier
        if verb_floor > assessed:
            named = ", ".join(sorted(verb_hits) + (["production"] if modifier else []))
            assessed = min(1.0, verb_floor)
            basis = f"destructive language: {named}"

    declared = max(0.0, min(1.0, declared))
    effective = max(declared, assessed)
    return Assessment(
        declared=round(declared, 4),
        assessed=round(assessed, 4),
        effective=round(effective, 4),
        basis=basis,
        # Only a gap that changes the verdict is worth calling out.
        understated=assessed - declared > 0.05,
    )
