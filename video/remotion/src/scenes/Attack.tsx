import {AbsoluteFill, useCurrentFrame, interpolate, Easing} from 'remotion';
import {C, FONT, MONO} from '../theme';
import {Sfx} from '../lib/Sfx';
import {Ground} from '../lib/Ground';
import {Breathe, Ping, Spot, Sweep, Rails} from '../lib/Life';
import {narration} from '../lib/narration';

/* Two live calls against the deployed API, side by side. The first is held. The
   second is the same action reworded, and it walks straight past.

   This is the longest shot in the film at twenty-six seconds and it measured
   95% frozen: both cards landed inside the first ten seconds and the remaining
   sixteen were a still image while the voice did all the work. The failure is
   the most valuable thing in the film — a governance product that shows its own
   limit is the one a judge believes — so the shot now stages it:

     the request lands, the gate shuts, the reworded request lands, and the same
     action drops straight through a gate that never closes.

   Then the Model Armor comparison arrives on the sentence that needs it, rather
   than sitting on screen from the start. */

const Card: React.FC<{
  at: number;
  desc: string;
  descAt: number;
  x: number;
}> = ({at, desc, descAt, x}) => {
  const f = useCurrentFrame();
  const p = interpolate(f - at, [0, 12], [0, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.bezier(0.16, 1, 0.3, 1),
  });
  // The quoted description is the payload of the attack, so it types in on the
  // words that describe it rather than being present from the first frame.
  const chars = Math.round(
    interpolate(f - descAt, [0, 34], [0, desc.length], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})
  );
  return (
    <div
      style={{
        position: 'absolute', left: x, top: 232, width: 800,
        opacity: p, transform: `translateY(${(1 - p) * 12}px)`,
      }}
    >
      <div style={{border: `1px solid ${C.line}`, background: C.ink900, borderRadius: 3,
        position: 'relative', overflow: 'hidden'}}>
        <Sweep period={240} offset={at} opacity={0.04} />
        <div style={{borderBottom: `1px solid ${C.line}`, padding: '12px 20px',
          fontFamily: MONO, fontSize: 15, color: C.ink500}}>
          POST /requests
        </div>
        <div style={{padding: '22px 20px'}}>
          <div style={{fontFamily: MONO, fontSize: 17, color: C.ink300, lineHeight: 1.6}}>
            action: <span style={{color: C.ink100}}>delete_production_backup_set</span>
          </div>
          <div style={{fontFamily: MONO, fontSize: 17, color: C.ink300, lineHeight: 1.6, marginTop: 6}}>
            risk: <span style={{color: C.ember}}>90</span>
          </div>
          <div style={{fontFamily: MONO, fontSize: 16, color: C.ink500, marginTop: 14, lineHeight: 1.5,
            paddingTop: 14, borderTop: `1px solid ${C.line}`, minHeight: 48}}>
            &ldquo;{desc.slice(0, chars)}
            {chars < desc.length && <span style={{opacity: (f % 20 < 11) ? 0.9 : 0.15}}>_</span>}
            {chars >= desc.length && '"'}
          </div>
        </div>
      </div>
    </div>
  );
};

/** The gate under a card: it shuts on the held call and never shuts on the other. */
const Gate: React.FC<{at: number; x: number; shuts: boolean}> = ({at, x, shuts}) => {
  const f = useCurrentFrame();
  const p = interpolate(f - at, [0, 12], [0, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.bezier(0.16, 1, 0.3, 1),
  });
  return (
    <div style={{position: 'absolute', left: x, top: 566, width: 800, height: 3}}>
      <div
        style={{
          height: 3, width: '100%',
          background: shuts ? C.ember : 'transparent',
          borderTop: shuts ? 'none' : `2px dashed rgba(230,67,67,0.45)`,
          transform: shuts ? `scaleX(${p})` : 'none',
          transformOrigin: 'left',
          opacity: shuts ? 1 : interpolate(f - at, [0, 10], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}),
        }}
      />
    </div>
  );
};

/** The action falling through a gate that did not close. */
const Slip: React.FC<{at: number; x: number}> = ({at, x}) => {
  const f = useCurrentFrame();
  const t = f - at;
  if (t < 0) return null;
  const p = interpolate(t, [0, 46], [0, 1], {extrapolateRight: 'clamp', easing: Easing.bezier(0.4, 0, 0.9, 1)});
  return (
    <div
      style={{
        position: 'absolute', left: x + 40, top: 500 + p * 190,
        opacity: interpolate(p, [0, 0.12, 0.8, 1], [0, 1, 1, 0]),
        fontFamily: MONO, fontSize: 20, color: C.alarm,
        border: `1px solid rgba(230,67,67,0.5)`, background: 'rgba(230,67,67,0.12)',
        padding: '8px 16px', borderRadius: 3,
      }}
    >
      delete_production_backup_set
    </div>
  );
};

