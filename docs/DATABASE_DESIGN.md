# AidTracker Database Design

Comprehensive database schema documentation with design decisions and rationale.

---

## Design Philosophy

### Goals

1. **Data Integrity**: Prevent corruption through constraints and transactions
2. **Performance**: Optimize for frequent read and write operations
3. **Audit Trail**: Maintain complete, immutable distribution history
4. **Concurrency**: Handle multiple simultaneous transactions safely
5. **Scalability**: Support growth in data volume

### Normalization

The database is normalized to **Third Normal Form (3NF)**:
- ✅ First Normal Form (1NF): All columns contain atomic values
- ✅ Second Normal Form (2NF): No partial dependencies
- ✅ Third Normal Form (3NF): No transitive dependencies

**Why 3NF?**
- Eliminates data redundancy
- Prevents update anomalies
- Maintains data consistency
- Simplifies data maintenance

---

## Entity-Relationship Diagram

```
┌─────────────────────┐
│ Distribution_Centers│
│ (PK: center_id)     │
└──────────┬──────────┘
           │
           │ 1:N
           │
┌──────────┴──────────┐         ┌─────────────────┐
│    Inventory        │ N:1     │  Aid_Packages   │
│ (PK: inventory_id)  ├─────────┤ (PK: package_id)│
│ (FK: center_id,     │         └────────┬────────┘
│      package_id)    │                  │
└──────────┬──────────┘                  │
           │                             │
           │ (Locked during distribution)│
           │                             │
           │ N:1                     N:1 │
           │                             │
┌──────────┴──────────┐                  │
│ Distribution_Log    │                  │
│ (PK: log_id)        ├──────────────────┘
│ (FK: household_id,  │
│      package_id,    │
│      center_id,     │
│      staff_id)      │
└──────────┬──────────┘
           │
           │ N:1
           │
┌──────────┴──────────┐
│    Households       │
│ (PK: household_id)  │
└─────────────────────┘

┌──────────────────┐
│  Staff_Members   │  N:1 (works at)
│ (PK: staff_id)   ├───────────────────► Distribution_Centers
│ (FK: center_id)  │
└──────────────────┘
```

---

## Table Schemas

### 1. Distribution_Centers

**Purpose**: Stores information about aid distribution locations.

**Schema**:
```sql
CREATE TABLE Distribution_Centers (
    center_id INT AUTO_INCREMENT PRIMARY KEY,
    center_name VARCHAR(100) NOT NULL,
    address VARCHAR(255) NOT NULL,
    city VARCHAR(100) NOT NULL INDEX,
    state VARCHAR(50) NOT NULL,
    zip_code VARCHAR(10) NOT NULL,
    phone_number VARCHAR(20),
    email VARCHAR(100),
    capacity INT NOT NULL DEFAULT 1000
        COMMENT 'Max households served daily',
    status ENUM('active', 'inactive', 'maintenance')
        DEFAULT 'active' INDEX,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;
```

**Indexes**:
- Primary: `center_id`
- Secondary: `city`, `status`

**Constraints**:
- `capacity > 0`

---

### 2. Aid_Packages

**Purpose**: Catalog of different aid package types.

**Schema**:
```sql
CREATE TABLE Aid_Packages (
    package_id INT AUTO_INCREMENT PRIMARY KEY,
    package_name VARCHAR(100) NOT NULL,
    description TEXT,
    category ENUM('food', 'medical', 'shelter',
                  'hygiene', 'education', 'emergency')
        NOT NULL INDEX,
    unit_weight_kg DECIMAL(8,2),
    estimated_cost DECIMAL(10,2) NOT NULL,
    validity_period_days INT NOT NULL DEFAULT 30
        COMMENT 'How often household can receive',
    is_active BOOLEAN DEFAULT TRUE INDEX,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;
```

**Indexes**:
- Primary: `package_id`
- Secondary: `category`, `is_active`

**Constraints**:
- `estimated_cost >= 0`
- `validity_period_days > 0`

**Design Decision**: `validity_period_days` prevents households from receiving the same package too frequently, ensuring fair distribution.

---

### 3. Households

**Purpose**: Beneficiary families registered in the system.

