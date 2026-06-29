"""
routes/emergency.py
────────────────────
FastAPI routes for emergency blood request management.

API contract (matches design document):
  POST   /api/emergency/request           — Submit a new emergency request
  GET    /api/emergency/nearby            — Get nearby requests (donor view)
  GET    /api/emergency/nearby/distance   — Same, but includes distance_km
  GET    /api/emergency/queue             — Hospital processing queue
  GET    /api/emergency/zone-snapshot     — Map heatmap data
  PUT    /api/emergency/{id}/status       — Update request status
  GET    /api/emergency/request/{id}      — Single request details

All routes use FastAPI dependency injection to receive:
  - db: MongoDB database handle
  - priority_queue: in-memory heap
  - priority_engine: scoring engine
These are stored in app.state during startup (see main.py lifespan).
"""

from __future__ import annotations

import logging
from datetime import datetime, timezone
from typing import Optional

from bson import ObjectId
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Request

from models.schemas import (
    EmergencyRequestCreate,
    EmergencyRequestResponse,
    NearbyRequestsQuery,
    RequestStatus,
)
from services.geo_service import (
    get_nearby_emergency_requests,
    get_requests_with_distance,
    get_urgency_zone_snapshot,
)
from services.priority_engine import PriorityEngine
from services.priority_queue import BloodRequestPriorityQueue

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/emergency", tags=["Emergency Requests"])


# ─── Dependency helpers ────────────────────────────────────────────────────────

def get_db(request: Request):
    """Inject MongoDB database from app state."""
    return request.app.state.db


def get_queue(request: Request) -> BloodRequestPriorityQueue:
    """Inject in-memory priority queue from app state."""
    return request.app.state.priority_queue


def get_engine(request: Request) -> PriorityEngine:
    """Inject priority engine from app state."""
    return request.app.state.priority_engine


# ─── Routes ───────────────────────────────────────────────────────────────────

@router.post("/request", status_code=201, response_model=EmergencyRequestResponse)
async def submit_emergency_request(
    payload: EmergencyRequestCreate,
    background_tasks: BackgroundTasks,
    http_request: Request,
):
    """
    Submit a new emergency blood request.

    API Flow:
      1. Validate payload (Pydantic handles this automatically)
      2. Build MongoDB document with GeoJSON location
      3. Insert into `emergency_requests` collection (get _id)
      4. Compute initial priority score via PriorityEngine
      5. Update document with computed score (atomic update)
      6. Push to in-memory priority queue (O(log n))
      7. Return request ID + priority score to caller

    Why compute score AFTER insert?
    We need the MongoDB _id to exist in the document before pushing
    to the queue (the queue uses _id as the unique key).
    The score update is a separate, fast $set operation.
    """
    db = get_db(http_request)
    queue: BloodRequestPriorityQueue = get_queue(http_request)
    engine: PriorityEngine = get_engine(http_request)

    # ── Build document ────────────────────────────────────────────
    now = datetime.now(timezone.utc)
    request_doc = {
        "patient_name":    payload.patient_name,
        "blood_group":     payload.blood_group.value,
        "units_required":  payload.units_required,
        "urgency_level":   payload.urgency_level.value,
        "hospital_id":     payload.hospital_id,
        # GeoJSON Point — [longitude, latitude] order (MongoDB standard)
        "location": {
            "type": "Point",
            "coordinates": [payload.longitude, payload.latitude],
        },
        "status":           RequestStatus.PENDING.value,
        "priority_score":   0.0,          # Computed next
        "escalation_count": 0,
        "created_at":       now,
        "updated_at":       now,
        "notes":            payload.notes,
        "node_request_id":  payload.node_request_id,
    }

    # ── Insert into MongoDB ───────────────────────────────────────
    try:
        result = await db["emergency_requests"].insert_one(request_doc)
        request_doc["_id"] = result.inserted_id
    except Exception as exc:
        logger.error(f"Failed to insert emergency request: {exc}")
        raise HTTPException(status_code=500, detail="Failed to save request")

    # ── Compute priority score ────────────────────────────────────
    user_coords = [payload.longitude, payload.latitude]
    score = await engine.compute_priority(request_doc, user_coords)

    # ── Update score in MongoDB ───────────────────────────────────
    await db["emergency_requests"].update_one(
        {"_id": result.inserted_id},
        {"$set": {"priority_score": score}},
    )
    request_doc["priority_score"] = score

    # ── Push to in-memory priority queue ──────────────────────────
    queue.push(request_doc, score)

    logger.info(
        f"Emergency request submitted | "
        f"id={str(result.inserted_id)[:8]}… | "
        f"blood={payload.blood_group.value} | "
        f"urgency={payload.urgency_level.value} | "
        f"score={score:.2f}"
    )

    return EmergencyRequestResponse(
        request_id=str(result.inserted_id),
        priority_score=score,
        urgency_level=payload.urgency_level,
        blood_group=payload.blood_group,
        status=RequestStatus.PENDING,
        node_request_id=payload.node_request_id,
        message=(
            f"Emergency request submitted. "
            f"Priority score: {score:.1f}/100. "
            f"You are in the queue."
        ),
    )


