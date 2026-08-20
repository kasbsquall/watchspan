"use client";

import { Seal, SealWarning } from "@phosphor-icons/react";
import { formatClock } from "./BudgetTimeline";

/* The declaration moment. The one element allowed to use alarm red. */
export default function DriftAlert({
  declaredAt,
  active,
}: {
  declaredAt: number | null;
  active: boolean;
}) {
  if (!active || declaredAt === null) {
    return (
      <div className="flex items-center gap-3 rounded-sm border border-ink-100/8 bg-ink-900 px-4 py-3">
        <Seal size={20} weight="light" className="text-ok-500" aria-hidden />
        <div>
          <p className="text-sm text-ink-100">Oversight holding</p>
          <p className="text-[11px] text-ink-500">
            Decision time and review depth within normal range
          </p>
        </div>
      </div>
    );
  }
  return (
    <div
      role="alert"
      className="flex items-center gap-3 rounded-sm border border-alarm-500/40 bg-alarm-500/10 px-4 py-3"
    >
      <SealWarning size={20} weight="light" className="text-alarm-500" aria-hidden />
      <div>
        <p className="text-sm text-alarm-500">
          Oversight stopped being effective at {formatClock(declaredAt)}
        </p>
        <p className="text-[11px] text-ink-400">
          Decision time collapsed while action complexity held. Reviews are now
          stamps, not judgments.
        </p>
      </div>
    </div>
  );
}
