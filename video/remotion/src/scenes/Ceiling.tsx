import {AbsoluteFill, useCurrentFrame, interpolate, Easing} from 'remotion';
import {C, FONT, MONO} from '../theme';
import {Sfx} from '../lib/Sfx';
import {Ground} from '../lib/Ground';
import {Spot, Flip, Ping, Caret, Sweep, Rails, Spoken} from '../lib/Life';
import {narration} from '../lib/narration';

/* The defect a judge found, and its fix, in numbers.

   Two things were wrong with the released cut of this shot. It was 99% frozen,
   the worst measurement in the film: four rows landed in the first five seconds
   and the remaining nineteen were a still table. And the narration ends on
   "zero, now, run unseen" while the screen went on showing 34 in red, so the
   one moment the scene exists for never happened on screen.

   Both are the same fix. Each row lands on the words that name it, and the last
   row flips when the voice says it flipped. */

const Row: React.FC<{
  at: number;
  until: number;
  label: string;
  a: string;
  b: string;
  good?: boolean;
  bad?: boolean;
  flipAt?: number;
  flipTo?: string;
}> = ({at, until, label, a, b, good, bad, flipAt, flipTo}) => {
  const f = useCurrentFrame();
  const p = interpolate(f - at, [0, 10], [0, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.bezier(0.16, 1, 0.3, 1),
  });
  return (
    <Spot from={at} to={until} before={0}>
      <div
        style={{
          display: 'grid', gridTemplateColumns: '620px 200px 200px', alignItems: 'baseline',
          padding: '18px 0', borderTop: `1px solid ${C.line}`,
          transform: `translateY(${(1 - p) * 8}px)`,
        }}
      >
        <span style={{fontFamily: FONT.text, fontSize: 25, color: C.ink300}}>{label}</span>
        <span style={{fontFamily: MONO, fontSize: 40, color: C.ink500, fontVariantNumeric: 'tabular-nums'}}>{a}</span>
        {flipAt !== undefined && flipTo !== undefined ? (
          <Flip at={flipAt} from={b} to={flipTo} size={40} fromColor={C.alarm} toColor={C.ok} />
        ) : (
          <span
            style={{
              fontFamily: MONO, fontSize: 40, fontVariantNumeric: 'tabular-nums',
              color: bad ? C.alarm : good ? C.ok : C.ink100,
            }}
          >
            {b}
          </span>
        )}
      </div>
    </Spot>
  );
};

/* The threshold climbing above the risk band it was meant to catch.

   First version put the label at `right: 0` with no width, so it grew outward
   past the panel edge, and it stayed on screen through the code block that
   follows it. Both fixed: the label sits inside, and the panel leaves when the
   sentence that motivated it ends. */
