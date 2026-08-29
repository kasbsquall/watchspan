import {C, FONT, MONO} from '../theme';
import {Card, Fig, Label, Sub, Title} from './parts';
import {QR_CONSOLE, QR_MODULES} from './qr';
import evidence from '../data/evidence.json';

const T = evidence.threshold;
const U = evidence.understated;
const D = evidence.disguise;
const G = evidence.geap as Record<string, any>;

const CONSOLE_URL = 'watchspan-web-45ejdvuucq-uc.a.run.app';

const Row: React.FC<{children: React.ReactNode; gap?: number; style?: React.CSSProperties}> = ({
  children,
  gap = 0,
  style,
}) => <div style={{display: 'flex', gap, ...style}}>{children}</div>;

/* ---------------------------------------------------------------- cover ---
   The listing thumbnail. A title card with the product name set in a display
   face says nothing a judge could not already guess, so this one carries the
   verdict, the clock and the counters: the whole argument at a glance, every
   figure from the seeded run. The wordmark still has to be legible, because
   this is also the image that names the entry in a grid of forty. */
export const GCover: React.FC = () => (
  <Card
    eyebrow="the human attention budget for agent fleets"
    glow="rgba(230,67,67,0.11)"
    source="a seeded 30-minute run, reproducible from its seed · then it runs the same instrument on you"
  >
    <div
      style={{
        fontFamily: FONT.display,
        fontSize: 46,
        fontWeight: 700,
        color: C.ink100,
        letterSpacing: '-0.03em',
      }}
    >
      Watchspan
    </div>

    <Row
      style={{
        alignItems: 'baseline',
        gap: 16,
        marginTop: 26,
        padding: '13px 20px',
        border: '1px solid rgba(230,67,67,0.32)',
        background: 'rgba(230,67,67,0.05)',
        alignSelf: 'flex-start',
      }}
    >
      <span style={{fontFamily: FONT.display, fontSize: 21, color: C.alarm, fontWeight: 600}}>
        Oversight stopped being effective
      </span>
      <Fig size={29} color={C.alarm}>
        {T.base.drift_at}
      </Fig>
      <span style={{fontFamily: MONO, fontSize: 12, letterSpacing: '0.16em', color: C.ink500}}>
        INTO THE RUN
      </span>
    </Row>

    <Row style={{alignItems: 'flex-end', gap: 26, marginTop: 34}}>
      <Fig size={158} color={C.ember}>
        {T.base.stamped}
      </Fig>
      <div
        style={{
          fontFamily: FONT.display,
          fontSize: 38,
          fontWeight: 500,
          color: C.ink100,
          lineHeight: 1.14,
          letterSpacing: '-0.022em',
          paddingBottom: 12,
        }}
      >
        high-risk approvals with zero
        <br />
        seconds of reading behind them.
      </div>
    </Row>

    <Row style={{gap: 108, marginTop: 44}}>
      <div>
        <Fig size={44}>370</Fig>
        <Label>routed</Label>
      </div>
      <div>
        <Fig size={44}>294</Fig>
        <Label>auto-run, logged</Label>
      </div>
      <div>
        <Fig size={44}>{T.base.escalated}</Fig>
        <Label>sent to a human</Label>
      </div>
      <div>
        <Fig size={44}>{T.base.meaningful}</Fig>
        <Label>attention left</Label>
      </div>
    </Row>
  </Card>
);

/* ----------------------------------------------------------------- claim ---
   The bug a live reviewer found: the agent was setting the number that decides
   whether a human ever sees it. Both figures come back from the deployed API. */
