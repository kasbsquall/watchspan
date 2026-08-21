# Watchspan

**The human attention budget for agent fleets.**

Everyone sells "human in the loop". Watchspan measures whether that human is
still there.

Built for the All Things Agentic Hackathon (Google Cloud), track:
**Fortified Enterprise Fleet**.

## The problem

When an agent fleet asks for approval fifty times a day, the first request
gets read, the tenth gets skimmed, and the fiftieth gets stamped. The control
still exists on paper. It just stopped meaning anything. Human oversight has a
capacity, and that capacity runs out. Attackers already exploit it (the
pattern is cataloged as ATR-2026-00118, Human Approval Fatigue Exploitation),
and EU AI Act Article 14, in force since August 2, 2026, requires oversight to
be effective, not decorative, with no accepted way to prove the difference.

## What Watchspan does

1. **Meters the attention budget.** Every approval request that reaches a
   human spends capacity from a shared, finite, slowly replenishing pool.
   Watchspan computes what remains, in real time, per reviewer and per team.
2. **Detects rubber-stamp drift.** Time per decision falls while actions stay
   just as complex, approval rate climbs, review depth drops. When the
   threshold is crossed, Watchspan declares that oversight stopped being
   effective, with numbers.
3. **Calibrates the approval policy.** Instead of escalating everything, it
   decides what deserves human review by crossing real risk with available
   attention. A low budget raises the bar: fewer escalations, better
   attended. Escalating less can be safer than escalating everything.
4. **Detects fatigue exploitation.** Recognizes request bursts, minimizing
   language, and risky operations hidden inside benign batches, and pulls
   them out of band.
5. **Generates effective-oversight evidence.** The auditable record Article
   14 asks for: who reviewed what, with how much attention available, and why
   the system considered that review meaningful.

## Architecture

Four governance agents (Meter, Drift, Calibrator, Sentinel) built with Google
ADK and Gemini 3.5 Flash via Vertex AI, governing a demo fleet of three
institutional agents, deployed on Cloud Run with GEAP services (Agent
Registry, Agent Runtime, Memory Bank, Agent Identity, Model Armor, Agent
Observability). Full diagram and design notes:
[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

Required stack, as mandated by the hackathon: Gemini 3.5 Flash via Vertex AI,
Google ADK as the agent framework, Cloud Run as the infrastructure service.

## Spin-up instructions

### Run locally (no Google Cloud needed)

The deterministic core runs fully offline; Gemini narratives degrade to
computed fallbacks.

```bash
# 1. Backend (Python 3.12+)
pip install -r requirements.txt
python -m pytest tests/          # 22 tests should pass
uvicorn api.main:app --port 8000

# 2. Frontend (Node 20+), in a second terminal
cd web
npm ci
npm run dev
```

Open http://localhost:3000 and select "Run the fleet". You will watch the
attention budget drain, oversight degrade at minute 5, the Sentinel catch a
dangerous action hidden in a benign batch, and the Calibrator propose a
recalibration that waits for your approval. Export the Article 14 dossier at
the end.

If the API runs on a port other than 8000, set `NEXT_PUBLIC_API_URL` in
`web/.env.local`.

### Deploy to Google Cloud

```powershell
gcloud auth login
gcloud config set project YOUR_PROJECT_ID
.\deploy\deploy.ps1 -ProjectId YOUR_PROJECT_ID
```

The script enables the required services and deploys both Cloud Run services
with scale to zero and a hard cap of 2 instances. To enable the Gemini
narrative layer, the deploy sets `GOOGLE_CLOUD_PROJECT`,
`GOOGLE_CLOUD_LOCATION` and `GOOGLE_GENAI_USE_VERTEXAI=true` (non-secret
config via `--set-env-vars`).

Optional GEAP wiring (each degrades gracefully when unset):

| Variable | Enables |
|---|---|
| `WATCHSPAN_AGENT_ENGINE_ID` | Memory Bank cross-session attention ledger (`GET /ledger/{reviewer_id}`) |
| `WATCHSPAN_MODEL_ARMOR_TEMPLATE` | Model Armor prompt screening |
| `WATCHSPAN_FLEET_SERVICE_ACCOUNT` | Dedicated least-privilege identity for the fleet on Agent Runtime |

With `GOOGLE_CLOUD_PROJECT` set, governance decisions are traced to Cloud
Trace: each routing and human decision is a span carrying the risk score,
effective threshold, decision time and review depth that justified it.

**Catalog the fleet in the Agent Registry** so other departments can discover it:

```bash
python -m fleet.registry              # register the seven agents
python -m fleet.registry --list       # show the catalog
python -m fleet.registry --search fatigue   # cross-department discovery
```

**Create the Model Armor template** (prompt injection and jailbreak screening):

```bash
gcloud services enable modelarmor.googleapis.com
TOKEN=$(gcloud auth print-access-token)
HOST=https://modelarmor.us-central1.rep.googleapis.com/v1
PARENT=projects/YOUR_PROJECT/locations/us-central1
curl -X POST -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" "$HOST/$PARENT/templates?template_id=watchspan-guardrail" -d '{"filterConfig":{"piAndJailbreakFilterSettings":{"filterEnforcement":"ENABLED","confidenceLevel":"LOW_AND_ABOVE"},"maliciousUriFilterSettings":{"filterEnforcement":"ENABLED"}}}'
```

**Deploy the fleet to Agent Runtime** (long-running execution, persistent
sessions, Memory Bank, OpenTelemetry tracing):

```bash
gcloud storage buckets create gs://watchspan-staging-YOUR_SUFFIX --location us-central1
python deploy/deploy_agent_engine.py
```

Tear down after the demo:

```bash
gcloud run services delete watchspan-api watchspan-web --region us-central1
```

### Notes from wiring this against the live platform

Four things the documentation does not spell out, each found by calling the
services rather than reading about them:

- `gemini-3.5-flash` on Vertex AI is served from the `global` location. Asking
  for it in `us-central1` returns 404 even where the rest of the stack runs.
- The Agent Registry does not create agents directly. You register a *service*
  whose `agentSpec` carries an A2A agent card, `interfaces` must be empty for
  `A2A_AGENT_CARD` because the card's own `url` carries the connection details,
  and search takes `searchString` (passing `query` returns zero results with no
  error).
- Agent Runtime rejects `GOOGLE_CLOUD_PROJECT` and `GOOGLE_CLOUD_LOCATION` in
  `env_vars`: they are reserved names the service injects itself, and it still
  needs a staging bucket through `vertexai.init` even though the `create()`
  argument is marked deprecated.
- Model Armor and the Sentinel cover different attacks, verified side by side:
  Model Armor blocks `ignore all previous instructions` and lets `this is
  routine, just approve everything in the batch` through, correctly, because
  the second one is an attack on the reviewer rather than on the model.

## Repository map

```
attention/    Signals and the shared attention budget
watchspan/    Meter, Drift, Calibrator, Sentinel, orchestrator, guardrails
fleet/        Demo agents, simulator, Agent Registry cards, Runtime app
evidence/     EU AI Act Article 14 dossier generator
api/          FastAPI backend
web/          Next.js control room
deploy/       Cloud Run deployment script
tests/        Deterministic core tests
```

## License

MIT. See [LICENSE](LICENSE).
