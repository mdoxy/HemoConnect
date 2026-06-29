"""
models/schemas.py
─────────────────
Pydantic v2 models for request/response validation.

These are the "data contracts" for the FastAPI endpoints.
Pydantic validates incoming JSON automatically — if a field is wrong
type or missing, FastAPI returns a 422 Unprocessable Entity with details.

Two categories:
  1. Request bodies  (what the client sends IN)
  2. Response models (what the server sends OUT)
"""

from __future__ import annotations

from datetime import datetime
from enum import Enum
from typing import Optional

from pydantic import BaseModel, Field, field_validator, model_validator


# ─── Enums ────────────────────────────────────────────────────────────────────

class UrgencyLevel(str, Enum):
    """
    Clinical urgency levels — maps to different scoring weights.
    String enum so FastAPI serialises them as plain strings in JSON.
    """
    CRITICAL = "critical"   # Patient is in surgery / ICU / active haemorrhage
    HIGH     = "high"       # Needed within 6–24 hours
    MEDIUM   = "medium"     # Needed within 24–72 hours
    LOW      = "low"        # Scheduled transfusion / elective procedure


class BloodGroup(str, Enum):
    """Standard ABO + Rh blood group system."""
    O_NEG  = "O-"
    O_POS  = "O+"
    A_NEG  = "A-"
    A_POS  = "A+"
    B_NEG  = "B-"
    B_POS  = "B+"
    AB_NEG = "AB-"
    AB_POS = "AB+"


class RequestStatus(str, Enum):
    PENDING    = "pending"
    FULFILLED  = "fulfilled"
    CANCELLED  = "cancelled"
    ESCALATED  = "escalated"   # Purely informational — still in queue


# ─── Geolocation ──────────────────────────────────────────────────────────────

class GeoLocation(BaseModel):
    """
    GeoJSON Point — MongoDB's required format for 2dsphere indexing.

    IMPORTANT: GeoJSON stores [longitude, latitude], NOT [lat, lng].
    This is the opposite of what humans naturally say.
    Always validate: coordinates[0] = lng (-180 to 180),
                     coordinates[1] = lat (-90 to 90)
    """
    type: str = Field(default="Point", pattern="^Point$")
    coordinates: list[float] = Field(
        ...,
        min_length=2,
        max_length=2,
        description="[longitude, latitude] — GeoJSON order",
    )

    @field_validator("coordinates")
    @classmethod
    def validate_coordinates(cls, coords: list[float]) -> list[float]:
        lng, lat = coords
        if not (-180 <= lng <= 180):
            raise ValueError(f"Longitude {lng} out of range [-180, 180]")
        if not (-90 <= lat <= 90):
            raise ValueError(f"Latitude {lat} out of range [-90, 90]")
        return coords


# ─── Request Bodies (Client → Server) ─────────────────────────────────────────

class EmergencyRequestCreate(BaseModel):
    """
    Payload for POST /api/emergency/request

    The client (frontend or mobile app) sends this when a patient/doctor
    submits an emergency blood request.
    """
    patient_name:   str         = Field(..., min_length=2, max_length=100)
    blood_group:    BloodGroup
    units_required: int         = Field(..., ge=1, le=20)
    urgency_level:  UrgencyLevel
    hospital_id:    str         = Field(..., description="MongoDB ObjectId of the hospital")
    longitude:      float       = Field(..., description="Request origin longitude")
    latitude:       float       = Field(..., description="Request origin latitude")
    notes:          Optional[str] = Field(None, max_length=500)
    node_request_id: Optional[str] = Field(None, description="MongoDB ObjectId from Node backend")

    @model_validator(mode="after")
    def build_geo_location(self) -> "EmergencyRequestCreate":
        """Validate coordinates inline."""
        if not (-180 <= self.longitude <= 180):
            raise ValueError("Invalid longitude")
        if not (-90 <= self.latitude <= 90):
            raise ValueError("Invalid latitude")
        return self


class NearbyRequestsQuery(BaseModel):
    """
    Query parameters for GET /api/emergency/nearby

    Donors use this to discover requests near their current GPS location.
    """
    longitude:   float
    latitude:    float
    radius_km:   float = Field(default=50.0, ge=1.0, le=500.0)
    blood_group: Optional[BloodGroup] = None
    urgency:     Optional[UrgencyLevel] = None
    limit:       int   = Field(default=20, ge=1, le=100)


class ScoringWeightsUpdate(BaseModel):
    """
    Payload for PUT /api/admin/scoring-rules/{rule_id}

    Weights must sum to 1.0 (validated below).
    """
    urgency_weight:   float = Field(..., ge=0.0, le=1.0)
    wait_time_weight: float = Field(..., ge=0.0, le=1.0)
    rarity_weight:    float = Field(..., ge=0.0, le=1.0)
    proximity_weight: float = Field(..., ge=0.0, le=1.0)

    @model_validator(mode="after")
    def weights_sum_to_one(self) -> "ScoringWeightsUpdate":
        total = (
            self.urgency_weight
            + self.wait_time_weight
            + self.rarity_weight
            + self.proximity_weight
        )
        if abs(total - 1.0) > 0.001:
            raise ValueError(
                f"Weights must sum to 1.0, got {total:.4f}. "
                "Adjust urgency/wait_time/rarity/proximity weights."
            )
        return self


# ─── Response Models (Server → Client) ────────────────────────────────────────

class EmergencyRequestResponse(BaseModel):
    """
    Returned after a successful POST /api/emergency/request.
    Does NOT include sensitive fields (e.g., submitted_by user ID).
    """
    request_id:     str
    priority_score: float
    urgency_level:  UrgencyLevel
    blood_group:    BloodGroup
    status:         RequestStatus
    message:        str


class NearbyRequestItem(BaseModel):
    """
    Single item in the GET /api/emergency/nearby response list.
    Includes distance_km so the frontend can show "5.2 km away".
    """
    request_id:     str
    patient_name:   str
    blood_group:    BloodGroup
    urgency_level:  UrgencyLevel
    units_required: int
    priority_score: float
    distance_km:    Optional[float] = None   # Populated by $geoNear pipeline
    hospital_id:    str
    created_at:     datetime
    escalation_count: int


class QueueStatusResponse(BaseModel):
    """Snapshot of the in-memory priority queue — for hospital dashboard."""
    active_queue_size:   int
    top_request:         Optional[dict]
    pending_db_count:    int


class ScoringRulesResponse(BaseModel):
    """Current active scoring configuration."""
    rule_id:    str
    rule_name:  str
    version:    int
    is_active:  bool
    weights:    dict
    urgency_scores: dict
    rarity_scores:  dict
    escalation_config: dict
    geo_config: dict


class HealthResponse(BaseModel):
    status:       str
    db_connected: bool
    queue_size:   int
    service:      str = "HemoConnect Priority Engine"
