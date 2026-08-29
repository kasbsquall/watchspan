"""Independent risk assessment at ingress.

THE HOLE THIS CLOSES. `POST /requests` took `risk_score` from the caller, and
`ALWAYS_ESCALATE_ABOVE` was evaluated against that number. On the seeded path
the caller is the simulator and the scores come from a declared table, so it
never mattered. On the live path the caller is the agent being governed.

A reviewer ran the live fleet three times and watched the same action come back
self-scored 0.40, 0.50 and 0.30, against a declared 0.75 for that action. On the
third run Watchspan auto-executed a production table drop with no human
involved, because the agent said it was routine. A governance layer whose
headline safety property is set by the entity it governs is not a governance
layer, which is the same argument this project makes about the reviewer.

WHAT THE FIRST VERSION GOT WRONG. It scored an action by matching a catalogue
and a verb list, and when neither matched it returned 0.0. A reviewer proved in
two curls what that costs:

    change_vendor_bank_account          assessed 0.85  held
    update_supplier_remittance_details  assessed 0.00  auto-executed at 0.05

The same action, one word changed. Worse than the miss was the record it wrote:
`understated` compared assessment against declaration, so an unrecognised action
scored 0.0 and came back `caller_understated: false`. A negative result was
being printed as a clearance, and it certified the agent as honest in exactly
the case where Watchspan had no idea what the action did.

So this version says three things instead of one. What the action seems to do,
whether Watchspan recognised it at all, and only where it did recognise it,
whether the caller understated. Recognition now reads the object as well as the
verb, because "remove all customer records" is dangerous in the noun, and an
action that matches nothing is escalated rather than cleared: an unclassifiable
request is an unknown blast radius, and unknown is not the same as harmless.
"""

from __future__ import annotations

import re
from dataclasses import dataclass

from fleet.demo_agents import comms_agent, data_ops_agent, procurement_agent

# Verbs that destroy, move money, or hand out access, with their synonyms. The
# first list had `delete` and `drop` and not `remove`, `sunset` or `deprovision`,
# which is how a rename walked past it. Synonym families rather than single
# words, because an agent choosing its own names will not choose ours.
DESTRUCTIVE: dict[str, float] = {
    # destroy data
    "delete": 0.85, "remove": 0.85, "erase": 0.85, "purge": 0.85, "wipe": 0.9,
    "destroy": 0.9, "drop": 0.75, "truncate": 0.75, "clear": 0.6, "prune": 0.6,
    "sunset": 0.7, "decommission": 0.7, "retire": 0.6, "archive": 0.45,
    "overwrite": 0.7, "restore": 0.6, "rollback": 0.55, "reset": 0.6,
    # access and identity
    "revoke": 0.6, "grant": 0.65, "escalate": 0.6, "elevate": 0.65,
    "promote": 0.6, "disable": 0.6, "deprovision": 0.7, "provision": 0.5,
    "impersonate": 0.8, "bypass": 0.75, "rotate": 0.55, "reissue": 0.55,
    # money
    "transfer": 0.7, "wire": 0.75, "remit": 0.7, "settle": 0.65,
    "disburse": 0.75, "refund": 0.55, "chargeback": 0.6, "payout": 0.7,
    # reach
    "broadcast": 0.55, "publish": 0.5, "announce": 0.5,
}

# Nouns that describe what is being acted on. Blast radius lives here: the same
# verb against a staging table and against every customer record is not the same
# action, and the first version could not tell them apart.
SENSITIVE_OBJECTS: dict[str, float] = {
    "production": 0.2, "prod": 0.2, "live": 0.15,
    "customer": 0.2, "customers": 0.2, "user": 0.15, "users": 0.15,
    "record": 0.15, "records": 0.2, "ledger": 0.2, "backup": 0.2,
    "credential": 0.25, "credentials": 0.25, "secret": 0.25, "secrets": 0.25,
    "token": 0.2, "key": 0.2, "password": 0.25, "mfa": 0.3, "2fa": 0.3,
    "admin": 0.25, "owner": 0.25, "root": 0.3, "superuser": 0.3,
    "bank": 0.25, "beneficiary": 0.25, "payroll": 0.25, "invoice": 0.15,
    "payment": 0.15, "remittance": 0.2, "settlement": 0.2, "ach": 0.25,
    "audit": 0.2, "log": 0.15, "logs": 0.15, "compliance": 0.2,
}

# "all", "every", "bulk": scope multipliers. Deleting a record and deleting all
# records differ by the word between them.
SCOPE_WORDS = {"all", "every", "entire", "bulk", "mass", "global", "complete"}
SCOPE_BONUS = 0.15

