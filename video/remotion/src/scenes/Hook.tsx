import {AbsoluteFill, useCurrentFrame, interpolate, Easing, spring, useVideoConfig} from 'remotion';
import {C, FONT, MONO} from '../theme';
import {Sfx} from '../lib/Sfx';
import {Ground} from '../lib/Ground';
import {Breathe, Ping, Rails} from '../lib/Life';
import {narration} from '../lib/narration';

/* Cold open, fourth pass.

   The third pass drained a gauge for three seconds and then held a still image
   for the remaining four and a half, which the frame-difference measurement
   caught: 68% of this shot was frozen. It also spent its whole length on the
   problem and never said what the film is about, and the line the film is built
   on only arrived at 2:30, long after a jury on its fortieth submission has
   moved on.

   So the shot now has four movements, each pinned to the words that carry it:
   the instrument empties, the declaration lands, the approvals keep arriving
   anyway, and then everything recedes and the thesis takes the frame. */

/* A descending wall clock, one entry every 47 seconds back from 14:06. The
   first version derived the minutes and seconds from the row index separately
   and produced 13:42 above 13:49: a queue whose stamps did not run in order,
   which is the one thing a queue has to do. */
const clock = (n: number): string => {
  const total = 14 * 60 + 6 - n * 47;
  const m = Math.floor(((total % 1440) + 1440) % 1440 / 60);
  const s = ((total % 60) + 60) % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
};

const STREAM = [
  'update vendor contact details',
  'post scheduled social update',
  'retry failed pipeline run',
  'clear staging table',
  'reply to customer ticket',
  'publish incident statement',
  'archive closed tickets',
  'rotate build cache',
  'sync supplier catalogue',
  'schedule storage hygiene',
  'refresh vendor rate card',
  'close resolved alerts',
];

/* The approvals that kept coming. One row every seven frames, sliding up
   forever, each one stamped without being read. This is the shot's engine: it
   runs for the whole middle movement, so nothing is ever still. */
const Approvals: React.FC<{at: number}> = ({at}) => {
  const f = useCurrentFrame();
  const t = f - at;
  if (t < 0) return null;
  const STEP = 7;
  const ROW = 46;
  const idx = t / STEP;
  const rows = 9;
  return (
    <div style={{position: 'relative', height: rows * ROW, overflow: 'hidden', width: 620,
      maskImage: 'linear-gradient(180deg, transparent 0%, #000 18%, #000 76%, transparent 100%)',
      WebkitMaskImage: 'linear-gradient(180deg, transparent 0%, #000 18%, #000 76%, transparent 100%)'}}>
      <div style={{transform: `translateY(${-((idx % 1) * ROW)}px)`}}>
        {Array.from({length: rows + 1}, (_, i) => {
          const n = Math.floor(idx) - i + rows;
          if (n < 0) return <div key={i} style={{height: ROW}} />;
          const label = STREAM[n % STREAM.length];
          // The newest row is bright and everything above it falls away, so the
          // eye is always pulled to the bottom edge where the next one lands.
          const age = i / rows;
          return (
            <div
              key={i}
              style={{
                height: ROW,
                display: 'grid',
                gridTemplateColumns: '92px 1fr 130px',
                alignItems: 'center',
                opacity: interpolate(age, [0, 0.25, 1], [0.1, 0.62, 0.06]),
                borderTop: `1px solid ${C.line}`,
              }}
            >
              <span style={{fontFamily: MONO, fontSize: 16, color: C.ink500}}>
                {clock(n)}
              </span>
              <span style={{fontFamily: FONT.text, fontSize: 19, color: C.ink300}}>{label}</span>
              <span style={{fontFamily: MONO, fontSize: 15, color: C.ok, letterSpacing: '0.08em'}}>approved</span>
            </div>
          );
        })}
      </div>
      {/* Feather the ends into nothing. Painting the ground colour here instead
          drew a visible rectangle over the drifting wash behind it. */}
      <div style={{position: 'absolute', inset: 0, pointerEvents: 'none',
        maskImage: 'linear-gradient(180deg, transparent 0%, #000 20%, #000 72%, transparent 100%)',
        WebkitMaskImage: 'linear-gradient(180deg, transparent 0%, #000 20%, #000 72%, transparent 100%)',
        backdropFilter: 'none'}} />
    </div>
  );
};

