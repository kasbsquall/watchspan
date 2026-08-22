import {AbsoluteFill, Audio, Series, staticFile} from 'remotion';
import {SCENES} from './timing';
import {C} from './theme';
import {Captions} from './lib/Captions';
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
          return (
            <Series.Sequence key={s.id} durationInFrames={s.durF}>
              {Comp ? <Comp /> : <Placeholder id={s.id} />}
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
