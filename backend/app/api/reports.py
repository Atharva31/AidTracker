"""
Reports API Routes - Analytics and summaries
"""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text

from app.core.database import get_db

router = APIRouter(prefix="/reports", tags=["Reports"])


@router.get("/monthly-summary")
def get_monthly_summary(db: Session = Depends(get_db)):
    """Get monthly distribution summary"""
    result = db.execute(text("""
        SELECT * FROM vw_monthly_summary
        ORDER BY month DESC, center_name
        LIMIT 100
    """))

    rows = result.fetchall()
    columns = result.keys()

    return {
        "summary": [dict(zip(columns, row)) for row in rows]
    }


@router.get("/pending-households")
def get_pending_households(db: Session = Depends(get_db)):
    """Get households that haven't received aid recently"""
    result = db.execute(text("""
        SELECT * FROM vw_pending_households
        ORDER BY priority_level, registration_date
    """))

    rows = result.fetchall()
    columns = result.keys()

    return {
        "households": [dict(zip(columns, row)) for row in rows],
        "total": len(rows)
    }


@router.get("/distribution-statistics")
def get_distribution_statistics(db: Session = Depends(get_db)):
    """Get distribution statistics by center and package"""
    result = db.execute(text("""
        SELECT * FROM vw_distribution_statistics
        WHERE total_distributions > 0
        ORDER BY center_name, total_distributions DESC
    """))

    rows = result.fetchall()
    columns = result.keys()

    return {
        "statistics": [dict(zip(columns, row)) for row in rows]
    }


@router.get("/dashboard")
def get_dashboard_stats(db: Session = Depends(get_db)):
    """Get overall dashboard statistics"""

    # Total households
    total_households = db.execute(text("""
        SELECT COUNT(*) as count FROM Households WHERE status = 'active'
    """)).scalar()

    # Total distributions (successful)
    total_distributions = db.execute(text("""
        SELECT COUNT(*) as count FROM Distribution_Log WHERE transaction_status = 'success'
    """)).scalar()

    # Total centers
    total_centers = db.execute(text("""
        SELECT COUNT(*) as count FROM Distribution_Centers WHERE status = 'active'
    """)).scalar()

    # Low stock items
    low_stock_count = db.execute(text("""
        SELECT COUNT(*) as count FROM Inventory
        WHERE quantity_on_hand <= reorder_level
    """)).scalar()

    # Critical households (never received aid)
    critical_households = db.execute(text("""
        SELECT COUNT(*) as count FROM Households h
        WHERE h.status = 'active'
        AND h.priority_level = 'critical'
        AND NOT EXISTS (
            SELECT 1 FROM Distribution_Log dl
            WHERE dl.household_id = h.household_id
            AND dl.transaction_status = 'success'
        )
    """)).scalar()

    # Recent distributions (last 7 days)
    recent_distributions = db.execute(text("""
        SELECT COUNT(*) as count FROM Distribution_Log
        WHERE transaction_status = 'success'
        AND distribution_date >= DATE_SUB(NOW(), INTERVAL 7 DAY)
    """)).scalar()

    return {
        "total_households": total_households,
        "total_distributions": total_distributions,
        "total_centers": total_centers,
        "low_stock_items": low_stock_count,
        "critical_households": critical_households,
        "recent_distributions": recent_distributions
    }
