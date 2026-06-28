"""
services/shortage_service.py
─────────────────────────────
Shortage Prediction Engine.

Compares predicted demand against available inventory,
detects potential shortages, generates alerts, and
produces proactive donor outreach recommendations.
"""

from __future__ import annotations

import logging
from datetime import datetime, timezone

from motor.motor_asyncio import AsyncIOMotorDatabase

from services import inventory_service, forecast_service

logger = logging.getLogger(__name__)


# ─── Risk Level Calculation ───────────────────────────────────────────────────

def calculate_risk_level(predicted_demand: int, available_units: int) -> str:
    """
    Determine risk level based on demand vs availability.

    Risk levels:
      - LOW:    availability >= demand
      - MEDIUM: availability is within 20% of demand (i.e., >= 80% of demand)
      - HIGH:   availability < 80% of demand (effectively < demand)
    """
    if available_units >= predicted_demand:
        return "low"
    elif available_units >= predicted_demand * 0.8:
        return "medium"
    else:
        return "high"


# ─── Shortage Analysis ────────────────────────────────────────────────────────

async def analyze_shortages(
    db: AsyncIOMotorDatabase,
    region: str = "Pune",
) -> list[dict]:
    """
    Run shortage analysis: compare 7-day predicted demand vs current inventory.

    Returns a list of analysis items per blood group:
    {
        "blood_group": "O+",
        "predicted_demand": 45,
        "available_units": 30,
        "deficit": 15,
        "risk_level": "high"
    }
    """
    # Get predictions
    predictions = await forecast_service.predict_demand(region=region)

    # Get aggregated inventory
    inventory = await inventory_service.get_aggregated_inventory(db)
    inventory_map = {item["blood_group"]: item["total_units"] for item in inventory}

    analysis = []
    for pred in predictions:
        bg = pred["blood_group"]
        demand = pred["predicted_demand"]
        available = inventory_map.get(bg, 0)
        deficit = max(0, demand - available)
        risk = calculate_risk_level(demand, available)

        analysis.append({
            "blood_group": bg,
            "predicted_demand": demand,
            "available_units": available,
            "deficit": deficit,
            "risk_level": risk,
        })

    # Sort by risk level (high first, then medium, then low)
    risk_order = {"high": 0, "medium": 1, "low": 2}
    analysis.sort(key=lambda x: (risk_order.get(x["risk_level"], 3), -x["deficit"]))

    return analysis


# ─── Alert Generation ─────────────────────────────────────────────────────────

async def generate_alerts(
    db: AsyncIOMotorDatabase,
    region: str = "Pune",
) -> list[dict]:
    """
    Generate and store shortage alerts for medium and high risk blood groups.

    Only creates new alerts — checks for existing active alerts to avoid duplicates.
    """
    analysis = await analyze_shortages(db, region)
    now = datetime.now(timezone.utc)

    alerts_created = []

    for item in analysis:
        if item["risk_level"] in ("medium", "high"):
            bg = item["blood_group"]

            # Check if an active alert already exists for this blood group + region
            existing = await db["shortage_alerts"].find_one({
                "region": region,
                "blood_group": bg,
                "is_active": True,
            })

            if existing:
                # Update existing alert with latest numbers
                await db["shortage_alerts"].update_one(
                    {"_id": existing["_id"]},
                    {
                        "$set": {
                            "predicted_demand": item["predicted_demand"],
                            "available_units": item["available_units"],
                            "deficit": item["deficit"],
                            "risk_level": item["risk_level"],
                            "message": _build_alert_message(item, region),
                            "updated_at": now,
                        }
                    },
                )
                logger.info(f"Updated existing alert for {bg} in {region}")
            else:
                # Create new alert
                alert_doc = {
                    "region": region,
                    "blood_group": bg,
                    "predicted_demand": item["predicted_demand"],
                    "available_units": item["available_units"],
                    "deficit": item["deficit"],
                    "risk_level": item["risk_level"],
                    "message": _build_alert_message(item, region),
                    "is_active": True,
                    "created_at": now,
                    "updated_at": now,
                }

                result = await db["shortage_alerts"].insert_one(alert_doc)
                alert_doc["_id"] = result.inserted_id
                alerts_created.append(alert_doc)

                logger.info(
                    f"⚠ Alert created | {bg} in {region} | "
                    f"risk={item['risk_level']} | deficit={item['deficit']}u"
                )

    # Deactivate alerts for blood groups that are no longer at risk
    low_risk_groups = [
        item["blood_group"] for item in analysis if item["risk_level"] == "low"
    ]
    if low_risk_groups:
        await db["shortage_alerts"].update_many(
            {
                "region": region,
                "blood_group": {"$in": low_risk_groups},
                "is_active": True,
            },
            {"$set": {"is_active": False, "resolved_at": now}},
        )

    return alerts_created


def _build_alert_message(item: dict, region: str) -> str:
    """Build a human-readable alert message."""
    emoji = "🔴" if item["risk_level"] == "high" else "🟡"
    return (
        f"{emoji} Predicted {item['blood_group']} blood shortage in {region} "
        f"within the next 7 days.\n"
        f"Expected Demand: {item['predicted_demand']} units\n"
        f"Available Units: {item['available_units']} units\n"
        f"Deficit: {item['deficit']} units"
    )


# ─── Get Active Alerts ────────────────────────────────────────────────────────

async def get_active_alerts(
    db: AsyncIOMotorDatabase,
    region: str | None = None,
    limit: int = 50,
) -> list[dict]:
    """Fetch active shortage alerts, optionally filtered by region."""
    query: dict = {"is_active": True}
    if region:
        query["region"] = region

    cursor = (
        db["shortage_alerts"]
        .find(query)
        .sort("created_at", -1)
        .limit(limit)
    )

    alerts = await cursor.to_list(length=limit)

    # Serialise ObjectId
    for alert in alerts:
        alert["_id"] = str(alert["_id"])

    return alerts


# ─── Donor Outreach Recommendations ──────────────────────────────────────────

async def generate_outreach_recommendations(
    db: AsyncIOMotorDatabase,
    region: str = "Pune",
) -> list[dict]:
    """
    Generate proactive donor outreach recommendations for high-risk shortages.

    For prototype: text-based recommendations only.
    Actual SMS/email integration is mocked.
    """
    analysis = await analyze_shortages(db, region)

    recommendations = []

    for item in analysis:
        if item["risk_level"] == "high":
            recs = [
                f"🔔 Send urgent notification to all registered {item['blood_group']} donors in {region}",
                f"📋 Highlight {item['blood_group']} as urgently needed on the donation page",
                f"🏥 Notify all participating hospitals to check their {item['blood_group']} reserves",
                f"🩸 Organize an emergency {item['blood_group']} blood drive in {region}",
                f"📱 Send SMS/push notifications to {item['blood_group']} compatible donors within 50km",
            ]
            recommendations.append({
                "blood_group": item["blood_group"],
                "deficit": item["deficit"],
                "risk_level": item["risk_level"],
                "recommendations": recs,
                "priority": "urgent",
            })

        elif item["risk_level"] == "medium":
            recs = [
                f"📧 Send email reminders to {item['blood_group']} donors who haven't donated in 3+ months",
                f"📋 Add {item['blood_group']} to the 'needed soon' section on the dashboard",
                f"🏥 Alert blood banks in {region} about potential {item['blood_group']} shortage",
            ]
            recommendations.append({
                "blood_group": item["blood_group"],
                "deficit": item["deficit"],
                "risk_level": item["risk_level"],
                "recommendations": recs,
                "priority": "standard",
            })

    return recommendations
