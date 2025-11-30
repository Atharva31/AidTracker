# Concurrency Control Demonstration

## The Race Condition Problem

### Real-World Scenario

Imagine this situation at a distribution center:

**Time**: 9:00 AM
**Location**: Milpitas Distribution Center
**Inventory**: 1 Basic Food Kit remaining
**Workers**: Sarah (Laptop 1) and Michael (Laptop 2)
**Families**: The Ramirez family and The Singh family

Both workers, at exactly the same moment, attempt to distribute the last food kit to their respective families.

---

## Without Concurrency Control (BROKEN)

### Timeline

| Time | Worker 1 (Sarah) | Worker 2 (Michael) | Inventory DB |
|------|------------------|-------------------|--------------|
| 9:00:00.000 | Opens form | Opens form | quantity = 1 |
| 9:00:00.100 | Selects Ramirez family | Selects Singh family | quantity = 1 |
| 9:00:00.200 | Clicks "Distribute" | - | quantity = 1 |
| 9:00:00.201 | Reads: quantity = 1 ✅ | - | quantity = 1 |
| 9:00:00.202 | - | Clicks "Distribute" | quantity = 1 |
| 9:00:00.203 | - | Reads: quantity = 1 ✅ | quantity = 1 |
| 9:00:00.204 | Checks: 1 >= 1 (OK) | Checks: 1 >= 1 (OK) | quantity = 1 |
| 9:00:00.205 | Writes: quantity = 0 | Writes: quantity = 0 | quantity = 0 |
| 9:00:00.206 | COMMIT ✅ | COMMIT ✅ | quantity = 0 or -1 |

### SQL Execution (Broken Version)

**Worker 1:**
```sql
BEGIN TRANSACTION;

-- Read current quantity
SELECT quantity_on_hand
FROM Inventory
WHERE center_id = 7 AND package_id = 1;
-- Returns: 1

-- Check: 1 >= 1? YES, proceed
UPDATE Inventory
SET quantity_on_hand = quantity_on_hand - 1
WHERE center_id = 7 AND package_id = 1;

INSERT INTO Distribution_Log (...) VALUES (...);

COMMIT;
```

**Worker 2 (SIMULTANEOUSLY):**
```sql
BEGIN TRANSACTION;

-- Read current quantity (SAME TIME as Worker 1)
SELECT quantity_on_hand
FROM Inventory
WHERE center_id = 7 AND package_id = 1;
-- Returns: 1 (Worker 1 hasn't committed yet)

-- Check: 1 >= 1? YES, proceed (WRONG!)
UPDATE Inventory
SET quantity_on_hand = quantity_on_hand - 1
WHERE center_id = 7 AND package_id = 1;

INSERT INTO Distribution_Log (...) VALUES (...);

COMMIT;
```

### The Problem

Both transactions:
- Read `quantity = 1`
- Determined they could proceed
- Both succeeded
- Database now shows `quantity = 0` (or -1 depending on timing)
- **TWO families received aid, but only ONE package existed**

### Consequences

1. **Data Corruption**: Inventory is incorrect
2. **Audit Trail Broken**: Distribution log shows 2 distributions but only 1 package existed
3. **Lost Trust**: Families fight over who gets the package
4. **Compliance Issues**: Humanitarian organizations must maintain accurate records
5. **Budget Problems**: Reports show more distributions than actual inventory

---

## With Concurrency Control (CORRECT) ✅

### The Solution: SELECT ... FOR UPDATE

MySQL's InnoDB engine provides **row-level locking** through the `SELECT ... FOR UPDATE` statement.

### How It Works

When a transaction executes `SELECT ... FOR UPDATE`:
1. **Locks the row** - No other transaction can read or modify it
2. **Holds the lock** until COMMIT or ROLLBACK
3. **Other transactions wait** - They're queued until the lock is released

### Timeline with Locking

