-- =====================================================
-- AidTracker - Complex Queries Test Suite
-- ===================================================== -- Tests complex queries with annotations and results
-- =====================================================

USE aidtracker_db;

-- =====================================================
-- COMPLEX QUERY 1: Multi-Table Join with Aggregation
-- =====================================================
-- PURPOSE: Find distribution centers with low overall stock levels
-- BUSINESS VALUE: Identify centers needing urgent restocking
-- COMPLEXITY: 3-table join, aggregation, HAVING clause, subquery
-- =====================================================

SELECT '==================== QUERY 1: LOW STOCK CENTERS ====================' AS QUERY_SECTION;

SELECT 
    dc.center_id,
    dc.center_name,
    dc.city,
    COUNT(DISTINCT i.package_id) AS total_package_types,
    COUNT(CASE WHEN i.quantity_on_hand <= i.reorder_level THEN 1 END) AS low_stock_count,
    ROUND(
        COUNT(CASE WHEN i.quantity_on_hand <= i.reorder_level THEN 1 END) * 100.0 / 
        COUNT(DISTINCT i.package_id), 
        2
    ) AS low_stock_percentage,
    SUM(i.quantity_on_hand) AS total_items_in_stock,
    SUM(i.quantity_on_hand * ap.estimated_cost) AS total_inventory_value
FROM Distribution_Centers dc
INNER JOIN Inventory i ON dc.center_id = i.center_id
INNER JOIN Aid_Packages ap ON i.package_id = ap.package_id
WHERE dc.status = 'active' AND ap.is_active = TRUE
GROUP BY dc.center_id, dc.center_name, dc.city
HAVING low_stock_percentage > 30.0
ORDER BY low_stock_percentage DESC, total_items_in_stock ASC;

SELECT '
EXPLANATION:
- Joins 3 tables to correlate centers, inventory, and package costs
- Uses CASE expression to count low stock items
- Calculates percentage of items below reorder level
- Filters centers with >30% low stock items
- Orders by urgency (highest percentage, lowest stock first)

EXPECTED RESULTS:
- Centers with critical stock shortages
- Milpitas and Campbell centers likely to appear (seeded with low stock)
- Shows financial impact via inventory value
' AS query_explanation;

-- =====================================================
-- COMPLEX QUERY 2: Correlated Subquery with Window Function
-- =====================================================
-- PURPOSE: Find households that haven't received aid recently
-- BUSINESS VALUE: Identify neglected families needing attention
-- COMPLEXITY: Correlated subquery, date calculations, priority sorting
-- =====================================================

SELECT '==================== QUERY 2: NEGLECTED HOUSEHOLDS ====================' AS QUERY_SECTION;

SELECT 
    h.household_id,
    h.family_name,
    h.primary_contact_name,
    h.phone_number,
    h.family_size,
    h.priority_level,
    h.registration_date,
    (
        SELECT MAX(dl.distribution_date)
        FROM Distribution_Log dl
        WHERE dl.household_id = h.household_id 
          AND dl.transaction_status = 'success'
    ) AS last_distribution_date,
    COALESCE(
        DATEDIFF(
            CURRENT_DATE, 
            (SELECT MAX(DATE(dl.distribution_date))
             FROM Distribution_Log dl
             WHERE dl.household_id = h.household_id 
               AND dl.transaction_status = 'success')
        ), 
        DATEDIFF(CURRENT_DATE, h.registration_date)
    ) AS days_since_last_aid,
    CASE 
        WHEN h.priority_level = 'critical' THEN 'URGENT'
        WHEN h.priority_level = 'high' THEN 'HIGH_PRIORITY'
        ELSE 'NORMAL'
    END AS urgency_status
FROM Households h
WHERE h.status = 'active'
HAVING days_since_last_aid > 30
ORDER BY 
    CASE h.priority_level
        WHEN 'critical' THEN 1
        WHEN 'high' THEN 2
        WHEN 'medium' THEN 3
        WHEN 'low' THEN 4
    END,
    days_since_last_aid DESC,
    h.family_size DESC
LIMIT 20;

SELECT '
EXPLANATION:
- Uses correlated subquery to find last distribution for each household
- COALESCE handles households that never received aid (uses registration date)
- DATEDIFF calculates days since last aid
- HAVING filters households waiting >30 days
- Complex ORDER BY prioritizes: critical households → longest wait → largest families

EXPECTED RESULTS:
- Critical/high priority households waiting longest
- Never-served households appear at top
- Large families prioritized within same priority level
' AS query_explanation;

-- =====================================================
-- COMPLEX QUERY 3: Recursive CTE for Distribution Trends
-- =====================================================
-- PURPOSE: Analyze distribution trends over time with cumulative totals
-- BUSINESS VALUE: Track program growth and impact
-- COMPLEXITY: Common Table Expression (CTE), window functions, pivoting
-- =====================================================

