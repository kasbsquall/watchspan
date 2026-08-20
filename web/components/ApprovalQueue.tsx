"use client";

import {
  ArrowBendUpRight,
  Robot,
  ShieldWarning,
  Stamp,
} from "@phosphor-icons/react";
import type { TimelineEvent } from "@/lib/api";
import { formatClock } from "./BudgetTimeline";

const ROUTE_META = {
  escalate: {
    label: "to human",
    icon: ArrowBendUpRight,
    color: "text-ink-300",
  },
  auto_execute: {
    label: "auto + audit",
    icon: Robot,
    color: "text-ink-500",
  },
  paused_sentinel: {
    label: "paused",
    icon: ShieldWarning,
    color: "text-ember-500",
  },
} as const;

/* Recent routed requests, dense rows. Risk shown as a filled mass, never a
   colored left border. */
export default function ApprovalQueue({
  events,
  live = false,
}: {
  events: TimelineEvent[];
  live?: boolean;
}) {
  const recent = events.slice(-8).reverse();

  return (
    <div>
      <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-ink-500">
        <Stamp size={15} weight="light" aria-hidden />
        Request stream
        <span className="ml-auto font-data normal-case tracking-normal">
          last {recent.length} of {events.length}
        </span>
      </div>
      {recent.length === 0 ? (
        <p className="mt-4 text-sm text-ink-500">
          No requests routed yet. Press play to run the fleet.
        </p>
      ) : (
        <ul className="mt-2">
          {recent.map((e, i) => {
            const meta = ROUTE_META[e.route];
            const Icon = meta.icon;
            return (
              <li
                key={e.request_id}
                className={`${live ? "" : "row-rise "}grid grid-cols-[52px_1fr_92px_112px] items-center gap-3 border-t border-ink-100/8 py-2 text-sm first:border-t-0`}
                style={{ ["--i" as string]: i }}
              >
                <span className="font-data text-[11px] text-ink-500">
                  {formatClock(e.at)}
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-ink-100">
                    {e.action.replaceAll("_", " ")}
                  </span>
                  <span className="text-[11px] text-ink-500">{e.agent_id}</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span
                    className="h-1 w-14 overflow-hidden rounded-sm bg-ink-800"
                    role="img"
                    aria-label={`risk ${(e.risk_score * 100).toFixed(0)} of 100`}
                  >
                    <span
                      className="block h-full bg-ink-300"
                      style={{
                        width: `${e.risk_score * 100}%`,
                        background:
                          e.risk_score >= 0.7
                            ? "var(--color-ember-500)"
                            : "var(--color-ink-400)",
                      }}
                    />
                  </span>
                  <span className="font-data text-[11px] text-ink-400">
                    {(e.risk_score * 100).toFixed(0)}
                  </span>
                </span>
                <span className={`flex items-center gap-1.5 text-[11px] ${meta.color}`}>
                  <Icon size={14} weight="light" aria-hidden />
                  {meta.label}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
