import {C, FONT, MONO} from '../theme';
import {Card, Title} from './parts';

/* The governance loop, redrawn for the gallery.

   The previous version of this image was a screenshot of the product's own
   architecture page, which arrived with a scrollbar down the side, the right
   edge clipped, and a strip of browser chrome across the bottom. It also
   predated two things the entry now leads with: the fleet being instantiated
   from whatever the Agent Registry returns, and peer review between agents
   that can only raise a score.

   The first redraw then put Auto-run and Calibrator on the same coordinates
   and rendered "AutoCalibrator" with two subtitles on top of each other, which
   is what comes of positioning boxes by eye and never looking at the output.
   The lanes below are laid out on a grid: one terminal box at the far left of
   the return row, then the three agents that feed the loop back, right to
   left, in the order the data travels. */

const Box: React.FC<{
  x: number;
  y: number;
  w: number;
  h?: number;
  title: string;
  note?: string;
  accent?: boolean;
  round?: boolean;
}> = ({x, y, w, h = 54, title, note, accent, round}) => (
  <g>
    <rect
      x={x}
      y={y}
      width={w}
      height={h}
      rx={round ? h / 2 : 2}
      fill="rgba(255,255,255,0.015)"
      stroke={accent ? C.ember600 : C.ink800}
      strokeWidth={1}
    />
    <text
      x={x + w / 2}
      y={note ? y + h / 2 - 3 : y + h / 2 + 5}
      textAnchor="middle"
      fill={C.ink100}
      style={{fontFamily: FONT.display, fontSize: 15, fontWeight: 600}}
    >
      {title}
    </text>
    {note && (
      <text
        x={x + w / 2}
        y={y + h / 2 + 15}
        textAnchor="middle"
        fill={C.ink500}
        style={{fontFamily: FONT.text, fontSize: 11.5}}
      >
        {note}
      </text>
    )}
  </g>
);

const Note: React.FC<{x: number; y: number; children: string; color?: string; anchor?: string}> = ({
  x,
  y,
  children,
  color = C.ink500,
  anchor = 'start',
}) => (
  <text x={x} y={y} textAnchor={anchor} fill={color} style={{fontFamily: MONO, fontSize: 11}}>
    {children}
  </text>
);

const Arrow: React.FC<{d: string; ember?: boolean; dashed?: boolean}> = ({d, ember, dashed}) => (
  <path
    d={d}
    fill="none"
    stroke={ember ? C.ember600 : C.ink700}
    strokeWidth={1.2}
    strokeDasharray={dashed ? '5 4' : undefined}
    markerEnd={ember ? 'url(#tipEmber)' : 'url(#tip)'}
  />
);

