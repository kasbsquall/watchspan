import {AbsoluteFill, useCurrentFrame, interpolate, Easing} from 'remotion';
import {C, FONT, MONO} from '../theme';
import {Sfx} from '../lib/Sfx';
import {Ground} from '../lib/Ground';
import {Rails, Spot, Ping, Kinetic} from '../lib/Life';
import {narration} from '../lib/narration';
import evidence from '../data/evidence.json';

/* The agent does not grade its own work.

   Every figure here is read out of `evidence.json`, which `capture_evidence.py`
   fetches from the deployed API and asserts against what the narration says. A
   designer typing these into a title card is how a film ends up quoting a number
   the code does not produce, and that has already happened twice on this one.

   The agent's own score is on screen and never spoken. A fact-checker ran the
   fleet twice and got 0.40 and 0.35 for the same task; 75 is deterministic and
   safe to say aloud, and a voiceover fixes a number permanently. */

const pct = (n: number) => Math.round(n * 100);

const understated = evidence.understated as {
  action?: string;
  risk: {declared_by_caller: number; assessed_by_watchspan: number; routed_on: number; caller_understated: boolean};
};
const disguise = evidence.disguise as {
  catalogued: {action?: string; route: string; risk: {assessed_by_watchspan: number}};
  renamed: {action?: string; route: string; risk: {assessed_by_watchspan: number}};
};

const Figure: React.FC<{
  at: number;
  label: string;
  value: number;
  tone: string;
  big?: boolean;
}> = ({at, label, value, tone, big}) => {
  const f = useCurrentFrame();
  const p = interpolate(f - at, [0, 14], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });
  const shown = Math.round(
    interpolate(f - at, [0, 22], [0, value], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}),
  );
  return (
    <div style={{opacity: p, transform: `translateY(${(1 - p) * 10}px)`}}>
      <div
        style={{
          fontFamily: MONO,
          fontSize: big ? 138 : 62,
          lineHeight: 0.92,
          color: tone,
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {shown}
      </div>
      <div
        style={{
          fontFamily: FONT.text,
          fontSize: 13,
          letterSpacing: '0.16em',
          textTransform: 'uppercase',
          color: C.ink500,
          marginTop: 12,
        }}
      >
        {label}
      </div>
    </div>
  );
};

/* The disguise, as plain text and never narrated. It reads faster than it can
   be said, which is the whole reason it is on screen instead of in the voice. */
const DisguiseRow: React.FC<{
  at: number;
  action: string;
  note: string;
  score: number;
  route: string;
  danger?: boolean;
}> = ({at, action, note, score, route, danger}) => {
  const f = useCurrentFrame();
  const p = interpolate(f - at, [0, 16], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr 250px 96px 160px',
        alignItems: 'baseline',
        gap: 26,
        padding: '14px 0',
        borderTop: `1px solid ${C.line}`,
        opacity: p,
        transform: `translateX(${(1 - p) * -14}px)`,
      }}
    >
      <span style={{fontFamily: MONO, fontSize: 25, color: danger ? C.ink100 : C.ink400}}>
        {action}
      </span>
      <span style={{fontFamily: FONT.text, fontSize: 16, color: C.ink500}}>{note}</span>
      <span
        style={{
          fontFamily: MONO,
          fontSize: 34,
          color: danger ? C.ember : C.ink400,
          fontVariantNumeric: 'tabular-nums',
          textAlign: 'right',
        }}
      >
        {score}
      </span>
      <span
        style={{
          fontFamily: MONO,
          fontSize: 17,
          letterSpacing: '0.06em',
          color: danger ? C.ember : C.ink500,
        }}
      >
        {route}
      </span>
    </div>
  );
};

