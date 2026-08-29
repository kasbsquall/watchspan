import {AbsoluteFill, OffthreadVideo, staticFile, useCurrentFrame, interpolate, Easing} from 'remotion';
import {C, FONT, MONO} from '../theme';
import {Sfx} from '../lib/Sfx';
import {narration} from '../lib/narration';

/* The film opens on the product working, and threatens the viewer.

   Both script judges arrived here from opposite directions. The track judge:
   rebuild the first forty seconds around the desk, and either open with it
   properly or do not touch it at the top at all. The lay reader: the desk
   should be the whole video. The version between them, a still verdict card,
   was the weakest of the three, because it spoiled the reveal without showing
   the console, the clicking or the clock.

   So the console runs, and instead of revealing the verdict the narration
   promises it. Nobody wonders what a threat means, and scene 7 becomes the
   payoff of something the viewer has been waiting three minutes for.

   The footage is a real session against the deployed service, recorded by
   video/record_desk.js. Eleven of twelve is what that session produced; it was
   shot rather than composed, because a run that stamps everything blind gives
   twelve of twelve and the narration would have been wrong. */

const CLIP = 'desk.mp4';
// Where the take sits under each beat. The capture is 28s and this scene is
// under 18, so it plays the reading and then jumps to the verdict rather than
// running at a speed no hand moves at.
const READING_FROM = 1.5;
const VERDICT_FROM = 23.2;

export const Open: React.FC = () => {
  const f = useCurrentFrame();
  const n = narration('open');

  const NINTH = n.at('by the ninth');
  const ELEVEN = n.at('eleven of their');
  const SELLS = n.at('everyone sells');
  const PROMISE = n.at('before this video');

  // One cut, on the word that changes the subject from what they did to what it
  // cost them. Two shots rather than one long take, because the capture has
  // eight seconds of clicking that say nothing the first three did not.
  const onVerdict = f >= ELEVEN - 8;
  const start = onVerdict ? VERDICT_FROM : READING_FROM;
  const localStart = onVerdict ? ELEVEN - 8 : 0;

  const vignette = interpolate(f, [0, 20], [1, 0], {extrapolateRight: 'clamp'});
  const dim = interpolate(f - SELLS, [0, 18], [1, 0.16], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });
  const line = interpolate(f - SELLS, [0, 16], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });
  const threat = interpolate(f - PROMISE, [0, 14], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });

  return (
    <AbsoluteFill style={{backgroundColor: C.ink950}}>
      <AbsoluteFill style={{opacity: dim}}>
        <OffthreadVideo
          src={staticFile(CLIP)}
          startFrom={Math.round((start + Math.max(0, f - localStart) / 30) * 30)}
          muted
          style={{width: '100%', height: '100%', objectFit: 'cover'}}
        />
      </AbsoluteFill>

      {/* The ground creeping back in as the voice takes over, so the line has
          somewhere to sit that is not on top of live UI. */}
      <AbsoluteFill
        style={{
          background: `radial-gradient(120% 90% at 50% 55%, rgba(15,13,9,0) 20%, ${C.ink950} 88%)`,
          opacity: Math.max(vignette * 0.5, 1 - dim),
        }}
      />

      {/* A real ground under the line. Dimming the footage alone still left UI
          text crossing the headline, and the frame read as two images. */}
      <AbsoluteFill
        style={{
          background: `linear-gradient(to bottom, rgba(15,13,9,0) 8%, ${C.ink950} 34%, ${C.ink950} 78%, rgba(15,13,9,0) 96%)`,
          opacity: line,
        }}
      />

      <AbsoluteFill style={{padding: '0 150px', justifyContent: 'center'}}>
        <p
          style={{
            fontFamily: FONT.display,
            fontSize: 58,
            lineHeight: 1.14,
            letterSpacing: '-0.024em',
            color: C.ink100,
            maxWidth: 1500,
            margin: 0,
            opacity: line,
            transform: `translateY(${(1 - line) * 14}px)`,
          }}
        >
          Everyone sells human in the loop.
        </p>
        <p
          style={{
            fontFamily: FONT.display,
            fontSize: 58,
            lineHeight: 1.14,
            letterSpacing: '-0.024em',
            color: C.ember,
            maxWidth: 1500,
            margin: '14px 0 0',
            opacity: threat,
            transform: `translateY(${(1 - threat) * 14}px)`,
          }}
        >
          Before this video ends, we are going to do this to you.
        </p>
      </AbsoluteFill>

      {/* What the session actually produced, small, in the corner, for anyone
          reading the frame rather than listening to it. */}
      <div
        style={{
          position: 'absolute',
          left: 140,
          bottom: 96,
          fontFamily: MONO,
          fontSize: 15,
          color: C.ink500,
          opacity: interpolate(f - NINTH, [0, 14], [0, 1], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          }),
        }}
      >
        live session, watchspan-web · 11 of 12 approvals under 3s, nothing opened
      </div>

      <Sfx src="whoosh.mp3" at={2} vol={0.16} />
      <Sfx src="tick.mp3" at={NINTH} vol={0.08} />
      <Sfx src="stamp.mp3" at={ELEVEN - 8} vol={0.3} />
      <Sfx src="appear.mp3" at={SELLS} vol={0.13} />
      <Sfx src="pluck.mp3" at={PROMISE} vol={0.16} />
    </AbsoluteFill>
  );
};
