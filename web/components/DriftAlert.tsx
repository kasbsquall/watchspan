"use client";

import { Seal, SealWarning } from "@phosphor-icons/react";
import { formatClock } from "./BudgetTimeline";

/* The declaration moment. This is the product's whole claim, so when it fires
   it takes the full width and the timestamp gets display scale. The rest of
   the time it stays a quiet one-line reassurance. */
export default function DriftAlert({
  declaredAt,
  active,
  measured = false,
}: {
  declaredAt: number | null;
  active: boolean;
  /* Whether any decision has been recorded yet. Without this the banner printed
     "Oversight holding" under a green seal before a single decision existed,
     which is a verdict on nothing, and it sat directly above a reviewer console
     reporting the opposite about a real person. */
  measured?: boolean;
}) {
  if (!active || declaredAt === null) {
    return (
      <div className="flex items-center gap-3 rounded-sm border border-ink-100/8 bg-ink-900/60 px-4 py-3">
        <Seal
          size={18}
          weight="light"
          className={measured ? "text-ok-500" : "text-ink-600"}
          aria-hidden
        />
        <p className="text-sm text-ink-300">
          {measured ? "Oversight holding" : "Nothing measured yet"}
          <span className="ml-2 text-[12px] text-ink-500">
            {measured
              ? "the simulated reviewer's decision time and review depth are within normal range"
              : "run the fleet, or take the queue yourself, and a verdict appears here"}
          </span>
        </p>
      </div>
    );
  }
  return (
    <div
      role="alert"
      className="rise rounded-sm border border-alarm-500/40 bg-alarm-500/[0.07] px-6 py-5"
    >
      <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
        <SealWarning
          size={22}
          weight="light"
          className="translate-y-[3px] text-alarm-500"
          aria-hidden
        />
        <p className="text-lg tracking-[-0.015em] text-alarm-500">
          Oversight stopped being effective
        </p>
        <p className="font-data text-4xl leading-none tracking-[-0.02em] text-alarm-500">
          {formatClock(declaredAt)}
        </p>
        <span className="text-[11px] uppercase tracking-[0.16em] text-ink-500">
          into the run
        </span>
      </div>
      <p className="mt-2 max-w-2xl text-[13px] leading-relaxed text-ink-400">
        Decision time collapsed while action complexity held. Reviews are now
        stamps, not judgments.
      </p>
    </div>
  );
}