**Schema**:
```sql
CREATE TABLE Households (
    household_id INT AUTO_INCREMENT PRIMARY KEY,
    family_name VARCHAR(100) NOT NULL,
    primary_contact_name VARCHAR(100) NOT NULL,
    phone_number VARCHAR(20) NOT NULL UNIQUE,
    email VARCHAR(100),
    address VARCHAR(255) NOT NULL,
    city VARCHAR(100) NOT NULL INDEX,
    state VARCHAR(50) NOT NULL,
    zip_code VARCHAR(10) NOT NULL,
    family_size INT NOT NULL,
    income_level ENUM('no_income', 'very_low', 'low', 'moderate')
        NOT NULL,
    priority_level ENUM('critical', 'high', 'medium', 'low')
        DEFAULT 'medium' INDEX,
    registration_date DATE NOT NULL INDEX,
    last_verified_date DATE,
    status ENUM('active', 'inactive', 'suspended')
        DEFAULT 'active' INDEX,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT chk_family_size CHECK (family_size > 0)
) ENGINE=InnoDB;
```

**Indexes**:
- Primary: `household_id`
- Unique: `phone_number`
- Secondary: `city`, `status`, `priority_level`, `registration_date`

**Design Decision**: `phone_number` is unique to prevent duplicate registrations (ghost beneficiaries).

---

### 4. Staff_Members

**Purpose**: Aid workers who distribute packages.

**Schema**:
```sql
CREATE TABLE Staff_Members (
    staff_id INT AUTO_INCREMENT PRIMARY KEY,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    phone_number VARCHAR(20),
    role ENUM('admin', 'manager', 'worker', 'volunteer')
        DEFAULT 'worker' INDEX,
    center_id INT,
    hire_date DATE NOT NULL,
    status ENUM('active', 'inactive', 'on_leave')
        DEFAULT 'active' INDEX,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (center_id)
        REFERENCES Distribution_Centers(center_id)
        ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB;
```

**Indexes**:
- Primary: `staff_id`
- Unique: `email`
- Secondary: `role`, `status`, `center_id`

**Foreign Keys**:
- `center_id` → `Distribution_Centers.center_id` (SET NULL on delete)

---

### 5. Inventory ⚠️ CRITICAL

**Purpose**: Tracks quantity of each package at each center.

**⚠️ THIS TABLE IS LOCKED DURING DISTRIBUTION** to prevent race conditions.

**Schema**:
```sql
CREATE TABLE Inventory (
    inventory_id INT AUTO_INCREMENT PRIMARY KEY,
    center_id INT NOT NULL,
    package_id INT NOT NULL,
    quantity_on_hand INT NOT NULL DEFAULT 0,
    reorder_level INT NOT NULL DEFAULT 50,
    last_restock_date DATE,
    last_restock_quantity INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (center_id)
        REFERENCES Distribution_Centers(center_id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (package_id)
        REFERENCES Aid_Packages(package_id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT chk_quantity CHECK (quantity_on_hand >= 0),
    CONSTRAINT chk_reorder CHECK (reorder_level >= 0),
    UNIQUE KEY uq_center_package (center_id, package_id)
) ENGINE=InnoDB;
```

**Indexes**:
- Primary: `inventory_id`
- Unique: `(center_id, package_id)`
- Secondary: `center_id`, `package_id`, `quantity_on_hand`

**Constraints**:
- `quantity_on_hand >= 0`: Cannot go negative
- `UNIQUE (center_id, package_id)`: One inventory record per package per center

**Design Decision**: The `UNIQUE` constraint ensures there's exactly one inventory row to lock, preventing lock ambiguity.

---

### 6. Distribution_Log (Audit Trail)

**Purpose**: Immutable record of every distribution attempt.

**⚠️ THIS TABLE IS APPEND-ONLY** - never updated or deleted.

**Schema**:
```sql
CREATE TABLE Distribution_Log (
    log_id INT AUTO_INCREMENT PRIMARY KEY,
    household_id INT NOT NULL,
    package_id INT NOT NULL,
    center_id INT NOT NULL,
    staff_id INT,
    quantity_distributed INT NOT NULL DEFAULT 1,
    distribution_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    transaction_status ENUM('success', 'failed', 'cancelled')
        DEFAULT 'success' INDEX,
    failure_reason VARCHAR(255),
    notes TEXT,
    FOREIGN KEY (household_id)
        REFERENCES Households(household_id)
        ON DELETE RESTRICT ON UPDATE CASCADE,
    FOREIGN KEY (package_id)
        REFERENCES Aid_Packages(package_id)
        ON DELETE RESTRICT ON UPDATE CASCADE,
    FOREIGN KEY (center_id)
        REFERENCES Distribution_Centers(center_id)
        ON DELETE RESTRICT ON UPDATE CASCADE,
    FOREIGN KEY (staff_id)
        REFERENCES Staff_Members(staff_id)
        ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT chk_quantity_distributed
        CHECK (quantity_distributed > 0)
) ENGINE=InnoDB;
```

**Indexes**:
- Primary: `log_id`
- Secondary: `household_id`, `package_id`, `center_id`, `distribution_date`, `transaction_status`
- Composite: `(household_id, package_id, distribution_date)`

