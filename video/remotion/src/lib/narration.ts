import caps from '../data/captions.json';
import timing from '../data/scene_timing.json';
import {FPS} from '../theme';

/* Anchor every visual beat to the WORD that triggers it.

   cue.ts already argued that literal frame numbers rot the moment the
   voiceover is re-recorded. This is the same argument taken one step further:
   instead of naming an anchor and typing a number next to it, the anchor IS
   the phrase in the narration, resolved from captions.json at build time.

   Re-record the voice with a different actor, a different model, a different
   pace, and every reveal follows the words on its own. That happened on this
   film: swapping the voice moved every scene boundary by up to two seconds,
   and hand-written cue frames would all have had to be re-timed by eye.

       const n = narration('ceiling');
       <Row at={n.at('fewer interruptions')} />
       <Flip at={n.at('zero, now')} />

   A phrase that is not in the scene throws, loudly, at render time. That is
   deliberate: a silent miss is exactly the failure this file exists to stop. */

type Word = {t: number; e: number; w: string};
type Scene = {id: string; start: number; end: number; dur: number};

/* One caption word normalises to one token.

   Collapsing punctuation to a SPACE instead looked equivalent and was not:
   "thirty-five," became the two tokens "thirty five" on the caption side while
   the phrase "below thirty-five" split into three on the query side, so the
   sequence never lined up and the lookup threw on a phrase that is plainly in
   the scene. Hyphens and apostrophes vanish; the word stays one word. */
const norm = (s: string): string => s.toLowerCase().replace(/[^a-z0-9]/g, '');

export type Narration = {
  /** Local frame where `phrase` starts being spoken. Offset in frames if needed. */
  at: (phrase: string, offset?: number) => number;
  /** Local frame where `phrase` finishes. */
  after: (phrase: string, offset?: number) => number;
  /** The scene's own length in frames. */
  end: number;
  /** Every word of the scene, in local frames, for word-level effects. */
  words: {w: string; f: number; fe: number}[];
};

export const narration = (sceneId: string): Narration => {
  const scenes = timing.scenes as Scene[];
  const scene = scenes.find((s) => s.id === sceneId);
  if (!scene) {
    throw new Error(`narration("${sceneId}"): no such scene. Have: ${scenes.map((s) => s.id).join(', ')}`);
  }
  // A word belongs to this scene if it starts inside it. The 0.02s slack absorbs
  // the rounding in captions.json, which is written to three decimals.
  const mine = (caps as Word[]).filter((w) => w.t >= scene.start - 0.02 && w.t < scene.end + 0.02);
  const words = mine.map((w) => ({
    w: w.w,
    f: Math.round((w.t - scene.start) * FPS),
    fe: Math.round((w.e - scene.start) * FPS),
  }));
  const flat = mine.map((w) => norm(w.w));

  const locate = (phrase: string): {i: number; j: number} => {
    const target = phrase.trim().split(/\s+/).map(norm).filter(Boolean);
    for (let i = 0; i + target.length <= flat.length; i++) {
      let ok = true;
      for (let k = 0; k < target.length; k++) {
        // The caption word must START WITH the query token, so "interruptions"
        // finds "interruptions," whatever punctuation the vendor added.
        //
        // The match used to run both ways, and that was a real bug rather than a
        // nicety: querying "there" matched the earlier word "the", because "there"
        // starts with "the". The caption handover for the close then covered the
        // wrong five frames and the film's last line appeared twice on screen, once
        // in display type and once in the subtitle. One direction only. A query
        // longer than any word in the scene now throws, which is the safe failure.
        if (!flat[i + k].startsWith(target[k])) {
          ok = false;
          break;
        }
      }
      if (ok) return {i, j: i + target.length - 1};
    }
    throw new Error(
      `narration("${sceneId}").at("${phrase}"): not spoken in this scene.\n` +
        `  scene says: ${mine.map((w) => w.w).join(' ')}`
    );
  };

  return {
    at: (phrase, offset = 0) => words[locate(phrase).i].f + offset,
    after: (phrase, offset = 0) => words[locate(phrase).j].fe + offset,
    end: Math.round(scene.dur * FPS),
    words,
  };
};
