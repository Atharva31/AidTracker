-- =====================================================
-- AidTracker Seed Data
-- =====================================================
-- Realistic sample data for development and testing
-- =====================================================

USE aidtracker_db;

-- =====================================================
-- Seed Distribution Centers
-- =====================================================

INSERT INTO Distribution_Centers (center_name, address, city, state, zip_code, phone_number, email, capacity, status) VALUES
('Downtown Relief Center', '123 Main Street', 'San Jose', 'California', '95110', '408-555-0101', 'downtown@aidtracker.org', 1500, 'active'),
('Eastside Community Hub', '456 King Road', 'San Jose', 'California', '95122', '408-555-0102', 'eastside@aidtracker.org', 1200, 'active'),
('Northside Aid Station', '789 North First Street', 'San Jose', 'California', '95134', '408-555-0103', 'northside@aidtracker.org', 1000, 'active'),
('Westside Distribution Point', '321 West San Carlos', 'San Jose', 'California', '95126', '408-555-0104', 'westside@aidtracker.org', 800, 'active'),
('South Valley Center', '654 Blossom Hill Road', 'San Jose', 'California', '95123', '408-555-0105', 'southvalley@aidtracker.org', 1300, 'active'),
('Campbell Family Services', '147 Campbell Avenue', 'Campbell', 'California', '95008', '408-555-0106', 'campbell@aidtracker.org', 600, 'active'),
('Milpitas Outreach Center', '258 Main Street', 'Milpitas', 'California', '95035', '408-555-0107', 'milpitas@aidtracker.org', 700, 'active');

-- =====================================================
-- Seed Aid Packages
-- =====================================================

INSERT INTO Aid_Packages (package_name, description, category, unit_weight_kg, estimated_cost, validity_period_days, is_active) VALUES
-- Food Packages
('Basic Food Kit', 'Rice, beans, pasta, canned vegetables, cooking oil - 1 week supply for family of 4', 'food', 15.50, 45.00, 7, TRUE),
('Monthly Food Basket', 'Comprehensive food supply including grains, proteins, vegetables, fruits - 1 month for family of 4', 'food', 45.00, 150.00, 30, TRUE),
('Emergency Food Box', 'Ready-to-eat meals, water, energy bars - 3 day emergency supply', 'emergency', 8.00, 35.00, 3, TRUE),
('Fresh Produce Box', 'Seasonal fruits and vegetables - 1 week supply', 'food', 12.00, 40.00, 7, TRUE),

-- Medical Packages
('Basic First Aid Kit', 'Bandages, antiseptic, pain relievers, basic medical supplies', 'medical', 2.50, 25.00, 90, TRUE),
('Chronic Care Package', 'Diabetes and hypertension management supplies', 'medical', 1.50, 60.00, 30, TRUE),
('Personal Hygiene Kit', 'Soap, toothpaste, shampoo, sanitary products, toilet paper', 'hygiene', 5.00, 30.00, 30, TRUE),

-- Shelter & Emergency
('Emergency Shelter Kit', 'Blankets, sleeping bags, tarp, basic shelter supplies', 'shelter', 8.00, 80.00, 180, TRUE),
('Winter Warmth Package', 'Warm clothing, blankets, heaters (small), thermal supplies', 'shelter', 10.00, 100.00, 365, TRUE),

-- Education
('School Supplies Kit', 'Notebooks, pens, pencils, backpack, basic learning materials', 'education', 3.00, 35.00, 180, TRUE),

-- Hygiene
('Baby Care Package', 'Diapers, wipes, baby food, formula, baby hygiene products', 'hygiene', 7.00, 55.00, 14, TRUE),
('Senior Care Kit', 'Adult care products, mobility aids, health monitoring supplies', 'medical', 4.00, 65.00, 30, TRUE);

-- =====================================================
-- Seed Staff Members
-- =====================================================

INSERT INTO Staff_Members (first_name, last_name, email, phone_number, role, center_id, hire_date, status) VALUES
-- Admin
('Sarah', 'Johnson', 'sarah.johnson@aidtracker.org', '408-555-1001', 'admin', 1, '2023-01-15', 'active'),
('Michael', 'Chen', 'michael.chen@aidtracker.org', '408-555-1002', 'admin', 1, '2023-01-15', 'active'),

