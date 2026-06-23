"""
scripts/seed_scoring_rules.py
──────────────────────────────
One-time script to seed the default scoring rules document into MongoDB.

Run this ONCE before starting the FastAPI server:
  cd python_priority_engine
  python scripts/seed_scoring_rules.py

Safe to run multiple times — checks for existing active rules first.
"""

import asyncio
import sys
import os

# Ensure the parent directory is on the path so imports work
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from datetime import datetime, timezone
from motor.motor_asyncio import AsyncIOMotorClient
from config.settings import get_settings


DEFAULT_SCORING_RULES = {
    "rule_name": "default_emergency_rules",
    "description": (
        "Default scoring configuration for HemoConnect emergency blood request prioritisation. "
        "Weights: urgency 40%, wait time 25%, blood rarity 20%, proximity 15%."
    ),
    "is_active": True,
    "version": 1,
    "created_at": datetime.now(timezone.utc),
    "updated_at": datetime.now(timezone.utc),

    # ── Factor weights (must sum to 1.0) ──────────────────────────
    "weights": {
        "urgency_weight":   0.40,   # Most important: how critical is the patient?
        "wait_time_weight": 0.25,   # Reward patience, prevent starvation
        "rarity_weight":    0.20,   # Rare blood types harder to source
        "proximity_weight": 0.15,   # Closer = more actionable for donor
    },

    # ── Urgency level → score mapping (0–100) ────────────────────
    "urgency_scores": {
        "critical": 100,   # Patient in surgery / ICU / active haemorrhage
        "high":     70,    # Needed within 6–24 hours
        "medium":   40,    # Needed within 24–72 hours
        "low":      10,    # Scheduled / elective transfusion
    },

    # ── Blood group rarity scores (0–100) ─────────────────────────
    # Based on Indian population blood group distribution
    "rarity_scores": {
        "AB-": 100,   # ~0.6% of population — rarest
        "O-":  90,    # ~7%  — universal donor, always high demand
        "B-":  80,    # ~2%  — rare
        "A-":  75,    # ~2%  — rare
        "AB+": 60,    # ~4%  — uncommon
        "B+":  40,    # ~38% — common in India
        "A+":  20,    # ~23% — common
        "O+":  10,    # ~37% — most common
    },

    # ── Escalation configuration ──────────────────────────────────
    "escalation_config": {
        "check_interval_minutes":       15,   # APScheduler runs every 15 min
        "escalation_threshold_minutes": 30,   # Boost if waiting > 30 min
        "escalation_boost":             5.0,  # +5 points per escalation cycle
        "max_escalations":              10,   # Max 10 boosts (cap at +50 pts total)
    },

    # ── Geospatial configuration ──────────────────────────────────
    "geo_config": {
        "default_radius_km": 50.0,    # Default search radius for nearby query
        "max_radius_km":     200.0,   # Absolute maximum radius allowed by API
    },
}


async def seed():
    settings = get_settings()
    client = AsyncIOMotorClient(settings.mongodb_uri, serverSelectionTimeoutMS=5000)
    db = client[settings.mongodb_db_name]

    print(f"Connecting to MongoDB: {settings.mongodb_db_name}…")

    try:
        await client.admin.command("ping")
        print("[OK] Connected to MongoDB")
    except Exception as e:
        print(f"[ERROR] MongoDB connection failed: {e}")
        return

    # Check if active rules already exist
    existing = await db["scoring_rules"].find_one({"is_active": True})
    if existing:
        print(
            f"[INFO] Active scoring rules already exist "
            f"(version={existing.get('version', '?')}, "
            f"name={existing.get('rule_name', '?')}). "
            f"Skipping seed. Use PUT /api/admin/scoring-rules/weights to update."
        )
        client.close()
        return

    result = await db["scoring_rules"].insert_one(DEFAULT_SCORING_RULES)
    print(f"[OK] Default scoring rules seeded!")
    print(f"   Rule ID: {result.inserted_id}")
    print(f"   Weights: urgency=40%, wait_time=25%, rarity=20%, proximity=15%")
    print(f"   Escalation: every 15min, +5pts per cycle, max 10 escalations")
    print(f"   Geo radius: default 50km, max 200km")
    print()
    print("You can now start the FastAPI server:")
    print("  cd python_priority_engine")
    print("  uvicorn main:app --reload --port 8000")

    client.close()


if __name__ == "__main__":
    asyncio.run(seed())
