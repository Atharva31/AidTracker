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