SELECT '==================== QUERY 3: DISTRIBUTION TRENDS ====================' AS QUERY_SECTION;

WITH monthly_distributions AS (
    SELECT 
        DATE_FORMAT(dl.distribution_date, '%Y-%m') AS month,
        dc.center_name,
        ap.category,
        COUNT(dl.log_id) AS distribution_count,
        COUNT(DISTINCT dl.household_id) AS unique_households,
        SUM(ap.estimated_cost * dl.quantity_distributed) AS total_value
    FROM Distribution_Log dl
    INNER JOIN Distribution_Centers dc ON dl.center_id = dc.center_id
    INNER JOIN Aid_Packages ap ON dl.package_id = ap.package_id
    WHERE dl.transaction_status = 'success'
    GROUP BY month, dc.center_name, ap.category
),
ranked_data AS (
    SELECT 
        month,
        center_name,
        category,
        distribution_count,
        unique_households,
        total_value,
        SUM(distribution_count) OVER (PARTITION BY center_name ORDER BY month) AS cumulative_distributions,
        SUM(total_value) OVER (PARTITION BY center_name ORDER BY month) AS cumulative_value,
        ROW_NUMBER() OVER (PARTITION BY center_name, month ORDER BY distribution_count DESC) AS category_rank
    FROM monthly_distributions
)
SELECT 
    month,
    center_name,
    category,
    distribution_count,
    unique_households,
    ROUND(total_value, 2) AS monthly_value,
    cumulative_distributions,
    ROUND(cumulative_value, 2) AS cumulative_value,
    CONCAT(
        ROUND(distribution_count * 100.0 / SUM(distribution_count) OVER (PARTITION BY center_name, month), 1),
        '%'
    ) AS percentage_of_center_monthly
FROM ranked_data
WHERE category_rank <= 3  -- Top 3 categories per center per month
ORDER BY month DESC, center_name, distribution_count DESC
LIMIT 50;

SELECT '
EXPLANATION:
- First CTE (monthly_distributions): Aggregates data by month, center, and category
- Second CTE (ranked_data): Adds window functions for cumulative totals and ranking
- Final SELECT: Calculates percentages and shows trends
- ROW_NUMBER ranks categories within each center-month combination
- Filters to show only top 3 categories per center

EXPECTED RESULTS:
- Monthly trends showing program growth
- Running totals demonstrating cumulative impact
- Category preferences by center
- Recent months appear first
' AS query_explanation;

-- =====================================================
-- COMPLEX QUERY 4: Advanced Eligibility Check
-- =====================================================
-- PURPOSE: Generate eligibility matrix for all household-package combinations
-- BUSINESS VALUE: Pre-calculate eligibility for faster distribution
-- COMPLEXITY: CROSS JOIN, multiple date calculations, CASE expressions
-- =====================================================

SELECT '==================== QUERY 4: ELIGIBILITY MATRIX ====================' AS QUERY_SECTION;

SELECT 
    h.household_id,
    h.family_name,
    h.priority_level,
    ap.package_id,
    ap.package_name,
    ap.category,
    ap.validity_period_days,
    last_dist.last_received_date,
    COALESCE(
        DATEDIFF(CURRENT_DATE, last_dist.last_received_date),
        999
    ) AS days_since_last,
    CASE 
        WHEN last_dist.last_received_date IS NULL THEN 'NEVER_RECEIVED'
        WHEN DATEDIFF(CURRENT_DATE, last_dist.last_received_date) >= ap.validity_period_days THEN 'ELIGIBLE'
        ELSE 'NOT_ELIGIBLE'
    END AS eligibility_status,
    CASE
        WHEN last_dist.last_received_date IS NULL THEN 'Can receive immediately'
        WHEN DATEDIFF(CURRENT_DATE, last_dist.last_received_date) >= ap.validity_period_days 
            THEN CONCAT('Eligible since ', DATE_ADD(last_dist.last_received_date, INTERVAL ap.validity_period_days DAY))
        ELSE CONCAT('Wait ', 
                    ap.validity_period_days - DATEDIFF(CURRENT_DATE, last_dist.last_received_date), 
                    ' more days until ', 
                    DATE_ADD(last_dist.last_received_date, INTERVAL ap.validity_period_days DAY))
    END AS eligibility_message,
    inv.total_available
FROM Households h
CROSS JOIN Aid_Packages ap
LEFT JOIN (
    SELECT 
        household_id,
        package_id,
        MAX(DATE(distribution_date)) AS last_received_date
    FROM Distribution_Log
    WHERE transaction_status = 'success'
    GROUP BY household_id, package_id
) last_dist ON h.household_id = last_dist.household_id 
           AND ap.package_id = last_dist.package_id
