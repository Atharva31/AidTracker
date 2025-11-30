"""
Distribution API Routes - Core functionality with concurrency control
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime

from app.core.database import get_db
from app.schemas.distribution import (
    DistributionRequest,
    DistributionResponse,
    EligibilityCheckRequest,
    EligibilityCheckResponse
)
from app.services.distribution_service import DistributionService
from app.models import DistributionLog

router = APIRouter(prefix="/distribution", tags=["Distribution"])


@router.post("/distribute", response_model=DistributionResponse)
def distribute_package(
    request: DistributionRequest,
    db: Session = Depends(get_db)
):
    """
    Distribute aid package to household

    This endpoint implements ACID transactions with pessimistic locking
    to prevent race conditions when multiple workers distribute simultaneously.

    Uses SELECT ... FOR UPDATE to lock inventory rows during distribution.
    """
    status, message, log_id = DistributionService.distribute_package(
        db=db,
        household_id=request.household_id,
        package_id=request.package_id,
        center_id=request.center_id,
        staff_id=request.staff_id,
        quantity=request.quantity
    )

    if status == "error":
        raise HTTPException(status_code=400, detail=message)

    return DistributionResponse(
        status=status,
        message=message,
        log_id=log_id,
        distribution_date=datetime.now()
    )


@router.post("/check-eligibility", response_model=EligibilityCheckResponse)
def check_eligibility(
    request: EligibilityCheckRequest,
    db: Session = Depends(get_db)
):
    """
    Check if household is eligible for a package

    Read-only operation - no locking required
    """
    eligible, message = DistributionService.check_eligibility(
        db=db,
        household_id=request.household_id,
        package_id=request.package_id
    )

    return EligibilityCheckResponse(
        eligible=eligible,
        message=message,
        household_id=request.household_id,
        package_id=request.package_id
    )


@router.get("/logs")
def get_distribution_logs(
    limit: int = 100,
    offset: int = 0,
    db: Session = Depends(get_db)
):
    """
    Get distribution logs (audit trail)
    """
    logs = db.query(DistributionLog).order_by(
        DistributionLog.distribution_date.desc()
    ).offset(offset).limit(limit).all()

    return {
        "logs": logs,
        "total": db.query(DistributionLog).count(),
        "limit": limit,
        "offset": offset
    }


@router.get("/logs/household/{household_id}")
def get_household_distribution_history(
    household_id: int,
    db: Session = Depends(get_db)
):
    """
    Get distribution history for a specific household
    """
    logs = db.query(DistributionLog).filter(
        DistributionLog.household_id == household_id
    ).order_by(DistributionLog.distribution_date.desc()).all()

    return {
        "household_id": household_id,
        "distributions": logs,
        "total": len(logs)
    }
