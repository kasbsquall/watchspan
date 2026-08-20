"use client";

import { ChartLine } from "@phosphor-icons/react";
import type { TimelineEvent } from "@/lib/api";

/* Budget over the run: the falling line is the whole story. Draw-on for the
   main stroke only. Drift declaration marked as a vertical event band. */
export default function BudgetTimeline({
  events,
  upTo,
  driftAt,
  totalSeconds,
}: {
  events: TimelineEvent[];
  upTo: number;
  driftAt: number | null;
  totalSeconds: number;
}) {
  const width = 640;
  const height = 150;
  const pad = 8;
  const visible = events.slice(0, upTo);

  const x = (t: number) => pad + (t / totalSeconds) * (width - pad * 2);
  const y = (f: number) => pad + (1 - f) * (height - pad * 2);

  const points = visible
    .map((e) => `${x(e.at).toFixed(1)},${y(e.team_fraction).toFixed(1)}`)
    .join(" ");

  const driftVisible =
    driftAt !== null && visible.length > 0 && visible[visible.length - 1].at >= driftAt;

  return (
    <div>
      <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-ink-500">
        <ChartLine size={15} weight="light" aria-hidden />
        Attention budget across the run
        <span className="ml-auto font-data normal-case tracking-normal text-ink-500">
          0–30 min
        </span>
      </div>
      <svg
        width="100%"
        viewBox={`0 0 ${width} ${height}`}
        className="mt-2"
        role="img"
        aria-label="Team attention budget falling across the simulated run"
      >
        {/* Reference lines: full and calibration floor. Thresholds visible in UI. */}
        <line x1={pad} x2={width - pad} y1={y(1)} y2={y(1)} stroke="var(--color-ink-800)" strokeWidth="1" />
        <line
          x1={pad}
          x2={width - pad}
          y1={y(0.35)}
          y2={y(0.35)}
          stroke="var(--color-ink-700)"
          strokeWidth="1"
          strokeDasharray="3 5"
        />
        <text x={width - pad} y={y(0.35) - 4} textAnchor="end" className="font-data" fontSize="9" fill="var(--color-ink-500)">
          35% floor
        </text>
        {driftVisible && (
          <>
            <line
              x1={x(driftAt!)}
              x2={x(driftAt!)}
              y1={pad}
              y2={height - pad}
              stroke="var(--color-alarm-500)"
              strokeWidth="1.5"
            />
            <text
              x={x(driftAt!) + 5}
              y={pad + 9}
              className="font-data"
              fontSize="9"
              fill="var(--color-alarm-500)"
            >
              oversight degraded · {formatClock(driftAt!)}
            </text>
          </>
        )}
        {visible.length > 1 && (
          <polyline
            points={points}
            fill="none"
            stroke="var(--color-ember-500)"
            strokeWidth="2"
            strokeLinejoin="round"
            className="draw-on"
            style={{ ["--dash" as string]: 1400 }}
          />
        )}
      </svg>
    </div>
  );
}

export function formatClock(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}
