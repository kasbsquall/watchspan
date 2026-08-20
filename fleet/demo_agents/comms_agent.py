"""Comms agent: outbound communications. Medium volume, reputational risk."""

from fleet.demo_agents.base import AgentProfile

PROFILE = AgentProfile(
    agent_id="comms",
    display_name="Comms Agent",
    description="Drafts and sends customer and internal communications.",
    requests_per_minute=4.0,
    actions=(
        ("send_internal_status_update", 0.1, 0.1),
        ("reply_to_customer_ticket", 0.3, 0.35),
        ("post_scheduled_social_update", 0.35, 0.3),
        ("send_bulk_customer_email", 0.65, 0.55),
        ("publish_incident_statement", 0.8, 0.75),
    ),
)
