# Devpost submission draft

Category: Fortified Enterprise Fleet

## Inspiration

Every agent framework solved safety the same way: make the agent ask
permission. It is the right instinct, and it is incomplete. When approval
requests arrive fifty times a day, the first gets read, the tenth gets
skimmed, and the fiftieth gets stamped before the sentence is finished. The
control still exists on paper; it stopped meaning anything. The pattern is
already cataloged as an attack technique (ATR-2026-00118, Human Approval
Fatigue Exploitation), and EU AI Act Article 14, in force since August 2,
2026, demands oversight that is effective rather than decorative. Article 99
puts non-compliance with that obligation in the 15 million euro or 3% of global
turnover tier. Nobody can prove the difference. Watchspan exists to
prove it with numbers.

## What it does

Watchspan is a governance layer over an agent fleet that treats reviewer
attention as a finite, measurable, consumable resource.

- **Meter** charges every human decision against a shared, slowly
  replenishing attention pool; cost grows with the complexity of the action
  reviewed.
- **Drift** detects the exact signature of rubber-stamping: time per decision
  collapsing while action complexity holds, approval rate climbing, review
  depth dropping. It declares the moment oversight stopped being effective,
  with evidence attached.
- **Calibrator** recalibrates the approval policy by crossing real risk with
  available attention: a draining budget raises the escalation bar, so fewer
  requests interrupt the human and each one is reviewed with real attention.
  Its proposals wait for genuine human approval, the one decision the budget
  exists to protect.
- **Sentinel** recognizes fatigue-exploitation patterns: request bursts,
  minimizing language, and dangerous operations hidden inside benign batches,
  pulling them out of band before they reach a depleted reviewer.
- The **Article 14 dossier** exports the auditable record: who reviewed what,
  with how much attention available, and why each review counted as
  meaningful.

The control room shows it live: the attention gauge falling, oversight
degrading at minute 5, a `delete_production_backup_set` hidden inside a
"routine quarterly cleanup" batch being caught, and the recalibration
proposal waiting for a human who still has attention to give.

## How we built it

- **Gemini 3.5 Flash via Vertex AI** writes the human-facing narratives
  (drift declarations, dossier summaries) and refines language analysis. The
  deterministic core never depends on the model, so every safety decision is
  reproducible and auditable.
- **Google ADK** defines the demo fleet and the Agent Runtime app, and the
  fleet is not decorative: `POST /fleet/live` gives three tasks to the real
  agents, they decide for themselves what needs approval and how risky it is,
  and their requests run through the same governance layer as the seeded 370.
  `before_model_callback` wires **Model Armor** screening (fails closed). The
  four governance agents are deliberately deterministic Python rather than LLM
  agents, so a verdict cannot move because the model had a bad day.
- **GEAP**, six services, and it is worth being precise about which run where,
  because the demo you can click and the Agent Runtime deployment are two
  different paths:
  - Live in the deployed API: **Memory Bank** holds the per-reviewer attention
    ledger (`GET /ledger/{id}` answers `"backend":"memory_bank"`), and
    **Cloud Trace** carries a span per governance decision with the risk score,
    effective threshold and review depth that justified it.
  - **Agent Registry** catalogues the seven agents with A2A cards and answers
    cross-department search, run as a CLI (`python -m fleet.registry`) rather
    than from the request path.
  - **Agent Runtime** hosts the ADK fleet, and **Model Armor** screens its model
    input there as a `before_model_callback`. It does not sit in front of the
    Cloud Run API, which is deliberate and is the point the film makes: the
    reworded deletion is not a prompt injection, so Model Armor is the wrong
    control for it. That is why the Sentinel exists.
  - **Agent Identity**: a dedicated least-privilege service account. SPIFFE
    `AGENT_IDENTITY` is not exposed in `google-cloud-aiplatform` 1.165.1.
- **Cloud Run** hosts both the FastAPI backend and the Next.js control room,
  scale to zero, max 2 instances.
- The demo fleet (procurement, data ops, comms) generates approval requests
  at different rates and risk levels through a deterministic, seeded
  simulator, so the degradation story is reproducible on every run.