@router.get("/nearby")
async def get_nearby_requests(
    longitude: float,
    latitude: float,
    radius_km: float = 50.0,
    blood_group: Optional[str] = None,
    urgency: Optional[str] = None,
    limit: int = 20,
    http_request: Request = None,
):
    """
    Get pending emergency requests near the user's location.

    Uses MongoDB $near with 2dsphere index for O(log n) geospatial filtering.
    Results are sorted by priority_score DESC — highest urgency first.

    Designed for:
      - Donor app: "Show me blood requests near me"
      - Hospital: "Show critical requests in my catchment area"

    Query parameters:
      longitude  — user's GPS longitude
      latitude   — user's GPS latitude
      radius_km  — search radius (default 50km, configurable)
      blood_group— filter by blood type (optional)
      urgency    — minimum urgency level: "high" shows high + critical
      limit      — max results (default 20)
    """
    db = get_db(http_request)

    # Validate radius
    if radius_km <= 0 or radius_km > 500:
        raise HTTPException(status_code=400, detail="radius_km must be between 1 and 500")

    requests = await get_nearby_emergency_requests(
        db=db,
        user_longitude=longitude,
        user_latitude=latitude,
        radius_km=radius_km,
        blood_group=blood_group,
        urgency_filter=urgency,
        limit=limit,
    )

    return {
        "success":   True,
        "count":     len(requests),
        "radius_km": radius_km,
        "center":    {"longitude": longitude, "latitude": latitude},
        "requests":  requests,
    }


@router.get("/nearby/distance")
async def get_nearby_requests_with_distance(
    longitude: float,
    latitude: float,
    radius_km: float = 50.0,
    limit: int = 20,
    http_request: Request = None,
):
    """
    Same as /nearby but each result includes `distance_km` field.

    Example response item:
      { "patient_name": "...", "blood_group": "O-",
        "priority_score": 87.5, "distance_km": 5.2 }

    Uses $geoNear aggregation pipeline (heavier than $near but adds distance).
    Use this endpoint when the frontend needs to show "5.2 km away" labels.
    """
    db = get_db(http_request)
    requests = await get_requests_with_distance(
        db=db,
        user_longitude=longitude,
        user_latitude=latitude,
        radius_km=radius_km,
        limit=limit,
    )

    return {
        "success":  True,
        "count":    len(requests),
        "requests": requests,
    }


