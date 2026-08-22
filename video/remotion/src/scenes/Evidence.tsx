import {AbsoluteFill, useCurrentFrame, interpolate, Easing, spring, useVideoConfig} from 'remotion';
import {C, FONT, MONO} from '../theme';
import {Sfx} from '../lib/Sfx';

/* The Article 14 record. The ratio carries the scene, and its rule sits beside
   it: an audit number whose criterion lives only in the code is an assertion
   wearing evidence's clothes. */
export const Evidence: React.FC = () => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const head = interpolate(f, [0, 12], [0, 1], {extrapolateRight: 'clamp', easing: Easing.bezier(0.16, 1, 0.3, 1)});
  const p = spring({frame: f - 40, fps, config: {damping: 200, mass: 0.8}});
  const num = Math.round(p * 14);
  const rule = interpolate(f, [150, 168], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const law = interpolate(f, [280, 300], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

  return (
    <AbsoluteFill style={{background: C.ink950, padding: '120px 110px'}}>
      <div style={{position: 'absolute', width: 820, height: 520, borderRadius: '50%', left: 140, top: 200,
        background: 'radial-gradient(circle, rgba(237,153,14,0.09) 0%, transparent 64%)', filter: 'blur(30px)'}} />

      <div style={{opacity: head, fontFamily: FONT.text, fontSize: 15, letterSpacing: '0.18em',
        textTransform: 'uppercase', color: C.ink500}}>The record</div>

      <div style={{display: 'flex', alignItems: 'baseline', gap: 30, marginTop: 40}}>
        <span style={{fontFamily: MONO, fontSize: 200, lineHeight: 1, color: C.ember,
          fontVariantNumeric: 'tabular-nums'}}>{num}</span>
        <span style={{fontFamily: FONT.display, fontSize: 58, color: C.ink300, letterSpacing: '-0.02em'}}>
          of 69 decisions
        </span>
      </div>
      <div style={{fontFamily: FONT.text, fontSize: 28, color: C.ink300, marginTop: 18, maxWidth: 1100}}>
        reached a human with attention left to give.
      </div>

      <div style={{marginTop: 40, opacity: rule, transform: `translateY(${(1 - rule) * 8}px)`,
        paddingTop: 22, borderTop: `1px solid ${C.line}`, maxWidth: 1180}}>
        <div style={{fontFamily: FONT.text, fontSize: 18, color: C.ink500}}>
          The rule, on screen and not only in the code: review depth above zero,
          and more than <span style={{fontFamily: MONO, color: C.ink300}}>10%</span> of the
          reviewer&rsquo;s budget still remaining.
        </div>
      </div>

      <div style={{position: 'absolute', bottom: 190, left: 110, right: 110, opacity: law,
        transform: `translateY(${(1 - law) * 8}px)`, fontFamily: FONT.display, fontSize: 34,
        color: C.ink100, letterSpacing: '-0.015em', lineHeight: 1.35}}>
        Article 14 has required effective oversight since August.
        <span style={{color: C.ember}}> This is what effective looks like when you measure it.</span>
      </div>

      <Sfx src="whoosh.mp3" at={1} vol={0.14} />
      <Sfx src="stamp.mp3" at={42} vol={0.32} />
      <Sfx src="click.mp3" at={152} vol={0.07} />
    </AbsoluteFill>
  );
};
