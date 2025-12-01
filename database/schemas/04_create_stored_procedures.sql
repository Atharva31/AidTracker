-- =====================================================
-- AidTracker Stored Procedures
-- =====================================================
-- Core business logic for ACID-compliant operations
-- =====================================================

USE aidtracker_db;

DELIMITER $$

-- =====================================================
-- Procedure: sp_distribute_package
-- =====================================================
-- CRITICAL: This is the heart of our concurrency control
-- Uses FOR UPDATE to lock inventory row during transaction
-- Prevents race conditions when multiple workers distribute simultaneously
-- =====================================================

DROP PROCEDURE IF EXISTS sp_distribute_package$$

CREATE PROCEDURE sp_distribute_package(
    IN p_household_id INT,
    IN p_package_id INT,
    IN p_center_id INT,
    IN p_staff_id INT,
    IN p_quantity INT,
    OUT p_status VARCHAR(20),
    OUT p_message VARCHAR(255),
    OUT p_log_id INT
)
sp_distribute_package: BEGIN
    DECLARE v_current_quantity INT;
    DECLARE v_household_status VARCHAR(20);
    DECLARE v_package_active BOOLEAN;
    DECLARE v_center_status VARCHAR(20);
    DECLARE v_last_distribution_date DATE;
    DECLARE v_validity_period INT;
    DECLARE v_days_since_last INT;
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        -- Rollback on any error
        ROLLBACK;
        SET p_status = 'error';
        SET p_message = 'Transaction failed due to database error';
        SET p_log_id = NULL;
    END;

    -- Start transaction
    START TRANSACTION;

    -- 1. Validate household exists and is active
    SELECT status INTO v_household_status
    FROM Households
    WHERE household_id = p_household_id;

    IF v_household_status IS NULL THEN
        SET p_status = 'error';
        SET p_message = 'Household not found';
        ROLLBACK;
        LEAVE sp_distribute_package;
    END IF;

    IF v_household_status != 'active' THEN
        SET p_status = 'error';
        SET p_message = CONCAT('Household status is ', v_household_status);
        ROLLBACK;
        LEAVE sp_distribute_package;
    END IF;

    -- 2. Validate package exists and is active
    SELECT is_active, validity_period_days
    INTO v_package_active, v_validity_period
    FROM Aid_Packages
    WHERE package_id = p_package_id;

    IF v_package_active IS NULL THEN
        SET p_status = 'error';
        SET p_message = 'Package not found';
        ROLLBACK;
        LEAVE sp_distribute_package;
    END IF;

    IF v_package_active = FALSE THEN
        SET p_status = 'error';
        SET p_message = 'Package is not active';
        ROLLBACK;
        LEAVE sp_distribute_package;
    END IF;

    -- 3. Validate center exists and is active
    SELECT status INTO v_center_status
    FROM Distribution_Centers
    WHERE center_id = p_center_id;

    IF v_center_status IS NULL THEN
        SET p_status = 'error';
        SET p_message = 'Distribution center not found';
        ROLLBACK;
        LEAVE sp_distribute_package;
    END IF;

    IF v_center_status != 'active' THEN
        SET p_status = 'error';
        SET p_message = CONCAT('Center status is ', v_center_status);
        ROLLBACK;
        LEAVE sp_distribute_package;
    END IF;

    -- 4. Check eligibility (validity period)
    SELECT DATE(distribution_date) INTO v_last_distribution_date
    FROM Distribution_Log
    WHERE household_id = p_household_id
      AND package_id = p_package_id
      AND transaction_status = 'success'
    ORDER BY distribution_date DESC
    LIMIT 1;

    IF v_last_distribution_date IS NOT NULL THEN
        SET v_days_since_last = DATEDIFF(CURRENT_DATE, v_last_distribution_date);
        IF v_days_since_last < v_validity_period THEN
            SET p_status = 'error';
            SET p_message = CONCAT('Household not eligible. Last received ', v_days_since_last, ' days ago. Must wait ', v_validity_period, ' days.');
            ROLLBACK;
            LEAVE sp_distribute_package;
        END IF;
    END IF;

    -- 5. CRITICAL: Lock inventory row and check quantity
    -- FOR UPDATE prevents other transactions from reading/writing this row
    -- This is the PESSIMISTIC LOCKING that prevents race conditions
    SELECT quantity_on_hand INTO v_current_quantity
    FROM Inventory
    WHERE center_id = p_center_id AND package_id = p_package_id
    FOR UPDATE;  -- <-- THIS IS THE KEY TO PREVENTING RACE CONDITIONS

    IF v_current_quantity IS NULL THEN
        SET p_status = 'error';
        SET p_message = 'No inventory record found for this package at this center';
        ROLLBACK;
        LEAVE sp_distribute_package;
    END IF;

    IF v_current_quantity < p_quantity THEN
        SET p_status = 'error';
        SET p_message = CONCAT('Insufficient inventory. Available: ', v_current_quantity, ', Requested: ', p_quantity);
        ROLLBACK;
        LEAVE sp_distribute_package;
    END IF;

    -- 6. All validations passed - Update inventory (decrement)
    UPDATE Inventory
    SET quantity_on_hand = quantity_on_hand - p_quantity,
        updated_at = CURRENT_TIMESTAMP
    WHERE center_id = p_center_id AND package_id = p_package_id;

    -- 7. Record successful distribution in audit log
    INSERT INTO Distribution_Log (
        household_id,
        package_id,
        center_id,
        staff_id,
        quantity_distributed,
        transaction_status,
        notes
    ) VALUES (
        p_household_id,
        p_package_id,
        p_center_id,
        p_staff_id,
        p_quantity,
        'success',
        'Successfully distributed via stored procedure'
    );

    SET p_log_id = LAST_INSERT_ID();

    -- 8. Commit transaction
    COMMIT;

    SET p_status = 'success';
    SET p_message = CONCAT('Successfully distributed ', p_quantity, ' package(s)');

