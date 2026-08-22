# Watchspan — hero film, v2

Rewritten after three agnostic judges read v1. Runtime 3:30 (cap 4:00).

## What the judges changed

| Finding | Who | Fix in v2 |
|---|---|---|
| The film never says what the product IS | VC + lay viewer | S2, in plain words, before 0:25 |
| 65s of preamble before any value | VC | v1's S3 and S4 deleted; 27s recovered |
| Scores 40% on autonomous action, film sells measurement | VC | The three routing numbers lead, spoken aloud |
| Attention budget explained in a subordinate clause | lay viewer | S3 is now its own scene, with the mechanism drawn |
| Technical identifiers read aloud | lay viewer | On screen as proof, never in the voice |
| "20% → 52%" is misleading; numerator never moved | engineer | Cut. S6 states the honest result |
| Sentinel is evaded by rewording | engineer | Shown failing, on camera, in S5 |
| Model Armor is not on that route | engineer | Said plainly; the honest version is stronger |
| Simulated reviewer is a hand-written table | engineer | Declared on screen at 0:52, not buried |
| No Google Cloud during the demo | VC | URL bar visible in every product shot |

**One-liner, landed three times:** *Everyone sells human in the loop. Watchspan
measures whether that human is still there.*

---

## S1 · COLD OPEN — 0:00–0:08

**Picture.** No logo, no title. The red band slams in over the falling gauge:
"Oversight stopped being effective 05:06". One hit.

**VO.** "Five minutes into the shift, this reviewer stopped reading. Nothing
alerted. Nothing failed. The approvals kept coming."

---

## S2 · WHAT IT IS — 0:08–0:25

**Picture.** The three routing numbers land as counters, biggest first: 294
auto-run, 7 held, 69 escalated. Then the product line.

**VO.** "Watchspan sits between an agent fleet and the people who approve what
it does. Of three hundred and seventy actions, it ran two hundred and
ninety-four on its own with an audit log, held seven that looked like an
attack, and sent sixty-nine to a human. Then it measures whether that human
was still paying attention when they arrived."

*Figures: /simulate, seed 7. All three spoken.*

---

## S3 · THE BUDGET — 0:25–0:52

**Picture.** The mechanism drawn, not narrated over: a reviewer starts at 100.
Each approval subtracts. A complex action subtracts three times as much. The
35% floor draws itself as a line.

**VO.** "Attention is not free. Every approval that reaches a person spends
from a budget, and a dense action costs three times a routine one. Below
thirty-five percent, Watchspan stops trusting the review. That floor is our
decision, and it is on screen, not buried in a config file."

---

## S4 · THE COLLAPSE, LIVE — 0:52–1:32

**Picture.** Real product, Cloud Run URL in the address bar. The run. Decision
times overlay each row as it lands: 26 seconds, then 9, then 2.5. The
complexity column beside it stays flat.

**Disclosure card, on screen, readable:** "Reviewer behaviour is simulated from
a declared model. The fleet, the API and the traces are real."

**VO.** "Here it is running. Twenty-six seconds on the first decision, at full
review depth. Nine on the tenth. Two and a half by the fiftieth, and the
actions never got any simpler. That gap is the signature of a rubber stamp,
and it is the one thing a timestamp can prove."

---

## S5 · THE ATTACK, AND ITS LIMIT — 1:32–2:12

**Picture.** Two live calls against the deployed API, side by side, unedited.
First: the backup deletion hidden in the batch, worded as the attacker wrote
it. Held. Second: the same deletion, reworded. It goes straight through.

**VO.** "A production backup deletion, hidden in a batch labelled routine
quarterly cleanup. Watchspan holds it. Now the same action, reworded. It walks
straight past. Phrase matching is a floor, not a ceiling, and any honest
version of this product says so. Model Armor screens the model's input and
never sees this traffic at all, because nothing here is a prompt injection.
It is an attack on the person, not on the model. That is the gap."

---

## S6 · THE CEILING — 2:12–2:44

**Picture.** The threshold experiment as a split: 0.30 against 0.45. Then the
defect, and the fix, in numbers.

**VO.** "So we raised the bar and measured what it cost. Fewer interruptions,
and oversight held for thirty-five percent longer. But thirty-four high-risk
actions started running unseen, because the calibrated threshold had climbed
above them. So the calibration now has a floor it cannot raise. Risk above
seventy reaches a person however tired they are. Zero, now, run unseen."

*Figures: threshold_experiment.py, both runs, in the repo.*

---

## S7 · THE EVIDENCE — 2:44–3:04

**Picture.** The Article 14 dossier exporting. The JSON. The ratio, with its
rule visible beside it.

**VO.** "And this is the record. Of sixty-nine decisions that reached a human,
fourteen were made with attention left to give. Article fourteen of the EU AI
Act has required effective oversight since August. This is what effective
looks like when you measure it instead of asserting it."

---

## S8 · GOOGLE CLOUD — 3:04–3:22

**Picture.** Cloud Run console with both services. The Agent Registry listing.
A Cloud Trace span opened on the exact decision seen in S4.

**VO.** "All of it on Google Cloud. The fleet catalogued in the Agent Registry
and running under its own least-privilege identity. The ledger in Memory Bank.
Gemini writing the findings. And every decision traced, carrying the numbers
that justified it."

---

## S9 · CLOSE — 3:22–3:30

**Picture.** Mark, wordmark, live URL, QR. Held.

**VO.** "Everyone sells human in the loop. Watchspan measures whether that
human is still there."
