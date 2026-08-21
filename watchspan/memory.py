"""Memory Bank wiring: cross-session attention history.

On Google Cloud, Watchspan persists the attention ledger and drift history
through Vertex AI Memory Bank (GEAP), so the budget survives across sessions
and weeks of asynchronous operation. Locally it degrades to an in-process
store with the same interface, keeping the whole system runnable offline.
"""

from __future__ import annotations

import os
from dataclasses import dataclass, field


def memory_bank_available() -> bool:
    return bool(os.environ.get("GOOGLE_CLOUD_PROJECT")) and bool(
        os.environ.get("WATCHSPAN_AGENT_ENGINE_ID")
    )


@dataclass
class LocalAttentionMemory:
    """Offline stand-in with the same three operations we use."""

    facts: list[str] = field(default_factory=list)

    def remember(self, fact: str) -> None:
        self.facts.append(fact)

    def recall(self, query: str) -> list[str]:
        terms = query.lower().split()
        return [f for f in self.facts if any(t in f.lower() for t in terms)]


class MemoryBankAttentionMemory:
    """GEAP Memory Bank adapter via ADK's VertexAiMemoryBankService.

    Requires: GOOGLE_CLOUD_PROJECT, GOOGLE_CLOUD_LOCATION and
    WATCHSPAN_AGENT_ENGINE_ID (the Agent Engine / Agent Runtime resource that
    owns the memory store). Created lazily so importing this module never
    needs credentials.
    """

    def __init__(self) -> None:
        from google.adk.memory import VertexAiMemoryBankService

        self._service = VertexAiMemoryBankService(
            project=os.environ["GOOGLE_CLOUD_PROJECT"],
            location=os.environ.get("GOOGLE_CLOUD_LOCATION", "us-central1"),
            agent_engine_id=os.environ["WATCHSPAN_AGENT_ENGINE_ID"],
        )

    @property
    def service(self):
        """The BaseMemoryService for ADK Runner integration."""
        return self._service


def build_attention_memory():
    """Return the best available memory backend."""
    if memory_bank_available():
        return MemoryBankAttentionMemory()
    return LocalAttentionMemory()