END$$

-- =====================================================
-- Procedure: sp_restock_inventory
-- =====================================================
-- Safely add inventory to a center
-- =====================================================

DROP PROCEDURE IF EXISTS sp_restock_inventory$$

CREATE PROCEDURE sp_restock_inventory(
    IN p_center_id INT,
    IN p_package_id INT,
    IN p_quantity INT,
    OUT p_status VARCHAR(20),
    OUT p_message VARCHAR(255)
)
BEGIN
    DECLARE v_inventory_exists INT;
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        SET p_status = 'error';
        SET p_message = 'Restock transaction failed';
    END;

    START TRANSACTION;

    -- Check if inventory record exists
    SELECT COUNT(*) INTO v_inventory_exists
    FROM Inventory
    WHERE center_id = p_center_id AND package_id = p_package_id;

    IF v_inventory_exists = 0 THEN
        -- Create new inventory record
        INSERT INTO Inventory (center_id, package_id, quantity_on_hand, last_restock_date, last_restock_quantity)
        VALUES (p_center_id, p_package_id, p_quantity, CURRENT_DATE, p_quantity);
    ELSE
        -- Update existing inventory
        UPDATE Inventory
        SET quantity_on_hand = quantity_on_hand + p_quantity,
            last_restock_date = CURRENT_DATE,
            last_restock_quantity = p_quantity,
            updated_at = CURRENT_TIMESTAMP
        WHERE center_id = p_center_id AND package_id = p_package_id;
    END IF;

    COMMIT;

    SET p_status = 'success';
    SET p_message = CONCAT('Successfully restocked ', p_quantity, ' units');

END$$

-- =====================================================
-- Procedure: sp_check_eligibility
-- =====================================================
-- Check if household is eligible for a package
-- WITHOUT locking (read-only operation)
-- =====================================================

DROP PROCEDURE IF EXISTS sp_check_eligibility$$

CREATE PROCEDURE sp_check_eligibility(
    IN p_household_id INT,
    IN p_package_id INT,
    OUT p_eligible BOOLEAN,
    OUT p_message VARCHAR(255)
)
sp_check_eligibility: BEGIN
    DECLARE v_household_status VARCHAR(20);
    DECLARE v_package_active BOOLEAN;
    DECLARE v_last_distribution_date DATE;
    DECLARE v_validity_period INT;
    DECLARE v_days_since_last INT;

    -- Check household status
    SELECT status INTO v_household_status
    FROM Households
    WHERE household_id = p_household_id;

    IF v_household_status IS NULL THEN
        SET p_eligible = FALSE;
        SET p_message = 'Household not found';
        LEAVE sp_check_eligibility;
    END IF;

    IF v_household_status != 'active' THEN
        SET p_eligible = FALSE;
        SET p_message = CONCAT('Household is ', v_household_status);
        LEAVE sp_check_eligibility;
    END IF;

    -- Check package status
    SELECT is_active, validity_period_days
    INTO v_package_active, v_validity_period
    FROM Aid_Packages
    WHERE package_id = p_package_id;

    IF v_package_active IS NULL THEN
        SET p_eligible = FALSE;
        SET p_message = 'Package not found';
        LEAVE sp_check_eligibility;
    END IF;

    IF v_package_active = FALSE THEN
        SET p_eligible = FALSE;
        SET p_message = 'Package is not active';
        LEAVE sp_check_eligibility;
    END IF;

    -- Check last distribution date
    SELECT DATE(distribution_date) INTO v_last_distribution_date
    FROM Distribution_Log
    WHERE household_id = p_household_id
      AND package_id = p_package_id
      AND transaction_status = 'success'
    ORDER BY distribution_date DESC
    LIMIT 1;

    IF v_last_distribution_date IS NULL THEN
        SET p_eligible = TRUE;
        SET p_message = 'Household has never received this package - ELIGIBLE';
        LEAVE sp_check_eligibility;
    END IF;

    SET v_days_since_last = DATEDIFF(CURRENT_DATE, v_last_distribution_date);

    IF v_days_since_last >= v_validity_period THEN
        SET p_eligible = TRUE;
        SET p_message = CONCAT('Last received ', v_days_since_last, ' days ago - ELIGIBLE');
    ELSE
        SET p_eligible = FALSE;
        SET p_message = CONCAT('Must wait ', (v_validity_period - v_days_since_last), ' more days');
    END IF;

END$$

DELIMITER ;

-- Display confirmation
SELECT 'All stored procedures created successfully' AS status;
