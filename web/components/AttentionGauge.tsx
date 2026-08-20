"use client";

import NumberFlow from "@number-flow/react";
import { BatteryMedium } from "@phosphor-icons/react";

/* Hero instrument: the shared attention pool, live. Hierarchy 6x between the
   big figure and its label. Amber only when draining, alarm when depleted. */
export default function AttentionGauge({
  fraction,
  degraded,
}: {
  fraction: number;
  degraded: boolean;
}) {
  const pct = Math.round(fraction * 100);
  const radius = 118;
  const circumference = Math.PI * radius; // half circle
  const filled = circumference * fraction;
  const state = degraded || pct <= 10 ? "alarm" : pct <= 35 ? "ember" : "ok";
  const strokeColor =
    state === "alarm"
      ? "var(--color-alarm-500)"
      : state === "ember"
        ? "var(--color-ember-500)"
        : "var(--color-ok-500)";

  return (
    <div className="flex flex-col items-center">
      <div className="flex items-center gap-2 self-start text-[11px] uppercase tracking-[0.18em] text-ink-500">
        <BatteryMedium size={15} weight="light" aria-hidden />
        Team attention remaining
      </div>
      <div className="relative mt-2">
        <svg
          width="300"
          height="168"
          viewBox="0 0 300 168"
          role="img"
          aria-label={`Team attention remaining: ${pct} percent`}
        >
          <path
            d="M 32 158 A 118 118 0 0 1 268 158"
            fill="none"
            stroke="var(--color-ink-800)"
            strokeWidth="10"
            strokeLinecap="round"
          />
          <path
            d="M 32 158 A 118 118 0 0 1 268 158"
            fill="none"
            stroke={strokeColor}
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={`${filled} ${circumference}`}
            style={{ transition: "stroke-dasharray 180ms cubic-bezier(0.23,1,0.32,1), stroke 180ms" }}
          />
          {/* Calibration ticks at the policy-relevant thresholds */}
          {[0.35].map((t) => {
            const angle = Math.PI * (1 - t);
            const x1 = 150 + Math.cos(angle) * 104;
            const y1 = 158 - Math.sin(angle) * 104;
            const x2 = 150 + Math.cos(angle) * 132;
            const y2 = 158 - Math.sin(angle) * 132;
            return (
              <line
                key={t}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke="var(--color-ink-500)"
                strokeWidth="1"
              />
            );
          })}
        </svg>
        <div className="absolute inset-x-0 bottom-0 flex flex-col items-center">
          <div className="font-data text-7xl leading-none" style={{ color: strokeColor }}>
            <NumberFlow
              value={pct}
              transformTiming={{ duration: 140, easing: "ease-out" }}
              spinTiming={{ duration: 140, easing: "ease-out" }}
            />
            <span className="text-2xl text-ink-500">%</span>
          </div>
        </div>
      </div>
      <p className="mt-2 text-[11px] text-ink-500">
        Calibration floor at 35% — below it, the Calibrator proposes raising the bar
      </p>
    </div>
  );
}
