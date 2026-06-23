"""
services/escalation_service.py
────────────────────────────────
Automatic Priority Escalation — prevents requests from being forgotten.

Problem: A "medium" urgency request submitted 12 hours ago should not
         always rank below a fresh "high" request. Time must matter.

Solution: APScheduler fires a background job every N minutes (configurable
          from MongoDB). It finds pending requests older than a threshold
          and boosts their priority_score by a configurable amount.

Think of it like a hospital waiting room number board:
  - When you arrive, you get number 42 (your initial score)
  - Every 15 minutes, the board bumps everyone's number up a bit
  - This ensures no one waits forever, regardless of initial urgency

──────────────────────────────────────────────────────────────────────
APScheduler choice for Final Year Project:
  - Simple, no external services needed (no Redis, no Celery)
  - Runs within the same FastAPI process
  - AsyncIOScheduler works with asyncio event loop (FastAPI's loop)
  - For production scale: replace with Celery + Redis for distributed jobs
──────────────────────────────────────────────────────────────────────
"""

from __future__ import annotations

import logging
from datetime import datetime, timedelta, timezone
from typing import TYPE_CHECKING

from apscheduler.schedulers.asyncio import AsyncIOScheduler

if TYPE_CHECKING:
    from motor.motor_asyncio import AsyncIOMotorDatabase
    from services.priority_engine import PriorityEngine
    from services.priority_queue import BloodRequestPriorityQueue

logger = logging.getLogger(__name__)


class EscalationService:
    """
    Background job manager for automatic priority escalation.

    Lifecycle:
      start()  → called during FastAPI startup
      stop()   → called during FastAPI shutdown
      run_escalation() → the actual job, fired by APScheduler

    All configuration (interval, threshold, boost) is loaded from MongoDB
    on each run, so changing escalation rules takes effect immediately
    without restarting the service.
    """

    def __init__(
        self,
        db: "AsyncIOMotorDatabase",
        priority_queue: "BloodRequestPriorityQueue",
        priority_engine: "PriorityEngine",
    ):
        self.db = db
        self.queue = priority_queue
        self.engine = priority_engine
        self.scheduler = AsyncIOScheduler()
        self._job_id = "hemoconnect_escalation"

    async def start(self, interval_minutes: int = 15):
        """
        Start the escalation background job.

        The interval_minutes parameter is used as an initial default.
        The actual interval is pulled from MongoDB rules on each run.

        AsyncIOScheduler runs in the same event loop as FastAPI —
        no extra threads, no blocking.
        """
        # Try to get interval from active DB rules, fall back to param
        try:
            rules = await self.engine.get_active_rules()
            interval = rules["escalation_config"]["check_interval_minutes"]
        except Exception:
            interval = interval_minutes

        self.scheduler.add_job(
            self.run_escalation,
            trigger="interval",
            minutes=interval,
            id=self._job_id,
            max_instances=1,    # Prevent overlapping runs if job takes too long
            misfire_grace_time=60,  # Allow up to 60s late start before skipping
        )

        self.scheduler.start()
        logger.info(
            f"✅ Escalation scheduler started — "
            f"runs every {interval} minutes (Job ID: {self._job_id})"
        )

    async def stop(self):
        """Gracefully stop APScheduler on FastAPI shutdown."""
        if self.scheduler.running:
            self.scheduler.shutdown(wait=False)
            logger.info("Escalation scheduler stopped")

    async def run_escalation(self):
        """
        Core escalation logic — called automatically by APScheduler.

        Step-by-step:
          1. Load fresh config from MongoDB (catches any rule changes)
          2. Find ALL pending requests older than threshold_minutes
          3. For each: add boost to priority_score (capped at 100)
          4. Update score in MongoDB (durable — survives restart)
          5. Update score in in-memory heap (immediate effect on queue)

        MongoDB query uses the compound index:
          (status, created_at, escalation_count)
        which was created in setup_indexes().
        """
        logger.info("🔔 Running priority escalation job…")

        try:
            # Load fresh config from DB (invalidate cache to pick up changes)
            self.engine.invalidate_cache()
            rules = await self.engine.get_active_rules()
            config = rules["escalation_config"]

            threshold_minutes  = config["escalation_threshold_minutes"]
            boost_amount       = float(config["escalation_boost"])
            max_escalations    = int(config["max_escalations"])

            # Cutoff: requests older than threshold are eligible for escalation
            cutoff_time = datetime.now(timezone.utc) - timedelta(minutes=threshold_minutes)

            # Query: pending + old + not maxed out
            query = {
                "status":           "pending",
                "created_at":       {"$lt": cutoff_time},
                "escalation_count": {"$lt": max_escalations},
            }

            cursor = self.db["emergency_requests"].find(query)
            escalated_count = 0

            async for request in cursor:
                old_score = float(request.get("priority_score", 0.0))
                new_score = min(old_score + boost_amount, 100.0)

                # ── Update in MongoDB ──────────────────────────────
                await self.db["emergency_requests"].update_one(
                    {"_id": request["_id"]},
                    {
                        "$set": {
                            "priority_score": new_score,
                            "updated_at":     datetime.now(timezone.utc),
                        },
                        "$inc": {"escalation_count": 1},
                    },
                )

                # ── Update in in-memory priority queue ─────────────
                # update_priority uses lazy deletion + re-insert: O(log n)
                request["priority_score"] = new_score
                self.queue.update_priority(request, new_score)

                escalated_count += 1

                logger.debug(
                    f"Escalated {str(request['_id'])[:8]}… | "
                    f"{old_score:.1f} → {new_score:.1f} | "
                    f"count={request.get('escalation_count', 0) + 1}"
                )

            logger.info(
                f"✅ Escalation complete — "
                f"{escalated_count} request(s) boosted by +{boost_amount} pts | "
                f"threshold={threshold_minutes}min | max={max_escalations}"
            )

        except Exception as exc:
            # Never let the escalation job crash the scheduler
            logger.error(f"❌ Escalation job failed: {exc}", exc_info=True)

    async def trigger_manual_escalation(self) -> int:
        """
        Manually trigger an escalation run (used by admin endpoint).
        Returns the number of requests escalated.

        Useful for testing or when an operator spots a stuck request.
        """
        logger.info("Manual escalation triggered by admin")
        await self.run_escalation()
        return self.queue.size
