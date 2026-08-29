import {AbsoluteFill, useCurrentFrame, interpolate, Easing} from 'remotion';
import {C, FONT, MONO} from '../theme';
import {Sfx} from '../lib/Sfx';
import {Ground} from '../lib/Ground';
import {Rails, Ping} from '../lib/Life';
import {narration} from '../lib/narration';
import evidence from '../data/evidence.json';

/* Agents reviewing each other, and the honest result.

   The organisers asked this track, in their own words: "can your agent call the
   other agents? What about the securities between your agents?" A previous cut
   answered that in ten seconds as the second beat of another scene, starting at
   two minutes, and the track judge said a judge scoring that line had to go
   looking for it. It is now its own scene and the only diagram in the film.

   The exchange is a real POST /fleet/live captured by capture_evidence.py. Both
   times it ran, the peer agreed with the proposer and Watchspan overruled them
   both, and that is what goes on screen. A peer review that always caught
   things would be the weaker scene: two agents agreeing is not safety, which is
   the same thing this film says about one tired human. */

const pct = (n: number) => Math.round(n * 100);

type Routed = {
  action: string;
  agent_id: string;
  risk_declared_by_agent: number;
  risk_assessed_by_watchspan: number | null;
  route: string;
  peer_review?: {peer_agent: string; peer_risk: number; verdict: string} | null;
};

const fleet = (evidence as {fleet?: {routed: Routed[]; discovery_detail?: string}}).fleet;
const exchange = fleet?.routed.find((r) => r.peer_review) ?? fleet?.routed[0];
const peer = exchange?.peer_review;

const AGENTS = ['procurement', 'data_ops', 'comms'];

const Line: React.FC<{
  at: number;
  who: string;
  verb: string;
  detail: string;
  score?: number;
  tone?: string;
  strong?: boolean;
}> = ({at, who, verb, detail, score, tone, strong}) => {
  const f = useCurrentFrame();
  const p = interpolate(f - at, [0, 15], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '210px 150px 1fr 110px',
        alignItems: 'baseline',
        gap: 26,
        padding: '18px 0',
        borderTop: `1px solid ${C.line}`,
        opacity: p,
        transform: `translateX(${(1 - p) * -16}px)`,
      }}
    >
      <span style={{fontFamily: MONO, fontSize: 26, color: strong ? C.ember : C.ink100}}>{who}</span>
      <span style={{fontFamily: FONT.text, fontSize: 17, color: C.ink500}}>{verb}</span>
      <span style={{fontFamily: FONT.text, fontSize: 19, color: C.ink300}}>{detail}</span>
      {score !== undefined && (
        <span
          style={{
            fontFamily: MONO,
            fontSize: 40,
            color: tone ?? C.ink300,
            fontVariantNumeric: 'tabular-nums',
            textAlign: 'right',
          }}
        >
          {score}
        </span>
      )}
    </div>
  );
};

export const Peers: React.FC = () => {
  const f = useCurrentFrame();
  const n = narration('peers');

  const THREE = n.at('three agents');
  const REGISTRY = n.at('agent registry');
  const ARMOR = n.at('model armor');
  const ASKS = n.at('one asks a peer');
  const RAISE = n.at('can raise that score');

  const head = interpolate(f, [0, 14], [0, 1], {extrapolateRight: 'clamp'});
  const arrow = interpolate(f - RAISE, [0, 20], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });

  return (
    <AbsoluteFill>
      <Ground />
      <Rails gap={120} speed={0.15} opacity={0.02} />
      <AbsoluteFill style={{padding: '92px 130px', justifyContent: 'center'}}>
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
          The fleet, discovered at startup
        </div>

        <div style={{display: 'flex', gap: 20, marginTop: 18}}>
          {AGENTS.map((name, i) => {
            const p = interpolate(f - THREE - i * 5, [0, 14], [0, 1], {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
              easing: Easing.bezier(0.16, 1, 0.3, 1),
            });
            return (
              <span
                key={name}
                style={{
                  fontFamily: MONO,
                  fontSize: 25,
                  color: C.ink100,
                  border: `1px solid ${C.line}`,
                  borderRadius: 2,
                  padding: '10px 18px',
                  opacity: p,
                  transform: `translateY(${(1 - p) * 10}px)`,
                }}
              >
                {name}
              </span>
            );
          })}
        </div>

        <div
          style={{
            fontFamily: MONO,
            fontSize: 16,
            color: C.ink500,
            marginTop: 14,
            opacity: interpolate(f - REGISTRY, [0, 14], [0, 1], {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
            }),
          }}
        >
          agents:search(&apos;operations&apos;) · Google ADK
          <span
            style={{
              marginLeft: 18,
              opacity: interpolate(f - ARMOR, [0, 12], [0, 1], {
                extrapolateLeft: 'clamp',
                extrapolateRight: 'clamp',
              }),
            }}
          >
            · Model Armor on every model call
          </span>
        </div>

        <div style={{marginTop: 40, position: 'relative'}}>
          <Ping at={RAISE} size={340} color={C.ember} dur={40} />
          <Line
            at={ASKS}
            who={exchange?.agent_id ?? 'data_ops'}
            verb="proposes"
            detail={exchange?.action ?? 'drop_deprecated_table_staging'}
            score={pct(exchange?.risk_declared_by_agent ?? 0.3)}
          />
          <Line
            at={ASKS + 14}
            who={peer?.peer_agent ?? 'comms'}
            verb="reviews"
            detail={`${peer?.verdict ?? 'endorse'}s, and gives the same score`}
            score={pct(peer?.peer_risk ?? 0.3)}
          />
          <Line
            at={RAISE}
            who="watchspan"
            verb="assesses"
            detail="reads the action itself, and overrules them both"
            score={pct(exchange?.risk_assessed_by_watchspan ?? 0.75)}
            tone={C.ember}
            strong
          />
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            marginTop: 30,
            opacity: arrow,
          }}
        >
          <div
            style={{
              height: 1,
              width: 210,
              background: `linear-gradient(to right, rgba(237,153,14,0), ${C.ember})`,
            }}
          />
          <span style={{fontFamily: FONT.text, fontSize: 21, color: C.ember}}>
            a peer can raise a score and can never lower it
          </span>
        </div>

        <div style={{fontFamily: FONT.text, fontSize: 15, color: C.ink500, marginTop: 22, opacity: arrow}}>
          Both times we ran it live the peer agreed with the proposer. Two agents
          agreeing is not safety.
        </div>
      </AbsoluteFill>

      <Sfx src="sweep.mp3" at={2} vol={0.1} />
      {AGENTS.map((_, i) => (
        <Sfx key={i} src="tick.mp3" at={THREE + i * 5} vol={0.06} />
      ))}
      <Sfx src="slide.mp3" at={ASKS} vol={0.1} />
      <Sfx src="pop.mp3" at={ASKS + 14} vol={0.08} />
      <Sfx src="stamp.mp3" at={RAISE} vol={0.26} />
    </AbsoluteFill>
  );
};