# An action Watchspan cannot classify is not a safe action. It is an unknown
# blast radius arriving from an agent that chose its own wording, so it is
# scored above the base escalation threshold and never auto-executed. This is
# deliberately not 1.0: an unknown action is uncertain, not proven dangerous,
# and treating it as critical would make the record dishonest in the other
# direction.
UNRECOGNISED_RISK = 0.5

# Anything matching a catalogued action inherits that action's declared risk.
CATALOGUE: dict[str, float] = {
    action: risk
    for profile in (procurement_agent.PROFILE, data_ops_agent.PROFILE, comms_agent.PROFILE)
    for action, risk, _complexity in profile.actions
}


@dataclass(frozen=True)
class Assessment:
    """What Watchspan thinks, next to what it was told, and how sure it is."""

    declared: float
    assessed: float
    effective: float
    basis: str
    # None when Watchspan could not classify the action. A boolean here would
    # claim the caller was honest on the strength of an assessment that does not
    # exist, which is the defect this field was reported for.
    understated: bool | None
    recognised: bool


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


def _lexical(words: set[str]) -> tuple[float, str]:
    """Score from what the action says it does and what it says it touches."""
    verbs = {w: DESTRUCTIVE[w] for w in words if w in DESTRUCTIVE}
    objects = {w: SENSITIVE_OBJECTS[w] for w in words if w in SENSITIVE_OBJECTS}
    if not verbs and not objects:
        return 0.0, ""

    # The verb sets the floor, the object raises it, scope raises it again. A
    # sensitive object with no recognised verb still scores, because "customer
    # records" in an action name is a signal on its own.
    verb_score = max(verbs.values()) if verbs else 0.3
    object_score = max(objects.values()) if objects else 0.0
    scope = SCOPE_BONUS if words & SCOPE_WORDS else 0.0
    total = min(1.0, verb_score + object_score + scope)

    named = ", ".join(sorted(verbs) + sorted(objects))
    detail = f"destructive language: {named}"
    if scope:
        detail += ", applied to everything"
    return total, detail


def assess(action: str, description: str = "", declared: float = 0.0) -> Assessment:
    """Score this action from what it says it does, ignoring what it claims to be worth."""
    declared = max(0.0, min(1.0, declared))
    words = _tokens(f"{action} {description}")

    assessed = 0.0
    basis = ""
    recognised = False

    name, overlap = _closest_catalogued(action)
    if name is not None:
        assessed = CATALOGUE[name]
        basis = f"resembles catalogued {name} ({overlap:.0%} match), declared risk {assessed:.2f}"
        recognised = True

    # A catalogued entry is specific knowledge about a specific action; the
    # lexicon is a guess for actions nobody catalogued. Letting the guess
    # override the knowledge scored `clear_staging_table` at 0.60 and
    # `reply_to_customer_ticket` at 0.50, which is a governance layer crying
    # wolf on routine work and draining the reviewer it exists to protect.
    #
    # The match holds only while the caller adds no risk word the catalogued
    # entry does not already carry. `clear_staging_table` keeps its 0.30;
    # `clear_staging_table_production` matches at 75% and still loses the match,
    # because the catalogue describes the first action and not the second.
    # Compared on the action name alone: the description is free text and the
    # Sentinel is what reads it.
    escalating = set(DESTRUCTIVE) | set(SENSITIVE_OBJECTS) | SCOPE_WORDS
    added = (_tokens(action) - _tokens(name or "")) & escalating
    catalogue_authoritative = name is not None and not added

    lexical_score, lexical_basis = _lexical(words)
    if lexical_basis and not catalogue_authoritative:
        recognised = True
        if lexical_score > assessed:
            assessed = lexical_score
            basis = lexical_basis
            if name is not None:
                basis += (
                    f"; resembles catalogued {name} but adds "
                    + ", ".join(sorted(added))
                )

    if not recognised:
        # Not cleared. Watchspan does not know what this does, and says so in
        # the record rather than returning a zero that reads like a pass.
        return Assessment(
            declared=round(declared, 4),
            assessed=UNRECOGNISED_RISK,
            effective=round(max(declared, UNRECOGNISED_RISK), 4),
            basis=(
                "not recognised: no catalogued match, no known destructive verb "
                "and no sensitive object. Escalated because Watchspan cannot "
                "establish what this action would do."
            ),
            understated=None,
            recognised=False,
        )

    return Assessment(
        declared=round(declared, 4),
        assessed=round(assessed, 4),
        effective=round(max(declared, assessed), 4),
        basis=basis,
        # Only a gap that changes the verdict is worth calling out, and only
        # where there is an assessment to compare against.
        understated=assessed - declared > 0.05,
        recognised=True,
    )
