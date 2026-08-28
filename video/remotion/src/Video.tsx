import {AbsoluteFill, Audio, Series, staticFile} from 'remotion';
import {SCENES} from './timing';
import {C} from './theme';
import {Captions} from './lib/Captions';
import {Camera} from './lib/Life';
import {Hook} from './scenes/Hook';
import {What} from './scenes/What';
import {Budget} from './scenes/Budget';
import {Collapse} from './scenes/Collapse';
import {Attack} from './scenes/Attack';
import {Ceiling} from './scenes/Ceiling';
import {Evidence} from './scenes/Evidence';
import {Cloud} from './scenes/Cloud';
import {Close} from './scenes/Close';

// 1. Create one component per scene under src/scenes/ (use the lib primitives).
// 2. Map each scene id (from scripts/audio_gen.py SCENES) to its component here.
// Each Series.Sequence uses the scene's durF so its visuals line up with the voiceover.
//
// import {Hook} from './scenes/Hook';
// import {Problem} from './scenes/Problem';
// ...
const MAP: Record<string, React.FC> = {
  hook: Hook,
  what: What,
  budget: Budget,
  collapse: Collapse,
  attack: Attack,
  ceiling: Ceiling,
  evidence: Evidence,
  cloud: Cloud,
  close: Close,
};

/* One slow push per scene, from a different corner each time.

   Applied here rather than inside each scene so that no scene can be left out
   of it, which is exactly how the released cut ended up with nine static
   compositions. The origin varies because nine identical centre pushes read as
   a tic; anchoring each one where its content actually sits reads as framing.

   Amounts stay between 4 and 7 percent: enough that the frame is never the same
   two seconds running, small enough that a 100px scene padding absorbs the crop. */
const SHOT: Record<string, {to: number; origin: string}> = {
  hook:     {to: 1.06,  origin: '50% 46%'},
  what:     {to: 1.055, origin: '30% 58%'},
  budget:   {to: 1.05,  origin: '34% 52%'},
  collapse: {to: 1.045, origin: '50% 34%'},
  attack:   {to: 1.06,  origin: '50% 44%'},
  ceiling:  {to: 1.055, origin: '38% 50%'},
  evidence: {to: 1.06,  origin: '30% 44%'},
  cloud:    {to: 1.05,  origin: '40% 52%'},
  close:    {to: 1.07,  origin: '50% 48%'},
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
            early against its own narration. */}
        <Series.Sequence durationInFrames={SCENES[0].startF}>
          <AbsoluteFill style={{background: C.ink950}} />
        </Series.Sequence>
        {SCENES.map((s) => {
          const Comp = MAP[s.id];
          const shot = SHOT[s.id] ?? {to: 1.05, origin: '50% 50%'};
          return (
            <Series.Sequence key={s.id} durationInFrames={s.durF}>
              <Camera dur={s.durF} to={shot.to} origin={shot.origin}>
                {Comp ? <Comp /> : <Placeholder id={s.id} />}
              </Camera>
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
