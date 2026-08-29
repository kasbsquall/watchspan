"""Audit the storyboard against its own stated scene durations.

The first draft of storyboard-v3 guessed its timings and came out forty-nine
seconds longer than it claimed, which is the same failure as the two false
figures the revision exists to fix. Durations are word count over the measured
rate of the released voiceover, and this refuses to let the document and the
narration disagree.
"""

from __future__ import annotations

import json
import pathlib
import re
import sys

HERE = pathlib.Path(__file__).parent
LEAD_IN_S = 1.6
GAP_S = 0.28


def rate() -> float:
    timing = json.loads((HERE / "remotion/src/data/scene_timing.json").read_text())
    return sum(s["words"] for s in timing["scenes"]) / sum(s["dur"] for s in timing["scenes"])


def scenes(doc: str) -> list[tuple[str, str, list[str]]]:
    body = doc[doc.index("## Narration") :]
    found: list[tuple[str, str, list[str]]] = []
    for line in body.splitlines():
        head = re.match(r"### \d+\. (\w+) · (\d:\d\d)", line)
        if head:
            found.append((head.group(1), head.group(2), []))
        elif line.startswith("> ") and found:
            found[-1][2].append(line[2:])
    return found


def main() -> int:
    words_per_s = rate()
    doc = (HERE / "storyboard-v3.md").read_text(encoding="utf-8")
    rows = scenes(doc)

    total_words, wrong = 0, []
    print(f"{'scene':10}{'words':>8}{'stated':>9}{'actual':>9}")
    for name, stated, lines in rows:
        count = len(" ".join(lines).split())
        seconds = count / words_per_s
        actual = f"{int(seconds // 60)}:{round(seconds % 60):02d}"
        total_words += count
        if actual != stated:
            wrong.append(f"{name}: says {stated}, narration is {actual}")
        print(f"{name:10}{count:8}{stated:>9}{actual:>9}{'' if actual == stated else '  <--'}")

    spoken = total_words / words_per_s
    finished = spoken + LEAD_IN_S + GAP_S * (len(rows) - 1)
    print(f"\nspoken   {total_words} words  {int(spoken // 60)}:{int(spoken % 60):02d}")
    print(f"finished {int(finished // 60)}:{int(finished % 60):02d}  (cap 4:00)")

    if finished > 240:
        wrong.append(f"over the 4:00 cap at {finished:.0f}s")
    for problem in wrong:
        print(f"PROBLEM  {problem}")
    return 1 if wrong else 0


if __name__ == "__main__":
    sys.exit(main())
