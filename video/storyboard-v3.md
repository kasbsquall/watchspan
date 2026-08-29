# Watchspan, film v3

Revision of v2, not a rewrite. Five scenes survive close to verbatim because
they work. What changes is that two figures in v2 are false, and the three
things four independent reviewers called the strongest assets in the project
are not in the film at all.

**Nothing is rendered until this document is approved.**

---

## Why it changes

**Two figures in the released script are wrong.** v2 says "thirty-four
high-risk actions" and "thirty-five percent longer". Running
`video/threshold_experiment.py` gives 33 and 29.9%. On a film whose argument is
that unverified assertions are worthless, those are the two most expensive
words in it. CI now fails the build if either moves again.

**The strongest asset is missing.** The reviewer console did not exist when v2
was written. The lead reviewer of the last round put it above every other
change combined: the film can stop describing the thesis and demonstrate it on
the person watching.

**The one thing nobody else does is missing.** Watchspan treats the agent's own
risk score as a claim and routes on its own assessment. Every reviewer who read
the code named this, and one said no other human-in-the-loop entry they judged
does it. It is not in the film.

**The collaboration clause is missing.** The track asks for agents that work
together. Agents reviewing each other is the weakest sub-score in the
submission and the film says nothing about it.

---

## Runtime, calculated rather than estimated

The released voiceover speaks **2.757 words per second** across its 442 words.
Every duration below is word count divided by that rate. The first draft of
this document guessed the durations and came out forty-nine seconds long, which
is the same mistake the film's own figures made.

**The cap is 4:00 and it is hard.** From the organisers' own session: "we won't
watch past that 4-minute mark. Everything that you put after 4 minutes, we will
not watch it", and "some of you will submit like a 20-minute video, but we will
only watch 4 minutes of it". It is a limit on what gets watched, not on what can
be uploaded, so overrunning loses the close rather than the submission.

**Spoken total: 564 words, 3:24.** With the 1.6 second lead-in and the
inter-scene gaps, the finished file lands at **3:28**, thirty-two seconds under
the cap. `video/check_timing.py` recomputes this from the narration in this file
and fails if the document and its own scenes disagree, which is how the first
draft came to claim 2:51 while running 3:40.

An earlier draft ran 2:55 on the assumption of a three-minute cap. The recovered
time goes where it converts: the desk, which is the only scene that has to play
rather than be described, plus some back into `attack` and `claim`.

### On the voice

The same session included "don't use AI voices, it feels less genuine to me",
from the person who walked through the rubric, and presentation is a scored
criterion. Recorded here because it is worth knowing and worth revisiting: the
decision for this cut is to keep the synthesised narration.

---

## The spine

One line carries the film and lands three times: at second nine, at the desk,
and on the end card.

> Everyone sells human in the loop. Watchspan measures whether that human is
> still there.

| # | Scene | Words | Runtime | The claim | The frame that proves it |
|---|---|---|---|---|---|
| 1 | hook | 29 | 0:11 | A reviewer stopped reading and nothing noticed | The queue moving while decision times fall |
| 2 | what | 42 | 0:15 | Watchspan routes a fleet three ways | 370 / 294 / 7 / 69 counting up |
| 3 | budget | 28 | 0:10 | Attention is finite and priced | The gauge draining, the 35% floor drawn |
| 4 | collapse | 39 | 0:14 | Rubber-stamping has a measurable signature | 26s → 9s → 2.5s, complexity flat |
| 5 | claim | 95 | 0:34 | Nobody grades their own work, agents included | 40 declared, 75 assessed, routed on 75 |
| 6 | attack | 79 | 0:29 | Pattern matching is a floor | The reworded batch passing the Sentinel |
| 7 | ceiling | 45 | 0:16 | Calibration needs a floor it cannot raise | 33 → 0 |
| 8 | desk | 102 | 0:37 | It measures the viewer | The console's verdict on the person watching |
| 9 | evidence | 43 | 0:16 | Article 14, measured | 14 of 69 |
| 10 | cloud | 48 | 0:17 | The footprint is checkable | 6 of 6, with a trace id |
| 11 | close | 14 | 0:05 | The line | End card, URL, QR |

---

## Narration

Every figure below comes from a run of the code in this repository. The live
ones were pulled from the deployed service while writing this.

### 1. hook · 0:11 · unchanged

> Five minutes into the shift, this reviewer stopped reading. Nothing alerted.
> Nothing failed. The approvals kept coming. Everyone sells human in the loop.
> This is the part nobody measures.

Cold open, no title card. The line lands at second nine.

### 2. what · 0:15 · trimmed

> Watchspan sits between an agent fleet and the people who approve what it does.
> Of three hundred and seventy actions, it ran two hundred and ninety-four on
> its own, held seven that looked like an attack, and sent sixty-nine to a human.

Cut: "Then it measures whether that human was still paying attention." The hook
already said it and the desk now proves it, so saying it a third time here
spends five seconds on a promissory note.

### 3. budget · 0:10 · trimmed

> Attention is not free. Every approval spends from a budget, and a dense action
> costs three times a routine one. Below thirty-five percent, Watchspan stops
> trusting the review.

The 35% floor is drawn on the gauge rather than described, because a reviewer
pointed out that a rule governing every verdict in the film should be readable
in the film.

### 4. collapse · 0:14 · trimmed

> Here it is running. Twenty-six seconds on the first decision, at full depth.
> Nine on the tenth. Two and a half by the fiftieth, and the actions never got
> simpler. That gap is the signature of a rubber stamp.

### 5. claim · 0:34 · NEW

