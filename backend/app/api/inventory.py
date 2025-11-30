"""
Inventory API Routes
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import List

from app.core.database import get_db
from app.models import Inventory
from app.schemas.inventory import (
    InventoryCreate,
    InventoryUpdate,
    InventoryResponse,
    RestockRequest
)
from app.services.distribution_service import DistributionService

router = APIRouter(prefix="/inventory", tags=["Inventory"])


@router.get("", response_model=List[InventoryResponse])
def get_inventory(
    skip: int = 0,
    limit: int = 100,
    center_id: int = None,
    low_stock: bool = False,
    db: Session = Depends(get_db)
):
    """Get inventory records"""
    query = db.query(Inventory)

    if center_id:
        query = query.filter(Inventory.center_id == center_id)

    if low_stock:
        query = query.filter(Inventory.quantity_on_hand <= Inventory.reorder_level)

    inventory = query.offset(skip).limit(limit).all()
    return inventory


@router.get("/status")
def get_inventory_status(db: Session = Depends(get_db)):
    """Get inventory status from view"""
    result = db.execute(text("""
        SELECT * FROM vw_current_inventory_status
        ORDER BY stock_status, center_name
    """))

    rows = result.fetchall()
    columns = result.keys()

    return {
        "inventory": [dict(zip(columns, row)) for row in rows],
        "total": len(rows)
    }


@router.get("/low-stock")
def get_low_stock_alerts(db: Session = Depends(get_db)):
    """Get low stock and out of stock items"""
    result = db.execute(text("""
        SELECT * FROM vw_current_inventory_status
        WHERE stock_status IN ('LOW_STOCK', 'OUT_OF_STOCK')
        ORDER BY stock_status, quantity_on_hand
    """))

    rows = result.fetchall()
    columns = result.keys()

    return {
        "alerts": [dict(zip(columns, row)) for row in rows],
        "total": len(rows)
    }


@router.post("/restock")
def restock_inventory(
    request: RestockRequest,
    db: Session = Depends(get_db)
):
    """Add inventory to a center"""
    status, message = DistributionService.restock_inventory(
        db=db,
        center_id=request.center_id,
        package_id=request.package_id,
        quantity=request.quantity
    )

    if status == "error":
        raise HTTPException(status_code=400, detail=message)

    return {"status": status, "message": message}


@router.get("/{inventory_id}", response_model=InventoryResponse)
def get_inventory_item(inventory_id: int, db: Session = Depends(get_db)):
    """Get a specific inventory record"""
    inventory = db.query(Inventory).filter(
        Inventory.inventory_id == inventory_id
    ).first()

    if not inventory:
        raise HTTPException(status_code=404, detail="Inventory record not found")

    return inventory