| Time | Worker 1 (Sarah) | Worker 2 (Michael) | Inventory DB |
|------|------------------|-------------------|--------------|
| 9:00:00.000 | Opens form | Opens form | quantity = 1 |
| 9:00:00.100 | Selects Ramirez family | Selects Singh family | quantity = 1 |
| 9:00:00.200 | Clicks "Distribute" | - | quantity = 1 |
| 9:00:00.201 | **LOCKS row** via FOR UPDATE 🔒 | - | quantity = 1 |
| 9:00:00.202 | Reads: quantity = 1 ✅ | Clicks "Distribute" | quantity = 1 |
| 9:00:00.203 | Checks: 1 >= 1 (OK) | **WAITS for lock** ⏳ | quantity = 1 |
| 9:00:00.204 | Writes: quantity = 0 | **STILL WAITING** ⏳ | quantity = 0 |
| 9:00:00.205 | COMMIT (releases lock 🔓) | - | quantity = 0 |
| 9:00:00.206 | - | **Lock acquired** 🔒 | quantity = 0 |
| 9:00:00.207 | - | Reads: quantity = 0 | quantity = 0 |
| 9:00:00.208 | - | Checks: 0 >= 1? NO! | quantity = 0 |
| 9:00:00.209 | - | ROLLBACK ❌ | quantity = 0 |
| 9:00:00.210 | - | Error: "Insufficient inventory" | quantity = 0 |

### SQL Execution (Correct Version)

**Worker 1:**
```sql
BEGIN TRANSACTION;

-- CRITICAL: Lock the row
SELECT quantity_on_hand
FROM Inventory
WHERE center_id = 7 AND package_id = 1
FOR UPDATE;  -- 🔒 ROW IS NOW LOCKED
-- Returns: 1

-- Check: 1 >= 1? YES, proceed
UPDATE Inventory
SET quantity_on_hand = quantity_on_hand - 1
WHERE center_id = 7 AND package_id = 1;

INSERT INTO Distribution_Log (...) VALUES (...);

COMMIT;  -- 🔓 LOCK RELEASED
```

**Worker 2 (SIMULTANEOUSLY):**
```sql
BEGIN TRANSACTION;

-- Tries to lock the row, but Worker 1 has it
SELECT quantity_on_hand
FROM Inventory
WHERE center_id = 7 AND package_id = 1
FOR UPDATE;  -- ⏳ WAITS HERE until Worker 1 commits

-- Worker 1 commits, lock is released, Worker 2 can now read
-- Returns: 0

-- Check: 0 >= 1? NO!
-- Transaction fails gracefully

ROLLBACK;  -- No changes made
```

### The Result

- **Worker 1**: Success ✅ - Ramirez family receives the food kit
- **Worker 2**: Fails gracefully ❌ - Singh family is placed on a waitlist
- **Database**: Accurate (quantity = 0)
- **Audit Trail**: Shows 1 successful distribution, 1 failed attempt
- **Data Integrity**: Preserved

---

## Implementation in AidTracker

### Python/SQLAlchemy Code

File: `backend/app/services/distribution_service.py`

```python
def distribute_package(db: Session, household_id, package_id, center_id, ...):
    try:
        # Start transaction
        # ... validation code ...

        # CRITICAL: Lock inventory row
        inventory = db.query(Inventory).filter(
            Inventory.center_id == center_id,
            Inventory.package_id == package_id
        ).with_for_update().first()  # 🔒 PESSIMISTIC LOCK

        # Now safely check quantity (row is locked, no one else can read/write)
        if inventory.quantity_on_hand < quantity:
            db.rollback()
            return ("error", "Insufficient inventory", None)

        # Safe to update (still locked)
        inventory.quantity_on_hand -= quantity

        # Log the distribution
        log = DistributionLog(...)
        db.add(log)

        # Commit releases the lock
        db.commit()  # 🔓 LOCK RELEASED

        return ("success", "Distributed successfully", log.log_id)

    except Exception as e:
        db.rollback()
        return ("error", str(e), None)
```

### Raw SQL Equivalent

