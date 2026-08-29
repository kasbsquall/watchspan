"""Discover the fleet through the Agent Registry instead of hardcoding it.

WHY. Two reviewers landed on the same criticism from different angles: the
Registry integration was real code that nothing in the running system read. It
registered seven agents from a CLI and then the coordinator built its fleet from
a hardcoded tuple, so the Registry was a side quest rather than architecture.
One of them put the fix precisely: discover the sub-agents via `agents:search`
rather than hardcoding them.

That is what this does. The Registry answers which institutional agents exist
and what each can do; this process instantiates the ones it hosts. Unregister an
agent and it leaves the fleet without a code change, which is the difference
between a catalogue and a list.

The Registry is a discovery mechanism, not an execution one, so an unreachable
Registry must not take the fleet down: discovery degrades to the local profiles
and says so, and the caller can report which of the two it got.
"""

from __future__ import annotations

from dataclasses import dataclass

from fleet.demo_agents import comms_agent, data_ops_agent, procurement_agent
from fleet.demo_agents.base import AgentProfile

# The institutional agents this process is able to run, keyed by the skill id
# their A2A card advertises. The Registry decides which of these take part.
HOSTED: dict[str, AgentProfile] = {
    "procurement-operations": procurement_agent.PROFILE,
    "data-ops-operations": data_ops_agent.PROFILE,
    "comms-operations": comms_agent.PROFILE,
}

SEARCH_TERM = "operations"


@dataclass(frozen=True)
class Discovery:
    profiles: tuple[AgentProfile, ...]
    source: str  # "agent_registry" | "local_fallback"
    detail: str


def discover(search: str = SEARCH_TERM) -> Discovery:
    """Which institutional agents the Registry says exist, that this host can run."""
    try:
        from fleet import registry

        session = registry._session()
        response = session.post(
            f"{registry.API_ROOT}/{registry._parent()}/agents:search",
            json={"searchString": search},
            timeout=20,
        )
        response.raise_for_status()
        found = response.json().get("agents", [])
    except Exception as exc:  # noqa: BLE001 - discovery must never be fatal
        return Discovery(
            profiles=tuple(HOSTED.values()),
            source="local_fallback",
            detail=f"Agent Registry unreachable ({type(exc).__name__}); using local profiles",
        )

    skills = {
        skill.get("id")
        for agent in found
        for skill in agent.get("skills", [])
        if skill.get("id")
    }
    matched = tuple(HOSTED[s] for s in HOSTED if s in skills)
    if not matched:
        return Discovery(
            profiles=tuple(HOSTED.values()),
            source="local_fallback",
            detail=(
                f"Agent Registry answered with {len(found)} agents and none of their "
                "skills are hosted here; using local profiles"
            ),
        )
    names = ", ".join(p.display_name for p in matched)
    return Discovery(
        profiles=matched,
        source="agent_registry",
        detail=f"discovered via agents:search({search!r}): {names}",
    )