const Climb: React.FC<{at: number; until: number}> = ({at, until}) => {
  const f = useCurrentFrame();
  const p = interpolate(f, [at, until], [0, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.bezier(0.4, 0, 0.3, 1),
  });
  const inn = interpolate(f, [at - 10, at + 6], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const out = interpolate(f, [until + 4, until + 22], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const H = 210;
  const bandTop = 78;
  const y = H - 26 - p * (H - 26 - bandTop);
  return (
    <div style={{position: 'absolute', right: 104, top: 196, width: 360, height: H,
      opacity: inn * out}}>
      <div style={{position: 'absolute', left: 0, right: 0, top: bandTop, bottom: 0,
        background: 'rgba(230,67,67,0.10)', border: `1px solid rgba(230,67,67,0.26)`, borderRadius: 2}} />
      <div style={{position: 'absolute', left: 0, top: bandTop - 26, fontFamily: FONT.text, fontSize: 13,
        letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(230,67,67,0.75)'}}>
        risk 0.70 to 0.85
      </div>
      <div style={{position: 'absolute', left: 0, right: 0, top: y, height: 2, background: C.ember,
        boxShadow: '0 0 14px rgba(237,153,14,0.5)'}} />
      <div style={{position: 'absolute', left: 10, top: y - 26, fontFamily: MONO, fontSize: 17,
        color: C.ember, fontVariantNumeric: 'tabular-nums'}}>
        threshold {(0.3 + p * 0.55).toFixed(2)}
      </div>
    </div>
  );
};

export const Ceiling: React.FC = () => {
  const f = useCurrentFrame();
  const n = narration('ceiling');

  const FEWER = n.at('fewer interruptions');
  const HELD = n.at('oversight held');
  const UNSEEN = n.at('but thirty-four');
  const FLOOR = n.at('so the calibration');
  const RISK = n.at('risk above seventy');
  const ZERO = n.at('zero, now');
  const CLIMBED = n.at('because the calibrated');

  const head = interpolate(f, [0, 12], [0, 1], {extrapolateRight: 'clamp', easing: Easing.bezier(0.16, 1, 0.3, 1)});
  const fix = interpolate(f, [FLOOR - 8, FLOOR + 12], [0, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.bezier(0.16, 1, 0.3, 1),
  });
  // The column header for the new policy arrives with the sentence that proposes it.
  const col = interpolate(f, [FEWER - 20, FEWER - 4], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

  return (
    <AbsoluteFill>
      <Ground tint="ok" />
      <Rails gap={96} speed={0.16} opacity={0.02} />
      <AbsoluteFill style={{padding: '104px 100px'}}>
        <div style={{opacity: head}}>
          <div style={{fontFamily: FONT.text, fontSize: 15, letterSpacing: '0.18em',
            textTransform: 'uppercase', color: C.ink500}}>Raising the bar, measured</div>
          <div style={{display: 'grid', gridTemplateColumns: '620px 200px 200px', marginTop: 24,
            fontFamily: MONO, fontSize: 22, color: C.ink500}}>
            <span />
            <span>0.30</span>
            <span style={{color: C.ember, opacity: col}}>0.45</span>
          </div>
        </div>

        <div style={{marginTop: 6}}>
          <Row at={FEWER}  until={HELD - 8}   label="interruptions to the human"       a="69"    b="61" />
          <Row at={FEWER + 22} until={HELD - 8} label="reviews with attention left"    a="14"    b="14" />
          <Row at={HELD}   until={UNSEEN - 8} label="oversight held for"               a="05:06" b="06:54" good />
          <Row at={UNSEEN} until={n.end}      label="high-risk actions running unseen" a="0"     b="34" bad
            flipAt={ZERO} flipTo="0" />
        </div>

        {/* Why the 34 happened: the calibrated threshold walking up past the risk
            it was supposed to catch. Six seconds of narration explained this over
            a still table; now the bar climbs while the sentence says it does. */}
        <Climb at={CLIMBED} until={FLOOR - 10} />

        {/* The ring lands on the flip, so the correction has the same weight as the defect. */}
        <div style={{position: 'absolute', left: 940, top: 470}}>
          <Ping at={ZERO} size={300} color={C.ok} dur={40} />
          <Ping at={ZERO + 8} size={440} color={C.ok} dur={46} thickness={1} />
        </div>

        <div
          style={{
            marginTop: 28, opacity: fix, transform: `translateY(${(1 - fix) * 10}px)`,
            paddingTop: 24, borderTop: `1px solid rgba(104,185,134,0.3)`,
            position: 'relative', overflow: 'hidden',
          }}
        >
          <Sweep period={190} offset={FLOOR} opacity={0.045} />
          <div style={{fontFamily: MONO, fontSize: 32, color: C.ok, lineHeight: 1.5}}>
            watchspan/policy.py
          </div>
          <div style={{fontFamily: MONO, fontSize: 29, color: C.ink300, marginTop: 8, lineHeight: 1.55}}>
            <span style={{color: C.ink500}}># no amount of reviewer fatigue justifies this</span>
            <br />
            ALWAYS_ESCALATE_ABOVE = <span style={{color: C.ok}}>0.7</span>
            <Caret color={C.ok} h={26} w={9} />
          </div>
          <div style={{marginTop: 14, minHeight: 34}}>
            <Spoken n={n} from={RISK} to={n.after('they are')} color={C.ink300}
              style={{fontFamily: FONT.text, fontSize: 21}} />
          </div>
        </div>
      </AbsoluteFill>

      <Sfx src="sweep.mp3" at={2} vol={0.10} />
      <Sfx src="whoosh.mp3" at={1} vol={0.14} />
      <Sfx src="tick.mp3" at={FEWER} vol={0.05} />
      <Sfx src="tick.mp3" at={FEWER + 22} vol={0.05} />
      <Sfx src="tick.mp3" at={HELD} vol={0.05} />
      <Sfx src="reject.mp3" at={UNSEEN} vol={0.24} />
      <Sfx src="vanish.mp3" at={UNSEEN + 2} vol={0.14} />
      <Sfx src="appear.mp3" at={FLOOR} vol={0.16} />
      <Sfx src="confirm.mp3" at={ZERO} vol={0.30} />
    </AbsoluteFill>
  );
};
