"""
routes/shortage.py
───────────────────
API endpoints for shortage prediction, alerts, and donor outreach.
"""

from __future__ import annotations

import logging
from datetime import datetime, timezone

from fastapi import APIRouter, Request

from services import shortage_service

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/shortage", tags=["Shortage Prediction"])


def get_db(request: Request):
    """Inject MongoDB database from app state."""
    return request.app.state.db


# ─── Routes ───────────────────────────────────────────────────────────────────

@router.get("/analysis")
async def get_shortage_analysis(
    region: str = "Pune",
    http_request: Request = None,
):
    """
    Run shortage analysis: predicted demand vs available inventory.

    Returns per blood group:
      - predicted_demand
      - available_units
      - deficit
      - risk_level (low / medium / high)
    """
    db = get_db(http_request)

    analysis = await shortage_service.analyze_shortages(db, region)
    critical_count = sum(1 for item in analysis if item["risk_level"] == "high")

    # Also generate/update alerts based on the analysis
    await shortage_service.generate_alerts(db, region)

    return {
        "success": True,
        "region": region,
        "forecast_period": "7_days",
        "analysis": analysis,
        "critical_count": critical_count,
        "generated_at": datetime.now(timezone.utc).isoformat(),
    }


@router.get("/alerts")
async def get_shortage_alerts(
    region: str = None,
    limit: int = 50,
    http_request: Request = None,
):
    """Get active shortage alerts, optionally filtered by region."""
    db = get_db(http_request)

    alerts = await shortage_service.get_active_alerts(db, region, limit)

    return {
        "success": True,
        "alerts": alerts,
        "total_count": len(alerts),
    }


@router.get("/recommendations")
async def get_outreach_recommendations(
    region: str = "Pune",
    http_request: Request = None,
):
    """
    Get proactive donor outreach recommendations for high-risk shortages.

    Returns actionable recommendation text for each at-risk blood group.
    """
    db = get_db(http_request)

    recommendations = await shortage_service.generate_outreach_recommendations(db, region)

    return {
        "success": True,
        "region": region,
        "recommendations": recommendations,
        "generated_at": datetime.now(timezone.utc).isoformat(),
    }
