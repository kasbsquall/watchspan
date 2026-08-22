import {AbsoluteFill, useCurrentFrame, interpolate, Easing, spring, useVideoConfig} from 'remotion';
import {C, FONT, MONO} from '../theme';
import {Sfx} from '../lib/Sfx';
import {Ground} from '../lib/Ground';
import {Alive} from '../lib/Alive';

/* Cold open. The needle is already falling when the film starts, the camera
   pushes the whole time, and the band arrives on a hit. Nothing holds still. */
export const Hook: React.FC = () => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();

  const pct = Math.round(interpolate(f, [0, 52], [41, 0], {
    extrapolateRight: 'clamp', easing: Easing.bezier(0.4, 0, 0.2, 1),
  }));
  const arc = 370.7;
  const filled = arc * (pct / 100);
  const alarm = pct <= 12;

  // The band does not fade: it snaps in with a spring and a shake.
  const band = spring({frame: f - 54, fps, config: {damping: 13, mass: 0.6, stiffness: 150}});
  const shake = f >= 54 && f < 66 ? Math.sin((f - 54) * 2.4) * (66 - f) * 0.32 : 0;
  const tick = interpolate(f, [8, 20], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

  return (
    <AbsoluteFill>
      <Ground tint={alarm ? 'alarm' : 'ember'} />
      <Alive dur={229} zoom={0.10} origin="50% 40%">
        <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center'}}>
          <div style={{
            position: 'absolute', width: 1000, height: 1000, borderRadius: '50%', top: 40,
            background: `radial-gradient(circle, ${alarm ? 'rgba(230,67,67,0.17)' : 'rgba(237,153,14,0.13)'} 0%, transparent 60%)`,
            filter: 'blur(26px)',
            transform: `scale(${1 + (1 - pct / 41) * 0.16})`,
          }} />

          <div style={{position: 'relative', marginTop: -130, transform: `translateX(${shake}px)`}}>
            <svg width={660} height={370} viewBox="0 0 300 168">
              <path d="M 32 158 A 118 118 0 0 1 268 158" fill="none" stroke={C.ink800} strokeWidth={10} strokeLinecap="round" />
              {filled > 0.5 && (
                <path d="M 32 158 A 118 118 0 0 1 268 158" fill="none"
                  stroke={alarm ? C.alarm : C.ember} strokeWidth={10} strokeLinecap="round"
                  strokeDasharray={`${filled} ${arc}`} />
              )}
              <g opacity={tick}>
                <line x1={73.5} y1={65.2} x2={64.2} y2={54.4} stroke={C.ink400} strokeWidth={1.6} />
                <text x={58} y={46} textAnchor="middle" fontFamily={MONO} fontSize={9} fill={C.ink500}>35</text>
              </g>
            </svg>
            <div style={{
              position: 'absolute', left: 0, right: 0, bottom: 8, textAlign: 'center',
              fontFamily: MONO, fontSize: 158, lineHeight: 1,
              color: alarm ? C.alarm : C.ember, fontVariantNumeric: 'tabular-nums',
              textShadow: alarm ? '0 0 40px rgba(230,67,67,0.4)' : 'none',
            }}>
              {pct}<span style={{fontSize: 58, color: C.ink500}}>%</span>
            </div>
          </div>

          <div style={{
            position: 'absolute', bottom: 230, left: 130, right: 130,
            opacity: Math.min(1, band * 1.4),
            transform: `translateY(${(1 - band) * 26}px) translateX(${shake * 0.6}px)`,
            border: `1px solid rgba(230,67,67,0.45)`, background: 'rgba(230,67,67,0.09)',
            padding: '32px 42px', borderRadius: 3,
            boxShadow: `0 0 ${60 * band}px rgba(230,67,67,0.18)`,
          }}>
            <div style={{display: 'flex', alignItems: 'baseline', gap: 24, flexWrap: 'wrap'}}>
              <span style={{fontFamily: FONT.display, fontSize: 46, color: C.alarm, letterSpacing: '-0.015em'}}>
                Oversight stopped being effective
              </span>
              <span style={{fontFamily: MONO, fontSize: 80, color: C.alarm, lineHeight: 1,
                fontVariantNumeric: 'tabular-nums'}}>05:06</span>
            </div>
          </div>
        </AbsoluteFill>
      </Alive>

      <Sfx src="click.mp3" at={10} vol={0.05} />
      <Sfx src="stamp.mp3" at={54} vol={0.52} />
      <Sfx src="reject.mp3" at={58} vol={0.18} />
    </AbsoluteFill>
  );
};
