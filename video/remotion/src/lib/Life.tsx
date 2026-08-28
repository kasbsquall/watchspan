import React from 'react';
import {useCurrentFrame, useVideoConfig, interpolate, spring, Easing} from 'remotion';
import {noise2D} from '@remotion/noise';
import {C, MONO} from '../theme';
import {Sfx} from './Sfx';

/* Continuous life, as opposed to entrance animation.

   THE MEASUREMENT THAT PRODUCED THIS FILE. Sampling the finished film at 4 fps,
   cropping off the subtitle band and differencing consecutive frames showed 130
   of 156 seconds visually FROZEN. Every scene animated its entrance in the
   first four or five seconds and then held a still image for ten to fifteen.
   Design reviews never caught it because a still frame of any of those scenes
   looks composed and correct. Only the difference between frames shows it.

   Alive.tsx already establishes the constraint this has to respect: the
   container may not creep, because a 0.01-0.04% per-frame scale re-rasterises
   every glyph and shimmers, and a translation large enough to read pushes
   centred content past the overscan. So life goes to the ELEMENTS, and these
   are the elements that can carry it safely:

     - opacity, always
     - transform on layers that contain NO TEXT (glows, washes, rules, bars)
     - SVG stroke geometry
     - the content itself changing: a row lighting up as it is spoken, a figure
       that flips when the narration says it flipped

   Nothing here scales a glyph over time. */

/* THE CAMERA. Read this before changing it; it has been got wrong three times.

   Attempt 1: a slow continuous scale creep. Shimmered.
   Attempt 2: a slow continuous translation. Fixed the shimmer and pushed centred
              content off the edge, because the travel exceeded the overscan.
   Attempt 3: a slow continuous scale on a compositor-promoted layer. The
              promotion did stop the browser re-rasterising the glyphs, and it
              still boiled, which is why the rule below exists.

   THE RULE. A camera move on text must displace at least ONE DEVICE PIXEL per
   frame, or it must not move at all.

   Below that, the glyphs do not travel; only their antialiasing is resampled,
   differently every frame, and on thin strokes that reads as boiling. Layer
   promotion cannot help, because the resample happens either way. At 1920 wide
   with a centred origin, one pixel at the frame edge is a scale change of
   1/960 = 0.00104 per frame. A 5% push spread over a 600-frame scene changes
   0.00008 per frame: thirteen times under the floor. That is the whole bug, and
   no easing curve or willChange hint fixes it.

   So the camera moves in BEATS. Each push covers 0.02 to 0.03 of scale in 14
   frames, which is 0.0015 to 0.002 per frame, comfortably over the floor, and
   then it HOLDS perfectly still until the next beat. Between beats the frame is
   alive because the ELEMENTS are moving, which is what Alive.tsx said all along.

   Scale only ever increases, so the frame crops inward and can never reveal
   empty edge. Keep the total under about 1.09 or the crop eats the padding. */
const PUSH_FRAMES = 14;
const MIN_STEP = 0.02; // keeps every frame of a push over the one-pixel floor

export const Camera: React.FC<{
  children: React.ReactNode;
  beats: number[];
  step?: number;
  origin?: string;
}> = ({children, beats, step = 0.024, origin = '50% 50%'}) => {
  const f = useCurrentFrame();
  const size = Math.max(step, MIN_STEP);
  let s = 1;
  for (const b of beats) {
    s += interpolate(f - b, [0, PUSH_FRAMES], [0, size], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: Easing.bezier(0.16, 1, 0.3, 1),
    });
  }
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        transform: `scale(${s})`,
        transformOrigin: origin,
      }}
    >
      {children}
    </div>
  );
};

/* The dark breath at a scene boundary. Scenes are cut to the voiceover and their
   durations may not move, so this cannot be a cross-dissolve that overlaps two
   scenes: it is a dip at each edge, inside the scene's own length. */
