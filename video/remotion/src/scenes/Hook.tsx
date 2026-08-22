import {AbsoluteFill, useCurrentFrame, interpolate, Easing, spring, useVideoConfig} from 'remotion';
import {C, FONT, MONO} from '../theme';
import {Sfx} from '../lib/Sfx';
import {Ground} from '../lib/Ground';

/* Cold open, third attempt.

   Gone: the floating ticks, and the camera that dragged the whole frame.
   The movement now lives in the instrument itself — the arc drains, the figure
   counts down, the ring around it contracts, and the declaration lands with
   weight — so nothing slides and nothing shimmers. */
export const Hook: React.FC = () => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();

  const pct = Math.round(interpolate(f, [8, 62], [41, 0], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.bezier(0.35, 0, 0.2, 1),
  }));
  const arc = 370.7;
  const filled = arc * (pct / 100);
  const alarm = pct <= 12;

  const gauge = spring({frame: f - 2, fps, config: {damping: 17, mass: 0.7, stiffness: 100}});
  const band = spring({frame: f - 66, fps, config: {damping: 13, mass: 0.6, stiffness: 150}});
  // A ring that contracts as the budget empties: a second read of the same datum.
  const drain = interpolate(f, [8, 62], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const ring = interpolate(drain, [0, 1], [1.0, 0.72]);
  const pulse = 1 + Math.sin(f / 7) * (alarm ? 0.012 : 0.004);

  return (
    <AbsoluteFill>
      <Ground tint={alarm ? 'alarm' : 'ember'} />

      <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center'}}>
        <div style={{
          position: 'absolute', width: 1150, height: 1150, borderRadius: '50%', top: 10,
          background: `radial-gradient(circle, ${alarm ? 'rgba(230,67,67,0.19)' : 'rgba(237,153,14,0.13)'} 0%, transparent 57%)`,
          filter: 'blur(30px)', transform: `scale(${ring * pulse})`,
        }} />

        <div style={{
          position: 'relative', marginTop: -110,
          transform: `translateY(${(1 - gauge) * 44}px)`,
          opacity: Math.min(1, gauge * 1.3),
        }}>
          <svg width={700} height={392} viewBox="0 0 300 168">
            {/* A contracting halo ring, drawn, so the instrument has a second
                moving part instead of one arc alone. */}
            <circle cx={150} cy={158} r={140 * ring} fill="none"
              stroke={alarm ? C.alarm : C.ember} strokeOpacity={0.14} strokeWidth={1} />
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
            position: 'absolute', left: 0, right: 0, bottom: 12, textAlign: 'center',
            fontFamily: MONO, fontSize: 168, lineHeight: 1,
            color: alarm ? C.alarm : C.ember, fontVariantNumeric: 'tabular-nums',
            textShadow: alarm ? '0 0 48px rgba(230,67,67,0.45)' : '0 0 30px rgba(237,153,14,0.22)',
          }}>
            {pct}<span style={{fontSize: 60, color: C.ink500}}>%</span>
          </div>
          <div style={{
            position: 'absolute', left: 0, right: 0, bottom: -36, textAlign: 'center',
            fontFamily: FONT.text, fontSize: 15, letterSpacing: '0.2em',
            textTransform: 'uppercase', color: C.ink500,
          }}>attention remaining</div>
        </div>

        <div style={{
          position: 'absolute', bottom: 200, left: 150, right: 150,
          opacity: Math.min(1, band * 1.4),
          transform: `translateY(${(1 - band) * 28}px)`,
          border: `1px solid rgba(230,67,67,0.5)`, background: 'rgba(230,67,67,0.10)',
          padding: '30px 42px', borderRadius: 3,
          boxShadow: `0 0 ${68 * band}px rgba(230,67,67,0.2)`,
        }}>
          <div style={{display: 'flex', alignItems: 'baseline', gap: 24, flexWrap: 'wrap'}}>
            <span style={{fontFamily: FONT.display, fontSize: 44, color: C.alarm, letterSpacing: '-0.015em'}}>
              Oversight stopped being effective
            </span>
            <span style={{fontFamily: MONO, fontSize: 78, color: C.alarm, lineHeight: 1,
              fontVariantNumeric: 'tabular-nums'}}>05:06</span>
          </div>
        </div>
      </AbsoluteFill>

      <Sfx src="appear.mp3" at={3} vol={0.15} />
      <Sfx src="stamp.mp3" at={66} vol={0.5} />
    </AbsoluteFill>
  );
};
