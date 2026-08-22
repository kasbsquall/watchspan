import {AbsoluteFill} from 'remotion';
import {C, FONT, MONO} from './theme';

/* Authored at 1280x720, not grabbed from the film: type composed for a 1920
   canvas is a grey smear at the 168px a sidebar renders. Three words, one
   high-contrast object, the mark small in a corner. */
export const Thumb: React.FC = () => (
  <AbsoluteFill style={{background: C.ink950, padding: 64, justifyContent: 'center'}}>
    <div style={{position: 'absolute', width: 760, height: 620, borderRadius: '50%', left: 380, top: 40,
      background: 'radial-gradient(circle, rgba(230,67,67,0.16) 0%, transparent 64%)', filter: 'blur(30px)'}} />

    <div style={{position: 'absolute', top: 40, left: 64, display: 'flex', alignItems: 'center', gap: 12}}>
      <svg viewBox="0 0 64 64" width={30} height={30}>
        <g fill="none" stroke={C.ink300} strokeLinecap="square">
          <path d="M 10 16 L 10 48" strokeWidth={2.6} />
          <path d="M 54 16 L 54 48" strokeWidth={2.6} strokeOpacity={0.55} />
        </g>
        <path d="M 10 24 L 22 24 L 22 31 L 34 31 L 34 39 L 44 39 L 44 45 L 54 45"
          fill="none" stroke={C.ember} strokeWidth={3} strokeLinejoin="miter" />
      </svg>
      <span style={{fontFamily: FONT.display, fontSize: 24, color: C.ink300,
        letterSpacing: '-0.02em', fontWeight: 600}}>Watchspan</span>
    </div>

    {/* The object: the gauge at zero. Its silhouette reads before any letter. */}
    <div style={{position: 'absolute', right: 70, top: 150}}>
      <svg width={420} height={236} viewBox="0 0 300 168">
        <path d="M 32 158 A 118 118 0 0 1 268 158" fill="none" stroke={C.ink800} strokeWidth={14} strokeLinecap="round" />
      </svg>
      <div style={{position: 'absolute', left: 0, right: 0, bottom: 4, textAlign: 'center',
        fontFamily: MONO, fontSize: 128, lineHeight: 1, color: C.alarm}}>0<span style={{fontSize: 48, color: C.ink500}}>%</span></div>
    </div>

    <div style={{fontFamily: FONT.display, fontSize: 96, lineHeight: 1.02, color: C.ink100,
      letterSpacing: '-0.035em', maxWidth: 700}}>
      Nobody<br />was<br /><span style={{color: C.alarm}}>reading.</span>
    </div>

    <div style={{position: 'absolute', bottom: 52, left: 64, fontFamily: FONT.text,
      fontSize: 21, color: C.ink500}}>
      the human attention budget for agent fleets
    </div>
  </AbsoluteFill>
);