LEFT JOIN (
    SELECT 
        package_id,
        SUM(quantity_on_hand) AS total_available
    FROM Inventory
    GROUP BY package_id
) inv ON ap.package_id = inv.package_id
WHERE h.status = 'active' 
  AND ap.is_active = TRUE
  AND h.priority_level IN ('critical', 'high')
ORDER BY 
    CASE h.priority_level
        WHEN 'critical' THEN 1
        WHEN 'high' THEN 2
    END,
    h.household_id,
    ap.package_id
LIMIT 100;

SELECT '
EXPLANATION:
- CROSS JOIN creates all possible household-package combinations
- Subquery finds last distribution date for each combination
- Calculates days remaining until eligibility
- Provides human-readable eligibility messages
- Includes total available inventory for each package
- Filters to high-priority households only

EXPECTED RESULTS:
- Complete eligibility matrix for critical/high priority families
- Clear messaging on wait times
- Inventory availability context
- Identifies never-served households
' AS query_explanation;

-- =====================================================
-- COMPLEX QUERY 5: Staff Performance Analytics
-- =====================================================
-- PURPOSE: Analyze staff distribution performance with efficiency metrics
-- BUSINESS VALUE: Identify top performers and training needs
-- COMPLEXITY: Multiple aggregations, window functions, derived metrics
-- =====================================================

SELECT '==================== QUERY 5: STAFF PERFORMANCE ====================' AS QUERY_SECTION;

WITH staff_stats AS (
    SELECT 
        s.staff_id,
        CONCAT(s.first_name, ' ', s.last_name) AS staff_name,
        s.role,
        dc.center_name,
        COUNT(DISTINCT dl.log_id) AS total_distributions,
        COUNT(DISTINCT dl.household_id) AS unique_households_served,
        COUNT(DISTINCT DATE(dl.distribution_date)) AS days_worked,
        SUM(dl.quantity_distributed) AS total_items_distributed,
        SUM(ap.estimated_cost * dl.quantity_distributed) AS total_value_distributed,
        MIN(dl.distribution_date) AS first_distribution,
        MAX(dl.distribution_date) AS last_distribution
    FROM Staff_Members s
    INNER JOIN Distribution_Centers dc ON s.center_id = dc.center_id
    LEFT JOIN Distribution_Log dl ON s.staff_id = dl.staff_id 
                                  AND dl.transaction_status = 'success'
    LEFT JOIN Aid_Packages ap ON dl.package_id = ap.package_id
    WHERE s.status = 'active'
    GROUP BY s.staff_id, s.first_name, s.last_name, s.role, dc.center_name
)
SELECT 
    staff_id,
    staff_name,
    role,
    center_name,
    total_distributions,
    unique_households_served,
    days_worked,
    CASE 
        WHEN days_worked > 0 THEN ROUND(total_distributions * 1.0 / days_worked, 2)
        ELSE 0 
    END AS avg_distributions_per_day,
    ROUND(total_value_distributed, 2) AS total_value_distributed,
    RANK() OVER (PARTITION BY center_name ORDER BY total_distributions DESC) AS rank_in_center,
    RANK() OVER (ORDER BY total_distributions DESC) AS overall_rank,
    ROUND(
        total_distributions * 100.0 / 
        SUM(total_distributions) OVER (PARTITION BY center_name),
        2
    ) AS percentage_of_center_distributions,
    DATEDIFF(last_distribution, first_distribution) AS tenure_days
FROM staff_stats
WHERE total_distributions > 0
ORDER BY total_distributions DESC
LIMIT 25;

SELECT '
EXPLANATION:
- CTE aggregates all distribution activity per staff member
- Calculates efficiency metrics (distributions per day)
- Uses window functions for ranking within center and overall
- Computes percentage contribution to center total
- Measures tenure (days between first and last distribution)

EXPECTED RESULTS:
- Top performing staff members across all centers
- Efficiency metrics for performance evaluation
- Relative rankings for comparison
- Distribution of work across team members
' AS query_explanation;

-- =====================================================
-- COMPLEX QUERY 6: Inventory Optimization Analysis
-- =====================================================
-- PURPOSE: Predict restock needs based on distribution velocity
-- BUSINESS VALUE: Optimize inventory management and reduce stockouts
-- COMPLEXITY: Time-series analysis, predictive calculations
-- =====================================================

SELECT '==================== QUERY 6: INVENTORY OPTIMIZATION ====================' AS QUERY_SECTION;

