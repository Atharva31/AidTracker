"""
Distribution API Routes - Core functionality with concurrency control
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from typing import List
from datetime import datetime

from app.core.database import get_db
from app.schemas.distribution import (
    DistributionRequest,
    DistributionResponse,
    EligibilityCheckRequest,
    EligibilityCheckResponse,
    DistributionLogResponse
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
    logs = db.query(DistributionLog).options(
        joinedload(DistributionLog.household),
        joinedload(DistributionLog.package),
        joinedload(DistributionLog.center)
    ).order_by(
        DistributionLog.distribution_date.desc()
    ).offset(offset).limit(limit).all()

    return {
        "logs": [DistributionLogResponse.model_validate(log) for log in logs],
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


@router.delete("/test/reset")
def reset_test_data(
    household_ids: List[int] = [6, 7],
    package_id: int = 1,
    db: Session = Depends(get_db)
):
    """
    Reset test data by deleting recent distribution logs for test households
    This allows the concurrency demo to be run multiple times
    """
    try:
        deleted_count = db.query(DistributionLog).filter(
            DistributionLog.household_id.in_(household_ids),
            DistributionLog.package_id == package_id
        ).delete(synchronize_session=False)
        
        db.commit()
        
        return {
            "status": "success",
            "message": f"Deleted {deleted_count} test distribution logs",
            "household_ids": household_ids,
            "package_id": package_id
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