-- Managers
('Jennifer', 'Martinez', 'jennifer.martinez@aidtracker.org', '408-555-1003', 'manager', 1, '2023-02-01', 'active'),
('David', 'Patel', 'david.patel@aidtracker.org', '408-555-1004', 'manager', 2, '2023-02-15', 'active'),
('Lisa', 'Thompson', 'lisa.thompson@aidtracker.org', '408-555-1005', 'manager', 3, '2023-03-01', 'active'),

-- Workers
('James', 'Wilson', 'james.wilson@aidtracker.org', '408-555-1006', 'worker', 1, '2023-03-15', 'active'),
('Maria', 'Garcia', 'maria.garcia@aidtracker.org', '408-555-1007', 'worker', 1, '2023-04-01', 'active'),
('Robert', 'Lee', 'robert.lee@aidtracker.org', '408-555-1008', 'worker', 2, '2023-04-15', 'active'),
('Emily', 'Nguyen', 'emily.nguyen@aidtracker.org', '408-555-1009', 'worker', 2, '2023-05-01', 'active'),
('Christopher', 'Brown', 'christopher.brown@aidtracker.org', '408-555-1010', 'worker', 3, '2023-05-15', 'active'),
('Amanda', 'Davis', 'amanda.davis@aidtracker.org', '408-555-1011', 'worker', 3, '2023-06-01', 'active'),
('Daniel', 'Rodriguez', 'daniel.rodriguez@aidtracker.org', '408-555-1012', 'worker', 4, '2023-06-15', 'active'),

-- Volunteers
('Jessica', 'Miller', 'jessica.miller@volunteer.org', '408-555-1013', 'volunteer', 4, '2024-01-01', 'active'),
('Kevin', 'Anderson', 'kevin.anderson@volunteer.org', '408-555-1014', 'volunteer', 5, '2024-01-15', 'active'),
('Rachel', 'Taylor', 'rachel.taylor@volunteer.org', '408-555-1015', 'volunteer', 5, '2024-02-01', 'active');

-- =====================================================
-- Seed Households
-- =====================================================

INSERT INTO Households (family_name, primary_contact_name, phone_number, email, address, city, state, zip_code, family_size, income_level, priority_level, registration_date, last_verified_date, status, notes) VALUES
-- Critical Priority
('Ramirez Family', 'Carmen Ramirez', '408-555-2001', 'carmen.r@email.com', '111 Oak Street', 'San Jose', 'California', '95110', 5, 'no_income', 'critical', '2024-01-10', '2024-11-01', 'active', 'Single parent, 3 children under 10, recently unemployed'),
('Singh Family', 'Rajesh Singh', '408-555-2002', 'rajesh.s@email.com', '222 Pine Avenue', 'San Jose', 'California', '95122', 6, 'no_income', 'critical', '2024-01-15', '2024-11-01', 'active', 'Recent immigrants, seeking employment'),
('Johnson Family', 'Patricia Johnson', '408-555-2003', 'patricia.j@email.com', '333 Elm Street', 'San Jose', 'California', '95134', 4, 'very_low', 'critical', '2024-02-01', '2024-11-05', 'active', 'Elderly care, medical expenses'),

-- High Priority
('Martinez Family', 'Luis Martinez', '408-555-2004', 'luis.m@email.com', '444 Maple Drive', 'San Jose', 'California', '95126', 7, 'very_low', 'high', '2024-02-10', '2024-10-20', 'active', 'Large family, two working but low income'),
('Chen Family', 'Wei Chen', '408-555-2005', 'wei.c@email.com', '555 Cedar Lane', 'San Jose', 'California', '95123', 3, 'very_low', 'high', '2024-02-15', '2024-10-25', 'active', 'Single income household'),
('Williams Family', 'Angela Williams', '408-555-2006', 'angela.w@email.com', '666 Birch Court', 'San Jose', 'California', '95110', 5, 'low', 'high', '2024-03-01', '2024-11-01', 'active', 'Medical bills, one child with special needs'),
('Patel Family', 'Priya Patel', '408-555-2007', 'priya.p@email.com', '777 Walnut Street', 'Campbell', 'California', '95008', 4, 'very_low', 'high', '2024-03-10', '2024-10-15', 'active', 'Recent job loss'),
('Thompson Family', 'Marcus Thompson', '408-555-2008', NULL, '888 Spruce Avenue', 'Milpitas', 'California', '95035', 6, 'low', 'high', '2024-03-15', '2024-10-30', 'active', 'Seasonal employment, income varies'),

