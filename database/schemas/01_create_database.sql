-- =====================================================
-- AidTracker Database Initialization
-- =====================================================
-- This script initializes the AidTracker database
-- with UTF-8 character set for international support
-- =====================================================

-- Use the database (created by docker-compose environment variables)
USE aidtracker_db;

-- Set character set and collation for international support
ALTER DATABASE aidtracker_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

-- Display confirmation
SELECT 'Database aidtracker_db initialized successfully' AS status;
