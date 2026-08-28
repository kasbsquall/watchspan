"use client";

import { Detective } from "@phosphor-icons/react";
import type { TimelineEvent } from "@/lib/api";
import { formatClock } from "./BudgetTimeline";

/* Requests the Sentinel held back (approval-fatigue exploitation patterns:
   bursts, minimizing language, risk hidden in benign batches). */
export default function SentinelAlerts({
  events,
  live = false,
}: {
  events: TimelineEvent[];
  live?: boolean;
}) {
  /* Ordered by risk, not by arrival.
     `.slice(-4)` took the four most recent, and in the seeded run the held
     requests arrive with the production backup deletion third of seven, so the
     panel showed risks 25, 36, 74 and 12 and never the 90. The single catch the
     product exists to demonstrate, and the one the film spends thirty-five
     seconds on, was invisible to anyone who opened the live URL. A panel headed
     "held for review" should lead with the most dangerous thing it is holding. */
  const paused = events
    .filter((e) => e.route === "paused_sentinel")
    .slice()
    .sort((a, b) => b.risk_score - a.risk_score)
    .slice(0, 4);

  return (
    <div>
      <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-ink-500">
        <Detective size={15} weight="light" aria-hidden />
        Sentinel · requests held for review
      </div>
      {paused.length === 0 ? (
        <p className="mt-3 text-sm text-ink-500">
          No suspicious timing or batching patterns detected.
        </p>
      ) : (
        <ul className="mt-2">
          {paused.map((e, i) => (
            <li
              key={e.request_id}
              className={`${live ? "" : "row-rise "}flex items-baseline gap-3 border-t border-ink-100/8 py-2 first:border-t-0`}
              style={{ ["--i" as string]: i }}
            >
              <span className="font-data text-[11px] text-ink-500">
                {formatClock(e.at)}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm text-ink-100">
                  {e.action.replaceAll("_", " ")}
                </span>
                <span className="text-[11px] text-ink-500">
                  {e.agent_id} · risk {(e.risk_score * 100).toFixed(0)} of 100 ·
                  held for direct review, outside the approval queue
                </span>
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
