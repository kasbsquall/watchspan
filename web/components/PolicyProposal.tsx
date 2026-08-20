"use client";

import { useState } from "react";
import { Check, Scales, X } from "@phosphor-icons/react";
import { resolveProposal, type PendingProposal } from "@/lib/api";

const BUTTON_TRANSITION =
  "transition-[transform,background-color,border-color] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)]";

/* The one approval that stays genuinely human: rare and consequential. */
export default function PolicyProposal({
  proposal,
  fetchFailed = false,
  onResolved,
}: {
  proposal: PendingProposal | null;
  fetchFailed?: boolean;
  onResolved: (approved: boolean, threshold: number) => void;
}) {
  const [busy, setBusy] = useState<"approve" | "reject" | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function resolve(approved: boolean) {
    if (!proposal) return;
    setBusy(approved ? "approve" : "reject");
    setError(null);
    try {
      const result = await resolveProposal(proposal.proposal_id, approved);
      onResolved(approved, result.base_threshold);
    } catch {
      setError("Could not reach the policy service. Try again.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div aria-busy={busy !== null}>
      <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-ink-500">
        <Scales size={15} weight="light" aria-hidden />
        Calibrator · policy proposal
      </div>
      {fetchFailed ? (
        <p className="mt-3 text-sm text-alarm-500">
          Could not check for pending proposals. Run again or refresh.
        </p>
      ) : proposal === null ? (
        <p className="mt-3 text-sm text-ink-500">
          No proposal pending. The Calibrator raises one when the budget crosses
          the 35% floor or oversight is declared degraded.
        </p>
      ) : (
        <div className="mt-3">
          <p className="text-sm leading-relaxed text-ink-100">
            Raise the escalation threshold{" "}
            <span className="font-data text-ember-500">
              {proposal.current_threshold.toFixed(2)} →{" "}
              {proposal.proposed_threshold.toFixed(2)}
            </span>
          </p>
          <p className="mt-1 text-[12px] leading-relaxed text-ink-400">
            {proposal.rationale}
          </p>
          {error && <p className="mt-2 text-[12px] text-alarm-500">{error}</p>}
          <div className="mt-3 flex gap-2">
            <button
              onClick={() => resolve(true)}
              disabled={busy !== null}
              className={`flex items-center gap-1.5 rounded-sm bg-ember-600 px-4 py-2 text-sm text-ink-950 ${BUTTON_TRANSITION} hover:bg-ember-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ember-500 active:scale-[0.97] disabled:pointer-events-none disabled:opacity-50`}
            >
              <Check size={15} weight="bold" aria-hidden />
              {busy === "approve" ? "Applying…" : "Approve recalibration"}
            </button>
            <button
              onClick={() => resolve(false)}
              disabled={busy !== null}
              className={`flex items-center gap-1.5 rounded-sm border border-ink-100/15 px-4 py-2 text-sm text-ink-300 ${BUTTON_TRANSITION} hover:border-ink-100/30 hover:text-ink-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink-400 active:scale-[0.97] disabled:pointer-events-none disabled:opacity-50`}
            >
              <X size={15} weight="light" aria-hidden />
              {busy === "reject" ? "Rejecting…" : "Reject"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
