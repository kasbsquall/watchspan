import {useCurrentFrame, useVideoConfig} from 'remotion';
import React from 'react';
import capsRaw from '../data/captions.json';
import {INTER, C} from '../theme';
import {narration} from './narration';
import {SCENES} from '../timing';

/* Where the burned caption stands down.

   When a scene sets the same sentence in display type, the caption repeats it
   word for word at the bottom of the frame, and two copies of one sentence at
   two sizes reads as a bug rather than as accessibility. So a scene can hand
   the line over: name the phrase span, and the caption goes quiet for exactly
   as long as the screen is carrying it.

   Declared as phrases, not as seconds, for the reason cue.ts and narration.ts
   both exist: a re-recorded voiceover moves every timestamp and would leave
   these windows covering the wrong words. */
const HANDOVER: {scene: string; from: string; to: string}[] = [
  {scene: 'hook', from: 'everyone sells', to: 'measures'},
  {scene: 'attack', from: 'it is an attack', to: 'the gap'},
  {scene: 'close', from: 'everyone sells', to: 'there'},
];

const MUTED: [number, number][] = HANDOVER.map(({scene, from, to}) => {
  const s = SCENES.find((x) => x.id === scene);
  if (!s) throw new Error(`caption handover names an unknown scene: ${scene}`);
  const n = narration(scene);
  return [s.startF + n.at(from) - 6, s.startF + n.after(to) + 10];
});

type Word = {t: number; e: number; w: string};
const caps = capsRaw as Word[];

// Group words into readable lines (~46 chars, break on sentence end).
type Line = {start: number; end: number; words: Word[]};
const LINES: Line[] = (() => {
  const lines: Line[] = [];
  let cur: Word[] = [];
  for (const c of caps) {
    cur.push(c);
    const txt = cur.map((x) => x.w).join(' ');
    const endsSent = /[.?!]$/.test(c.w);
    if (txt.length >= 46 || (endsSent && cur.length >= 3)) {
      lines.push({start: cur[0].t, end: cur[cur.length - 1].e, words: cur});
      cur = [];
    }
  }
  if (cur.length) lines.push({start: cur[0].t, end: cur[cur.length - 1].e, words: cur});
  return lines;
})();

// Burned-in karaoke captions.
export const Captions: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;
  if (MUTED.some(([a, b]) => frame >= a && frame <= b)) return null;
  const line = LINES.find((l) => t >= l.start - 0.12 && t <= l.end + 0.35);
  if (!line) return null;
  return (
    <div
      style={{
        position: 'absolute',
        bottom: 64,
        width: '100%',
        display: 'flex',
        justifyContent: 'center',
        pointerEvents: 'none',
      }}
    >
      <div
        style={{
          maxWidth: 1360,
          padding: '15px 34px',
          borderRadius: 18,
          background: 'rgba(15,13,9,0.82)',
          border: '1px solid rgba(255,255,255,0.10)',
          boxShadow: '0 18px 50px rgba(0,0,0,0.35)',
          textAlign: 'center',
          fontFamily: INTER,
          fontWeight: 700,
          fontSize: 38,
          lineHeight: 1.28,
        }}
      >
        {line.words.map((w, i) => {
          const spoken = t >= w.t - 0.04;
          const speaking = spoken && t < w.e + 0.06;
          return (
            <span
              key={i}
              style={{
                color: speaking ? C.ember : spoken ? C.ink100 : 'rgba(231,228,224,0.5)',
                textShadow: speaking ? '0 0 22px rgba(237,153,14,0.55)' : 'none',
                transition: 'none',
              }}
            >
              {w.w}{' '}
            </span>
          );
        })}
      </div>
    </div>
  );
};
