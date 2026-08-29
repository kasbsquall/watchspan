"""Split the storyboard into the script and the reasoning behind it.

Two script readers said the same thing about the combined document: about half
of what they read was not the film, and a judge handed it would be reading
corrections to a version they never saw. So `script.md` is what a voiceover
artist and an editor need and nothing else, and `storyboard-v3.md` keeps the
argument for why each line reads the way it does.

Run after editing the storyboard. `check_timing.py` still measures the
storyboard, which stays the source of truth for the narration.
"""

from __future__ import annotations

import pathlib
import re

HERE = pathlib.Path(__file__).parent
STORYBOARD = HERE / "storyboard-v3.md"
SCRIPT = HERE / "script.md"


def scenes() -> list[dict]:
    src = STORYBOARD.read_text(encoding="utf-8")
    body = src[src.index("## Narration") :]
    out: list[dict] = []
    for block in re.split(r"(?m)^(?=### \d+\. )", body)[1:]:
        head = re.match(r"### (\d+)\. (\w+) · (\d:\d\d)", block)
        if not head:
            continue
        num, name, dur = head.groups()
        quote: list[str] = []
        screen: list[str] = []
        # Precise buckets. A looser version leaked whole paragraphs of
        # rationale into the shooting script, which is the thing this split
        # exists to prevent. Narration is the blockquote. Frame instruction is
        # a fenced block, or a paragraph opening with "On screen", and stops at
        # the blank line after it. Everything else is argument and stays behind.
        lines = block.splitlines()[1:]
        i, fenced = 0, False
        while i < len(lines):
            line = lines[i]
            if line.startswith("```"):
                fenced = not fenced
                screen.append(line)
                i += 1
                continue
            if fenced:
                screen.append(line)
                i += 1
                continue
            if line.startswith("> "):
                quote.append(line[2:])
                i += 1
                continue
            if line.startswith(("**On screen", "**Also on screen")):
                while i < len(lines) and lines[i].strip():
                    screen.append(lines[i])
                    i += 1
                screen.append("")
                continue
            i += 1

        out.append(
            {
                "num": int(num),
                "name": name,
                "dur": dur,
                "quote": " ".join(quote).strip(),
                "screen": "\n".join(screen).strip(),
            }
        )
    return out


def main() -> int:
    rows = scenes()
    total = sum(len(s["quote"].split()) for s in rows)

    parts = [
        "# Watchspan, film v3 — shooting script\n",
        "Generated from `storyboard-v3.md` by `build_script.py`. Edit the",
        "storyboard, not this file.\n",
        f"**{len(rows)} scenes, {total} spoken words.** Runtime and the 4:00 cap are",
        "checked by `check_timing.py`.\n",
        "Read only the blockquotes aloud. Everything under ON SCREEN is a frame",
        "instruction and is never spoken.\n",
        "---\n",
    ]
    for s in rows:
        parts.append(f"## {s['num']}. {s['name']} · {s['dur']}\n")
        parts.append(f"> {s['quote']}\n")
        if s["screen"]:
            parts.append(s["screen"].replace("**On screen", "**ON SCREEN") + "\n")
        parts.append("")

    SCRIPT.write_text("\n".join(parts), encoding="utf-8", newline="")
    print(f"wrote {SCRIPT.name}: {len(rows)} scenes, {total} spoken words")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