export const GArch: React.FC = () => (
  <Card
    eyebrow="the governance loop"
    source="the four governance agents are plain Python · the model writes findings, never verdicts"
  >
    <Title size={33}>What the review costs flows back and changes what escalates next.</Title>

    <svg viewBox="0 0 1072 486" width={1072} height={486} style={{marginTop: 22}}>
      <defs>
        <marker id="tip" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto">
          <path d="M 0 0 L 10 5 L 0 10 z" fill={C.ink700} />
        </marker>
        <marker
          id="tipEmber"
          viewBox="0 0 10 10"
          refX="9"
          refY="5"
          markerWidth="6"
          markerHeight="6"
          orient="auto"
        >
          <path d="M 0 0 L 10 5 L 0 10 z" fill={C.ember600} />
        </marker>
      </defs>

      {/* ---- the fleet, instantiated from whatever the Registry returns ---- */}
      <Note x={44} y={14} color={C.ink700}>
        FLEET, FROM agents:search
      </Note>
      <rect x={44} y={26} width={152} height={166} rx={2} fill="rgba(255,255,255,0.01)" stroke={C.ink800} />
      <Box x={58} y={40} w={124} h={36} title="Procurement" />
      <Box x={58} y={86} w={124} h={36} title="Data ops" />
      <Box x={58} y={132} w={124} h={36} title="Comms" />
      {/* peer review: a colleague may raise a score and never lower it */}
      <path
        d="M 52 176 C 26 156 26 66 50 50"
        fill="none"
        stroke={C.ember600}
        strokeWidth={1.1}
        strokeDasharray="4 4"
        markerEnd="url(#tipEmber)"
      />
      <Note x={120} y={212} color={C.ember} anchor="middle">
        peer review, upward only
      </Note>

      <Arrow d="M 198 109 L 244 109" />

      <Box x={248} y={82} w={166} title="Sentinel" note="fatigue-exploitation patterns" accent />

      <Note x={424} y={102}>
        clean
      </Note>
      <Arrow d="M 416 109 L 472 109" />

      {/* ---- the decision ---- */}
      <path
        d="M 478 109 L 586 62 L 694 109 L 586 156 Z"
        fill="rgba(237,153,14,0.05)"
        stroke={C.ember600}
        strokeWidth={1}
      />
      <text
        x={586}
        y={105}
        textAnchor="middle"
        fill={C.ink100}
        style={{fontFamily: FONT.display, fontSize: 15, fontWeight: 600}}
      >
        Calibrated policy
      </text>
      <text x={586} y={123} textAnchor="middle" fill={C.ink500} style={{fontFamily: FONT.text, fontSize: 11.5}}>
        risk vs threshold(budget)
      </text>
      <Note x={586} y={50} anchor="middle" color={C.ink700}>
        risk = max(declared, assessed)
      </Note>

      {/* ---- held out of band, straight from the Sentinel ---- */}
      <Arrow d="M 331 80 L 331 24 L 952 24 L 952 76" ember dashed />
      <Note x={641} y={18} color={C.ember} anchor="middle">
        held out of band
      </Note>

      <Note x={716} y={100}>
        escalate
      </Note>
      <Arrow d="M 696 109 L 866 109" />
      <Note x={716} y={128} color={C.ink700}>
        risk &#8805; 0.70 always
      </Note>

      <Box x={870} y={82} w={158} title="Human reviewer" round />

      {/* ---- the two ways out of the decision ---- */}
      <Arrow d="M 476 118 L 216 239" />
      <Note x={286} y={182}>
        below threshold
      </Note>
      <Box x={44} y={240} w={168} title="Auto-run" note="logged for audit" />

      <Arrow d="M 380 236 L 556 160" />
      <Note x={462} y={216} color={C.ink700}>
        new threshold, once
      </Note>
      <Note x={462} y={230} color={C.ink700}>
        the reviewer approves it
      </Note>

      {/* ---- the return lane, right to left, in the order data travels ---- */}
      <Arrow d="M 948 138 L 948 234" />
      <Note x={962} y={172}>
        decision time,
      </Note>
      <Note x={962} y={186}>
        sections opened
      </Note>
      <Box x={868} y={240} w={160} title="Meter" note="per-reviewer budget" />

      <Arrow d="M 864 267 L 738 267" />
      <Box x={562} y={240} w={168} title="Drift" note="rubber-stamp detection" />

      <Arrow d="M 558 267 L 448 267" />
      <Box x={276} y={240} w={166} title="Calibrator" note="policy proposal" accent />

      {/* ---- the dossier the whole loop exists to produce ---- */}
      <Arrow d="M 359 296 L 452 340" />
      <Arrow d="M 646 296 L 592 340" />
      <Arrow d="M 948 296 L 664 344" />
      <Box x={412} y={344} w={252} title="EU AI Act Article 14 dossier" note="one Cloud Trace span per decision" />

      {/* ---- the ground it all runs on ---- */}
      <Note x={44} y={412} color={C.ink700}>
        ALL OF IT ON GOOGLE CLOUD
      </Note>
      <rect x={44} y={422} width={1028} height={62} rx={2} fill="rgba(255,255,255,0.01)" stroke={C.ink800} />
      {[
        ['Cloud Run', 'API + console'],
        ['Vertex AI', 'Gemini 3.5 Flash'],
        ['Agent Runtime', '+ Agent Identity'],
        ['Agent Registry', '7 cards, discovery'],
        ['Memory Bank', 'attention ledger'],
        ['Model Armor', 'every model call'],
        ['Cloud Trace', 'a span per decision'],
      ].map(([t, n], i) => (
        <Box key={t} x={56 + i * 145.5} y={430} w={131} h={46} title={t} note={n} />
      ))}
    </svg>
  </Card>
);
