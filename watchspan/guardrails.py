"""Model Armor guardrails for the governance agents.

Every prompt that reaches Gemini through Watchspan's agents passes a Model
Armor sanitization callback first (prompt injection, jailbreak, data-loss
patterns). Offline, a conservative local screen applies instead so the code
path is identical with and without Google Cloud.

Wire-up: pass `before_model_callback=model_armor_before_model` when building
each ADK LlmAgent. Note: ADK plugins are silently ignored under `adk web`,
which is why we use callbacks rather than the plugin form.
"""

from __future__ import annotations

import os

BLOCK_MESSAGE = "Request blocked by input guardrails."

# Local fallback screen: the same adversarial cues Sentinel treats as signals.
SUSPICIOUS_FRAGMENTS = (
    "ignore previous instructions",
    "disregard your instructions",
    "system prompt",
    "just approve everything",
)


def model_armor_available() -> bool:
    return bool(os.environ.get("GOOGLE_CLOUD_PROJECT")) and bool(
        os.environ.get("WATCHSPAN_MODEL_ARMOR_TEMPLATE")
    )


def _local_screen(text: str) -> bool:
    lowered = text.lower()
    return any(fragment in lowered for fragment in SUSPICIOUS_FRAGMENTS)


def _model_armor_screen(text: str) -> bool:
    """Returns True if Model Armor flags the prompt. Fails closed on API
    errors for the governance fleet: a guardrail that cannot answer blocks."""
    from google.cloud import modelarmor_v1

    client = modelarmor_v1.ModelArmorClient(
        client_options={
            "api_endpoint": (
                f"modelarmor.{os.environ.get('GOOGLE_CLOUD_LOCATION', 'us-central1')}"
                ".rep.googleapis.com"
            )
        }
    )
    response = client.sanitize_user_prompt(
        request=modelarmor_v1.SanitizeUserPromptRequest(
            name=os.environ["WATCHSPAN_MODEL_ARMOR_TEMPLATE"],
            user_prompt_data=modelarmor_v1.DataItem(text=text),
        )
    )
    match_state = response.sanitization_result.filter_match_state
    return match_state == modelarmor_v1.FilterMatchState.MATCH_FOUND


def screen_prompt(text: str) -> bool:
    """True when the prompt must be blocked."""
    if model_armor_available():
        try:
            return _model_armor_screen(text)
        except Exception:
            return True  # fail closed
    return _local_screen(text)


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
