"""
config/database.py
──────────────────
MongoDB connection using Motor (async driver).

Motor is the async version of PyMongo, designed to work with asyncio
and FastAPI's event loop without blocking. All DB operations are
`await`-able, keeping the API non-blocking.

Connection strategy:
  - One shared AsyncIOMotorClient per application lifetime
  - Created on startup, closed on shutdown (FastAPI lifespan)
  - All route handlers receive `db` via dependency injection
"""

import logging
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from config.settings import get_settings

logger = logging.getLogger(__name__)

# Module-level client — shared across all requests
_client: AsyncIOMotorClient | None = None


async def connect_db() -> AsyncIOMotorClient:
    """
    Create the Motor client and verify connectivity with a ping.
    Called once during FastAPI startup (lifespan).
    """
    global _client
    settings = get_settings()

    logger.info("Connecting to MongoDB Atlas…")
    import certifi
    _client = AsyncIOMotorClient(
        settings.mongodb_uri,
        serverSelectionTimeoutMS=30000,
        connectTimeoutMS=30000,
        tlsCAFile=certifi.where()
    )

    # Verify connection with a lightweight ping
    try:
        await _client.admin.command("ping")
        logger.info("✅ MongoDB connection established successfully")
    except Exception as exc:
        logger.error(f"❌ MongoDB connection failed: {exc}")
        raise

    return _client


async def close_db():
    """
    Close the Motor client gracefully.
    Called during FastAPI shutdown (lifespan).
    """
    global _client
    if _client:
        _client.close()
        logger.info("MongoDB connection closed")


def get_client() -> AsyncIOMotorClient:
    """Return the shared Motor client (must be called after connect_db)."""
    if _client is None:
        raise RuntimeError("Database not initialised. Call connect_db() first.")
    return _client


def get_db() -> AsyncIOMotorDatabase:
    """
    FastAPI dependency — injects the database handle into route handlers.

    Usage in routes:
        @router.get("/example")
        async def example(db: AsyncIOMotorDatabase = Depends(get_db)):
            ...
    """
    return get_client()[get_settings().mongodb_db_name]


# ─── Index Setup ──────────────────────────────────────────────────────────────

async def setup_indexes(db: AsyncIOMotorDatabase):
    """
    Create all required MongoDB indexes on startup.

    Idempotent — MongoDB ignores index creation if the index already exists.

    Index rationale:
      1. 2dsphere     → enables $near / $geoWithin geospatial queries
      2. status+score → compound index for "pending requests by priority"
      3. user_id      → fast lookup of a user's own requests
      4. blood_group  → filter by blood type without full scan
      5. escalation   → APScheduler job query (old pending requests)
      6. TTL          → auto-delete fulfilled requests after 30 days
      7. scoring_rules→ quick fetch of the single active rule document
    """
    logger.info("Setting up MongoDB indexes…")

    br = db["emergency_requests"]  # emergency blood requests collection

    # 1. Geospatial index (REQUIRED for $near queries)
    await br.create_index(
        [("location", "2dsphere")],
        name="geo_2dsphere",
    )

    # 2. Compound: status + priority_score  (most frequent hospital query)
    await br.create_index(
        [("status", 1), ("priority_score", -1)],
        name="status_priority_compound",
    )

    # 3. User's own requests
    await br.create_index(
        [("submitted_by", 1), ("created_at", -1)],
        name="user_requests_by_date",
    )

    # 4. Blood group + status + priority  (donor matching)
    await br.create_index(
        [("blood_group", 1), ("status", 1), ("priority_score", -1)],
        name="blood_group_status_priority",
    )

    # 5. Escalation job: find old pending requests efficiently
    await br.create_index(
        [("status", 1), ("created_at", 1), ("escalation_count", 1)],
        name="escalation_query_index",
    )

    # 6. TTL: automatically remove fulfilled requests after 30 days
    await br.create_index(
        [("updated_at", 1)],
        expireAfterSeconds=30 * 24 * 3600,    # 30 days
        partialFilterExpression={"status": "fulfilled"},
        name="ttl_fulfilled_requests",
    )

    # 7. Scoring rules — fast active-rule lookup
    await db["scoring_rules"].create_index(
        [("is_active", 1)],
        name="active_scoring_rule",
    )

    logger.info("✅ All indexes created / verified")
