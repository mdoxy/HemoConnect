"""
services/forecast_service.py
─────────────────────────────
AI Demand Forecasting using Scikit-Learn RandomForestRegressor.

Responsibilities:
  - Load pre-trained model from disk on startup
  - Train model from historical blood request data
  - Predict 7-day regional blood demand per blood group
"""

from __future__ import annotations

import logging
import os
from datetime import datetime, timezone
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor
from sklearn.preprocessing import LabelEncoder
from motor.motor_asyncio import AsyncIOMotorDatabase

logger = logging.getLogger(__name__)

BLOOD_GROUPS = ["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"]

# Module-level model cache
_model: RandomForestRegressor | None = None
_encoders: dict[str, LabelEncoder] | None = None
_model_metrics: dict | None = None


def get_model_dir() -> Path:
    """Return the ml_models directory path (relative to ai_forecast_engine/)."""
    return Path(__file__).parent.parent / "ml_models"


def load_model() -> tuple[RandomForestRegressor | None, dict[str, LabelEncoder] | None]:
    """
    Load the pre-trained model and label encoders from disk.
    Returns (None, None) if files don't exist yet.
    """
    global _model, _encoders, _model_metrics

    model_dir = get_model_dir()
    model_path = model_dir / "blood_demand_model.joblib"
    encoders_path = model_dir / "label_encoders.joblib"
    metrics_path = model_dir / "model_metrics.joblib"

    if not model_path.exists():
        logger.warning(f"Model file not found at {model_path}. Run train_model.py first.")
        return None, None

    try:
        _model = joblib.load(model_path)
        logger.info(f"✅ ML model loaded from {model_path}")

        if encoders_path.exists():
            _encoders = joblib.load(encoders_path)
            logger.info(f"✅ Label encoders loaded ({len(_encoders)} encoders)")

        if metrics_path.exists():
            _model_metrics = joblib.load(metrics_path)
            logger.info(f"✅ Model metrics: MAE={_model_metrics.get('mae', 'N/A'):.2f}, R²={_model_metrics.get('r2', 'N/A'):.3f}")

        return _model, _encoders

    except Exception as exc:
        logger.error(f"Failed to load model: {exc}")
        return None, None


def get_cached_model():
    """Return the cached model and encoders."""
    return _model, _encoders


def get_model_metrics():
    """Return cached model training metrics."""
    return _model_metrics


