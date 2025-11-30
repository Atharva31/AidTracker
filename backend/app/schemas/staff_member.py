from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import date, datetime
from enum import Enum


class StaffRole(str, Enum):
    admin = "admin"
    manager = "manager"
    worker = "worker"
    volunteer = "volunteer"


class StaffStatus(str, Enum):
    active = "active"
    inactive = "inactive"
    on_leave = "on_leave"


class StaffMemberBase(BaseModel):
    first_name: str
    last_name: str
    email: EmailStr
    phone_number: Optional[str] = None
    role: StaffRole = StaffRole.worker
    center_id: Optional[int] = None
    hire_date: date
    status: StaffStatus = StaffStatus.active


class StaffMemberCreate(StaffMemberBase):
    pass


class StaffMemberUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone_number: Optional[str] = None
    role: Optional[StaffRole] = None
    center_id: Optional[int] = None
    status: Optional[StaffStatus] = None


class StaffMemberResponse(StaffMemberBase):
    staff_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
