"""
services/geo_service.py
────────────────────────
Geospatial query helpers for location-aware emergency visibility.

Uses MongoDB's native geospatial operators combined with the 2dsphere
index created in database.py.

Key MongoDB operators used here:
  $near        — returns documents sorted by distance (ascending)
  $geoNear     — aggregation stage; adds a distance field to each document
  $geoWithin   — returns documents within a shape (circle, polygon)

GeoJSON reminder:
  ALL coordinates in MongoDB GeoJSON are [longitude, latitude] order.
  This is the GeoJSON standard but opposite of human convention (lat, lng).
  A comment is added everywhere this matters to prevent bugs.
"""

from __future__ import annotations

import logging
from typing import Optional

from motor.motor_asyncio import AsyncIOMotorDatabase

logger = logging.getLogger(__name__)


async def get_nearby_emergency_requests(
    db: AsyncIOMotorDatabase,
    user_longitude: float,
    user_latitude: float,
    radius_km: float = 50.0,
    blood_group: Optional[str] = None,
    urgency_filter: Optional[str] = None,
    limit: int = 20,
) -> list[dict]:
    """
    Find all PENDING emergency blood requests within radius_km of user.

    Uses MongoDB's $near operator which:
      1. Leverages the 2dsphere index (must exist — created in setup_indexes)
      2. Returns results already sorted by distance (nearest first)
      3. Filters by $maxDistance in meters

    We then re-sort by priority_score (highest first) so the nearest
    AND highest priority requests appear at the top.

    Args:
        db:              AsyncIOMotorDatabase instance
        user_longitude:  User's GPS longitude  (GeoJSON: first coordinate)
        user_latitude:   User's GPS latitude   (GeoJSON: second coordinate)
        radius_km:       Search radius in kilometres (from DB geo_config)
        blood_group:     Optional filter: only show "O-", "AB+", etc.
        urgency_filter:  Optional minimum urgency: "high" shows critical+high
        limit:           Max results to return

    Returns:
        List of blood_request documents sorted by priority_score DESC.
    """
    radius_meters = radius_km * 1000  # MongoDB $near uses meters, not km

    # ── Base query ────────────────────────────────────────────────
    query: dict = {
        "status": "pending",
        "location": {
            "$near": {
                "$geometry": {
                    "type": "Point",
                    # GeoJSON order: [longitude, latitude] — NOT [lat, lng]!
                    "coordinates": [user_longitude, user_latitude],
                },
                "$maxDistance": radius_meters,
            }
        },
    }

    # ── Optional filters ──────────────────────────────────────────
    if blood_group:
        query["blood_group"] = blood_group

    if urgency_filter:
        # Show the requested urgency level AND anything more urgent
        urgency_order = ["low", "medium", "high", "critical"]
        try:
            min_idx = urgency_order.index(urgency_filter.lower())
            eligible_levels = urgency_order[min_idx:]  # e.g., ["high", "critical"]
            query["urgency_level"] = {"$in": eligible_levels}
        except ValueError:
            pass  # Invalid urgency filter — ignore it

    # ── Execute query ─────────────────────────────────────────────
    # Project out sensitive fields (submitted_by user identity)
    projection = {
        "_id": 1,
        "patient_name": 1,
        "blood_group": 1,
        "urgency_level": 1,
        "units_required": 1,
        "priority_score": 1,
        "location": 1,
        "hospital_id": 1,
        "created_at": 1,
        "escalation_count": 1,
        "status": 1,
        # Exclude: submitted_by, notes (private clinical info)
        "submitted_by": 0,
    }

    cursor = (
        db["emergency_requests"]
        .find(query, projection)
        .sort("priority_score", -1)   # Re-sort by priority (not just distance)
        .limit(limit)
    )

    results = await cursor.to_list(length=limit)

    # Convert ObjectIds to strings for JSON serialisation
    for doc in results:
        doc["_id"] = str(doc["_id"])
        if "hospital_id" in doc:
            doc["hospital_id"] = str(doc.get("hospital_id", ""))

    logger.debug(
        f"Geo query returned {len(results)} requests | "
        f"center=[{user_longitude:.4f}, {user_latitude:.4f}] | "
        f"radius={radius_km}km"
    )
    return results