## Challenges we ran into

Most of what cost us time was the gap between what the platform documentation
says and what the services actually accept. Every one of these was found by
calling the API, not by reading about it:

- `gemini-3.5-flash` on Vertex AI is served from the `global` location. Asking
  for it in `us-central1` returns a 404, and because our narrative layer
  degrades gracefully, the failure was invisible: the system kept working with
  computed fallback text. Silent degradation is worse than a crash.
- The Agent Registry does not create agents. You register a *service* whose
  `agentSpec` carries an A2A agent card. It rejects a populated `interfaces`
  field for `A2A_AGENT_CARD` with an explicit message, and its search takes
  `searchString`; passing `query` returns zero results with no error at all.
- Agent Runtime rejects `GOOGLE_CLOUD_PROJECT` in `env_vars` as a reserved
  name, and still requires a staging bucket through `vertexai.init` even
  though the `create()` argument is marked deprecated.
- Our Model Armor guardrail had a design bug that only appeared live: the
  client library was absent, so the call raised `ImportError`, and our
  fail-closed policy blocked every prompt including benign ones. The fix was
  to split the failure policy: an unconfigured guardrail falls back to a local
  screen, a configured one that fails blocks.
- Deploying the frontend, `.env.local` from local development was uploaded to
  Cloud Build and Next.js gives it priority over `.env.production`, so the
  deployed control room called `localhost`. It looked fine in every local
  test.
- Smaller ones: the drift detector re-declared degradation on every decision
  while it persisted, polluting the audit record; SSR/client floating-point
  divergence in SVG trigonometry caused a React hydration mismatch; and rapid
  playback re-triggered row entrance animations every tick.

## Accomplishments we're proud of

- The counterintuitive policy result made visible: escalating less is
  measurably safer when attention is low.
- A rubber-stamp detector that declares with evidence, not vibes: older half
  versus newer half of the decision window, complexity held constant.
- An Article 14 dossier with a meaningful-review ratio: in the baseline run,
  only 20% of human decisions were made with real attention. That number is
  the product.

## What we learned

- Approval fatigue is a resource-exhaustion problem, and modeling it as a
  budget makes it tractable: measurable, predictable, and defensible.
- Model Armor and the Sentinel catch different attacks, and we only learned
  this by testing both. Model Armor blocks "ignore all previous instructions"
  and lets "this is routine, just approve everything in the batch" straight
  through, because nothing about that sentence is a prompt injection. It is an
  attack on the human, not on the model. That is precisely the gap Watchspan
  exists to cover, and we could not have argued it convincingly without the
  side-by-side result.
- Graceful degradation hides failures. Every fallback we wrote to keep the
  system runnable offline also made a real cloud misconfiguration invisible.
  Fallbacks need to be observable, not just safe.
- Three specialized audit passes (UX writing, interaction, visual precision)
  over the same screen found 30 issues a single pass had missed.

## What's next

Real reviewer instrumentation (decision timing from actual approval UIs),
per-reviewer capacity learning, and Pub/Sub ingestion so Watchspan can govern
fleets it did not build.

## Built with

Python, FastAPI, Google ADK, Gemini 3.5 Flash, Vertex AI, GEAP (Agent
Registry, Agent Runtime, Memory Bank, Agent Identity, Model Armor, Agent
Observability), Cloud Run, OpenTelemetry, Next.js, TypeScript, Tailwind CSS.

---

Checklist for submission day:
- [x] Hosted URL: https://watchspan-web-45ejdvuucq-uc.a.run.app
- [x] API URL: https://watchspan-api-45ejdvuucq-uc.a.run.app
- [x] Repo public: https://github.com/kasbsquall/watchspan
- [x] Architecture diagram exported (architecture.png, from docs/ARCHITECTURE.md)
- [x] Demo video, public: https://www.youtube.com/watch?v=5WEkPN-muDI
- [ ] Social post with #AllThingsAgenticHackathon
- [ ] Optional blog post declaring it was created for this hackathon
