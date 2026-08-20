"""Thin Gemini wrapper for the governance agents' reasoning layer.

The deterministic core (meter, drift, calibrator, sentinel) never depends on
the model. Gemini writes the human-facing narratives (drift declarations,
proposal rationales, dossier summaries) and refines language analysis. When
Vertex AI credentials are absent, everything degrades to offline mode so the
system stays fully runnable locally.
"""

from __future__ import annotations

import os

MODEL = "gemini-3.5-flash"


def available() -> bool:
    return bool(os.environ.get("GOOGLE_CLOUD_PROJECT")) and (
        os.environ.get("GOOGLE_GENAI_USE_VERTEXAI", "").lower() in ("1", "true")
    )


def narrate(prompt: str, fallback: str) -> str:
    """Ask Gemini for a short narrative; return fallback text offline."""
    if not available():
        return fallback
    try:
        from google import genai

        client = genai.Client(
            vertexai=True,
            project=os.environ["GOOGLE_CLOUD_PROJECT"],
            location=os.environ.get("GOOGLE_CLOUD_LOCATION", "us-central1"),
        )
        response = client.models.generate_content(model=MODEL, contents=prompt)
        text = (response.text or "").strip()
        return text or fallback
    except Exception:
        return fallback
