"use client";

import { useState } from "react";
import { Broadcast, Robot } from "@phosphor-icons/react";
import { type LiveFleetResponse, runLiveFleet } from "@/lib/api";
import Panel from "./Panel";

/* The seeded run is what makes thirty minutes of drift visible. This is what
   makes the loop real: a Gemini-backed ADK agent is given a task, decides for
   itself whether it needs approval and how risky to call it, and its request
   goes through the same Sentinel, the same budget and the same calibrated
   policy as the other 370. Model Armor screens the agent's input on the way to
   the model, which is the path that exists nowhere else in the demo. */
export default function LiveFleet() {
  const [state, setState] = useState<"idle" | "running" | "done" | "error">("idle");
  const [result, setResult] = useState<LiveFleetResponse | null>(null);

  async function run() {
    setState("running");
    try {
      setResult(await runLiveFleet(3));
      setState("done");
    } catch {
      setState("error");
    }
  }

  return (
    <Panel
      label="The real fleet"
      icon={<Broadcast size={15} weight="light" aria-hidden />}
      meta="ADK · Gemini 3.5 Flash"
    >
      <p className="mt-1 text-sm text-ink-500">
        The 30-minute run is seeded, because that is what makes the drift
        visible. This gives three tasks to the actual ADK fleet and governs
        whatever it decides to ask for. Each task is a model call, so it takes a
        moment.
      </p>

      <button
        onClick={run}
        disabled={state === "running"}
        className="mt-4 flex items-center gap-2 rounded-sm border border-ink-100/15 px-4 py-2 text-sm text-ink-100 transition-[transform,background-color] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] hover:bg-ink-100/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ember-500 active:scale-[0.97] disabled:pointer-events-none disabled:opacity-50"
      >
        <Robot size={16} weight="light" aria-hidden />
        {state === "running" ? "The fleet is deciding…" : state === "idle" ? "Ask the real fleet" : "Ask again"}
      </button>

      {state === "error" && (
        <p role="alert" className="mt-3 text-sm text-alarm-500">
          The fleet could not be reached. The seeded run above is unaffected.
        </p>
      )}

      {state === "done" && result && (
        <div className="mt-4">
          <p className="text-sm text-ink-400">
            {result.tasks_given} tasks given, {result.requests_the_fleet_chose_to_make}{" "}
            {result.requests_the_fleet_chose_to_make === 1 ? "request" : "requests"} the
            fleet chose to make.
          </p>
          {result.routed.length === 0 ? (
            <p className="mt-2 text-sm text-ink-500">
              It judged none of them consequential enough to need approval.
            </p>
          ) : (
            <ul className="mt-3 divide-y divide-ink-100/8">
              {result.routed.map((r, i) => (
                <li key={i} className="grid grid-cols-[1fr_auto] items-baseline gap-4 py-3">
                  <div>
                    <div className="font-data text-sm text-ink-100">{r.action}</div>
                    <div className="mt-1 text-xs text-ink-500">{r.description}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-data text-sm tabular-nums text-ember-500">
                      {Math.round(r.risk_score * 100)}
                    </div>
                    <div className="mt-1 text-xs text-ink-400">{r.route.replace("_", " ")}</div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </Panel>
  );
}
