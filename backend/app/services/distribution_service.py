"""
Distribution Service - ACID Transaction with Pessimistic Locking
This is the CORE of the concurrency control implementation
"""

from sqlalchemy.orm import Session
from sqlalchemy import text
from datetime import datetime, date
from typing import Tuple
import logging

from app.models import (
    Household,
    AidPackage,
    DistributionCenter,
    Inventory,
    DistributionLog
)

logger = logging.getLogger(__name__)


class DistributionService:
    """
    Service handling aid package distribution with ACID guarantees
    Uses pessimistic locking (SELECT ... FOR UPDATE) to prevent race conditions
    """

    @staticmethod
    def distribute_package(
        db: Session,
        household_id: int,
        package_id: int,
        center_id: int,
        staff_id: int | None,
        quantity: int = 1
    ) -> Tuple[str, str, int | None]:
        """
        Distribute aid package to household with full ACID transaction

        Returns:
            Tuple of (status, message, log_id)
            status: 'success' or 'error'
            message: Human-readable result message
            log_id: ID of distribution log entry if successful

        This method implements the following steps:
        1. Validate household exists and is active
        2. Validate package exists and is active
        3. Validate center exists and is active
        4. Check eligibility (validity period)
        5. LOCK inventory row (SELECT ... FOR UPDATE) <- CRITICAL FOR CONCURRENCY
        6. Check inventory quantity
        7. Update inventory (decrement)
        8. Insert distribution log
        9. Commit transaction
        """

        try:
            # Start transaction explicitly
            # (Note: SQLAlchemy already wraps operations in a transaction,
            # but we make it explicit for clarity)

            # 1. Validate household
            household = db.query(Household).filter(
                Household.household_id == household_id
            ).first()

            if not household:
                return ("error", "Household not found", None)

            if household.status != "active":
                return ("error", f"Household status is {household.status}", None)

            # 2. Validate package
            package = db.query(AidPackage).filter(
                AidPackage.package_id == package_id
            ).first()

            if not package:
                return ("error", "Package not found", None)

            if not package.is_active:
                return ("error", "Package is not active", None)

            # 3. Validate center
            center = db.query(DistributionCenter).filter(
                DistributionCenter.center_id == center_id
            ).first()

            if not center:
                return ("error", "Distribution center not found", None)

            if center.status != "active":
                return ("error", f"Center status is {center.status}", None)

            # 4. Check eligibility (validity period)
            last_distribution = db.query(DistributionLog).filter(
                DistributionLog.household_id == household_id,
                DistributionLog.package_id == package_id,
                DistributionLog.transaction_status == "success"
            ).order_by(DistributionLog.distribution_date.desc()).first()

            if last_distribution:
                last_date = last_distribution.distribution_date.date()
                days_since = (date.today() - last_date).days

                if days_since < package.validity_period_days:
                    remaining_days = package.validity_period_days - days_since
                    return (
                        "error",
                        f"Household not eligible. Last received {days_since} days ago. "
                        f"Must wait {remaining_days} more days.",
                        None
                    )

            # 5. CRITICAL: Lock inventory row using FOR UPDATE
            # This prevents other transactions from reading/writing this row
            # until our transaction completes (commits or rolls back)
            inventory = db.query(Inventory).filter(
                Inventory.center_id == center_id,
                Inventory.package_id == package_id
            ).with_for_update().first()  # <-- PESSIMISTIC LOCKING!

            if not inventory:
                return (
                    "error",
                    "No inventory record found for this package at this center",
                    None
                )

            # 6. Check quantity (now safe because row is locked)
            if inventory.quantity_on_hand < quantity:
                return (
                    "error",
                    f"Insufficient inventory. Available: {inventory.quantity_on_hand}, "
                    f"Requested: {quantity}",
                    None
                )

            # 7. Update inventory (decrement)
            inventory.quantity_on_hand -= quantity

            # 8. Create distribution log entry
            log_entry = DistributionLog(
                household_id=household_id,
                package_id=package_id,
                center_id=center_id,
                staff_id=staff_id,
                quantity_distributed=quantity,
                transaction_status="success",
                notes="Successfully distributed via API"
            )
            db.add(log_entry)

            # 9. Commit transaction
            db.commit()
            db.refresh(log_entry)

            logger.info(
                f"✅ Distribution successful: Household {household_id}, "
                f"Package {package_id}, Quantity {quantity}, Log ID {log_entry.log_id}"
            )

            return (
                "success",
                f"Successfully distributed {quantity} package(s)",
                log_entry.log_id
            )

        except Exception as e:
            # Rollback on any error
            db.rollback()
            logger.error(f"❌ Distribution failed: {str(e)}")
            return ("error", f"Transaction failed: {str(e)}", None)

    @staticmethod
    def check_eligibility(
        db: Session,
        household_id: int,
        package_id: int
    ) -> Tuple[bool, str]:
        """
        Check if household is eligible for a package
        This is a READ-ONLY operation (no locking needed)

        Returns:
            Tuple of (eligible, message)
        """

        # Check household
        household = db.query(Household).filter(
            Household.household_id == household_id
        ).first()

        if not household:
            return (False, "Household not found")

        if household.status != "active":
            return (False, f"Household is {household.status}")

        # Check package
        package = db.query(AidPackage).filter(
            AidPackage.package_id == package_id
        ).first()

        if not package:
            return (False, "Package not found")

        if not package.is_active:
            return (False, "Package is not active")

        # Check last distribution
        last_distribution = db.query(DistributionLog).filter(
            DistributionLog.household_id == household_id,
            DistributionLog.package_id == package_id,
            DistributionLog.transaction_status == "success"
        ).order_by(DistributionLog.distribution_date.desc()).first()

        if not last_distribution:
            return (True, "Household has never received this package - ELIGIBLE")

        last_date = last_distribution.distribution_date.date()
        days_since = (date.today() - last_date).days

        if days_since >= package.validity_period_days:
            return (True, f"Last received {days_since} days ago - ELIGIBLE")
        else:
            remaining = package.validity_period_days - days_since
            return (False, f"Must wait {remaining} more days")

    @staticmethod
    def restock_inventory(
        db: Session,
        center_id: int,
        package_id: int,
        quantity: int
    ) -> Tuple[str, str]:
        """
        Add inventory to a center

        Returns:
            Tuple of (status, message)
        """

        try:
            # Check if inventory record exists
            inventory = db.query(Inventory).filter(
                Inventory.center_id == center_id,
                Inventory.package_id == package_id
            ).first()

            if inventory:
                # Update existing record
                inventory.quantity_on_hand += quantity
                inventory.last_restock_date = date.today()
                inventory.last_restock_quantity = quantity
            else:
                # Create new record
                inventory = Inventory(
                    center_id=center_id,
                    package_id=package_id,
                    quantity_on_hand=quantity,
                    last_restock_date=date.today(),
                    last_restock_quantity=quantity
                )
                db.add(inventory)

            db.commit()

            logger.info(f"✅ Restocked: Center {center_id}, Package {package_id}, Quantity {quantity}")

            return ("success", f"Successfully restocked {quantity} units")

        except Exception as e:
            db.rollback()
            logger.error(f"❌ Restock failed: {str(e)}")
            return ("error", f"Restock failed: {str(e)}")
