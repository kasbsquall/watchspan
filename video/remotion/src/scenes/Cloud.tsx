import {AbsoluteFill, useCurrentFrame, interpolate, Easing} from 'remotion';
import {C, FONT, MONO} from '../theme';
import {Sfx} from '../lib/Sfx';

/* Google Cloud, named against what each service actually holds. Every line is
   something that exists in the deployed project, not a stack list. */
const Item: React.FC<{at: number; k: string; v: string}> = ({at, k, v}) => {
  const f = useCurrentFrame();
  const p = interpolate(f - at, [0, 10], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
    easing: Easing.bezier(0.16, 1, 0.3, 1)});
  return (
    <div style={{display: 'grid', gridTemplateColumns: '400px 1fr', gap: 40, alignItems: 'baseline',
      padding: '20px 0', borderTop: `1px solid ${C.line}`, opacity: p,
      transform: `translateY(${(1 - p) * 8}px)`}}>
      <span style={{fontFamily: MONO, fontSize: 24, color: C.ember}}>{k}</span>
      <span style={{fontFamily: FONT.text, fontSize: 25, color: C.ink300}}>{v}</span>
    </div>
  );
};

export const Cloud: React.FC = () => {
  const f = useCurrentFrame();
  const head = interpolate(f, [0, 12], [0, 1], {extrapolateRight: 'clamp', easing: Easing.bezier(0.16, 1, 0.3, 1)});
  return (
    <AbsoluteFill style={{background: C.ink950, padding: '120px 110px'}}>
      <div style={{opacity: head}}>
        <div style={{fontFamily: FONT.text, fontSize: 15, letterSpacing: '0.18em',
          textTransform: 'uppercase', color: C.ink500}}>Running on Google Cloud</div>
        <div style={{fontFamily: MONO, fontSize: 20, color: C.ink500, marginTop: 14}}>
          gen-lang-client-0094400410 &middot; us-central1
        </div>
      </div>

      <div style={{marginTop: 34}}>
        <Item at={24}  k="Agent Registry" v="seven agents catalogued, discoverable across departments" />
        <Item at={64}  k="Agent Runtime"  v="the fleet, under its own least-privilege identity" />
        <Item at={104} k="Memory Bank"    v="the attention ledger, surviving the session" />
        <Item at={144} k="Model Armor"    v="every prompt screened before it reaches the model" />
        <Item at={184} k="Cloud Trace"    v="each decision carrying the numbers that justified it" />
        <Item at={224} k="Cloud Run"      v="both services, scaled to zero when idle" />
      </div>

      <div style={{position: 'absolute', bottom: 190, left: 110, fontFamily: FONT.text,
        fontSize: 22, color: C.ink400}}>
        Gemini 3.5 Flash on Vertex AI writes the findings.
      </div>

      <Sfx src="whoosh.mp3" at={1} vol={0.14} />
      {[24, 64, 104, 144, 184, 224].map((a) => <Sfx key={a} src="pop.mp3" at={a} vol={0.06} />)}
    </AbsoluteFill>
  );
};
