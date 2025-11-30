from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from decimal import Decimal
from enum import Enum


class PackageCategory(str, Enum):
    food = "food"
    medical = "medical"
    shelter = "shelter"
    hygiene = "hygiene"
    education = "education"
    emergency = "emergency"


class AidPackageBase(BaseModel):
    package_name: str
    description: Optional[str] = None
    category: PackageCategory
    unit_weight_kg: Optional[Decimal] = None
    estimated_cost: Decimal
    validity_period_days: int = 30
    is_active: bool = True


class AidPackageCreate(AidPackageBase):
    pass


class AidPackageUpdate(BaseModel):
    package_name: Optional[str] = None
    description: Optional[str] = None
    category: Optional[PackageCategory] = None
    unit_weight_kg: Optional[Decimal] = None
    estimated_cost: Optional[Decimal] = None
    validity_period_days: Optional[int] = None
    is_active: Optional[bool] = None


class AidPackageResponse(AidPackageBase):
    package_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
