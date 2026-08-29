import {AbsoluteFill, useCurrentFrame, interpolate, Easing} from 'remotion';
import {Robot, ShieldWarning, UserFocus, ArrowRight, Gauge} from '@phosphor-icons/react';
import {C, FONT, MONO} from '../theme';
import {Sfx} from '../lib/Sfx';
import {Ground} from '../lib/Ground';
import {Odometer, DrawLine} from '../lib/Alive';
import {Spot, LiveBar, Rails} from '../lib/Life';
import {narration} from '../lib/narration';

/* What the product is, and where 370 actions actually go.

   The previous cut landed all three routes inside the first five seconds and
   then held the finished table for fifteen — 95% of the shot frozen, and the
   worst offender in the film. The rows are the same rows; what changed is that
   each one now arrives on the word that names it, stays lit while the voice is
   on it, and dims when the voice moves on. The screen is doing what the
   sentence is doing.

   The last beat is new. The narration ends by saying Watchspan measures whether
   the reviewer was still paying attention, and the old cut had nothing on
   screen for it, so the claim the whole film rests on played over a still
   table. Now the human row opens and asks the question. */

type Route = {
  key: string;
  v: number;
  pctW: number;
  Icon: typeof Robot;
  label: string;
  sub: string;
  tone: string;
};

const ROUTES: Route[] = [
  {key: 'ran',  v: 294, pctW: 0.794, Icon: Robot,         label: 'ran on its own',  sub: 'with an audit log',     tone: C.ember},
  {key: 'held', v: 7,   pctW: 0.019, Icon: ShieldWarning, label: 'held back',       sub: 'looked like an attack', tone: C.ink300},
  {key: 'sent', v: 69,  pctW: 0.186, Icon: UserFocus,     label: 'sent to a human', sub: 'for a real decision',   tone: C.ink100},
];

const Row: React.FC<Route & {at: number; until: number}> = ({
  at, until, v, pctW, Icon, label, sub, tone,
}) => {
  const f = useCurrentFrame();
  const p = interpolate(f - at, [0, 14], [0, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.bezier(0.16, 1, 0.3, 1),
  });
  return (
    <Spot from={at} to={until} before={0}>
      <div
        style={{
          display: 'grid', gridTemplateColumns: '58px 210px 320px 1fr',
          alignItems: 'center', gap: 28, padding: '20px 0',
          transform: `translateY(${(1 - p) * 14}px)`,
        }}
      >
        <Icon size={40} weight="light" color={tone} />
        {/* One baseline for all three: fixed-height box, figure bottom-aligned, so a
            three-digit and a one-digit number cannot drift apart. */}
        <div style={{height: 86, display: 'flex', alignItems: 'flex-end'}}>
          <Odometer value={v} delay={at + 4} size={82} color={tone} />
        </div>
        <div>
          <div style={{fontFamily: FONT.text, fontSize: 24, color: C.ink100}}>{label}</div>
          <div style={{fontFamily: FONT.text, fontSize: 16, color: C.ink500, marginTop: 3}}>{sub}</div>
        </div>
        <LiveBar at={at + 8} width={pctW} color={tone} seed={label} />
      </div>
    </Spot>
  );
};

