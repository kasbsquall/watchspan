"""Watchspan API: the control-room backend.

Runs the governed fleet simulation, exposes the live attention picture, the
approval queue, drift declarations, policy proposals and the Article 14
dossier. Deployed on Cloud Run (scale to zero) in step 8.
"""

from __future__ import annotations

import time

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from attention.signals import ApprovalRequest, Decision
from evidence import article14_dossier
from fleet import simulator
from watchspan.orchestrator import Orchestrator

app = FastAPI(title="Watchspan", version="0.1.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # tightened before deployment
    allow_methods=["*"],
    allow_headers=["*"],
)

orchestrator = Orchestrator()


class SimulateBody(BaseModel):
    minutes: float = 30.0
    seed: int = 7
    inject_attack: bool = True
    reset: bool = True


class RequestBody(BaseModel):
    agent_id: str
    action: str
    risk_score: float
    complexity: float
    batch_id: str | None = None
    description: str = ""


class DecisionBody(BaseModel):
    request_id: str
    reviewer_id: str
    approved: bool
    decision_time_s: float
    review_depth: int
    complexity: float


class ProposalResolution(BaseModel):
    approved: bool


@app.get("/health")
def health() -> dict:
    return {"status": "ok"}


@app.post("/simulate")
def simulate(body: SimulateBody) -> dict:
    global orchestrator
    if body.reset:
        orchestrator = Orchestrator()
    result = simulator.run(
        orchestrator,
        minutes=body.minutes,
        seed=body.seed,
        inject_attack=body.inject_attack,
    )
    return {
        "routed_total": result.routed_total,
        "escalated": result.escalated,
        "auto_executed": result.auto_executed,
        "paused_by_sentinel": result.paused_by_sentinel,
        "drift_declared_at": result.drift_declared_at,
        "dangerous_stamped": result.dangerous_stamped,
        "dangerous_caught": result.dangerous_caught,
        "pending_proposal": (
            orchestrator.pending_proposal().proposal_id
            if orchestrator.pending_proposal()
            else None
        ),
        "timeline": result.timeline,
    }


@app.post("/requests")
def submit_request(body: RequestBody) -> dict:
    request = ApprovalRequest(
        request_id=f"live-{int(time.time() * 1000)}",
        agent_id=body.agent_id,
        action=body.action,
        risk_score=body.risk_score,
        complexity=body.complexity,
        batch_id=body.batch_id,
        description=body.description,
        created_at=time.time(),
    )
    result = orchestrator.route_request(request)
    return {
        "request_id": request.request_id,
        "route": result.route,
        "effective_threshold": result.effective_threshold,
        "team_fraction": result.team_fraction,
        "alerts": [
            {"pattern": a.pattern, "detail": a.detail} for a in result.alerts
        ],
    }


@app.post("/decisions")
def submit_decision(body: DecisionBody) -> dict:
    decision = Decision(
        request_id=body.request_id,
        reviewer_id=body.reviewer_id,
        approved=body.approved,
        decision_time_s=body.decision_time_s,
        review_depth=body.review_depth,
        decided_at=time.time(),
        complexity=body.complexity,
    )
    return orchestrator.record_decision(decision)


@app.get("/attention")
def attention() -> dict:
    return orchestrator.meter.snapshot(now=time.time())


@app.get("/drift")
def drift_declarations() -> dict:
    return {"declarations": orchestrator.drift_declarations}


@app.get("/proposal")
def pending_proposal() -> dict:
    proposal = orchestrator.pending_proposal()
    if proposal is None:
        return {"pending": None}
    return {
        "pending": {
            "proposal_id": proposal.proposal_id,
            "rationale": proposal.rationale,
            "current_threshold": proposal.current.base_threshold,
            "proposed_threshold": proposal.proposed.base_threshold,
            "created_at": proposal.created_at,
        }
    }


@app.post("/proposal/{proposal_id}/resolve")
def resolve_proposal(proposal_id: str, body: ProposalResolution) -> dict:
    try:
        return orchestrator.resolve_proposal(proposal_id, body.approved)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


@app.get("/audit")
def audit(limit: int = 200) -> dict:
    return {"events": orchestrator.audit_log[-limit:]}


@app.get("/evidence/article14")
def article14() -> dict:
    return article14_dossier.build(orchestrator, generated_at=time.time())
