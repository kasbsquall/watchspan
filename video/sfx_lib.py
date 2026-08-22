"""Pick sound effects from a local CC0 library by MEASUREMENT, not by filename.

    python sfx_lib.py list                       # every sound, with its acoustic profile
    python sfx_lib.py find --role stamp          # rank candidates for a role
    python sfx_lib.py install <role> <file> <out_dir> [--gain -6] [--trim 0.7]

WHY A LIBRARY INSTEAD OF SYNTHESIS: sounds generated from noise and sine sweeps come out
thin and synthetic, and a viewer hears that instantly even when they cannot say why. A
recorded impact carries a transient, a body and a room that no three-line numpy expression
reproduces. Earlier cuts of a film used synthesised effects and every one of them was
rejected by ear.

THE LIBRARY (download once, reuse across every project):
  assets/sfx-lib/kenney_interface   100 UI sounds   CC0-1.0
  assets/sfx-lib/kenney_impact      130 impacts     CC0-1.0

CC0 is a public-domain dedication: commercial use, no attribution, no share-alike, no
account. That matters for a hackathon, where an entry can be disqualified over a music or
effects licence. Verify the licence file ships with the pack and keep it in the repo.

Other CC0-only sources worth adding, all direct-download and account-free:
  kenney.nl/assets            — filter to the audio packs, all CC0-1.0
  freesound.org               — has a CC0 filter, but needs an API key and per-file checks
  sonniss.com/gameaudiogdc    — free annual bundles, royalty-free, huge, but a slow download
Avoid anything labelled only "free": Mixkit and Zapsplat are free to use but are NOT public
domain, and their terms change.

PICKING BY MEASUREMENT: this prints duration, spectral centroid (brightness), the share of
energy below 500 Hz (weight), and crest factor (how transient versus how sustained). A
rubber stamp is short, heavy and dry: under 400 ms, centroid under 1.5 kHz, low-band share
above 0.35. A refusal that is bright and long is the buzzer sound everyone hates.

Needs: ffmpeg, ffprobe, numpy.
"""
import json
import shutil
import subprocess
import sys
from pathlib import Path

import numpy as np

LIB = Path(__file__).resolve().parent.parent / "assets" / "sfx-lib"

# What each role should measure like. Ranking is a distance to this target, so the choice
# is arguable instead of a guess — and reproducible when the library grows.
ROLES = {
    # short, heavy, dry: a stamp biting paper, not a game-over buzzer
    "stamp": {"dur": (0.10, 0.55), "centroid": (200, 1600), "low": (0.30, 1.0), "crest": (6, 40)},
    # a refusal must read as weight, never as a shrill alarm
    "reject": {"dur": (0.15, 0.70), "centroid": (200, 1800), "low": (0.25, 1.0), "crest": (5, 40)},
    # affirmation: bright and clean, but short enough not to sing
    "confirm": {"dur": (0.15, 0.80), "centroid": (1200, 4500), "low": (0.0, 0.4), "crest": (4, 30)},
    "click": {"dur": (0.02, 0.20), "centroid": (1500, 6000), "low": (0.0, 0.5), "crest": (6, 40)},
    "pop": {"dur": (0.03, 0.30), "centroid": (600, 3500), "low": (0.1, 0.7), "crest": (5, 40)},
    "whoosh": {"dur": (0.20, 1.20), "centroid": (400, 3000), "low": (0.1, 0.7), "crest": (2, 12)},
    "impact": {"dur": (0.10, 0.90), "centroid": (150, 1400), "low": (0.35, 1.0), "crest": (5, 40)},
}


