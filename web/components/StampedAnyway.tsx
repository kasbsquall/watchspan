"use client";

import NumberFlow from "@number-flow/react";
import { SealWarning } from "@phosphor-icons/react";
import type { TimelineEvent } from "@/lib/api";
import { formatClock } from "./BudgetTimeline";

/* The number the product computed and never showed anyone.

   Every run returned `dangerous_stamped`, the high-risk actions a reviewer
   approved with zero reading behind the click, and the control room rendered
   the ones the Sentinel caught and none of the ones it did not. Two reviewers
   used the same word for that: curation. A tool that measures oversight failure
   and then displays only its own saves is arguing the wrong case.

   Fifty-one is the argument. The seven the Sentinel held are the footnote. */

const DANGEROUS_AT = 0.7;

export default function StampedAnyway({
  events,
  stampedIds,
  caught,
  live = false,
}: {
  events: TimelineEvent[];
  stampedIds: string[] | null;
  caught: number | null;
  live?: boolean;
}) {
  // Joined against the visible timeline, so the count climbs with the run
  // instead of arriving whole at the end. An id with no event yet is an action
  // that has not happened on screen.
  const seen = new Set(stampedIds ?? []);
  const stamped = events.filter((e) => seen.has(e.request_id));
  // Sorted by risk to lead with the worst, then put back in time order for
  // display. Ranked-but-printed-with-timestamps read as a sorting bug: the
  // three rows came out 26:44, 17:46, 18:19 and a reviewer said so.
  const worst = stamped
    .slice()
    .sort((a, b) => b.risk_score - a.risk_score)
    .slice(0, 3)
    .sort((a, b) => a.at - b.at);
  const hasRun = stampedIds !== null;

  return (
    <div>
      <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-ink-500">
        <SealWarning size={15} weight="light" aria-hidden />
        Approved without being read
      </div>

      {!hasRun ? (
        <p className="mt-3 text-sm text-ink-500">
          High-risk actions the reviewer stamped appear here during a run.
        </p>
      ) : (
        <>
          <div className="mt-2 flex items-baseline gap-3">
            <span className="font-data text-[44px] leading-none text-alarm-500 tabular-nums">
              <NumberFlow
                value={stamped.length}
                transformTiming={{ duration: 160, easing: "ease-out" }}
                spinTiming={{ duration: 160, easing: "ease-out" }}
              />
            </span>
            <span className="text-sm leading-snug text-ink-300">
              actions at risk {DANGEROUS_AT.toFixed(2)} or above,
              <br />
              approved with zero seconds of review.
            </span>
          </div>

          {/* "held 2" sits directly under a Paused counter reading 7, and the
              two numbers measure different things: 7 requests held in total, 2
              of them at this risk level. Written as "of them" it read as a
              contradiction, so it now says which population each number is
              counting. */}
          <p className="mt-2 text-[11px] leading-relaxed text-ink-500">
            Another {caught ?? 0} at this risk never reached the queue: the
            Sentinel held them. These {stamped.length} did reach a human.
          </p>

          {worst.length > 0 && (
            <>
              <div className="mt-3 border-t border-ink-100/8 pt-2 text-[10px] uppercase tracking-[0.16em] text-ink-600">
                the {worst.length} highest-risk of {stamped.length}
              </div>
              <ul className="mt-1">
              {worst.map((e, i) => (
                <li
                  key={e.request_id}
                  className={`${live ? "" : "row-rise "}flex items-baseline gap-3 py-1.5`}
                  style={{ ["--i" as string]: i }}
                >
                  <span className="font-data text-[11px] text-ink-500 tabular-nums">
                    {formatClock(e.at)}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-sm text-ink-100">
                    {e.action.replaceAll("_", " ")}
                  </span>
                  <span className="font-data text-[11px] text-alarm-500 tabular-nums">
                    {(e.risk_score * 100).toFixed(0)}
                  </span>
                </li>
              ))}
              </ul>
            </>
          )}
        </>
      )}
    </div>
  );
}
