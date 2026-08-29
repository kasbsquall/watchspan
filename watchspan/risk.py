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

WHAT THE FIRST VERSION GOT WRONG. It matched a catalogue and a nineteen-word
verb list, and returned 0.0 when neither hit. `change_vendor_bank_account` was
held at 0.85 and `update_supplier_remittance_details`, the same action reworded,
auto-executed at the 0.05 the caller declared. Worse than the miss was the
record: `understated` compared assessment against declaration, so an
unrecognised action scored 0.0 and came back `caller_understated: false`. A
negative result printed as a clearance, in exactly the case where Watchspan had
no idea what the action would do.

WHAT THE SECOND VERSION GOT WRONG, twice, both found with curl. It let a
catalogue match short-circuit the lexical read, which opened two mirror-image
holes. Renaming a dangerous action to resemble a benign catalogued entry walked
straight through: `update_vendor_contact_details_new_iban` matched the 0.10
entry and auto-executed, and that is where a vendor's payments get redirected.
And because the short circuit skipped the description too, an action named
`retry_failed_pipeline_run` described as "drop every production table and
transfer funds to an external bank account" auto-executed at 0.10. The comment
promising the Sentinel would read that description was wrong: the Sentinel
matches eight minimizing phrases and has no destructive-content check at all.

The same crude lexicon fired on harmless work in the other direction, scoring
`rotate_logs` at 0.70 and `announce_lunch` at 0.50, which burns the reviewer
budget this product exists to conserve.

