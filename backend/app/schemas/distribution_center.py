from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime
from enum import Enum


class CenterStatus(str, Enum):
    active = "active"
    inactive = "inactive"
    maintenance = "maintenance"


class DistributionCenterBase(BaseModel):
    center_name: str
    address: str
    city: str
    state: str
    zip_code: str
    phone_number: Optional[str] = None
    email: Optional[EmailStr] = None
    capacity: int = 1000
    status: CenterStatus = CenterStatus.active


class DistributionCenterCreate(DistributionCenterBase):
    pass


class DistributionCenterUpdate(BaseModel):
    center_name: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    zip_code: Optional[str] = None
    phone_number: Optional[str] = None
    email: Optional[EmailStr] = None
    capacity: Optional[int] = None
    status: Optional[CenterStatus] = None


class DistributionCenterResponse(DistributionCenterBase):
    center_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
