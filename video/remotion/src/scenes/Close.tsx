import {AbsoluteFill, useCurrentFrame, interpolate, Easing, Img, staticFile} from 'remotion';
import {C, FONT, MONO} from '../theme';
import {Sfx} from '../lib/Sfx';
import {Ground} from '../lib/Ground';
import {Alive} from '../lib/Alive';

/* The mark, the wordmark, the live URL and a QR beside it. A judge deliberating
   with a phone in their hand can open the product from the frame. */
export const Close: React.FC = () => {
  const f = useCurrentFrame();
  const p = interpolate(f, [0, 16], [0, 1], {extrapolateRight: 'clamp', easing: Easing.bezier(0.16, 1, 0.3, 1)});
  const line = interpolate(f, [26, 44], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
    easing: Easing.bezier(0.16, 1, 0.3, 1)});
  const tail = interpolate(f, [64, 84], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

  return (
    <AbsoluteFill>
      <Ground tint={"ember"} />
      <Alive dur={182} zoom={0.09} origin={'50% 46%'}>
      <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center'}}>
      <div style={{position: 'absolute', width: 900, height: 620, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(237,153,14,0.10) 0%, transparent 62%)', filter: 'blur(30px)'}} />

      <div style={{display: 'flex', alignItems: 'center', gap: 26, opacity: p,
        transform: `translateY(${(1 - p) * 10}px)`}}>
        <svg viewBox="0 0 64 64" width={74} height={74}>
          <g fill="none" stroke={C.ink100} strokeLinecap="square">
            <path d="M 10 16 L 10 48" strokeWidth={2.4} />
            <path d="M 54 16 L 54 48" strokeWidth={2.4} strokeOpacity={0.55} />
          </g>
          <path d="M 10 24 L 22 24 L 22 31 L 34 31 L 34 39 L 44 39 L 44 45 L 54 45"
            fill="none" stroke={C.ember} strokeWidth={2.6} strokeLinejoin="miter" />
        </svg>
        <span style={{fontFamily: FONT.display, fontSize: 82, color: C.ink100,
          letterSpacing: '-0.028em', fontWeight: 600}}>Watchspan</span>
      </div>

      <p style={{fontFamily: FONT.display, fontSize: 40, color: C.ink300, marginTop: 46,
        letterSpacing: '-0.015em', textAlign: 'center', maxWidth: 1180, lineHeight: 1.35,
        opacity: line, transform: `translateY(${(1 - line) * 10}px)`}}>
        Everyone sells human in the loop.<br />
        <span style={{color: C.ember}}>Watchspan measures whether that human is still there.</span>
      </p>

      <div style={{display: 'flex', alignItems: 'center', gap: 24, marginTop: 62, opacity: tail}}>
        <Img src={staticFile('qr.svg')} style={{width: 132, height: 132}} />
        <div>
          <div style={{fontFamily: MONO, fontSize: 21, color: C.ink300}}>
            watchspan-web-45ejdvuucq-uc.a.run.app
          </div>
          <div style={{fontFamily: MONO, fontSize: 18, color: C.ink500, marginTop: 8}}>
            github.com/kasbsquall/watchspan
          </div>
        </div>
      </div>

      <Sfx src="whoosh.mp3" at={1} vol={0.14} />
      <Sfx src="confirm.mp3" at={28} vol={0.22} />
    </AbsoluteFill>
      </Alive>
            <Sfx src="appear.mp3" at={2} vol={0.14} />
      <Sfx src="glassy.mp3" at={28} vol={0.16} />
      <Sfx src="pluck.mp3" at={66} vol={0.12} />
      </AbsoluteFill>
  );
};