async def get_requests_with_distance(
    db: AsyncIOMotorDatabase,
    user_longitude: float,
    user_latitude: float,
    radius_km: float = 50.0,
    limit: int = 20,
) -> list[dict]:
    """
    Find nearby requests AND include the exact distance in the response.

    Uses the $geoNear aggregation stage (more powerful than $near query).
    $geoNear adds a `distance_meters` field to each document.
    We then convert to km and add `distance_km` for display ("5.2 km away").

    IMPORTANT: $geoNear must be the FIRST stage in an aggregation pipeline.

    Why aggregation instead of simple find?
      - $geoNear gives us the distance value in each document
      - We can then do further $addFields, $sort, $limit in the pipeline
      - More flexible than the $near query operator

    Returns documents with an added `distance_km` field.
    """
    pipeline = [
        # Stage 1: Geospatial filter + distance calculation
        {
            "$geoNear": {
                "near": {
                    "type": "Point",
                    "coordinates": [user_longitude, user_latitude],  # [lng, lat]!
                },
                "distanceField": "distance_meters",   # Added to each document
                "maxDistance":   radius_km * 1000,    # In meters
                "spherical":     True,                # Required for 2dsphere
                "query":         {"status": "pending"},  # Pre-filter
            }
        },
        # Stage 2: Add a human-readable distance_km field
        {
            "$addFields": {
                "distance_km": {
                    "$round": [
                        {"$divide": ["$distance_meters", 1000]},
                        1,  # Round to 1 decimal place: 5.2 km
                    ]
                }
            }
        },
        # Stage 3: Sort by priority (highest first), then distance (nearest)
        {
            "$sort": {
                "priority_score": -1,
                "distance_km": 1,
            }
        },
        # Stage 4: Limit results
        {"$limit": limit},
        # Stage 5: Exclude sensitive fields
        {
            "$project": {
                "submitted_by": 0,
                "distance_meters": 0,  # Already converted to distance_km
            }
        },
    ]

    cursor = db["emergency_requests"].aggregate(pipeline)
    results = await cursor.to_list(length=limit)

    # Serialise ObjectIds
    for doc in results:
        doc["_id"] = str(doc["_id"])
        if "hospital_id" in doc:
            doc["hospital_id"] = str(doc.get("hospital_id", ""))

    return results


async def get_urgency_zone_snapshot(
    db: AsyncIOMotorDatabase,
    user_longitude: float,
    user_latitude: float,
    rules: dict,
) -> dict:
    """
    Return request counts in concentric urgency zones.

    Used by the frontend map to show a heatmap of emergency density:
      - Critical zone:  10 km radius — critical urgency only
      - High zone:      30 km radius — high + critical urgency
      - All zone:       configured radius — all urgency levels

    This helps donors understand at a glance if there's an immediate
    emergency nearby before they scroll through a list.
    """
    geo_cfg = rules.get("geo_config", {})
    default_radius = geo_cfg.get("default_radius_km", 50.0)

    zones = {
        "critical_zone_10km":  (10.0,           "critical"),
        "high_zone_30km":      (30.0,            "high"),
        "all_zone":            (default_radius,  None),
    }

    snapshot = {}
    for zone_name, (radius, urgency) in zones.items():
        requests = await get_nearby_emergency_requests(
            db=db,
            user_longitude=user_longitude,
            user_latitude=user_latitude,
            radius_km=radius,
            urgency_filter=urgency,
            limit=5,  # Just top-5 per zone for the snapshot
        )
        snapshot[zone_name] = {
            "count": len(requests),
            "radius_km": radius,
            "top_requests": requests,
        }

    return snapshot
