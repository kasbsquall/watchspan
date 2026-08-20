"use client";

import { useState } from "react";
import { DownloadSimple, FileText } from "@phosphor-icons/react";
import { fetchDossier } from "@/lib/api";

const REVOKE_DELAY_MS = 10_000;

/* Article 14 dossier: the auditable proof that oversight was effective. */
export default function EvidenceExport({ ready }: { ready: boolean }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<string | null>(null);

  async function exportDossier() {
    setBusy(true);
    setError(null);
    try {
      const dossier = await fetchDossier();
      setSummary(String(dossier.narrative ?? ""));
      const blob = new Blob([JSON.stringify(dossier, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "watchspan-article14-dossier.json";
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), REVOKE_DELAY_MS);
    } catch {
      setError("Could not generate the dossier. Retry, or contact your administrator.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-ink-500">
        <FileText size={15} weight="light" aria-hidden />
        Article 14 evidence
      </div>
      <p className="mt-3 text-[12px] leading-relaxed text-ink-400">
        Who reviewed what, with how much attention available, and when
        oversight degraded. The evidence of effective human oversight that EU
        AI Act Article 14 requires.
      </p>
      {summary && (
        <p className="mt-2 border-t border-ink-100/8 pt-2 text-[12px] leading-relaxed text-ink-300">
          {summary}
        </p>
      )}
      {error && <p className="mt-2 text-[12px] text-alarm-500">{error}</p>}
      <button
        onClick={exportDossier}
        disabled={!ready || busy}
        className="mt-3 flex items-center gap-1.5 rounded-sm border border-ink-100/15 px-4 py-2 text-sm text-ink-300 transition-[transform,background-color,border-color] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] hover:border-ink-100/30 hover:text-ink-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink-400 active:scale-[0.97] disabled:pointer-events-none disabled:opacity-40"
      >
        <DownloadSimple size={15} weight="light" aria-hidden />
        {busy ? "Generating…" : "Export dossier (JSON)"}
      </button>
      {!ready && (
        <p className="mt-2 text-[11px] text-ink-500">
          Available after a run completes.
        </p>
      )}
    </div>
  );
}
