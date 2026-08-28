import {AbsoluteFill, useCurrentFrame, interpolate, Easing} from 'remotion';
import {C, FONT, MONO} from '../theme';
import {Sfx} from '../lib/Sfx';
import {Ground} from '../lib/Ground';
import {Spot, Caret, Rails, Ping, Spoken} from '../lib/Life';
import {narration} from '../lib/narration';

/* The mechanism, drawn rather than narrated over.

   The bones were right and the timing was not: eighteen ticks landed inside the
   first seven seconds and the remaining eleven were a still chart. They now land
   across the whole sentence that describes them, which is what they are
   illustrating, and the budget figure falls with them instead of arriving
   already spent. */

const Tick: React.FC<{x: number; cost: number; at: number}> = ({x, cost, at}) => {
  const f = useCurrentFrame();
  const p = interpolate(f - at, [0, 9], [0, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.bezier(0.16, 1, 0.3, 1),
  });
  const h = cost * 26;
  return (
    <g opacity={p} transform={`translate(${x}, 0)`}>
      <rect x={0} y={130 - h * p} width={17} height={h * p} rx={1} fill={cost > 1.6 ? C.ember : C.ink700} />
    </g>
  );
};

const COSTS = [1, 1, 3, 1, 2, 1, 3, 1, 1, 2, 1, 3, 2, 1, 1, 3, 1, 2];

export const Budget: React.FC = () => {
  const f = useCurrentFrame();
  const n = narration('budget');

  const SPEND = n.at('every approval');
  const SPEND_END = n.after('routine one');
  const DENSE = n.at('a dense action');
  const FLOOR = n.at('below thirty-five');
  const STOPS = n.at('watchspan stops');
  const DECISION = n.at('that floor is our');

  const title = interpolate(f, [0, 12], [0, 1], {extrapolateRight: 'clamp', easing: Easing.bezier(0.16, 1, 0.3, 1)});
  // The ticks land across the sentence that describes them, and the figure falls
  // with them, so cause and effect are one shot instead of two.
  const step = (SPEND_END - SPEND) / COSTS.length;
  const spent = interpolate(f, [SPEND, SPEND_END], [0, 0.78], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });
  const left = Math.round((1 - spent) * 100);
  const floorHit = left <= 35;
  const code = interpolate(f, [DECISION - 8, DECISION + 12], [0, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.bezier(0.16, 1, 0.3, 1),
  });

  return (
    <AbsoluteFill>
      <Ground tint="ember" />
      <Rails gap={118} speed={0.15} opacity={0.022} />
      <AbsoluteFill style={{padding: '120px 130px', justifyContent: 'center'}}>
        <p style={{fontFamily: FONT.display, fontSize: 46, color: C.ink100, letterSpacing: '-0.018em',
          margin: 0, opacity: title, transform: `translateY(${(1 - title) * 9}px)`}}>
          Attention is not free.
        </p>

        <div style={{marginTop: 54, display: 'flex', alignItems: 'flex-end', gap: 60, position: 'relative'}}>
          <div>
            <div style={{fontFamily: MONO, fontSize: 132, lineHeight: 1,
              color: floorHit ? C.ember : C.ink100, fontVariantNumeric: 'tabular-nums'}}>
              {left}
              <span style={{fontSize: 46, color: C.ink500}}>%</span>
            </div>
            <div style={{fontFamily: FONT.text, fontSize: 17, color: C.ink500, marginTop: 8}}>budget left</div>
          </div>
          <svg width={880} height={150} style={{marginBottom: 12}}>
            {COSTS.map((c, i) => <Tick key={i} x={i * 48} cost={c} at={SPEND + i * step} />)}
            <line x1={0} x2={870} y1={130} y2={130} stroke={C.ink800} strokeWidth={1} />
          </svg>
          <div style={{position: 'absolute', left: 120, top: 60}}>
            <Ping at={FLOOR} size={340} color={C.ember} dur={38} />
          </div>
        </div>

        <div style={{marginTop: 44, display: 'flex', gap: 46, fontFamily: FONT.text, fontSize: 19, color: C.ink300}}>
          <span><span style={{color: C.ink700, fontFamily: MONO}}>&#9612;</span> a routine action costs one</span>
          <Spot from={DENSE} to={FLOOR - 10} before={0.45}>
            <span><span style={{color: C.ember, fontFamily: MONO}}>&#9612;</span> a dense one costs three</span>
          </Spot>
        </div>

        <Spot from={FLOOR} to={DECISION - 10} before={0}>
          <div style={{marginTop: 26, fontFamily: FONT.display, fontSize: 30, color: C.ember,
            letterSpacing: '-0.015em'}}>
            Below 35%, Watchspan stops trusting the review.
          </div>
        </Spot>

        <div style={{marginTop: 22, paddingTop: 20, borderTop: `1px solid ${C.line}`,
          opacity: code, transform: `translateY(${(1 - code) * 8}px)`}}>
          <span style={{fontFamily: MONO, fontSize: 26, color: C.ink300}}>
            LOW_BUDGET_FRACTION = <span style={{color: C.ember}}>0.35</span>
          </span>
          <Caret color={C.ember} h={22} w={8} />
          <span style={{marginLeft: 18, fontFamily: FONT.text, fontSize: 19, color: C.ink500}}>
            attention/budget.py
          </span>
          <div style={{marginTop: 14, minHeight: 36}}>
            <Spoken n={n} from={DECISION} to={n.after('config file')} color={C.ink300}
              style={{fontFamily: FONT.text, fontSize: 22}} />
          </div>
        </div>
      </AbsoluteFill>

      <Sfx src="sweep.mp3" at={2} vol={0.10} />
      <Sfx src="whoosh.mp3" at={1} vol={0.14} />
      {COSTS.filter((_, i) => i % 3 === 0).map((_, i) => (
        <Sfx key={i} src="tick.mp3" at={SPEND + i * step * 3} vol={0.045} />
      ))}
      <Sfx src="reject.mp3" at={FLOOR} vol={0.18} />
      <Sfx src="appear.mp3" at={DECISION} vol={0.13} />
      <Sfx src="tick.mp3" at={STOPS} vol={0.05} />
    </AbsoluteFill>
  );
};