```sql
DELIMITER $$

CREATE PROCEDURE sp_distribute_package(
    IN p_household_id INT,
    IN p_package_id INT,
    IN p_center_id INT,
    IN p_quantity INT
)
BEGIN
    DECLARE v_current_quantity INT;

    START TRANSACTION;

    -- CRITICAL: Lock the row
    SELECT quantity_on_hand INTO v_current_quantity
    FROM Inventory
    WHERE center_id = p_center_id AND package_id = p_package_id
    FOR UPDATE;  -- 🔒 LOCK

    -- Check quantity
    IF v_current_quantity < p_quantity THEN
        ROLLBACK;
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Insufficient inventory';
    END IF;

    -- Update inventory
    UPDATE Inventory
    SET quantity_on_hand = quantity_on_hand - p_quantity
    WHERE center_id = p_center_id AND package_id = p_package_id;

    -- Log distribution
    INSERT INTO Distribution_Log (...) VALUES (...);

    COMMIT;  -- 🔓 UNLOCK
END$$

DELIMITER ;
```

---

## Testing the Demo

### Step 1: Setup Test Data

Ensure Milpitas center (center_id = 7) has exactly 1 Basic Food Kit (package_id = 1):

```sql
UPDATE Inventory
SET quantity_on_hand = 1
WHERE center_id = 7 AND package_id = 1;
```

### Step 2: Run the Test

1. Navigate to http://localhost:3000/concurrency-demo
2. Click the "Test Race Condition" button
3. The frontend fires **2 simultaneous API requests**:
   - Both request to distribute package_id=1 from center_id=7
   - To different households

### Step 3: Observe Results

The results table will show:

| Request | Status | Message | Inventory After |
|---------|--------|---------|-----------------|
| Request 1 | ✅ Success | Successfully distributed 1 package(s) | 0 |
| Request 2 | ❌ Failed | Insufficient inventory. Available: 0, Requested: 1 | 0 |

**Proof**: Only ONE request succeeded, proving the lock worked!

### Step 4: Verify in Database

```sql
-- Check distribution log
SELECT * FROM Distribution_Log
WHERE center_id = 7 AND package_id = 1
ORDER BY distribution_date DESC
LIMIT 2;

-- Should show:
-- 1 row with transaction_status = 'success'
-- Possibly 1 row with transaction_status = 'failed' (if logged)

-- Check inventory
SELECT quantity_on_hand
FROM Inventory
WHERE center_id = 7 AND package_id = 1;

-- Should show: 0 (not -1!)
```

---

## Performance Considerations

### Lock Wait Timeout

MySQL has a default `innodb_lock_wait_timeout` of 50 seconds.

If Worker 2 waits more than 50 seconds for the lock:
```
ERROR 1205 (HY000): Lock wait timeout exceeded
```

**Solution**: Keep transactions short!

### Deadlocks

Two transactions waiting for each other's locks:

**Transaction 1**: Locks Row A, wants Row B
**Transaction 2**: Locks Row B, wants Row A

**MySQL's Solution**: Automatically detects and kills one transaction

```
ERROR 1213 (40001): Deadlock found when trying to get lock
```

**Our Prevention**:
- Always lock rows in the same order
- Keep transactions short
- Only lock what you need

### Optimistic vs Pessimistic Locking

| | Pessimistic (FOR UPDATE) | Optimistic (Version Numbers) |
|---|---|---|
| **When to use** | High contention | Low contention |
| **How it works** | Locks row immediately | Checks version before update |
| **Pros** | Guaranteed no conflicts | Better performance, no waits |
| **Cons** | Other transactions wait | Update might fail, need retry |
| **Our choice** | ✅ Pessimistic | - |

**Why Pessimistic?**
In aid distribution, **data integrity > performance**. We cannot afford inventory corruption.

---

## Key Takeaways

1. **Race conditions are real** - They occur in production systems
2. **Database provides tools** - SELECT FOR UPDATE is built into MySQL
3. **ACID guarantees matter** - Transactions ensure all-or-nothing
4. **Locking has costs** - But correctness is more important than speed
5. **Testing is crucial** - Concurrency bugs are hard to reproduce

---

## Further Reading

- [MySQL InnoDB Locking](https://dev.mysql.com/doc/refman/8.0/en/innodb-locking.html)
- [ACID Properties](https://en.wikipedia.org/wiki/ACID)
- [Database Transactions](https://www.postgresql.org/docs/current/tutorial-transactions.html)
- [Pessimistic vs Optimistic Locking](https://stackoverflow.com/questions/129329/optimistic-vs-pessimistic-locking)

---

**Last Updated**: November 29, 2024
