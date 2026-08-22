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
  /** kept for call-site compatibility; see the note below on why it is fixed */
  zoom?: number;
  origin?: string;
  /** lateral travel across the whole scene, in px */
  drift?: number;
}> = ({children, dur, zoom = 0.06, origin = '50% 46%', drift}) => {
  const f = useCurrentFrame();

  /* WHY THIS DOES NOT ANIMATE SCALE.
     A slow scale creep is the classic shimmer: at 0.01-0.04% per frame every
     glyph is re-rasterised at a nearly identical size and the subpixel grid
     jitters, which reads as the whole frame vibrating. Measured on this film's
     own scenes before the fix.
     So the camera is a TRANSLATION over a container held at a FIXED scale. The
     content is rasterised once at that size and then simply moved, which is
     smooth by construction. A deliberate push-in is a different tool: large and
     fast (see Push below), where each frame lands at a clearly different size
     and no shimmer is possible. */
  const p = interpolate(f, [0, dur], [0, 1], {
    extrapolateRight: 'clamp',
    easing: Easing.bezier(0.5, 0, 0.25, 1),
  });

  /* A fixed overscan gives the translation room to move without exposing an
     edge. The travel has to be big enough to SEE: 34px over 18 seconds measured
     at 0.05% of pixels changing per frame, which is a still image with extra
     steps. Around 120px reads as a slow camera and still cannot shimmer,
     because translation does not resample glyphs. */
  const fixedScale = 1 + Math.max(0.09, zoom);
  const travel = drift ?? -120;
  const rise = -64;

  return (
    <AbsoluteFill
      style={{
        transform: `scale(${fixedScale}) translate3d(${travel * p}px, ${rise * p}px, 0)`,
        transformOrigin: origin,
        willChange: 'transform',
      }}
    >
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
