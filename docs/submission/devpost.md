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
2026, demands oversight that is effective rather than decorative, with fines
up to 40 million euros. Nobody can prove the difference. Watchspan exists to
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
- **Google ADK** defines the fleet and governance agents;
  `before_model_callback` wires **Model Armor** screening (fails closed).
- **GEAP**: Agent Registry cards for cross-department discovery, Agent
  Runtime deployment via `adk deploy agent_engine`, Memory Bank for the
  cross-session attention ledger, Agent Identity per agent, OpenTelemetry
  observability on by default.
- **Cloud Run** hosts both the FastAPI backend and the Next.js control room,
  scale to zero, max 2 instances.
- The demo fleet (procurement, data ops, comms) generates approval requests
  at different rates and risk levels through a deterministic, seeded
  simulator, so the degradation story is reproducible on every run.

## Challenges we ran into

- Tuning the burst detector so machine-speed attack bursts trip it while
  normal fleet cadence never does.
- The drift detector originally re-declared degradation on every decision
  while it persisted, polluting the audit record; it now declares only on the
  transition.
- SSR/client floating-point divergence in SVG trigonometry caused a React
  hydration mismatch, fixed by rounding coordinates.
- Rapid playback broke digit-transition animations and re-triggered row
  entrance choreography every tick; both needed live-mode variants.

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
- [ ] Hosted URL (Cloud Run web service, may be torn down after judging proof)
- [ ] Repo URL public (or shared with testing@devpost.com and cloudhackathons@google.com)
- [ ] Architecture diagram image exported from docs/ARCHITECTURE.md mermaid
- [ ] 4-minute video on YouTube, public, showing Google Cloud console
- [ ] Social post with #AllThingsAgenticHackathon
- [ ] Optional blog post declaring it was created for this hackathon
