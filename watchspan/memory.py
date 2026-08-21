"""Memory Bank wiring: the attention ledger across sessions.

The attention budget is only meaningful if it survives the session. A reviewer
who was drained yesterday does not arrive fresh today, and two workflows
escalating to the same team on different days still share one pool. On Google
Cloud that history lives in GEAP Memory Bank, scoped per reviewer; locally it
degrades to an in-process store with the same interface, so the system stays
runnable offline.
"""

from __future__ import annotations

import os
from dataclasses import dataclass, field

VERTEX_HOST = "https://{location}-aiplatform.googleapis.com/v1"


def memory_bank_available() -> bool:
    return bool(os.environ.get("GOOGLE_CLOUD_PROJECT")) and bool(
        os.environ.get("WATCHSPAN_AGENT_ENGINE_ID")
    )


@dataclass
class LocalAttentionMemory:
    """Offline stand-in. Same two operations the ledger needs."""

    facts: dict[str, list[str]] = field(default_factory=dict)

    def remember(self, reviewer_id: str, fact: str) -> None:
        self.facts.setdefault(reviewer_id, []).append(fact)

    def recall(self, reviewer_id: str) -> list[str]:
        return list(self.facts.get(reviewer_id, []))


class MemoryBankAttentionMemory:
    """GEAP Memory Bank adapter.

    Memories are scoped by reviewer so recall returns one person's history,
    which is what the shared-pool model needs. REST keeps this free of extra
    dependencies; `service` exposes the ADK memory service for agents that
    want the standard BaseMemoryService interface.
    """

    def __init__(self) -> None:
        self.project = os.environ["GOOGLE_CLOUD_PROJECT"]
        self.location = os.environ.get("GOOGLE_CLOUD_LOCATION", "us-central1")
        self.engine_id = os.environ["WATCHSPAN_AGENT_ENGINE_ID"]

    @property
    def _engine(self) -> str:
        return (
            f"projects/{self.project}/locations/{self.location}"
            f"/reasoningEngines/{self.engine_id}"
        )

    def _post(self, suffix: str, payload: dict) -> dict:
        import google.auth
        import google.auth.transport.requests
        import requests

        credentials, _ = google.auth.default(
            scopes=["https://www.googleapis.com/auth/cloud-platform"]
        )
        credentials.refresh(google.auth.transport.requests.Request())
        host = VERTEX_HOST.format(location=self.location)
        response = requests.post(
            f"{host}/{self._engine}/{suffix}",
            headers={"Authorization": f"Bearer {credentials.token}"},
            json=payload,
            timeout=60,
        )
        response.raise_for_status()
        return response.json()

    def remember(self, reviewer_id: str, fact: str) -> None:
        self._post("memories", {"fact": fact, "scope": {"reviewer": reviewer_id}})

    def recall(self, reviewer_id: str) -> list[str]:
        data = self._post("memories:retrieve", {"scope": {"reviewer": reviewer_id}})
        return [
            entry["memory"]["fact"]
            for entry in data.get("retrievedMemories", [])
            if entry.get("memory", {}).get("fact")
        ]

    @property
    def service(self):
        """ADK BaseMemoryService, for agents running on Agent Runtime."""
        from google.adk.memory import VertexAiMemoryBankService

        return VertexAiMemoryBankService(
            project=self.project,
            location=self.location,
            agent_engine_id=self.engine_id,
        )


def build_attention_memory():
    """Return the best available ledger backend."""
    if memory_bank_available():
        return MemoryBankAttentionMemory()
    return LocalAttentionMemory()
