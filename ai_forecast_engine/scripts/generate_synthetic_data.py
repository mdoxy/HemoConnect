"""
scripts/generate_synthetic_data.py
────────────────────────────────────
Generate 5000+ realistic synthetic blood request records for training.

Blood group distribution follows real-world India averages:
  O+: 38%, A+: 27%, B+: 22%, AB+: 6%, O-: 3%, A-: 2%, B-: 1.5%, AB-: 0.5%

Run:
  cd ai_forecast_engine
  python scripts/generate_synthetic_data.py
"""

import asyncio
import random
import sys
import os
from datetime import datetime, timedelta, timezone
from pathlib import Path

# Add parent to path so imports work
sys.path.insert(0, str(Path(__file__).parent.parent))

from motor.motor_asyncio import AsyncIOMotorClient
from config.settings import get_settings


# ─── Configuration ────────────────────────────────────────────────────────────

NUM_RECORDS = 5500
REGIONS = ["Pune", "Mumbai", "Nagpur", "Nashik"]
REGION_WEIGHTS = [0.40, 0.30, 0.15, 0.15]

BLOOD_GROUPS = ["O+", "A+", "B+", "AB+", "O-", "A-", "B-", "AB-"]
BLOOD_GROUP_WEIGHTS = [0.38, 0.27, 0.22, 0.06, 0.03, 0.02, 0.015, 0.005]

URGENCY_LEVELS = ["critical", "high", "medium", "low"]
URGENCY_WEIGHTS = [0.10, 0.25, 0.40, 0.25]

# Seasonal variation: more requests in winter and during festivals
MONTHLY_MULTIPLIER = {
    1: 1.15,   # January — cold, more accidents
    2: 1.05,
    3: 1.00,
    4: 0.95,
    5: 0.90,   # Summer — fewer surgeries
    6: 0.95,
    7: 1.10,   # Monsoon — more accidents
    8: 1.15,
    9: 1.05,
    10: 1.10,  # Festival season
    11: 1.15,
    12: 1.20,  # Year end — more surgeries
}


def generate_records(count: int) -> list[dict]:
    """Generate synthetic blood request records."""
    records = []
    now = datetime.now(timezone.utc)
    start_date = now - timedelta(days=365)  # Past 12 months

    for _ in range(count):
        # Random date in the past year
        days_offset = random.randint(0, 365)
        request_date = start_date + timedelta(days=days_offset)

        # Apply monthly multiplier for realistic seasonality
        month = request_date.month
        multiplier = MONTHLY_MULTIPLIER.get(month, 1.0)

        # Blood group (weighted)
        blood_group = random.choices(BLOOD_GROUPS, weights=BLOOD_GROUP_WEIGHTS, k=1)[0]

        # Urgency (weighted, with monthly variation)
        urgency = random.choices(URGENCY_LEVELS, weights=URGENCY_WEIGHTS, k=1)[0]

        # Region (weighted)
        region = random.choices(REGIONS, weights=REGION_WEIGHTS, k=1)[0]

        # Units requested: varies by urgency
        if urgency == "critical":
            units = random.randint(3, 8)
        elif urgency == "high":
            units = random.randint(2, 5)
        elif urgency == "medium":
            units = random.randint(1, 3)
        else:
            units = random.randint(1, 2)

        # Apply seasonal multiplier
        units = max(1, int(units * multiplier))

        # Add some time-of-day variation
        hour = random.choices(
            range(24),
            weights=[
                1, 1, 1, 1, 1, 2,    # 0-5 AM (low)
                3, 5, 7, 8, 9, 9,    # 6-11 AM (increasing)
                8, 7, 8, 9, 8, 7,    # 12-5 PM (steady)
                5, 4, 3, 2, 2, 1,    # 6-11 PM (decreasing)
            ],
            k=1,
        )[0]
        request_date = request_date.replace(
            hour=hour,
            minute=random.randint(0, 59),
            second=random.randint(0, 59),
        )

        record = {
            "blood_group": blood_group,
            "urgency_level": urgency,
            "region": region,
            "request_date": request_date,
            "units_requested": units,
            "day_of_week": request_date.weekday(),
            "month": request_date.month,
        }

        records.append(record)

    return records


def generate_initial_inventory() -> list[dict]:
    """
    Generate initial blood inventory data for demo hospitals.
    """
    hospitals = [
        {"id": "hospital_001", "name": "Pune Central Hospital", "type": "hospital"},
        {"id": "hospital_002", "name": "Apollo Blood Bank Pune", "type": "blood_bank"},
        {"id": "hospital_003", "name": "Ruby Hall Clinic", "type": "hospital"},
        {"id": "hospital_004", "name": "Sahyadri Hospital", "type": "hospital"},
        {"id": "hospital_005", "name": "Jehangir Hospital", "type": "hospital"},
    ]

    now = datetime.now(timezone.utc)
    inventory_docs = []

    for hospital in hospitals:
        for bg in BLOOD_GROUPS:
            # Realistic initial stock levels
            if bg in ["O+", "A+", "B+"]:
                units = random.randint(15, 50)
            elif bg in ["AB+", "O-"]:
                units = random.randint(5, 20)
            else:
                units = random.randint(2, 12)

            inventory_docs.append({
                "organization_id": hospital["id"],
                "organization_type": hospital["type"],
                "blood_group": bg,
                "available_units": units,
                "created_at": now,
                "updated_at": now,
            })

    return inventory_docs


async def main():
    """Generate and insert synthetic data into MongoDB."""
    settings = get_settings()

    print(f"[*] Connecting to MongoDB ({settings.mongodb_db_name})...")
    import certifi
    client = AsyncIOMotorClient(
        settings.mongodb_uri,
        serverSelectionTimeoutMS=30000,
        tlsCAFile=certifi.where(),
    )
    db = client[settings.mongodb_db_name]

    # Ping to verify
    await client.admin.command("ping")
    print("[OK] Connected to MongoDB")

    # -- Generate historical records --
    print(f"\n[*] Generating {NUM_RECORDS} synthetic blood request records...")
    records = generate_records(NUM_RECORDS)

    # Clear existing synthetic data
    deleted = await db["blood_request_history"].delete_many({})
    print(f"   Cleared {deleted.deleted_count} existing records")

    # Insert in batches
    batch_size = 500
    total_inserted = 0
    for i in range(0, len(records), batch_size):
        batch = records[i : i + batch_size]
        result = await db["blood_request_history"].insert_many(batch)
        total_inserted += len(result.inserted_ids)
        print(f"   Inserted batch {i // batch_size + 1}: {len(result.inserted_ids)} records")

    print(f"[OK] Total historical records inserted: {total_inserted}")

    # -- Generate inventory data --
    print(f"\n[*] Generating initial blood inventory...")
    inventory = generate_initial_inventory()

    # Clear existing inventory
    await db["blood_inventory"].delete_many({})

    result = await db["blood_inventory"].insert_many(inventory)
    print(f"[OK] Inventory records inserted: {len(result.inserted_ids)}")

    # -- Summary --
    print(f"\n{'=' * 50}")
    print(f"  Data Generation Summary:")
    print(f"   Historical records:  {total_inserted}")
    print(f"   Inventory records:   {len(inventory)}")
    print(f"   Regions:             {', '.join(REGIONS)}")
    print(f"   Blood groups:        {', '.join(BLOOD_GROUPS)}")
    print(f"   Date range:          Past 12 months")
    print(f"{'=' * 50}")
    print(f"\n[NEXT] Run 'python scripts/train_model.py' to train the model")

    client.close()


if __name__ == "__main__":
    asyncio.run(main())

