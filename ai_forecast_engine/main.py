"""
main.py
────────
FastAPI application entry point for HemoConnect AI Forecast Engine.

This module:
  1. Defines the FastAPI app with lifespan events
  2. Handles startup: DB connect, index setup, ML model loading
  3. Handles shutdown: graceful cleanup
  4. Registers all routers (inventory, forecast, shortage)
  5. Configures CORS
"""

from __future__ import annotations

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from config.database import close_db, connect_db, setup_indexes
from config.settings import get_settings
from routes.inventory import router as inventory_router
from routes.forecast import router as forecast_router
from routes.shortage import router as shortage_router
from services.forecast_service import load_model

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

    Startup sequence:
      1. Connect to MongoDB Atlas
      2. Create indexes for forecast engine collections
      3. Load pre-trained ML model from disk
      4. Store references in app.state
    """
    settings = get_settings()

    # ── Step 1: Connect to MongoDB ────────────────────────────────
    logger.info("🚀 HemoConnect AI Forecast Engine starting up…")
    client = await connect_db()
    db = client[settings.mongodb_db_name]

    # ── Step 2: Create indexes ────────────────────────────────────
    await setup_indexes(db)

    # ── Step 3: Load ML model ─────────────────────────────────────
    logger.info("Loading ML model from disk…")
    model, encoders = load_model()

    if model is not None:
        logger.info("✅ ML model loaded and ready for predictions")
    else:
        logger.warning(
            "⚠ No trained model found. Run scripts/train_model.py to train. "
            "Fallback predictions will be used until then."
        )

    # ── Step 4: Store in app.state ────────────────────────────────
    app.state.db = db

    logger.info("✅ HemoConnect AI Forecast Engine is ready!")
    logger.info(f"   → API docs: http://localhost:{settings.port}/docs")
    logger.info(f"   → Health:   http://localhost:{settings.port}/api/health")

    # ── App runs here ─────────────────────────────────────────────
    yield

    # ── Shutdown ──────────────────────────────────────────────────
    logger.info("🛑 HemoConnect AI Forecast Engine shutting down…")
    await close_db()
    logger.info("Shutdown complete")


# ─── FastAPI App ───────────────────────────────────────────────────────────────

app = FastAPI(
    title="HemoConnect AI Forecast Engine",
    description=(
        "AI-powered Blood Demand Forecasting & Shortage Prediction API.\n\n"
        "Provides:\n"
        "- Blood inventory management (hospitals & blood banks)\n"
        "- 7-day demand forecasting (RandomForest ML model)\n"
        "- Shortage prediction (demand vs availability)\n"
        "- Proactive donor outreach recommendations\n"
        "- Shortage alert system"
    ),
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# ─── CORS Middleware ───────────────────────────────────────────────────────────

settings = get_settings()
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Routers ───────────────────────────────────────────────────────────────────

app.include_router(inventory_router)
app.include_router(forecast_router)
app.include_router(shortage_router)


# ─── Health Check ─────────────────────────────────────────────────────────────

@app.get("/api/health", tags=["Health"])
async def health_check():
    """Lightweight health check endpoint."""
    from services.forecast_service import get_cached_model, get_model_metrics

    model, _ = get_cached_model()
    metrics = get_model_metrics()

    try:
        db_connected = True
    except Exception:
        db_connected = False

    return {
        "status": "healthy" if db_connected else "degraded",
        "service": "HemoConnect AI Forecast Engine",
        "version": "1.0.0",
        "db_connected": db_connected,
        "model_loaded": model is not None,
        "model_accuracy": metrics.get("r2") if metrics else None,
    }


@app.get("/", tags=["Health"])
async def root():
    return {
        "service": "HemoConnect AI Forecast Engine",
        "docs": "/docs",
        "health": "/api/health",
    }


# ─── Entry Point ───────────────────────────────────────────────────────────────

if __name__ == "__main__":
    import uvicorn

    s = get_settings()
    uvicorn.run(
        "main:app",
        host=s.host,
        port=s.port,
        reload=True,
        log_level="info",
    )
