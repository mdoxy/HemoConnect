"""
tests/test_priority_engine.py
──────────────────────────────
Unit tests for the PriorityEngine scoring logic.

Tests run WITHOUT a real MongoDB connection — all DB calls are mocked.
This makes tests fast, isolated, and runnable in CI/CD.

Run with:
  cd python_priority_engine
  python -m pytest tests/ -v

Design: Test each factor independently, then test the composite score.
This "unit" approach means if a test fails, you know EXACTLY which
factor is broken — easier debugging.
"""

from __future__ import annotations

import math
from datetime import datetime, timedelta, timezone
from unittest.mock import AsyncMock, MagicMock

import pytest

# ── Import the class under test ──────────────────────────────────
import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from services.priority_engine import PriorityEngine
from services.priority_queue import BloodRequestPriorityQueue


# ─── Fixtures ─────────────────────────────────────────────────────────────────

@pytest.fixture
def mock_db():
    """Return a MagicMock that simulates AsyncIOMotorDatabase."""
    return MagicMock()


@pytest.fixture
def engine(mock_db):
    """Return a PriorityEngine with a mocked DB and pre-loaded rules."""
    e = PriorityEngine(mock_db)
    # Pre-load the cache with default rules so tests don't hit MongoDB
    e._rules_cache = PriorityEngine._get_default_rules()
    return e


@pytest.fixture
def default_rules():
    return PriorityEngine._get_default_rules()


# ─── Urgency Score Tests ───────────────────────────────────────────────────────

class TestUrgencyScore:

    def test_critical_gets_max_score(self, engine, default_rules):
        score = engine.compute_urgency_score("critical", default_rules)
        assert score == 100.0, "Critical urgency should score 100"

    def test_high_gets_seventy(self, engine, default_rules):
        score = engine.compute_urgency_score("high", default_rules)
        assert score == 70.0

    def test_medium_gets_forty(self, engine, default_rules):
        score = engine.compute_urgency_score("medium", default_rules)
        assert score == 40.0

    def test_low_gets_ten(self, engine, default_rules):
        score = engine.compute_urgency_score("low", default_rules)
        assert score == 10.0

    def test_unknown_gets_neutral(self, engine, default_rules):
        # Unknown urgency → default 50.0 (neutral)
        score = engine.compute_urgency_score("unknown_level", default_rules)
        assert score == 50.0

    def test_urgency_order_maintained(self, engine, default_rules):
        """Critical must always score higher than high > medium > low."""
        scores = [
            engine.compute_urgency_score(level, default_rules)
            for level in ["critical", "high", "medium", "low"]
        ]
        assert scores == sorted(scores, reverse=True), \
            "Urgency scores must be in descending order: critical > high > medium > low"


# ─── Wait Time Score Tests ─────────────────────────────────────────────────────

class TestWaitTimeScore:

    def test_fresh_request_scores_low(self, engine):
        now = datetime.now(timezone.utc)
        score = engine.compute_wait_time_score(now)
        assert score < 10.0, "Request just submitted should score very low on wait time"

    def test_thirty_min_wait_scores_around_fifty(self, engine):
        thirty_min_ago = datetime.now(timezone.utc) - timedelta(minutes=30)
        score = engine.compute_wait_time_score(thirty_min_ago)
        # log(31) × 15 ≈ 51.6
        assert 45.0 < score < 60.0, f"30-minute wait should score ~51, got {score}"

    def test_score_capped_at_hundred(self, engine):
        very_old = datetime.now(timezone.utc) - timedelta(days=7)
        score = engine.compute_wait_time_score(very_old)
        assert score == 100.0, "Score should be capped at 100 for very old requests"

    def test_score_increases_with_time(self, engine):
        """Older requests must always score higher than newer ones."""
        times = [
            datetime.now(timezone.utc) - timedelta(minutes=m)
            for m in [5, 30, 60, 120, 240]
        ]
        scores = [engine.compute_wait_time_score(t) for t in times]
        assert scores == sorted(scores), "Wait time scores must increase with age"

    def test_logarithmic_growth(self, engine):
        """
        The score should grow logarithmically, not linearly.
        Going from 10→20 min should add MORE than going from 100→110 min.
        """
        score_10 = engine.compute_wait_time_score(
            datetime.now(timezone.utc) - timedelta(minutes=10)
        )
        score_20 = engine.compute_wait_time_score(
            datetime.now(timezone.utc) - timedelta(minutes=20)
        )
        score_100 = engine.compute_wait_time_score(
            datetime.now(timezone.utc) - timedelta(minutes=100)
        )
        score_110 = engine.compute_wait_time_score(
            datetime.now(timezone.utc) - timedelta(minutes=110)
        )

        gain_10_to_20 = score_20 - score_10
        gain_100_to_110 = score_110 - score_100

        assert gain_10_to_20 > gain_100_to_110, \
            "Early waiting should add more score than late waiting (logarithmic)"


