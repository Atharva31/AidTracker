-- =====================================================
-- AidTracker Database Views
-- =====================================================
-- Useful views for reporting and analysis
-- =====================================================

USE aidtracker_db;

-- =====================================================
-- View: vw_current_inventory_status
-- =====================================================
-- Shows current inventory with package and center details
-- Highlights low stock items
-- =====================================================

CREATE OR REPLACE VIEW vw_current_inventory_status AS
SELECT
    i.inventory_id,
    i.center_id,
    dc.center_name,
    dc.city,
    i.package_id,
    ap.package_name,
    ap.category,
    i.quantity_on_hand,
    i.reorder_level,
    CASE
        WHEN i.quantity_on_hand = 0 THEN 'OUT_OF_STOCK'
        WHEN i.quantity_on_hand <= i.reorder_level THEN 'LOW_STOCK'
        ELSE 'IN_STOCK'
    END AS stock_status,
    i.last_restock_date,
    i.updated_at
FROM Inventory i
INNER JOIN Distribution_Centers dc ON i.center_id = dc.center_id
INNER JOIN Aid_Packages ap ON i.package_id = ap.package_id
WHERE dc.status = 'active' AND ap.is_active = TRUE
ORDER BY
    CASE
        WHEN i.quantity_on_hand = 0 THEN 1
        WHEN i.quantity_on_hand <= i.reorder_level THEN 2
        ELSE 3
    END,
    dc.center_name,
    ap.package_name;

-- =====================================================
-- View: vw_household_eligibility
-- =====================================================
-- Shows households and their last distribution dates
-- Useful for checking eligibility before distribution
-- =====================================================

CREATE OR REPLACE VIEW vw_household_eligibility AS
SELECT
    h.household_id,
    h.family_name,
    h.primary_contact_name,
    h.phone_number,
    h.city,
    h.family_size,
    h.priority_level,
    h.status AS household_status,
    dl.package_id,
    ap.package_name,
    MAX(dl.distribution_date) AS last_distribution_date,
    ap.validity_period_days,
    DATEDIFF(CURRENT_DATE, DATE(MAX(dl.distribution_date))) AS days_since_last_distribution,
    CASE
        WHEN DATEDIFF(CURRENT_DATE, DATE(MAX(dl.distribution_date))) >= ap.validity_period_days THEN 'ELIGIBLE'
        ELSE 'NOT_ELIGIBLE'
    END AS eligibility_status
FROM Households h
LEFT JOIN Distribution_Log dl ON h.household_id = dl.household_id AND dl.transaction_status = 'success'
LEFT JOIN Aid_Packages ap ON dl.package_id = ap.package_id
WHERE h.status = 'active'
GROUP BY h.household_id, dl.package_id, ap.validity_period_days
ORDER BY h.priority_level DESC, h.family_name;

-- =====================================================
-- View: vw_distribution_statistics
-- =====================================================
-- Overall distribution statistics by center and package
-- =====================================================

CREATE OR REPLACE VIEW vw_distribution_statistics AS
SELECT
    dc.center_id,
    dc.center_name,
    dc.city,
    ap.package_id,
    ap.package_name,
    ap.category,
    COUNT(dl.log_id) AS total_distributions,
    SUM(dl.quantity_distributed) AS total_quantity,
    COUNT(DISTINCT dl.household_id) AS unique_households_served,
    MIN(dl.distribution_date) AS first_distribution,
    MAX(dl.distribution_date) AS last_distribution,
    SUM(ap.estimated_cost * dl.quantity_distributed) AS total_value_distributed
FROM Distribution_Centers dc
LEFT JOIN Distribution_Log dl ON dc.center_id = dl.center_id AND dl.transaction_status = 'success'
LEFT JOIN Aid_Packages ap ON dl.package_id = ap.package_id
GROUP BY dc.center_id, ap.package_id
ORDER BY dc.center_name, total_distributions DESC;

-- =====================================================
-- View: vw_pending_households
-- =====================================================
-- Households that have never received aid or are due
-- =====================================================

CREATE OR REPLACE VIEW vw_pending_households AS
SELECT
    h.household_id,
    h.family_name,
    h.primary_contact_name,
    h.phone_number,
    h.address,
    h.city,
    h.family_size,
    h.priority_level,
    h.registration_date,
    COALESCE(COUNT(dl.log_id), 0) AS total_distributions_received,
    MAX(dl.distribution_date) AS last_distribution_date,
    CASE
        WHEN COUNT(dl.log_id) = 0 THEN 'NEVER_RECEIVED'
        WHEN DATEDIFF(CURRENT_DATE, DATE(MAX(dl.distribution_date))) > 30 THEN 'OVERDUE'
        ELSE 'RECENT'
    END AS distribution_status
FROM Households h
LEFT JOIN Distribution_Log dl ON h.household_id = dl.household_id AND dl.transaction_status = 'success'
WHERE h.status = 'active'
GROUP BY h.household_id
HAVING distribution_status IN ('NEVER_RECEIVED', 'OVERDUE')
ORDER BY
    CASE h.priority_level
        WHEN 'critical' THEN 1
        WHEN 'high' THEN 2
        WHEN 'medium' THEN 3
        WHEN 'low' THEN 4
    END,
    h.registration_date;

-- =====================================================
-- View: vw_monthly_summary
-- =====================================================
-- Monthly distribution summary for reports
-- =====================================================

CREATE OR REPLACE VIEW vw_monthly_summary AS
SELECT
    DATE_FORMAT(dl.distribution_date, '%Y-%m') AS month,
    dc.center_name,
    ap.category,
    COUNT(dl.log_id) AS total_distributions,
    COUNT(DISTINCT dl.household_id) AS unique_households,
    SUM(dl.quantity_distributed) AS total_packages,
    SUM(ap.estimated_cost * dl.quantity_distributed) AS total_value
FROM Distribution_Log dl
INNER JOIN Distribution_Centers dc ON dl.center_id = dc.center_id
INNER JOIN Aid_Packages ap ON dl.package_id = ap.package_id
WHERE dl.transaction_status = 'success'
GROUP BY DATE_FORMAT(dl.distribution_date, '%Y-%m'), dc.center_name, ap.category
ORDER BY month DESC, dc.center_name, ap.category;

-- Display confirmation
SELECT 'All views created successfully' AS status;
