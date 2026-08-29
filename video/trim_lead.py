"""Cut the silent lead off the film and land it on exactly three minutes.

The cut opened on 1.6 seconds of music over black before the voice entered. It
was described as an ocean, badly placed, and it is: the film's argument is that
it opens on the product working, and a dark hold in front of that is the one
thing the restructure was meant to remove.

So the lead comes off the audio and every timestamp shifts with it, rather than
re-synthesising a voiceover whose words have not changed. The tail is then set
so the finished file is 180.00 seconds, which also takes the extra second off
the end card that was noticed at the same time.
"""

from __future__ import annotations

import json
import pathlib
import subprocess
import sys

HERE = pathlib.Path(__file__).parent
DATA = HERE / "remotion/src/data"
AUDIO = HERE / "remotion/public/final_audio.wav"
TIMING_TS = HERE / "remotion/src/timing.ts"

TARGET_S = 180.0
# Nothing in front of the first word. A fifth of a second left five frames of
# the old opening on screen, an attention gauge at 41% flashing before the
# console appeared, which reads as a stuck frame from the previous cut rather
# than as a breath. The film starts on the first word.
KEEP_LEAD_S = 0.0
# What is left after the last word, for the end card and its QR to sit on.
MIN_TAIL_S = 0.3
FPS = 30


def run(*args: str) -> None:
    subprocess.run(args, check=True, capture_output=True)


def main() -> int:
    timing = json.loads((DATA / "scene_timing.json").read_text())
    lead = timing["scenes"][0]["start"]
    shift = lead - KEEP_LEAD_S
    caps = json.loads((DATA / "captions.json").read_text())
    words = caps["words"] if isinstance(caps, dict) else caps

    if shift <= 0:
        print(f"lead is already {lead:.2f}s; nothing more to trim from the front")
        shift = 0

    if shift > 0:
        # Audio first, so a failure here leaves the timings untouched.
        trimmed = AUDIO.with_suffix(".trimmed.wav")
        run("ffmpeg", "-v", "error", "-y", "-ss", f"{shift:.3f}", "-i", str(AUDIO), str(trimmed))
        trimmed.replace(AUDIO)

        for scene in timing["scenes"]:
            scene["start"] = round(scene["start"] - shift, 4)
            scene["end"] = round(scene["end"] - shift, 4)
        timing["vo"] = round(timing["vo"] - shift, 4)
        for w in words:
            w["t"] = round(w["t"] - shift, 4)
            w["e"] = round(w["e"] - shift, 4)
        (DATA / "scene_timing.json").write_text(json.dumps(timing, indent=1), encoding="utf-8")
        (DATA / "captions.json").write_text(json.dumps(caps, indent=1), encoding="utf-8")

    # With the lead gone the speech still ran past three minutes, so the last
    # fraction comes off the pace rather than off a word. Under half a percent
    # is below anything a listener can hear, and it scales every timestamp by
    # one factor, which re-splicing the scene files with shorter gaps would not.
    if timing["vo"] + MIN_TAIL_S > TARGET_S:
        factor = timing["vo"] / (TARGET_S - MIN_TAIL_S)
        print(f"speech runs {timing['vo']:.2f}s; tightening pace by {(factor - 1) * 100:.2f}%")
        faster = AUDIO.with_suffix(".faster.wav")
        run("ffmpeg", "-v", "error", "-y", "-i", str(AUDIO),
            "-filter:a", f"atempo={factor:.6f}", str(faster))
        faster.replace(AUDIO)
        for scene in timing["scenes"]:
            scene["start"] = round(scene["start"] / factor, 4)
            scene["end"] = round(scene["end"] / factor, 4)
            scene["dur"] = round(scene["dur"] / factor, 4)
        timing["vo"] = round(timing["vo"] / factor, 4)
        for w in words:
            w["t"] = round(w["t"] / factor, 4)
            w["e"] = round(w["e"] / factor, 4)
        (DATA / "scene_timing.json").write_text(json.dumps(timing, indent=1), encoding="utf-8")
        (DATA / "captions.json").write_text(json.dumps(caps, indent=1), encoding="utf-8")

    tail = round(TARGET_S - timing["vo"], 3)
    if tail < 0.1:
        print(f"PROBLEM  the voiceover alone runs {timing['vo']:.2f}s, over the target")
        return 1
    source = TIMING_TS.read_text(encoding="utf-8")
    marker = "export const TAIL = "
    start = source.index(marker)
    end = source.index("\n", start)
    source = (
        source[:start]
        + f"// Set by trim_lead.py so the finished film is exactly {TARGET_S:.0f} seconds.\n"
        + f"{marker}{tail};"
        + source[end:]
    )
    TIMING_TS.write_text(source, encoding="utf-8", newline="")

    frames = round((timing["vo"] + tail) * FPS)
    print(f"lead {lead:.2f}s -> {KEEP_LEAD_S:.2f}s, voice ends {timing['vo']:.2f}s")
    print(f"tail {tail:.2f}s, total {frames} frames = {frames / FPS:.2f}s")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
