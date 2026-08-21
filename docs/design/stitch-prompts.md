# Stitch prompts · Watchspan control room

Project: **Watchspan control room** (`projects/5177816746654766385`) at
[stitch.withgoogle.com](https://stitch.withgoogle.com). Paste each prompt as a
new desktop screen. The three cover the states the product actually moves
through: nothing measured yet, degradation declared, and the human decision.

Shared style block, appended to every prompt so the three screens read as one
system:

> Hairline dividers at 8% opacity. No colored left borders on rows. No card
> inside a card. Radius 2 to 4px only. Ultra-light line icons at a single
> stroke weight. No emojis. No purple or blue gradients. Subtle film grain over
> flat surfaces. Warm near-black background around #16130f, never pure black.
> Single amber accent #e8a33d under 5% of pixels, one alarm red reserved for
> the degradation alert. Archivo for UI text with tight negative tracking on
> headings; monospace with tabular figures for every number.

---

## 1 · Idle, before any run

A dense, quiet enterprise monitoring dashboard called Watchspan. This is the
IDLE state, before any run has started.

Desktop 1440px, generous whitespace between blocks and tight spacing inside
them. Header: small amber uppercase eyebrow "WATCHSPAN" with wide letter
spacing, large heading "Fleet oversight control room", one explanatory
sentence in muted grey, and on the right an amber primary button "Run the
fleet".

Left column 320px: the hero instrument, a large semicircular gauge arc,
currently EMPTY with no value shown, just a faint grey track and a small
calibration tick labelled "35" on the upper left. Caption below reading
"Calibration floor: 35%". Below that, four small statistics labelled Routed,
Escalated, Auto-run, Paused, each showing an em dash instead of a number
because nothing has been measured yet, each with a tiny muted caption. Below
that, a calm status card with a thin green outline circle icon reading
"Oversight holding".

Right column: an empty bordered panel with centred muted text "The attention
budget renders here during a run", and below it a section header "REQUEST
STREAM" in small letterspaced uppercase grey with an empty-state line "No
requests routed yet".

Bottom row, two columns separated by a hairline rule: "Calibrator, policy
proposal" and "Article 14 evidence", each with two lines of muted explanatory
text and a secondary outlined button.

*(append the shared style block)*

---

## 2 · Degraded, mid-run

The same dashboard in the DEGRADED state, the dramatic moment, with a button
reading "Running...".

Left column: the semicircular gauge reading 0% in huge alarm-red monospace
digits, the arc track nearly empty, tick labelled 35 on the upper left. Below,
four statistics in large tabular monospace: Routed 370, Escalated 69, Auto-run
294, Paused 7, each with a tiny muted caption. Below that, an alert card with
a thin red outline and faint red tint reading "Oversight degraded at 05:06"
and a smaller line "Decision time collapsed while action complexity held.
Reviews are now stamps, not judgments." Below that, a section "SENTINEL,
requests held for review" listing four dense rows, each with a monospace
timestamp, an action name in white, and a muted second line with agent name
and risk score.

Right column: a wide line chart titled "ATTENTION BUDGET ACROSS THE RUN" with
an amber line falling steeply from top-left and flattening along the bottom, a
dashed horizontal reference line labelled "35% floor", and a vertical red
marker labelled "oversight degraded 05:06" where the entire region to its
right is tinted faint red. Below it, a dense table titled "REQUEST STREAM"
with eight rows: monospace timestamp, action name in white, muted agent name
underneath, a thin horizontal risk bar with a two-digit number beside it (bars
at 70 and above in amber, the rest grey), and a right-hand label reading
either "to human" or "auto-run, logged" with a tiny line icon.

*(append the shared style block)*

---

## 3 · The human decision

The same dashboard after the run, with a button reading "Run again", the
degraded gauge and chart still on screen, and the bottom row carrying the
weight.

Bottom left panel "CALIBRATOR, POLICY PROPOSAL": a line reading "Raise the
escalation threshold" followed by "0.30 → 0.45" in amber monospace, then two
lines of rationale in muted grey explaining that remaining attention should
concentrate on higher-risk actions because the team budget fell to 32%, below
the 35% floor. Then an amber primary button "Approve recalibration" and an
outlined secondary button "Reject".

Bottom right panel "ARTICLE 14 EVIDENCE": two lines of muted text about who
reviewed what and with how much attention available, a paragraph of generated
audit summary separated by a hairline rule, and an outlined button "Export
dossier (JSON)".

*(append the shared style block)*