export const SceneEdge: React.FC<{dur: number; inF?: number; outF?: number}> = ({
  dur,
  inF = 9,
  outF = 8,
}) => {
  const f = useCurrentFrame();
  const enter = interpolate(f, [0, inF], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const leave = interpolate(f, [dur - outF, dur], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const o = Math.max(enter, leave);
  if (o <= 0.002) return null;
  return <div style={{position: 'absolute', inset: 0, background: '#0d0b08', opacity: o, pointerEvents: 'none'}} />;
};

/** A decorative layer that never stops breathing. Text must not go inside it. */
export const Breathe: React.FC<{
  children: React.ReactNode;
  amp?: number;
  period?: number;
  phase?: number;
  style?: React.CSSProperties;
}> = ({children, amp = 0.03, period = 190, phase = 0, style}) => {
  const f = useCurrentFrame();
  const s = 1 + Math.sin(((f + phase) / period) * Math.PI * 2) * amp;
  const o = 1 + Math.sin(((f + phase) / (period * 0.7)) * Math.PI * 2) * amp * 2;
  return <div style={{transform: `scale(${s})`, opacity: Math.min(1, o), ...style}}>{children}</div>;
};

/** Organic drift for a non-text layer. Distinct seeds keep instances out of lockstep. */
export const Drift: React.FC<{
  children: React.ReactNode;
  seed?: string;
  amp?: number;
  speed?: number;
  style?: React.CSSProperties;
}> = ({children, seed = 'a', amp = 26, speed = 0.006, style}) => {
  const f = useCurrentFrame();
  const x = noise2D(seed + 'x', f * speed, 0) * amp;
  const y = noise2D(seed + 'y', 0, f * speed) * amp * 0.6;
  return <div style={{transform: `translate(${x}px, ${y}px)`, ...style}}>{children}</div>;
};

/** A specular bar that crosses a panel and keeps coming back. Put it inside a
 *  position:relative, overflow:hidden parent. This is the cheapest way to keep a
 *  code block or a card from reading as a screenshot. */
export const Sweep: React.FC<{period?: number; offset?: number; opacity?: number; angle?: number}> = ({
  period = 210,
  offset = 0,
  opacity = 0.05,
  angle = 108,
}) => {
  const f = useCurrentFrame();
  const p = (((f + offset) % period) + period) % period / period;
  const x = -40 + p * 190;
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        background: `linear-gradient(${angle}deg, transparent ${x - 16}%, rgba(255,240,220,${opacity}) ${x}%, transparent ${x + 16}%)`,
      }}
    />
  );
};

/** The row the narration is talking about, right now.
 *
 *  Rows are dim by default and come up to full while they are being spoken
 *  about, then settle to a middle state. That does two things at once: the
 *  screen is never the same two seconds running, and the viewer's eye is put on
 *  the number the voice is naming instead of hunting for it. */
export const Spot: React.FC<{
  from: number;
  to: number;
  children: React.ReactNode;
  rest?: number;
  before?: number;
  style?: React.CSSProperties;
}> = ({from, to, children, rest = 0.62, before = 0.32, style}) => {
  const f = useCurrentFrame();
  const o = interpolate(
    f,
    [from - 10, from, to, to + 16],
    [before, 1, 1, rest],
    {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.bezier(0.16, 1, 0.3, 1)}
  );
  const x = interpolate(f, [from - 10, from], [-6, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });
  return <div style={{opacity: o, transform: `translateX(${x}px)`, ...style}}>{children}</div>;
};

/** A figure that changes to a different figure on a beat, digit by digit.
 *
 *  Written for the moment in the ceiling scene where the voice says the 34
 *  became zero and the screen, in the released cut, went on showing 34. */
export const Flip: React.FC<{
  at: number;
  from: string;
  to: string;
  size?: number;
  fromColor?: string;
  toColor?: string;
}> = ({at, from, to, size = 40, fromColor = C.alarm, toColor = C.ok}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const p = spring({frame: f - at, fps, config: {damping: 15, mass: 0.6, stiffness: 140}});
  const shown = p > 0.5 ? to : from;
  const color = p > 0.5 ? toColor : fromColor;
  // One roll: the old figure leaves upward as the new one arrives from below.
  const y = p <= 0.5 ? -p * 2 * size * 0.5 : (1 - (p - 0.5) * 2) * size * 0.5;
  const o = p <= 0.5 ? 1 - p * 2 : (p - 0.5) * 2;
  return (
    <span style={{display: 'inline-block', overflow: 'hidden', height: size * 1.25, verticalAlign: 'bottom'}}>
      <span
        style={{
          display: 'inline-block',
          fontFamily: MONO,
          fontSize: size,
          lineHeight: 1.25,
          color,
          fontVariantNumeric: 'tabular-nums',
          transform: `translateY(${y}px)`,
          opacity: Math.max(0.05, o),
        }}
      >
        {shown}
      </span>
    </span>
  );
};

