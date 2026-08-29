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

/* A busy service is not a broken one.

   Every caller here threw the same generic error, so hitting the rate limit
   rendered "Could not connect to the Watchspan service. Check that the backend
   is running." A reviewer pressed Run seven times in a minute and was told the
   service was down by a service that had answered every request. */
export class RateLimited extends Error {
  constructor(readonly detail: string) {
    super(detail);
    this.name = "RateLimited";
  }
}

async function guard(res: Response, what: string): Promise<Response> {
  if (res.status === 429) {
    const body = await res.json().catch(() => ({}));
    throw new RateLimited(
      typeof body.detail === "string"
        ? body.detail
        : "Too many requests just now. Wait a moment and try again.",
    );
  }
  if (!res.ok) throw new Error(`${what} failed: ${res.status}`);
  return res;
}

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
  await guard(res, "simulate");
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
  await guard(res, "live fleet");
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

/* The reviewer console.

   Everything the seeded run shows is Watchspan measuring a reviewer this
   repository wrote. These three calls are Watchspan measuring whoever is
   holding the mouse: the server issues the identity, starts the clock when it
   hands over a request, and counts the detail sections actually opened. The
   browser sends a verdict and nothing else. */

export interface ReviewCard {
  request_id: string;
  action: string;
  agent_id: string;
  description: string;
  risk_routed_on: number;
  risk_declared_by_agent: number;
  assessment_basis: string;
  recognised: boolean;
  complexity: number;
  review_depth_so_far: number;
}

export interface ReviewStart {
  reviewer_id: string;
  queue_length: number;
  /* One card at a time. The browser never holds the queue, so it cannot start a
     card's clock early or read ahead to the dangerous one. */
  current: ReviewCard | null;
  measured_here: string;
}

export interface ReviewOutcome {
  next: ReviewCard | null;
  remaining: number;
  decision_time_s: number;
  review_depth: number;
  approved: boolean;
  risk_routed_on: number;
  meter: Record<string, unknown> | null;
  drift_degraded: boolean | null;
  decisions_recorded: number;
  approved_without_reading: number;
  median_decision_time_s: number | null;
}

export async function startReview(signal?: AbortSignal): Promise<ReviewStart> {
  const res = await fetch(`${API}/reviewer/start`, {
    method: "POST",
    headers: headers(true),
    // An explicit empty body, so the request always carries a Content-Length.
    // Google's front end answers a bodyless POST with its own 411 page, which
    // reads as the app being broken rather than as the caller omitting a header.
    body: "{}",
    signal,
  });
  await guard(res, "review start");
  return res.json();
}

export async function openSection(
  requestId: string,
  section: string,
): Promise<number> {
  const res = await fetch(`${API}/reviewer/open`, {
    method: "POST",
    headers: headers(true),
    body: JSON.stringify({ request_id: requestId, section }),
  });
  if (!res.ok) throw new Error(`open failed: ${res.status}`);
  return (await res.json()).review_depth;
}

export async function decide(
  requestId: string,
  approved: boolean,
): Promise<ReviewOutcome> {
  const res = await fetch(`${API}/reviewer/decide`, {
    method: "POST",
    headers: headers(true),
    body: JSON.stringify({ request_id: requestId, approved }),
  });
  await guard(res, "decide");
  return res.json();
}
