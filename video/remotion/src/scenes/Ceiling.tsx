import {AbsoluteFill, useCurrentFrame, interpolate, Easing} from 'remotion';
import {C, FONT, MONO} from '../theme';
import {Sfx} from '../lib/Sfx';

/* The defect a judge found, and its fix, in numbers. The honest version: the
   calibration buys longer before oversight degrades, not more attentive
   reviews, and it must never buy it by letting danger run unseen. */
const Row: React.FC<{at: number; label: string; a: string; b: string; good?: boolean; bad?: boolean}> = ({
  at, label, a, b, good, bad,
}) => {
  const f = useCurrentFrame();
  const p = interpolate(f - at, [0, 10], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
    easing: Easing.bezier(0.16, 1, 0.3, 1)});
  return (
    <div style={{display: 'grid', gridTemplateColumns: '620px 200px 200px', alignItems: 'baseline',
      padding: '18px 0', borderTop: `1px solid ${C.line}`, opacity: p,
      transform: `translateY(${(1 - p) * 8}px)`}}>
      <span style={{fontFamily: FONT.text, fontSize: 25, color: C.ink300}}>{label}</span>
      <span style={{fontFamily: MONO, fontSize: 40, color: C.ink500, fontVariantNumeric: 'tabular-nums'}}>{a}</span>
      <span style={{fontFamily: MONO, fontSize: 40, fontVariantNumeric: 'tabular-nums',
        color: bad ? C.alarm : good ? C.ok : C.ink100}}>{b}</span>
    </div>
  );
};

export const Ceiling: React.FC = () => {
  const f = useCurrentFrame();
  const head = interpolate(f, [0, 12], [0, 1], {extrapolateRight: 'clamp', easing: Easing.bezier(0.16, 1, 0.3, 1)});
  const fix = interpolate(f, [430, 448], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
    easing: Easing.bezier(0.16, 1, 0.3, 1)});
  return (
    <AbsoluteFill style={{background: C.ink950, padding: '110px 100px'}}>
      <div style={{opacity: head}}>
        <div style={{fontFamily: FONT.text, fontSize: 15, letterSpacing: '0.18em',
          textTransform: 'uppercase', color: C.ink500}}>Raising the bar, measured</div>
        <div style={{display: 'grid', gridTemplateColumns: '620px 200px 200px', marginTop: 26,
          fontFamily: MONO, fontSize: 22, color: C.ink500}}>
          <span />
          <span>0.30</span>
          <span style={{color: C.ember}}>0.45</span>
        </div>
      </div>

      <div style={{marginTop: 8}}>
        <Row at={40}  label="interruptions to the human"        a="69"    b="61" />
        <Row at={92}  label="reviews with attention left"       a="14"    b="14" />
        <Row at={150} label="oversight held for"                a="05:06" b="06:54" good />
        <Row at={330} label="high-risk actions running unseen"  a="0"     b="34" bad />
      </div>

      <div style={{marginTop: 30, opacity: fix, transform: `translateY(${(1 - fix) * 10}px)`,
        borderLeft: 'none', paddingTop: 26, borderTop: `1px solid rgba(104,185,134,0.3)`}}>
        <div style={{fontFamily: MONO, fontSize: 34, color: C.ok, lineHeight: 1.5}}>
          watchspan/policy.py
        </div>
        <div style={{fontFamily: MONO, fontSize: 30, color: C.ink300, marginTop: 10, lineHeight: 1.55}}>
          <span style={{color: C.ink500}}># no amount of reviewer fatigue justifies this</span><br />
          ALWAYS_ESCALATE_ABOVE = <span style={{color: C.ok}}>0.7</span>
        </div>
        <div style={{fontFamily: FONT.text, fontSize: 18, color: C.ink500, marginTop: 18}}>
          The 34 is what the calibration cost before that line existed.
        </div>
      </div>

      <Sfx src="whoosh.mp3" at={1} vol={0.14} />
      <Sfx src="pop.mp3" at={40} vol={0.07} />
      <Sfx src="pop.mp3" at={92} vol={0.07} />
      <Sfx src="pop.mp3" at={150} vol={0.07} />
      <Sfx src="reject.mp3" at={332} vol={0.22} />
      <Sfx src="confirm.mp3" at={434} vol={0.26} />
    </AbsoluteFill>
  );
};
