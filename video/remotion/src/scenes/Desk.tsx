import {AbsoluteFill, OffthreadVideo, staticFile, useCurrentFrame, interpolate, Easing} from 'remotion';
import {C, FONT, MONO} from '../theme';
import {Sfx} from '../lib/Sfx';
import {narration} from '../lib/narration';

/* The promise, paid.

   The opening threatened to measure the viewer. This is where it happens, on
   the same instrument and the same footage, and the scene is shorter than it
   would otherwise be because the mechanic was demonstrated in the first twenty
   seconds and does not need explaining twice.

   One idea per moment. A first pass put captions over the running console and
   the frame carried two arguments at once: a label about what the service
   measures crossed the counters row, and the closing line sat on top of a
   panel. So the footage runs clean while the queue advances, then goes down and
   the invitation owns the frame.

   Its job at the end is to convert. A judge who opens the link during
   deliberation is worth more than one who remembers a number, so the URL holds
   for the rest of the scene. */

const CLIP = 'desk.mp4';
const QUEUE_FROM = 6.0;    // the queue advancing, under the middle of the line
const VERDICT_FROM = 24.4; // the card, red, held

const URL = 'watchspan-web-45ejdvuucq-uc.a.run.app';

export const Desk: React.FC = () => {
  const f = useCurrentFrame();
  const n = narration('desk');

  const TWELVE = n.at('twelve approval');
  const CLOCK = n.at('starts the clock');
  const RUNNING = n.at('it is running');
  const MOMENT = n.at('the moment you');

  // One cut, from the queue advancing to the verdict it produced.
  const onVerdict = f >= RUNNING - 10;
  const start = onVerdict ? VERDICT_FROM : QUEUE_FROM;
  const localStart = onVerdict ? RUNNING - 10 : 0;

  const cta = interpolate(f - RUNNING, [0, 20], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });
  const close = interpolate(f - MOMENT, [0, 16], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill style={{backgroundColor: C.ink950}}>
      <AbsoluteFill
        style={{
          opacity: interpolate(f - RUNNING, [0, 22], [1, 0.12], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
            easing: Easing.bezier(0.16, 1, 0.3, 1),
          }),
        }}
      >
        <OffthreadVideo
          src={staticFile(CLIP)}
          startFrom={Math.round((start + Math.max(0, f - localStart) / 30) * 30)}
          muted
          style={{width: '100%', height: '100%', objectFit: 'cover'}}
        />
      </AbsoluteFill>

      <AbsoluteFill
        style={{
          background: `radial-gradient(120% 90% at 50% 50%, rgba(15,13,9,0.18) 8%, ${C.ink950} 80%)`,
          opacity: cta,
        }}
      />

      <AbsoluteFill style={{padding: '0 150px', justifyContent: 'center', opacity: cta}}>
        <div
          style={{
            fontFamily: FONT.display,
            fontSize: 60,
            color: C.ink100,
            letterSpacing: '-0.022em',
            transform: `translateY(${(1 - cta) * 14}px)`,
          }}
        >
          It is running right now.
        </div>
        <div
          style={{
            fontFamily: MONO,
            fontSize: 34,
            color: C.ember,
            marginTop: 18,
            opacity: close,
            transform: `translateY(${(1 - close) * 10}px)`,
          }}
        >
          {URL}
        </div>
        <div
          style={{
            fontFamily: FONT.text,
            fontSize: 18,
            color: C.ink500,
            marginTop: 14,
            opacity: close,
          }}
        >
          Twelve requests. It times you, and it counts what you open.
        </div>
      </AbsoluteFill>

      <Sfx src="slide.mp3" at={TWELVE} vol={0.1} />
      <Sfx src="tick.mp3" at={CLOCK} vol={0.08} />
      <Sfx src="stamp.mp3" at={RUNNING - 10} vol={0.28} />
      <Sfx src="pluck.mp3" at={MOMENT} vol={0.15} />
    </AbsoluteFill>
  );
};
