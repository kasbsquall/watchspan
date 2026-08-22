import {AbsoluteFill, useCurrentFrame, interpolate, Easing} from 'remotion';
import {Robot, ShieldWarning, UserFocus, ArrowRight} from '@phosphor-icons/react';
import {C, FONT, MONO} from '../theme';
import {Sfx} from '../lib/Sfx';
import {Ground} from '../lib/Ground';
import {Odometer, DrawLine} from '../lib/Alive';

/* What the product is, and where 370 actions actually go.

   Rebuilt after three notes: the figures sat on different baselines because the
   hero was set larger, the curved arrows on the right read as decoration
   because nothing labelled them, and the scene carried no iconography at all.
   Now the three routes ARE the composition: one row each, icon, figure, label
   and a bar whose width is the share. Every figure sits on one baseline. */

const ROUTES = [
  {at: 34,  v: 294, pctW: 0.794, Icon: Robot,        label: 'ran on its own',  sub: 'with an audit log',    tone: C.ember},
  {at: 92,  v: 7,   pctW: 0.019, Icon: ShieldWarning, label: 'held back',       sub: 'looked like an attack', tone: C.ink300},
  {at: 148, v: 69,  pctW: 0.186, Icon: UserFocus,     label: 'sent to a human', sub: 'for a real decision',   tone: C.ink100},
];

const Route: React.FC<(typeof ROUTES)[number]> = ({at, v, pctW, Icon, label, sub, tone}) => {
  const f = useCurrentFrame();
  const p = interpolate(f - at, [0, 14], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
    easing: Easing.bezier(0.16, 1, 0.3, 1)});
  const bar = interpolate(f - at - 8, [0, 26], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
    easing: Easing.bezier(0.16, 1, 0.3, 1)});
  return (
    <div style={{
      display: 'grid', gridTemplateColumns: '58px 210px 320px 1fr', alignItems: 'center',
      gap: 28, padding: '20px 0', opacity: p, transform: `translateY(${(1 - p) * 14}px)`,
    }}>
      <Icon size={40} weight="light" color={tone} />
      {/* One baseline for all three: the container is a fixed height and the
          figure is bottom-aligned inside it, so a 3-digit and a 1-digit number
          cannot drift apart. */}
      <div style={{height: 86, display: 'flex', alignItems: 'flex-end'}}>
        <Odometer value={v} delay={at + 4} size={82} color={tone} />
      </div>
      <div>
        <div style={{fontFamily: FONT.text, fontSize: 24, color: C.ink100}}>{label}</div>
        <div style={{fontFamily: FONT.text, fontSize: 16, color: C.ink500, marginTop: 3}}>{sub}</div>
      </div>
      <div style={{height: 12, background: 'rgba(231,228,224,0.05)', borderRadius: 2, overflow: 'hidden'}}>
        <div style={{
          height: '100%', width: `${pctW * 100}%`, background: tone, opacity: 0.55,
          transform: `scaleX(${bar})`, transformOrigin: 'left',
        }} />
      </div>
    </div>
  );
};

export const What: React.FC = () => {
  const f = useCurrentFrame();
  const l1 = interpolate(f, [0, 16], [0, 1], {extrapolateRight: 'clamp', easing: Easing.bezier(0.16, 1, 0.3, 1)});
  const src = interpolate(f, [16, 30], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
    easing: Easing.bezier(0.16, 1, 0.3, 1)});

  return (
    <AbsoluteFill>
      <Ground />
      <AbsoluteFill style={{padding: '120px 130px', justifyContent: 'center'}}>
        <p style={{fontFamily: FONT.display, fontSize: 50, lineHeight: 1.2, color: C.ink100,
          letterSpacing: '-0.022em', maxWidth: 1280, margin: 0,
          opacity: l1, transform: `translateY(${(1 - l1) * 12}px)`}}>
          Watchspan sits between an agent fleet and the people who approve what it does.
        </p>

        {/* The source of the split, stated once, so the rows below have an origin. */}
        <div style={{display: 'flex', alignItems: 'center', gap: 16, marginTop: 46,
          opacity: src, transform: `translateY(${(1 - src) * 10}px)`}}>
          <span style={{fontFamily: MONO, fontSize: 34, color: C.ink300}}>370</span>
          <span style={{fontFamily: FONT.text, fontSize: 20, color: C.ink500}}>actions in one run</span>
          <ArrowRight size={22} weight="light" color={C.ink700} />
          <span style={{fontFamily: FONT.text, fontSize: 15, letterSpacing: '0.16em',
            textTransform: 'uppercase', color: C.ink500}}>routed three ways</span>
        </div>
        <div style={{marginTop: 14}}><DrawLine at={26} w="100%" /></div>

        <div style={{marginTop: 8}}>
          {ROUTES.map((r) => <Route key={r.v} {...r} />)}
        </div>
      </AbsoluteFill>

      <Sfx src="sweep.mp3" at={2} vol={0.10} />
      <Sfx src="enter.mp3" at={18} vol={0.10} />
      {ROUTES.map((r) => <Sfx key={r.v} src="tick.mp3" at={r.at} vol={0.06} />)}
      {ROUTES.map((r) => <Sfx key={`p${r.v}`} src="pop.mp3" at={r.at + 6} vol={0.08} />)}
    </AbsoluteFill>
  );
};
