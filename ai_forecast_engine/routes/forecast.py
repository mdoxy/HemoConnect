"""
routes/forecast.py
───────────────────
API endpoints for AI demand forecasting.
"""

from __future__ import annotations

import logging
from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException, Request

from services import forecast_service

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/forecast", tags=["AI Forecast"])


def get_db(request: Request):
    """Inject MongoDB database from app state."""
    return request.app.state.db


# ─── Routes ───────────────────────────────────────────────────────────────────

@router.get("")
async def get_forecast(
    region: str = "Pune",
    http_request: Request = None,
):
    """
    Get 7-day blood demand forecast for a region.

    Response:
    {
        "region": "Pune",
        "forecast_period": "7_days",
        "predictions": {"O+": 45, "A+": 32, ...},
        "model_accuracy": 0.87,
        "generated_at": "2026-06-25T10:30:00Z"
    }
    """
    predictions = await forecast_service.predict_demand(region=region)
    metrics = forecast_service.get_model_metrics()

    # Convert predictions list to dict format for cleaner response
    predictions_dict = {
        p["blood_group"]: p["predicted_demand"] for p in predictions
    }

    return {
        "success": True,
        "region": region,
        "forecast_period": "7_days",
        "predictions": predictions_dict,
        "predictions_list": predictions,
        "model_accuracy": metrics.get("r2") if metrics else None,
        "model_mae": metrics.get("mae") if metrics else None,
        "generated_at": datetime.now(timezone.utc).isoformat(),
    }


@router.post("/train")
async def train_model(http_request: Request):
    """
    Trigger model retraining from historical data.

    This is an admin-only endpoint.
    The model is saved to disk and reloaded into memory.
    """
    db = get_db(http_request)

    try:
        metrics = await forecast_service.train_model(db)
        return {
            "success": True,
            "message": "Model trained successfully",
            "metrics": metrics,
        }
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    except Exception as exc:
        logger.error(f"Training failed: {exc}")
        raise HTTPException(status_code=500, detail=f"Training failed: {str(exc)}")
