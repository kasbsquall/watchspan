"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import NumberFlow from "@number-flow/react";
import { Play, ArrowCounterClockwise } from "@phosphor-icons/react";
import AttentionGauge from "@/components/AttentionGauge";
import Logo from "@/components/Logo";
import ApprovalQueue from "@/components/ApprovalQueue";
import BudgetTimeline from "@/components/BudgetTimeline";
import DriftAlert from "@/components/DriftAlert";
import EvidenceExport from "@/components/EvidenceExport";
import PolicyProposal from "@/components/PolicyProposal";
import SentinelAlerts from "@/components/SentinelAlerts";
import {
  getProposal,
  runSimulation,
  type PendingProposal,
  type SimulationResponse,
} from "@/lib/api";

const TOTAL_SECONDS = 30 * 60;
const EVENTS_PER_TICK = 3;
const TICK_MS = 120;

type Phase = "idle" | "loading" | "playing" | "done" | "error";

export default function ControlRoom() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [sim, setSim] = useState<SimulationResponse | null>(null);
  const [upTo, setUpTo] = useState(0);
  const [proposal, setProposal] = useState<PendingProposal | null>(null);
  const [proposalFetchFailed, setProposalFetchFailed] = useState(false);
  const [policyNote, setPolicyNote] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const start = useCallback(async () => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setPhase("loading");
    setPolicyNote(null);
    setProposal(null);
    setProposalFetchFailed(false);
    setUpTo(0);
    try {
      const result = await runSimulation(true, controller.signal);
      if (controller.signal.aborted) return;
      if (result.timeline.length === 0) {
        setPhase("error");
        return;
      }
      setSim(result);
      setPhase("playing");
    } catch {
      if (!controller.signal.aborted) setPhase("error");
    }
  }, []);

  useEffect(() => {
    if (phase !== "playing" || !sim) return;
    timer.current = setInterval(() => {
      setUpTo((n) => {
        if (n >= sim.timeline.length) return n;
        return Math.min(sim.timeline.length, n + EVENTS_PER_TICK);
      });
    }, TICK_MS);
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, [phase, sim]);

  useEffect(() => {
    if (phase === "playing" && sim && upTo >= sim.timeline.length) {
      setPhase("done");
      const signal = abortRef.current?.signal;
      getProposal(signal)
        .then((p) => {
          if (!signal?.aborted) setProposal(p);
        })
        .catch(() => {
          if (!signal?.aborted) setProposalFetchFailed(true);
        });
    }
  }, [phase, sim, upTo]);

  const visible = sim ? sim.timeline.slice(0, upTo) : [];
  const current = visible.length > 0 ? visible[visible.length - 1] : null;
  // No run data means no value to show. Painting 100% here would assert a
  // full budget that was never measured.
  const hasData = sim !== null && current !== null;
  const fraction = hasData ? current!.team_fraction : null;
  const driftPassed =
    sim?.drift_declared_at != null && current != null && current.at >= sim.drift_declared_at;

  const counts = {
    routed: visible.length,
    escalated: visible.filter((e) => e.route === "escalate").length,
    auto: visible.filter((e) => e.route === "auto_execute").length,
    paused: visible.filter((e) => e.route === "paused_sentinel").length,
  };

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <header className="rise flex flex-wrap items-end justify-between gap-4" style={{ ["--block" as string]: 0 }}>
        <div>
          <p className="flex items-center gap-2.5 text-ink-300">
            <Logo size={22} />
            <span className="font-data text-[11px] uppercase tracking-[0.24em] text-ember-500">
              Watchspan
            </span>
          </p>
          <h1 className="mt-1 text-3xl font-medium tracking-[-0.018em] text-ink-100">
            Fleet oversight control room
          </h1>
          <p className="mt-1 max-w-xl text-sm leading-relaxed text-ink-400">
            Three institutional agents are asking one reviewer for approval.
            Watch the attention budget drain, the reviews turn into stamps, and
            Watchspan catch the moment it happens.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={start}
            disabled={phase === "loading" || phase === "playing"}
            className="flex items-center gap-2 rounded-sm bg-ember-600 px-5 py-2.5 text-sm text-ink-950 transition-[transform,background-color] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] hover:bg-ember-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ember-500 active:scale-[0.97] disabled:pointer-events-none disabled:opacity-50"
          >
            {phase === "done" || phase === "error" ? (
              <ArrowCounterClockwise size={16} weight="light" aria-hidden />
            ) : (
              <Play size={16} weight="light" aria-hidden />
            )}
            {phase === "loading"
              ? "Preparing run…"
              : phase === "playing"
                ? "Running…"
                : phase === "done" || phase === "error"
                  ? "Run again"
                  : "Run the fleet"}
          </button>
        </div>
      </header>

      {phase === "error" && (
        <div role="alert" className="mt-8 rounded-sm border border-alarm-500/40 bg-alarm-500/10 px-4 py-3 text-sm text-alarm-500">
          Could not connect to the Watchspan service. Check that the backend is
          running, then run again.
        </div>
      )}

      <div className="rise mt-10" style={{ ["--block" as string]: 1 }}>
        <DriftAlert declaredAt={sim?.drift_declared_at ?? null} active={!!driftPassed} />
      </div>

      <section className="mt-8 grid items-start gap-x-12 gap-y-10 lg:grid-cols-[320px_1fr]">
        <div className="rise flex flex-col gap-8" style={{ ["--block" as string]: 1 }}>
          <AttentionGauge fraction={fraction} degraded={!!driftPassed} />
          <dl className="grid grid-cols-2 gap-x-3 gap-y-4 border-t border-ink-100/8 pt-4 sm:grid-cols-4 sm:gap-y-0">
            {(
              [
                ["Routed", counts.routed, "total requests"],
                ["Escalated", counts.escalated, "to a human"],
                ["Auto-run", counts.auto, "logged for audit"],
                ["Paused", counts.paused, "by Sentinel"],
              ] as const
            ).map(([label, value, hint]) => (
              <div key={label}>
                <dt className="text-[10px] uppercase tracking-[0.16em] text-ink-500">
                  {label}
                </dt>
                <dd className="font-data mt-1 text-2xl text-ink-100">
                  {phase === "loading" ? (
                    <span
                      role="status"
                      aria-label={`${label} value loading`}
                      className="inline-block h-6 w-8 animate-pulse rounded-sm bg-ink-800"
                    />
                  ) : !hasData ? (
                    <span className="text-ink-500" aria-label={`${label}: no data yet`}>
                      &ndash;
                    </span>
                  ) : (
                    <NumberFlow
                      value={value}
                      transformTiming={{ duration: 140, easing: "ease-out" }}
                      spinTiming={{ duration: 140, easing: "ease-out" }}
                    />
                  )}
                </dd>
                <dd className="text-[10px] text-ink-500">{hint}</dd>
              </div>
            ))}
          </dl>
          <SentinelAlerts events={visible} live={phase === "playing"} />
        </div>

        <div className="rise flex flex-col gap-10" style={{ ["--block" as string]: 2 }}>
          {phase === "idle" || phase === "loading" || sim === null ? (
            <div className="rounded-sm border border-ink-100/8 bg-ink-900/60">
              <div className="flex items-center gap-2 border-b border-ink-100/8 px-4 py-2.5 text-[11px] uppercase tracking-[0.18em] text-ink-500">
                <span className="inline-block h-[15px] w-[15px]" aria-hidden />
                Attention budget across the run
              </div>
              <div className="flex aspect-[640/150] w-full items-center justify-center">
                <span className={`text-sm text-ink-500 ${phase === "loading" ? "animate-pulse" : ""}`}>
                  {phase === "loading"
                    ? "Preparing the run…"
                    : phase === "error"
                      ? "No run data. Resolve the connection and run again."
                      : "The attention budget renders here during a run"}
                </span>
              </div>
            </div>
          ) : (
            <BudgetTimeline
              events={sim!.timeline}
              upTo={upTo}
              driftAt={sim!.drift_declared_at}
              totalSeconds={TOTAL_SECONDS}
              live={phase === "playing"}
            />
          )}
          <ApprovalQueue events={visible} live={phase === "playing"} />
        </div>
      </section>

      <section className="rise mt-24 grid gap-x-12 gap-y-6 border-t border-ink-100/8 pt-8 md:grid-cols-2" style={{ ["--block" as string]: 3 }}>
        <div>
          <PolicyProposal
            proposal={proposal}
            fetchFailed={proposalFetchFailed}
            onResolved={(approved, threshold) => {
              setProposal(null);
              setPolicyNote(
                approved
                  ? `Recalibration applied. Escalation threshold is now ${threshold.toFixed(2)}. Requests below it will auto-run with an audit log.`
                  : "Proposal rejected. The current policy stays active.",
              );
            }}
          />
          {policyNote && (
            <p className="mt-3 border-t border-ink-100/8 pt-3 text-[12px] leading-relaxed text-ok-500">
              {policyNote}
            </p>
          )}
        </div>
        <EvidenceExport ready={phase === "done"} />
      </section>

      <footer className="mt-16 flex flex-wrap justify-between gap-2 border-t border-ink-100/8 pt-4 text-[11px] text-ink-500">
        <span>Watchspan · the human attention budget for agent fleets</span>
        <span className="font-data">demo fleet of three agents · 30 simulated minutes</span>
      </footer>
    </main>
  );
}