export const GClaim: React.FC = () => (
  <Card
    eyebrow="the claim is never the input"
    source={<>POST /requests on the deployed service · request {U.request_id}</>}
  >
    <Title>An agent does not get to grade its own request.</Title>
    <Sub>
      Every request arrives with a risk score the calling agent gave itself. Watchspan assesses the
      action independently and routes on whichever number is higher.
    </Sub>

    <div style={{marginTop: 42, border: `1px solid ${C.line}`, background: 'rgba(255,255,255,0.014)'}}>
      <div style={{padding: '16px 26px', borderBottom: `1px solid ${C.line}`}}>
        <span style={{fontFamily: MONO, fontSize: 21, color: C.ink100}}>{U.action}</span>
      </div>
      <Row style={{padding: '28px 26px 26px'}}>
        <div style={{flex: 1}}>
          <Fig size={62} color={C.ink500}>
            {U.risk.declared_by_caller.toFixed(2)}
          </Fig>
          <Label>declared by the agent</Label>
        </div>
        <div style={{flex: 1}}>
          <Fig size={62} color={C.ember}>
            {U.risk.assessed_by_watchspan.toFixed(2)}
          </Fig>
          <Label>assessed by Watchspan</Label>
        </div>
        <div style={{flex: 1}}>
          <Fig size={62} color={C.ink100}>
            {U.risk.routed_on.toFixed(2)}
          </Fig>
          <Label>routed on</Label>
        </div>
        <div style={{flex: 1.05, alignSelf: 'center'}}>
          <div
            style={{
              fontFamily: MONO,
              fontSize: 19,
              color: C.alarm,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
            }}
          >
            {U.route}
          </div>
          <Label>outcome</Label>
        </div>
      </Row>
    </div>

    <div style={{fontFamily: MONO, fontSize: 14, color: C.ink500, marginTop: 22, lineHeight: 1.6}}>
      basis: {U.risk.basis}
    </div>
  </Card>
);

/* -------------------------------------------------------------- disguise ---
   The rename attack, defeated twice before it was closed: an action named to
   resemble a benign catalogued one still gets read for what it says it does. */
export const GDisguise: React.FC = () => (
  <Card
    eyebrow="the rename attack, closed"
    source="two live calls, one reviewer, one nine-character suffix between them"
  >
    <Title>A catalogue is a floor, never a ceiling.</Title>
    <Sub>
      Naming a dangerous action to resemble a harmless one used to inherit the harmless score. An
      IBAN, a credential and a privilege are now dangerous with no verb at all.
    </Sub>

    <div style={{marginTop: 42}}>
      {[D.catalogued, D.renamed].map((r: any, i: number) => {
        const bad = r.route === 'escalate';
        return (
          <Row
            key={r.action}
            style={{
              alignItems: 'center',
              padding: '26px',
              borderTop: `1px solid ${C.line}`,
              borderBottom: i === 1 ? `1px solid ${C.line}` : 'none',
              background: bad ? 'rgba(230,67,67,0.05)' : 'transparent',
            }}
          >
            <span style={{fontFamily: MONO, fontSize: 20, color: C.ink100, flex: 1}}>{r.action}</span>
            <div style={{width: 150, textAlign: 'right'}}>
              <Fig size={44} color={bad ? C.alarm : C.ink500}>
                {r.risk.assessed_by_watchspan.toFixed(2)}
              </Fig>
            </div>
            <div style={{width: 210, textAlign: 'right'}}>
              <span
                style={{
                  fontFamily: MONO,
                  fontSize: 16,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  color: bad ? C.alarm : C.ink500,
                }}
              >
                {r.route}
              </span>
            </div>
          </Row>
        );
      })}
    </div>

    <div style={{fontFamily: MONO, fontSize: 14, color: C.ink500, marginTop: 24, lineHeight: 1.6}}>
      {D.renamed.risk.basis}
    </div>
  </Card>
);

/* --------------------------------------------------------------- ceiling ---
   The measurement that surprised us, and the line of policy that exists
   because of it.

   The unseen count is deliberately NOT a fourth row of the table. It does not
   vary with the threshold column, it varies with whether the floor exists at
   all, and printing it under the 0.30 / 0.45 headings said that raising the
   bar caused 33 actions to run unseen. It did not: removing the floor did.
   That is the exact species of mislabelled table this project exists to
   complain about. */