/** An expanding ring on a beat: the visual equivalent of the stamp sound. */
export const Ping: React.FC<{at: number; size?: number; color?: string; dur?: number; thickness?: number}> = ({
  at,
  size = 420,
  color = C.ember,
  dur = 34,
  thickness = 2,
}) => {
  const f = useCurrentFrame();
  const t = f - at;
  if (t < 0 || t > dur) return null;
  const p = t / dur;
  const s = interpolate(p, [0, 1], [0.25, 1], {easing: Easing.bezier(0.16, 1, 0.3, 1)});
  return (
    <div
      style={{
        position: 'absolute',
        left: '50%',
        top: '50%',
        width: size,
        height: size,
        marginLeft: -size / 2,
        marginTop: -size / 2,
        borderRadius: '50%',
        border: `${thickness}px solid ${color}`,
        opacity: (1 - p) * 0.5,
        transform: `scale(${s})`,
        pointerEvents: 'none',
      }}
    />
  );
};

/** A caret that blinks for as long as the shot is on screen. Two pixels of
 *  motion, but it is the difference between a code block and a photo of one. */
export const Caret: React.FC<{color?: string; h?: number; w?: number}> = ({color = C.ok, h = 30, w = 10}) => {
  const f = useCurrentFrame();
  const on = f % 34 < 19;
  return (
    <span
      style={{
        display: 'inline-block',
        width: w,
        height: h,
        background: color,
        opacity: on ? 0.85 : 0.08,
        marginLeft: 6,
        verticalAlign: 'text-bottom',
      }}
    />
  );
};

/** A bar that fills and then keeps a slow live wobble at its head, so a chart
 *  that has finished drawing still reads as a live instrument. */
export const LiveBar: React.FC<{
  at: number;
  width: number;
  color: string;
  h?: number;
  grow?: number;
  seed?: string;
}> = ({at, width, color, h = 12, grow = 26, seed = 'b'}) => {
  const f = useCurrentFrame();
  const p = interpolate(f - at, [0, grow], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });
  const jitter = p >= 1 ? noise2D(seed, f * 0.02, 0) * 0.008 : 0;
  return (
    <div style={{height: h, background: 'rgba(231,228,224,0.05)', borderRadius: 2, overflow: 'hidden', position: 'relative'}}>
      <div
        style={{
          height: '100%',
          width: `${Math.max(0, width * 100 * (p + jitter))}%`,
          background: color,
          opacity: 0.55,
          transition: 'none',
        }}
      />
      <Sweep period={260} offset={at} opacity={0.06} />
    </div>
  );
};

/* A sentence that appears at the speed it is spoken.

   Every scene in the released cut died in its tail: the last reveal landed well
   before the narration finished, and the closing sentence played over a still
   frame. A line built this way cannot have a dead tail, because it is still
   arriving for exactly as long as the voice is still saying it, and it is in
   sync by construction rather than by a frame number someone typed in.

   Pass the scene's narration object and the phrase; the words come from the
   caption timings, so re-recording the voice re-times the reveal on its own. */
export const Spoken: React.FC<{
  n: {words: {w: string; f: number; fe: number}[]};
  from: number;
  to: number;
  style?: React.CSSProperties;
  color?: string;
  dim?: string;
  tick?: boolean;
}> = ({n, from, to, style, color, dim, tick = true}) => {
  const f = useCurrentFrame();
  const words = n.words.filter((w) => w.f >= from - 1 && w.f <= to + 1);
  return (
    <span style={style}>
      {/* Every other word gets a keystroke, quiet enough to be texture. A tick on
          every word turns a sentence into a typewriter; one on every other reads
          as the line being set as it is spoken. */}
      {tick && words.filter((_, i) => i % 2 === 0).map((w, i) => (
        <Sfx key={`k${i}`} src="type.mp3" at={w.f} vol={0.028} />
      ))}
      {words.map((w, i) => {
        const p = interpolate(f - w.f, [0, 7], [0, 1], {
          extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
          easing: Easing.bezier(0.16, 1, 0.3, 1),
        });
        return (
          <span
            key={i}
            style={{
              display: 'inline-block',
              opacity: p,
              transform: `translateY(${(1 - p) * 10}px)`,
              color: dim && f < w.f ? dim : color,
              marginRight: '0.28em',
            }}
          >
            {w.w}
          </span>
        );
      })}
    </span>
  );
};

/** Faint horizontal rules that travel slowly upward behind a panel. Contains no
 *  text, so it may move as much as it likes. */
export const Rails: React.FC<{gap?: number; speed?: number; opacity?: number}> = ({
  gap = 74,
  speed = 1.1,
  opacity = 0.035,
}) => {
  const f = useCurrentFrame();
  const y = -((f * speed) % gap);
  return (
    <div
      style={{
        position: 'absolute',
        inset: -gap,
        pointerEvents: 'none',
        transform: `translateY(${y}px)`,
        backgroundImage: `repeating-linear-gradient(180deg, rgba(231,228,224,${opacity}) 0 1px, transparent 1px ${gap}px)`,
      }}
    />
  );
};
