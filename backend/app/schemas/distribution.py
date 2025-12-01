from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class DistributionRequest(BaseModel):
    """Request to distribute aid package to household"""
    household_id: int
    package_id: int
    center_id: int
    staff_id: Optional[int] = None
    quantity: int = 1


class DistributionResponse(BaseModel):
    """Response after distribution attempt"""
    status: str  # 'success' or 'error'
    message: str
    log_id: Optional[int] = None
    distribution_date: Optional[datetime] = None


class EligibilityCheckRequest(BaseModel):
    """Request to check if household is eligible for a package"""
    household_id: int
    package_id: int


class EligibilityCheckResponse(BaseModel):
    """Response with eligibility information"""
    eligible: bool
    message: str
    household_id: int
    package_id: int


class DistributionLogResponse(BaseModel):
    """Distribution log entry with details"""
    log_id: int
    distribution_date: datetime
    transaction_status: str
    household_id: int
    package_id: int
    center_id: int
    quantity_distributed: int
    
    # Flattened fields from properties
    household_contact: Optional[str] = None
    package_name: Optional[str] = None
    center_name: Optional[str] = None

    class Config:
        from_attributes = True
