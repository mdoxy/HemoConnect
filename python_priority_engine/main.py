"""
main.py
────────
FastAPI application entry point for HemoConnect Priority Engine.

This module:
  1. Defines the FastAPI app with lifespan events
  2. Handles startup: DB connect, index setup, queue build, scheduler start
  3. Handles shutdown: graceful cleanup
  4. Registers all routers
  5. Configures CORS to accept requests from the frontend + Node.js backend

Why FastAPI for this service?
  - Async by default (works naturally with Motor's async MongoDB driver)
  - Auto-generated OpenAPI docs at /docs (great for demos + interviews)
  - Pydantic validation is built in — no extra validation libraries
  - Lightweight: suitable for a final-year project without over-engineering
"""

from __future__ import annotations

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from config.database import close_db, connect_db, get_db, setup_indexes
from config.settings import get_settings
from routes.admin import router as admin_router
from routes.emergency import router as emergency_router
from services.escalation_service import EscalationService
from services.priority_engine import PriorityEngine
from services.priority_queue import BloodRequestPriorityQueue

# ─── Logging ──────────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger(__name__)


# ─── Lifespan (startup + shutdown) ────────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    FastAPI lifespan context manager.

    Everything BEFORE `yield` runs on startup.
    Everything AFTER `yield` runs on shutdown.

    This replaces the older @app.on_event("startup") decorator pattern.

    Startup sequence:
      1. Connect to MongoDB Atlas (async Motor client)
      2. Create indexes (idempotent — safe to run every startup)
      3. Instantiate priority engine (loads rules from DB lazily)
      4. Build in-memory priority queue from all pending DB requests
      5. Start APScheduler escalation background job
      6. Store everything in app.state for dependency injection
    """
    settings = get_settings()

    # ── Step 1: Connect to MongoDB ────────────────────────────────
    logger.info("🚀 HemoConnect Priority Engine starting up…")
    client = await connect_db()
    db = client[settings.mongodb_db_name]

    # ── Step 2: Create indexes ────────────────────────────────────
    await setup_indexes(db)

    # ── Step 3: Instantiate priority engine ───────────────────────
    engine = PriorityEngine(db)

    # ── Step 4: Build priority queue from MongoDB ─────────────────
    logger.info("Loading pending emergency requests into priority queue…")
    queue = BloodRequestPriorityQueue()

    cursor = db["emergency_requests"].find({"status": "pending"})
    pending_requests = await cursor.to_list(length=50_000)

    if pending_requests:
        # Compute scores for all pending requests (batch)
        requests_with_scores = []
        for req in pending_requests:
            score = float(req.get("priority_score", 0.0))
            if score == 0.0:
                # Recompute if score was never set (first run after migration)
                score = await engine.compute_priority(req)
            requests_with_scores.append((req, score))

        # heapify: O(n) — more efficient than n × push()
        queue.rebuild_from_list(requests_with_scores)
    
    logger.info(f"✅ Priority queue ready with {queue.size} active request(s)")

    # ── Step 5: Start escalation scheduler ───────────────────────
    escalation_svc = EscalationService(db, queue, engine)
    await escalation_svc.start(
        interval_minutes=settings.escalation_interval_minutes
    )

    # ── Step 6: Store in app.state for dependency injection ───────
    app.state.db                 = db
    app.state.priority_queue     = queue
    app.state.priority_engine    = engine
    app.state.escalation_service = escalation_svc

    logger.info("✅ HemoConnect Priority Engine is ready!")
    logger.info(f"   → API docs: http://localhost:{settings.port}/docs")
    logger.info(f"   → Health:   http://localhost:{settings.port}/api/health")

    # ── App runs here ─────────────────────────────────────────────
    yield

    # ── Shutdown ──────────────────────────────────────────────────
    logger.info("🛑 HemoConnect Priority Engine shutting down…")
    await escalation_svc.stop()
    await close_db()
    logger.info("Shutdown complete")


# ─── FastAPI App ───────────────────────────────────────────────────────────────

app = FastAPI(
    title="HemoConnect Priority Engine",
    description=(
        "Priority-based emergency blood request management API.\n\n"
        "Provides:\n"
        "- Dynamic priority scoring (urgency + wait time + rarity + proximity)\n"
        "- Heap-based priority queue (O(log n) operations)\n"
        "- Geospatial emergency visibility (MongoDB 2dsphere)\n"
        "- Automatic priority escalation (APScheduler)\n"
        "- Fully configurable scoring rules (stored in MongoDB)"
    ),
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",       # Swagger UI — great for demo
    redoc_url="/redoc",     # ReDoc alternative
)

# ─── CORS Middleware ───────────────────────────────────────────────────────────

settings = get_settings()
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.origins_list,   # From .env ALLOWED_ORIGINS
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Routers ───────────────────────────────────────────────────────────────────

app.include_router(emergency_router)
app.include_router(admin_router)


# ─── Health Check ─────────────────────────────────────────────────────────────

@app.get("/api/health", tags=["Health"])
async def health_check():
    """
    Lightweight health check endpoint.

    Used by:
      - Docker health checks
      - Load balancers
      - CI/CD pipelines to verify service is running
      - Development: quick sanity check

    Returns queue size so monitors can alert if it grows too large.
    """
    try:
        queue: BloodRequestPriorityQueue = app.state.priority_queue
        queue_size = queue.size
        db_connected = True
    except AttributeError:
        queue_size = -1
        db_connected = False

    return {
        "status":       "healthy" if db_connected else "degraded",
        "service":      "HemoConnect Priority Engine",
        "version":      "1.0.0",
        "db_connected": db_connected,
        "queue_size":   queue_size,
    }


@app.get("/", tags=["Health"])
async def root():
    return {
        "service": "HemoConnect Priority Engine",
        "docs":    "/docs",
        "health":  "/api/health",
    }


# ─── Entry Point ───────────────────────────────────────────────────────────────

if __name__ == "__main__":
    import uvicorn

    s = get_settings()
    uvicorn.run(
        "main:app",
        host=s.host,
        port=s.port,
        reload=True,     # Auto-reload on code changes (development only)
        log_level="info",
    )