-- Medium Priority
('Garcia Family', 'Rosa Garcia', '408-555-2009', 'rosa.g@email.com', '999 Redwood Drive', 'San Jose', 'California', '95122', 3, 'low', 'medium', '2024-04-01', '2024-11-10', 'active', NULL),
('Lee Family', 'David Lee', '408-555-2010', 'david.l@email.com', '101 Ash Street', 'San Jose', 'California', '95134', 4, 'low', 'medium', '2024-04-10', '2024-11-05', 'active', NULL),
('Nguyen Family', 'Thi Nguyen', '408-555-2011', 'thi.n@email.com', '202 Poplar Lane', 'San Jose', 'California', '95126', 5, 'low', 'medium', '2024-04-15', '2024-10-28', 'active', NULL),
('Brown Family', 'Michelle Brown', '408-555-2012', 'michelle.b@email.com', '303 Willow Court', 'San Jose', 'California', '95123', 3, 'moderate', 'medium', '2024-05-01', '2024-11-08', 'active', 'Part-time work, looking for full-time'),
('Davis Family', 'John Davis', '408-555-2013', 'john.d@email.com', '404 Cherry Street', 'Campbell', 'California', '95008', 4, 'low', 'medium', '2024-05-10', '2024-10-22', 'active', NULL),
('Rodriguez Family', 'Elena Rodriguez', '408-555-2014', 'elena.r@email.com', '505 Magnolia Drive', 'Milpitas', 'California', '95035', 5, 'low', 'medium', '2024-05-15', '2024-11-01', 'active', NULL),
('Miller Family', 'Robert Miller', '408-555-2015', NULL, '606 Sycamore Avenue', 'San Jose', 'California', '95110', 2, 'moderate', 'medium', '2024-06-01', '2024-10-18', 'active', 'Elderly couple, fixed income'),

-- Low Priority
('Anderson Family', 'Karen Anderson', '408-555-2016', 'karen.a@email.com', '707 Hickory Lane', 'San Jose', 'California', '95122', 3, 'moderate', 'low', '2024-06-15', '2024-10-25', 'active', NULL),
('Taylor Family', 'Steven Taylor', '408-555-2017', 'steven.t@email.com', '808 Dogwood Court', 'San Jose', 'California', '95134', 4, 'moderate', 'low', '2024-07-01', '2024-11-02', 'active', NULL),
('White Family', 'Jennifer White', '408-555-2018', 'jennifer.w@email.com', '909 Juniper Street', 'San Jose', 'California', '95126', 3, 'moderate', 'low', '2024-07-10', '2024-10-20', 'active', NULL),
('Harris Family', 'Michael Harris', '408-555-2019', NULL, '1010 Fir Drive', 'Campbell', 'California', '95008', 2, 'moderate', 'low', '2024-07-15', '2024-11-05', 'active', NULL),
('Martin Family', 'Susan Martin', '408-555-2020', 'susan.m@email.com', '1111 Cypress Avenue', 'Milpitas', 'California', '95035', 4, 'moderate', 'low', '2024-08-01', '2024-10-15', 'active', NULL),

-- Additional households for testing
('Clark Family', 'Thomas Clark', '408-555-2021', 'thomas.c@email.com', '1212 Palm Street', 'San Jose', 'California', '95123', 5, 'low', 'medium', '2024-08-15', '2024-11-12', 'active', NULL),
('Lewis Family', 'Barbara Lewis', '408-555-2022', 'barbara.l@email.com', '1313 Laurel Lane', 'San Jose', 'California', '95110', 3, 'very_low', 'high', '2024-09-01', '2024-11-08', 'active', NULL),
('Walker Family', 'Charles Walker', '408-555-2023', NULL, '1414 Cedar Court', 'San Jose', 'California', '95122', 6, 'no_income', 'critical', '2024-09-10', '2024-11-10', 'active', 'Recently homeless, temporary housing'),
('Hall Family', 'Nancy Hall', '408-555-2024', 'nancy.h@email.com', '1515 Pine Street', 'Campbell', 'California', '95008', 4, 'low', 'medium', '2024-09-15', '2024-10-30', 'active', NULL),
('Allen Family', 'Paul Allen', '408-555-2025', 'paul.a@email.com', '1616 Oak Drive', 'Milpitas', 'California', '95035', 3, 'moderate', 'low', '2024-10-01', '2024-11-01', 'active', NULL),