# ─── Rarity Score Tests ────────────────────────────────────────────────────────

class TestRarityScore:

    def test_ab_neg_is_rarest(self, engine, default_rules):
        score = engine.compute_rarity_score("AB-", default_rules)
        assert score == 100.0, "AB- should have maximum rarity score"

    def test_o_pos_is_most_common(self, engine, default_rules):
        score = engine.compute_rarity_score("O+", default_rules)
        assert score == 10.0, "O+ should have minimum rarity score (most common)"

    def test_negative_rh_rarer_than_positive(self, engine, default_rules):
        """Rh-negative blood is always rarer than Rh-positive of same ABO group."""
        ab_neg = engine.compute_rarity_score("AB-", default_rules)
        ab_pos = engine.compute_rarity_score("AB+", default_rules)
        assert ab_neg > ab_pos

        b_neg = engine.compute_rarity_score("B-", default_rules)
        b_pos = engine.compute_rarity_score("B+", default_rules)
        assert b_neg > b_pos

    def test_unknown_blood_group_gets_neutral(self, engine, default_rules):
        score = engine.compute_rarity_score("XX", default_rules)
        assert score == 50.0


# ─── Proximity Score Tests ─────────────────────────────────────────────────────

class TestProximityScore:

    def test_same_location_scores_hundred(self, engine):
        coords = [73.8567, 18.5204]  # Pune, India
        score = engine.compute_proximity_score(coords, coords, max_radius_km=50.0)
        assert score == 100.0

    def test_at_max_radius_scores_zero(self, engine):
        # Request at exactly the max radius boundary
        # Pune centre [73.8567, 18.5204], ~50km north
        request_coords = [73.8567, 18.97]  # Roughly 50km north of Pune
        user_coords    = [73.8567, 18.5204]
        score = engine.compute_proximity_score(
            request_coords, user_coords, max_radius_km=50.0
        )
        assert score == 0.0 or score < 5.0  # Near zero at boundary

    def test_beyond_max_radius_scores_zero(self, engine):
        # Mumbai to Pune is ~150km
        mumbai = [72.8777, 19.0760]
        pune   = [73.8567, 18.5204]
        score = engine.compute_proximity_score(pune, mumbai, max_radius_km=50.0)
        assert score == 0.0, "Requests beyond max_radius should score 0"

    def test_score_decreases_with_distance(self, engine):
        """Closer requests must score higher."""
        pune_center = [73.8567, 18.5204]
        scores = []
        for km_offset in [0, 5, 10, 20, 40]:
            # Approximate 1 degree latitude ≈ 111 km
            offset_lat = 18.5204 + (km_offset / 111.0)
            scores.append(engine.compute_proximity_score(
                [73.8567, offset_lat], pune_center, max_radius_km=50.0
            ))
        assert scores == sorted(scores, reverse=True), \
            "Proximity score must decrease as distance increases"

    def test_haversine_pune_to_mumbai(self, engine):
        """
        Validate Haversine against Mumbai–Pune coordinates.
        Straight-line (great-circle) distance ≈ 120 km.
        Note: Road distance (~150 km) is longer — Haversine measures
        as-the-crow-flies distance, not road distance.
        """
        mumbai = [72.8777, 19.0760]
        pune   = [73.8567, 18.5204]
        distance = engine._haversine_distance(mumbai, pune)
        assert 110.0 < distance < 135.0, \
            f"Mumbai–Pune straight-line distance should be ~120km, got {distance:.1f}km"


