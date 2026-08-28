const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

/* The session this browser owns.

   The API used to keep one orchestrator for the whole process, so a second
   visitor pressing "Run the fleet" wiped the first visitor's pending proposal
   and their approve click came back 404. Judges evaluate in parallel, and that
   is the one control the product exists to protect.

   Held in sessionStorage rather than a cookie or localStorage: it should die
   with the tab, and it should not be shared between two tabs a judge opens to
   compare runs. Wrapped because sessionStorage throws in private modes. */
const SESSION_KEY = "watchspan.session";

function sessionId(): string {
  try {
    const existing = sessionStorage.getItem(SESSION_KEY);
    if (existing) return existing;
    const made = crypto.randomUUID().replace(/-/g, "");
    sessionStorage.setItem(SESSION_KEY, made);
    return made;
  } catch {
    // No storage available: the API mints one per request, which degrades to
    // the old behaviour for this visitor alone rather than for everyone.
    return "";
  }
}

function headers(json = false): HeadersInit {
  const h: Record<string, string> = {};
  if (json) h["Content-Type"] = "application/json";
  const sid = sessionId();
  if (sid) h["X-Watchspan-Session"] = sid;
  return h;
}

export interface TimelineEvent {
  at: number;
  request_id: string;
  agent_id: string;
  action: string;
  risk_score: number;
  route: "escalate" | "auto_execute" | "paused_sentinel";
  team_fraction: number;
  effective_threshold: number;
}

export interface SimulationResponse {
  session_id: string;
  routed_total: number;
  escalated: number;
  auto_executed: number;
  paused_by_sentinel: number;
  drift_declared_at: number | null;
  dangerous_stamped: string[];
  dangerous_caught: string[];
  pending_proposal: string | null;
  timeline: TimelineEvent[];
}

export interface PendingProposal {
  proposal_id: string;
  rationale: string;
  current_threshold: number;
  proposed_threshold: number;
  created_at: number;
}

export async function runSimulation(
  injectAttack = true,
  signal?: AbortSignal,
): Promise<SimulationResponse> {
  const res = await fetch(`${API}/simulate`, {
    method: "POST",
    headers: headers(true),
    body: JSON.stringify({ minutes: 30, inject_attack: injectAttack, reset: true }),
    signal,
  });
  if (!res.ok) throw new Error(`simulate failed: ${res.status}`);
  return res.json();
}

export async function getProposal(
  signal?: AbortSignal,
): Promise<PendingProposal | null> {
  const res = await fetch(`${API}/proposal`, { headers: headers(), signal });
  if (!res.ok) throw new Error(`proposal failed: ${res.status}`);
  const data = await res.json();
  return data.pending;
}

export async function resolveProposal(
  proposalId: string,
  approved: boolean,
): Promise<{ active_version: number; base_threshold: number }> {
  const res = await fetch(`${API}/proposal/${proposalId}/resolve`, {
    method: "POST",
    headers: headers(true),
    body: JSON.stringify({ approved }),
  });
  if (!res.ok) throw new Error(`resolve failed: ${res.status}`);
  return res.json();
}

export async function fetchDossier(): Promise<Record<string, unknown>> {
  const res = await fetch(`${API}/evidence/article14`, { headers: headers() });
  if (!res.ok) throw new Error(`dossier failed: ${res.status}`);
  return res.json();
}
