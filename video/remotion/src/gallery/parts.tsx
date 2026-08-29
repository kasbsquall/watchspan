import {AbsoluteFill} from 'remotion';
import {C, FONT, MONO} from '../theme';

/* Shared furniture for the Devpost gallery cards.

   A gallery card is not a film frame. The film's stills were letterboxed 16:9
   inside a 3:2 slot, carried a burned-in subtitle across the middle, and froze
   counters mid-roll, so a judge scrolling the listing saw "170" with a digit
   half-turned. These are authored at 1200x800 instead, and every figure on
   them is read from evidence.json rather than typed, which is how the ceiling
   card ended up quoting a threshold experiment the code had stopped producing.

   The frame is fixed and the body is centred between the two rails. The first
   pass let the body stack from the top and left 240 empty pixels above the
   source line on all seven cards, which reads as a slide someone abandoned
   halfway. */

export const Card: React.FC<{
  eyebrow: string;
  source: React.ReactNode;
  glow?: string;
  children: React.ReactNode;
}> = ({eyebrow, source, glow, children}) => (
  <AbsoluteFill style={{background: C.ink950}}>
    <div
      style={{
        position: 'absolute',
        width: 940,
        height: 720,
        left: 220,
        top: -70,
        borderRadius: '50%',
        background: `radial-gradient(circle, ${glow ?? 'rgba(237,153,14,0.07)'} 0%, transparent 66%)`,
        filter: 'blur(60px)',
      }}
    />

    <div style={{position: 'absolute', top: 50, left: 64, display: 'flex', alignItems: 'center', gap: 11}}>
      <Mark />
      <span
        style={{
          fontFamily: MONO,
          fontSize: 13,
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          color: C.ink500,
        }}
      >
        {eyebrow}
      </span>
    </div>

    <AbsoluteFill
      style={{
        padding: '104px 64px 96px',
        justifyContent: 'center',
      }}
    >
      {children}
    </AbsoluteFill>

    <div
      style={{
        position: 'absolute',
        left: 64,
        right: 64,
        bottom: 36,
        paddingTop: 16,
        borderTop: `1px solid ${C.line}`,
        fontFamily: MONO,
        fontSize: 12.5,
        color: C.ink700,
        letterSpacing: '0.02em',
      }}
    >
      {source}
    </div>
  </AbsoluteFill>
);

export const Mark: React.FC<{size?: number}> = ({size = 22}) => (
  <svg viewBox="0 0 64 64" width={size} height={size}>
    <g fill="none" stroke={C.ink500} strokeLinecap="square">
      <path d="M 10 16 L 10 48" strokeWidth={3} />
      <path d="M 54 16 L 54 48" strokeWidth={3} strokeOpacity={0.5} />
    </g>
    <path
      d="M 10 24 L 22 24 L 22 31 L 34 31 L 34 39 L 44 39 L 44 45 L 54 45"
      fill="none"
      stroke={C.ember}
      strokeWidth={3.4}
      strokeLinejoin="miter"
    />
  </svg>
);

export const Title: React.FC<{children: React.ReactNode; size?: number}> = ({children, size = 42}) => (
  <div
    style={{
      fontFamily: FONT.display,
      fontSize: size,
      fontWeight: 600,
      color: C.ink100,
      letterSpacing: '-0.022em',
      lineHeight: 1.08,
      textWrap: 'balance',
    }}
  >
    {children}
  </div>
);

export const Sub: React.FC<{children: React.ReactNode}> = ({children}) => (
  <div
    style={{
      fontFamily: FONT.text,
      fontSize: 18,
      color: C.ink300,
      lineHeight: 1.5,
      marginTop: 14,
      maxWidth: 900,
      textWrap: 'pretty',
    }}
  >
    {children}
  </div>
);

export const Fig: React.FC<{children: React.ReactNode; size?: number; color?: string}> = ({
  children,
  size = 76,
  color = C.ink100,
}) => (
  <span
    style={{
      fontFamily: MONO,
      fontSize: size,
      lineHeight: 1,
      color,
      fontVariantNumeric: 'tabular-nums lining-nums slashed-zero',
    }}
  >
    {children}
  </span>
);

export const Label: React.FC<{children: React.ReactNode}> = ({children}) => (
  <div
    style={{
      fontFamily: MONO,
      fontSize: 12,
      letterSpacing: '0.16em',
      textTransform: 'uppercase',
      color: C.ink500,
      marginTop: 9,
    }}
  >
    {children}
  </div>
);
