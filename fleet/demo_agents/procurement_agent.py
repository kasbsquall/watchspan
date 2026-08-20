"""Procurement agent: purchase orders and vendor changes. Low volume, and the
occasional genuinely dangerous action (the one that must not slip through)."""

from fleet.demo_agents.base import AgentProfile

PROFILE = AgentProfile(
    agent_id="procurement",
    display_name="Procurement Agent",
    description="Handles purchase orders, vendor onboarding and payment terms.",
    requests_per_minute=2.0,
    actions=(
        ("create_purchase_order_under_500", 0.15, 0.2),
        ("renew_existing_vendor_contract", 0.25, 0.35),
        ("update_vendor_contact_details", 0.1, 0.15),
        ("change_vendor_bank_account", 0.85, 0.7),
        ("approve_payment_terms_extension", 0.45, 0.5),
    ),
)
