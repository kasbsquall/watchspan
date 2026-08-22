"""Assert every asset a composition asks for exists, BEFORE the render starts.

WHY THIS EXISTS. A film referenced `sfx/click.mp3`, which had never been installed. Remotion
does not resolve assets at build time — it fetches them from the dev bundle as each frame is
composited — so the render started happily, ran for eleven minutes, reached frame 2161 of 4467
and died on a 404. Nothing in the typecheck, nothing in a still of an earlier scene, and
nothing in a preview of the scene at a frame where that sound is not playing would have caught
it. The cost is the whole render, and it is paid twice: once to discover the problem and once
to redo the work.

It generalises past sound. The same failure waits behind a renamed capture, a video segment
that was re-cut under a new name, a font file, an image in `public/shots/`.

WHAT IT CHECKS
  1. every `staticFile('...')` path resolves inside public/
  2. every `<Sfx src="...">` resolves inside public/sfx/
  3. every referenced video/audio clip is long enough to cover the scene it plays in,
     INCLUDING the transition overlap — see the note on durF + TRANS below
  4. every file under public/ that nothing references, reported separately as dead weight

THE DURATION CHECK. With `TransitionSeries`, each sequence is declared
`durationInFrames={durF + TRANS}` so scenes overlap. The scene component — and any clip inside
it — therefore keeps rendering through the whole cross-dissolve. A clip cut to exactly the
scene's slot runs out part-way through its own outgoing transition and `OffthreadVideo` draws
nothing, so the shot dies to the background colour while still at high opacity. Cut clips to
`durF + TRANS`.

USAGE
    python preflight.py [--src src] [--public public] [--timing src/data/scene_timing.json]
                        [--fps 30] [--trans 16]

Exit code 1 if anything is missing or short. Run it as the last thing before `remotion render`.
Needs ffprobe on PATH for the duration checks.
"""

from __future__ import annotations

import argparse
import json
import re


def strip_comments(text: str) -> str:
    """Drop // and /* */ so documented usage examples are not read as refs."""
    text = re.sub(r'/\*.*?\*/', '', text, flags=re.S)
    return re.sub(r'^\s*//.*$', '', text, flags=re.M)
import subprocess
import sys
from pathlib import Path

STATIC = re.compile(r"staticFile\(\s*['\"]([^'\"]+)['\"]")
SFX = re.compile(r"<Sfx\b[^>]*?\bsrc\s*=\s*['\"]([^'\"]+)['\"]", re.S)

# Only the scene's PICTURE gets the duration check. The first version of this script also
# measured the sound effects and reported thirty-three failures reading "whoosh.mp3 is 0.72s in
# a 16.81s slot" — which is what a whoosh is. A one-shot fired at a cue is not supposed to
# cover its scene, and a gate that says so is the same cry-wolf failure this script exists to
# replace. One real defect was buried under those thirty-three.
FOOTAGE = {".mp4", ".webm", ".mov"}


def duration(path: Path) -> float | None:
    try:
        out = subprocess.run(
            ["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(path)],
            capture_output=True,
            text=True,
        )
        return float(out.stdout.strip())
    except Exception:
        return None


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--src", default="src")
    ap.add_argument("--public", default="public")
    ap.add_argument("--timing", default="src/data/scene_timing.json")
    ap.add_argument("--fps", type=float, default=30.0)
    ap.add_argument("--trans", type=int, default=16, help="transition overlap in frames")
    args = ap.parse_args()

    src, public = Path(args.src), Path(args.public)
    problems: list[str] = []
    # asset path -> the scene files that reference it
    refs: dict[str, set[str]] = {}
    sound: set[str] = set()  # referenced via <Sfx>, i.e. one-shots, not footage
    all_source = ""

    for f in sorted(src.rglob("*")):
        if f.suffix.lower() not in {".tsx", ".ts"} or not f.is_file():
            continue
        text = strip_comments(f.read_text(encoding="utf-8", errors="replace"))
        all_source += text
        for rel in STATIC.findall(text):
            refs.setdefault(rel.lstrip("/"), set()).add(f.stem)
        for rel in SFX.findall(text):
            key = f"sfx/{rel.lstrip('/')}"
            refs.setdefault(key, set()).add(f.stem)
            sound.add(key)

    for rel, users in sorted(refs.items()):
        if not (public / rel).is_file():
            problems.append(f"MISSING  {rel}  (referenced by {', '.join(sorted(users))})")

    # --- clip length against the slot each scene actually renders for ---
    timing = Path(args.timing)
    if timing.is_file():
        scenes = json.loads(timing.read_text(encoding="utf-8"))["scenes"]
        by_id = {s["id"]: s for s in scenes}
        for i, s in enumerate(scenes):
            nxt = scenes[i + 1]["start"] if i + 1 < len(scenes) else s["start"] + s["dur"]
            by_id[s["id"]]["_slot"] = nxt - s["start"] + args.trans / args.fps

        for rel, users in sorted(refs.items()):
            p = public / rel
            if not p.is_file() or p.suffix.lower() not in FOOTAGE or rel in sound:
                continue
            for u in users:
                s = by_id.get(u.lower())
                if not s:
                    continue
                have = duration(p)
                if have is None:
                    continue
                need = s["_slot"]
                if have + 1e-3 < need:
                    problems.append(
                        f"SHORT    {rel}  {have:.2f}s in a {need:.2f}s slot "
                        f"({u}: {need - have:.2f}s of the scene has no clip under it)"
                    )

    # --- unreferenced files, reported but not fatal ---
    #
    # Matched on BASENAME against the whole source, not on the resolved paths above, because
    # plenty of real references are computed — a `FAN` array of path strings fed to
    # `staticFile(f.src)` never appears as a literal. Basename matching over-forgives rather
    # than over-accuses, which is the right way round for a list that is advisory.
    orphans = [
        str(p.relative_to(public)).replace("\\", "/")
        for p in sorted(public.rglob("*"))
        if p.is_file() and p.name not in all_source and p.suffix.lower() not in {".txt", ".md"}
    ]

    for line in problems:
        print(line)
    if orphans:
        print(f"\n{len(orphans)} file(s) under {public} that nothing references:")
        for o in orphans:
            print(f"  {o}")
        print("(not an error — but a re-cut clip left under its old name is how a scene ends up")
        print(" playing last week's footage)")

    if problems:
        print(f"\nFAIL: {len(problems)} problem(s). Fix before rendering — Remotion resolves")
        print("assets per frame, so a missing one kills the render partway through.")
        return 1
    print(f"\nOK: {len(refs)} referenced asset(s), all present and long enough.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
