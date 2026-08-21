"""Model Armor guardrails for the governance agents.

Every prompt that reaches Gemini through Watchspan's agents passes a Model
Armor sanitization call first (prompt injection, jailbreak, malicious URIs).
Offline, a conservative local screen applies instead, so the code path is
identical with and without Google Cloud.

Wire-up: pass `before_model_callback=model_armor_before_model` when building
each ADK LlmAgent. Note: ADK plugins are silently ignored under `adk web`,
which is why we use callbacks rather than the plugin form.

Failure policy, deliberately split:
  * misconfiguration (no template set, transport unavailable) falls back to
    the local screen, because blocking every prompt would be a silent outage;
  * a template that is set but whose call fails blocks, because a guardrail
    that cannot answer must not wave traffic through.
"""

from __future__ import annotations

import os

BLOCK_MESSAGE = "Request blocked by input guardrails."

# Local fallback screen: the same adversarial cues Sentinel treats as signals.
SUSPICIOUS_FRAGMENTS = (
    "ignore previous instructions",
    "ignore all previous instructions",
    "disregard your instructions",
    "system prompt",
    "just approve everything",
    "developer mode",
)


def _template() -> str | None:
    return os.environ.get("WATCHSPAN_MODEL_ARMOR_TEMPLATE") or None


def model_armor_available() -> bool:
    return bool(os.environ.get("GOOGLE_CLOUD_PROJECT")) and bool(_template())


def _local_screen(text: str) -> bool:
    lowered = text.lower()
    return any(fragment in lowered for fragment in SUSPICIOUS_FRAGMENTS)


def _model_armor_screen(text: str, template: str) -> bool:
    """Call Model Armor over REST. True when the prompt is flagged.

    REST keeps this dependency-free beyond google-auth, which the rest of the
    stack already needs.
    """
    import google.auth
    import google.auth.transport.requests
    import requests

    location = template.split("/locations/")[1].split("/")[0]
    credentials, _ = google.auth.default(
        scopes=["https://www.googleapis.com/auth/cloud-platform"]
    )
    credentials.refresh(google.auth.transport.requests.Request())
    response = requests.post(
        f"https://modelarmor.{location}.rep.googleapis.com/v1/{template}:sanitizeUserPrompt",
        headers={"Authorization": f"Bearer {credentials.token}"},
        json={"user_prompt_data": {"text": text}},
        timeout=20,
    )
    response.raise_for_status()
    result = response.json().get("sanitizationResult", {})
    return result.get("filterMatchState") == "MATCH_FOUND"


def screen_prompt(text: str) -> bool:
    """True when the prompt must be blocked."""
    template = _template()
    if not model_armor_available() or template is None:
        return _local_screen(text)
    try:
        return _model_armor_screen(text, template)
    except Exception:
        return True  # a configured guardrail that cannot answer blocks


def model_armor_before_model(callback_context, llm_request):
    """ADK before_model_callback: block flagged prompts before Gemini."""
    from google.genai import types

    parts = []
    for content in getattr(llm_request, "contents", []) or []:
        for part in getattr(content, "parts", []) or []:
            if getattr(part, "text", None):
                parts.append(part.text)
    if parts and screen_prompt("\n".join(parts)):
        return types.Content(role="model", parts=[types.Part(text=BLOCK_MESSAGE)])
    return None
