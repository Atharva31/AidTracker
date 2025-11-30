"""
Households API Routes
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.models import Household
from app.schemas.household import (
    HouseholdCreate,
    HouseholdUpdate,
    HouseholdResponse
)

router = APIRouter(prefix="/households", tags=["Households"])


@router.get("", response_model=List[HouseholdResponse])
def get_households(
    skip: int = 0,
    limit: int = 100,
    status: str = None,
    priority: str = None,
    city: str = None,
    db: Session = Depends(get_db)
):
    """Get all households"""
    query = db.query(Household)

    if status:
        query = query.filter(Household.status == status)

    if priority:
        query = query.filter(Household.priority_level == priority)

    if city:
        query = query.filter(Household.city == city)

    households = query.offset(skip).limit(limit).all()
    return households


@router.get("/{household_id}", response_model=HouseholdResponse)
def get_household(household_id: int, db: Session = Depends(get_db)):
    """Get a specific household"""
    household = db.query(Household).filter(
        Household.household_id == household_id
    ).first()

    if not household:
        raise HTTPException(status_code=404, detail="Household not found")

    return household


@router.post("", response_model=HouseholdResponse)
def create_household(
    household: HouseholdCreate,
    db: Session = Depends(get_db)
):
    """Register a new household"""
    # Check for duplicate phone number
    existing = db.query(Household).filter(
        Household.phone_number == household.phone_number
    ).first()

    if existing:
        raise HTTPException(
            status_code=400,
            detail="Household with this phone number already exists"
        )

    db_household = Household(**household.model_dump())
    db.add(db_household)
    db.commit()
    db.refresh(db_household)
    return db_household


@router.put("/{household_id}", response_model=HouseholdResponse)
def update_household(
    household_id: int,
    household_update: HouseholdUpdate,
    db: Session = Depends(get_db)
):
    """Update a household"""
    db_household = db.query(Household).filter(
        Household.household_id == household_id
    ).first()

    if not db_household:
        raise HTTPException(status_code=404, detail="Household not found")

    update_data = household_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_household, field, value)

    db.commit()
    db.refresh(db_household)
    return db_household


@router.delete("/{household_id}")
def delete_household(household_id: int, db: Session = Depends(get_db)):
    """Delete a household"""
    db_household = db.query(Household).filter(
        Household.household_id == household_id
    ).first()

    if not db_household:
        raise HTTPException(status_code=404, detail="Household not found")

    db.delete(db_household)
    db.commit()
    return {"message": "Household deleted successfully"}