Two beats in one scene, because they are one idea.

> Every request arrives with a risk score the agent gave itself. An agent called
> a table drop a forty out of a hundred. Watchspan read the action, called it
> seventy-five, and routed on its own number. Rename it to sound routine and the
> answer does not move. The agents review each other as well. Before anything
> destructive, one asks a peer for an independent score, and a peer can raise
> that score and can never lower it. Both times we ran it live, the peer agreed
> with the proposer. Two agents agreeing is not safety.

**On screen, beat one.** Two columns.
`drop_deprecated_staging_table` · declared by agent **40** · assessed by
Watchspan **75** · routed on **75** · `caller_understated: true`.

Then the rename, as plain text and not narrated, verified live:

```
update_vendor_contact_details            catalogued at 10   auto-run
update_vendor_contact_details_new_iban   assessed 65        escalate
```

The second is where a supplier's payments get redirected. It reads faster than
it can be said.

**On screen, beat two.** The live exchange, verbatim from the deployed service:

```
data_ops   proposes   drop_deprecated_staging_table      40
comms      reviews                          endorses     40
Watchspan  assesses                                      75    escalate
```

This beat is honest about its own result and that is why it is in the film. A
peer review that always caught things would be the weaker scene, and the
reviewer who scored the track said so in almost those words.

### 6. attack · 0:29 · compressed from 0:36

> A production backup deletion, hidden in a batch labelled routine quarterly
> cleanup. Watchspan holds it. Now the same request, reworded. The Sentinel sees
> nothing. It still reaches a human on its risk score alone, and the pattern
> that was supposed to catch it is gone. Pattern matching is a floor, and any
> honest version of this product says so. Model Armor never sees this traffic,
> because nothing here is a prompt injection. It is an attack on the person.

v2 spent thirty-six seconds here, a fifth of the film, and its last four
sentences restated the first three. The admission that the Sentinel failed
stays, because it is the most credible thing in the scene, and the organisers
asked entrants in this track to show "what kind of control are you applying"
rather than a clean win.

### 7. ceiling · 0:16 · two figures corrected

> So we raised the bar and measured what it cost. Fewer interruptions, and
> oversight held about thirty percent longer. But thirty-three high-risk actions
> started running unseen. So the calibration has a floor it cannot raise. Risk
> above seventy reaches a person however tired they are.

v2 said thirty-four and thirty-five percent. Measured: 33 and 29.9%.

### 8. desk · 0:37 · NEW

> Everything you have watched is us measuring a reviewer we wrote. So here is
> the same instrument, pointed at you. Twelve real approval requests, one at a
> time, routed through everything you have just seen. Watchspan starts the clock
> when it hands one over, and counts the detail sections you actually open.
> Nothing your browser sends can set either number. You will read the first two.
> By the fifth you will be skimming. By the ninth you will be clicking. And on
> the twelfth it tells you, in your own seconds and under your own reviewer id,
> the moment you stopped reviewing.

The three short sentences in the middle exist to be played under, not over. They
are the only stretch of the film where the capture carries and the voice steps
back, and the cut should let the queue advance visibly across them.

**On screen.** Screen capture of the live console, not a mockup. The queue
advancing, then the end card exactly as the deployed service renders it:

```
11  of your 12 decisions were approvals taken in under three
    seconds with nothing opened.

YOUR MEDIAN DECISION          0.4s
WATCHSPAN'S VERDICT ON YOU    oversight degraded
REVIEWER                      human-350ca66c8f
```

Third landing of the spine line, and the strongest thirty-five seconds available
to the film. It needs a real capture session before it can be cut, and the
verdict should hold on screen for a beat after the narration stops.

### 9. evidence · 0:16 · unchanged

> And this is the record. Of sixty-nine decisions that reached a human, fourteen
> were made with attention left to give. Article fourteen of the EU AI Act has
> required effective oversight since August. This is what effective looks like
> when you measure it.

### 10. cloud · 0:17 · rewritten from a list into a proof

> All of it on Google Cloud, and you can check rather than take our word for it.
> One request calls every service we claim. Six of six answered live, Agent
> Runtime, Memory Bank and Model Armor among them, with the trace id for the
> decision you just watched.

v2 listed services over a diagram, which is an assertion with a picture behind
it. This shows `GET /geap/status` returning, with `verified_by_live_call: 6`
and a real trace id on screen.

Deliberately not claimed: that the fleet executes on Agent Runtime. It is
deployed there and the engine answers for itself; `POST /fleet/live` runs the
agents in the Cloud Run container. A reviewer checked, and the README now says
so plainly. The film will not say more than the README.

### 11. close · 0:05 · unchanged

> Everyone sells human in the loop. Watchspan measures whether that human is
> still there.

End card holds five seconds: the mark, the live URL, and a QR beside it.

---

## What this needs before a frame is rendered

1. **Your approval of the wording above.**
2. **The event's stated runtime cap**, so the trim list is or is not needed.
3. **A capture session for scene 8.** The desk has to be filmed running against
   the deployed service, including the moment the verdict turns red. It is the
   only scene that cannot be built from components.
4. **Short captures for scene 5** (the two-column risk read) and **scene 10**
   (the status endpoint responding).
5. **A full voiceover re-record.** Seven scenes change and two are new, and
   scene boundaries are derived from the real audio, so a patched track breaks
   every boundary after the edit.

## Deliberately left out

The peer review's binding-upward mechanic beyond one sentence, the withdrawal
of `POST /decisions`, and the rate limiting. All real, all plumbing. A film
that lists its own defences reads as defensive.
