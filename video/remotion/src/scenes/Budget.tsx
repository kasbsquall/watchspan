import {AbsoluteFill, useCurrentFrame, interpolate, Easing} from 'remotion';
import {C, FONT, MONO} from '../theme';
import {Sfx} from '../lib/Sfx';
import {Ground} from '../lib/Ground';
import {Alive} from '../lib/Alive';

/* The mechanism, drawn rather than narrated over. A lay viewer lost the film
   here when it was a subordinate clause. */
const Tick: React.FC<{i: number; x: number; cost: number; at: number}> = ({i, x, cost, at}) => {
  const f = useCurrentFrame();
  const p = interpolate(f - at, [0, 9], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
    easing: Easing.bezier(0.16, 1, 0.3, 1)});
  const h = cost * 26;
  return (
    <g opacity={p} transform={`translate(${x}, 0)`}>
      <rect x={0} y={130 - h} width={17} height={h} rx={1}
        fill={cost > 1.6 ? C.ember : C.ink700} />
    </g>
  );
};

export const Budget: React.FC = () => {
  const f = useCurrentFrame();
  const title = interpolate(f, [0, 12], [0, 1], {extrapolateRight: 'clamp', easing: Easing.bezier(0.16, 1, 0.3, 1)});
  // The bar drains as the ticks land, so the mechanism and its effect are one shot.
  const spent = interpolate(f, [22, 250], [0, 0.78], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const left = Math.round((1 - spent) * 100);
  const floorHit = left <= 35;
  const costs = [1, 1, 3, 1, 2, 1, 3, 1, 1, 2, 1, 3, 2, 1, 1, 3, 1, 2];

  return (
    <AbsoluteFill>
      <Ground tint={"ember"} />
      <Alive dur={544} zoom={0.07} origin={'38% 55%'}>
      <AbsoluteFill style={{padding: '130px 130px', justifyContent: 'center'}}>
      <p style={{fontFamily: FONT.display, fontSize: 46, color: C.ink100, letterSpacing: '-0.018em',
        margin: 0, opacity: title, transform: `translateY(${(1 - title) * 9}px)`}}>
        Attention is not free.
      </p>

      <div style={{marginTop: 58, display: 'flex', alignItems: 'flex-end', gap: 60}}>
        <div>
          <div style={{fontFamily: MONO, fontSize: 132, lineHeight: 1, color: floorHit ? C.ember : C.ink100,
            fontVariantNumeric: 'tabular-nums'}}>{left}<span style={{fontSize: 46, color: C.ink500}}>%</span></div>
          <div style={{fontFamily: FONT.text, fontSize: 17, color: C.ink500, marginTop: 8}}>budget left</div>
        </div>
        <svg width={880} height={150} style={{marginBottom: 12}}>
          {costs.map((c, i) => <Tick key={i} i={i} x={i * 48} cost={c} at={24 + i * 11} />)}
          <line x1={0} x2={870} y1={130} y2={130} stroke={C.ink800} strokeWidth={1} />
        </svg>
      </div>

      <div style={{marginTop: 50, display: 'flex', gap: 46, fontFamily: FONT.text, fontSize: 19, color: C.ink300}}>
        <span><span style={{color: C.ink700, fontFamily: MONO}}>▌</span> a routine action costs one</span>
        <span><span style={{color: C.ember, fontFamily: MONO}}>▌</span> a dense one costs three</span>
      </div>

      <div style={{marginTop: 30, paddingTop: 22, borderTop: `1px solid ${C.line}`,
        fontFamily: FONT.text, fontSize: 22, color: floorHit ? C.ember : C.ink400, maxWidth: 1100}}>
        <span style={{fontFamily: MONO, fontSize: 26, color: floorHit ? C.ember : C.ink300}}>
          LOW_BUDGET_FRACTION = 0.35
        </span>
        <span style={{marginLeft: 18, fontSize: 19, color: C.ink500}}>
          attention/budget.py &middot; the floor, in the code and on the screen
        </span>
      </div>
      <Sfx src="whoosh.mp3" at={1} vol={0.14} />
      <Sfx src="click.mp3" at={24} vol={0.06} />
    </AbsoluteFill>
      </Alive>
            <Sfx src="sweep.mp3" at={2} vol={0.10} />
      <Sfx src="tick.mp3" at={24} vol={0.045} />
      <Sfx src="tick.mp3" at={57} vol={0.045} />
      <Sfx src="tick.mp3" at={90} vol={0.045} />
      <Sfx src="tick.mp3" at={123} vol={0.045} />
      <Sfx src="tick.mp3" at={156} vol={0.045} />
      <Sfx src="tick.mp3" at={189} vol={0.045} />
      </AbsoluteFill>
  );
};
