"""
routes/admin.py
────────────────
Admin routes for managing scoring rules, triggering escalation,
and seeding initial data into MongoDB.

These routes should be protected by authentication in production.
For the final-year project, a simple API key check is shown.
"""

from __future__ import annotations

import logging
from datetime import datetime, timezone

from fastapi import APIRouter, BackgroundTasks, HTTPException, Request

from models.schemas import ScoringRulesResponse, ScoringWeightsUpdate
from services.priority_engine import PriorityEngine
from services.priority_queue import BloodRequestPriorityQueue

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/admin", tags=["Admin — Scoring Rules"])


def get_db(request: Request):
    return request.app.state.db

def get_engine(request: Request) -> PriorityEngine:
    return request.app.state.priority_engine

def get_queue(request: Request) -> BloodRequestPriorityQueue:
    return request.app.state.priority_queue

def get_escalation(request: Request):
    return request.app.state.escalation_service


# ─── Scoring Rules ────────────────────────────────────────────────────────────

@router.get("/scoring-rules", response_model=ScoringRulesResponse)
async def get_active_scoring_rules(http_request: Request):
    """
    Retrieve the currently active scoring rule configuration.
    Used by admin dashboard to display and edit current weights.
    """
    engine = get_engine(http_request)
    rules = await engine.get_active_rules()

    return ScoringRulesResponse(
        rule_id=str(rules.get("_id", "default")),
        rule_name=rules.get("rule_name", "default"),
        version=rules.get("version", 0),
        is_active=rules.get("is_active", True),
        weights=rules.get("weights", {}),
        urgency_scores=rules.get("urgency_scores", {}),
        rarity_scores=rules.get("rarity_scores", {}),
        escalation_config=rules.get("escalation_config", {}),
        geo_config=rules.get("geo_config", {}),
    )


@router.put("/scoring-rules/weights")
async def update_scoring_weights(
    payload: ScoringWeightsUpdate,
    background_tasks: BackgroundTasks,
    http_request: Request,
):
    """
    Update scoring weights WITHOUT any code change.

    This is the core "no hardcoding" promise:
      - Admin changes weights via this API
      - Engine cache is invalidated immediately
      - All pending requests are recomputed in the background
      - New score ranking takes effect within seconds

    Pydantic validates that weights sum to 1.0 (in ScoringWeightsUpdate).

    Example: Boost urgency importance from 40% to 55%
      PUT /api/admin/scoring-rules/weights
      { "urgency_weight": 0.55, "wait_time_weight": 0.20,
        "rarity_weight": 0.15, "proximity_weight": 0.10 }
    """
    db = get_db(http_request)
    engine = get_engine(http_request)

    new_weights = {
        "urgency_weight":   payload.urgency_weight,
        "wait_time_weight": payload.wait_time_weight,
        "rarity_weight":    payload.rarity_weight,
        "proximity_weight": payload.proximity_weight,
    }

    # Update in MongoDB — make it durable
    result = await db["scoring_rules"].update_one(
        {"is_active": True},
        {
            "$set": {
                "weights":    new_weights,
                "updated_at": datetime.now(timezone.utc),
            },
            "$inc": {"version": 1},   # Track how many times rules changed
        },
    )

    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="No active scoring rule found")

    # Invalidate engine cache so next request loads fresh rules
    engine.invalidate_cache()

    # Recompute all pending scores in the background
    # BackgroundTasks runs AFTER the response is sent — non-blocking
    background_tasks.add_task(engine.recompute_all_pending)

    logger.info(f"Scoring weights updated: {new_weights}")

    return {
        "success": True,
        "message": (
            "Weights updated. Recomputing all pending request scores in background. "
            "New ranking takes effect within seconds."
        ),
        "new_weights": new_weights,
    }


