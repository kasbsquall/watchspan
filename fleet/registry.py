"""Agent Registry cataloging for the Watchspan fleet.

Publishes the agent cards for the three institutional demo agents and the
four governance agents so they are discoverable across departments, as the
Fortified Enterprise Fleet track requires. The registry payload shape is
validated against the live API on first deploy (the public docs describe the
flow but we could not confirm the exact schema offline; `register_all`
surfaces the server response verbatim so any mismatch is visible
immediately).

Usage (requires gcloud auth application-default login):
    python -m fleet.registry
"""

from __future__ import annotations

import json
import os

from fleet.demo_agents import comms_agent, data_ops_agent, procurement_agent

GOVERNANCE_AGENTS = (
    ("watchspan-meter", "Meters the shared human attention budget in real time."),
    ("watchspan-drift", "Detects when oversight degrades to rubber-stamping."),
    ("watchspan-calibrator", "Recalibrates the approval policy against available attention."),
    ("watchspan-sentinel", "Detects approval-fatigue exploitation patterns."),
)


def agent_cards() -> list[dict]:
    cards = [
        {
            "agent_id": profile.agent_id,
            "display_name": profile.display_name,
            "description": profile.description,
            "owner": "watchspan-demo-fleet",
            "kind": "institutional",
        }
        for profile in (
            procurement_agent.PROFILE,
            data_ops_agent.PROFILE,
            comms_agent.PROFILE,
        )
    ]
    cards += [
        {
            "agent_id": agent_id,
            "display_name": agent_id,
            "description": description,
            "owner": "watchspan-governance",
            "kind": "governance",
        }
        for agent_id, description in GOVERNANCE_AGENTS
    ]
    return cards


def register_all() -> None:
    import google.auth
    import google.auth.transport.requests
    import requests

    project = os.environ["GOOGLE_CLOUD_PROJECT"]
    location = os.environ.get("GOOGLE_CLOUD_LOCATION", "us-central1")
    credentials, _ = google.auth.default()
    credentials.refresh(google.auth.transport.requests.Request())
    endpoint = (
        f"https://geminienterprise.googleapis.com/v1/projects/{project}"
        f"/locations/{location}/agents"
    )
    for card in agent_cards():
        response = requests.post(
            endpoint,
            headers={"Authorization": f"Bearer {credentials.token}"},
            json=card,
            timeout=30,
        )
        print(f"{card['agent_id']}: HTTP {response.status_code}")
        print(json.dumps(response.json(), indent=2)[:500])


if __name__ == "__main__":
    if os.environ.get("GOOGLE_CLOUD_PROJECT"):
        register_all()
    else:
        print("GOOGLE_CLOUD_PROJECT not set. Cards that would be registered:")
        print(json.dumps(agent_cards(), indent=2))
