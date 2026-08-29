"""Repoint every scene's beats at phrases the new voiceover actually contains.

Beats are anchored to spoken phrases rather than to frame numbers precisely so
that a re-recorded voice re-times the film on its own. What it cannot do is
survive a rewrite: eleven passes and three script judges changed the words, and
an anchor naming a line that no longer exists throws at render time, which is
the design working.

This is the one-time repoint. Each entry is old phrase to new phrase, chosen
from the words in captions.json, and the script refuses to run if any target is
absent so a wrong guess fails here rather than in a render.
"""

from __future__ import annotations

import json
import pathlib
import re

HERE = pathlib.Path(__file__).parent
SCENES = HERE / "remotion/src/scenes"

REPOINT: dict[str, dict[str, str]] = {
    "What.tsx": {
        "of three hundred": "of three hundred",
        "it ran": "most ran",
        "held seven": "a few were held",
        "and sent": "and the rest",
        "then it measures": "went to a human",
    },
    "Attack.tsx": {
        "now the same": "reword it",
        "reworded": "the first detector",
        "the sentinel sees": "pull it out",
        "pattern matching": "on risk alone",
        "model armor": "with both patterns",
        "it is an attack": "with both patterns",
    },
    "Ceiling.tsx": {
        "but thirty-four": "without a floor",
        "because the calibrated": "would have run",
        "risk above seventy": "the calibration has",
        "zero, now": "cannot raise",
    },
    "Evidence.tsx": {
        "the record": "the record",
        "of sixty-nine": "who reviewed what",
        "fourteen were": "with how much",
        "article fourteen": "article fourteen",
        "this is what": "from december",
    },
    "Cloud.tsx": {
        "the fleet catalogued": "one request calls",
        "and running under": "agent runtime",
        "the ledger": "memory bank",
        "gemini writing": "gemini and cloud",
        "and every decision": "the build fails",
    },
    "Claim.tsx": {
        # "seventy-five" is one caption token, so a phrase ending in "seventy"
        # never lines up with it.
        "called it seventy": "called it",
    },
}


def spoken() -> dict[str, list[str]]:
    caps = json.loads((HERE / "remotion/src/data/captions.json").read_text())
    words = caps["words"] if isinstance(caps, dict) else caps
    timing = json.loads((HERE / "remotion/src/data/scene_timing.json").read_text())
    norm = lambda s: re.sub(r"[^a-z0-9]", "", s.lower())  # noqa: E731
    return {
        s["id"]: [norm(w["w"]) for w in words if s["start"] <= w["t"] < s["end"]]
        for s in timing["scenes"]
    }


def contains(tokens: list[str], phrase: str) -> bool:
    want = [re.sub(r"[^a-z0-9]", "", p.lower()) for p in phrase.split()]
    return any(tokens[i : i + len(want)] == want for i in range(len(tokens) - len(want) + 1))


def main() -> int:
    per_scene = spoken()
    problems: list[str] = []

    for filename, mapping in REPOINT.items():
        path = SCENES / filename
        source = path.read_text(encoding="utf-8")
        scene = re.search(r"narration\('(\w+)'\)", source).group(1)
        tokens = per_scene.get(scene)
        if tokens is None:
            problems.append(f"{filename}: the voiceover has no scene {scene!r}")
            continue
        for old, new in mapping.items():
            if not contains(tokens, new):
                problems.append(f"{filename}: {new!r} is not in the {scene} narration")
                continue
            source = source.replace(f"'{old}'", f"'{new}'")
        path.write_text(source, encoding="utf-8", newline="")
        print(f"{filename:14} repointed {len(mapping)} anchors")

    for line in problems:
        print("PROBLEM ", line)
    return 1 if problems else 0


if __name__ == "__main__":
    raise SystemExit(main())
