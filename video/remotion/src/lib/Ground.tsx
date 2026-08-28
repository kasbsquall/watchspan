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
export const Ground: React.FC<{tint?: 'ember' | 'alarm' | 'ok'; offset?: number}> = ({
  tint = 'ember',
  offset = 0,
}) => {
  // `offset` exists for one case: a sequence that has to hand over to another
  // without a visible seam. Every Sequence counts its own frames from zero, so
  // the overture's ground had travelled 103px by the cut and the hook's started
  // again at 0. The snap measured as a frame-difference spike of 3.4 where the
  // shot around it averages 0.27. Render the earlier sequence at a negative
  // offset and the two are continuous.
  const f = useCurrentFrame() + offset;
  const hue = tint === 'alarm' ? '230,67,67' : tint === 'ok' ? '104,185,134' : '237,153,14';

  // Parallax on the washes: full-bleed layers may translate, because the eye has
  // no fixed reference against them.
  //
  // These rates used to be 46px over 900 frames, which is 0.05px per frame. That
  // is below what a frame-difference measurement can even see, let alone a
  // viewer: the "moving" background contributed nothing and the scenes measured
  // as fully frozen. A scene is 300-800 frames, so the travel is scaled to that,
  // and the two washes run at different rates so they separate in depth.
  // The ground carries NO TEXT, so the one-pixel-per-frame floor that governs the
  // camera does not apply to it: it can travel as fast as taste allows and it can
  // never boil. It is therefore where the film's continuous motion belongs, and
  // these rates are three times what they were, because at 1px a frame on a
  // low-contrast blurred wash the change was still under the noise.
  const x1 = interpolate(f, [0, 420], [0, -900]);
  const y1 = interpolate(f, [0, 420], [0, 470]);
  const x2 = interpolate(f, [0, 420], [0, 700]);
  const s1 = interpolate(f, [0, 420], [1, 1.9]);
  // A slow bloom on the warm wash, so the luminance of the frame is never the
  // same two seconds running even where nothing is entering or leaving.
  const breath = 1 + Math.sin(f / 74) * 0.30;

  return (
    <AbsoluteFill style={{background: '#0d0b08'}}>
      <AbsoluteFill style={{
        background: `radial-gradient(ellipse 1500px 1000px at 22% 32%, rgba(${hue},${(0.17 * breath).toFixed(3)}) 0%, rgba(${hue},${(0.06 * breath).toFixed(3)}) 38%, transparent 70%)`,
        transform: `translate(${x1}px, ${y1}px) scale(${s1})`,
      }} />
      <AbsoluteFill style={{
        background: `radial-gradient(ellipse 1300px 900px at 84% 74%, rgba(70,110,150,${(0.14 / breath).toFixed(3)}) 0%, transparent 66%)`,
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
