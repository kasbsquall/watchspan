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
        # Distinct, like the Memory Bank adapter: the two backends must not
        # disagree about what a ledger is.
        seen: set[str] = set()
        return [f for f in self.facts.get(reviewer_id, []) if not (f in seen or seen.add(f))]


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
        # Memory Bank appends, and every demo run writes the same degradation
        # sentence, so the ledger grew to twenty-seven identical lines: a panel
        # that is meant to show what a reviewer carries in from past sessions
        # instead showed one sentence, repeated. Skip what is already there.
        try:
            if fact in self.recall(reviewer_id):
                return
        except Exception:
            pass  # a failed read must not stop a write
        self._post("memories", {"fact": fact, "scope": {"reviewer": reviewer_id}})

    def recall(self, reviewer_id: str) -> list[str]:
        """Distinct facts, newest first.

        Memory Bank appends and the write-side guard is best effort: it reads
        before writing, and a retrieve that returns a similarity-ranked subset
        will not always contain the exact string about to be written. The store
        accumulated a hundred rows carrying two distinct sentences, and a panel
        headed "what this reviewer carries in from previous sessions" showed one
        sentence ninety times. Deduplicate on the way out, where it is
        guaranteed: the ledger's job is to report what is known, not how many
        times it was written down.
        """
        data = self._post("memories:retrieve", {"scope": {"reviewer": reviewer_id}})
        seen: set[str] = set()
        facts: list[str] = []
        for entry in data.get("retrievedMemories", []):
            fact = entry.get("memory", {}).get("fact")
            if fact and fact not in seen:
                seen.add(fact)
                facts.append(fact)
        return facts

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
