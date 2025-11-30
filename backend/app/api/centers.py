"""
Distribution Centers API Routes
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.models import DistributionCenter
from app.schemas.distribution_center import (
    DistributionCenterCreate,
    DistributionCenterUpdate,
    DistributionCenterResponse
)

router = APIRouter(prefix="/centers", tags=["Distribution Centers"])


@router.get("", response_model=List[DistributionCenterResponse])
def get_centers(
    skip: int = 0,
    limit: int = 100,
    status: str = None,
    db: Session = Depends(get_db)
):
    """Get all distribution centers"""
    query = db.query(DistributionCenter)

    if status:
        query = query.filter(DistributionCenter.status == status)

    centers = query.offset(skip).limit(limit).all()
    return centers


@router.get("/{center_id}", response_model=DistributionCenterResponse)
def get_center(center_id: int, db: Session = Depends(get_db)):
    """Get a specific distribution center"""
    center = db.query(DistributionCenter).filter(
        DistributionCenter.center_id == center_id
    ).first()

    if not center:
        raise HTTPException(status_code=404, detail="Distribution center not found")

    return center


@router.post("", response_model=DistributionCenterResponse)
def create_center(
    center: DistributionCenterCreate,
    db: Session = Depends(get_db)
):
    """Create a new distribution center"""
    db_center = DistributionCenter(**center.model_dump())
    db.add(db_center)
    db.commit()
    db.refresh(db_center)
    return db_center


@router.put("/{center_id}", response_model=DistributionCenterResponse)
def update_center(
    center_id: int,
    center_update: DistributionCenterUpdate,
    db: Session = Depends(get_db)
):
    """Update a distribution center"""
    db_center = db.query(DistributionCenter).filter(
        DistributionCenter.center_id == center_id
    ).first()

    if not db_center:
        raise HTTPException(status_code=404, detail="Distribution center not found")

    update_data = center_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_center, field, value)

    db.commit()
    db.refresh(db_center)
    return db_center


@router.delete("/{center_id}")
def delete_center(center_id: int, db: Session = Depends(get_db)):
    """Delete a distribution center"""
    db_center = db.query(DistributionCenter).filter(
        DistributionCenter.center_id == center_id
    ).first()

    if not db_center:
        raise HTTPException(status_code=404, detail="Distribution center not found")

    db.delete(db_center)
    db.commit()
    return {"message": "Distribution center deleted successfully"}
