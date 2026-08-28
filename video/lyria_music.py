"""Score the film with Lyria on Vertex AI.

Lyria returns a fixed ~32 second clip per call, and the film is roughly five
times that, so a usable bed is built rather than generated in one shot: pick
the take that works, then loop it with an equal-power crossfade long enough to
cover the voiceover. Under speech at the mix level this reads as a continuous
underscore; a hard butt-join does not, which is why the crossfade is not
optional.

    python lyria_music.py takes                 # generate candidates to audition
    python lyria_music.py bed audio_out/lyria/take2.wav 168   # build the bed

Needs an authenticated gcloud and a project with Vertex AI enabled. The model
is only served from us-central1 at the time of writing; `global` returns 404.
"""
import base64
import json
import shutil
import subprocess
import sys
from pathlib import Path

import httpx

LOCATION = "us-central1"
MODEL = "lyria-002"
XFADE = 3.0  # seconds of overlap between loop passes

# One prompt per candidate. The film is about oversight quietly failing, and it
# plays to a jury on its fortieth submission of the day, so the brief is serious
# AND propulsive: the score has to carry tension without going funereal.
#
# Keep these SHORT. Long, heavily qualified prompts came back as a 500 "could not
# generate audio" often enough to look like a length or vocabulary limit rather
# than flakiness; the terse versions below generate reliably.
TAKES = [
    ("motorik",  "dark propulsive instrumental, motorik drums, muted bass pulse, tense strings, 105 bpm"),
    ("minimal",  "tense minimal electronic underscore, steady pulse, low analog bass, cold and serious, 100 bpm"),
    ("postpunk", "dark propulsive post-punk instrumental, live drums, driving toms, tense strings, 108 bpm"),
    ("pulse",    "restrained cinematic underscore, patient synth pulse, deep bass, sparse percussion, 96 bpm"),
]


# On Windows gcloud is a .cmd shim, so the bare name is not an executable that
# CreateProcess can find. Resolve it once instead of shelling out through cmd.
GCLOUD = shutil.which("gcloud") or shutil.which("gcloud.cmd") or "gcloud"


def project() -> str:
    r = subprocess.run([GCLOUD, "config", "get-value", "project"],
                       capture_output=True, text=True)
    p = r.stdout.strip()
    if not p:
        raise SystemExit("no gcloud project set: gcloud config set project <id>")
    return p


def token() -> str:
    r = subprocess.run([GCLOUD, "auth", "print-access-token"],
                       capture_output=True, text=True)
    t = r.stdout.strip()
    if not t:
        raise SystemExit("gcloud auth print-access-token returned nothing; run gcloud auth login")
    return t


def generate(prompt: str, dest: Path, attempts: int = 3) -> None:
    proj = project()
    url = (f"https://{LOCATION}-aiplatform.googleapis.com/v1/projects/{proj}"
           f"/locations/{LOCATION}/publishers/google/models/{MODEL}:predict")
    r = None
    for i in range(attempts):
        r = httpx.post(url,
                       headers={"Authorization": f"Bearer {token()}",
                                "Content-Type": "application/json"},
                       json={"instances": [{"prompt": prompt}],
                             "parameters": {"sample_count": 1}},
                       timeout=300)
        if r.status_code == 200:
            break
        print(f"    attempt {i + 1}/{attempts} -> {r.status_code}")
    if r.status_code != 200:
        raise SystemExit(f"Lyria {r.status_code}: {r.text[:300]}")
    preds = r.json().get("predictions", [])
    if not preds:
        raise SystemExit("Lyria returned no predictions")
    dest.write_bytes(base64.b64decode(preds[0]["bytesBase64Encoded"]))


def duration(path: Path) -> float:
    r = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration",
                        "-of", "csv=p=0", str(path)], capture_output=True, text=True)
    return float(r.stdout.strip())


def run_ff(args, what):
    r = subprocess.run(args, capture_output=True, text=True)
    if r.returncode != 0:
        raise SystemExit(f"ffmpeg failed ({what}):\n{r.stderr[-1200:]}")


def build_bed(take: Path, seconds: float, dest: Path) -> None:
    """Loop one take up to `seconds` with equal-power crossfades between passes."""
    d = duration(take)
    step = d - XFADE
    passes = max(2, int((seconds - d) / step) + 2)
    cur = take
    tmp_dir = dest.parent / "_bed"
    tmp_dir.mkdir(exist_ok=True)
    for i in range(1, passes):
        nxt = tmp_dir / f"j{i}.wav"
        run_ff(["ffmpeg", "-y", "-i", str(cur), "-i", str(take),
                "-filter_complex",
                f"[0:a][1:a]acrossfade=d={XFADE}:c1=tri:c2=tri[a]",
                "-map", "[a]", "-c:a", "pcm_s16le", str(nxt)], f"crossfade {i}")
        cur = nxt
    run_ff(["ffmpeg", "-y", "-i", str(cur), "-t", str(seconds),
            "-c:a", "libmp3lame", "-b:a", "256k", str(dest)], "trim")
    for f in tmp_dir.glob("*.wav"):
        f.unlink()
    tmp_dir.rmdir()
    print(f"bed: {dest}  {duration(dest):.1f}s from a {d:.1f}s take, {passes} passes")


def main() -> None:
    argv = sys.argv[1:]
    if not argv:
        raise SystemExit(__doc__)
    out = Path("audio_out/lyria")
    out.mkdir(parents=True, exist_ok=True)

    if argv[0] == "takes":
        for name, prompt in TAKES:
            f = out / f"{name}.wav"
            if f.exists():
                print(f"  {name}: already generated")
                continue
            try:
                generate(prompt, f)
            except SystemExit as e:
                # One bad prompt should not cost the whole audition run.
                print(f"  {name}: SKIPPED ({e})")
                continue
            print(f"  {name}: {duration(f):.1f}s  -> {f}")
        (out / "prompts.json").write_text(json.dumps(dict(TAKES), indent=2))
    elif argv[0] == "bed":
        take = Path(argv[1])
        seconds = float(argv[2])
        build_bed(take, seconds, out / "bed.mp3")
    else:
        raise SystemExit(__doc__)


if __name__ == "__main__":
    main()
