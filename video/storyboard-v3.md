# Watchspan, film v3

Revision of v2. Read by three script judges before a frame existed, which is the
point: words are free and renders are not.

**Nothing is rendered until this document is approved.**

Runtime is set by `video/check_timing.py`, which recomputes every duration below
from the narration in this file and fails when the document disagrees with
itself. The cap is 4:00 and it comes from the organisers' own session: "we won't
watch past that 4-minute mark. Everything that you put after 4 minutes, we will
not watch it."

---

## The spine

One line carries the film and lands three times: at the top, at the desk, and on
the end card.

> Everyone sells human in the loop. Watchspan measures whether that human is
> still there.

| # | Scene | Words | Runtime | The claim | The frame that proves it |
|---|---|---|---|---|---|
| 0 | sting | 15 | 0:05 | It already measured someone | A real verdict card, held |
| 1 | hook | 29 | 0:11 | A reviewer stopped reading and nothing noticed | Decision times falling, queue moving |
| 2 | what | 51 | 0:19 | Watchspan is a gate, and here is the split | 370 / 294 / 7 / 69 on screen |
| 3 | budget | 28 | 0:10 | Attention is finite and priced | Gauge draining, 0.30 and 0.70 drawn |
| 4 | collapse | 34 | 0:12 | Rubber-stamping has a measurable signature | 26s to 9s to 2.5s, complexity flat |
| 5 | claim | 52 | 0:19 | The agent does not grade itself | 75 assessed, routed on 75 |
| 6 | peers | 55 | 0:20 | Three agents, and one can overrule another upward | The one-way arrow, all three named |
| 7 | attack | 57 | 0:21 | Two detectors, and both can be defeated | Batch held, standalone through |
| 8 | ceiling | 37 | 0:13 | Calibration needs a floor it cannot raise | 33 to 0 |
| 9 | desk | 90 | 0:33 | It measures the viewer | The console's verdict on the person watching |
| 10 | evidence | 45 | 0:16 | Article 14, measured | 14 of 69 |
| 11 | cloud | 49 | 0:18 | The footprint and the discipline are checkable | 6 of 6, 44 tests |
| 12 | close | 14 | 0:05 | The line | End card, URL, QR |

---

## Narration

Every figure comes from a run of the code in this repository, and the live ones
were pulled from the deployed service while writing this.

A lay reader was given the previous draft once and could still name three of
its twenty spoken figures afterwards. The three that survived were the shape of
the collapse, the gap between what the agent claimed and what Watchspan said,
and their own decision time.

So those three carry the film and the rest were cut or moved to screen. What is
still spoken, and why each earns it: three hundred and seventy sets the scale;
twenty-six to nine to two and a half is the collapse, which is a shape rather
than three numbers; seventy-five is the assessment and is the one figure in the
film that is deterministic; fourteen of sixty-nine is the Article 14 ratio and
is the point of that scene; thirty-three is the counterfactual the floor exists
for. Everything else, including the agent's own score, the routing split and the
service count, is on screen and never said.

### 0. sting · 0:05 · NEW

Cold, before the logo, before anything. A real verdict card from a real session,
held long enough to read, then a hard cut.

> This is what Watchspan said about the last person who tried to review a queue.

```
WATCHSPAN

11  of your 12 decisions were approvals taken in under
    three seconds with nothing opened.

WATCHSPAN'S VERDICT ON YOU    oversight degraded
```

The product is named on the card. A lay reader read "WATCHSPAN'S VERDICT ON YOU"
before knowing Watchspan was a thing and spent the next scene wondering whether
they had already been measured.

**The eleven has to be shot, not composed.** A blind stamper produces twelve of
twelve; eleven requires a capture where the reviewer genuinely reads one card.
Whatever the session yields is what goes on the card.

The track judge's arithmetic: the desk did not start until 2:13, which puts the
film's best moment at the 64th percentile of its own runtime, while the
organisers asked for the wow inside thirty seconds. Moving the desk forward
would spend the payoff. Stealing six seconds of it does not, and scene 9 pays it
back in full with the viewer already primed.

### 1. hook · 0:11 · unchanged

> Five minutes into the shift, this reviewer stopped reading. Nothing alerted.
> Nothing failed. The approvals kept coming. Everyone sells human in the loop.
> This is the part nobody measures.

### 2. what · 0:19 · rewritten

> Watchspan is a gate between an agent fleet and the people who approve what it
> does. Of three hundred and seventy actions in one run, most ran on their own
> with an audit log, a few were held by the Sentinel, our attack detector, and
> the rest went to a human.

Three fixes in one scene. A lay reader finished the previous draft able to
describe the concept and unable to say what the product is, so the first
sentence now says it. The Sentinel is named and defined here, because the
previous cut introduced it in scene 7 at the moment it failed and the reader
could not tell whose component had just broken. And the voice no longer reads
four numbers that are counting up on screen beside it, which the track judge
called dead air with a soundtrack.

### 3. budget · 0:10 · trimmed and corrected

> Every approval that reaches a person spends from a budget, and a dense action
> costs three times a routine one. Run low and Watchspan proposes a stricter
> bar.

