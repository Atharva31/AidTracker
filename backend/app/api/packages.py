"""
Aid Packages API Routes
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.models import AidPackage
from app.schemas.aid_package import (
    AidPackageCreate,
    AidPackageUpdate,
    AidPackageResponse
)

router = APIRouter(prefix="/packages", tags=["Aid Packages"])


@router.get("", response_model=List[AidPackageResponse])
def get_packages(
    skip: int = 0,
    limit: int = 100,
    category: str = None,
    is_active: bool = None,
    db: Session = Depends(get_db)
):
    """Get all aid packages"""
    query = db.query(AidPackage)

    if category:
        query = query.filter(AidPackage.category == category)

    if is_active is not None:
        query = query.filter(AidPackage.is_active == is_active)

    packages = query.offset(skip).limit(limit).all()
    return packages


@router.get("/{package_id}", response_model=AidPackageResponse)
def get_package(package_id: int, db: Session = Depends(get_db)):
    """Get a specific aid package"""
    package = db.query(AidPackage).filter(
        AidPackage.package_id == package_id
    ).first()

    if not package:
        raise HTTPException(status_code=404, detail="Aid package not found")

    return package


@router.post("", response_model=AidPackageResponse)
def create_package(
    package: AidPackageCreate,
    db: Session = Depends(get_db)
):
    """Create a new aid package"""
    db_package = AidPackage(**package.model_dump())
    db.add(db_package)
    db.commit()
    db.refresh(db_package)
    return db_package


@router.put("/{package_id}", response_model=AidPackageResponse)
def update_package(
    package_id: int,
    package_update: AidPackageUpdate,
    db: Session = Depends(get_db)
):
    """Update an aid package"""
    db_package = db.query(AidPackage).filter(
        AidPackage.package_id == package_id
    ).first()

    if not db_package:
        raise HTTPException(status_code=404, detail="Aid package not found")

    update_data = package_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_package, field, value)

    db.commit()
    db.refresh(db_package)
    return db_package


@router.delete("/{package_id}")
def delete_package(package_id: int, db: Session = Depends(get_db)):
    """Delete an aid package"""
    db_package = db.query(AidPackage).filter(
        AidPackage.package_id == package_id
    ).first()

    if not db_package:
        raise HTTPException(status_code=404, detail="Aid package not found")

    db.delete(db_package)
    db.commit()
    return {"message": "Aid package deleted successfully"}
