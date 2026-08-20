const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

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
): Promise<SimulationResponse> {
  const res = await fetch(`${API}/simulate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ minutes: 30, inject_attack: injectAttack, reset: true }),
  });
  if (!res.ok) throw new Error(`simulate failed: ${res.status}`);
  return res.json();
}

export async function getProposal(): Promise<PendingProposal | null> {
  const res = await fetch(`${API}/proposal`);
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
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ approved }),
  });
  if (!res.ok) throw new Error(`resolve failed: ${res.status}`);
  return res.json();
}

export async function fetchDossier(): Promise<Record<string, unknown>> {
  const res = await fetch(`${API}/evidence/article14`);
  if (!res.ok) throw new Error(`dossier failed: ${res.status}`);
  return res.json();
}
