"""
services/inventory_service.py
─────────────────────────────
Manages the blood_inventory collection.

Responsibilities:
  - Upsert blood availability per organization + blood group
  - Fetch inventory for a specific organization
  - Aggregate inventory across all organizations for a region
"""

from __future__ import annotations

import logging
from datetime import datetime, timezone

from motor.motor_asyncio import AsyncIOMotorDatabase

logger = logging.getLogger(__name__)

BLOOD_GROUPS = ["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"]


async def upsert_inventory(
    db: AsyncIOMotorDatabase,
    organization_id: str,
    organization_type: str,
    blood_group: str,
    available_units: int,
) -> dict:
    """
    Upsert a single blood inventory record.

    Uses MongoDB upsert — if (organization_id, blood_group) exists,
    it updates; otherwise it inserts a new document.
    """
    now = datetime.now(timezone.utc)

    result = await db["blood_inventory"].update_one(
        {
            "organization_id": organization_id,
            "blood_group": blood_group,
        },
        {
            "$set": {
                "organization_type": organization_type,
                "available_units": available_units,
                "updated_at": now,
            },
            "$setOnInsert": {
                "created_at": now,
            },
        },
        upsert=True,
    )

    logger.info(
        f"Inventory upsert | org={organization_id[:8]}… | "
        f"{blood_group}={available_units}u | "
        f"modified={result.modified_count} upserted={result.upserted_id is not None}"
    )

    return {
        "organization_id": organization_id,
        "blood_group": blood_group,
        "available_units": available_units,
        "updated_at": now.isoformat(),
    }


async def bulk_upsert_inventory(
    db: AsyncIOMotorDatabase,
    organization_id: str,
    organization_type: str,
    items: list[dict],
) -> list[dict]:
    """
    Upsert multiple blood group entries for one organization.

    Args:
        items: list of {"blood_group": "O+", "available_units": 35}
    """
    results = []
    for item in items:
        result = await upsert_inventory(
            db=db,
            organization_id=organization_id,
            organization_type=organization_type,
            blood_group=item["blood_group"],
            available_units=item["available_units"],
        )
        results.append(result)
    return results


async def get_inventory_by_org(
    db: AsyncIOMotorDatabase,
    organization_id: str,
) -> list[dict]:
    """
    Return all blood group inventory entries for a specific organization.
    """
    cursor = db["blood_inventory"].find(
        {"organization_id": organization_id},
        {"_id": 0},
    ).sort("blood_group", 1)

    items = await cursor.to_list(length=20)
    return items


async def get_aggregated_inventory(
    db: AsyncIOMotorDatabase,
    region: str | None = None,
) -> list[dict]:
    """
    Aggregate total available units per blood group across all organizations.

    Returns a list of:
      {"blood_group": "O+", "total_units": 120, "organization_count": 5}
    """
    pipeline = [
        {
            "$group": {
                "_id": "$blood_group",
                "total_units": {"$sum": "$available_units"},
                "organization_count": {"$sum": 1},
            }
        },
        {
            "$project": {
                "_id": 0,
                "blood_group": "$_id",
                "total_units": 1,
                "organization_count": 1,
            }
        },
        {"$sort": {"blood_group": 1}},
    ]

    cursor = db["blood_inventory"].aggregate(pipeline)
    results = await cursor.to_list(length=20)

    # Ensure all 8 blood groups are represented (fill missing with 0)
    existing = {r["blood_group"] for r in results}
    for bg in BLOOD_GROUPS:
        if bg not in existing:
            results.append({
                "blood_group": bg,
                "total_units": 0,
                "organization_count": 0,
            })

    results.sort(key=lambda x: BLOOD_GROUPS.index(x["blood_group"]))
    return results