-- More households for robust testing
('Young Family', 'Linda Young', '408-555-2026', 'linda.y@email.com', '1717 Maple Avenue', 'San Jose', 'California', '95134', 5, 'low', 'medium', '2024-10-10', '2024-11-05', 'active', NULL),
('King Family', 'William King', '408-555-2027', NULL, '1818 Elm Street', 'San Jose', 'California', '95126', 4, 'very_low', 'high', '2024-10-15', '2024-11-08', 'active', NULL),
('Wright Family', 'Betty Wright', '408-555-2028', 'betty.w@email.com', '1919 Birch Lane', 'San Jose', 'California', '95123', 2, 'moderate', 'low', '2024-10-20', '2024-11-10', 'active', 'Retired couple'),
('Lopez Family', 'Jose Lopez', '408-555-2029', 'jose.l@email.com', '2020 Walnut Court', 'San Jose', 'California', '95110', 7, 'very_low', 'high', '2024-11-01', '2024-11-15', 'active', 'Recent medical emergency'),
('Hill Family', 'Dorothy Hill', '408-555-2030', 'dorothy.h@email.com', '2121 Spruce Drive', 'Campbell', 'California', '95008', 3, 'low', 'medium', '2024-11-05', '2024-11-15', 'active', NULL);

-- =====================================================
-- Seed Initial Inventory
-- =====================================================

-- Downtown Relief Center (center_id = 1) - Well stocked
INSERT INTO Inventory (center_id, package_id, quantity_on_hand, reorder_level, last_restock_date, last_restock_quantity) VALUES
(1, 1, 150, 50, '2024-11-20', 200),  -- Basic Food Kit
(1, 2, 80, 30, '2024-11-20', 100),   -- Monthly Food Basket
(1, 3, 100, 40, '2024-11-25', 100),  -- Emergency Food Box
(1, 4, 60, 25, '2024-11-22', 80),    -- Fresh Produce Box
(1, 5, 120, 30, '2024-11-15', 150),  -- Basic First Aid Kit
(1, 6, 40, 15, '2024-11-18', 50),    -- Chronic Care Package
(1, 7, 90, 30, '2024-11-20', 100),   -- Personal Hygiene Kit
(1, 8, 25, 10, '2024-11-10', 30),    -- Emergency Shelter Kit
(1, 9, 15, 5, '2024-11-01', 20),     -- Winter Warmth Package
(1, 10, 70, 20, '2024-11-15', 80),   -- School Supplies Kit
(1, 11, 55, 20, '2024-11-23', 60),   -- Baby Care Package
(1, 12, 30, 10, '2024-11-18', 40);   -- Senior Care Kit

-- Eastside Community Hub (center_id = 2)
INSERT INTO Inventory (center_id, package_id, quantity_on_hand, reorder_level, last_restock_date, last_restock_quantity) VALUES
(2, 1, 120, 50, '2024-11-21', 150),
(2, 2, 65, 30, '2024-11-21', 80),
(2, 3, 85, 40, '2024-11-24', 100),
(2, 4, 45, 25, '2024-11-23', 60),
(2, 5, 95, 30, '2024-11-16', 120),
(2, 6, 32, 15, '2024-11-19', 40),
(2, 7, 75, 30, '2024-11-21', 90),
(2, 8, 18, 10, '2024-11-12', 25),
(2, 9, 10, 5, '2024-11-05', 15),
(2, 10, 55, 20, '2024-11-17', 70),
(2, 11, 48, 20, '2024-11-22', 55),
(2, 12, 22, 10, '2024-11-20', 30);

-- Northside Aid Station (center_id = 3)
INSERT INTO Inventory (center_id, package_id, quantity_on_hand, reorder_level, last_restock_date, last_restock_quantity) VALUES
(3, 1, 90, 50, '2024-11-19', 120),
(3, 2, 50, 30, '2024-11-19', 70),
(3, 3, 70, 40, '2024-11-26', 80),
(3, 4, 35, 25, '2024-11-21', 50),
(3, 5, 80, 30, '2024-11-14', 100),
(3, 6, 28, 15, '2024-11-17', 35),
(3, 7, 60, 30, '2024-11-19', 75),
(3, 8, 15, 10, '2024-11-11', 20),
(3, 9, 8, 5, '2024-11-03', 12),
(3, 10, 45, 20, '2024-11-16', 60),
(3, 11, 40, 20, '2024-11-24', 50),
(3, 12, 18, 10, '2024-11-19', 25);

