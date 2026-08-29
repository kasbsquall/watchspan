import {AbsoluteFill, useCurrentFrame, interpolate, Easing} from 'remotion';
import {C, FONT, MONO} from '../theme';
import {Sfx} from '../lib/Sfx';
import {Ground} from '../lib/Ground';
import {Spot, Rails, Sweep} from '../lib/Life';
import {narration} from '../lib/narration';

/* Google Cloud, named against what each service actually holds.

   Every line is something that exists in the deployed project rather than a
   stack list, and each one now lands on the words that name it. The released
   cut dropped all six inside the first eight seconds and then held the finished
   list for seven, which is the shape that measured 94% frozen.

   Model Armor has no line of its own in this narration because the attack scene
   already spent twenty seconds on it, so it arrives with the group and is not
   given a spotlight it has not earned here. */

const Item: React.FC<{at: number; until: number; k: string; v: string}> = ({at, until, k, v}) => {
  const f = useCurrentFrame();
  const p = interpolate(f - at, [0, 10], [0, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.bezier(0.16, 1, 0.3, 1),
  });
  return (
    <Spot from={at} to={until} before={0} rest={0.5}>
      <div
        style={{
          display: 'grid', gridTemplateColumns: '400px 1fr', gap: 40, alignItems: 'baseline',
          padding: '17px 0', borderTop: `1px solid ${C.line}`,
          transform: `translateY(${(1 - p) * 8}px)`,
        }}
      >
        <span style={{fontFamily: MONO, fontSize: 24, color: C.ember}}>{k}</span>
        <span style={{fontFamily: FONT.text, fontSize: 25, color: C.ink300}}>{v}</span>
      </div>
    </Spot>
  );
};

export const Cloud: React.FC = () => {
  const f = useCurrentFrame();
  const n = narration('cloud');

  const RUN = n.at('all of it');
  const REGISTRY = n.at('one request calls');
  const IDENTITY = n.at('agent runtime');
  const LEDGER = n.at('memory bank');
  const GEMINI = n.at('gemini and cloud');
  const TRACED = n.at('the build fails');

  const head = interpolate(f, [0, 12], [0, 1], {extrapolateRight: 'clamp', easing: Easing.bezier(0.16, 1, 0.3, 1)});

  return (
    <AbsoluteFill>
      <Ground tint="ember" />
      <Rails gap={106} speed={0.16} opacity={0.022} />
      <AbsoluteFill style={{padding: '104px 110px'}}>
        <div style={{opacity: head, position: 'relative', overflow: 'hidden', paddingBottom: 6}}>
          <Sweep period={230} opacity={0.04} />
          <div style={{fontFamily: FONT.text, fontSize: 15, letterSpacing: '0.18em',
            textTransform: 'uppercase', color: C.ink500}}>Running on Google Cloud</div>
          <div style={{fontFamily: MONO, fontSize: 20, color: C.ink500, marginTop: 12}}>
            gen-lang-client-0094400410 &middot; us-central1
          </div>
        </div>

        <div style={{marginTop: 28}}>
          <Item at={RUN}      until={REGISTRY - 8} k="Cloud Run"      v="both services, scaled to zero when idle" />
          <Item at={REGISTRY} until={IDENTITY - 8} k="Agent Registry" v="seven agents catalogued, discoverable across departments" />
          <Item at={IDENTITY} until={LEDGER - 8}   k="Agent Runtime"  v="the fleet, under its own least-privilege identity" />
          <Item at={LEDGER}   until={GEMINI - 8}   k="Memory Bank"    v="the attention ledger, surviving the session" />
          <Item at={GEMINI}   until={TRACED - 8}   k="Vertex AI"      v="Gemini 3.5 Flash writes the findings" />
          <Item at={GEMINI + 14} until={TRACED - 8} k="Model Armor"   v="the fleet's model input, screened on Agent Runtime" />
          <Item at={TRACED}   until={n.end}        k="Cloud Trace"    v="each decision carrying the numbers that justified it" />
        </div>
      </AbsoluteFill>

      <Sfx src="sweep.mp3" at={2} vol={0.10} />
      <Sfx src="whoosh.mp3" at={1} vol={0.14} />
      {[RUN, REGISTRY, IDENTITY, LEDGER, GEMINI, TRACED].map((a) => (
        <Sfx key={`e${a}`} src="enter.mp3" at={a} vol={0.085} />
      ))}
      {[RUN, REGISTRY, IDENTITY, LEDGER, GEMINI, TRACED].map((a) => (
        <Sfx key={`p${a}`} src="pop.mp3" at={a} vol={0.06} />
      ))}
    </AbsoluteFill>
  );
};