const Verdict: React.FC<{at: number; x: number; text: string; note: string; tone: string}> = ({
  at, x, text, note, tone,
}) => {
  const f = useCurrentFrame();
  const p = interpolate(f - at, [0, 10], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return (
    <div style={{position: 'absolute', left: x, top: 592, width: 800, opacity: p,
      transform: `translateY(${(1 - p) * 8}px)`}}>
      <div style={{fontFamily: MONO, fontSize: 40, color: tone, lineHeight: 1.1}}>{text}</div>
      <div style={{fontFamily: FONT.text, fontSize: 17, color: C.ink400, marginTop: 8}}>{note}</div>
    </div>
  );
};

export const Attack: React.FC = () => {
  const f = useCurrentFrame();
  const n = narration('attack');

  const CARD1 = 0;
  const DESC1 = n.at('hidden in a batch');
  const HOLD = n.at('watchspan holds');
  const CARD2 = n.at('now the same');
  const DESC2 = n.at('reworded');
  const PASS = n.at('it walks');
  const FLOOR = n.at('phrase matching');
  const ARMOR = n.at('model armor');
  const PERSON = n.at('it is an attack');

  const head = interpolate(f, [0, 12], [0, 1], {extrapolateRight: 'clamp', easing: Easing.bezier(0.16, 1, 0.3, 1)});
  const floor = interpolate(f, [FLOOR - 8, FLOOR + 10], [0, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.bezier(0.16, 1, 0.3, 1),
  });
  const armor = interpolate(f, [ARMOR - 8, ARMOR + 12], [0, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.bezier(0.16, 1, 0.3, 1),
  });

  return (
    <AbsoluteFill>
      <Ground tint="alarm" />
      <Rails gap={104} speed={0.2} opacity={0.02} />

      <Breathe amp={0.05} period={150} style={{position: 'absolute', left: 1050, top: 240}}>
        <div style={{width: 700, height: 480, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(230,67,67,0.13) 0%, transparent 64%)', filter: 'blur(30px)'}} />
      </Breathe>

      <div style={{position: 'absolute', top: 112, left: 100, opacity: head}}>
        <div style={{fontFamily: FONT.text, fontSize: 15, letterSpacing: '0.18em',
          textTransform: 'uppercase', color: C.ink500}}>Live, against the deployed API</div>
        <div style={{fontFamily: FONT.display, fontSize: 44, color: C.ink100,
          letterSpacing: '-0.018em', marginTop: 10}}>The same deletion, worded two ways</div>
      </div>

      <Card at={CARD1} descAt={DESC1} x={100} desc="routine quarterly cleanup, nothing unusual" />
      <Gate at={HOLD} x={100} shuts />
      <Verdict at={HOLD} x={100} text="held" note="minimizing language: just approve, routine" tone={C.ember} />
      <div style={{position: 'absolute', left: 500, top: 566}}>
        <Ping at={HOLD} size={260} color={C.ember} dur={34} />
      </div>

      <Card at={CARD2} descAt={DESC2} x={1010} desc="scheduled Q3 storage hygiene per the maintenance calendar" />
      <Gate at={PASS - 14} x={1010} shuts={false} />
      <Slip at={PASS} x={1010} />
      <Verdict at={PASS + 20} x={1010} text="straight through" note="no alerts" tone={C.alarm} />

      {/* The limit, stated on the words that state it. */}
      <div
        style={{
          // 782 put the final sentence under the caption box, which covered the
          // words "not on the model" for the whole beat. There was dead band
          // above it anyway, so the block moves up into it.
          position: 'absolute', top: 700, left: 100, right: 100,
          opacity: floor, paddingTop: 20, borderTop: `1px solid ${C.line}`,
        }}
      >
        <Spot from={FLOOR} to={ARMOR - 10} before={0.25}>
          <div style={{fontFamily: FONT.display, fontSize: 30, color: C.ink100, letterSpacing: '-0.015em'}}>
            Phrase matching is a floor, not a ceiling.
          </div>
        </Spot>

        <div style={{marginTop: 18, opacity: armor, transform: `translateY(${(1 - armor) * 10}px)`,
          display: 'grid', gridTemplateColumns: '250px 1fr', gap: 26, alignItems: 'start'}}>
          <span style={{fontFamily: MONO, fontSize: 21, color: C.ember}}>Model Armor</span>
          <div>
            <div style={{fontFamily: FONT.text, fontSize: 20, color: C.ink300, lineHeight: 1.5}}>
              blocks <span style={{fontFamily: MONO, color: C.ink100}}>ignore all previous instructions</span>,
              and never sees this traffic at all. Nothing here is a prompt injection.
            </div>
            <Spot from={PERSON} to={n.end} before={0}>
              <div style={{fontFamily: FONT.display, fontSize: 28, color: C.ember, marginTop: 14,
                letterSpacing: '-0.015em'}}>
                It is an attack on the person, not on the model.
              </div>
            </Spot>
          </div>
        </div>
      </div>

      <Sfx src="sweep.mp3" at={2} vol={0.10} />
      <Sfx src="whoosh.mp3" at={1} vol={0.14} />
      <Sfx src="enter.mp3" at={CARD1} vol={0.13} />
      <Sfx src="stamp.mp3" at={HOLD} vol={0.30} />
      <Sfx src="enter.mp3" at={CARD2} vol={0.13} />
      <Sfx src="vanish.mp3" at={PASS} vol={0.18} />
      <Sfx src="reject.mp3" at={PASS + 20} vol={0.26} />
      <Sfx src="glassy.mp3" at={FLOOR} vol={0.10} />
      <Sfx src="appear.mp3" at={ARMOR} vol={0.12} />
    </AbsoluteFill>
  );
};
