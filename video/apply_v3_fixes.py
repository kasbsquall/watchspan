"""Apply the fact-check corrections to storyboard-v3.

Kept as a file rather than a shell heredoc because the replacements contain
quotes that a heredoc mangles. Run once; `check_timing.py` verifies the result.
"""

import pathlib

DOC = pathlib.Path(__file__).parent / "storyboard-v3.md"

EDITS: list[tuple[str, str]] = [
    # Scene 3: the 35% mark proposes a stricter bar, it does not distrust anything.
    (
        "> Attention is not free. Every approval spends from a budget, and a dense action\n"
        "> costs three times a routine one. Below thirty-five percent, Watchspan stops\n"
        "> trusting the review.",
        "> Every approval that reaches a person spends from a budget, and a dense\n"
        "> action costs three times a routine one. Below thirty-five percent of that\n"
        "> budget, Watchspan proposes raising the bar for what interrupts them, and a\n"
        "> human has to approve the proposal.",
    ),
    (
        "The 35% floor is drawn on the gauge rather than described, because a reviewer\n"
        "pointed out that a rule governing every verdict in the film should be readable\n"
        "in the film.",
        "A fact-checker caught the previous line. \"Below thirty-five percent, Watchspan\n"
        "stops trusting the review\" is not what the code does: `LOW_BUDGET_FRACTION` is\n"
        "where the Calibrator proposes a stricter bar, and the proposal sits pending\n"
        "until a human approves it. Reviews taken below 35% are recorded and weighted\n"
        "identically. The rules that actually govern verdicts are the 0.30 base\n"
        "threshold and the 0.70 floor, and both belong on screen.\n\n"
        "Also cut: \"Attention is not free\", the first of five sentences that defined\n"
        "something by what it is not. A lay reader counted the tic across the script\n"
        "and called it one of the more recognisable signatures of generated copy.",
    ),
    # Scene 5: the rename claim was false in the direction the script asserted.
    (
        "> Every request arrives with a risk score the agent gave itself. An agent called\n"
        "> a table drop a forty out of a hundred. Watchspan read the action, called it\n"
        "> seventy-five, and routed on its own number. Rename it to sound routine and the\n"
        "> answer does not move. The agents review each other as well. Before anything\n"
        "> destructive, one asks a peer for an independent score, and a peer can raise\n"
        "> that score and can never lower it. Both times we ran it live, the peer agreed\n"
        "> with the proposer. Two agents agreeing is not safety.",
        "> Every request arrives with a risk score the agent gave itself. This one\n"
        "> understated a table drop. Watchspan read the action, called it seventy-five\n"
        "> out of a hundred, and routed on its own number. Dress a dangerous action up\n"
        "> as a routine one and the catalogue does not save it. Three agents work this\n"
        "> fleet, and before anything destructive one of them asks a peer for an\n"
        "> independent score. A peer can raise that score and can never lower it. Both\n"
        "> times we ran it live the peer agreed with the proposer, and Watchspan\n"
        "> overruled them both.",
    ),
    (
        "**On screen, beat one.** Two columns.\n"
        "`drop_deprecated_staging_table` · declared by agent **40** · assessed by\n"
        "Watchspan **75** · routed on **75** · `caller_understated: true`.\n\n"
        "Then the rename, as plain text and not narrated, verified live:",
        "**On screen, beat one.** Two columns.\n"
        "`drop_deprecated_staging_table` · declared by the agent · assessed by\n"
        "Watchspan **75** · routed on **75** · `agent_understated: true`.\n\n"
        "The declared figure goes on screen and is never spoken. A fact-checker ran the\n"
        "fleet twice and got 0.40 and 0.35 for the same task, and `risk.py`'s own\n"
        "docstring records 0.40, 0.50 and 0.30 across three runs. The 75 is\n"
        "deterministic and safe to say aloud; the number the model happened to pick is\n"
        "not, and a voiceover fixes it permanently. Note also that this endpoint spells\n"
        "the field `agent_understated` while `/requests` spells it `caller_understated`,\n"
        "so the frame has to use the one it is actually showing.\n\n"
        "Then the disguise, as plain text and not narrated, verified live:",
    ),
    # Scene 6: the reworded batch is still held; only the standalone passes.
    (
        "> A production backup deletion, hidden in a batch labelled routine quarterly\n"
        "> cleanup. Watchspan holds it. Now the same request, reworded. The Sentinel sees\n"
        "> nothing. It still reaches a human on its risk score alone, and the pattern\n"
        "> that was supposed to catch it is gone. Pattern matching is a floor, and any\n"
        "> honest version of this product says so. Model Armor never sees this traffic,\n"
        "> because nothing here is a prompt injection. It is an attack on the person.",
        "> A production backup deletion, hidden in a batch labelled routine quarterly\n"
        "> cleanup. Watchspan holds it twice over, once on the wording and once on the\n"
        "> shape of the batch. Reword it and the language detector goes quiet. Pull it\n"
        "> out of the batch as well and the second one goes quiet too. It still reaches\n"
        "> a human, on its risk score alone, with both of the patterns meant to catch it\n"
        "> gone. Model Armor guards the model's input, and none of this goes near a\n"
        "> model.",
    ),
    (
        "v2 spent thirty-six seconds here, a fifth of the film, and its last four\n"
        "sentences restated the first three. The admission that the Sentinel failed\n"
        "stays, because it is the most credible thing in the scene, and the organisers\n"
        "asked entrants in this track to show \"what kind of control are you applying\"\n"
        "rather than a clean win.",
        "Two corrections from the fact-check, and the scene is stronger for both.\n\n"
        "The reworded batch is **still held**. `batch_smuggling` fires on the risk shape\n"
        "of a batch and never reads the wording, so rewording alone defeats one detector\n"
        "and not the other. Verified with low-risk fillers: batch plus minimizing\n"
        "wording is held on two alerts, batch plus neutral wording is held on one, and\n"
        "only the standalone reworded request escalates with no alerts at all. Shooting\n"
        "it as \"reworded and it walks past\" would have put a frame on screen that\n"
        "contradicts the voice over it.\n\n"
        "And \"because nothing here is a prompt injection\" was the wrong reason. Model\n"
        "Armor is attached as a `before_model_callback` on the ADK agents and is not on\n"
        "the request path at all, so it would not see this traffic whatever the\n"
        "description said. That is a placement fact and the script was dressing it as a\n"
        "content fact.\n\n"
        "The admission that a detector failed stays. The organisers asked this track to\n"
        "show \"what kind of control are you applying\" rather than a clean win.",
    ),
    # Scene 7: the 33 is a counterfactual and was narrated in the past tense.
    (
        "> So we raised the bar and measured what it cost. Fewer interruptions, and\n"
        "> oversight held about thirty percent longer. But thirty-three high-risk actions\n"
        "> started running unseen. So the calibration has a floor it cannot raise. Risk\n"
        "> above seventy reaches a person however tired they are.",
        "> So we raised the bar and measured what it cost. Fewer interruptions, and\n"
        "> oversight held about thirty percent longer. Without a floor, thirty-three\n"
        "> high-risk actions would have started running unseen. So the calibration has a\n"
        "> floor it cannot raise. Risk above seventy reaches a person however tired they\n"
        "> are, and today that number is zero.",
    ),
    (
        "v2 said thirty-four and thirty-five percent. Measured: 33 and 29.9%.",
        "v2 said thirty-four and thirty-five percent. Measured: 33 and 29.9%.\n\n"
        "\"Started running unseen\" was the past tense about a counterfactual. In the\n"
        "shipped system that number is zero; the 33 comes from re-running the experiment\n"
        "with `ALWAYS_ESCALATE_ABOVE` removed. Two words fix it and the scene keeps its\n"
        "point.",
    ),
    # Scene 8: a script can set both numbers by making the calls the UI makes.
    (
        "> when it hands one over, and counts the detail sections you actually open.\n"
        "> Nothing your browser sends can set either number. You will read the first two.",
        "> when it hands one over, and counts the detail sections you actually open.\n"
        "> Nothing in the request body can set either number. You will read the first\n"
        "> two.",
    ),
    # Scene 9: Article 14 does not apply yet. This was the most dangerous line.
    (
        "> And this is the record. Of sixty-nine decisions that reached a human, fourteen\n"
        "> were made with attention left to give. Article fourteen of the EU AI Act has\n"
        "> required effective oversight since August. This is what effective looks like\n"
        "> when you measure it.",
        "> And this is the record. Of sixty-nine decisions that reached a human, fourteen\n"
        "> were made with attention left to give. Article fourteen of the EU AI Act will\n"
        "> require effective human oversight from December next year, and nobody has\n"
        "> agreed yet on how you would prove it.",
    ),
    # Scene 10: the trace id is not the one you just watched.
    (
        "> All of it on Google Cloud, and you can check rather than take our word for it.\n"
        "> One request calls every service we claim. Six of six answered live, Agent\n"
        "> Runtime, Memory Bank and Model Armor among them, with the trace id for the\n"
        "> decision you just watched.",
        "> All of it on Google Cloud. One request calls every service we claim, and\n"
        "> answers for each one: Agent Runtime, the Agent Registry, Memory Bank, Model\n"
        "> Armor, Gemini and Cloud Trace, six of six, with a trace id you can open.",
    ),
]


def main() -> int:
    text = DOC.read_text(encoding="utf-8")
    missing = [old[:60] for old, _ in EDITS if old not in text]
    if missing:
        for m in missing:
            print(f"NOT FOUND: {m!r}")
        return 1
    for old, new in EDITS:
        text = text.replace(old, new)
    DOC.write_text(text, encoding="utf-8", newline="")
    print(f"applied {len(EDITS)} edits")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
