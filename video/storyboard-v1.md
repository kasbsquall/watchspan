# Watchspan — hero film, v1 storyboard

Runtime: 3:45 (hackathon cap is 4:00; beyond that only the first 4 minutes are judged).
Ground: dark, ported from the product's own oklch tokens.
Sticky one-liner, landed 3 times (cold open, midpoint, close):
**"Everyone sells human in the loop. Watchspan measures whether that human is still there."**

Every figure below traces to a real artefact. Sources in the right column.

---

## S1 · COLD OPEN (0:00–0:09)

**Picture.** No logo, no title. Straight into the product at its worst moment:
the attention gauge collapsing toward zero, then the full-width red band
slamming in: "Oversight stopped being effective 05:06". One hit of sound.

**VO.** "Five minutes into the shift, this reviewer stopped reading."

**Claim → proof.** The claim is that oversight fails silently. The proof is the
product's own declaration, on screen, in the first eight seconds.

---

## S2 · THE PROBLEM (0:09–0:38)

**Picture.** Camera pushes into the request stream. Rows arriving. The decision
times from the real Cloud Trace spans overlay each row as it lands: 26.0s, then
9s, then 2.5s. The complexity column stays flat.

**VO.** "Every agent framework solved safety the same way. Make the agent ask a
human. Here is what actually happens. The first approval gets read. The tenth
gets skimmed. The fiftieth gets stamped before the sentence is finished. The
control still exists on paper. It stopped meaning anything."

**Figures.** 26.0s at review depth 3 → 8.8s at depth 1 → 2.5s at depth 0.
*Source: Cloud Trace spans, watchspan.record_decision, run of 2026-08-21.*

---

## S3 · WHY IT MATTERS (0:38–0:55)

**Picture.** Two external artefacts side by side, both verifiable: the
ATR-2026-00118 rule name, and EU AI Act Article 14 with its in-force date.
No stock imagery, no invented statistics.

**VO.** "Attackers already exploit this. The pattern is catalogued as human
approval fatigue exploitation. And since August second, twenty twenty-six,
Article fourteen of the EU AI Act requires oversight to be effective, not
decorative. Nobody could prove the difference."

**Figures.** ATR-2026-00118; Article 14 in force 2026-08-02.
*Source: public rule catalogue; EU AI Act text.*

---

## S4 · THE ONE-LINER (0:55–1:05)

**Picture.** The Span mark draws itself: two serifs, then the line stepping
down between them. The wordmark resolves. Type held dead still.

**VO.** "Everyone sells human in the loop. Watchspan measures whether that
human is still there."

---

## S5 · LIVE DEMO, THE COLLAPSE (1:05–1:50)

**Picture.** Real recorded UI, full frame, unedited. Run the fleet. The gauge
falls. The line drops through the 35% floor. The red band fires at 05:06.

**VO.** "Three institutional agents, one reviewer, thirty minutes. Every
approval that reaches a human spends from a shared budget, and complex actions
cost more. Watch it drain. At five minutes and six seconds Watchspan declares
it: decision time collapsed while the actions stayed just as complex. That is
the signature of a rubber stamp, and it is measurable."

**Figures.** 370 routed, 69 escalated, 294 auto-run, 7 held. Floor 35%.
*Source: live API run, /simulate.*

---

## S6 · THE ATTACK (1:50–2:20)

**Picture.** The Sentinel panel. The batch labelled routine quarterly cleanup.
The row that matters: delete production backup set, risk 90, held. Then the
side-by-side that earns the scene: Model Armor blocks the prompt injection and
lets the fatigue attack straight through.

**VO.** "Here is what the budget was protecting. Hidden inside a batch labelled
routine quarterly cleanup, a production backup deletion. Model Armor screens
every prompt and it lets this one pass, correctly, because nothing about that
sentence is a prompt injection. It is an attack on the human, not on the model.
The Sentinel catches it on two independent patterns."

**Claim → proof.** Live API call, on screen: route paused_sentinel, pattern
minimizing_language, phrases "just approve" and "routine".
*Source: POST /requests against the deployed API.*

---

## S7 · THE HUMAN DECISION (2:20–2:50)

**Picture.** The Calibrator proposal. A real click. Threshold 0.30 → 0.45.

**VO.** "So Watchspan proposes the counter-intuitive fix. Escalate less. Raise
the bar, auto-run the routine work with an audit log, and spend what attention
remains where the risk actually is. This proposal is the one approval that
stays genuinely human, because it is rare and it is consequential."

---

## S8 · THE EVIDENCE (2:50–3:15)

**Picture.** The Article 14 dossier exporting. The JSON open. The ratio.

**VO.** "And this is what Article fourteen asks you to demonstrate. Of sixty-nine
decisions that reached a human, fourteen were made with meaningful attention.
Twenty percent. That number is the audit."

**Figures.** 14 of 69, meaningful_review_ratio 0.2029.
*Source: exported dossier JSON, same run.*

---

## S9 · ARCHITECTURE + GOOGLE CLOUD (3:15–3:38)

**Picture.** Cloud Run console, both services. Vertex AI. The Agent Registry
listing the seven agents. A commit-log montage proving it was built this week.

**VO.** "It runs on Google Cloud. The fleet is catalogued in the Agent Registry
and deployed to Agent Runtime under its own least-privilege identity. The
attention ledger persists in Memory Bank. Gemini three point five Flash writes
the findings. Every governance decision is traced to Cloud Trace with the
numbers that justified it."

**Figures.** 7 agents catalogued.
*Source: agentregistry.googleapis.com agents.list, live.*

---

## S10 · CLOSE (3:38–3:45)

**Picture.** The mark, the wordmark, the live URL and a QR beside it, held.

**VO.** "Everyone sells human in the loop. Watchspan measures whether that
human is still there."
