"""Mix the voiceover against the score, with the ducking envelope the film ships.

    python mix_audio.py audio_out/vo.wav audio_out/lyria/bed.mp3 audio_out/final_audio.wav

WHY NOT SIDECHAIN. The sidechain compressor in audio_gen.py has an attack and a
release, and the release never completes inside the 0.28s gaps between scenes:
the music came back up by a couple of dB and then got slammed again, which reads
as pumping rather than as a score breathing under a voice. This walks a
pre-computed envelope instead, so the level is exactly BASE in a gap and exactly
DUCK under speech, with a ramp short enough to finish inside the gap.

WHY THE VOICE IS NOT COMPRESSED. The TTS arrives near full scale with an LRA
under 2 LU. It is already compressed. Adding a compressor on top is what
produced the "microphone in the mouth" sound on an earlier cut, so the voice
gets a gentle bell at 3 kHz where the mix measured shouty, a light de-ess, and
nothing else. Loudness is then set by a two-pass LINEAR loudnorm, which applies
one fixed gain rather than riding the level.

The numbers below are the ones that were listened to and signed off; do not
raise BASE or DUCK without being asked.
"""
import json
import subprocess
import sys
from pathlib import Path

LEAD = 1.6      # silence before the voice enters, matching audio_gen.py
# Raised 20% from 0.34/0.068 on a listening note: the score was sitting too far
# under the voice to register as a score at all.
BASE = 0.41     # music level with no voice over it
DUCK = 0.082    # music level under speech
RAMP = 0.16     # seconds to move between the two
TARGET_I = -18  # LUFS
TARGET_TP = -3  # dBTP
RATE = 48000    # the rate video ships at
CHANNELS = 2


def run(args, what: str) -> subprocess.CompletedProcess:
    r = subprocess.run(args, capture_output=True, text=True)
    if r.returncode != 0:
        raise SystemExit(f"ffmpeg failed ({what}):\n{r.stderr[-1500:]}")
    return r


def duration(path: Path) -> float:
    r = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration",
                        "-of", "csv=p=0", str(path)], capture_output=True, text=True)
    return float(r.stdout.strip())


def envelope(scenes: list[dict]) -> str:
    """A nested ffmpeg if() expression: BASE in the gaps, DUCK under every scene."""
    parts: list[tuple[float, float, str]] = []
    for s in scenes:
        a, b = s["start"], s["end"]
        parts.append((a - RAMP, a, f"{BASE}+({DUCK}-{BASE})*(t-{a - RAMP:.3f})/{RAMP}"))
        parts.append((a, b, f"{DUCK}"))
        parts.append((b, b + RAMP, f"{DUCK}+({BASE}-{DUCK})*(t-{b:.3f})/{RAMP}"))
    expr = f"{BASE}"
    for lo, hi, val in reversed(parts):
        expr = f"if(between(t,{lo:.3f},{hi:.3f}),{val},{expr})"
    return expr


def main() -> None:
    if len(sys.argv) < 4:
        raise SystemExit(__doc__)
    vo, music, dest = Path(sys.argv[1]), Path(sys.argv[2]), Path(sys.argv[3])
    timing = json.loads((vo.parent / "scene_timing.json").read_text())
    total = timing["vo"] + 1.4

    md = duration(music)
    if md < total:
        raise SystemExit(f"the score is {md:.1f}s but the film runs {total:.1f}s; build a longer bed")

    stage = dest.parent / "_premaster.wav"
    run(["ffmpeg", "-y", "-i", str(vo), "-i", str(music), "-filter_complex",
         # Voice: delay into place, take the 3 kHz edge off, light de-ess. No compression.
         # apad to the film's full length, not just the voice's: `amix
         # duration=first` follows this stream, and without the pad the score was
         # cut off partway through its own fade-out.
         f"[0:a]adelay={int(LEAD * 1000)}:all=1,"
         f"equalizer=f=3000:t=q:w=1.4:g=-2.2,equalizer=f=7500:t=q:w=2:g=-1.8,"
         f"apad=whole_dur={total:.3f}[vo];"
         f"[1:a]volume='{envelope(timing['scenes'])}':eval=frame,"
         f"afade=t=in:st=0:d=1.2,afade=t=out:st={total - 3.5:.2f}:d=3.5[mus];"
         f"[vo][mus]amix=inputs=2:duration=first:normalize=0[a]",
         "-map", "[a]", "-ar", str(RATE), "-ac", str(CHANNELS),
         "-c:a", "pcm_s16le", str(stage)], "mix")

    meas = subprocess.run(
        ["ffmpeg", "-hide_banner", "-i", str(stage), "-af",
         f"loudnorm=I={TARGET_I}:TP={TARGET_TP}:LRA=11:print_format=json", "-f", "null", "-"],
        capture_output=True, text=True)
    try:
        blob = meas.stderr[meas.stderr.rindex("{"):meas.stderr.rindex("}") + 1]
        m = json.loads(blob)
    except (ValueError, json.JSONDecodeError):
        raise SystemExit("loudnorm measurement pass failed; refusing to guess a gain")

    af = (f"loudnorm=I={TARGET_I}:TP={TARGET_TP}:LRA=11:linear=true:"
          f"measured_I={m['input_i']}:measured_TP={m['input_tp']}:"
          f"measured_LRA={m['input_lra']}:measured_thresh={m['input_thresh']}")
    print(f"measured {m['input_i']} LUFS, TP {m['input_tp']} dBFS, LRA {m['input_lra']}")
    # loudnorm resamples to 192 kHz internally and, left alone, writes the master
    # out at that rate: the shipped cut of this film carried a 192 kHz mono master
    # that the encoder then turned into 96 kHz mono AAC. Resample back explicitly.
    run(["ffmpeg", "-y", "-i", str(stage), "-af", f"{af},aresample={RATE}",
         "-ar", str(RATE), "-ac", str(CHANNELS),
         "-c:a", "pcm_s16le", str(dest)], "loudnorm")
    stage.unlink(missing_ok=True)
    print(f"{dest} -> {duration(dest):.2f}s")


if __name__ == "__main__":
    main()