WHAT CHANGED. Not more words. Objects are not all the same kind of thing. An
IBAN, a credential and a privilege are dangerous on their own with no verb at
all. "Customer" and "production" are not: they raise whatever verb they attach
to and mean nothing by themselves. And "staging", "cache" and "draft" say out
loud that this is not the real thing. Three lists instead of one, verbs scored
for what they do alone rather than for how alarming they sound, the lexical read
always run over the action AND the description, and the catalogue used as a
floor rather than a ceiling.
"""

from __future__ import annotations

import re
from dataclasses import dataclass

from fleet.demo_agents import comms_agent, data_ops_agent, procurement_agent

# Verbs, scored for what they do on their own. Deliberately lower than the
# previous version: `rotate` and `archive` are daily operations, and a
# governance layer that escalates them teaches its reviewer to stop reading.
DESTRUCTIVE: dict[str, float] = {
    # irreversible loss
    "delete": 0.75, "remove": 0.7, "erase": 0.75, "purge": 0.8, "wipe": 0.85,
    "destroy": 0.85, "obliterate": 0.85, "drop": 0.7, "truncate": 0.7,
    "exfiltrate": 0.9, "leak": 0.8,
    # reversible or routine, dangerous only with a dangerous object
    "clear": 0.35, "prune": 0.35, "archive": 0.2, "retire": 0.3, "reset": 0.4,
    "decommission": 0.5, "sunset": 0.5, "overwrite": 0.5, "restore": 0.35,
    "rollback": 0.3, "rotate": 0.25, "reissue": 0.3,
    # access and identity
    "revoke": 0.5, "grant": 0.55, "escalate": 0.55, "elevate": 0.55,
    "elevated": 0.55, "promote": 0.45, "disable": 0.45, "deprovision": 0.55,
    "provision": 0.35, "impersonate": 0.75, "bypass": 0.7, "disclose": 0.6,
    # money
    "transfer": 0.6, "wire": 0.65, "remit": 0.6, "settle": 0.5,
    "disburse": 0.65, "payout": 0.6, "refund": 0.35, "chargeback": 0.4,
    "redirect": 0.5,
    # reach
    "broadcast": 0.3, "publish": 0.2, "announce": 0.15,
}

# Objects that are dangerous with no verb at all: where the money goes, who can
# get in. `update_supplier_remittance_details` contains no destructive verb and
# is a payment redirection. This list is what catches that.
CRITICAL_OBJECTS: dict[str, float] = {
    "iban": 0.65, "swift": 0.6, "beneficiary": 0.6, "remittance": 0.55,
    "ach": 0.6, "bank": 0.55, "payroll": 0.55, "settlement": 0.5, "payee": 0.55,
    "credential": 0.6, "credentials": 0.6, "secret": 0.6, "secrets": 0.6,
    "password": 0.6, "passwords": 0.6, "mfa": 0.65, "2fa": 0.65,
    "privilege": 0.6, "privileges": 0.6, "root": 0.6, "superuser": 0.6,
    "sudo": 0.6, "owner": 0.5, "admin": 0.5,
}

# Objects that raise whatever verb they attach to and mean nothing alone.
# `reply_to_customer_ticket` contains "customer" and is correspondence; the
# previous version scored it 0.50 because it treated every noun as a threat.
CONTEXT_OBJECTS: dict[str, float] = {
    "production": 0.25, "prod": 0.25, "live": 0.15,
    "customer": 0.15, "customers": 0.15, "user": 0.1, "users": 0.1,
    "record": 0.1, "records": 0.15, "ledger": 0.15,
    "backup": 0.2, "backups": 0.2, "token": 0.15, "key": 0.15, "keys": 0.15,
    "audit": 0.15, "compliance": 0.15,
}

# Words that say out loud this is not the real thing. Applied only when no
# critical or context object is present, so "staging" cannot be used to cancel
# out "production" sitting in the same string.
MITIGATING = {
    "staging", "test", "testing", "sandbox", "dev", "development", "draft",
    "cache", "temp", "temporary", "thumbnail", "preview", "local", "internal",
    "deprecated", "dry", "simulated", "mock",
}
MITIGATION = 0.3
# Mitigation reduces a verb and cannot erase it. Without this floor
# `archive_deprecated_staging_table` scored exactly 0.00 while still counting as
# recognised, so it skipped the unrecognised safety net and auto-executed on
# whatever the caller declared. A word that says "this is not the real thing"
# lowers the reading; it does not turn a destructive verb into no verb.
MITIGATION_FLOOR = 0.5

# Scope and magnitude. Deleting a record and deleting all records differ by the
# word between them, and a purchase order "under 500" is a different action from
# one "under 500 thousand".
SCOPE_WORDS = {
    "all", "every", "entire", "bulk", "mass", "global", "complete",
    "thousand", "million", "billion",
}
SCOPE_BONUS = 0.2

# An action Watchspan cannot classify is not a safe action. It is an unknown
# blast radius arriving from an agent that chose its own wording, so it is
# scored above the base escalation threshold and never auto-executed. This is
# deliberately not 1.0: an unknown action is uncertain, not proven dangerous,
# and treating it as critical would make the record dishonest the other way.
UNRECOGNISED_RISK = 0.5

# Anything matching a catalogued action inherits that action's catalogued risk.
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


def _lexical(words: set[str], named: set[str]) -> tuple[float, str]:
    """Score from what the action says it does and what it says it touches.

    `words` is the action and its description together; `named` is the action
    name alone. Verbs and critical objects are read from both, because a caller
    who buries "transfer funds to an external bank account" in the description
    is describing that action whatever they called it. Context nouns and
    mitigating words are read from the action name only: they are modifiers on
    the thing being named, and an honest description says "staging holds no
    customer data", which is prose about safety that the previous version read
    as a customer-data operation.
    """
    verbs = {w: DESTRUCTIVE[w] for w in words if w in DESTRUCTIVE}
    critical = {w: CRITICAL_OBJECTS[w] for w in words if w in CRITICAL_OBJECTS}
    context = {w: CONTEXT_OBJECTS[w] for w in named if w in CONTEXT_OBJECTS}

    # A verb or a critical object is what makes this recognisable at all. A
    # context noun on its own is not a finding: every action in a company
    # touches a customer or a record somewhere, and treating that as a signal
    # is what scored "reply to customer ticket" at half the risk scale.
    base = max(
        max(verbs.values()) if verbs else 0.0,
        max(critical.values()) if critical else 0.0,
    )
    if base <= 0.0:
        return 0.0, ""

    total = base + (max(context.values()) if context else 0.0)
    at_scale = bool(words & SCOPE_WORDS)
    if at_scale:
        total += SCOPE_BONUS
    # "staging" reduces a table drop. It does not reduce a production table
    # drop, so a mitigating word standing next to a real object is ignored
    # rather than handing the caller a way to cancel out their own risk.
    if (named & MITIGATING) and not critical and not context:
        total = max(total - MITIGATION, base * MITIGATION_FLOOR)

    named = ", ".join(sorted(verbs) + sorted(critical) + sorted(context))
    detail = f"destructive language: {named}"
    if at_scale:
        detail += ", applied at scale"
    return max(0.0, min(1.0, total)), detail


def assess(action: str, description: str = "", declared: float = 0.0) -> Assessment:
    """Score this action from what it says it does, ignoring what it claims to be worth."""
    declared = max(0.0, min(1.0, declared))

    # Always read both. The previous version scored the action name alone when
    # the catalogue matched, which let a caller put "drop every production
    # table and transfer funds to an external bank account" in the description
    # of an action called `retry_failed_pipeline_run` and auto-execute at 0.10.
    lexical_score, lexical_basis = _lexical(
        _tokens(f"{action} {description}"), _tokens(action)
    )

    catalogued, overlap = _closest_catalogued(action)
    catalogue_score = CATALOGUE[catalogued] if catalogued is not None else 0.0

    # Whichever is higher, always. The catalogue is specific knowledge about a
    # known action and is a floor; it is never a ceiling, because a name that
    # resembles a benign entry is exactly how a dangerous action gets in.
    # `update_vendor_contact_details_new_iban` matches a 0.10 entry at 67% and
    # carries an IBAN, and the IBAN is what decides.
    if lexical_score >= catalogue_score and lexical_basis:
        assessed, basis = lexical_score, lexical_basis
        if catalogued is not None:
            basis += f"; resembles catalogued {catalogued} at {overlap:.0%}"
    elif catalogued is not None:
        assessed = catalogue_score
        basis = (
            f"resembles catalogued {catalogued} ({overlap:.0%} match), "
            f"catalogue risk {catalogue_score:.2f}"
        )
    else:
        assessed, basis = lexical_score, lexical_basis

    # A name that resembles a catalogued action but carries a word that action
    # does not is not that action. `create_purchase_order_under_500` is capped
    # at five hundred; `create_purchase_order_under_500_thousand_usd` is not,
    # and no verb or object in it says so.
    escalating = set(DESTRUCTIVE) | set(CRITICAL_OBJECTS) | set(CONTEXT_OBJECTS) | SCOPE_WORDS
    added = (_tokens(action) - _tokens(catalogued or "")) & escalating
    match_broken = catalogued is not None and bool(added) and assessed <= catalogue_score

    if not basis or match_broken:
        # Not cleared. Watchspan does not know what this does, and says so in
        # the record rather than returning a zero that reads like a pass.
        reason = (
            f"resembles catalogued {catalogued} but adds "
            + ", ".join(sorted(added))
            + ", which that action does not cover"
            if match_broken
            else (
                "no catalogued match, no known destructive verb and no "
                "sensitive object"
            )
        )
        return Assessment(
            declared=round(declared, 4),
            assessed=UNRECOGNISED_RISK,
            effective=round(max(declared, UNRECOGNISED_RISK), 4),
            basis=(
                f"not recognised: {reason}. Escalated because Watchspan cannot "
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
