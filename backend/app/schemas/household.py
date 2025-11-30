from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import date, datetime
from enum import Enum


class IncomeLevel(str, Enum):
    no_income = "no_income"
    very_low = "very_low"
    low = "low"
    moderate = "moderate"


class PriorityLevel(str, Enum):
    critical = "critical"
    high = "high"
    medium = "medium"
    low = "low"


class HouseholdStatus(str, Enum):
    active = "active"
    inactive = "inactive"
    suspended = "suspended"


class HouseholdBase(BaseModel):
    family_name: str
    primary_contact_name: str
    phone_number: str
    email: Optional[EmailStr] = None
    address: str
    city: str
    state: str
    zip_code: str
    family_size: int
    income_level: IncomeLevel
    priority_level: PriorityLevel = PriorityLevel.medium
    registration_date: date
    last_verified_date: Optional[date] = None
    status: HouseholdStatus = HouseholdStatus.active
    notes: Optional[str] = None


class HouseholdCreate(HouseholdBase):
    pass


class HouseholdUpdate(BaseModel):
    family_name: Optional[str] = None
    primary_contact_name: Optional[str] = None
    phone_number: Optional[str] = None
    email: Optional[EmailStr] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    zip_code: Optional[str] = None
    family_size: Optional[int] = None
    income_level: Optional[IncomeLevel] = None
    priority_level: Optional[PriorityLevel] = None
    last_verified_date: Optional[date] = None
    status: Optional[HouseholdStatus] = None
    notes: Optional[str] = None


class HouseholdResponse(HouseholdBase):
    household_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