export const Hook: React.FC = () => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const n = narration('hook');

  const DRAIN_END = n.after('reading');
  const DECLARE = n.at('nothing alerted');
  const STREAM_IN = n.at('the approvals');
  const THESIS = n.at('everyone sells');
  const SECOND = n.at('this is the part');

  const pct = Math.round(
    interpolate(f, [8, DRAIN_END], [41, 0], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: Easing.bezier(0.35, 0, 0.2, 1),
    })
  );
  const arc = 370.7;
  const filled = arc * (pct / 100);
  const alarm = pct <= 12;

  const enter = spring({frame: f - 2, fps, config: {damping: 17, mass: 0.7, stiffness: 100}});
  const drain = interpolate(f, [8, DRAIN_END], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const ring = interpolate(drain, [0, 1], [1.0, 0.72]);

  // Movement two: the instrument steps aside to make room for the stream. One
  // fast spring, not a creep, so no glyph is ever re-rasterised at a near-identical size.
  const shift = spring({frame: f - DECLARE, fps, config: {damping: 20, mass: 0.9, stiffness: 90}});
  const band = spring({frame: f - DECLARE, fps, config: {damping: 13, mass: 0.6, stiffness: 150}});

  // Movement four: everything the film has shown so far recedes, and the claim
  // the whole thing rests on takes the frame alone.
  const recede = interpolate(f, [THESIS - 14, THESIS + 10], [1, 0.1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });
  const blur = interpolate(f, [THESIS - 14, THESIS + 10], [0, 7], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const stage = -shift * 430;

  return (
    <AbsoluteFill>
      <Ground tint={alarm ? 'alarm' : 'ember'} />

      <AbsoluteFill style={{opacity: recede, filter: `blur(${blur}px)`}}>
        <Rails gap={92} speed={0.28} opacity={0.03} />

        <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center'}}>
          <Breathe amp={alarm ? 0.045 : 0.02} period={alarm ? 84 : 170} style={{position: 'absolute', top: 10}}>
            <div
              style={{
                width: 1150,
                height: 1150,
                borderRadius: '50%',
                background: `radial-gradient(circle, ${alarm ? 'rgba(230,67,67,0.20)' : 'rgba(237,153,14,0.13)'} 0%, transparent 57%)`,
                filter: 'blur(30px)',
                transform: `scale(${ring}) translateX(${stage}px)`,
              }}
            />
          </Breathe>

          <Ping at={DRAIN_END} size={760} color={C.alarm} dur={40} />
          <Ping at={DRAIN_END + 10} size={980} color={C.alarm} dur={46} thickness={1} />

          <div
            style={{
              position: 'relative',
              marginTop: -110,
              transform: `translate(${stage}px, ${(1 - enter) * 44}px) scale(${1 - shift * 0.12})`,
              opacity: Math.min(1, enter * 1.3),
            }}
          >
            <svg width={700} height={392} viewBox="0 0 300 168">
              <circle cx={150} cy={158} r={140 * ring} fill="none" stroke={alarm ? C.alarm : C.ember}
                strokeOpacity={0.14} strokeWidth={1} />
              <path d="M 32 158 A 118 118 0 0 1 268 158" fill="none" stroke={C.ink800} strokeWidth={10} strokeLinecap="round" />
              {filled > 0.5 && (
                <path d="M 32 158 A 118 118 0 0 1 268 158" fill="none" stroke={alarm ? C.alarm : C.ember}
                  strokeWidth={10} strokeLinecap="round" strokeDasharray={`${filled} ${arc}`} />
              )}
              <line x1={73.5} y1={65.2} x2={64.2} y2={54.4} stroke={C.ink400} strokeWidth={1.6} />
              <text x={58} y={46} textAnchor="middle" fontFamily={MONO} fontSize={9} fill={C.ink500}>35</text>
            </svg>
            <div
              style={{
                position: 'absolute', left: 0, right: 0, bottom: 12, textAlign: 'center',
                fontFamily: MONO, fontSize: 168, lineHeight: 1,
                color: alarm ? C.alarm : C.ember, fontVariantNumeric: 'tabular-nums',
                textShadow: alarm ? '0 0 48px rgba(230,67,67,0.45)' : '0 0 30px rgba(237,153,14,0.22)',
              }}
            >
              {pct}
              <span style={{fontSize: 60, color: C.ink500}}>%</span>
            </div>
            <div
              style={{
                position: 'absolute', left: 0, right: 0, bottom: -36, textAlign: 'center',
                fontFamily: FONT.text, fontSize: 15, letterSpacing: '0.2em',
                textTransform: 'uppercase', color: C.ink500,
              }}
            >
              attention remaining
            </div>
          </div>

          {/* The stream, entering from the right as the instrument steps left. */}
          <div
            style={{
              position: 'absolute', right: 150, top: 232,
              opacity: interpolate(f, [STREAM_IN - 18, STREAM_IN + 4], [0, 1], {
                extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
              }),
            }}
          >
            <div style={{fontFamily: FONT.text, fontSize: 14, letterSpacing: '0.2em',
              textTransform: 'uppercase', color: C.ink500, marginBottom: 14}}>
              the queue, still moving
            </div>
            <Approvals at={STREAM_IN - 10} />
          </div>

          <div
            style={{
              position: 'absolute', bottom: 168, left: 150, width: 900,
              opacity: Math.min(1, band * 1.4),
              transform: `translateY(${(1 - band) * 28}px)`,
              border: `1px solid rgba(230,67,67,0.5)`,
              background: 'rgba(230,67,67,0.10)',
              padding: '26px 38px', borderRadius: 3,
              boxShadow: `0 0 ${68 * band}px rgba(230,67,67,0.2)`,
            }}
          >
            <div style={{display: 'flex', alignItems: 'baseline', gap: 22, flexWrap: 'wrap'}}>
              <span style={{fontFamily: FONT.display, fontSize: 40, color: C.alarm, letterSpacing: '-0.015em'}}>
                Oversight stopped being effective
              </span>
              <span style={{fontFamily: MONO, fontSize: 70, color: C.alarm, lineHeight: 1, fontVariantNumeric: 'tabular-nums'}}>
                05:06
              </span>
            </div>
          </div>
        </AbsoluteFill>
      </AbsoluteFill>

      {/* Movement four: the claim, alone. */}
      <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', padding: '0 180px'}}>
        <div style={{maxWidth: 1420}}>
          <Line at={THESIS} text="Everyone sells human in the loop." size={78} color={C.ink100} />
          <div style={{height: 26}} />
          <Line at={SECOND} text="This is the part nobody measures." size={78} color={C.ember} />
        </div>
      </AbsoluteFill>

      <Sfx src="appear.mp3" at={3} vol={0.15} />
      <Sfx src="stamp.mp3" at={DECLARE} vol={0.5} />
      <Sfx src="sweep.mp3" at={THESIS - 6} vol={0.12} />
    </AbsoluteFill>
  );
};

/* A line that arrives word by word on a spring. Each word is a separate
   element, so nothing is scaled continuously and nothing shimmers. */
const Line: React.FC<{at: number; text: string; size: number; color: string}> = ({at, text, size, color}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  return (
    <div style={{display: 'flex', flexWrap: 'wrap', gap: `0 ${size * 0.26}px`}}>
      {text.split(' ').map((w, i) => {
        const p = spring({frame: f - at - i * 3, fps, config: {damping: 18, mass: 0.6, stiffness: 120}});
        return (
          <span
            key={i}
            style={{
              fontFamily: FONT.display, fontSize: size, lineHeight: 1.1, color,
              letterSpacing: '-0.03em', fontWeight: 600,
              opacity: p, transform: `translateY(${(1 - p) * 26}px)`,
            }}
          >
            {w}
          </span>
        );
      })}
    </div>
  );
};