**Foreign Keys**:
- All use `RESTRICT` on delete to prevent accidental deletion of referenced data
- `staff_id` uses `SET NULL` (OK if staff member is deleted)

**Design Decision**: `ON DELETE RESTRICT` ensures we cannot delete households, packages, or centers that have distribution history.

---

## Database Views

### vw_current_inventory_status

**Purpose**: Simplified inventory monitoring with stock alerts.

```sql
CREATE VIEW vw_current_inventory_status AS
SELECT
    i.inventory_id,
    dc.center_name,
    ap.package_name,
    i.quantity_on_hand,
    i.reorder_level,
    CASE
        WHEN i.quantity_on_hand = 0 THEN 'OUT_OF_STOCK'
        WHEN i.quantity_on_hand <= i.reorder_level THEN 'LOW_STOCK'
        ELSE 'IN_STOCK'
    END AS stock_status
FROM Inventory i
JOIN Distribution_Centers dc ON i.center_id = dc.center_id
JOIN Aid_Packages ap ON i.package_id = ap.package_id
WHERE dc.status = 'active' AND ap.is_active = TRUE;
```

---

### vw_household_eligibility

**Purpose**: Check which households are eligible for which packages.

```sql
CREATE VIEW vw_household_eligibility AS
SELECT
    h.household_id,
    h.family_name,
    dl.package_id,
    ap.package_name,
    MAX(dl.distribution_date) AS last_distribution_date,
    DATEDIFF(CURRENT_DATE, DATE(MAX(dl.distribution_date))) AS days_since,
    ap.validity_period_days,
    CASE
        WHEN DATEDIFF(CURRENT_DATE, DATE(MAX(dl.distribution_date)))
             >= ap.validity_period_days THEN 'ELIGIBLE'
        ELSE 'NOT_ELIGIBLE'
    END AS eligibility_status
FROM Households h
LEFT JOIN Distribution_Log dl ON h.household_id = dl.household_id
LEFT JOIN Aid_Packages ap ON dl.package_id = ap.package_id
WHERE h.status = 'active'
GROUP BY h.household_id, dl.package_id;
```

---

### vw_monthly_summary

**Purpose**: Reporting - monthly distribution statistics.

```sql
CREATE VIEW vw_monthly_summary AS
SELECT
    DATE_FORMAT(dl.distribution_date, '%Y-%m') AS month,
    dc.center_name,
    ap.category,
    COUNT(dl.log_id) AS total_distributions,
    COUNT(DISTINCT dl.household_id) AS unique_households,
    SUM(dl.quantity_distributed) AS total_packages,
    SUM(ap.estimated_cost * dl.quantity_distributed) AS total_value
FROM Distribution_Log dl
JOIN Distribution_Centers dc ON dl.center_id = dc.center_id
JOIN Aid_Packages ap ON dl.package_id = ap.package_id
WHERE dl.transaction_status = 'success'
GROUP BY month, dc.center_name, ap.category;
```

---

## Stored Procedures

### sp_distribute_package

**Purpose**: Core distribution logic with ACID transaction and locking.

See [CONCURRENCY_DEMO.md](CONCURRENCY_DEMO.md) for detailed explanation.

**Key Features**:
- `START TRANSACTION` for atomicity
- `SELECT ... FOR UPDATE` for pessimistic locking
- Multiple validation steps
- Automatic rollback on error
- Immutable audit logging

---

### sp_restock_inventory

**Purpose**: Safely add inventory.

```sql
CREATE PROCEDURE sp_restock_inventory(
    IN p_center_id INT,
    IN p_package_id INT,
    IN p_quantity INT
)
BEGIN
    DECLARE v_exists INT;

    START TRANSACTION;

    SELECT COUNT(*) INTO v_exists
    FROM Inventory
    WHERE center_id = p_center_id AND package_id = p_package_id;

    IF v_exists = 0 THEN
        INSERT INTO Inventory (...) VALUES (...);
    ELSE
        UPDATE Inventory
        SET quantity_on_hand = quantity_on_hand + p_quantity,
            last_restock_date = CURRENT_DATE,
            last_restock_quantity = p_quantity
        WHERE center_id = p_center_id AND package_id = p_package_id;
    END IF;

    COMMIT;
END;
```

---

## Indexes Strategy

### B-Tree Indexes

All indexes use MySQL's default B-Tree structure.

**Primary Keys**: Auto-indexed, clustered
**Foreign Keys**: Indexed for join performance
**Filter Columns**: Status, category, priority
**Date Columns**: For time-range queries

