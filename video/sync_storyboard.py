"""Make the storyboard agree with itself.

The spine table has now drifted from the narration three times: after the first
draft guessed its durations, after the fact-check corrections lengthened four
scenes, and again after the restructure renumbered everything. It is the same
failure as the two false figures the revision exists to fix, one level up.

So durations and word counts are computed from the narration and written back
into both the scene headings and the table. The prose columns are preserved by
scene name, and a scene the table has never seen gets a row to fill in.
"""

from __future__ import annotations

import pathlib
import re

import check_timing as ct

HERE = pathlib.Path(__file__).parent
DOC = HERE / "storyboard-v3.md"

# Prose for scenes the table has not carried before.
NEW_ROWS = {
    "open": ("It measures a real person, and promises to measure you",
             "Live console, times falling, the card turning red"),
}


def main() -> int:
    doc = DOC.read_text(encoding="utf-8")
    rate = ct.rate()
    rows = ct.scenes(doc)

    # Keep whatever the current table says about each scene's claim and frame.
    prose: dict[str, tuple[str, str]] = dict(NEW_ROWS)
    for line in doc.splitlines():
        cells = [c.strip() for c in line.split("|")]
        if len(cells) == 8 and cells[2] not in ("Scene", "---"):
            prose.setdefault(cells[2], (cells[5], cells[6]))

    table = [
        "| # | Scene | Words | Runtime | The claim | The frame that proves it |",
        "|---|---|---|---|---|---|",
    ]
    for index, (name, stated, lines) in enumerate(rows):
        words = len(" ".join(lines).split())
        seconds = words / rate
        actual = f"{int(seconds // 60)}:{round(seconds % 60):02d}"
        doc = re.sub(
            rf"(?m)^(### {index}\. {name} · ){re.escape(stated)}",
            rf"\g<1>{actual}",
            doc,
            count=1,
        )
        claim, frame = prose.get(name, ("TODO", "TODO"))
        table.append(f"| {index} | {name} | {words} | {actual} | {claim} | {frame} |")

    doc = re.sub(
        r"(?ms)^\| # \| Scene \|.*?(?=\n\n)",
        "\n".join(table),
        doc,
        count=1,
    )
    DOC.write_text(doc, encoding="utf-8", newline="")

    total = sum(len(" ".join(l).split()) for _, _, l in rows)
    spoken = total / rate
    finished = spoken + ct.LEAD_IN_S + ct.GAP_S * (len(rows) - 1)
    print(f"{len(rows)} scenes, {total} words, spoken {spoken:.0f}s, finished {finished:.0f}s")
    missing = [n for n, _, _ in rows if prose.get(n, ("TODO",))[0] == "TODO"]
    if missing:
        print("table rows still TODO:", missing)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
