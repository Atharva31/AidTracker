USE aidtracker_db;

-- Update vw_monthly_summary to return year and month separately
CREATE OR REPLACE VIEW vw_monthly_summary AS
SELECT
    YEAR(dl.distribution_date) AS year,
    MONTH(dl.distribution_date) AS month,
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
GROUP BY YEAR(dl.distribution_date), MONTH(dl.distribution_date), dc.center_name, ap.category
ORDER BY year DESC, month DESC, dc.center_name, ap.category;

-- Update vw_pending_households to include days_since_last_distribution
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
    DATEDIFF(CURRENT_DATE, DATE(MAX(dl.distribution_date))) AS days_since_last_distribution,
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