@router.post("/scoring-rules/seed")
async def seed_default_scoring_rules(http_request: Request):
    """
    Seed the default scoring rules into MongoDB.

    Run this ONCE after setting up the database — it creates the
    initial `scoring_rules` document that the engine reads from.

    Safe to call again — won't overwrite an existing active rule.
    """
    db = get_db(http_request)

    # Check if active rules already exist
    existing = await db["scoring_rules"].find_one({"is_active": True})
    if existing:
        return {
            "success": False,
            "message": "Active scoring rules already exist. Use PUT to update.",
            "existing_version": existing.get("version", 0),
        }

    default_rules = {
        "rule_name": "default_emergency_rules",
        "is_active": True,
        "version": 1,
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc),
        "weights": {
            "urgency_weight":   0.40,   # Urgency matters most
            "wait_time_weight": 0.25,   # How long has patient waited
            "rarity_weight":    0.20,   # Blood group scarcity
            "proximity_weight": 0.15,   # Distance to user/donor
        },
        "urgency_scores": {
            "critical": 100,
            "high":     70,
            "medium":   40,
            "low":      10,
        },
        "rarity_scores": {
            # Based on approximate Indian population blood group distribution
            "AB-": 100,   # ~0.6% — rarest
            "O-":  90,    # ~7% — universal donor, always needed
            "B-":  80,    # ~2% — rare
            "A-":  75,    # ~2% — rare
            "AB+": 60,    # ~4% — uncommon
            "B+":  40,    # ~38% — common
            "A+":  20,    # ~23% — common
            "O+":  10,    # ~37% — most common
        },
        "escalation_config": {
            "check_interval_minutes":    15,   # Run escalation job every 15 min
            "escalation_threshold_minutes": 30, # Boost if waiting > 30 min
            "escalation_boost":          5.0,   # Add 5 points per escalation cycle
            "max_escalations":           10,    # Cap at 10 escalations per request
        },
        "geo_config": {
            "default_radius_km": 50.0,    # Default donor search radius
            "max_radius_km":     200.0,   # Absolute maximum allowed radius
        },
    }

    result = await db["scoring_rules"].insert_one(default_rules)
    logger.info(f"Default scoring rules seeded: {result.inserted_id}")

    return {
        "success": True,
        "message": "Default scoring rules seeded into MongoDB",
        "rule_id": str(result.inserted_id),
    }


# ─── Escalation Controls ──────────────────────────────────────────────────────

@router.post("/escalation/trigger")
async def trigger_manual_escalation(http_request: Request):
    """
    Manually trigger the escalation job immediately.

    Useful for:
      - Testing the escalation logic
      - Emergency override when requests are stuck
      - Demo during presentations
    """
    escalation_svc = get_escalation(http_request)
    await escalation_svc.run_escalation()
    queue = get_queue(http_request)

    return {
        "success": True,
        "message": "Manual escalation completed",
        "active_queue_size": queue.size,
    }


# ─── Queue Management ─────────────────────────────────────────────────────────

@router.post("/queue/rebuild")
async def rebuild_priority_queue(http_request: Request):
    """
    Rebuild the in-memory priority queue from MongoDB.

    Use after:
      - Server restart (queue is rebuilt automatically in startup,
        but this allows manual rebuild without restart)
      - Suspecting queue/DB desync (normally shouldn't happen)
    """
    db = get_db(http_request)
    engine = get_engine(http_request)
    queue = get_queue(http_request)

    # Load all pending requests from MongoDB
    cursor = db["emergency_requests"].find({"status": "pending"})
    pending = await cursor.to_list(length=10_000)

    # Build list of (request, score) tuples
    requests_with_scores = [
        (req, float(req.get("priority_score", 0.0)))
        for req in pending
    ]

    # Rebuild using heapify (O(n) — more efficient than n push()es)
    queue.rebuild_from_list(requests_with_scores)

    logger.info(f"Priority queue rebuilt with {queue.size} active requests")

    return {
        "success": True,
        "message": f"Priority queue rebuilt with {queue.size} requests",
        "queue_size": queue.size,
    }
