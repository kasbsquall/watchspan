import {AbsoluteFill, useCurrentFrame, interpolate, Easing, Img, staticFile, spring, useVideoConfig} from 'remotion';
import {C, FONT, MONO} from '../theme';
import {Sfx} from '../lib/Sfx';
import {Ground} from '../lib/Ground';
import {Breathe, Ping} from '../lib/Life';
import {narration} from '../lib/narration';

/* The mark, the wordmark, the live URL and a QR beside it. A judge deliberating
   with a phone in their hand can open the product from the frame.

   The film's one line lands here for the second time, and the burned caption
   stands down for it (see the handover list in Captions.tsx) so the sentence
   appears once, at display size, instead of twice at two sizes. */

const Line: React.FC<{at: number; text: string; color: string; size: number}> = ({at, text, color, size}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  return (
    <div style={{display: 'flex', flexWrap: 'wrap', gap: `0 ${size * 0.26}px`, justifyContent: 'center'}}>
      {text.split(' ').map((w, i) => {
        const p = spring({frame: f - at - i * 2.5, fps, config: {damping: 18, mass: 0.55, stiffness: 130}});
        return (
          <span
            key={i}
            style={{
              fontFamily: FONT.display, fontSize: size, lineHeight: 1.16, color,
              letterSpacing: '-0.025em', fontWeight: 600,
              opacity: p, transform: `translateY(${(1 - p) * 20}px)`,
            }}
          >
            {w}
          </span>
        );
      })}
    </div>
  );
};

export const Close: React.FC = () => {
  const f = useCurrentFrame();
  const n = narration('close');

  const SELLS = n.at('everyone sells');
  const MEASURES = n.at('watchspan measures');

  const mark = interpolate(f, [0, 16], [0, 1], {extrapolateRight: 'clamp', easing: Easing.bezier(0.16, 1, 0.3, 1)});
  const tail = interpolate(f, [MEASURES + 26, MEASURES + 46], [0, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.bezier(0.16, 1, 0.3, 1),
  });

  return (
    <AbsoluteFill>
      <Ground tint="ember" />
      <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center'}}>
        <Breathe amp={0.035} period={150} style={{position: 'absolute'}}>
          <div style={{width: 1000, height: 700, borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(237,153,14,0.12) 0%, transparent 62%)', filter: 'blur(30px)'}} />
        </Breathe>
        <Ping at={MEASURES} size={900} color={C.ember} dur={54} thickness={1} />

        <div style={{display: 'flex', alignItems: 'center', gap: 24, opacity: mark,
          transform: `translateY(${(1 - mark) * 10}px)`, marginBottom: 44}}>
          <svg viewBox="0 0 64 64" width={64} height={64}>
            <g fill="none" stroke={C.ink100} strokeLinecap="square">
              <path d="M 10 16 L 10 48" strokeWidth={2.4} />
              <path d="M 54 16 L 54 48" strokeWidth={2.4} strokeOpacity={0.55} />
            </g>
            <path d="M 10 24 L 22 24 L 22 31 L 34 31 L 34 39 L 44 39 L 44 45 L 54 45"
              fill="none" stroke={C.ember} strokeWidth={2.6} strokeLinejoin="miter" />
          </svg>
          <span style={{fontFamily: FONT.display, fontSize: 66, color: C.ink100,
            letterSpacing: '-0.028em', fontWeight: 600}}>Watchspan</span>
        </div>

        <div style={{maxWidth: 1500}}>
          <Line at={SELLS} text="Everyone sells human in the loop." color={C.ink300} size={54} />
          <div style={{height: 14}} />
          <Line at={MEASURES} text="Watchspan measures whether that human is still there." color={C.ember} size={54} />
        </div>

        <div style={{display: 'flex', alignItems: 'center', gap: 24, marginTop: 56, opacity: tail,
          transform: `translateY(${(1 - tail) * 10}px)`}}>
          <Img src={staticFile('qr.svg')} style={{width: 124, height: 124}} />
          <div>
            <div style={{fontFamily: MONO, fontSize: 21, color: C.ink300}}>
              watchspan-web-45ejdvuucq-uc.a.run.app
            </div>
            <div style={{fontFamily: MONO, fontSize: 18, color: C.ink500, marginTop: 8}}>
              github.com/kasbsquall/watchspan
            </div>
          </div>
        </div>
      </AbsoluteFill>

      <Sfx src="appear.mp3" at={2} vol={0.14} />
      <Sfx src="glassy.mp3" at={SELLS} vol={0.16} />
      <Sfx src="confirm.mp3" at={MEASURES} vol={0.24} />
      <Sfx src="pluck.mp3" at={MEASURES + 28} vol={0.12} />
    </AbsoluteFill>
  );
};