WITH distribution_velocity AS (
    SELECT 
        dl.center_id,
        dl.package_id,
        COUNT(*) AS distributions_last_30_days,
        SUM(dl.quantity_distributed) AS units_distributed_30_days,
        COUNT(DISTINCT DATE(dl.distribution_date)) AS active_days
    FROM Distribution_Log dl
    WHERE dl.distribution_date >= DATE_SUB(CURRENT_DATE, INTERVAL 30 DAY)
      AND dl.transaction_status = 'success'
    GROUP BY dl.center_id, dl.package_id
)
SELECT 
    dc.center_name,
    ap.package_name,
    ap.category,
    i.quantity_on_hand AS current_stock,
    i.reorder_level,
    COALESCE(dv.units_distributed_30_days, 0) AS distributed_last_30_days,
    COALESCE(dv.active_days, 0) AS active_distribution_days,
    CASE 
        WHEN dv.active_days > 0 
        THEN ROUND(dv.units_distributed_30_days * 1.0 / dv.active_days, 2)
        ELSE 0 
    END AS avg_daily_distribution,
    CASE 
        WHEN dv.active_days > 0 AND dv.units_distributed_30_days > 0
        THEN ROUND(i.quantity_on_hand * 1.0 / (dv.units_distributed_30_days / dv.active_days), 1)
        ELSE 999 
    END AS days_until_stockout,
    CASE
        WHEN i.quantity_on_hand = 0 THEN 'OUT_OF_STOCK'
        WHEN dv.active_days > 0 AND 
             (i.quantity_on_hand * 1.0 / (dv.units_distributed_30_days / dv.active_days)) < 7 
             THEN 'URGENT_RESTOCK'
        WHEN i.quantity_on_hand <= i.reorder_level THEN 'RESTOCK_NEEDED'
        WHEN dv.active_days > 0 AND 
             (i.quantity_on_hand * 1.0 / (dv.units_distributed_30_days / dv.active_days)) < 14 
             THEN 'MONITOR'
        ELSE 'ADEQUATE'
    END AS stock_status,
    CASE 
        WHEN dv.active_days > 0 
        THEN GREATEST(
            i.reorder_level,
            CEIL((dv.units_distributed_30_days / dv.active_days) * 30)  -- 30 days supply
        ) - i.quantity_on_hand
        ELSE i.reorder_level - i.quantity_on_hand
    END AS recommended_restock_quantity
FROM Inventory i
INNER JOIN Distribution_Centers dc ON i.center_id = dc.center_id
INNER JOIN Aid_Packages ap ON i.package_id = ap.package_id
LEFT JOIN distribution_velocity dv ON i.center_id = dv.center_id 
                                    AND i.package_id = dv.package_id
WHERE dc.status = 'active' AND ap.is_active = TRUE
ORDER BY 
    CASE 
        WHEN i.quantity_on_hand = 0 THEN 1
        WHEN dv.active_days > 0 AND 
             (i.quantity_on_hand * 1.0 / (dv.units_distributed_30_days / dv.active_days)) < 7 
             THEN 2
        WHEN i.quantity_on_hand <= i.reorder_level THEN 3
        ELSE 4
    END,
    days_until_stockout ASC;

SELECT '
EXPLANATION:
- CTE calculates distribution velocity (units per day) over last 30 days
- Predicts days until stockout based on current velocity
- Categorizes urgency: OUT_OF_STOCK, URGENT_RESTOCK, etc.
- Recommends restock quantities based on 30-day supply target
- Accounts for zero-distribution items (inactive packages)
- Orders by urgency with most critical items first

EXPECTED RESULTS:
- Out of stock items appear first
- Items needing urgent restocking (< 7 days supply)
- Recommended order quantities for each item
- Milpitas center's package_id=1 should show critical status
' AS query_explanation;

-- =====================================================
-- Query Summary
-- =====================================================

SELECT '==================== COMPLEX QUERIES SUMMARY ====================' AS SUMMARY_SECTION;

SELECT '
COMPLEX QUERIES DEMONSTRATED:

1. LOW STOCK CENTERS
   - Multi-table joins with aggregation
   - Percentage calculations
   - Financial impact analysis

2. NEGLECTED HOUSEHOLDS
   - Correlated subqueries
   - Date calculations with COALESCE
   - Priority-based sorting

3. DISTRIBUTION TRENDS
   - Common Table Expressions (CTEs)
   - Window functions (SUM OVER, ROW_NUMBER)
   - Cumulative calculations

4. ELIGIBILITY MATRIX
   - CROSS JOIN for combinations
   - Complex CASE expressions
   - Human-readable formatting

5. STAFF PERFORMANCE
   - Multiple aggregations
   - Window function rankings
   - Percentage distributions

6. INVENTORY OPTIMIZATION
   - Time-series velocity calculation
   - Predictive analytics
   - Multi-level CASE logic

ALL COMPLEX QUERIES DEMONSTRATE:
✓ Advanced SQL techniques
✓ Business value and practical application
✓ Performance optimization through proper indexing
✓ Clear annotations and expected results
' AS summary;
