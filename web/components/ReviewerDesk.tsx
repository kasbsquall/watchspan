"use client";

import { useCallback, useRef, useState } from "react";
import NumberFlow from "@number-flow/react";
import {
  CaretDown,
  Check,
  Prohibit,
  Question,
  SealWarning,
  UserFocus,
} from "@phosphor-icons/react";
import {
  decide,
  openSection,
  startReview,
  RateLimited,
  type ReviewCard,
  type ReviewOutcome,
} from "@/lib/api";


/* Watchspan measuring the person reading this page.

   Everything else here is the product demonstrated against a reviewer this
   repository wrote, which a reviewer fairly called a detector detecting its own
   generator. This is twelve real approval requests, routed through the same
   governance layer, decided by whoever is holding the mouse. The server issues
   the reviewer id, starts the clock when it hands over a request, and counts
   the detail sections actually opened. The browser sends a verdict and nothing
   else, because a control-effectiveness number supplied by the party being
   audited is not evidence.

   The queue is longer than anyone's patience on purpose. Around the eighth
   card most people stop reading, and two of the twelve are a vendor bank
   account change. */

type Phase = "idle" | "loading" | "reviewing" | "done" | "error";

const SECTIONS = [
  { id: "basis", label: "Why Watchspan scored it this way" },
  { id: "agent", label: "What the agent said about it" },
] as const;