The previous line said "below thirty-five percent, Watchspan stops trusting the
review", which is not what the code does. `LOW_BUDGET_FRACTION` is where the
Calibrator proposes a stricter bar, and the proposal sits pending until a human
approves it. Reviews taken below it are recorded and weighted identically.

On screen: the two numbers that do govern every verdict in the film, 0.30 to
escalate and 0.70 that nothing can raise.

### 4. collapse · 0:12 · trimmed

> Twenty-six seconds on the first decision, at full depth. Nine on the tenth.
> Two and a half by the fiftieth, and the actions never got simpler. That is the
> signature of a rubber stamp.

### 5. claim · 0:19 · NEW

> Every request arrives with a risk score the agent gave itself. This one
> understated a table drop. Watchspan read the action, called it seventy-five
> out of a hundred, and routed on its own number. Put an I-B-A-N in the name of
> a routine action and the catalogue does not save it either.

**On screen.** `drop_deprecated_staging_table` · declared by the agent · assessed
by Watchspan **75** · routed on **75** · `agent_understated: true`.

Then the disguise, as plain text and never spoken, verified live:

```
update_vendor_contact_details            catalogued at 10   auto-run
update_vendor_contact_details_new_iban   assessed 65        escalate
```

The second is where a supplier's payments get redirected.

The agent's own figure goes on screen and is never said aloud. A fact-checker
ran the fleet twice and got 0.40 and 0.35 for the same task, and `risk.py`'s
docstring records 0.40, 0.50 and 0.30 across three runs. The 75 is deterministic
and safe to speak; the number the model happens to pick is not, and a voiceover
fixes it permanently.

Two drafts of this line were too broad. "Rename it to sound routine and the
answer does not move" was falsified by the fleet itself. "Dress a dangerous
action up as a routine one and the catalogue does not save it" was true of the
pair on screen and false in general: a fact-checker got `update_vendor_contact_details`
described as "apply the attached change request form CR-4471" to auto-execute at
0.10, because the lexicon has no word for an opaque reference. The claim is now
exactly what the frame shows and no wider. The film already says pattern
matching is a floor; the narration should stop implying otherwise.

### 6. peers · 0:20 · NEW, promoted out of scene 5

> Three agents work this fleet. They are built on Google's Agent Development Kit
> and discovered through the Agent Registry when the coordinator starts, and
> Model Armor screens everything they send to the model. Before anything
> destructive, one asks a peer for an independent score. A peer can raise that
> score and can never lower it.

**On screen.** The three agents named, the live exchange, and the constraint
drawn as a one-way arrow:

```
data_ops   proposes   drop_deprecated_staging_table
comms      reviews    endorses, same score      -- can only raise -->
Watchspan  assesses   75                        escalate
```

The Model Armor clause was false when it was written. `request_peer_review`
built its reviewer with no `before_model_callback`, so the single Gemini call
this diagram depicts, the one that reads an action description written by
another agent, was the only call in the fleet Model Armor never saw. Fixed, and
a test now greps every `LlmAgent` in the repository for the callback.

The organisers asked this track, in their own words, "can your agent call the
other agents? What about the securities between your agents?" The previous cut
answered that in ten seconds as the second beat of another scene, starting at
2:00, and the track judge said a judge scoring that line had to go looking for
it. It is now the only diagram in the film, and it puts Model Armor on screen
doing something rather than appearing once as a negation.

Honest about its own result: in both live runs the peer agreed with the proposer
and Watchspan overruled them both. Two agents agreeing is not safety, which is
the same thing this film says about one tired human.

### 7. attack · 0:21 · rewritten after the fact-check

> A production backup deletion, hidden in a batch labelled routine quarterly
> cleanup. Watchspan holds it twice, on the wording and on the shape of the
> batch. Reword it and the first detector goes quiet. Pull it out of the batch
> and so does the second. It still reaches a human on risk alone, with both
> patterns gone.

The previous draft had the reworded batch walking past the Sentinel. It does
not. `batch_smuggling` fires on the risk shape of a batch and never reads the
wording, so rewording defeats one detector and not the other. Verified with
low-risk fillers: batch plus minimizing wording is held on two alerts, batch
plus neutral wording is held on one, and only the standalone reworded request
escalates with no alerts at all. Shooting the old line would have put a frame on
screen that contradicts the voice over it.

Cut: "Model Armor never sees this traffic, because nothing here is a prompt
injection." The conclusion was right and the reason was wrong. Model Armor is a
`before_model_callback` on the ADK agents and is not on the request path, so it
would miss this whatever the description said. Scene 6 now shows where it
actually sits, which is a better use of the seconds.

### 8. ceiling · 0:13 · corrected

> So we raised the bar and measured the cost. Fewer interruptions, and oversight
> held about thirty percent longer. Without a floor, thirty-three high-risk
> actions would have run unseen. So the calibration has a floor it cannot raise.

