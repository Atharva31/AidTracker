DROP PROCEDURE IF EXISTS sp_distribute_package;
DELIMITER $$

CREATE PROCEDURE sp_distribute_package(
    IN p_household_id INT,
    IN p_center_id INT,
    IN p_package_id INT,
    IN p_quantity INT,
    OUT p_status VARCHAR(50),
    OUT p_message VARCHAR(255)
)
sp_distribute_package: BEGIN

    DECLARE current_quantity INT;

    -- Lock inventory row
    SELECT quantity_on_hand
    INTO current_quantity
    FROM Inventory
    WHERE center_id = p_center_id
      AND package_id = p_package_id
    FOR UPDATE;

    IF current_quantity IS NULL THEN
        SET p_status = 'failed';
        SET p_message = 'Inventory record not found';
        LEAVE sp_distribute_package;
    END IF;

    IF current_quantity < p_quantity THEN
        SET p_status = 'failed';
        SET p_message = 'Insufficient inventory';
        LEAVE sp_distribute_package;
    END IF;

    -- Update the inventory
    UPDATE Inventory
    SET quantity_on_hand = quantity_on_hand - p_quantity
    WHERE center_id = p_center_id
      AND package_id = p_package_id;

    -- Insert into distribution log
    INSERT INTO Distribution_Log (
        household_id, package_id, center_id, staff_id,
        quantity_distributed, transaction_status
    )
    VALUES (
        p_household_id, p_package_id, p_center_id, NULL,
        p_quantity, 'success'
    );

    SET p_status = 'success';
    SET p_message = 'Distribution completed successfully';

END sp_distribute_package$$

DELIMITER ;
