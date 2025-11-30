from pydantic import BaseModel
from typing import Optional
from datetime import date, datetime


class InventoryBase(BaseModel):
    center_id: int
    package_id: int
    quantity_on_hand: int = 0
    reorder_level: int = 50


class InventoryCreate(InventoryBase):
    pass


class InventoryUpdate(BaseModel):
    quantity_on_hand: Optional[int] = None
    reorder_level: Optional[int] = None


class InventoryResponse(InventoryBase):
    inventory_id: int
    last_restock_date: Optional[date] = None
    last_restock_quantity: Optional[int] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class RestockRequest(BaseModel):
    center_id: int
    package_id: int
    quantity: int