export const GCeiling: React.FC = () => {
  const rows: Array<[string, string | number, string | number, boolean]> = [
    ['interruptions to the human', T.base.escalated, T.raised.escalated, true],
    ['reviews with attention left', T.base.meaningful, T.raised.meaningful, false],
    ['oversight held for', T.base.drift_at, T.raised.drift_at, true],
  ];
  return (
    <Card
      eyebrow="raising the bar, measured"
      source="video/threshold_experiment.py · same seeded run, one constant changed"
    >
      <Title size={38}>Escalating less was safer. Only with a floor.</Title>

      <div style={{marginTop: 30}}>
        <Row style={{padding: '0 8px 12px', borderBottom: `1px solid ${C.line}`}}>
          <span style={{flex: 1, fontFamily: MONO, fontSize: 12, letterSpacing: '0.16em', color: C.ink700}}>
            ESCALATION THRESHOLD
          </span>
          <span style={{width: 180, textAlign: 'right', fontFamily: MONO, fontSize: 17, color: C.ink500}}>
            {T.base.threshold}
          </span>
          <span style={{width: 180, textAlign: 'right', fontFamily: MONO, fontSize: 17, color: C.ember}}>
            {T.raised.threshold}
          </span>
        </Row>
        {rows.map(([label, a, b, better]) => (
          <Row
            key={label}
            style={{alignItems: 'baseline', padding: '17px 8px', borderBottom: `1px solid ${C.line}`}}
          >
            <span style={{flex: 1, fontFamily: FONT.text, fontSize: 19, color: C.ink300}}>{label}</span>
            <span style={{width: 180, textAlign: 'right'}}>
              <Fig size={33} color={C.ink500}>
                {a}
              </Fig>
            </span>
            <span style={{width: 180, textAlign: 'right'}}>
              <Fig size={33} color={better ? C.ok : C.ink100}>
                {b}
              </Fig>
            </span>
          </Row>
        ))}
      </div>

      <Row style={{marginTop: 30, gap: 34, alignItems: 'center'}}>
        <div style={{flex: 1}}>
          <div style={{fontFamily: MONO, fontSize: 16, lineHeight: 1.7}}>
            <span style={{color: C.ink500}}># no amount of reviewer fatigue justifies this</span>
            <br />
            <span style={{color: C.ink100}}>ALWAYS_ESCALATE_ABOVE = </span>
            <span style={{color: C.ember}}>0.7</span>
          </div>
          <div style={{fontFamily: FONT.text, fontSize: 15, color: C.ink500, marginTop: 12, maxWidth: 420}}>
            Fewer interruptions is only an improvement while nothing dangerous slips through with them.
          </div>
        </div>
        <Row style={{gap: 30}}>
          <div style={{textAlign: 'right'}}>
            <Fig size={54} color={C.alarm}>
              {T.unseen_without_floor}
            </Fig>
            <Label>unseen without the floor</Label>
          </div>
          <div style={{textAlign: 'right'}}>
            <Fig size={54} color={C.ok}>
              {T.unseen_with_floor}
            </Fig>
            <Label>unseen with it</Label>
          </div>
        </Row>
      </Row>
    </Card>
  );
};

/* ------------------------------------------------------------------ desk ---
   The instrument turned on the person watching. The QR is here because a judge
   who opens the console during deliberation is worth more than one who
   remembers a number, and no one retypes a Cloud Run hostname correctly. */
