import {AbsoluteFill} from 'remotion';
import {C, FONT, MONO} from './theme';

/* 3:2 variant, centred lockup.

   Where the other thumbnails lead with the headline and keep the mark small in
   a corner, this one puts the identity in the middle: mark and wordmark
   together, the line under them, and the gauge behind as the object that
   carries the silhouette. Built at 1200x800, never cropped from the 16:9. */
export const Thumb32b: React.FC = () => (
  <AbsoluteFill style={{background: C.ink950, alignItems: 'center', justifyContent: 'center'}}>
    {/* Warm ground with the same texture as the film, so the two match. */}
    <AbsoluteFill style={{
      background: 'radial-gradient(ellipse 1100px 760px at 50% 44%, rgba(237,153,14,0.13) 0%, rgba(237,153,14,0.04) 40%, transparent 72%)',
    }} />
    <AbsoluteFill style={{
      backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3'/%3E%3C/filter%3E%3Crect width='140' height='140' filter='url(%23n)' opacity='0.05'/%3E%3C/svg%3E")`,
    }} />
    <AbsoluteFill style={{
      background: 'radial-gradient(ellipse 1100px 800px at 50% 50%, transparent 48%, rgba(0,0,0,0.5) 100%)',
    }} />

    {/* The instrument sits BELOW the lockup, not behind it: crossing the
        wordmark with an arc reads as a rendering fault, not as depth. */}
    <div style={{position: 'absolute', bottom: 92, opacity: 0.7}}>
      {/* Full arc in its own viewBox: cropping it to a shorter box left two
          loose strokes that read as an artefact rather than a gauge. */}
      <svg width={380} height={213} viewBox="0 0 300 168">
        <path d="M 32 158 A 118 118 0 0 1 268 158" fill="none" stroke={C.ink800} strokeWidth={12} strokeLinecap="round" />
        <path d="M 32 158 A 118 118 0 0 1 52 100" fill="none" stroke={C.alarm} strokeWidth={12} strokeLinecap="round" />
      </svg>
    </div>

    <div style={{display: 'flex', alignItems: 'center', gap: 30, zIndex: 1, marginTop: -70}}>
      <svg viewBox="0 0 64 64" width={104} height={104}>
        <g fill="none" stroke={C.ink100} strokeLinecap="square">
          <path d="M 10 16 L 10 48" strokeWidth={2.4} />
          <path d="M 54 16 L 54 48" strokeWidth={2.4} strokeOpacity={0.55} />
        </g>
        <path d="M 10 24 L 22 24 L 22 31 L 34 31 L 34 39 L 44 39 L 44 45 L 54 45"
          fill="none" stroke={C.ember} strokeWidth={2.8} strokeLinejoin="miter" />
      </svg>
      <span style={{fontFamily: FONT.display, fontSize: 112, color: C.ink100,
        letterSpacing: '-0.035em', fontWeight: 600, lineHeight: 1}}>Watchspan</span>
    </div>

    <p style={{
      fontFamily: FONT.text, fontSize: 27, color: C.ink300, marginTop: 34,
      textAlign: 'center', maxWidth: 900, lineHeight: 1.45, zIndex: 1,
    }}>
      The human attention budget for agent fleets
    </p>

    <p style={{
      position: 'absolute', bottom: 46, fontFamily: MONO, fontSize: 18,
      color: C.ink500, letterSpacing: '0.04em', zIndex: 1,
    }}>
      measuring whether the human in the loop is still there
    </p>
  </AbsoluteFill>
);
