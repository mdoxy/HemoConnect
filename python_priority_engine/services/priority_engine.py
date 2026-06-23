"""
services/priority_engine.py
────────────────────────────
Dynamic Priority Scoring Engine for HemoConnect.

Design principle: ALL weights and mappings are stored in MongoDB.
This module only contains the *algorithm* — never the *values*.

Four scoring factors (each normalised to 0–100):
  1. Urgency Level     — How medically critical is the request?
  2. Wait Time         — How long has the patient been waiting?
  3. Blood Group Rarity— How hard is this blood type to source?
  4. Geospatial Proximity — How close is the request to the user?

Final score = weighted sum of the four factors (weights from DB).
"""

from __future__ import annotations

import math
import logging
from datetime import datetime, timezone
from typing import Optional

from motor.motor_asyncio import AsyncIOMotorDatabase

logger = logging.getLogger(__name__)


class PriorityEngine:
    """
    Computes a 0–100 priority score for each blood request.

    Rules are loaded from the `scoring_rules` MongoDB collection.
    Uses a simple in-memory cache to avoid a DB round-trip on every
    API call. Call `invalidate_cache()` whenever rules are updated.
    """

    def __init__(self, db: AsyncIOMotorDatabase):
        self.db = db
        self._rules_cache: Optional[dict] = None

    # ──────────────────────────────────────────────────────────────
    # Rule Loading
    # ──────────────────────────────────────────────────────────────

    async def get_active_rules(self) -> dict:
        """
        Load the active scoring rule document from MongoDB.

        Cache strategy: load once, reuse for every request.
        Invalidate on admin rule update (call invalidate_cache()).

        Why cache? The scoring_rules document changes rarely (maybe once
        a month when hospital protocols change). Hitting the DB on every
        priority calculation would be wasteful.
        """
        if self._rules_cache is None:
            rules = await self.db["scoring_rules"].find_one({"is_active": True})
            if not rules:
                logger.warning("No active scoring rules found — using hardcoded defaults")
                rules = self._get_default_rules()
            self._rules_cache = rules
            logger.debug(f"Scoring rules loaded: version={rules.get('version', 'default')}")
        return self._rules_cache

    def invalidate_cache(self):
        """
        Force rules to be reloaded from DB on the next computation.
        Called by the admin route after updating scoring_rules in MongoDB.
        """
        self._rules_cache = None
        logger.info("Priority engine cache invalidated — will reload rules from DB")

    # ──────────────────────────────────────────────────────────────
    # Factor 1: Urgency Score (0–100)
    # ──────────────────────────────────────────────────────────────

    def compute_urgency_score(self, urgency_level: str, rules: dict) -> float:
        """
        Maps the request's urgency level to a score using the DB mapping.

        Example from DB:
          urgency_scores = { "critical": 100, "high": 70,
                             "medium": 40,   "low": 10 }

        If someone submits urgency="critical", they get 100/100 on this factor.

        Why not just rank critical=4, high=3, medium=2, low=1?
        Because non-linear DB values let administrators fine-tune the gaps.
        E.g., they might change high→90 to close the gap with critical.
        """
        urgency_map: dict = rules.get("urgency_scores", {})
        score = urgency_map.get(urgency_level.lower(), 50.0)  # 50 = unknown default
        return float(score)

    # ──────────────────────────────────────────────────────────────
    # Factor 2: Wait Time Score (0–100)
    # ──────────────────────────────────────────────────────────────

    def compute_wait_time_score(self, created_at: datetime) -> float:
        """
        Older requests score higher — rewarding patience and preventing starvation.

        Formula: min(100, log(1 + minutes_waiting) × 15)

        Why logarithmic growth?
          - A request at 10 min vs 20 min: big difference (patient getting worse)
          - A request at 1000 min vs 1010 min: small difference (already critical)
          - log() captures this "diminishing returns" naturally.

        Scale calibration (with multiplier=15):
          10  min → log(11) × 15  ≈ 35.9   (urgent but fresh)
          30  min → log(31) × 15  ≈ 51.6   (needs attention)
          60  min → log(61) × 15  ≈ 61.3   (definitely urgent)
          120 min → log(121) × 15 ≈ 71.6   (very overdue)
          240 min → log(241) × 15 ≈ 81.4   (critical wait)
          capped at 100            at ~30 hours
        """
        # Ensure timezone-aware comparison
        if created_at.tzinfo is None:
            created_at = created_at.replace(tzinfo=timezone.utc)

        now = datetime.now(timezone.utc)
        minutes_waiting = (now - created_at).total_seconds() / 60.0
        minutes_waiting = max(0.0, minutes_waiting)  # Guard against clock drift

        score = min(100.0, math.log(1 + minutes_waiting) * 15)
        return round(score, 4)

    # ──────────────────────────────────────────────────────────────
    # Factor 3: Blood Rarity Score (0–100)
    # ──────────────────────────────────────────────────────────────

    def compute_rarity_score(self, blood_group: str, rules: dict) -> float:
        """
        Rarer blood types get higher priority — they are harder to source.

        Default rarity ranking (approximate Indian population distribution):
          AB-  → 100  (rarest: ~0.6% of population)
          O-   → 90   (universal donor, always in high demand)
          B-   → 80
          A-   → 75
          AB+  → 60   (rare but Rh+ more available)
          B+   → 40
          A+   → 20
          O+   → 10   (most common: ~37% of population)

        All values are configurable in MongoDB — hospitals in different
        regions may have different actual supply constraints.
        """
        rarity_map: dict = rules.get("rarity_scores", {})
        score = rarity_map.get(blood_group, 50.0)  # 50 = unrecognised type
        return float(score)

    # ──────────────────────────────────────────────────────────────
    # Factor 4: Proximity Score (0–100)
    # ──────────────────────────────────────────────────────────────

    def compute_proximity_score(
        self,
        request_coords: list[float],   # [lng, lat] of the request
        user_coords: list[float],      # [lng, lat] of the donor/user
        max_radius_km: float = 50.0,
    ) -> float:
        """
        Closer requests score higher. Requests beyond max_radius score 0.

        Formula: max(0, (1 - distance / max_radius) × 100)

        Intuition:
          distance = 0 km   → score = 100  (same location, highly relevant)
          distance = 25 km  → score = 50   (half the radius away)
          distance = 50 km  → score = 0    (at the boundary)
          distance > 50 km  → score = 0    (shouldn't even appear in results)

        This makes geospatial filtering and scoring consistent:
        MongoDB $near filters to radius, proximity factor scores within radius.
        """
        if not request_coords or not user_coords:
            return 50.0  # Neutral if location data missing

        distance_km = self._haversine_distance(request_coords, user_coords)

        if distance_km >= max_radius_km:
            return 0.0

        score = (1.0 - distance_km / max_radius_km) * 100.0
        return round(score, 4)

    def _haversine_distance(
        self, coords1: list[float], coords2: list[float]
    ) -> float:
        """
        Haversine formula — computes great-circle distance on Earth's surface.

        Both inputs are GeoJSON order: [longitude, latitude].
        Returns distance in kilometres.

        Accuracy: ±0.3% for distances < 500 km (acceptable for this use case).
        For exact geodesic distance, use geopy.distance.geodesic().

        Formula derivation:
          a = sin²(Δlat/2) + cos(lat1)·cos(lat2)·sin²(Δlng/2)
          c = 2·arcsin(√a)
          d = R·c       where R = 6371 km (Earth's mean radius)
        """
        R = 6371.0  # Earth's mean radius in km

        lng1 = math.radians(coords1[0])
        lat1 = math.radians(coords1[1])
        lng2 = math.radians(coords2[0])
        lat2 = math.radians(coords2[1])

        d_lat = lat2 - lat1
        d_lng = lng2 - lng1

        a = (
            math.sin(d_lat / 2) ** 2
            + math.cos(lat1) * math.cos(lat2) * math.sin(d_lng / 2) ** 2
        )
        c = 2 * math.asin(math.sqrt(a))
        return R * c

    # ──────────────────────────────────────────────────────────────
    # Master Computation
    # ──────────────────────────────────────────────────────────────

    async def compute_priority(
        self,
        request: dict,
        user_coords: Optional[list[float]] = None,
    ) -> float:
        """
        Orchestrate all four factors and return a final 0–100 priority score.

        This is the single function called by:
          - POST /api/emergency/request   (initial score on creation)
          - Escalation job                (recompute after time boost)
          - Admin rule update             (recompute all pending requests)

        Args:
            request:     The emergency_requests MongoDB document (as dict)
            user_coords: [lng, lat] of the requesting user (for proximity factor)

        Returns:
            float between 0.0 and 100.0 (higher = process sooner)
        """
        rules = await self.get_active_rules()
        weights = rules["weights"]
        geo_cfg = rules["geo_config"]

        # ── Factor scores ──────────────────────────────────────────
        urgency_score = self.compute_urgency_score(
            request.get("urgency_level", "medium"), rules
        )

        wait_time_score = self.compute_wait_time_score(
            request.get("created_at", datetime.now(timezone.utc))
        )

        rarity_score = self.compute_rarity_score(
            request.get("blood_group", "O+"), rules
        )

        # Proximity: only if user provided their location
        request_coords = (
            request.get("location", {}).get("coordinates")
            if isinstance(request.get("location"), dict)
            else None
        )
        if user_coords and request_coords:
            proximity_score = self.compute_proximity_score(
                request_coords,
                user_coords,
                max_radius_km=geo_cfg.get("max_radius_km", 50.0),
            )
        else:
            proximity_score = 50.0  # Neutral when location unavailable

        # ── Weighted sum (weights loaded from MongoDB) ─────────────
        final_score = (
            urgency_score   * weights.get("urgency_weight", 0.40)
            + wait_time_score * weights.get("wait_time_weight", 0.25)
            + rarity_score    * weights.get("rarity_weight", 0.20)
            + proximity_score * weights.get("proximity_weight", 0.15)
        )

        logger.debug(
            f"Priority computed | urgency={urgency_score:.1f} "
            f"wait={wait_time_score:.1f} rarity={rarity_score:.1f} "
            f"proximity={proximity_score:.1f} → final={final_score:.4f}"
        )

        return round(min(final_score, 100.0), 4)

    # ──────────────────────────────────────────────────────────────
    # Batch Recomputation (used after rule update)
    # ──────────────────────────────────────────────────────────────

    async def recompute_all_pending(self) -> int:
        """
        Recompute priority scores for ALL pending emergency requests.

        Called when an admin changes scoring weights.
        Returns the number of requests updated.

        Note: No user_coords available for batch recompute, so proximity
        factor uses neutral 50.0. Scores will be personalised again
        on the next GET /api/emergency/nearby call.
        """
        self.invalidate_cache()  # Ensure fresh rules
        updated_count = 0

        cursor = self.db["emergency_requests"].find({"status": "pending"})
        async for request in cursor:
            new_score = await self.compute_priority(request, user_coords=None)
            await self.db["emergency_requests"].update_one(
                {"_id": request["_id"]},
                {"$set": {
                    "priority_score": new_score,
                    "updated_at": datetime.now(timezone.utc),
                }},
            )
            updated_count += 1

        logger.info(f"Batch recompute complete — {updated_count} requests updated")
        return updated_count

    # ──────────────────────────────────────────────────────────────
    # Default Rules Fallback
    # ──────────────────────────────────────────────────────────────

    @staticmethod
    def _get_default_rules() -> dict:
        """
        Fallback rules used when no active rule document exists in MongoDB.
        In production, always seed the DB with a scoring_rules document.
        """
        return {
            "rule_name": "default_fallback",
            "is_active": True,
            "version": 0,
            "weights": {
                "urgency_weight":   0.40,
                "wait_time_weight": 0.25,
                "rarity_weight":    0.20,
                "proximity_weight": 0.15,
            },
            "urgency_scores": {
                "critical": 100, "high": 70, "medium": 40, "low": 10,
            },
            "rarity_scores": {
                "AB-": 100, "O-": 90, "B-": 80, "A-": 75,
                "AB+": 60,  "B+": 40, "A+": 20, "O+": 10,
            },
            "escalation_config": {
                "check_interval_minutes": 15,
                "escalation_threshold_minutes": 30,
                "escalation_boost": 5.0,
                "max_escalations": 10,
            },
            "geo_config": {
                "default_radius_km": 50.0,
                "max_radius_km": 200.0,
            },
        }
