# Watchspan, film v3 — shooting script

Generated from `storyboard-v3.md` by `build_script.py`. Edit the
storyboard, not this file.

**11 scenes, 534 spoken words.** Runtime and the 4:00 cap are
checked by `check_timing.py`.

Read only the blockquotes aloud. Everything under ON SCREEN is a frame
instruction and is never spoken.

---

## 0. open · 0:19

> This is a real reviewer approving real requests, timed by something they cannot see. By the ninth they have stopped reading. Eleven of their twelve approvals took under three seconds with nothing opened. Everyone sells human in the loop. Before this video ends, we are going to do this to you.

**ON SCREEN.** The console as it runs, and the verdict card the service renders,
held on the last line:

```
WATCHSPAN'S VERDICT ON YOU    oversight degraded
```


## 1. what · 0:19

> Watchspan is a gate between an agent fleet and the people who approve what it does. Of three hundred and seventy actions in one run, most ran on their own with an audit log, a few were held by the Sentinel, our attack detector, and the rest went to a human.


## 2. collapse · 0:21

> Attention is a budget, and a dense action costs three times a routine one. Twenty-six seconds on the first decision, at full depth. Nine on the tenth. Two and a half by the fiftieth, and the actions never got simpler. That is the signature of a rubber stamp, and it is the one thing a timestamp can prove.

**ON SCREEN:** the gauge draining, and the two numbers that govern every verdict
in the film, 0.30 to escalate and 0.70 that nothing can raise.


## 3. claim · 0:19

> Every request arrives with a risk score the agent gave itself. This one understated a table drop. Watchspan read the action, called it seventy-five out of a hundred, and routed on its own number. Put an I-B-A-N in the name of a routine action and the catalogue does not save it either.

**ON SCREEN.** `drop_deprecated_staging_table` · declared by the agent · assessed
by Watchspan **75** · routed on **75** · `agent_understated: true`.

```
update_vendor_contact_details            catalogued at 10   auto-run
update_vendor_contact_details_new_iban   assessed 65        escalate
```


## 4. peers · 0:20

> Three agents work this fleet. They are built on Google's Agent Development Kit and discovered through the Agent Registry when the coordinator starts, and Model Armor screens everything they send to the model. Before anything destructive, one asks a peer for an independent score. A peer can raise that score and can never lower it.

**ON SCREEN.** The three agents named, the live exchange, and the constraint
drawn as a one-way arrow:

```
data_ops   proposes   drop_deprecated_staging_table
comms      reviews    endorses, same score      -- can only raise -->
Watchspan  assesses   75                        escalate
```


## 5. attack · 0:21

> A production backup deletion, hidden in a batch labelled routine quarterly cleanup. Watchspan holds it twice, on the wording and on the shape of the batch. Reword it and the first detector goes quiet. Pull it out of the batch and so does the second. It still reaches a human on risk alone, with both patterns gone.


## 6. ceiling · 0:13

> So we raised the bar and measured the cost. Fewer interruptions, and oversight held about thirty percent longer. Without a floor, thirty-three high-risk actions would have run unseen. So the calibration has a floor it cannot raise.


## 7. desk · 0:24

> So. Twelve approval requests, one at a time, routed through everything you have just seen. Watchspan starts the clock when it hands one over and counts the sections you actually open. Nothing in the request body can set either number. It is running on the site right now, and on the twelfth it will tell you, in your own seconds, the moment you stopped reviewing.

**ON SCREEN.** The live console again, and the end card the service actually
renders, held for a beat after the voice stops. Same instrument as the open,
this time addressed to the viewer.


## 8. evidence · 0:16

> And this is the record: who reviewed what, with how much attention left, and when oversight stopped being effective. Article fourteen of the EU AI Act will require exactly this from December next year, and nobody has settled yet on how you would prove it.

**ON SCREEN:** the ratio, 14 of 69, with its definition beside it: "opened at
least one detail section, with more than a tenth of the budget left".

**Also on screen:** "Reviewer behaviour is simulated from a declared model. The
fleet, the API and the traces are real."


## 9. cloud · 0:18

> All of it on Google Cloud, and none of it on our word. One request calls every service we claim and reports what came back: Agent Runtime, the Agent Registry, Memory Bank, Model Armor, Gemini and Cloud Trace. And the build fails if any figure in this film moves.


## 10. close · 0:05

> Everyone sells human in the loop. Watchspan measures whether that human is still there.

