import {AbsoluteFill, useCurrentFrame, interpolate, Easing} from 'remotion';
import {C, FONT} from '../theme';
import {Sfx} from '../lib/Sfx';
import {Ground} from '../lib/Ground';
import {Alive, Odometer, DrawLine} from '../lib/Alive';

/* The three routing numbers are the autonomous action the event scores at 40%.
   They land digit by digit, each on its own beat, each with a tick under it. */
const Stat: React.FC<{at: number; v: number; label: string; sub: string; hero?: boolean}> = ({
  at, v, label, sub, hero,
}) => {
  const f = useCurrentFrame();
  const p = interpolate(f - at, [0, 12], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
    easing: Easing.bezier(0.16, 1, 0.3, 1)});
  return (
    <div style={{opacity: p, transform: `translateY(${(1 - p) * 16}px)`}}>
      <DrawLine at={at} w={hero ? 250 : 190} color={hero ? C.ember : C.ink700} />
      <div style={{marginTop: 18}}>
        <Odometer value={v} delay={at + 4} size={hero ? 140 : 84} color={hero ? C.ember : C.ink100} />
      </div>
      <div style={{fontFamily: FONT.text, fontSize: 21, color: C.ink300, marginTop: 12}}>{label}</div>
      <div style={{fontFamily: FONT.text, fontSize: 16, color: C.ink500, marginTop: 3}}>{sub}</div>
    </div>
  );
};

export const What: React.FC = () => {
  const f = useCurrentFrame();
  const l1 = interpolate(f, [0, 16], [0, 1], {extrapolateRight: 'clamp', easing: Easing.bezier(0.16, 1, 0.3, 1)});
  const l2 = interpolate(f, [10, 26], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
    easing: Easing.bezier(0.16, 1, 0.3, 1)});
  return (
    <AbsoluteFill>
      <Ground />
      <Alive dur={615} zoom={0.07} origin="30% 55%">
        <AbsoluteFill style={{padding: '150px 130px', justifyContent: 'center'}}>
          <p style={{fontFamily: FONT.display, fontSize: 54, lineHeight: 1.2, color: C.ink100,
            letterSpacing: '-0.022em', maxWidth: 1300, margin: 0}}>
            <span style={{display: 'inline-block', opacity: l1,
              transform: `translateY(${(1 - l1) * 14}px)`}}>Watchspan sits between an agent fleet</span><br />
            <span style={{display: 'inline-block', opacity: l2,
              transform: `translateY(${(1 - l2) * 14}px)`}}>and the people who approve what it does.</span>
          </p>
          <div style={{display: 'flex', gap: 110, marginTop: 78, alignItems: 'flex-end'}}>
            <Stat at={34} v={294} label="ran on its own" sub="with an audit log" hero />
            <Stat at={92} v={7} label="held back" sub="looked like an attack" />
            <Stat at={140} v={69} label="sent to a human" sub="of 370 actions" />
          </div>

          {/* The routing itself, drawn: 370 in, three ways out. Depth behind
              the figures rather than an empty right half. */}
          <svg width={500} height={430} style={{position: 'absolute', right: 150, top: 210, opacity: 0.85}}>
            {[[294, C.ember, 0], [7, C.ink500, 1], [69, C.ink300, 2]].map(([v, col, i]) => {
              const at = 30 + (i as number) * 54;
              const p = interpolate(f - at, [0, 26], [0, 1], {extrapolateLeft: 'clamp',
                extrapolateRight: 'clamp', easing: Easing.bezier(0.16, 1, 0.3, 1)});
              const y = 90 + (i as number) * 118;
              const w = 22 + ((v as number) / 294) * 214;
              return (
                <g key={i as number}>
                  <path d={`M 20 210 C 130 210, 150 ${y}, 250 ${y}`} fill="none"
                    stroke={col as string} strokeWidth={2} strokeOpacity={0.5}
                    strokeDasharray={420} strokeDashoffset={420 * (1 - p)} />
                  <rect x={252} y={y - 9} width={w * p} height={18} rx={2} fill={col as string} opacity={0.28} />
                </g>
              );
            })}
            <circle cx={20} cy={210} r={5} fill={C.ink300} />
          </svg>
        </AbsoluteFill>
      </Alive>
      <Sfx src="whoosh.mp3" at={1} vol={0.10} />
      <Sfx src="click.mp3" at={34} vol={0.05} />
      <Sfx src="pop.mp3" at={40} vol={0.10} />
      <Sfx src="click.mp3" at={92} vol={0.05} />
      <Sfx src="pop.mp3" at={98} vol={0.08} />
      <Sfx src="click.mp3" at={140} vol={0.05} />
      <Sfx src="pop.mp3" at={146} vol={0.08} />
    </AbsoluteFill>
  );
};
