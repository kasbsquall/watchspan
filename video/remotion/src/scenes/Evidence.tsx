import {AbsoluteFill, useCurrentFrame, interpolate, Easing, spring, useVideoConfig} from 'remotion';
import {C, FONT, MONO} from '../theme';
import {Sfx} from '../lib/Sfx';
import {Ground} from '../lib/Ground';
import {Spot, Rails, Ping, Kinetic} from '../lib/Life';
import {narration} from '../lib/narration';

/* The Article 14 record.

   The ratio is the whole scene, and the released cut printed it as two numbers
   and then held them for eleven seconds. A ratio drawn as a ratio can be
   counted, so the sixty-nine decisions arrive one at a time and the fourteen
   that had attention behind them light up on the word "fourteen". The viewer
   sees how few that is before the voice tells them. */

const DOTS = 69;
const LIT = 14;
const COLS = 23;

const Dot: React.FC<{i: number; arriveAt: number; litAt: number}> = ({i, arriveAt, litAt}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  // Sixty-nine staggered entrances would take too long to read, so they arrive
  // in a tight wave: the whole field lands in about a second and a half.
  const p = spring({frame: f - arriveAt - i * 0.6, fps, config: {damping: 16, mass: 0.4, stiffness: 150}});
  const lit = i < LIT;
  const l = lit
    ? interpolate(f - litAt - i * 1.6, [0, 10], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})
    : 0;
  return (
    <div
      style={{
        width: 26, height: 26, borderRadius: 2,
        border: `1px solid ${lit ? `rgba(237,153,14,${0.25 + l * 0.75})` : 'rgba(231,228,224,0.14)'}`,
        background: lit ? `rgba(237,153,14,${l * 0.85})` : 'rgba(231,228,224,0.035)',
        boxShadow: lit && l > 0.5 ? `0 0 14px rgba(237,153,14,${l * 0.5})` : 'none',
        opacity: p,
        transform: `scale(${0.6 + p * 0.4})`,
      }}
    />
  );
};

export const Evidence: React.FC = () => {
  const f = useCurrentFrame();
  const n = narration('evidence');

  const RECORD = n.at('the record');
  const SIXTY = n.at('who reviewed what');
  const FOURTEEN = n.at('with how much');
  const ARTICLE = n.at('article fourteen');
  const EFFECTIVE = n.at('from december');

  const head = interpolate(f, [0, 12], [0, 1], {extrapolateRight: 'clamp', easing: Easing.bezier(0.16, 1, 0.3, 1)});
  const num = Math.round(
    interpolate(f, [FOURTEEN, FOURTEEN + 26], [0, LIT], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})
  );
  const rule = interpolate(f, [ARTICLE - 30, ARTICLE - 12], [0, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });
  const law = interpolate(f, [ARTICLE - 6, ARTICLE + 14], [0, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.bezier(0.16, 1, 0.3, 1),
  });

  return (
    <AbsoluteFill>
      <Ground tint="ember" />
      <Rails gap={100} speed={0.17} opacity={0.02} />
      <AbsoluteFill style={{padding: '104px 110px', justifyContent: 'center'}}>
        <div style={{opacity: head, fontFamily: FONT.text, fontSize: 15, letterSpacing: '0.18em',
          textTransform: 'uppercase', color: C.ink500}}>The record</div>

        <div style={{display: 'flex', alignItems: 'flex-start', gap: 70, marginTop: 34}}>
          <div>
            <div style={{display: 'flex', alignItems: 'baseline', gap: 18}}>
              <span style={{fontFamily: MONO, fontSize: 168, lineHeight: 1, color: C.ember,
                fontVariantNumeric: 'tabular-nums'}}>{num}</span>
              <span style={{fontFamily: FONT.display, fontSize: 44, color: C.ink300, letterSpacing: '-0.02em'}}>
                of 69
              </span>
            </div>
            <div style={{fontFamily: FONT.text, fontSize: 24, color: C.ink300, marginTop: 10, maxWidth: 420}}>
              decisions reached a human with attention left to give.
            </div>
          </div>

          <div style={{position: 'relative', paddingTop: 24}}>
            <Ping at={FOURTEEN} size={340} color={C.ember} dur={40} />
            <div style={{display: 'grid', gridTemplateColumns: `repeat(${COLS}, 26px)`, gap: 9}}>
              {Array.from({length: DOTS}, (_, i) => (
                <Dot key={i} i={i} arriveAt={SIXTY} litAt={FOURTEEN} />
              ))}
            </div>
            <div style={{fontFamily: FONT.text, fontSize: 15, color: C.ink500, marginTop: 16,
              letterSpacing: '0.06em'}}>
              one square per decision that reached a human
            </div>
          </div>
        </div>

        <div style={{marginTop: 20, fontFamily: FONT.text, fontSize: 15, color: C.ink500,
          opacity: rule}}>
          Reviewer behaviour is simulated from a declared model. The fleet, the API
          and the traces are real.
        </div>

        <div style={{marginTop: 24, opacity: rule, transform: `translateY(${(1 - rule) * 8}px)`,
          paddingTop: 20, borderTop: `1px solid ${C.line}`, maxWidth: 1240}}>
          <div style={{fontFamily: FONT.text, fontSize: 18, color: C.ink500}}>
            The rule, on screen and not only in the code: review depth above zero, and more than{' '}
            <span style={{fontFamily: MONO, color: C.ink300}}>10%</span> of the reviewer&rsquo;s budget still remaining.
          </div>
        </div>

        <div style={{marginTop: 40, opacity: law,
          transform: `translateY(${(1 - law) * 8}px)`}}>
          <Spot from={ARTICLE} to={EFFECTIVE - 10} before={0.4}>
            <div style={{fontFamily: FONT.display, fontSize: 32, color: C.ink100,
              letterSpacing: '-0.015em', lineHeight: 1.35}}>
              EU AI Act, Article 14: effective human oversight, in force since 2 August 2026.
            </div>
          </Spot>
          <div style={{marginTop: 8, minHeight: 46}}>
            <Kinetic at={EFFECTIVE} text="Measured, not asserted." size={36} color={C.ember}
              style={{fontFamily: FONT.display}} />
          </div>
        </div>
      </AbsoluteFill>

      <Sfx src="sweep.mp3" at={2} vol={0.10} />
      <Sfx src="whoosh.mp3" at={1} vol={0.14} />
      <Sfx src="enter.mp3" at={SIXTY} vol={0.12} />
      <Sfx src="stamp.mp3" at={FOURTEEN} vol={0.30} />
      <Sfx src="pluck.mp3" at={FOURTEEN} vol={0.14} />
      <Sfx src="appear.mp3" at={ARTICLE} vol={0.12} />
    </AbsoluteFill>
  );
};
