"""Deploy the Watchspan fleet to GEAP Agent Runtime (Vertex AI Agent Engine).

Agent Runtime is what gives the fleet long-running asynchronous execution,
persistent sessions, Memory Bank, and OpenTelemetry tracing by default. We
use the SDK rather than `adk deploy agent_engine` because the CLI packages a
single agent directory, while Watchspan's fleet imports shared modules
(`fleet`, `watchspan`, `attention`) that must travel with it as
`extra_packages`.

Usage:
    gcloud auth application-default login
    python deploy/deploy_agent_engine.py

Prints the Agent Engine resource ID. Export it as WATCHSPAN_AGENT_ENGINE_ID
to switch the attention ledger onto Memory Bank.
"""

from __future__ import annotations

import os
import sys

PROJECT = os.environ.get("GOOGLE_CLOUD_PROJECT", "gen-lang-client-0094400410")
LOCATION = os.environ.get("GOOGLE_CLOUD_LOCATION", "us-central1")
# The staging bucket holds the packaged agent during deployment. The create()
# argument is deprecated but vertexai.init still requires the value.
STAGING_BUCKET = os.environ.get(
    "WATCHSPAN_STAGING_BUCKET", f"gs://watchspan-staging-{PROJECT.split('-')[-1]}"
)

REQUIREMENTS = [
    "google-adk==2.7.1",
    "google-cloud-aiplatform[agent-engines]==1.165.1",
]
EXTRA_PACKAGES = ["fleet", "watchspan", "attention"]


def main() -> int:
    import vertexai
    from vertexai import agent_engines

    sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    from fleet.agent_app import root_agent

    vertexai.init(project=PROJECT, location=LOCATION, staging_bucket=STAGING_BUCKET)
    print(f"Deploying the Watchspan fleet to Agent Runtime in {LOCATION}...")

    # AdkApp is the wrapper Agent Runtime expects: it exposes the query and
    # streaming operations the service calls, and wires session state.
    app = agent_engines.AdkApp(agent=root_agent, enable_tracing=True)

    remote = agent_engines.create(
        agent_engine=app,
        requirements=REQUIREMENTS,
        extra_packages=EXTRA_PACKAGES,
        display_name="Watchspan governed fleet",
        description=(
            "Three institutional agents whose approval requests are governed "
            "by the Watchspan attention-budget layer."
        ),
        # GOOGLE_CLOUD_PROJECT and GOOGLE_CLOUD_LOCATION are reserved names on
        # Agent Runtime: the service injects them and rejects the deployment if
        # they appear here.
        env_vars={
            "GOOGLE_GENAI_USE_VERTEXAI": "true",
            "WATCHSPAN_MODEL_ARMOR_TEMPLATE": os.environ.get(
                "WATCHSPAN_MODEL_ARMOR_TEMPLATE", ""
            ),
        },
        min_instances=0,
        max_instances=1,
    )
    resource_name = getattr(remote, "resource_name", None) or getattr(
        remote, "api_resource", remote
    )
    print(f"\nDeployed: {resource_name}")
    engine_id = str(resource_name).rstrip("/").split("/")[-1]
    print(f"\nAgent Engine ID: {engine_id}")
    print("Enable the Memory Bank ledger with:")
    print(f'  export WATCHSPAN_AGENT_ENGINE_ID="{engine_id}"')
    print(f"\nTear down after the demo:\n  client.agent_engines.delete(name='{resource_name}', force=True)")
    _ = client
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
