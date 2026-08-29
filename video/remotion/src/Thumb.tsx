import {AbsoluteFill} from 'remotion';
import {C, FONT, MONO} from './theme';

/* The YouTube thumbnail, authored at 1280x720 rather than grabbed from the film.

   A still composed for a 1920 canvas is a grey smear at the 168 pixels a
   sidebar renders, so this obeys its own rules: two words carrying the whole
   image, one high-contrast object, and the mark small so a viewer who never
   clicks still registers the product.

   The previous thumbnail showed the attention gauge at zero, which was the old
   film's argument. This cut's argument is that the instrument gets turned on
   the viewer, and the phrase that does that work is the verdict in the second
   person. "ON YOU" is the hook and it carries the accent.

   Every figure on it is the one the shot session produced: eleven of twelve,
   under three seconds, nothing opened. */

const Mark: React.FC = () => (
  <svg viewBox="0 0 64 64" width={34} height={34}>
    <g fill="none" stroke={C.ink300} strokeLinecap="square">
      <path d="M 10 16 L 10 48" strokeWidth={2.6} />
      <path d="M 54 16 L 54 48" strokeWidth={2.6} strokeOpacity={0.55} />
    </g>
    <path
      d="M 10 24 L 22 24 L 22 31 L 34 31 L 34 39 L 44 39 L 44 45 L 54 45"
      fill="none"
      stroke={C.ember}
      strokeWidth={3}
      strokeLinejoin="miter"
    />
  </svg>
);

export const Thumb: React.FC = () => (
  <AbsoluteFill style={{background: C.ink950}}>
    {/* One pool of light, the same grammar as the film's declaration moment. */}
    <div
      style={{
        position: 'absolute',
        width: 1000,
        height: 700,
        left: 300,
        top: 60,
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(230,67,67,0.15) 0%, transparent 62%)',
        filter: 'blur(40px)',
      }}
    />

    <div
      style={{
        position: 'absolute',
        width: 620,
        height: 620,
        right: -140,
        top: 50,
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(237,153,14,0.07) 0%, transparent 66%)',
        filter: 'blur(50px)',
      }}
    />

    <div style={{position: 'absolute', top: 46, left: 68, display: 'flex', alignItems: 'center', gap: 14}}>
      <Mark />
      <span
        style={{
          fontFamily: FONT.display,
          fontSize: 27,
          color: C.ink300,
          letterSpacing: '-0.02em',
          fontWeight: 600,
        }}
      >
        Watchspan
      </span>
    </div>

    <AbsoluteFill style={{padding: '92px 68px 68px', justifyContent: 'center'}}>
      <div
        style={{
          fontFamily: MONO,
          fontSize: 27,
          letterSpacing: '0.2em',
          textTransform: 'uppercase',
          color: C.ink500,
        }}
      >
        Watchspan&rsquo;s verdict <span style={{color: C.ember}}>on you</span>
      </div>

      {/* The two words the image is for. Stacked so each one can be as large as
          the frame allows, because a single line at this width would be half
          the size and unreadable in a sidebar. */}
      <div
        style={{
          fontFamily: FONT.display,
          fontSize: 156,
          lineHeight: 0.9,
          letterSpacing: '-0.035em',
          color: C.alarm,
          marginTop: 22,
          fontWeight: 700,
        }}
      >
        oversight
        <br />
        degraded
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          gap: 18,
          marginTop: 38,
          paddingTop: 24,
          borderTop: `1px solid ${C.line}`,
          maxWidth: 1010,
        }}
      >
        <span
          style={{
            fontFamily: MONO,
            fontSize: 72,
            lineHeight: 1,
            color: C.ember,
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          11
        </span>
        <span style={{fontFamily: FONT.text, fontSize: 29, color: C.ink300, lineHeight: 1.28}}>
          of your 12 approvals took under three
          <br />
          seconds, with nothing opened.
        </span>
      </div>
    </AbsoluteFill>
  </AbsoluteFill>
);