export const What: React.FC = () => {
  const f = useCurrentFrame();
  const n = narration('what');

  const HEAD = 0;
  const SRC = n.at('of three hundred');
  const RAN = n.at('most ran');
  const HELD = n.at('a few were held');
  const SENT = n.at('and the rest');
  const MEASURE = n.at('went to a human');

  const l1 = interpolate(f, [HEAD, HEAD + 16], [0, 1], {
    extrapolateRight: 'clamp', easing: Easing.bezier(0.16, 1, 0.3, 1),
  });
  // Was SRC - 12, which left the lower two thirds of the frame empty for four
  // seconds while the headline was read. The scaffolding is not the payload, so
  // it arrives with the sentence and the figures still wait their turn.
  // The row arrives with its figure, not before it. Two earlier attempts were
  // both wrong: showing the row at frame 20 printed "0 actions in one run" for
  // three and a half seconds, and hiding only the number left a labelled row
  // with nothing where the figure goes.
  const src = interpolate(f, [SRC - 10, SRC + 6], [0, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.bezier(0.16, 1, 0.3, 1),
  });
  // The total counts up while the voice reads it out, rather than being printed.
  const total = Math.round(
    interpolate(f, [SRC, SRC + 46], [0, 370], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
      easing: Easing.bezier(0.16, 1, 0.3, 1)})
  );
  const ask = interpolate(f, [MEASURE - 6, MEASURE + 14], [0, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.bezier(0.16, 1, 0.3, 1),
  });

  return (
    <AbsoluteFill>
      <Ground />
      <Rails gap={110} speed={0.18} opacity={0.022} />
      <AbsoluteFill style={{padding: '104px 130px', justifyContent: 'center'}}>
        <p
          style={{
            fontFamily: FONT.display, fontSize: 50, lineHeight: 1.2, color: C.ink100,
            letterSpacing: '-0.022em', maxWidth: 1280, margin: 0,
            opacity: l1, transform: `translateY(${(1 - l1) * 12}px)`,
          }}
        >
          Watchspan sits between an agent fleet and the people who approve what it does.
        </p>

        <div
          style={{
            display: 'flex', alignItems: 'center', gap: 16, marginTop: 42,
            opacity: src, transform: `translateY(${(1 - src) * 10}px)`,
          }}
        >
          {/* The figure appears when it starts counting, not before. Bringing the
              scaffolding forward to fill the frame left a literal "0 actions in
              one run" on screen for three and a half seconds, which is a false
              statement about the data, not a loading state. */}
          <span style={{fontFamily: MONO, fontSize: 34, color: C.ink300,
            fontVariantNumeric: 'tabular-nums', minWidth: 74, display: 'inline-block'}}>
            {total}
          </span>
          <span style={{fontFamily: FONT.text, fontSize: 20, color: C.ink500}}>actions in one run</span>
          <ArrowRight size={22} weight="light" color={C.ink700} />
          <span style={{fontFamily: FONT.text, fontSize: 15, letterSpacing: '0.16em',
            textTransform: 'uppercase', color: C.ink500}}>routed three ways</span>
        </div>
        <div style={{marginTop: 12}}><DrawLine at={SRC - 6} w="100%" /></div>

        <div style={{marginTop: 4, position: 'relative'}}>
          {/* The three rails the figures will land on, drawn early at low
              contrast: the shot has a shape from the first second instead of a
              sentence floating over nothing. */}
          {[0, 1, 2].map((i) => (
            <div key={i} style={{position: 'absolute', left: 296, right: 0, top: 62 + i * 126,
              height: 1, background: 'rgba(231,228,224,0.05)',
              opacity: interpolate(f, [SRC + i * 6, SRC + 18 + i * 6], [0, 1],
                {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})}} />
          ))}
          <Row {...ROUTES[0]} at={RAN} until={HELD - 8} />
          <Row {...ROUTES[1]} at={HELD} until={SENT - 8} />
          <Row {...ROUTES[2]} at={SENT} until={n.end} />
        </div>

        {/* The question the rest of the film answers, opening under the human row. */}
        <div
          style={{
            marginTop: 10, marginLeft: 296, opacity: ask,
            transform: `translateY(${(1 - ask) * 12}px)`,
            display: 'flex', alignItems: 'center', gap: 16,
            borderTop: `1px solid rgba(237,153,14,0.28)`, paddingTop: 20, maxWidth: 1020,
          }}
        >
          <Gauge size={30} weight="light" color={C.ember} />
          <span style={{fontFamily: FONT.display, fontSize: 30, color: C.ember, letterSpacing: '-0.015em'}}>
            Were they still paying attention when it arrived?
          </span>
        </div>
      </AbsoluteFill>

      <Sfx src="sweep.mp3" at={2} vol={0.10} />
      <Sfx src="enter.mp3" at={SRC - 8} vol={0.10} />
      <Sfx src="slide.mp3" at={SRC - 4} vol={0.09} />
      {[RAN, HELD, SENT].map((a) => <Sfx key={`t${a}`} src="tick.mp3" at={a} vol={0.06} />)}
      {[RAN, HELD, SENT].map((a) => <Sfx key={`p${a}`} src="pop.mp3" at={a + 6} vol={0.08} />)}
      <Sfx src="pluck.mp3" at={MEASURE - 4} vol={0.14} />
    </AbsoluteFill>
  );
};
