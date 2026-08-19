# Watchspan

**The human attention budget for agent fleets.**

Everyone sells "human in the loop". Watchspan measures whether that human is still there.

Built for the All Things Agentic Hackathon (Google Cloud), track: **Fortified Enterprise Fleet**.

## The problem

When an agent fleet asks for approval fifty times a day, the first request gets read, the tenth gets skimmed, and the fiftieth gets stamped. The control still exists on paper. It just stopped meaning anything. Human oversight has a capacity, and that capacity runs out.

## What Watchspan does

1. **Meters the attention budget.** Every approval request that reaches a human spends capacity from a shared, finite pool. Watchspan computes what remains, in real time, per reviewer and per team.
2. **Detects rubber-stamp drift.** Time per decision falls while actions stay just as complex, approval rate climbs, review depth drops. When the threshold is crossed, Watchspan declares that oversight stopped being effective, with numbers.
3. **Calibrates the approval policy.** Instead of escalating everything, it decides what deserves human review by crossing real risk with available attention. Low budget raises the bar: fewer escalations, better attended.
4. **Detects fatigue exploitation.** Recognizes the patterns cataloged as ATR-2026-00118: request bursts, minimizing language, risky operations hidden inside benign batches.
5. **Generates effective-oversight evidence.** The auditable record that EU AI Act Article 14 requires: who reviewed what, with how much attention available, and why the system considered that review meaningful.

## Architecture

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md). Four governance agents (Meter, Drift, Calibrator, Sentinel) built with Google ADK + Gemini via Vertex AI, governing a demo fleet of institutional agents, deployed on Cloud Run.

## Spin-up instructions

_To be completed as the project is built (Step 8)._

## License

MIT. See [LICENSE](LICENSE).
