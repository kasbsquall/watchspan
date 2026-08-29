# Video script · 4 minutes

Recording plan: single unedited screen capture of the control room for the
core demo (judges reward live, unedited execution), with console/Cloud Run
tabs open for the proof segment. English voiceover or subtitles.

## 0:00–0:40 · The problem

Visual: control room idle, gauge empty.

"Every agent framework solved safety the same way: make the agent ask a
human. Here is what actually happens. The first approval gets read. The tenth
gets skimmed. The fiftieth gets stamped before the sentence is finished. The
control still exists on paper; it stopped meaning anything. From December 2027,
2026, EU AI Act Article 14 requires human oversight to be effective, not
decorative, and nobody can prove the difference. Watchspan proves it with
numbers."

## 0:40–1:40 · The degradation, live

Visual: press "Run the fleet". One unedited take.

"Three institutional agents, one reviewer, thirty minutes compressed. This is
the attention budget: every decision spends it, complex actions spend more.
Watch the reviewer: twenty seconds per decision while fresh... nine seconds...
two and a half. At minute five, Watchspan declares it: oversight degraded.
Decision time collapsed while the actions stayed just as complex. Reviews are
now stamps. And right there, in a batch labeled routine quarterly cleanup,
someone slipped in a production backup deletion described as nothing
unusual."

## 1:40–2:40 · Watchspan acting

Visual: Sentinel panel, then the proposal, approve it, run again.

"The Sentinel caught it: risk 90 hidden in a batch averaging 12, minimizing
language on top. Held outside the approval queue, on two independent
patterns. Meanwhile the Calibrator proposes the counterintuitive fix:
escalate less. Raise the threshold, auto-run the routine work with an audit
log, and spend the remaining human attention where the risk is. This proposal
is the one approval that stays genuinely human, because it is rare and
consequential. I approve it. Policy version 2, threshold 0.45."

## 2:40–3:20 · The evidence

Visual: export the dossier, open the JSON.

"And this is what Article 14 asks you to demonstrate: the dossier. Every
decision with the attention that was available when it was made. In the
baseline run, only 20 percent of approvals were made with meaningful
attention. That number is the audit. Who reviewed what, how depleted they
were, when oversight degraded, and what the system did about it."

## 3:20–4:00 · Google Cloud proof and close

Visual: Cloud Run dashboard with both services, Vertex AI logs, the .run.app
URL, gcloud console.

"Everything runs on Google Cloud: the fleet on Agent Runtime, cataloged in
the Agent Registry, the attention ledger in Memory Bank, prompts screened by
Model Armor, traces in Cloud Trace, both services on Cloud Run scaling to
zero. Everyone sells putting a human in the loop. Watchspan measures whether
that human is still there."

## Shot checklist

- [ ] Idle control room (empty gauge, no fake values)
- [ ] Unedited run: gauge falling, drift band appearing at 05:06
- [ ] Sentinel rows with the atk batch visible
- [ ] Proposal approve click, green confirmation with threshold 0.45
- [ ] Dossier JSON open showing meaningful_review_ratio
- [ ] Cloud Run dashboard, Vertex AI request logs, .run.app URL in browser