@router.get("/zone-snapshot")
async def get_zone_snapshot(
    longitude: float,
    latitude: float,
    http_request: Request = None,
):
    """
    Return request counts in concentric urgency zones for map heatmap.

    Response:
      {
        "critical_zone_10km": { "count": 2, "top_requests": [...] },
        "high_zone_30km":     { "count": 7, "top_requests": [...] },
        "all_zone":           { "count": 15, "top_requests": [...] }
      }
    """
    db = get_db(http_request)
    engine = get_engine(http_request)
    rules = await engine.get_active_rules()

    snapshot = await get_urgency_zone_snapshot(
        db=db,
        user_longitude=longitude,
        user_latitude=latitude,
        rules=rules,
    )

    return {"success": True, "snapshot": snapshot}


@router.get("/queue")
async def get_processing_queue(
    limit: int = 10,
    http_request: Request = None,
):
    """
    Get the top-N highest priority requests for hospital dispatch.

    Reads from BOTH sources for consistency:
      - in-memory heap: fast O(1) peek at current top request
      - MongoDB: authoritative count and full sorted list

    Used by hospital staff to know which requests to handle first.
    """
    db = get_db(http_request)
    queue: BloodRequestPriorityQueue = get_queue(http_request)

    # Peek at top of heap — O(1)
    top_request = queue.peek()
    if top_request and "_id" in top_request:
        top_request = {**top_request, "_id": str(top_request["_id"])}

    # Get top-N from MongoDB (authoritative, survives restarts)
    cursor = (
        db["emergency_requests"]
        .find({"status": "pending"})
        .sort("priority_score", -1)
        .limit(limit)
    )
    top_n = await cursor.to_list(length=limit)
    for doc in top_n:
        doc["_id"] = str(doc["_id"])

    # Count total pending
    pending_count = await db["emergency_requests"].count_documents({"status": "pending"})

    return {
        "success":           True,
        "active_queue_size": queue.size,
        "pending_db_count":  pending_count,
        "top_request":       top_request,
        "processing_order":  top_n,
    }


@router.put("/request/{request_id}/status")
async def update_request_status(
    request_id: str,
    status: str,
    http_request: Request,
):
    """
    Update the status of a blood request (fulfilled, cancelled, etc.)

    When fulfilled/cancelled:
      - Update MongoDB document
      - Remove from in-memory priority queue (lazy deletion, O(1))

    Valid statuses: "pending", "fulfilled", "cancelled"
    """
    if status not in ("pending", "fulfilled", "cancelled"):
        raise HTTPException(
            status_code=400,
            detail="status must be one of: pending, fulfilled, cancelled",
        )

    db = get_db(http_request)
    queue: BloodRequestPriorityQueue = get_queue(http_request)

    try:
        obj_id = ObjectId(request_id)
        query = {"$or": [{"_id": obj_id}, {"node_request_id": request_id}]}
    except Exception:
        query = {"node_request_id": request_id}

    result = await db["emergency_requests"].update_one(
        query,
        {"$set": {"status": status, "updated_at": datetime.now(timezone.utc)}},
    )

    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Request not found")

    # Fetch the document to get the true python _id (in case we used node_request_id)
    updated_doc = await db["emergency_requests"].find_one(query)
    true_python_id = str(updated_doc["_id"]) if updated_doc else request_id

    # Remove from heap if no longer pending
    if status in ("fulfilled", "cancelled"):
        removed = queue.remove(true_python_id)
        logger.info(
            f"Request {true_python_id[:8]}… → {status} | "
            f"removed from queue: {removed}"
        )

    return {
        "success": True,
        "request_id": true_python_id,
        "new_status": status,
        "queue_size": queue.size,
    }


@router.get("/request/{request_id}")
async def get_request_detail(
    request_id: str,
    http_request: Request,
):
    """Fetch full details of a single emergency request by ID."""
    db = get_db(http_request)

    try:
        obj_id = ObjectId(request_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid request_id format")

    doc = await db["emergency_requests"].find_one({"_id": obj_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Request not found")

    doc["_id"] = str(doc["_id"])
    return {"success": True, "request": doc}