-- Westside Distribution Point (center_id = 4)
INSERT INTO Inventory (center_id, package_id, quantity_on_hand, reorder_level, last_restock_date, last_restock_quantity) VALUES
(4, 1, 75, 50, '2024-11-22', 100),
(4, 2, 42, 30, '2024-11-22', 60),
(4, 3, 55, 40, '2024-11-27', 70),
(4, 4, 28, 25, '2024-11-20', 40),
(4, 5, 65, 30, '2024-11-13', 85),
(4, 6, 20, 15, '2024-11-16', 28),
(4, 7, 48, 30, '2024-11-22', 60),
(4, 8, 12, 10, '2024-11-09', 18),
(4, 9, 6, 5, '2024-11-02', 10),
(4, 10, 38, 20, '2024-11-15', 50),
(4, 11, 32, 20, '2024-11-21', 42),
(4, 12, 15, 10, '2024-11-18', 22);

-- South Valley Center (center_id = 5)
INSERT INTO Inventory (center_id, package_id, quantity_on_hand, reorder_level, last_restock_date, last_restock_quantity) VALUES
(5, 1, 100, 50, '2024-11-23', 130),
(5, 2, 58, 30, '2024-11-23', 75),
(5, 3, 78, 40, '2024-11-25', 90),
(5, 4, 40, 25, '2024-11-24', 55),
(5, 5, 72, 30, '2024-11-17', 95),
(5, 6, 25, 15, '2024-11-20', 32),
(5, 7, 55, 30, '2024-11-23', 70),
(5, 8, 20, 10, '2024-11-13', 28),
(5, 9, 12, 5, '2024-11-06', 18),
(5, 10, 50, 20, '2024-11-18', 65),
(5, 11, 45, 20, '2024-11-26', 52),
(5, 12, 20, 10, '2024-11-21', 28);

-- Campbell Family Services (center_id = 6) - Some low stock items
INSERT INTO Inventory (center_id, package_id, quantity_on_hand, reorder_level, last_restock_date, last_restock_quantity) VALUES
(6, 1, 45, 50, '2024-11-18', 80),   -- LOW STOCK
(6, 2, 25, 30, '2024-11-18', 50),   -- LOW STOCK
(6, 3, 60, 40, '2024-11-28', 65),
(6, 4, 20, 25, '2024-11-19', 35),   -- LOW STOCK
(6, 5, 55, 30, '2024-11-12', 70),
(6, 6, 12, 15, '2024-11-15', 20),   -- LOW STOCK
(6, 7, 35, 30, '2024-11-18', 50),
(6, 8, 8, 10, '2024-11-08', 15),    -- LOW STOCK
(6, 9, 3, 5, '2024-11-01', 8),      -- LOW STOCK
(6, 10, 28, 20, '2024-11-14', 40),
(6, 11, 25, 20, '2024-11-20', 35),
(6, 12, 10, 10, '2024-11-17', 18);

-- Milpitas Outreach Center (center_id = 7) - Critical low stock
INSERT INTO Inventory (center_id, package_id, quantity_on_hand, reorder_level, last_restock_date, last_restock_quantity) VALUES
(7, 1, 1, 50, '2024-11-10', 60),    -- CRITICAL - Only 1 left! (for race condition demo)
(7, 2, 15, 30, '2024-11-10', 40),   -- LOW STOCK
(7, 3, 48, 40, '2024-11-27', 55),
(7, 4, 18, 25, '2024-11-18', 30),   -- LOW STOCK
(7, 5, 42, 30, '2024-11-11', 60),
(7, 6, 8, 15, '2024-11-14', 15),    -- LOW STOCK
(7, 7, 30, 30, '2024-11-10', 45),
(7, 8, 5, 10, '2024-11-07', 12),    -- LOW STOCK
(7, 9, 2, 5, '2024-10-30', 6),      -- CRITICAL LOW
(7, 10, 22, 20, '2024-11-13', 35),
(7, 11, 18, 20, '2024-11-19', 28),  -- LOW STOCK
(7, 12, 7, 10, '2024-11-16', 15);   -- LOW STOCK

-- =====================================================
-- Seed Some Historical Distribution Data
-- =====================================================
-- This creates realistic distribution history

-- Distributions from last month (October)
INSERT INTO Distribution_Log (household_id, package_id, center_id, staff_id, quantity_distributed, distribution_date, transaction_status, notes) VALUES
-- Week 1 of October
(1, 2, 1, 6, 1, '2024-10-02 09:15:00', 'success', 'First time recipient'),
(2, 1, 1, 7, 1, '2024-10-02 09:30:00', 'success', 'Basic food kit provided'),
(3, 7, 1, 6, 1, '2024-10-02 10:00:00', 'success', 'Hygiene package requested'),
(4, 2, 2, 8, 1, '2024-10-03 08:45:00', 'success', 'Monthly basket for large family'),
(5, 1, 2, 9, 1, '2024-10-03 09:00:00', 'success', NULL),
(6, 5, 1, 7, 1, '2024-10-03 14:30:00', 'success', 'First aid kit for child'),
(7, 2, 6, 12, 1, '2024-10-04 10:15:00', 'success', NULL),
(8, 1, 7, 14, 1, '2024-10-04 11:00:00', 'success', NULL),

