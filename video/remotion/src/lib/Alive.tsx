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
  dur: number;
  zoom?: number;
  origin?: string;
  drift?: number;
}> = ({children, dur, zoom = 0, origin = '50% 50%'}) => {
  const f = useCurrentFrame();

  /* THE CAMERA DOES NOT DRAG THE FRAME.

     Two failed attempts are worth recording. A slow scale creep shimmers,
     because 0.01-0.04% per frame re-rasterises every glyph at a nearly
     identical size. Replacing it with a slow translation fixed the shimmer and
     introduced a worse problem: 120px of travel against 86px of overscan
     pushes content off the edge, so scenes visibly slid away.

     Both were the same mistake, which is moving the whole composition to
     create life. Life belongs to the ELEMENTS: figures that count, bars that
     grow, rules that draw, rows that arrive. The container holds still.

     The only camera move allowed here is a forward push, and only as a single
     large, fast move on a beat (see Push), never as a creep. */
  const settle = interpolate(f, [0, 24], [1.012, 1], {
    extrapolateRight: 'clamp',
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });

  return (
    <AbsoluteFill style={{transform: `scale(${settle})`, transformOrigin: origin}}>
      {children}
    </AbsoluteFill>
  );
};

/* A deliberate push: large and fast, so every frame renders at a clearly
   different size. This is the one place scale may animate. */
export const Push: React.FC<{
  children: React.ReactNode; at: number; from?: number; to?: number; frames?: number; origin?: string;
}> = ({children, at, from = 1.22, to = 1.0, frames = 18, origin = '50% 50%'}) => {
  const f = useCurrentFrame();
  const s = interpolate(f - at, [0, frames], [from, to], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });
  return (
    <AbsoluteFill style={{transform: `scale(${s})`, transformOrigin: origin, willChange: 'transform'}}>
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
