import {AbsoluteFill, useCurrentFrame, interpolate, Easing} from 'remotion';
import {C, FONT, MONO} from '../theme';
import {Sfx} from '../lib/Sfx';

/* Cold open. No logo, no title: the product at its worst moment. The gauge
   empties, then the declaration lands. One sound. */
export const Hook: React.FC = () => {
  const f = useCurrentFrame();

  // The needle falling is the shot; it must arrive already in motion.
  const pct = Math.round(interpolate(f, [0, 46], [38, 0], {
    extrapolateRight: 'clamp', easing: Easing.bezier(0.5, 0, 0.25, 1),
  }));
  const bandIn = interpolate(f, [48, 58], [0, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });
  const arc = 370.7;
  const filled = arc * (pct / 100);

  return (
    <AbsoluteFill style={{background: C.ink950, alignItems: 'center', justifyContent: 'center'}}>
      {/* One pool of light, behind the hero, tied to its state. */}
      <div style={{
        position: 'absolute', width: 900, height: 900, borderRadius: '50%',
        background: `radial-gradient(circle, ${pct <= 10 ? 'rgba(230,67,67,0.13)' : 'rgba(237,153,14,0.10)'} 0%, transparent 62%)`,
        top: 90, filter: 'blur(24px)',
      }} />

      <div style={{position: 'relative', marginTop: -120}}>
      <svg width={620} height={347} viewBox="0 0 300 168">
        <path d="M 32 158 A 118 118 0 0 1 268 158" fill="none" stroke={C.ink800} strokeWidth={10} strokeLinecap="round" />
        {filled > 0.5 && (
          <path d="M 32 158 A 118 118 0 0 1 268 158" fill="none"
            stroke={pct <= 10 ? C.alarm : C.ember} strokeWidth={10} strokeLinecap="round"
            strokeDasharray={`${filled} ${arc}`} />
        )}
      </svg>
      <div style={{
        position: 'absolute', left: 0, right: 0, bottom: 6, textAlign: 'center',
        fontFamily: MONO, fontSize: 150, lineHeight: 1,
        color: pct <= 10 ? C.alarm : C.ember, fontVariantNumeric: 'tabular-nums',
      }}>
        {pct}<span style={{fontSize: 56, color: C.ink500}}>%</span>
      </div>
      </div>

      <div style={{
        position: 'absolute', bottom: 250, left: 120, right: 120,
        opacity: bandIn, transform: `translateY(${(1 - bandIn) * 14}px)`,
        border: `1px solid rgba(230,67,67,0.42)`, background: 'rgba(230,67,67,0.08)',
        padding: '30px 40px', borderRadius: 3,
      }}>
        <div style={{display: 'flex', alignItems: 'baseline', gap: 22, flexWrap: 'wrap'}}>
          <span style={{fontFamily: FONT.display, fontSize: 44, color: C.alarm, letterSpacing: '-0.015em'}}>
            Oversight stopped being effective
          </span>
          <span style={{fontFamily: MONO, fontSize: 76, color: C.alarm, lineHeight: 1, fontVariantNumeric: 'tabular-nums'}}>
            05:06
          </span>
        </div>
      </div>

      <Sfx src="stamp.mp3" at={48} vol={0.5} />
    </AbsoluteFill>
  );
};
