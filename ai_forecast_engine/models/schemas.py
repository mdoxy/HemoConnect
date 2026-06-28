"""
models/schemas.py
─────────────────
Pydantic v2 models for the AI Forecast Engine.
Covers inventory, forecast, shortage analysis, alerts, and outreach.
"""

from __future__ import annotations

from datetime import datetime
from enum import Enum
from typing import Optional

from pydantic import BaseModel, Field


# ─── Enums ────────────────────────────────────────────────────────────────────

class BloodGroup(str, Enum):
    """Standard ABO + Rh blood group system."""
    O_POS  = "O+"
    O_NEG  = "O-"
    A_POS  = "A+"
    A_NEG  = "A-"
    B_POS  = "B+"
    B_NEG  = "B-"
    AB_POS = "AB+"
    AB_NEG = "AB-"


class OrganizationType(str, Enum):
    HOSPITAL   = "hospital"
    BLOOD_BANK = "blood_bank"


class UrgencyLevel(str, Enum):
    CRITICAL = "critical"
    HIGH     = "high"
    MEDIUM   = "medium"
    LOW      = "low"


class RiskLevel(str, Enum):
    LOW    = "low"
    MEDIUM = "medium"
    HIGH   = "high"


# ─── Inventory ────────────────────────────────────────────────────────────────

class InventoryUpdateItem(BaseModel):
    """Single blood group update within a bulk inventory update."""
    blood_group: BloodGroup
    available_units: int = Field(..., ge=0, le=10000)


class InventoryUpdateRequest(BaseModel):
    """
    Request body for POST /api/inventory/update
    Allows updating multiple blood groups at once for an organization.
    """
    organization_id: str = Field(..., min_length=1)
    organization_type: OrganizationType = OrganizationType.HOSPITAL
    items: list[InventoryUpdateItem] = Field(..., min_length=1, max_length=8)


class InventoryItem(BaseModel):
    """Single inventory record returned from the API."""
    blood_group: str
    available_units: int
    updated_at: Optional[datetime] = None


class InventoryResponse(BaseModel):
    """Response for GET /api/inventory/{org_id}"""
    organization_id: str
    inventory: list[InventoryItem]


class AggregatedInventoryItem(BaseModel):
    """Aggregated inventory across all organizations for one blood group."""
    blood_group: str
    total_units: int
    organization_count: int


class AggregatedInventoryResponse(BaseModel):
    """Response for GET /api/inventory/aggregated"""
    region: str
    inventory: list[AggregatedInventoryItem]


# ─── Forecast ─────────────────────────────────────────────────────────────────

class ForecastItem(BaseModel):
    """Predicted demand for a single blood group."""
    blood_group: str
    predicted_demand: int


class ForecastResponse(BaseModel):
    """Response for GET /api/forecast"""
    region: str
    forecast_period: str = "7_days"
    predictions: list[ForecastItem]
    model_accuracy: Optional[float] = None
    generated_at: datetime


# ─── Shortage Analysis ────────────────────────────────────────────────────────

class ShortageItem(BaseModel):
    """Shortage analysis for a single blood group."""
    blood_group: str
    predicted_demand: int
    available_units: int
    deficit: int
    risk_level: RiskLevel


class ShortageAnalysisResponse(BaseModel):
    """Response for GET /api/shortage/analysis"""
    region: str
    forecast_period: str = "7_days"
    analysis: list[ShortageItem]
    critical_count: int
    generated_at: datetime


# ─── Alerts ───────────────────────────────────────────────────────────────────

class ShortageAlert(BaseModel):
    """A shortage alert document."""
    alert_id: Optional[str] = None
    region: str
    blood_group: str
    predicted_demand: int
    available_units: int
    deficit: int
    risk_level: RiskLevel
    message: str
    is_active: bool = True
    created_at: Optional[datetime] = None


class AlertsResponse(BaseModel):
    """Response for GET /api/shortage/alerts"""
    alerts: list[ShortageAlert]
    total_count: int


# ─── Outreach Recommendations ────────────────────────────────────────────────

class OutreachRecommendation(BaseModel):
    """A proactive donor outreach recommendation."""
    blood_group: str
    deficit: int
    risk_level: RiskLevel
    recommendations: list[str]
    priority: str  # "urgent" | "standard"


class OutreachResponse(BaseModel):
    """Response for GET /api/shortage/recommendations"""
    region: str
    recommendations: list[OutreachRecommendation]
    generated_at: datetime