def profile(p: Path) -> dict | None:
    """Decode to mono float and describe the sound in four numbers."""
    try:
        raw = subprocess.run(
            ["ffmpeg", "-v", "quiet", "-i", str(p), "-ac", "1", "-ar", "44100", "-f", "f32le", "-"],
            capture_output=True,
            check=True,
        ).stdout
    except Exception:
        return None
    x = np.frombuffer(raw, dtype=np.float32)
    if x.size < 1024:
        return None

    peak = float(np.abs(x).max()) or 1e-9
    rms = float(np.sqrt(np.mean(x**2))) or 1e-9

    # duration of the audible part, not of the file — trailing silence lies about length
    env = np.abs(x)
    audible = np.nonzero(env > peak * 0.02)[0]
    dur = float((audible[-1] - audible[0]) / 44100) if audible.size > 1 else x.size / 44100

    spec = np.abs(np.fft.rfft(x * np.hanning(x.size)))
    freqs = np.fft.rfftfreq(x.size, 1 / 44100)
    total = float(spec.sum()) or 1e-9

    return {
        "file": p.name,
        "path": str(p),
        "dur": round(dur, 3),
        "centroid": round(float((spec * freqs).sum() / total), 1),
        "low": round(float(spec[freqs < 500].sum() / total), 3),
        "crest": round(peak / rms, 1),
    }


def score(pr: dict, role: str) -> float:
    """Distance to the role's target window. 0 means it lands inside every band."""
    d = 0.0
    for key, (lo, hi) in ROLES[role].items():
        v = pr["dur" if key == "dur" else key]
        span = hi - lo or 1
        if v < lo:
            d += (lo - v) / span
        elif v > hi:
            d += (v - hi) / span
    return round(d, 3)


def scan() -> list[dict]:
    if not LIB.exists():
        raise SystemExit(f"library missing: {LIB}\nSee the module docstring for the CC0 packs to fetch.")
    out = []
    for p in sorted(LIB.rglob("*")):
        if p.suffix.lower() in {".ogg", ".wav", ".mp3", ".flac"}:
            pr = profile(p)
            if pr:
                out.append(pr)
    return out


def install(role: str, name: str, out_dir: Path, gain: float, trim: float):
    """Copy one library sound into a project as a normalised MP3 named for its role."""
    hit = next((p for p in LIB.rglob("*") if p.name == name), None)
    if not hit:
        raise SystemExit(f"not in library: {name}")
    out_dir.mkdir(parents=True, exist_ok=True)
    dst = out_dir / f"{role}.mp3"
    af = f"atrim=0:{trim},volume={gain}dB,afade=t=out:st={max(trim - 0.06, 0.02)}:d=0.06"
    subprocess.run(
        ["ffmpeg", "-y", "-v", "error", "-i", str(hit), "-af", af, "-ar", "44100", "-ac", "2", "-b:a", "192k", str(dst)],
        check=True,
    )
    print(f"{name}  ->  {dst}  ({gain:+g} dB, {trim}s)")


def main():
    if len(sys.argv) < 2:
        raise SystemExit(__doc__)
    cmd = sys.argv[1]

    if cmd == "install":
        role, name, out = sys.argv[2], sys.argv[3], Path(sys.argv[4])
        g = float(sys.argv[sys.argv.index("--gain") + 1]) if "--gain" in sys.argv else 0.0
        t = float(sys.argv[sys.argv.index("--trim") + 1]) if "--trim" in sys.argv else 1.0
        return install(role, name, out, g, t)

    rows = scan()

    if cmd == "find":
        role = sys.argv[sys.argv.index("--role") + 1]
        if role not in ROLES:
            raise SystemExit(f"roles: {', '.join(ROLES)}")
        ranked = sorted(((score(r, role), r) for r in rows), key=lambda t: t[0])[:14]
        print(f"best candidates for '{role}'  (target {ROLES[role]})\n")
        print(f"{'fit':>6} {'file':34s} {'dur':>6} {'centroid':>9} {'low':>6} {'crest':>6}")
        for s, r in ranked:
            print(f"{s:>6.2f} {r['file']:34s} {r['dur']:>6.3f} {r['centroid']:>9.0f} {r['low']:>6.3f} {r['crest']:>6.1f}")
        return

    if cmd == "list":
        for r in rows:
            print(f"{r['file']:34s} {r['dur']:>6.3f} {r['centroid']:>9.0f} {r['low']:>6.3f} {r['crest']:>6.1f}")
        print(f"\n{len(rows)} sounds in {LIB}")
        return

    if cmd == "json":
        print(json.dumps(rows, indent=1))
        return

    raise SystemExit(__doc__)


if __name__ == "__main__":
    main()
