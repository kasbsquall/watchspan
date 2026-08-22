import {AbsoluteFill, useCurrentFrame, interpolate, Easing, spring, useVideoConfig} from 'remotion';
import React from 'react';
import {C, MONO} from '../theme';

/* Nothing in this film is ever frozen.

   The catch, learned the hard way: the 7-35 px/s drift that reads as alive on
   FULL-BLEED imagery reads as the whole screen sliding off on a CENTRED
   composition, because the text's distance to the frame edge is the reference.
   So centred content gets scale creep and almost no translation. */
export const Alive: React.FC<{
  children: React.ReactNode;
  /** total scene length in frames, so the move is derived from the whole shot */
  dur: number;
  /** how far the slow push travels; 0.05 is a breath, 0.12 is a push-in */
  zoom?: number;
  /** anchor of the push, as a percentage of the frame */
  origin?: string;
  /** tiny lateral travel, in px across the whole scene */
  drift?: number;
}> = ({children, dur, zoom = 0.055, origin = '50% 46%', drift = 0}) => {
  const f = useCurrentFrame();
  // Ease-in-out, not the UI ease-out: a camera has mass, and the heavy
  // ease-out front-loads 61% of the travel into the first ten frames.
  const p = interpolate(f, [0, dur], [0, 1], {
    extrapolateRight: 'clamp',
    easing: Easing.bezier(0.5, 0, 0.25, 1),
  });
  return (
    <AbsoluteFill
      style={{
        transform: `scale(${1 + zoom * p}) translateX(${drift * p}px)`,
        transformOrigin: origin,
      }}
    >
      {children}
    </AbsoluteFill>
  );
};

/* A figure that lands digit by digit rather than appearing. Springs per digit
   with a stagger, so a four-digit number reads as a mechanism settling. */
export const Odometer: React.FC<{
  value: number; delay?: number; size?: number; color?: string; suffix?: string;
}> = ({value, delay = 0, size = 120, color = C.ink100, suffix}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const digits = String(value).split('');
  return (
    <span style={{display: 'inline-flex', alignItems: 'baseline', fontFamily: MONO,
      fontSize: size, lineHeight: 1, color, fontVariantNumeric: 'tabular-nums'}}>
      {digits.map((d, i) => {
        const p = spring({frame: f - delay - i * 3, fps, config: {damping: 14, mass: 0.5, stiffness: 130}});
        const shown = Math.round(interpolate(p, [0, 1], [0, Number(d)]));
        return (
          <span key={i} style={{
            display: 'inline-block',
            transform: `translateY(${(1 - p) * 0.16 * size}px)`,
            opacity: Math.min(1, p * 1.6),
          }}>{shown}</span>
        );
      })}
      {suffix && <span style={{fontSize: size * 0.34, color: C.ink500, marginLeft: 4}}>{suffix}</span>}
    </span>
  );
};

/* A hairline that draws itself rather than switching on. */
export const DrawLine: React.FC<{at: number; w?: number | string; color?: string; h?: number}> = ({
  at, w = '100%', color = C.line, h = 1,
}) => {
  const f = useCurrentFrame();
  const p = interpolate(f - at, [0, 16], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
    easing: Easing.bezier(0.16, 1, 0.3, 1)});
  return <div style={{width: w, height: h, background: color, transform: `scaleX(${p})`, transformOrigin: 'left'}} />;
};
