"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import NumberFlow from "@number-flow/react";
import { Play, ArrowCounterClockwise } from "@phosphor-icons/react";
import AttentionGauge from "@/components/AttentionGauge";
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
  const [policyNote, setPolicyNote] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const start = useCallback(async () => {
    setPhase("loading");
    setPolicyNote(null);
    setProposal(null);
    setUpTo(0);
    try {
      const result = await runSimulation(true);
      setSim(result);
      setPhase("playing");
    } catch {
      setPhase("error");
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
      getProposal().then(setProposal).catch(() => setProposal(null));
    }
  }, [phase, sim, upTo]);

  const visible = sim ? sim.timeline.slice(0, upTo) : [];
  const current = visible.length > 0 ? visible[visible.length - 1] : null;
  const fraction = current ? current.team_fraction : 1;
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
          <p className="font-data text-[11px] uppercase tracking-[0.24em] text-ember-500">
            Watchspan
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
            className="flex items-center gap-2 rounded-sm bg-ember-600 px-5 py-2.5 text-sm text-ink-950 transition-transform duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] hover:bg-ember-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ember-500 active:scale-[0.97] disabled:opacity-50"
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
          The Watchspan API is not reachable. Start it with{" "}
          <span className="font-data">uvicorn api.main:app</span> and run again.
        </div>
      )}

      <section className="mt-10 grid gap-x-12 gap-y-10 lg:grid-cols-[320px_1fr]">
        <div className="rise flex flex-col gap-8" style={{ ["--block" as string]: 1 }}>
          <AttentionGauge fraction={fraction} degraded={!!driftPassed} />
          <dl className="grid grid-cols-4 gap-3 border-t border-ink-100/8 pt-4">
            {(
              [
                ["Routed", counts.routed, "requests"],
                ["Human", counts.escalated, "escalated"],
                ["Auto", counts.auto, "with audit"],
                ["Paused", counts.paused, "by Sentinel"],
              ] as const
            ).map(([label, value, hint]) => (
              <div key={label}>
                <dt className="text-[10px] uppercase tracking-[0.16em] text-ink-500">
                  {label}
                </dt>
                <dd className="font-data mt-1 text-xl text-ink-100">
                  {phase === "idle" || phase === "loading" ? (
                    <span className="inline-block h-6 w-8 animate-pulse rounded-sm bg-ink-800" aria-label="loading" />
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
          <DriftAlert declaredAt={sim?.drift_declared_at ?? null} active={!!driftPassed} />
        </div>

        <div className="rise flex flex-col gap-10" style={{ ["--block" as string]: 2 }}>
          {phase === "idle" || phase === "loading" ? (
            <div className="flex h-[150px] items-center justify-center rounded-sm border border-ink-100/8 bg-ink-900">
              <span className={`text-sm text-ink-500 ${phase === "loading" ? "animate-pulse" : ""}`}>
                {phase === "loading" ? "Preparing the run…" : "The budget line renders here during a run"}
              </span>
            </div>
          ) : (
            <BudgetTimeline
              events={sim!.timeline}
              upTo={upTo}
              driftAt={sim!.drift_declared_at}
              totalSeconds={TOTAL_SECONDS}
            />
          )}
          <ApprovalQueue events={visible} live={phase === "playing"} />
        </div>
      </section>

      <section className="rise mt-14 grid gap-x-12 gap-y-10 border-t border-ink-100/8 pt-8 md:grid-cols-3" style={{ ["--block" as string]: 3 }}>
        <SentinelAlerts events={visible} live={phase === "playing"} />
        <div>
          <PolicyProposal
            proposal={proposal}
            onResolved={(approved, threshold) => {
              setProposal(null);
              setPolicyNote(
                approved
                  ? `Recalibration applied. Escalation threshold is now ${threshold.toFixed(2)}: fewer interruptions, each one reviewed with real attention.`
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

      <footer className="mt-16 border-t border-ink-100/8 pt-4 text-[11px] text-ink-500">
        Watchspan · the human attention budget for agent fleets · demo fleet of
        3 agents, 30 simulated minutes
      </footer>
    </main>
  );
}