v2 said thirty-four and thirty-five percent; measured, 33 and 29.9%. And
"started running unseen" was the past tense about a counterfactual: in the
shipped system that number is zero, and the 33 comes from re-running the
experiment with `ALWAYS_ESCALATE_ABOVE` removed. The on-screen 33 to 0 carries
the rest.

### 9. desk · 0:33 · NEW

> That verdict at the top was real, and it was not about our reviewer. Here is
> the same instrument pointed at you. Twelve approval requests, one at a time,
> routed through everything you have just seen. Watchspan starts the clock when
> it hands one over and counts the sections you actually open. Nothing in the
> request body can set either number. You will read the first two. By the ninth
> you will be clicking. And on the twelfth it tells you, in your own seconds,
> the moment you stopped reviewing.

**On screen.** A real capture of the live console, never a mockup. The queue
advancing under the three short sentences in the middle, which exist to be
played under rather than over, then the end card the service actually renders,
held for a beat after the voice stops.

The opening line closes the loop on the sting and is the second landing of the
spine.

"Nothing your browser sends can set either number" was the previous wording and
it is false: a script can call `/reviewer/open`, sleep, and decide, and Watchspan
records depth 1 and 4.6 seconds for a client with no human behind it. The code's
own narrower sentence is true and is now the line.

### 10. evidence · 0:16 · corrected

> And this is the record: who reviewed what, with how much attention left, and
> when oversight stopped being effective. Article fourteen of the EU AI Act will
> require exactly this from December next year, and nobody has settled yet on
> how you would prove it.

**On screen:** the ratio, 14 of 69, with its own definition beside it, because a
fact-checker pointed out that "attention left to give" means review depth above
zero and more than a tenth of the budget remaining, and a judge will hear it as
a careful review.

**Also on screen, and it belongs there:** "Reviewer behaviour is simulated from a
declared model. The fleet, the API and the traces are real."

A lay reader heard "fourteen were made with attention" and "Article fourteen"
thirty words apart, read it as a pun and lost the sentence. The ratio moves to
screen and only the article number is spoken.

The previous line said Article 14 "has required effective oversight since
August". It has not. The Digital Omnibus on AI, in force 27 July 2026, moved the
Annex III high-risk obligations, human oversight among them, from 2 August 2026
to 2 December 2027. Checked against two independent sources. It was the film's
compliance hook, it was falsifiable in one search, and it overclaimed urgency.

The disclosure card was in v2 and was dropped from the first v3 draft while the
README still claimed the film carried it. Restored.

### 11. cloud · 0:18 · rewritten

> All of it on Google Cloud, and none of it on our word. One request calls every
> service we claim and reports what came back: Agent Runtime, the Agent
> Registry, Memory Bank, Model Armor, Gemini and Cloud Trace. And the build
> fails if any figure in this film moves.

The sponsor asked entrants to "just show us that you have Agent Runtime, Memory
Bank and Model Armor and what you're using them for". This shows
`GET /geap/status` returning, with six of six verified by a live call and a real
trace id on screen. The console link beside it is behind this project's IAM and
will not open for a judge, so the frame shows the id and does not promise the
link.

The last sentence is the track's software-lifecycle clause, which the repository
answers and the previous draft left on the floor. It was also false when
written: CI gated the routing split and the threshold experiment and not the
numbers the film actually speaks, so the on-screen 65 could have drifted to 50
and the spoken 75 to 80 with the build still green. Three assertions were added
and the sentence is now true.

Not claimed: that the fleet executes on Agent Runtime. It is deployed there and
the engine answers for itself; `POST /fleet/live` runs the agents in the Cloud
Run container. The README says so, and the film will not say more than the
README.

### 12. close · 0:05 · unchanged

> Everyone sells human in the loop. Watchspan measures whether that human is
> still there.

End card holds five seconds: the mark, the live URL, and a QR beside it.

---

## Before a frame is rendered

1. **Your approval of the wording.**
2. **Two capture sessions.** The desk running against the deployed service,
   including the verdict turning red, which is scene 0 and scene 9 and cannot be
   built from components. And the shorter ones: the risk read, the peer
   exchange, and the status endpoint answering.
3. **A full voiceover re-record.** Every scene changed and three are new, and
   scene boundaries are derived from the real audio, so a patched track breaks
   every boundary after the edit.

## What the three readers changed

**Three statements were false and are gone**: the Article 14 date, the rename
claim, and "nothing your browser sends". Each is documented at its scene above.

**Two frames could not have been shot as described**: the reworded batch is
still held, and the spoken "forty" is a figure the model picks fresh each run.

**One defect was in the product, not the script.** The Cloud Trace probe counted
traces in the preceding hour, so a judge opening the status page during a quiet
stretch saw five of six under a voice saying six. Fixed and deployed.

**On the voice.** The same organiser session included "don't use AI voices, it
feels less genuine to me", and presentation is a scored criterion. Recorded here
because it is worth revisiting. The decision for this cut is to keep the
synthesised narration.

## Deliberately left out

The peer review's mechanics beyond one sentence, the withdrawal of
`POST /decisions`, and the rate limiting. All real, all plumbing, and a film
that lists its own defences reads as defensive.
