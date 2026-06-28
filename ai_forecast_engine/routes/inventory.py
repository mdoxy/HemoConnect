"""
routes/inventory.py
────────────────────
API endpoints for blood inventory management.

Access: Hospitals and Blood Banks only.
"""

from __future__ import annotations

import logging

from fastapi import APIRouter, HTTPException, Request

from models.schemas import (
    InventoryUpdateRequest,
)
from services import inventory_service

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/inventory", tags=["Blood Inventory"])


def get_db(request: Request):
    """Inject MongoDB database from app state."""
    return request.app.state.db


# ─── Routes ───────────────────────────────────────────────────────────────────

@router.post("/update")
async def update_inventory(
    payload: InventoryUpdateRequest,
    http_request: Request,
):
    """
    Update blood availability for an organization.

    Accepts multiple blood group entries at once.
    Uses upsert — safe to call repeatedly.
    """
    db = get_db(http_request)

    items = [
        {"blood_group": item.blood_group.value, "available_units": item.available_units}
        for item in payload.items
    ]

    results = await inventory_service.bulk_upsert_inventory(
        db=db,
        organization_id=payload.organization_id,
        organization_type=payload.organization_type.value,
        items=items,
    )

    return {
        "success": True,
        "message": f"Updated {len(results)} blood group entries",
        "results": results,
    }


@router.get("/{org_id}")
async def get_organization_inventory(
    org_id: str,
    http_request: Request,
):
    """Get all blood inventory entries for a specific organization."""
    db = get_db(http_request)

    inventory = await inventory_service.get_inventory_by_org(db, org_id)

    return {
        "success": True,
        "organization_id": org_id,
        "inventory": inventory,
    }


@router.get("/aggregated/all")
async def get_aggregated_inventory(
    region: str = "Pune",
    http_request: Request = None,
):
    """
    Get total blood inventory aggregated across all organizations.
    Returns total units per blood group.
    """
    db = get_db(http_request)

    inventory = await inventory_service.get_aggregated_inventory(db, region)

    return {
        "success": True,
        "region": region,
        "inventory": inventory,
    }
