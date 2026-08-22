import {AbsoluteFill, useCurrentFrame, interpolate, Easing, spring, useVideoConfig} from 'remotion';
import {C, FONT, MONO} from '../theme';
import {Sfx} from '../lib/Sfx';

/* What the product IS, in plain words, and the three numbers that are the
   autonomous action the event scores at 40%. All three are spoken. */
const Counter: React.FC<{to: number; delay: number; label: string; sub: string; hero?: boolean}> = ({
  to, delay, label, sub, hero,
}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const p = spring({frame: f - delay, fps, config: {damping: 200, mass: 0.7}});
  const v = Math.round(p * to);
  return (
    <div style={{opacity: interpolate(f - delay, [0, 8], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})}}>
      <div style={{fontFamily: MONO, fontSize: hero ? 128 : 76, lineHeight: 1,
        color: hero ? C.ember : C.ink100, fontVariantNumeric: 'tabular-nums'}}>{v}</div>
      <div style={{fontFamily: FONT.text, fontSize: 20, color: C.ink300, marginTop: 10}}>{label}</div>
      <div style={{fontFamily: FONT.text, fontSize: 15, color: C.ink500, marginTop: 2}}>{sub}</div>
    </div>
  );
};

export const What: React.FC = () => {
  const f = useCurrentFrame();
  const line = interpolate(f, [0, 14], [0, 1], {extrapolateRight: 'clamp', easing: Easing.bezier(0.16, 1, 0.3, 1)});
  return (
    <AbsoluteFill style={{background: C.ink950, padding: '150px 130px', justifyContent: 'center'}}>
      <div style={{position: 'absolute', width: 760, height: 500, borderRadius: '50%', left: 90, top: 320,
        background: 'radial-gradient(circle, rgba(237,153,14,0.09) 0%, transparent 65%)', filter: 'blur(30px)'}} />
      <p style={{fontFamily: FONT.display, fontSize: 52, lineHeight: 1.22, color: C.ink100,
        letterSpacing: '-0.02em', maxWidth: 1260, margin: 0,
        opacity: line, transform: `translateY(${(1 - line) * 10}px)`}}>
        Watchspan sits between an agent fleet and the people who approve what it does.
      </p>
      <div style={{display: 'flex', gap: 130, marginTop: 92, alignItems: 'flex-end'}}>
        <Counter to={294} delay={26} label="ran on its own" sub="with an audit log" hero />
        <Counter to={7} delay={44} label="held back" sub="looked like an attack" />
        <Counter to={69} delay={60} label="sent to a human" sub="of 370 actions" />
      </div>
      <Sfx src="whoosh.mp3" at={1} vol={0.14} />
      <Sfx src="pop.mp3" at={26} vol={0.09} />
      <Sfx src="pop.mp3" at={44} vol={0.09} />
      <Sfx src="pop.mp3" at={60} vol={0.09} />
    </AbsoluteFill>
  );
};