async def train_model(db: AsyncIOMotorDatabase) -> dict:
    """
    Train a RandomForestRegressor from historical blood request data.

    Steps:
      1. Query blood_request_history collection
      2. Engineer features (blood_group, urgency, region, day_of_week, month)
      3. Train model
      4. Save model + encoders to disk
      5. Return accuracy metrics

    Feature engineering:
      - blood_group → LabelEncoded (0-7)
      - urgency_level → LabelEncoded (0-3)
      - region → LabelEncoded
      - day_of_week → int (0=Monday, 6=Sunday)
      - month → int (1-12)

    Target: units_requested (aggregated by week)
    """
    global _model, _encoders, _model_metrics

    logger.info("🔄 Starting model training…")

    # ── Step 1: Fetch historical data ──────────────────────────────
    cursor = db["blood_request_history"].find({}, {"_id": 0})
    records = await cursor.to_list(length=100_000)

    if len(records) < 100:
        raise ValueError(
            f"Insufficient training data: {len(records)} records. "
            "Need at least 100. Run generate_synthetic_data.py first."
        )

    logger.info(f"Loaded {len(records)} historical records for training")

    # ── Step 2: Build DataFrame ────────────────────────────────────
    df = pd.DataFrame(records)

    # Parse request_date to datetime
    df["request_date"] = pd.to_datetime(df["request_date"])
    df["day_of_week"] = df["request_date"].dt.dayofweek
    df["month"] = df["request_date"].dt.month
    df["week_of_year"] = df["request_date"].dt.isocalendar().week.astype(int)

    # ── Step 3: Aggregate by week + blood_group + region ───────────
    # Group to get weekly demand per blood group per region
    agg_df = (
        df.groupby(["blood_group", "region", "week_of_year", "month"])
        .agg(
            total_units=("units_requested", "sum"),
            avg_urgency_count=("urgency_level", "count"),
            dominant_day=("day_of_week", lambda x: x.mode().iloc[0] if len(x) > 0 else 0),
        )
        .reset_index()
    )

    # ── Step 4: Encode categorical features ────────────────────────
    encoders = {}

    for col in ["blood_group", "region"]:
        le = LabelEncoder()
        agg_df[f"{col}_encoded"] = le.fit_transform(agg_df[col])
        encoders[col] = le

    # ── Step 5: Prepare feature matrix ─────────────────────────────
    feature_cols = [
        "blood_group_encoded",
        "region_encoded",
        "month",
        "week_of_year",
        "dominant_day",
        "avg_urgency_count",
    ]

    X = agg_df[feature_cols].values
    y = agg_df["total_units"].values

    # ── Step 6: Train RandomForestRegressor ────────────────────────
    from sklearn.model_selection import train_test_split
    from sklearn.metrics import mean_absolute_error, r2_score

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42
    )

    model = RandomForestRegressor(
        n_estimators=100,
        max_depth=15,
        min_samples_split=5,
        min_samples_leaf=2,
        random_state=42,
        n_jobs=-1,
    )

    model.fit(X_train, y_train)

    # ── Step 7: Evaluate ───────────────────────────────────────────
    y_pred = model.predict(X_test)
    mae = mean_absolute_error(y_test, y_pred)
    r2 = r2_score(y_test, y_pred)

    metrics = {
        "mae": float(mae),
        "r2": float(r2),
        "training_samples": len(X_train),
        "test_samples": len(X_test),
        "total_records": len(records),
        "trained_at": datetime.now(timezone.utc).isoformat(),
    }

    logger.info(f"Model trained | MAE={mae:.2f} | R²={r2:.3f} | Samples={len(X_train)}")

    # ── Step 8: Save to disk ───────────────────────────────────────
    model_dir = get_model_dir()
    model_dir.mkdir(parents=True, exist_ok=True)

    joblib.dump(model, model_dir / "blood_demand_model.joblib")
    joblib.dump(encoders, model_dir / "label_encoders.joblib")
    joblib.dump(metrics, model_dir / "model_metrics.joblib")

    logger.info(f"✅ Model saved to {model_dir}")

    # Update cached references
    _model = model
    _encoders = encoders
    _model_metrics = metrics

    return metrics


async def predict_demand(
    region: str = "Pune",
    blood_groups: list[str] | None = None,
) -> list[dict]:
    """
    Predict 7-day blood demand for a region per blood group.

    Returns list of {"blood_group": "O+", "predicted_demand": 45}
    """
    if _model is None or _encoders is None:
        logger.warning("Model not loaded — returning fallback estimates")
        return _get_fallback_predictions(blood_groups)

    target_groups = blood_groups or BLOOD_GROUPS
    predictions = []

    # Get current time features
    now = datetime.now()
    current_month = now.month
    current_week = now.isocalendar()[1]
    current_day = now.weekday()

    for bg in target_groups:
        try:
            # Encode features
            bg_encoded = _encoders["blood_group"].transform([bg])[0]

            # Handle unseen regions gracefully
            if region in _encoders["region"].classes_:
                region_encoded = _encoders["region"].transform([region])[0]
            else:
                region_encoded = 0  # Default to first known region

            # Feature vector: [blood_group_encoded, region_encoded, month, week, day, urgency_count]
            features = np.array([[
                bg_encoded,
                region_encoded,
                current_month,
                current_week,
                current_day,
                10,  # Average urgency count estimate
            ]])

            predicted = _model.predict(features)[0]
            predicted = max(0, int(round(predicted)))

            predictions.append({
                "blood_group": bg,
                "predicted_demand": predicted,
            })

        except Exception as exc:
            logger.error(f"Prediction failed for {bg}: {exc}")
            predictions.append({
                "blood_group": bg,
                "predicted_demand": 0,
            })

    return predictions


def _get_fallback_predictions(blood_groups: list[str] | None = None) -> list[dict]:
    """
    Return reasonable fallback predictions when model is not available.
    Based on typical blood demand distribution.
    """
    fallback = {
        "O+": 45, "O-": 12, "A+": 32, "A-": 8,
        "B+": 28, "B-": 6,  "AB+": 10, "AB-": 4,
    }
    target = blood_groups or BLOOD_GROUPS
    return [
        {"blood_group": bg, "predicted_demand": fallback.get(bg, 10)}
        for bg in target
    ]
