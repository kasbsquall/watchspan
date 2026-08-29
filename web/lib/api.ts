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

export interface LiveRouted {
  action: string;
  agent_id: string;
  risk_declared_by_agent: number;
  risk_assessed_by_watchspan: number | null;
  routed_on: number | null;
  agent_understated: boolean;
  route: "escalate" | "auto_execute" | "paused_sentinel";
  effective_threshold: number;
  team_fraction: number;
  alerts: string[];
  description: string;
}

export interface LiveFleetResponse {
  tasks_given: number;
  requests_the_fleet_chose_to_make: number;
  routed: LiveRouted[];
}

/* The real ADK fleet, not the seeded generator. Each task is a Gemini turn, so
   this takes tens of seconds and the caller must show that it is working. */
export async function runLiveFleet(
  tasks = 3,
  signal?: AbortSignal,
): Promise<LiveFleetResponse> {
  const res = await fetch(`${API}/fleet/live`, {
    method: "POST",
    headers: headers(true),
    body: JSON.stringify({ tasks }),
    signal,
  });
  if (!res.ok) throw new Error(`live fleet failed: ${res.status}`);
  return res.json();
}

/* The GEAP status endpoint, so the control room can show the footprint instead
   of a README asserting it. Typed loosely on purpose: the panel renders what
   the endpoint reports, and a probe that grows a field should not need a
   frontend change to be visible. */
export interface GeapProbe {
  checked?: boolean;
  ok?: boolean;
  how?: "round_trip" | "config" | "not_attempted";
  [field: string]: unknown;
}

export interface GeapSummary {
  verified_by_live_call: number;
  of_live_calls: number;
  config_checks_ok: number;
  note: string;
}

export type GeapStatus = Record<string, GeapProbe | undefined> & {
  _summary?: GeapSummary;
};

export async function fetchGeapStatus(signal?: AbortSignal): Promise<GeapStatus> {
  const res = await fetch(`${API}/geap/status`, { headers: headers(), signal });
  if (!res.ok) throw new Error(`geap status failed: ${res.status}`);
  return res.json();
}
