import {AbsoluteFill, useCurrentFrame, interpolate, Easing} from 'remotion';
import {C, FONT, MONO} from '../theme';
import {Sfx} from '../lib/Sfx';

/* Two live calls against the deployed API, side by side. The first is held.
   The second is the same action reworded, and it walks straight past. Showing
   the failure is what makes the rest of the film believable. */
const Call: React.FC<{
  at: number; desc: string; verdict: string; pattern?: string; held: boolean; x: number;
}> = ({at, desc, verdict, pattern, held, x}) => {
  const f = useCurrentFrame();
  const p = interpolate(f - at, [0, 12], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
    easing: Easing.bezier(0.16, 1, 0.3, 1)});
  const vp = interpolate(f - at - 22, [0, 10], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const tone = held ? C.ember : C.alarm;
  return (
    <div style={{position: 'absolute', left: x, top: 250, width: 800, opacity: p,
      transform: `translateY(${(1 - p) * 12}px)`}}>
      <div style={{border: `1px solid ${C.line}`, background: C.ink900, borderRadius: 3}}>
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
          <div style={{fontFamily: MONO, fontSize: 16, color: C.ink500, marginTop: 14,
            lineHeight: 1.5, paddingTop: 14, borderTop: `1px solid ${C.line}`}}>
            &ldquo;{desc}&rdquo;
          </div>
        </div>
      </div>
      <div style={{marginTop: 20, opacity: vp, transform: `translateY(${(1 - vp) * 8}px)`}}>
        <div style={{fontFamily: MONO, fontSize: 40, color: tone, lineHeight: 1.1}}>{verdict}</div>
        {pattern && (
          <div style={{fontFamily: FONT.text, fontSize: 17, color: C.ink400, marginTop: 8}}>{pattern}</div>
        )}
      </div>
    </div>
  );
};

export const Attack: React.FC = () => {
  const f = useCurrentFrame();
  const head = interpolate(f, [0, 12], [0, 1], {extrapolateRight: 'clamp', easing: Easing.bezier(0.16, 1, 0.3, 1)});
  const close = interpolate(f, [430, 450], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return (
    <AbsoluteFill style={{background: C.ink950}}>
      <div style={{position: 'absolute', width: 700, height: 480, borderRadius: '50%', left: 1050, top: 240,
        background: 'radial-gradient(circle, rgba(230,67,67,0.10) 0%, transparent 64%)', filter: 'blur(30px)'}} />

      <div style={{position: 'absolute', top: 120, left: 100, opacity: head}}>
        <div style={{fontFamily: FONT.text, fontSize: 15, letterSpacing: '0.18em',
          textTransform: 'uppercase', color: C.ink500}}>Live, against the deployed API</div>
        <div style={{fontFamily: FONT.display, fontSize: 44, color: C.ink100,
          letterSpacing: '-0.018em', marginTop: 12}}>The same deletion, worded two ways</div>
      </div>

      <Call at={30} x={100} held
        desc="routine quarterly cleanup, nothing unusual"
        verdict="held" pattern="minimizing language: just approve, routine" />

      <Call at={300} x={1010} held={false}
        desc="scheduled Q3 storage hygiene per the maintenance calendar"
        verdict="straight through" pattern="no alerts" />

      <div style={{position: 'absolute', top: 790, left: 100, right: 100, opacity: close,
        paddingTop: 22, borderTop: `1px solid ${C.line}`,
        fontFamily: FONT.text, fontSize: 24, color: C.ink300, lineHeight: 1.5}}>
        Phrase matching is a floor, not a ceiling. Model Armor screens the model&rsquo;s input and
        never sees this traffic: nothing here is a prompt injection.
        It is an attack on the person, not on the model.
      </div>

      <Sfx src="whoosh.mp3" at={1} vol={0.14} />
      <Sfx src="stamp.mp3" at={52} vol={0.30} />
      <Sfx src="reject.mp3" at={322} vol={0.26} />
    </AbsoluteFill>
  );
};