-- Week 2 of October
(9, 1, 2, 8, 1, '2024-10-08 09:00:00', 'success', NULL),
(10, 2, 3, 10, 1, '2024-10-08 09:30:00', 'success', NULL),
(11, 1, 3, 11, 1, '2024-10-09 10:00:00', 'success', NULL),
(12, 7, 1, 6, 1, '2024-10-09 14:00:00', 'success', NULL),
(13, 1, 6, 12, 1, '2024-10-10 08:30:00', 'success', NULL),
(14, 2, 7, 15, 1, '2024-10-10 09:15:00', 'success', NULL),
(15, 1, 1, 7, 1, '2024-10-11 10:30:00', 'success', NULL),

-- Week 3 of October
(16, 1, 2, 8, 1, '2024-10-15 09:00:00', 'success', NULL),
(17, 2, 3, 10, 1, '2024-10-15 10:00:00', 'success', NULL),
(18, 1, 1, 6, 1, '2024-10-16 09:30:00', 'success', NULL),
(19, 7, 6, 12, 1, '2024-10-16 11:00:00', 'success', NULL),
(20, 1, 7, 14, 1, '2024-10-17 08:45:00', 'success', NULL),

-- Week 4 of October
(1, 1, 1, 7, 1, '2024-10-22 09:00:00', 'success', 'Weekly food kit'),
(2, 7, 1, 6, 1, '2024-10-22 10:00:00', 'success', NULL),
(3, 1, 1, 7, 1, '2024-10-23 09:30:00', 'success', NULL),
(4, 1, 2, 8, 1, '2024-10-23 10:00:00', 'success', NULL),
(5, 7, 2, 9, 1, '2024-10-24 14:00:00', 'success', NULL);

-- Recent distributions (November - within last few days)
INSERT INTO Distribution_Log (household_id, package_id, center_id, staff_id, quantity_distributed, distribution_date, transaction_status, notes) VALUES
-- This week
(21, 2, 1, 6, 1, '2024-11-25 09:00:00', 'success', NULL),
(22, 1, 1, 7, 1, '2024-11-25 09:30:00', 'success', NULL),
(23, 3, 1, 6, 1, '2024-11-25 10:00:00', 'success', 'Emergency food box'),
(24, 1, 6, 12, 1, '2024-11-26 08:45:00', 'success', NULL),
(25, 2, 7, 14, 1, '2024-11-26 09:15:00', 'success', NULL),
(26, 1, 3, 10, 1, '2024-11-27 10:00:00', 'success', NULL),
(27, 7, 1, 7, 1, '2024-11-27 11:00:00', 'success', NULL),
(28, 1, 2, 8, 1, '2024-11-28 09:00:00', 'success', NULL),
(29, 2, 1, 6, 1, '2024-11-28 10:30:00', 'success', NULL),
(30, 1, 6, 12, 1, '2024-11-28 14:00:00', 'success', NULL);

-- Some failed transactions (for testing/demonstration)
INSERT INTO Distribution_Log (household_id, package_id, center_id, staff_id, quantity_distributed, distribution_date, transaction_status, failure_reason, notes) VALUES
(1, 1, 1, 6, 1, '2024-11-29 09:00:00', 'failed', 'Insufficient inventory', 'Attempted distribution but stock depleted'),
(5, 2, 2, 8, 1, '2024-11-28 15:00:00', 'failed', 'Household not eligible - received 2 days ago', 'Validity period not met');

-- Display confirmation
SELECT 'Seed data inserted successfully' AS status;
SELECT '==================================' AS "separator";
SELECT 'Database Statistics:' AS info;
SELECT COUNT(*) AS total_centers FROM Distribution_Centers;
SELECT COUNT(*) AS total_packages FROM Aid_Packages;
SELECT COUNT(*) AS total_households FROM Households;
SELECT COUNT(*) AS total_staff FROM Staff_Members;
SELECT COUNT(*) AS total_inventory_records FROM Inventory;
SELECT COUNT(*) AS total_distributions FROM Distribution_Log;
SELECT '==================================' AS "separator";
