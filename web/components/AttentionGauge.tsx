"use client";

import NumberFlow from "@number-flow/react";
import { BatteryMedium } from "@phosphor-icons/react";

/* Hero instrument: the shared attention pool, live. Hierarchy 6x between the
   big figure and its label. Amber only when draining, alarm when depleted.
   fraction is null before the first run: the instrument stays empty rather
   than asserting a value that does not exist yet. */
export default function AttentionGauge({
  fraction,
  degraded,
}: {
  fraction: number | null;
  degraded: boolean;
}) {
  const pct = fraction === null ? null : Math.round(fraction * 100);
  const radius = 118;
  const circumference = Math.PI * radius; // half circle
  const filled = fraction === null ? 0 : circumference * fraction;
  const state =
    pct === null
      ? "idle"
      : degraded || pct <= 10
        ? "alarm"
        : pct <= 35
          ? "ember"
          : "ok";
  const strokeColor =
    state === "alarm"
      ? "var(--color-alarm-500)"
      : state === "ember"
        ? "var(--color-ember-500)"
        : state === "ok"
          ? "var(--color-ok-500)"
          : "var(--color-ink-500)";

  // The 35% calibration floor tick, split so it does not cross the arc stroke.
  const tickAngle = Math.PI * (1 - 0.35);
  // Rounded to 2 decimals so SSR and client render identical markup.
  const round = (v: number) => Math.round(v * 100) / 100;
  const tick = (r1: number, r2: number) => ({
    x1: round(150 + Math.cos(tickAngle) * r1),
    y1: round(158 - Math.sin(tickAngle) * r1),
    x2: round(150 + Math.cos(tickAngle) * r2),
    y2: round(158 - Math.sin(tickAngle) * r2),
  });
  const inner = tick(96, 108);
  const outer = tick(128, 136);
  const label = tick(142, 142);

  return (
    <div className="flex flex-col items-center">
      <div className="flex items-center gap-2 self-start text-[11px] uppercase tracking-[0.18em] text-ink-500">
        <BatteryMedium size={15} weight="light" aria-hidden />
        Attention budget remaining
      </div>
      <div className="relative mt-2">
        <svg
          width="300"
          height="168"
          viewBox="0 0 300 168"
          role="img"
          aria-label={
            pct === null
              ? "Attention budget: no run yet"
              : `Attention budget remaining: ${pct} percent`
          }
        >
          <path
            d="M 32 158 A 118 118 0 0 1 268 158"
            fill="none"
            stroke="var(--color-ink-800)"
            strokeWidth="10"
            strokeLinecap="round"
          />
          {filled > 0.5 && (
            <path
              d="M 32 158 A 118 118 0 0 1 268 158"
              fill="none"
              stroke={strokeColor}
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={`${filled} ${circumference}`}
              style={{ transition: "stroke-dasharray 180ms cubic-bezier(0.23,1,0.32,1), stroke 180ms" }}
            />
          )}
          <line {...inner} stroke="var(--color-ink-400)" strokeWidth="1.5" />
          <line {...outer} stroke="var(--color-ink-400)" strokeWidth="1.5" />
          <text
            x={label.x1}
            y={label.y1}
            textAnchor="middle"
            className="font-data"
            fontSize="9"
            fill="var(--color-ink-500)"
          >
            35
          </text>
        </svg>
        <div className="absolute inset-x-0 bottom-0 flex flex-col items-center">
          <div className="font-data text-7xl leading-none" style={{ color: strokeColor }}>
            {pct === null ? (
              <span aria-hidden>--</span>
            ) : (
              <NumberFlow
                value={pct}
                transformTiming={{ duration: 140, easing: "ease-out" }}
                spinTiming={{ duration: 140, easing: "ease-out" }}
              />
            )}
            <span className="text-2xl text-ink-500">%</span>
          </div>
        </div>
      </div>
      <p className="mt-2 text-[11px] text-ink-500">
        Calibration floor: 35%. Below it, the Calibrator proposes a stricter
        escalation threshold.
      </p>
    </div>
  );
}
