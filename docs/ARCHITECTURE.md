# Watchspan architecture

_Working draft. The final version ships with the architecture diagram required by the hackathon submission._

## Layers

1. **Demo fleet** (`fleet/`): three institutional agents (procurement, data ops, comms) generating approval requests at different rates and risk levels, cataloged in the Agent Registry, running long asynchronous work.
2. **Governance agents** (`watchspan/`): Meter, Drift, Calibrator, Sentinel. ADK + Gemini via Vertex AI.
3. **Attention model** (`attention/`): decision signals (time per decision, approval rate, review depth), shared budget computation.
4. **Evidence** (`evidence/`): EU AI Act Article 14 effective-oversight dossier generator.
5. **API** (`api/`): FastAPI backend, deployed on Cloud Run (scale to zero).
6. **Frontend** (`web/`): Next.js + TypeScript + Tailwind control room.

## State and memory

Firestore (or Cloud SQL) for the shared attention ledger; Memory Bank for cross-session history.

## Security and governance

Agent Identity (zero-trust per agent), Agent Gateway (routing + calibrated policy enforcement), Model Armor (input guardrails), Secret Manager for credentials. Observability via OpenTelemetry.