export default function ReviewerDesk() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [card, setCard] = useState<ReviewCard | null>(null);
  const [total, setTotal] = useState(0);
  const [done, setDone] = useState(0);
  const [reviewerId, setReviewerId] = useState("");
  const [open, setOpen] = useState<Set<string>>(new Set());
  const [last, setLast] = useState<ReviewOutcome | null>(null);
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState("");
  const abort = useRef<AbortController | null>(null);

  const start = useCallback(async () => {
    abort.current?.abort();
    const controller = new AbortController();
    abort.current = controller;
    setPhase("loading");
    setLast(null);
    setDone(0);
    setOpen(new Set());
    try {
      const started = await startReview(controller.signal);
      if (controller.signal.aborted) return;
      setCard(started.current);
      setTotal(started.queue_length);
      setReviewerId(started.reviewer_id);
      setPhase(started.current ? "reviewing" : "error");
    } catch (err) {
      if (controller.signal.aborted) return;
      setProblem(
        err instanceof RateLimited
          ? err.detail
          : "The desk could not reach Watchspan. Try taking the queue again.",
      );
      setPhase("error");
    }
  }, []);

  const expand = useCallback(
    async (section: string) => {
      if (!card) return;
      const key = `${card.request_id}:${section}`;
      if (open.has(key)) {
        setOpen((prev) => {
          const next = new Set(prev);
          next.delete(key);
          return next;
        });
        return;
      }
      setOpen((prev) => new Set(prev).add(key));
      // The count that matters is the server's. This call is what makes review
      // depth a measurement rather than a claim.
      await openSection(card.request_id, section).catch(() => undefined);
    },
    [card, open],
  );

  const answer = useCallback(
    async (approved: boolean) => {
      if (!card || busy) return;
      setBusy(true);
      try {
        const outcome = await decide(card.request_id, approved);
        setLast(outcome);
        setDone((n) => n + 1);
        setCard(outcome.next);
        if (!outcome.next) setPhase("done");
      } catch (err) {
        setProblem(
          err instanceof RateLimited
            ? err.detail
            : "Watchspan did not record that decision. Take the queue again.",
        );
        setPhase("error");
      } finally {
        setBusy(false);
      }
    },
    [card, busy],
  );

  const stamped = last?.approved_without_reading ?? 0;
  const degraded = Boolean(last?.drift_degraded);

  return (
    <section
      className={`rounded-sm border bg-ink-900/60 transition-colors duration-300 ${
        degraded ? "border-alarm-500/40" : "border-ink-100/8"
      }`}
    >
      <header className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-ink-100/8 px-4 py-2.5 text-[11px] uppercase tracking-[0.18em] text-ink-500">
        <UserFocus size={15} weight="light" aria-hidden />
        Review these yourself
        {phase === "reviewing" && (
          <span className="ml-auto font-data normal-case tracking-normal tabular-nums">
            {done + 1} of {total}
          </span>
        )}
        {phase === "done" && reviewerId && (
          <span className="ml-auto font-data normal-case tracking-normal text-ink-600">
            {reviewerId}
          </span>
        )}
      </header>

      <div className="px-4 py-4">
        {phase === "idle" && (
          <>
            <p className="max-w-xl text-sm leading-relaxed text-ink-300">
              Everything above is Watchspan measuring a simulated reviewer. This
              is twelve real requests from the same fleet, routed through the
              same governance layer, decided by you. Watchspan times each
              decision and counts what you open. Nothing you send can set those
              numbers.
            </p>
            <button
              onClick={start}
              className="mt-4 flex items-center gap-2 rounded-sm bg-ember-600 px-5 py-2.5 text-sm text-ink-950 transition-[transform,background-color] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] hover:bg-ember-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ember-500 active:scale-[0.97]"
            >
              <UserFocus size={16} weight="light" aria-hidden />
              Take the queue
            </button>
          </>
        )}

        {phase === "loading" && (
          <div className="space-y-2" role="status" aria-label="Preparing the queue">
            <div className="h-4 w-2/3 animate-pulse rounded-sm bg-ink-800" />
            <div className="h-4 w-1/3 animate-pulse rounded-sm bg-ink-800" />
          </div>
        )}

        {phase === "error" && (
          <>
            <p role="alert" className="text-sm text-alarm-500">
              {problem}
            </p>
            <button
              onClick={start}
              className="mt-3 rounded-sm border border-ink-100/12 px-4 py-2 text-sm text-ink-200 transition-[transform,border-color] duration-150 hover:border-ink-100/30 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ember-500 active:scale-[0.97]"
            >
              Try again
            </button>
          </>
        )}

        {phase === "reviewing" && card && (
          <>
            <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
              <h3 className="text-[22px] tracking-[-0.015em] text-ink-100">
                {card.action.replaceAll("_", " ")}
              </h3>
              <span className="font-data text-[11px] tabular-nums text-ink-500">
                {card.agent_id} · risk{" "}
                <span
                  className={
                    card.risk_routed_on >= 0.7 ? "text-alarm-500" : "text-ember-500"
                  }
                >
                  {(card.risk_routed_on * 100).toFixed(0)}
                </span>{" "}
                of 100
              </span>
            </div>
            {card.description && (
              <p className="mt-1 max-w-2xl text-sm leading-relaxed text-ink-300">
                {card.description}
              </p>
            )}
            {!card.recognised && (
              <p className="mt-2 flex items-center gap-2 text-[12px] text-ember-500">
                <Question size={14} weight="light" aria-hidden />
                Watchspan could not classify this action, so it escalated rather
                than clearing it.
              </p>
            )}

            <div className="mt-3 border-t border-ink-100/8 pt-1">
              {SECTIONS.map((section) => {
                const key = `${card.request_id}:${section.id}`;
                const isOpen = open.has(key);
                return (
                  <div key={section.id}>
                    <button
                      onClick={() => expand(section.id)}
                      aria-expanded={isOpen}
                      className="flex w-full items-center gap-2 py-2 text-left text-[13px] text-ink-400 transition-colors duration-150 hover:text-ink-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ember-500"
                    >
                      <CaretDown
                        size={13}
                        weight="light"
                        aria-hidden
                        className={`transition-transform duration-150 ${isOpen ? "rotate-0" : "-rotate-90"}`}
                      />
                      {section.label}
                    </button>
                    {isOpen && (
                      <p className="pb-2 pl-5 text-[13px] leading-relaxed text-ink-300">
                        {section.id === "basis"
                          ? card.assessment_basis ||
                            "No basis recorded for this action."
                          : `The agent declared this a ${(card.risk_declared_by_agent * 100).toFixed(0)} of 100, at complexity ${(card.complexity * 100).toFixed(0)}.`}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="mt-3 flex flex-wrap gap-2 border-t border-ink-100/8 pt-3">
              <button
                onClick={() => answer(true)}
                disabled={busy}
                className="flex items-center gap-2 rounded-sm bg-ember-600 px-4 py-2 text-sm text-ink-950 transition-[transform,background-color] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] hover:bg-ember-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ember-500 active:scale-[0.97] disabled:pointer-events-none disabled:opacity-50"
              >
                <Check size={15} weight="light" aria-hidden />
                Approve
              </button>
              <button
                onClick={() => answer(false)}
                disabled={busy}
                className="flex items-center gap-2 rounded-sm border border-ink-100/12 px-4 py-2 text-sm text-ink-200 transition-[transform,border-color] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] hover:border-ink-100/30 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ember-500 active:scale-[0.97] disabled:pointer-events-none disabled:opacity-50"
              >
                <Prohibit size={15} weight="light" aria-hidden />
                Reject
              </button>
            </div>

            {last && (
              <dl className="mt-3 flex flex-wrap gap-x-8 gap-y-2 border-t border-ink-100/8 pt-3 text-[11px]">
                <div>
                  <dt className="uppercase tracking-[0.16em] text-ink-600">
                    Last decision
                  </dt>
                  <dd className="font-data mt-0.5 text-sm tabular-nums text-ink-100">
                    {last.decision_time_s.toFixed(1)}s
                  </dd>
                </div>
                <div>
                  <dt className="uppercase tracking-[0.16em] text-ink-600">
                    You opened
                  </dt>
                  <dd className="font-data mt-0.5 text-sm tabular-nums text-ink-100">
                    {last.review_depth} of {SECTIONS.length}
                  </dd>
                </div>
                <div>
                  <dt className="uppercase tracking-[0.16em] text-ink-600">
                    Approved unread
                  </dt>
                  <dd
                    className={`font-data mt-0.5 text-sm tabular-nums ${stamped > 0 ? "text-alarm-500" : "text-ink-100"}`}
                  >
                    <NumberFlow value={stamped} />
                  </dd>
                </div>
              </dl>
            )}
          </>
        )}

        {phase === "done" && last && (
          <>
            <div className="flex items-baseline gap-3">
              <span className="font-data text-[52px] leading-none tabular-nums text-alarm-500">
                <NumberFlow value={stamped} />
              </span>
              <span className="max-w-sm text-sm leading-snug text-ink-300">
                of your {last.decisions_recorded} decisions were approvals taken
                in under three seconds with nothing opened.
              </span>
            </div>

            <dl className="mt-4 flex flex-wrap gap-x-10 gap-y-3 border-t border-ink-100/8 pt-3 text-[11px]">
              <div>
                <dt className="uppercase tracking-[0.16em] text-ink-600">
                  Your median decision
                </dt>
                <dd className="font-data mt-0.5 text-lg tabular-nums text-ink-100">
                  {last.median_decision_time_s === null
                    ? "–"
                    : `${last.median_decision_time_s.toFixed(1)}s`}
                </dd>
              </div>
              <div>
                <dt className="uppercase tracking-[0.16em] text-ink-600">
                  Watchspan&rsquo;s verdict on you
                </dt>
                <dd
                  className={`font-data mt-0.5 text-lg ${degraded ? "text-alarm-500" : "text-ok-500"}`}
                >
                  {degraded ? "oversight degraded" : "oversight holding"}
                </dd>
              </div>
              <div>
                <dt className="uppercase tracking-[0.16em] text-ink-600">
                  Reviewer
                </dt>
                <dd className="font-data mt-0.5 text-lg text-ink-300">
                  {reviewerId}
                </dd>
              </div>
            </dl>

            {degraded && (
              <p className="mt-3 flex items-start gap-2 text-[13px] leading-relaxed text-alarm-500">
                <SealWarning size={15} weight="light" aria-hidden className="mt-0.5 shrink-0" />
                Watchspan has declared your oversight degraded, on the same
                evidence and the same thresholds it applies to the simulated
                reviewer above. Your decisions are in the Article 14 dossier
                under this reviewer id.
              </p>
            )}

            <button
              onClick={start}
              className="mt-4 rounded-sm border border-ink-100/12 px-4 py-2 text-sm text-ink-200 transition-[transform,border-color] duration-150 hover:border-ink-100/30 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ember-500 active:scale-[0.97]"
            >
              Take another queue
            </button>
          </>
        )}
      </div>
    </section>
  );
}
