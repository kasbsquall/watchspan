"use client";

import { useEffect, useState } from "react";
import {
  ArrowSquareOut,
  CheckCircle,
  CircleNotch,
  WarningCircle,
} from "@phosphor-icons/react";
import { fetchGeapStatus, type GeapProbe, type GeapStatus as Status } from "@/lib/api";

/* The Google Cloud footprint, checked rather than claimed.

   A reviewer put it bluntly: a judge who only opens the live URL sees a
   simulation and no evidence that any of this runs on Google Cloud. The
   endpoint that proves it existed and lived in the README, which is the same
   as asserting it. This calls each service on load and prints what came back,
   including the trace id, so the claim can be followed rather than believed.

   How each answer was obtained is on screen next to it. Counting an
   environment-variable check as a verified service is the self-graded exam
   this panel exists to avoid being. */

const LABELS: Record<string, string> = {
  cloud_run: "Cloud Run",
  vertex_ai_gemini: "Vertex AI · Gemini",
  memory_bank: "Memory Bank",
  model_armor: "Model Armor",
  agent_registry: "Agent Registry",
  cloud_trace: "Cloud Trace",
  agent_runtime: "Agent Runtime",
};

const ORDER = [
  "agent_runtime",
  "agent_registry",
  "memory_bank",
  "model_armor",
  "vertex_ai_gemini",
  "cloud_trace",
  "cloud_run",
];

function detail(key: string, row: GeapProbe): string {
  // A probe that threw has no figures, and the fields below would render zeros
  // it never measured: "0 traces in the last hour" for a call that never
  // happened reads as a measurement. Say what went wrong instead.
  if (row.checked === false || row.how === "not_attempted") {
    // The error when there is one, and a short reason when the probe simply
    // found the service unconfigured. Falling through to `detail` printed a
    // two-line explanation of what the service does into a column of figures.
    const err = String(row.error ?? "");
    return err ? err.slice(0, 90) : "not configured on this deployment";
  }
  const s = (k: string) => String(row[k] ?? "");
  switch (key) {
    case "agent_runtime":
      return s("display_name") || s("detail");
    case "agent_registry":
      return `${row.watchspan_agents_catalogued ?? "?"} agent cards catalogued`;
    case "memory_bank":
      return `${row.facts_recalled ?? 0} facts recalled from ${s("backend")}`;
    case "model_armor":
      return row.blocks_prompt_injection
        ? "blocked a prompt injection on this request"
        : "did not block the test injection";
    case "vertex_ai_gemini":
      return s("model");
    case "cloud_trace":
      return `${row.traces_in_the_last_day ?? 0} traces in the last day`;
    case "cloud_run":
      return s("revision");
    default:
      return s("detail");
  }
}

export default function GeapStatus() {
  const [status, setStatus] = useState<Status | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    fetchGeapStatus(controller.signal)
      .then((s) => {
        if (!controller.signal.aborted) setStatus(s);
      })
      .catch(() => {
        if (!controller.signal.aborted) setFailed(true);
      });
    return () => controller.abort();
  }, []);

  const summary = status?._summary;
  const shown = status ? ORDER.filter((k) => status[k]) : [];

  return (
    <div>
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <h2 className="text-[11px] uppercase tracking-[0.18em] text-ink-500">
          Google Cloud footprint, checked on this page load
        </h2>
        {summary && (
          <span className="font-data text-[11px] tabular-nums text-ok-500">
            {summary.verified_by_live_call} of {summary.of_live_calls} verified
            by a live call
          </span>
        )}
      </div>

      {failed ? (
        <p className="mt-3 text-sm text-ink-500">
          Could not reach the status endpoint. The services may still be running;
          this panel could not confirm it.
        </p>
      ) : !status ? (
        <ul className="mt-3 grid gap-x-10 lg:grid-cols-2">
          {ORDER.map((key) => (
            <li
              key={key}
              className="flex items-center gap-3 border-b border-ink-100/8 py-2"
            >
              <CircleNotch
                size={15}
                weight="light"
                aria-hidden
                className="animate-spin text-ink-600"
              />
              <span className="text-sm text-ink-500">{LABELS[key]}</span>
              <span
                role="status"
                aria-label={`${LABELS[key]} checking`}
                className="ml-auto h-3 w-40 animate-pulse rounded-sm bg-ink-800"
              />
            </li>
          ))}
        </ul>
      ) : (
        <ul className="mt-3 grid gap-x-10 lg:grid-cols-2">
          {shown.map((key, i) => {
            const row = status[key] as GeapProbe;
            // Seven rows in two columns leave the last one alone with a rule
            // hanging under it. The odd row is Cloud Run, the only answer that
            // is a config check rather than a live call, so it spans the width
            // and the split reads as the distinction it actually is.
            const spans = i === shown.length - 1 && shown.length % 2 === 1;
            const ok = Boolean(row.ok);
            const how = String(row.how ?? "");
            const link = String(row.read_it_at ?? "");
            return (
              <li
                key={key}
                className={`row-rise flex flex-wrap items-center gap-x-3 gap-y-1 py-2 ${
                  spans ? "border-t border-ink-100/8 lg:col-span-2" : "border-b border-ink-100/8"
                }`}
                style={{ ["--i" as string]: i }}
              >
                {ok ? (
                  <CheckCircle
                    size={15}
                    weight="light"
                    aria-hidden
                    className="text-ok-500"
                  />
                ) : (
                  <WarningCircle
                    size={15}
                    weight="light"
                    aria-hidden
                    className="text-alarm-500"
                  />
                )}
                <span className="text-sm text-ink-100">{LABELS[key]}</span>
                <span className="font-data text-[10px] uppercase tracking-[0.14em] text-ink-600">
                  {how === "round_trip"
                    ? "live call"
                    : how === "config"
                      ? "config check"
                      : "not attempted"}
                </span>
                <span className="ml-auto flex items-center gap-2 font-data text-[11px] tabular-nums text-ink-400">
                  {detail(key, row)}
                  {link && (
                    <a
                      href={link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-ember-500 underline-offset-2 transition-opacity duration-150 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ember-500 active:opacity-70"
                    >
                      open
                      <ArrowSquareOut size={12} weight="light" aria-hidden />
                    </a>
                  )}
                </span>
              </li>
            );
          })}
        </ul>
      )}

      <p className="mt-3 text-[11px] leading-relaxed text-ink-500">
        A live call means this page load reached the service and read its answer.
        A config check means an environment check only, and is counted
        separately.
      </p>
    </div>
  );
}
