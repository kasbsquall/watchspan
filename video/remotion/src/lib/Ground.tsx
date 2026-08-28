import {AbsoluteFill, useCurrentFrame, interpolate} from 'remotion';
import {C} from '../theme';

/* The film's ground. A flat near-black bands badly and reads as cheap, so this
   carries three layers that keep moving: a wide warm wash that drifts, a cool
   counter-wash, and dither.
   
   The measurement that matters here is the COUNT OF DISTINCT LUMINANCE LEVELS
   in an empty region, not smoothness: a gradient with only a handful of levels
   to travel through shows every contour. The washes are strong enough to have
   real range, and the dither is plain alpha at roughly one level, which breaks
   a contour into noise the eye integrates back into a ramp. */
export const Ground: React.FC<{tint?: 'ember' | 'alarm' | 'ok'}> = ({tint = 'ember'}) => {
  const f = useCurrentFrame();
  const hue = tint === 'alarm' ? '230,67,67' : tint === 'ok' ? '104,185,134' : '237,153,14';

  // Parallax on the washes: full-bleed layers may translate, because the eye has
  // no fixed reference against them.
  //
  // These rates used to be 46px over 900 frames, which is 0.05px per frame. That
  // is below what a frame-difference measurement can even see, let alone a
  // viewer: the "moving" background contributed nothing and the scenes measured
  // as fully frozen. A scene is 300-800 frames, so the travel is scaled to that,
  // and the two washes run at different rates so they separate in depth.
  const x1 = interpolate(f, [0, 420], [0, -430]);
  const y1 = interpolate(f, [0, 420], [0, 250]);
  const x2 = interpolate(f, [0, 420], [0, 330]);
  const s1 = interpolate(f, [0, 420], [1, 1.5]);

  return (
    <AbsoluteFill style={{background: '#0d0b08'}}>
      <AbsoluteFill style={{
        background: `radial-gradient(ellipse 1500px 1000px at 22% 32%, rgba(${hue},0.13) 0%, rgba(${hue},0.05) 38%, transparent 70%)`,
        transform: `translate(${x1}px, ${y1}px) scale(${s1})`,
      }} />
      <AbsoluteFill style={{
        background: 'radial-gradient(ellipse 1300px 900px at 84% 74%, rgba(70,110,150,0.10) 0%, transparent 66%)',
        transform: `translate(${x2}px, ${-y1}px)`,
      }} />
      <AbsoluteFill style={{
        background: 'linear-gradient(160deg, rgba(255,240,220,0.035) 0%, transparent 45%, rgba(0,0,0,0.28) 100%)',
      }} />
      {/* Dither: plain alpha at about one luminance level, which is what stops
          the washes above from banding. Not decoration, and not overlay-blended
          grain, which contributes almost nothing over near-black. */}
      <AbsoluteFill style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3'/%3E%3C/filter%3E%3Crect width='140' height='140' filter='url(%23n)' opacity='0.055'/%3E%3C/svg%3E")`,
        opacity: 0.9,
      }} />
      <AbsoluteFill style={{
        background: 'radial-gradient(ellipse 1700px 1100px at 50% 50%, transparent 52%, rgba(0,0,0,0.42) 100%)',
      }} />
    </AbsoluteFill>
  );
};
