"""Capture the live API responses the film puts on screen, and check them.

Scenes 3, 4 and 9 show data rather than a page. There is no view in the product
that renders the risk read or the peer exchange, so the alternative to this
would be a designer typing numbers into a title card, which is how a film ends
up quoting a figure the code does not produce. That already happened twice.

So the payloads are fetched from the deployed service, asserted against what the
script says out loud, and written where Remotion reads them. The assertions are
the point: if the API stops producing what the narration claims, this fails
before anything is rendered rather than after it is uploaded.
"""

from __future__ import annotations

import json
import os
import pathlib
import sys

import requests

API = os.environ.get("WATCHSPAN_API", "https://watchspan-api-45ejdvuucq-uc.a.run.app")
OUT = pathlib.Path(__file__).parent / "remotion/src/data/evidence.json"
SESSION = {"content-type": "application/json", "x-watchspan-session": "film-evidence"}


def post(path: str, body: dict, timeout: float = 60.0) -> dict:
    response = requests.post(f"{API}{path}", json=body, headers=SESSION, timeout=timeout)
    response.raise_for_status()
    return response.json()


def request(action: str, description: str = "", risk: float = 0.05, agent: str = "procurement") -> dict:
    """Route one request and keep the action name with the answer.

    The response does not echo the action, and the film puts the action name on
    screen next to the score, so the two have to travel together or a frame ends
    up captioning one request with another's name.
    """
    answer = post(
        "/requests",
        {
            "agent_id": agent,
            "action": action,
            "risk_score": risk,
            "complexity": 0.4,
            "description": description,
        },
    )
    return {"action": action, **answer}


def main() -> int:
    evidence: dict = {"api": API}
    problems: list[str] = []

    def check(label: str, got, want) -> None:
        if got != want:
            problems.append(f"{label}: got {got!r}, the film says {want!r}")

    # Scene 3, beat one. The agent understates a table drop and Watchspan routes
    # on its own number. 75 is the one figure in the film that is deterministic.
    understated = request("drop_deprecated_staging_table", risk=0.40, agent="data_ops")
    evidence["understated"] = understated
    check("assessed", understated["risk"]["assessed_by_watchspan"], 0.75)
    check("routed_on", understated["risk"]["routed_on"], 0.75)
    check("caller_understated", understated["risk"]["caller_understated"], True)

    # Scene 3, beat two. The disguise, and the catalogue refusing to save it.
    benign = request("update_vendor_contact_details")
    disguised = request("update_vendor_contact_details_new_iban")
    evidence["disguise"] = {"catalogued": benign, "renamed": disguised}
    check("benign assessed", benign["risk"]["assessed_by_watchspan"], 0.10)
    check("benign route", benign["route"], "auto_execute")
    check("renamed assessed", disguised["risk"]["assessed_by_watchspan"], 0.65)
    check("renamed route", disguised["route"], "escalate")

    # Scene 9. Every Google Cloud service the film names, answering for itself.
    status = requests.get(f"{API}/geap/status", timeout=90).json()
    evidence["geap"] = status
    summary = status["_summary"]
    check("verified live", summary["verified_by_live_call"], summary["of_live_calls"])
    check("live calls", summary["of_live_calls"], 6)

    # Scene 4. The peer exchange. Slow, because each task is a model call, and
    # rate limited, so this runs last and is allowed to be absent.
    if "--with-fleet" in sys.argv:
        fleet = post("/fleet/live", {"tasks": 2}, timeout=400)
        evidence["fleet"] = fleet
        check("discovery", fleet["fleet_discovered_from"], "agent_registry")
        if not fleet["routed"]:
            problems.append("the fleet asked for nothing; there is no exchange to show")

    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(evidence, indent=1), encoding="utf-8")
    print(f"wrote {OUT.relative_to(pathlib.Path.cwd())}")

    for line in problems:
        print("PROBLEM ", line)
    if not problems:
        print("every figure the film speaks in these scenes came back as written")
    return 1 if problems else 0


if __name__ == "__main__":
    raise SystemExit(main())