### Index Analysis

```sql
-- Check index usage
SHOW INDEX FROM Inventory;

-- Verify index is used
EXPLAIN SELECT * FROM Inventory WHERE center_id = 1;
```

**Expected**: `type: ref`, `key: center_id`

---

## Transaction Management

### Isolation Level

Default: `REPEATABLE READ` (MySQL InnoDB default)

This prevents:
- **Dirty reads**: Reading uncommitted data
- **Non-repeatable reads**: Data changes between reads

But allows:
- **Phantom reads**: New rows appearing (acceptable for our use case)

### Lock Escalation

InnoDB uses:
- **Row-level locks** for `SELECT FOR UPDATE`
- **Gap locks** to prevent phantoms
- **Next-key locks** (combination of row + gap)

**Why row-level?**
- Better concurrency than table locks
- Only blocks specific inventory items
- Other workers can distribute different packages simultaneously

---

## Performance Optimization

### Query Optimization

**Slow query log** enabled:
```sql
SET GLOBAL slow_query_log = ON;
SET GLOBAL long_query_time = 1;  -- Log queries > 1 second
```

**Analyze queries**:
```sql
EXPLAIN ANALYZE
SELECT * FROM vw_current_inventory_status WHERE stock_status = 'LOW_STOCK';
```

### Connection Pooling

Backend uses SQLAlchemy connection pool:
- `pool_size=10`: 10 permanent connections
- `max_overflow=20`: Up to 30 total connections
- `pool_pre_ping=True`: Verify connection before use

### Query Caching

MySQL query cache (deprecated in MySQL 8.0+)

Alternative: Application-level caching with Redis (future enhancement)

---

## Data Integrity Mechanisms

### Referential Integrity

All foreign keys enforced with:
- `ON DELETE RESTRICT`: Prevent orphaned records
- `ON UPDATE CASCADE`: Maintain relationships
- `ON DELETE SET NULL`: For optional relationships

### Domain Integrity

- `CHECK` constraints: Value ranges
- `ENUM` types: Limited value sets
- `NOT NULL`: Required fields
- `UNIQUE`: Prevent duplicates

### Entity Integrity

- Primary keys: Auto-increment, never null
- Unique constraints: Natural keys (phone, email)

---

## Backup Strategy

### Full Backup

```bash
mysqldump -u root -p aidtracker_db > backup_full.sql
```

### Incremental Backup

Enable binary logging:
```sql
SET GLOBAL binlog_format = 'ROW';
```

### Point-in-Time Recovery

```bash
mysqlbinlog binlog.000001 | mysql -u root -p aidtracker_db
```

---

## Security Considerations

### User Privileges

```sql
-- Application user (limited privileges)
GRANT SELECT, INSERT, UPDATE ON aidtracker_db.* TO 'aidtracker_user';

-- Read-only reporting user
GRANT SELECT ON aidtracker_db.* TO 'report_user';

-- Admin user (all privileges)
GRANT ALL PRIVILEGES ON aidtracker_db.* TO 'admin_user';
```

### SQL Injection Prevention

Backend uses:
- **Parameterized queries** (SQLAlchemy ORM)
- **Input validation** (Pydantic schemas)
- **Prepared statements** (for raw SQL)

**NEVER** use string concatenation for SQL queries.

---

## Scaling Considerations

### Vertical Scaling

Current limits (single server):
- **Households**: Millions
- **Distributions**: Tens of millions
- **Concurrent users**: Hundreds

### Horizontal Scaling (Future)

- **Read replicas**: For reporting queries
- **Sharding**: By geography (center_id)
- **Partitioning**: Distribution_Log by date

---

## Monitoring

### Key Metrics

```sql
-- Active transactions
SHOW PROCESSLIST;

-- Lock waits
SELECT * FROM information_schema.innodb_locks;

-- Table sizes
SELECT
    table_name,
    ROUND(data_length / 1024 / 1024, 2) AS data_mb
FROM information_schema.tables
WHERE table_schema = 'aidtracker_db';
```

---

## Design Decisions Summary

| Decision | Rationale |
|----------|-----------|
| **InnoDB Engine** | ACID transactions, row-level locking |
| **3NF Normalization** | Eliminate redundancy, prevent anomalies |
| **Pessimistic Locking** | Data integrity > performance |
| **Immutable Audit Log** | Compliance, debugging, trust |
| **ENUM Types** | Type safety, small storage |
| **Composite Unique Index** | Ensure one inventory per package per center |
| **ON DELETE RESTRICT** | Preserve historical data |
| **Auto-increment PKs** | Simple, efficient, no collisions |

---

**Last Updated**: November 29, 2024
