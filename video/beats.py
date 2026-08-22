"""Extract a beat map from the music track so cuts and punch-ins land ON the beat.

Usage: python beats.py <music.mp3> [out_beats.json]

Writes beats.json: {"bpm": float, "beats": [seconds...]}. Copy it into
remotion/src/data/beats.json and use src/lib/beats.ts (onBeatLocal, nextBeat,
beatPulse) to snap punch-ins, SFX hits, and transitions to the beat.

Prefers librosa (pip install librosa) for real beat tracking; falls back to ffmpeg
onset detection (silencedetect on the inverted envelope is unreliable, so the fallback
uses the ebur128 momentary loudness peaks) if librosa is missing.
"""
import json, subprocess, sys
from pathlib import Path

src = sys.argv[1]
out = Path(sys.argv[2] if len(sys.argv) > 2 and not sys.argv[2].startswith("--") else "beats.json")

try:
    import numpy as np
    import librosa
    y, sr = librosa.load(src, sr=None, mono=True)
    tempo, beat_frames = librosa.beat.beat_track(y=y, sr=sr)
    beats = [round(float(t), 3) for t in librosa.frames_to_time(beat_frames, sr=sr)]
    bpm = round(float(np.atleast_1d(tempo)[0]), 1)
    method = "librosa"
except Exception as e:  # ImportError or a runtime decode failure — fall back to ffmpeg
    if not isinstance(e, ImportError):
        print(f"librosa failed ({type(e).__name__}: {e}), falling back to ffmpeg")
    # Fallback: parse ebur128 momentary loudness, take local maxima above the median
    # as pseudo-beats. Cruder than librosa, still good enough to snap cuts to.
    r = subprocess.run(
        ["ffmpeg", "-i", src, "-af", "ebur128=metadata=1", "-f", "null", "-"],
        capture_output=True, text=True)
    pts = []
    for line in r.stderr.splitlines():
        if " M:" in line and " t:" in line:
            try:
                t = float(line.split("t:")[1].split()[0])
                m = float(line.split(" M:")[1].split()[0])
                pts.append((t, m))
            except (ValueError, IndexError):
                continue
    if not pts:
        raise SystemExit("ffmpeg fallback produced no loudness points; install librosa")
    vals = sorted(m for _, m in pts)
    thr = vals[len(vals) // 2] + 1.5
    beats, last = [], -1.0
    for i in range(1, len(pts) - 1):
        t, m = pts[i]
        if m > thr and m >= pts[i - 1][1] and m >= pts[i + 1][1] and t - last > 0.3:
            beats.append(round(t, 3)); last = t
    bpm = round(60.0 * (len(beats) - 1) / (beats[-1] - beats[0]), 1) if len(beats) > 1 else 0.0
    method = "ffmpeg-ebur128"

# Only seconds are stored; src/lib/beats.ts recomputes frames from the composition's
# own FPS constant, so a beats.json generated at a different fps can never desync.
out.write_text(json.dumps({"bpm": bpm, "method": method, "beats": beats}, indent=1))
note = "" if method == "librosa" else " (fallback: BPM estimate unreliable on dense tracks; prefer `pip install librosa`)"
print(f"{method}: {len(beats)} beats, ~{bpm} BPM -> {out}{note}")