export const GDesk: React.FC = () => (
  <Card
    eyebrow="the reviewer console"
    glow="rgba(230,67,67,0.10)"
    source={`${CONSOLE_URL} · the figures are one recorded session, yours will be your own`}
  >
    <Title>Then it measures you.</Title>
    <Sub>
      Twelve real approval requests, served one at a time. The server issues your reviewer identity,
      starts the clock when it hands the card over, and counts the detail sections you open. Nothing
      in the request body can set any of the three.
    </Sub>

    <Row style={{marginTop: 48, alignItems: 'flex-end', gap: 40}}>
      <div style={{width: 236}}>
        <Fig size={96} color={C.alarm}>
          11
        </Fig>
        <Label>of 12 under three seconds</Label>
      </div>
      <div style={{width: 212}}>
        <Fig size={96} color={C.alarm}>
          0
        </Fig>
        <Label>detail sections opened</Label>
      </div>
      <div style={{flex: 1, paddingBottom: 10}}>
        <div style={{fontFamily: FONT.display, fontSize: 26, color: C.ink100, fontWeight: 600}}>
          oversight degraded
        </div>
        <Label>your own verdict</Label>
      </div>

      <svg
        viewBox={`0 0 ${QR_MODULES} ${QR_MODULES}`}
        width={128}
        height={128}
        shapeRendering="crispEdges"
      >
        <rect width={QR_MODULES} height={QR_MODULES} fill={C.ink100} />
        <path d={QR_CONSOLE} fill={C.ink950} />
      </svg>
    </Row>
  </Card>
);

/* ----------------------------------------------------------------- cloud ---
   Every service answering for itself, in one unauthenticated request. Each row
   carries what actually came back, because "green tick" is the claim and the
   payload is the proof. */
export const GCloud: React.FC = () => {
  const rows: Array<[string, string, string]> = [
    ['vertex_ai_gemini', 'Vertex AI', `${G.vertex_ai_gemini?.model}`],
    ['agent_registry', 'Agent Registry', `${G.agent_registry?.watchspan_agents_catalogued} agent cards`],
    ['agent_runtime', 'Agent Runtime', `${G.agent_runtime?.display_name}`],
    ['memory_bank', 'Memory Bank', `${G.memory_bank?.facts_recalled} facts recalled`],
    ['model_armor', 'Model Armor', G.model_armor?.blocks_prompt_injection ? 'blocked an injection' : 'answered'],
    ['cloud_trace', 'Cloud Trace', `${G.cloud_trace?.traces_in_the_last_day} traces in the last day`],
    ['cloud_run', 'Cloud Run', `${G.cloud_run?.detail}`],
    ['reviewer_identity', 'Reviewer identity', 'HMAC of the browser session'],
  ];
  return (
    <Card
      eyebrow="GET /geap/status · unauthenticated"
      source={
        <>
          {G._summary.verified_by_live_call} of {G._summary.of_live_calls} verified by a live round trip ·{' '}
          {G._summary.config_checks_ok} environment checks, labelled as such and never counted as one
        </>
      }
    >
      <Title size={38}>Every service answers for itself.</Title>
      <Sub>
        One request calls all of it and reports what came back. A probe that only read an environment
        variable says so, and does not get to sit next to a round trip pretending to be one.
      </Sub>

      <div style={{marginTop: 34}}>
        {rows.map(([k, label, detail]) => {
          const p = G[k] ?? {};
          const live = p.how === 'round_trip';
          return (
            <Row
              key={k}
              style={{alignItems: 'center', padding: '14px 4px', borderBottom: `1px solid ${C.line}`}}
            >
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 8,
                  background: p.ok ? C.ok : C.ink700,
                  marginRight: 16,
                  flexShrink: 0,
                }}
              />
              <span style={{width: 250, fontFamily: FONT.text, fontSize: 18, color: C.ink100}}>{label}</span>
              <span style={{flex: 1, fontFamily: MONO, fontSize: 14, color: C.ink500}}>{detail}</span>
              <span
                style={{
                  fontFamily: MONO,
                  fontSize: 11.5,
                  letterSpacing: '0.13em',
                  textTransform: 'uppercase',
                  color: live ? C.ember : C.ink700,
                }}
              >
                {live ? 'live call' : 'config check'}
              </span>
            </Row>
          );
        })}
      </div>
    </Card>
  );
};