export const Claim: React.FC = () => {
  const f = useCurrentFrame();
  const n = narration('claim');

  const GAVE = n.at('gave itself');
  const UNDERSTATED = n.at('understated a table');
  const CALLED = n.at('called it seventy');
  // The line changed after a fact-check; the anchor follows the words, which
  // is the whole reason beats are anchored to phrases and not to frames.
  const DISGUISE = n.at('put an');

  const head = interpolate(f, [0, 14], [0, 1], {
    extrapolateRight: 'clamp',
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });
  const flag = interpolate(f - CALLED, [10, 24], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill>
      <Ground />
      <Rails gap={110} speed={0.16} opacity={0.02} />
      <AbsoluteFill style={{padding: '96px 130px', justifyContent: 'center'}}>
        <div
          style={{
            opacity: head,
            fontFamily: FONT.text,
            fontSize: 15,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: C.ink500,
          }}
        >
          One request, two opinions
        </div>

        <div style={{marginTop: 16, fontFamily: MONO, fontSize: 30, color: C.ink300, opacity: head}}>
          {understated.action ?? 'drop_deprecated_staging_table'}
        </div>

        <div style={{display: 'flex', alignItems: 'flex-end', gap: 110, marginTop: 40}}>
          <Figure
            at={GAVE}
            label="the agent scored itself"
            value={pct(understated.risk.declared_by_caller)}
            tone={C.ink400}
          />
          <div style={{position: 'relative'}}>
            <Ping at={CALLED} size={300} color={C.ember} dur={38} />
            <Figure
              at={CALLED}
              label="Watchspan read the action"
              value={pct(understated.risk.assessed_by_watchspan)}
              tone={C.ember}
              big
            />
          </div>
          <div style={{paddingBottom: 4, opacity: flag}}>
            <div
              style={{
                fontFamily: MONO,
                fontSize: 19,
                color: C.ember,
                border: `1px solid rgba(237,153,14,0.35)`,
                borderRadius: 2,
                padding: '8px 14px',
              }}
            >
              caller_understated: {String(understated.risk.caller_understated)}
            </div>
            <div style={{fontFamily: FONT.text, fontSize: 15, color: C.ink500, marginTop: 10}}>
              routed on {pct(understated.risk.routed_on)}, the higher of the two
            </div>
          </div>
        </div>

        <Spot from={DISGUISE - 10} to={n.end} before={0.25}>
          <div style={{marginTop: 52, maxWidth: 1620}}>
            <div
              style={{
                fontFamily: FONT.text,
                fontSize: 13,
                letterSpacing: '0.16em',
                textTransform: 'uppercase',
                color: C.ink500,
                marginBottom: 4,
              }}
            >
              The same action, dressed as a routine one
            </div>
            <DisguiseRow
              at={DISGUISE}
              action={disguise.catalogued.action ?? 'update_vendor_contact_details'}
              note="catalogued, contact details only"
              score={pct(disguise.catalogued.risk.assessed_by_watchspan)}
              route={disguise.catalogued.route}
            />
            <DisguiseRow
              at={DISGUISE + 16}
              action={disguise.renamed.action ?? 'update_vendor_contact_details_new_iban'}
              note="where the money lands"
              score={pct(disguise.renamed.risk.assessed_by_watchspan)}
              route={disguise.renamed.route}
              danger
            />
          </div>
        </Spot>

        <div style={{marginTop: 26, minHeight: 40}}>
          <Kinetic
            at={n.end - 34}
            text="Both figures came back from the deployed API while this was written."
            size={17}
            color={C.ink500}
            style={{fontFamily: FONT.text}}
          />
        </div>
      </AbsoluteFill>

      <Sfx src="sweep.mp3" at={2} vol={0.1} />
      <Sfx src="tick.mp3" at={GAVE} vol={0.07} />
      <Sfx src="stamp.mp3" at={CALLED} vol={0.26} />
      <Sfx src="pluck.mp3" at={CALLED} vol={0.13} />
      <Sfx src="slide.mp3" at={DISGUISE} vol={0.1} />
      <Sfx src="pop.mp3" at={DISGUISE + 16} vol={0.09} />
    </AbsoluteFill>
  );
};
