"use client";

import {
  ArrowBendUpRight,
  Robot,
  ShieldWarning,
  Stamp,
} from "@phosphor-icons/react";
import type { TimelineEvent } from "@/lib/api";
import Panel from "./Panel";
import { formatClock } from "./BudgetTimeline";

const ROUTE_META = {
  escalate: {
    label: "to human",
    icon: ArrowBendUpRight,
    color: "text-ink-300",
  },
  auto_execute: {
    label: "auto-run, logged",
    icon: Robot,
    color: "text-ink-500",
  },
  paused_sentinel: {
    label: "paused",
    icon: ShieldWarning,
    color: "text-ember-500",
  },
} as const;

/* A real table: the columns were unlabelled before, so a reader had to guess
   what the two-digit number meant. Risk is shown as filled mass, never as a
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
    <Panel
      label="Request stream"
      icon={<Stamp size={15} weight="light" aria-hidden />}
      meta={
        events.length <= 8
          ? `${events.length} routed`
          : `last ${recent.length} of ${events.length}`
      }
    >
      {recent.length === 0 ? (
        <p className="py-2 text-sm text-ink-500">
          No requests routed yet. Select &ldquo;Run the fleet&rdquo; to start.
        </p>
      ) : (
        <table className="w-full border-collapse text-sm">
          <caption className="sr-only">
            Requests routed by Watchspan, most recent first
          </caption>
          <thead>
            <tr className="text-[10px] uppercase tracking-[0.16em] text-ink-500">
              <th scope="col" className="w-[62px] py-1.5 text-left font-normal">
                Time
              </th>
              <th scope="col" className="py-1.5 text-left font-normal">
                Action / agent
              </th>
              <th
                scope="col"
                className="hidden w-[110px] py-1.5 text-left font-normal sm:table-cell"
              >
                Risk / 100
              </th>
              <th
                scope="col"
                className="hidden w-[130px] py-1.5 text-left font-normal sm:table-cell"
              >
                Outcome
              </th>
            </tr>
          </thead>
          <tbody>
            {recent.map((e, i) => {
              const meta = ROUTE_META[e.route];
              const Icon = meta.icon;
              return (
                <tr
                  key={e.request_id}
                  className={`${live ? "" : "row-rise "}border-t border-ink-100/8 align-middle`}
                  style={{ ["--i" as string]: i }}
                >
                  <td className="font-data py-2 text-[11px] text-ink-500">
                    {formatClock(e.at)}
                  </td>
                  <td className="min-w-0 py-2">
                    <span className="block truncate text-ink-100">
                      {e.action.replaceAll("_", " ")}
                    </span>
                    <span className="text-[11px] text-ink-500">
                      {e.agent_id}
                    </span>
                    <span className="mt-1 flex items-center gap-2 text-[11px] text-ink-400 sm:hidden">
                      <span className={meta.color}>{meta.label}</span>
                      <span className="font-data">
                        risk {(e.risk_score * 100).toFixed(0)}
                      </span>
                    </span>
                  </td>
                  <td className="hidden py-2 sm:table-cell">
                    <span className="flex items-center gap-1.5">
                      <span
                        className="h-1 w-14 overflow-hidden rounded-sm bg-ink-800"
                        aria-hidden
                      >
                        <span
                          className="block h-full"
                          style={{
                            width: `${e.risk_score * 100}%`,
                            background:
                              e.risk_score >= 0.7
                                ? "var(--color-ember-500)"
                                : "var(--color-ink-400)",
                          }}
                        />
                      </span>
                      <span className="font-data w-6 text-right text-[11px] text-ink-400">
                        {(e.risk_score * 100).toFixed(0)}
                      </span>
                    </span>
                  </td>
                  <td className={`hidden py-2 sm:table-cell ${meta.color}`}>
                    <span className="flex items-center gap-1.5 text-[11px]">
                      <Icon size={14} weight="light" aria-hidden />
                      {meta.label}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
      <p className="mt-2 border-t border-ink-100/8 pt-2 text-[10px] text-ink-500">
        Risk scored 0 to 100. Scores of 70 and above shown in amber.
      </p>
    </Panel>
  );
}
