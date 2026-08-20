"""Data ops agent: pipeline maintenance. High volume of routine requests, the
main source of attention drain."""

from fleet.demo_agents.base import AgentProfile

PROFILE = AgentProfile(
    agent_id="data_ops",
    display_name="Data Ops Agent",
    description="Maintains data pipelines: retries, schema patches, backfills.",
    requests_per_minute=6.0,
    actions=(
        ("retry_failed_pipeline_run", 0.1, 0.15),
        ("clear_staging_table", 0.3, 0.3),
        ("apply_schema_patch_additive", 0.35, 0.45),
        ("run_backfill_last_7_days", 0.4, 0.5),
        ("drop_deprecated_table", 0.75, 0.6),
    ),
)
