"use client";

import { Detective } from "@phosphor-icons/react";
import type { TimelineEvent } from "@/lib/api";
import { formatClock } from "./BudgetTimeline";

/* Requests the Sentinel pulled out of band (ATR-2026-00118 patterns). */
export default function SentinelAlerts({
  events,
  live = false,
}: {
  events: TimelineEvent[];
  live?: boolean;
}) {
  const paused = events.filter((e) => e.route === "paused_sentinel").slice(-4).reverse();

  return (
    <div>
      <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-ink-500">
        <Detective size={15} weight="light" aria-hidden />
        Sentinel — fatigue exploitation
      </div>
      {paused.length === 0 ? (
        <p className="mt-3 text-sm text-ink-500">No exploitation patterns detected.</p>
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
                  paused out of band
                </span>
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
