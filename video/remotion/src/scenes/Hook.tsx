import {AbsoluteFill, useCurrentFrame, interpolate, Easing, spring, useVideoConfig} from 'remotion';
import {C, FONT, MONO} from '../theme';
import {Sfx} from '../lib/Sfx';
import {Ground} from '../lib/Ground';
import {Alive} from '../lib/Alive';

/* Cold open, rebuilt.

   The first version was a gauge alone on a ground: one object, one colour, and
   nothing happening around it. This one has three layers moving at different
   speeds — a field of approval ticks stacking up behind, the instrument, and
   the declaration — so the frame is alive before a word is spoken. */

/* The ticks a reviewer is stamping. They arrive fast, they pile up, and their
   opacity falls as the budget does: the wall of approvals IS the problem. */
const Ticks: React.FC<{n: number}> = ({n}) => {
  const f = useCurrentFrame();
  const cells = Array.from({length: 72});
  return (
    <AbsoluteFill style={{
      display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 30,
      padding: '120px 140px', alignContent: 'start',
    }}>
      {cells.map((_, i) => {
        const at = i * 1.6 + 4;
        const p = interpolate(f - at, [0, 6], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
        // Later ticks are fainter and land faster: the review is decaying.
        const decay = 1 - (i / cells.length) * 0.72;
        return (
          <div key={i} style={{
            opacity: p * decay * 0.5,
            transform: `translateY(${(1 - p) * 10}px) scale(${0.82 + p * 0.18})`,
          }}>
            <svg width={26} height={26} viewBox="0 0 24 24" fill="none">
              <path d="M4 12.5 L9.5 18 L20 6" stroke={i > 46 ? C.alarm : C.ink500}
                strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

export const Hook: React.FC = () => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();

  const pct = Math.round(interpolate(f, [6, 58], [41, 0], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.bezier(0.4, 0, 0.2, 1),
  }));
  const arc = 370.7;
  const filled = arc * (pct / 100);
  const alarm = pct <= 12;

  const band = spring({frame: f - 60, fps, config: {damping: 13, mass: 0.6, stiffness: 150}});
  const shake = f >= 60 && f < 72 ? Math.sin((f - 60) * 2.6) * (72 - f) * 0.34 : 0;
  // The instrument arrives with weight rather than fading up.
  const gauge = spring({frame: f - 2, fps, config: {damping: 18, mass: 0.8, stiffness: 90}});

  return (
    <AbsoluteFill>
      <Ground tint={alarm ? 'alarm' : 'ember'} />
      <Ticks n={pct} />
      <Alive dur={229} zoom={0.07} origin="50% 42%" drift={-26}>
        <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center'}}>
          <div style={{
            position: 'absolute', width: 1100, height: 1100, borderRadius: '50%', top: 20,
            background: `radial-gradient(circle, ${alarm ? 'rgba(230,67,67,0.20)' : 'rgba(237,153,14,0.14)'} 0%, transparent 58%)`,
            filter: 'blur(28px)',
            transform: `scale(${0.9 + (1 - pct / 41) * 0.22})`,
          }} />

          <div style={{
            position: 'relative', marginTop: -140,
            transform: `translateX(${shake}px) translateY(${(1 - gauge) * 40}px)`,
            opacity: Math.min(1, gauge * 1.3),
          }}>
            <svg width={680} height={381} viewBox="0 0 300 168">
              <path d="M 32 158 A 118 118 0 0 1 268 158" fill="none" stroke={C.ink800} strokeWidth={10} strokeLinecap="round" />
              {filled > 0.5 && (
                <path d="M 32 158 A 118 118 0 0 1 268 158" fill="none"
                  stroke={alarm ? C.alarm : C.ember} strokeWidth={10} strokeLinecap="round"
                  strokeDasharray={`${filled} ${arc}`} />
              )}
              <line x1={73.5} y1={65.2} x2={64.2} y2={54.4} stroke={C.ink400} strokeWidth={1.6} />
              <text x={58} y={46} textAnchor="middle" fontFamily={MONO} fontSize={9} fill={C.ink500}>35</text>
            </svg>
            <div style={{
              position: 'absolute', left: 0, right: 0, bottom: 10, textAlign: 'center',
              fontFamily: MONO, fontSize: 164, lineHeight: 1,
              color: alarm ? C.alarm : C.ember, fontVariantNumeric: 'tabular-nums',
              textShadow: alarm ? '0 0 46px rgba(230,67,67,0.45)' : '0 0 30px rgba(237,153,14,0.25)',
            }}>
              {pct}<span style={{fontSize: 60, color: C.ink500}}>%</span>
            </div>
            <div style={{
              position: 'absolute', left: 0, right: 0, bottom: -34, textAlign: 'center',
              fontFamily: FONT.text, fontSize: 15, letterSpacing: '0.2em',
              textTransform: 'uppercase', color: C.ink500,
            }}>attention remaining</div>
          </div>

          <div style={{
            position: 'absolute', bottom: 214, left: 130, right: 130,
            opacity: Math.min(1, band * 1.4),
            transform: `translateY(${(1 - band) * 30}px) translateX(${shake * 0.6}px)`,
            border: `1px solid rgba(230,67,67,0.5)`, background: 'rgba(230,67,67,0.10)',
            padding: '32px 44px', borderRadius: 3,
            boxShadow: `0 0 ${70 * band}px rgba(230,67,67,0.22)`,
          }}>
            <div style={{display: 'flex', alignItems: 'baseline', gap: 26, flexWrap: 'wrap'}}>
              <span style={{fontFamily: FONT.display, fontSize: 46, color: C.alarm, letterSpacing: '-0.015em'}}>
                Oversight stopped being effective
              </span>
              <span style={{fontFamily: MONO, fontSize: 82, color: C.alarm, lineHeight: 1,
                fontVariantNumeric: 'tabular-nums'}}>05:06</span>
            </div>
          </div>
        </AbsoluteFill>
      </Alive>

      {/* Every tick that lands has a sound; they thin out as the reviewer does. */}
      {[6, 14, 22, 30, 37, 43, 48, 52].map((a, i) => (
        <Sfx key={a} src="tick.mp3" at={a} vol={0.075 - i * 0.006} />
      ))}
      <Sfx src="appear.mp3" at={3} vol={0.16} />
      <Sfx src="stamp.mp3" at={60} vol={0.55} />
      <Sfx src="reject.mp3" at={64} vol={0.2} />
    </AbsoluteFill>
  );
};
