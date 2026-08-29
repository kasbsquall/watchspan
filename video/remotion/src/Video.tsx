import {AbsoluteFill, Audio, Series, staticFile, useCurrentFrame, interpolate} from 'remotion';
import {SCENES} from './timing';
import {C, FONT, MONO} from './theme';
import {Ground} from './lib/Ground';
import {Captions} from './lib/Captions';
import {Camera, SceneEdge} from './lib/Life';
import {What} from './scenes/What';
import {Collapse} from './scenes/Collapse';
import {Attack} from './scenes/Attack';
import {Ceiling} from './scenes/Ceiling';
import {Evidence} from './scenes/Evidence';
import {Cloud} from './scenes/Cloud';
import {Close} from './scenes/Close';
import {Claim} from './scenes/Claim';
import {Open} from './scenes/Open';
import {Peers} from './scenes/Peers';
import {Desk} from './scenes/Desk';

// 1. Create one component per scene under src/scenes/ (use the lib primitives).
// 2. Map each scene id (from scripts/audio_gen.py SCENES) to its component here.
// Each Series.Sequence uses the scene's durF so its visuals line up with the voiceover.
//
// import {Hook} from './scenes/Hook';
// import {Problem} from './scenes/Problem';
// ...
// Eleven scenes. `hook` and `budget` went with the restructure: the opening is
// one scene that runs the product and promises to measure the viewer, and the
// budget mechanic moved next to the collapse it explains.
const MAP: Record<string, React.FC> = {
  open: Open,
  what: What,
  collapse: Collapse,
  claim: Claim,
  peers: Peers,
  attack: Attack,
  ceiling: Ceiling,
  desk: Desk,
  evidence: Evidence,
  cloud: Cloud,
  close: Close,
};

/* The camera, and the sound of a scene changing.

   The previous cut gave every scene one slow push across its whole length. It
   measured as motion and it read as boiling text, because a 5% move spread over
   twenty seconds displaces a fraction of a pixel per frame; see the rule at the
   top of Life.tsx. Each scene now gets two or three fast pushes on its own
   beats, and holds still in between.

   The beats are frame offsets into the scene, chosen where the narration turns:
   they are deliberately coarse, because a camera that moves on every reveal is
   as tiring as one that never moves. */
const SHOT: Record<string, {beats: number[]; step: number; origin: string}> = {
  hook:     {beats: [110, 226], step: 0.026, origin: '50% 44%'},
  what:     {beats: [130, 315, 438], step: 0.022, origin: '32% 56%'},
  budget:   {beats: [40, 250, 375], step: 0.022, origin: '34% 50%'},
  collapse: {beats: [30, 180], step: 0.024, origin: '50% 32%'},
  // The attack scene runs 1068 frames after the narration was corrected, so it
  // needs four pushes rather than three, at a smaller step: four times 0.018 is
  // 0.072 of total scale, and the crop stays inside the 100px scene padding.
  attack:   {beats: [145, 300, 430, 620, 830], step: 0.015, origin: '50% 42%'},
  ceiling:  {beats: [90, 220, 425], step: 0.022, origin: '38% 46%'},
  evidence: {beats: [40, 195], step: 0.026, origin: '32% 40%'},
  cloud:    {beats: [45, 240], step: 0.026, origin: '40% 48%'},
  close:    {beats: [0, 55], step: 0.028, origin: '50% 46%'},
};

const Overture: React.FC<{dur: number}> = ({dur}) => {
  const f = useCurrentFrame();
  const up = interpolate(f, [0, Math.round(dur * 0.7)], [0, 1], {extrapolateRight: 'clamp'});
  const arc = 370.7;
  const filled = arc * 0.41;
  return (
    <AbsoluteFill>
      <Ground tint="ember" offset={-dur} />
      <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', opacity: up}}>
        <div style={{position: 'relative', marginTop: -110}}>
          <svg width={700} height={392} viewBox="0 0 300 168">
            <path d="M 32 158 A 118 118 0 0 1 268 158" fill="none" stroke={C.ink800} strokeWidth={10} strokeLinecap="round" />
            <path d="M 32 158 A 118 118 0 0 1 268 158" fill="none" stroke={C.ember} strokeWidth={10}
              strokeLinecap="round" strokeDasharray={`${filled} ${arc}`} />
            <line x1={73.5} y1={65.2} x2={64.2} y2={54.4} stroke={C.ink400} strokeWidth={1.6} />
            <text x={58} y={46} textAnchor="middle" fontFamily={MONO} fontSize={9} fill={C.ink500}>35</text>
          </svg>
          <div style={{position: 'absolute', left: 0, right: 0, bottom: 12, textAlign: 'center',
            fontFamily: MONO, fontSize: 168, lineHeight: 1, color: C.ember,
            fontVariantNumeric: 'tabular-nums', textShadow: '0 0 30px rgba(237,153,14,0.22)'}}>
            41<span style={{fontSize: 60, color: C.ink500}}>%</span>
          </div>
          <div style={{position: 'absolute', left: 0, right: 0, bottom: -36, textAlign: 'center',
            fontFamily: FONT.text, fontSize: 15, letterSpacing: '0.2em',
            textTransform: 'uppercase', color: C.ink500}}>attention remaining</div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

const Placeholder: React.FC<{id: string}> = ({id}) => (
  <AbsoluteFill style={{background: C.ink900, alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 60}}>
    {id}
  </AbsoluteFill>
);

export const Video: React.FC = () => {
  return (
    <AbsoluteFill style={{background: C.ink950}}>
      <Series>
        {/* The mix opens with a silent lead-in before the voice enters, so the
            picture has to hold for exactly that long or every scene lands 1.6s
            early against its own narration.

            It used to hold on flat black. Two seconds of nothing, at the front of
            a film whose judges decide in ten. The instrument now fades up during
            the lead at the same 41% the hook opens on, so the first frame of the
            film is an image and the cut into the hook is invisible. */}
        <Series.Sequence durationInFrames={SCENES[0].startF}>
          <Overture dur={SCENES[0].startF} />
        </Series.Sequence>
        {SCENES.map((s) => {
          const Comp = MAP[s.id];
          const shot = SHOT[s.id] ?? {beats: [], step: 0.024, origin: '50% 50%'};
          return (
            <Series.Sequence key={s.id} durationInFrames={s.durF}>
              <Camera beats={shot.beats} step={shot.step} origin={shot.origin}>
                {Comp ? <Comp /> : <Placeholder id={s.id} />}
              </Camera>
              {/* No dip into the first scene: the overture hands the instrument
                  over directly, and a black flash between them is a cut where
                  the film is meant to be continuous. */}
              <SceneEdge dur={s.durF} inF={s.id === SCENES[0].id ? 0 : 9} />
            </Series.Sequence>
          );
        })}
      </Series>
      {/* WAV, not MP3, and that is deliberate: the audio chain stays PCM end to end so the
          only lossy step in the whole film is the final encode. `audio_gen.py` writes
          `final_audio.wav`; these two names are the single wire between the audio half of
          the pipeline and the video half, and they were mismatched for a whole release. */}
      <Audio src={staticFile('final_audio.wav')} />
      <Captions />
    </AbsoluteFill>
  );
};
