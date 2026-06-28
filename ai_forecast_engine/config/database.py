"""
config/database.py
──────────────────
MongoDB connection using Motor (async driver) for the AI Forecast Engine.
Reuses the same connection pattern as the Priority Engine.
"""

import logging
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from config.settings import get_settings

logger = logging.getLogger(__name__)

_client: AsyncIOMotorClient | None = None


async def connect_db() -> AsyncIOMotorClient:
    """Create the Motor client and verify connectivity."""
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

    try:
        await _client.admin.command("ping")
        logger.info("✅ MongoDB connection established successfully")
    except Exception as exc:
        logger.error(f"❌ MongoDB connection failed: {exc}")
        raise

    return _client


async def close_db():
    """Close the Motor client gracefully."""
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
    """FastAPI dependency — injects the database handle into route handlers."""
    return get_client()[get_settings().mongodb_db_name]


# ─── Index Setup ──────────────────────────────────────────────────────────────

async def setup_indexes(db: AsyncIOMotorDatabase):
    """
    Create indexes for AI Forecast Engine collections.
    Idempotent — MongoDB ignores if index already exists.
    """
    logger.info("Setting up AI Forecast Engine indexes…")

    # blood_inventory: unique compound on (organization_id, blood_group)
    inv = db["blood_inventory"]
    await inv.create_index(
        [("organization_id", 1), ("blood_group", 1)],
        unique=True,
        name="org_blood_group_unique",
    )
    await inv.create_index(
        [("organization_type", 1)],
        name="org_type_index",
    )

    # blood_request_history: for training data queries
    hist = db["blood_request_history"]
    await hist.create_index(
        [("region", 1), ("request_date", -1)],
        name="region_date_index",
    )
    await hist.create_index(
        [("blood_group", 1)],
        name="blood_group_index",
    )

    # shortage_alerts: for fetching recent alerts
    alerts = db["shortage_alerts"]
    await alerts.create_index(
        [("created_at", -1)],
        name="alert_created_desc",
    )
    await alerts.create_index(
        [("region", 1), ("is_active", 1)],
        name="region_active_index",
    )

    logger.info("✅ AI Forecast Engine indexes created / verified")
