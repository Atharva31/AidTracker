-- =====================================================
-- AidTracker Database Schema
-- =====================================================
-- Normalized to 3NF with proper constraints
-- InnoDB engine for ACID transaction support
-- =====================================================

USE aidtracker_db;

-- =====================================================
-- Table: Distribution_Centers
-- =====================================================
-- Stores information about aid distribution locations
-- =====================================================

CREATE TABLE IF NOT EXISTS Distribution_Centers (
    center_id INT AUTO_INCREMENT PRIMARY KEY,
    center_name VARCHAR(100) NOT NULL,
    address VARCHAR(255) NOT NULL,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(50) NOT NULL,
    zip_code VARCHAR(10) NOT NULL,
    phone_number VARCHAR(20),
    email VARCHAR(100),
    capacity INT NOT NULL DEFAULT 1000 COMMENT 'Maximum households that can be served daily',
    status ENUM('active', 'inactive', 'maintenance') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT chk_capacity CHECK (capacity > 0),
    INDEX idx_city (city),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Distribution centers where aid is provided';

-- =====================================================
-- Table: Aid_Packages
-- =====================================================
-- Catalog of different types of aid packages available
-- =====================================================

CREATE TABLE IF NOT EXISTS Aid_Packages (
    package_id INT AUTO_INCREMENT PRIMARY KEY,
    package_name VARCHAR(100) NOT NULL,
    description TEXT,
    category ENUM('food', 'medical', 'shelter', 'hygiene', 'education', 'emergency') NOT NULL,
    unit_weight_kg DECIMAL(8,2) COMMENT 'Weight in kilograms',
    estimated_cost DECIMAL(10,2) NOT NULL COMMENT 'Cost in USD',
    validity_period_days INT NOT NULL DEFAULT 30 COMMENT 'How often a household can receive this package',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT chk_cost CHECK (estimated_cost >= 0),
    CONSTRAINT chk_validity CHECK (validity_period_days > 0),
    INDEX idx_category (category),
    INDEX idx_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Types of aid packages available for distribution';

-- =====================================================
-- Table: Households
-- =====================================================
-- Beneficiary families registered in the system
-- =====================================================

CREATE TABLE IF NOT EXISTS Households (
    household_id INT AUTO_INCREMENT PRIMARY KEY,
    family_name VARCHAR(100) NOT NULL,
    primary_contact_name VARCHAR(100) NOT NULL,
    phone_number VARCHAR(20) NOT NULL,
    email VARCHAR(100),
    address VARCHAR(255) NOT NULL,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(50) NOT NULL,
    zip_code VARCHAR(10) NOT NULL,
    family_size INT NOT NULL COMMENT 'Number of family members',
    income_level ENUM('no_income', 'very_low', 'low', 'moderate') NOT NULL,
    priority_level ENUM('critical', 'high', 'medium', 'low') DEFAULT 'medium',
    registration_date DATE NOT NULL,
    last_verified_date DATE,
    status ENUM('active', 'inactive', 'suspended') DEFAULT 'active',
    notes TEXT COMMENT 'Special circumstances or requirements',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT chk_family_size CHECK (family_size > 0),
    CONSTRAINT uq_phone UNIQUE (phone_number),
    INDEX idx_city (city),
    INDEX idx_status (status),
    INDEX idx_priority (priority_level),
    INDEX idx_registration_date (registration_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Registered households eligible for aid';

-- =====================================================
-- Table: Staff_Members
-- =====================================================
-- Aid workers who distribute packages
-- =====================================================

CREATE TABLE IF NOT EXISTS Staff_Members (
    staff_id INT AUTO_INCREMENT PRIMARY KEY,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    phone_number VARCHAR(20),
    role ENUM('admin', 'manager', 'worker', 'volunteer') DEFAULT 'worker',
    center_id INT,
    hire_date DATE NOT NULL,
    status ENUM('active', 'inactive', 'on_leave') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_staff_center FOREIGN KEY (center_id)
        REFERENCES Distribution_Centers(center_id)
        ON DELETE SET NULL
        ON UPDATE CASCADE,
    INDEX idx_role (role),
    INDEX idx_status (status),
    INDEX idx_center (center_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Staff members working at distribution centers';

-- =====================================================
-- Table: Inventory
-- =====================================================
-- Tracks quantity of each package type at each center
-- CRITICAL: This table is locked during distribution
-- =====================================================

CREATE TABLE IF NOT EXISTS Inventory (
    inventory_id INT AUTO_INCREMENT PRIMARY KEY,
    center_id INT NOT NULL,
    package_id INT NOT NULL,
    quantity_on_hand INT NOT NULL DEFAULT 0 COMMENT 'Current available quantity',
    reorder_level INT NOT NULL DEFAULT 50 COMMENT 'Alert threshold for restocking',
    last_restock_date DATE,
    last_restock_quantity INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_inventory_center FOREIGN KEY (center_id)
        REFERENCES Distribution_Centers(center_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    CONSTRAINT fk_inventory_package FOREIGN KEY (package_id)
        REFERENCES Aid_Packages(package_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    CONSTRAINT chk_quantity CHECK (quantity_on_hand >= 0),
    CONSTRAINT chk_reorder CHECK (reorder_level >= 0),
    CONSTRAINT uq_center_package UNIQUE (center_id, package_id),
    INDEX idx_center (center_id),
    INDEX idx_package (package_id),
    INDEX idx_low_stock (quantity_on_hand)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Inventory levels for each package at each center';

-- =====================================================
-- Table: Distribution_Log
-- =====================================================
-- IMMUTABLE AUDIT TRAIL: Every distribution is recorded here
-- This is the "book of record" - never updated, only inserted
-- =====================================================

CREATE TABLE IF NOT EXISTS Distribution_Log (
    log_id INT AUTO_INCREMENT PRIMARY KEY,
    household_id INT NOT NULL,
    package_id INT NOT NULL,
    center_id INT NOT NULL,
    staff_id INT,
    quantity_distributed INT NOT NULL DEFAULT 1,
    distribution_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    transaction_status ENUM('success', 'failed', 'cancelled') DEFAULT 'success',
    failure_reason VARCHAR(255) COMMENT 'Reason if transaction failed',
    notes TEXT COMMENT 'Additional notes about this distribution',

    CONSTRAINT fk_log_household FOREIGN KEY (household_id)
        REFERENCES Households(household_id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,
    CONSTRAINT fk_log_package FOREIGN KEY (package_id)
        REFERENCES Aid_Packages(package_id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,
    CONSTRAINT fk_log_center FOREIGN KEY (center_id)
        REFERENCES Distribution_Centers(center_id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,
    CONSTRAINT fk_log_staff FOREIGN KEY (staff_id)
        REFERENCES Staff_Members(staff_id)
        ON DELETE SET NULL
        ON UPDATE CASCADE,
    CONSTRAINT chk_quantity_distributed CHECK (quantity_distributed > 0),
    INDEX idx_household (household_id),
    INDEX idx_package (package_id),
    INDEX idx_center (center_id),
    INDEX idx_date (distribution_date),
    INDEX idx_status (transaction_status),
    INDEX idx_household_package (household_id, package_id, distribution_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Immutable audit log of all distributions';

-- Display confirmation
SELECT 'All tables created successfully' AS status;