# ─── Priority Queue Tests ──────────────────────────────────────────────────────

class TestBloodRequestPriorityQueue:

    def _make_request(self, req_id: str, score: float) -> dict:
        return {
            "_id": req_id,
            "patient_name": f"Patient {req_id}",
            "blood_group": "O-",
            "urgency_level": "critical",
            "priority_score": score,
            "created_at": datetime.now(timezone.utc),
        }

    def test_push_and_pop_single(self):
        q = BloodRequestPriorityQueue()
        req = self._make_request("req1", 75.0)
        q.push(req, 75.0)
        assert q.size == 1
        result = q.pop()
        assert result is not None
        assert result["_id"] == "req1"
        assert q.size == 0

    def test_highest_priority_pops_first(self):
        """Regardless of insertion order, highest score pops first."""
        q = BloodRequestPriorityQueue()
        q.push(self._make_request("low",    score=30.0), 30.0)
        q.push(self._make_request("high",   score=90.0), 90.0)
        q.push(self._make_request("medium", score=60.0), 60.0)

        assert q.pop()["_id"] == "high"
        assert q.pop()["_id"] == "medium"
        assert q.pop()["_id"] == "low"

    def test_peek_does_not_consume(self):
        q = BloodRequestPriorityQueue()
        req = self._make_request("req1", 85.0)
        q.push(req, 85.0)

        peeked = q.peek()
        assert peeked is not None
        assert q.size == 1, "Peek should NOT remove item from queue"

    def test_priority_update_reorders_queue(self):
        """Escalating a medium request should make it pop before high."""
        q = BloodRequestPriorityQueue()
        medium_req = self._make_request("medium", 45.0)
        high_req   = self._make_request("high",   80.0)

        q.push(medium_req, 45.0)
        q.push(high_req, 80.0)

        # Escalate medium request to 95
        medium_req["priority_score"] = 95.0
        q.update_priority(medium_req, 95.0)

        # Now medium (95) should pop before high (80)
        first = q.pop()
        assert first["_id"] == "medium", \
            "Escalated medium request should now be highest priority"

    def test_remove_by_id(self):
        q = BloodRequestPriorityQueue()
        req = self._make_request("req1", 70.0)
        q.push(req, 70.0)
        assert q.size == 1

        removed = q.remove("req1")
        assert removed is True
        assert q.size == 0

        popped = q.pop()
        assert popped is None, "Removed request should not be returned by pop"

    def test_empty_queue_returns_none(self):
        q = BloodRequestPriorityQueue()
        assert q.pop() is None
        assert q.peek() is None
        assert q.size == 0

    def test_size_excludes_lazy_deleted_entries(self):
        q = BloodRequestPriorityQueue()
        for i in range(5):
            q.push(self._make_request(f"req{i}", float(i * 10)), float(i * 10))
        assert q.size == 5

        # Remove 2 entries
        q.remove("req0")
        q.remove("req1")
        assert q.size == 3, "Size should exclude lazily deleted entries"

    def test_rebuild_from_list_uses_heapify(self):
        """rebuild_from_list should produce same ordering as sequential pushes."""
        q = BloodRequestPriorityQueue()
        requests_with_scores = [
            (self._make_request(f"req{i}", float(i * 15)), float(i * 15))
            for i in range(6)
        ]
        q.rebuild_from_list(requests_with_scores)
        assert q.size == 6

        # Verify descending pop order
        prev_score = float("inf")
        while not q.is_empty():
            doc = q.pop()
            score = doc["priority_score"]
            assert score <= prev_score, "Popped scores must be non-increasing"
            prev_score = score

    def test_get_top_n(self):
        q = BloodRequestPriorityQueue()
        scores = [10.0, 50.0, 90.0, 70.0, 30.0]
        for i, score in enumerate(scores):
            q.push(self._make_request(f"req{i}", score), score)

        top3 = q.get_top_n(3)
        assert len(top3) == 3
        assert top3[0]["priority_score"] == 90.0
        assert top3[1]["priority_score"] == 70.0
        assert top3[2]["priority_score"] == 50.0
        assert q.size == 5, "get_top_n should NOT modify the queue"


