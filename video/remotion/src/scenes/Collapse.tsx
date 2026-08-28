import {AbsoluteFill, OffthreadVideo, staticFile, useCurrentFrame, interpolate, Easing} from 'remotion';
import {C, FONT, MONO} from '../theme';
import {Sfx} from '../lib/Sfx';
import {Ground} from '../lib/Ground';
import {Spot} from '../lib/Life';
import {narration} from '../lib/narration';

/* The real product, running, with the Cloud Run URL in shot. The decision
   times overlay as they land; the complexity column beside them does not move,
   which is the whole argument in one picture. */
const Read: React.FC<{at: number; until: number; t: string; depth: string; x: number}> = ({
  at, until, t, depth, x,
}) => {
  const f = useCurrentFrame();
  const p = interpolate(f - at, [0, 10], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
    easing: Easing.bezier(0.16, 1, 0.3, 1)});
  return (
    <Spot from={at} to={until} before={0} rest={0.55}
      style={{position: 'absolute', right: 96, top: x, textAlign: 'right'}}>
    <div style={{transform: `translateY(${(1 - p) * 8}px)`}}>
      <div style={{fontFamily: MONO, fontSize: 62, color: C.ember, lineHeight: 1,
        fontVariantNumeric: 'tabular-nums'}}>{t}</div>
      <div style={{fontFamily: FONT.text, fontSize: 16, color: C.ink500, marginTop: 4}}>{depth}</div>
    </div>
    </Spot>
  );
};

export const Collapse: React.FC = () => {
  const f = useCurrentFrame();
  const n = narration('collapse');
  // The three readings land on the three figures the voice reads out, instead of
  // on frames typed in from the preview scrubber.
  const FIRST = n.at('twenty-six');
  const TENTH = n.at('nine on the tenth');
  const FIFTIETH = n.at('two and a half');
  const disclose = interpolate(f, [12, 24], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return (
    <AbsoluteFill>
      <Ground tint={"ember"} />
      <AbsoluteFill style={{}}>
      <OffthreadVideo src={staticFile('vid/demo.mp4')} startFrom={660}
        style={{width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top center'}} />

      {/* Browser chrome carrying the deployed URL: the claim is "this is live". */}
      <div style={{position: 'absolute', top: 0, left: 0, right: 0, height: 52, background: C.ink900,
        borderBottom: `1px solid ${C.line}`, display: 'flex', alignItems: 'center', padding: '0 26px', gap: 14}}>
        <span style={{width: 9, height: 9, borderRadius: '50%', background: C.ink700}} />
        <span style={{width: 9, height: 9, borderRadius: '50%', background: C.ink700}} />
        <span style={{width: 9, height: 9, borderRadius: '50%', background: C.ink700}} />
        <span style={{fontFamily: MONO, fontSize: 16, color: C.ink400, marginLeft: 16}}>
          watchspan-web-45ejdvuucq-uc.a.run.app
        </span>
      </div>

      <Read at={FIRST}    until={TENTH - 8}    t="26.0s" depth="review depth 3" x={210} />
      <Read at={TENTH}    until={FIFTIETH - 8} t="8.8s"  depth="review depth 1" x={330} />
      <Read at={FIFTIETH} until={n.end}        t="2.5s"  depth="review depth 0" x={450} />

      {/* Declared honesty: what is simulated and what is real, at readable size. */}
      <div style={{position: 'absolute', bottom: 172, left: 96, opacity: disclose,
        fontFamily: FONT.text, fontSize: 16, color: C.ink400, background: 'rgba(15,13,9,0.82)',
        border: `1px solid ${C.line}`, padding: '10px 16px', borderRadius: 3, maxWidth: 720}}>
        Reviewer behaviour is simulated from a declared model. The fleet, the API and the traces are real.
      </div>

      <Sfx src="whoosh.mp3" at={1} vol={0.14} />
      <Sfx src="click.mp3" at={FIRST} vol={0.07} />
      <Sfx src="click.mp3" at={TENTH} vol={0.07} />
      <Sfx src="click.mp3" at={FIFTIETH} vol={0.07} />
    </AbsoluteFill>
            <Sfx src="sweep.mp3" at={2} vol={0.10} />
      <Sfx src="appear.mp3" at={FIRST} vol={0.12} />
      <Sfx src="appear.mp3" at={TENTH} vol={0.11} />
      <Sfx src="appear.mp3" at={FIFTIETH} vol={0.10} />
      </AbsoluteFill>
  );
};
