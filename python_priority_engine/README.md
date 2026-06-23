# python_priority_engine — HemoConnect Priority Engine

A standalone Python microservice that adds **priority-based emergency blood request management** to the HemoConnect platform.

## What this service does

| Feature | Implementation |
|---|---|
| Dynamic priority scoring | `services/priority_engine.py` — 4-factor weighted score |
| Configurable rules | `scoring_rules` MongoDB collection — zero hardcoding |
| Heap-based queue | `services/priority_queue.py` — Python `heapq`, O(log n) |
| Geospatial visibility | `services/geo_service.py` — MongoDB `$near` + 2dsphere |
| Auto escalation | `services/escalation_service.py` — APScheduler background job |
| FastAPI REST API | `routes/emergency.py` + `routes/admin.py` |

## Directory structure

```
python_priority_engine/
├── main.py                        # FastAPI app entry point + lifespan
├── requirements.txt               # Python dependencies
├── pytest.ini                     # Test configuration
├── .env.example                   # Environment variable template
├── config/
│   ├── settings.py                # pydantic-settings config loader
│   └── database.py                # Motor (async MongoDB) + index setup
├── models/
│   └── schemas.py                 # Pydantic request/response schemas
├── services/
│   ├── priority_engine.py         # Scoring: urgency + wait + rarity + proximity
│   ├── priority_queue.py          # heapq-based max-priority queue
│   ├── escalation_service.py      # APScheduler auto-escalation job
│   └── geo_service.py             # MongoDB $near / $geoNear queries
├── routes/
│   ├── emergency.py               # Emergency request API endpoints
│   └── admin.py                   # Scoring rules + admin endpoints
├── scripts/
│   └── seed_scoring_rules.py      # One-time DB seeder
└── tests/
    └── test_priority_engine.py    # Unit + integration tests (no DB needed)
```

## Setup (step by step)

### Prerequisites
- Python 3.11+
- MongoDB Atlas (same cluster as the Node.js backend)

### 1. Create virtual environment

```bash
cd python_priority_engine
python -m venv venv

# Windows
venv\Scripts\activate

# macOS / Linux
source venv/bin/activate
```

### 2. Install dependencies

```bash
pip install -r requirements.txt
# Also install pytest-asyncio for running async tests
pip install pytest-asyncio
```

### 3. Configure environment

The `.env` file is pre-configured with your Atlas URI. Verify it:

```bash
# .env should contain:
MONGODB_URI=mongodb+srv://...
MONGODB_DB_NAME=Hemoconnect
JWT_SECRET=your_secret_key
PORT=8000
```

### 4. Seed scoring rules into MongoDB (run ONCE)

```bash
python scripts/seed_scoring_rules.py
```

### 5. Start the service

```bash
uvicorn main:app --reload --port 8000
```

### 6. Open API docs

```
http://localhost:8000/docs
```

## Running tests

```bash
python -m pytest tests/ -v
```

## Key API endpoints

| Method | Path | Description |
|---|---|---|
| POST | `/api/emergency/request` | Submit emergency blood request |
| GET | `/api/emergency/nearby` | Get nearby requests (donor view) |
| GET | `/api/emergency/nearby/distance` | Same + includes distance_km |
| GET | `/api/emergency/queue` | Hospital processing queue |
| GET | `/api/emergency/zone-snapshot` | Map urgency heatmap data |
| PUT | `/api/emergency/request/{id}/status` | Update request status |
| GET | `/api/admin/scoring-rules` | View current scoring weights |
| PUT | `/api/admin/scoring-rules/weights` | Update weights (no redeploy!) |
| POST | `/api/admin/scoring-rules/seed` | Seed default rules |
| POST | `/api/admin/escalation/trigger` | Manual escalation trigger |
| POST | `/api/admin/queue/rebuild` | Rebuild heap from MongoDB |
| GET | `/api/health` | Health check |

## How priority scoring works

```
Priority Score (0–100) = 
    urgency_score   × 0.40   (from DB urgency_scores mapping)
  + wait_time_score × 0.25   (logarithmic growth: min(100, log(1+min) × 15))
  + rarity_score    × 0.20   (from DB rarity_scores mapping)
  + proximity_score × 0.15   (linear decay: (1 - dist/max_radius) × 100)

All weights and mappings are stored in MongoDB scoring_rules collection.
Change them via PUT /api/admin/scoring-rules/weights — zero code changes.
```

## Architecture with existing Node.js backend

```
Frontend (React/Vite :5173)
       │
       ├─── Node.js backend (:5000)    ← existing auth, donors, requests
       │         │
       │         └── MongoDB Atlas (shared Hemoconnect database)
       │                    │
       └─── Python priority engine (:8000)  ← this service
                  │
                  └── MongoDB Atlas (same database, reads emergency_requests)
```

The Python service connects to the **same MongoDB Atlas database** as the Node.js backend. They share the same `Hemoconnect` database but use different collections:
- Node.js uses: `requests`, `donors`, `users`, `hospitals`
- Python uses: `emergency_requests`, `scoring_rules`