# ─── Integration: Full Priority Score ─────────────────────────────────────────

class TestFullPriorityComputation:
    """
    Tests the end-to-end compute_priority() method.
    DB is mocked — these test the scoring LOGIC, not MongoDB connectivity.
    """

    @pytest.mark.asyncio
    async def test_critical_ab_neg_scores_very_high(self, engine):
        """AB- critical request should score near the top of the range."""
        request = {
            "_id": "test1",
            "blood_group": "AB-",
            "urgency_level": "critical",
            "created_at": datetime.now(timezone.utc) - timedelta(minutes=60),
            "location": {"type": "Point", "coordinates": [73.8567, 18.5204]},
            "priority_score": 0.0,
        }
        user_coords = [73.8567, 18.5204]  # Same location = max proximity

        score = await engine.compute_priority(request, user_coords)
        assert score > 75.0, f"Critical AB- request should score > 75, got {score:.2f}"

    @pytest.mark.asyncio
    async def test_low_op_scores_low(self, engine):
        """O+ low urgency request submitted just now should score low."""
        request = {
            "_id": "test2",
            "blood_group": "O+",
            "urgency_level": "low",
            "created_at": datetime.now(timezone.utc),  # Just submitted
            "location": {"type": "Point", "coordinates": [72.8777, 19.0760]},
            "priority_score": 0.0,
        }
        # User is 150km away (Mumbai to Pune)
        user_coords = [73.8567, 18.5204]

        score = await engine.compute_priority(request, user_coords)
        assert score < 40.0, f"Low O+ far request should score < 40, got {score:.2f}"

    @pytest.mark.asyncio
    async def test_critical_beats_low_regardless_of_wait_time(self, engine):
        """Critical request just submitted must outrank very old low request."""
        fresh_critical = {
            "_id": "critical",
            "blood_group": "O+",
            "urgency_level": "critical",
            "created_at": datetime.now(timezone.utc),
            "location": {"type": "Point", "coordinates": [73.8567, 18.5204]},
            "priority_score": 0.0,
        }
        old_low = {
            "_id": "old_low",
            "blood_group": "O+",
            "urgency_level": "low",
            "created_at": datetime.now(timezone.utc) - timedelta(hours=12),
            "location": {"type": "Point", "coordinates": [73.8567, 18.5204]},
            "priority_score": 0.0,
        }
        user_coords = [73.8567, 18.5204]

        critical_score = await engine.compute_priority(fresh_critical, user_coords)
        low_score      = await engine.compute_priority(old_low, user_coords)

        assert critical_score > low_score, \
            (f"Fresh critical ({critical_score:.2f}) must outrank "
             f"12h-old low ({low_score:.2f})")

    @pytest.mark.asyncio
    async def test_score_bounded_between_zero_and_hundred(self, engine):
        """Score must always be in [0, 100] range."""
        for urgency in ["critical", "high", "medium", "low"]:
            for blood in ["AB-", "O-", "O+", "A+"]:
                request = {
                    "_id": "x",
                    "blood_group": blood,
                    "urgency_level": urgency,
                    "created_at": datetime.now(timezone.utc) - timedelta(hours=5),
                    "location": {"type": "Point", "coordinates": [73.8, 18.5]},
                    "priority_score": 0.0,
                }
                score = await engine.compute_priority(request, [73.8, 18.5])
                assert 0.0 <= score <= 100.0, \
                    f"Score out of bounds for {urgency}/{blood}: {score}"
