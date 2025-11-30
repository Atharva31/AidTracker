# AidTracker - Humanitarian Aid Distribution Management System

A comprehensive database-driven application demonstrating **ACID transactions**, **concurrency control**, and **real-world database challenges** in humanitarian aid distribution.

## 🎯 Project Overview

AidTracker solves critical database challenges in humanitarian aid distribution by preventing data corruption from simultaneous operations using **pessimistic locking** (SELECT FOR UPDATE).

### The Problem We Solve

**Race Condition Example**: Two aid workers try to distribute the last food kit to two different families simultaneously. Without proper concurrency control, both transactions could succeed, corrupting inventory data.

**Our Solution**: ACID-compliant transactions with row-level locking ensure that "one item left" means exactly one person gets it.

---

## 🏗️ Architecture

### Tech Stack

| Component | Technology | Purpose |
|-----------|-----------|---------|
| **Database** | MySQL 8.0 (InnoDB) | ACID transactions, row-level locking |
| **Backend** | Python FastAPI | RESTful API, business logic |
| **ORM** | SQLAlchemy 2.0 | Database models, query building |
| **Frontend** | React 18 + Vite | Modern UI with Material-UI |
| **Containerization** | Docker + Docker Compose | Easy deployment |

### Database Features

✅ **Normalized Schema (3NF)** - Prevents data redundancy
✅ **Foreign Key Constraints** - Ensures referential integrity
✅ **B-Tree Indexes** - Optimized query performance
✅ **Stored Procedures** - Complex business logic in database
✅ **Database Views** - Simplified reporting queries
✅ **Pessimistic Locking** - Prevents race conditions

---

## 🚀 Quick Start

### Prerequisites

- Docker Desktop installed
- Docker Compose installed
- 8GB RAM available
- Ports 3000, 8000, 3306 available

### Installation

1. **Clone the repository**
   ```bash
   cd AidTracker
   ```

2. **Create environment file**
   ```bash
   cp .env.example .env
   ```

3. **Start all services**
   ```bash
   docker-compose up --build
   ```

4. **Wait for initialization** (2-3 minutes)
   - MySQL database will be created
   - Tables, views, and stored procedures will be initialized
   - Seed data will be loaded

5. **Access the application**
   - **Frontend**: http://localhost:3000
   - **Backend API**: http://localhost:8000
   - **API Docs**: http://localhost:8000/docs
   - **Health Check**: http://localhost:8000/health

### Quick Test

1. Navigate to http://localhost:3000
2. Go to **Distribution** page
3. Select a center, package, and household
4. Click "Distribute" to perform your first transaction

---

## 📊 Database Design

### Entity-Relationship Diagram

The database is centered around 6 core tables:

1. **Distribution_Centers** - Aid distribution locations
2. **Aid_Packages** - Types of aid available (food, medical, etc.)
3. **Households** - Beneficiary families
4. **Inventory** - Quantity of packages at each center (⚠️ LOCKED during distribution)
5. **Distribution_Log** - Immutable audit trail
6. **Staff_Members** - Aid workers

### Key Tables

#### Inventory (Critical for Concurrency Control)
```sql
CREATE TABLE Inventory (
    inventory_id INT AUTO_INCREMENT PRIMARY KEY,
    center_id INT NOT NULL,
    package_id INT NOT NULL,
    quantity_on_hand INT NOT NULL DEFAULT 0,  -- LOCKED during distribution
    reorder_level INT NOT NULL DEFAULT 50,
    last_restock_date DATE,
    UNIQUE KEY (center_id, package_id)
) ENGINE=InnoDB;
```

#### Distribution_Log (Immutable Audit Trail)
```sql
CREATE TABLE Distribution_Log (
    log_id INT AUTO_INCREMENT PRIMARY KEY,
    household_id INT NOT NULL,
    package_id INT NOT NULL,
    center_id INT NOT NULL,
    staff_id INT,
    quantity_distributed INT NOT NULL,
    distribution_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    transaction_status ENUM('success', 'failed', 'cancelled'),
    failure_reason VARCHAR(255)
) ENGINE=InnoDB;
```

---

## 🔒 Concurrency Control Implementation

### The Race Condition Problem

**Scenario**: Milpitas center has 1 food kit remaining. Two workers, at two different laptops, try to distribute it simultaneously to different families.

**Without Locking**:
```
Worker 1: SELECT quantity_on_hand FROM Inventory;  -- Returns 1
Worker 2: SELECT quantity_on_hand FROM Inventory;  -- Returns 1
Worker 1: UPDATE Inventory SET quantity_on_hand = 0;  -- Success
Worker 2: UPDATE Inventory SET quantity_on_hand = 0;  -- Success (WRONG!)
Result: Both families get aid, but inventory shows 0 (or -1)
```

**With SELECT FOR UPDATE**:
```
Worker 1: SELECT ... FOR UPDATE;  -- Locks the row
Worker 2: SELECT ... FOR UPDATE;  -- Waits for lock to be released
Worker 1: UPDATE and COMMIT;      -- Releases lock, inventory = 0
Worker 2: Now can read;            -- Sees quantity = 0
Worker 2: Transaction fails with "Insufficient inventory"
Result: Only Worker 1 succeeds. Data integrity preserved!
```

### Implementation

**Backend Service** ([distribution_service.py:51-65](backend/app/services/distribution_service.py#L51-L65))
```python
# CRITICAL: Lock inventory row using FOR UPDATE
inventory = db.query(Inventory).filter(
    Inventory.center_id == center_id,
    Inventory.package_id == package_id
).with_for_update().first()  # <-- PESSIMISTIC LOCKING!

# Now safely check quantity (row is locked)
if inventory.quantity_on_hand < quantity:
    return ("error", f"Insufficient inventory", None)

# Update inventory (still locked)
inventory.quantity_on_hand -= quantity

# Commit releases the lock
db.commit()
```

### Testing Concurrency

Visit the **Concurrency Demo** page in the application:
1. Navigate to http://localhost:3000/concurrency-demo
2. Click "Test Race Condition" button
3. Observe: 2 simultaneous requests are fired
4. Result: Only 1 succeeds, the other fails gracefully
5. Inventory remains consistent

---

## 🎨 Frontend Features

### Pages

1. **Dashboard** - Overview statistics and quick actions
2. **Distribution** - Main page to distribute aid packages
3. **Households** - Manage beneficiary families
4. **Inventory** - Monitor stock levels, restock items
5. **Aid Packages** - Manage package types
6. **Centers** - Manage distribution locations
7. **Reports** - Analytics and summaries
8. **Concurrency Demo** - Interactive demonstration of race condition prevention

### Key Features

- 📱 **Responsive Design** - Works on desktop, tablet, and mobile
- 🎯 **Real-time Updates** - Inventory and distribution data
- 🚨 **Low Stock Alerts** - Automatic notifications
- 📊 **Data Visualization** - Charts and statistics
- ✅ **Form Validation** - Client and server-side validation
- 🔍 **Search & Filter** - Find households, packages quickly
- 📋 **Audit Trail** - Complete distribution history

---

## 🔌 API Endpoints

### Distribution (Core Functionality)

```
POST   /api/distribution/distribute       - Distribute package (ACID transaction)
POST   /api/distribution/check-eligibility - Check if household eligible
GET    /api/distribution/logs             - Get distribution history
GET    /api/distribution/logs/household/:id - Get household history
```

### Inventory

```
GET    /api/inventory                     - Get all inventory
GET    /api/inventory/status              - Current inventory status (view)
GET    /api/inventory/low-stock           - Low stock alerts
POST   /api/inventory/restock             - Add inventory
```

### Households

```
GET    /api/households                    - Get all households
GET    /api/households/:id                - Get specific household
POST   /api/households                    - Register new household
PUT    /api/households/:id                - Update household
DELETE /api/households/:id                - Delete household
```

### Reports

```
GET    /api/reports/dashboard             - Dashboard statistics
GET    /api/reports/monthly-summary       - Monthly distribution summary
GET    /api/reports/pending-households    - Households needing aid
GET    /api/reports/distribution-statistics - Statistics by center/package
```

Full API documentation available at: http://localhost:8000/docs

---

## 🧪 Testing

### Manual Testing

1. **Test Normal Distribution**
   - Go to Distribution page
   - Select center, package, household
   - Click "Distribute"
   - Verify success message and inventory decrement

2. **Test Eligibility Check**
   - Try to distribute same package to same household twice
   - Should fail with "Must wait X more days" message

3. **Test Insufficient Inventory**
   - Find an out-of-stock item
   - Try to distribute it
   - Should fail with "Insufficient inventory" message

4. **Test Concurrency Control** ⭐
   - Go to Concurrency Demo page
   - Click "Test Race Condition"
   - Observe that only 1 of 2 simultaneous requests succeeds

### Database Verification

Connect to MySQL and verify:

```bash
docker exec -it aidtracker_mysql mysql -u root -prootpassword123

USE aidtracker_db;

-- Check distribution logs
SELECT * FROM Distribution_Log ORDER BY distribution_date DESC LIMIT 10;

-- Check inventory
SELECT * FROM vw_current_inventory_status WHERE stock_status = 'LOW_STOCK';

-- Verify locking (during active distribution)
SHOW ENGINE INNODB STATUS;
```

---

## 📝 Sample Data

The system comes pre-loaded with:

- **7 Distribution Centers** across San Jose area
- **12 Aid Package Types** (food, medical, hygiene, etc.)
- **30 Households** with various priority levels
- **15 Staff Members** (admins, managers, workers)
- **84 Inventory Records** with realistic stock levels
- **40+ Historical Distributions** for testing

**Special Test Case**: Milpitas center has package_id=1 with only **1 item** in stock for concurrency testing.

---

## 🛠️ Development

### Project Structure

```
AidTracker/
├── backend/                 # FastAPI backend
│   ├── app/
│   │   ├── api/            # API routes
│   │   ├── core/           # Configuration, database
│   │   ├── models/         # SQLAlchemy models
│   │   ├── schemas/        # Pydantic schemas
│   │   ├── services/       # Business logic (ACID transactions)
│   │   └── main.py         # FastAPI app
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/               # React frontend
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   ├── pages/          # Page components
│   │   ├── services/       # API client
│   │   └── App.jsx         # Main app
│   ├── Dockerfile
│   └── package.json
├── database/               # SQL scripts
│   ├── schemas/            # Table definitions
│   └── seeds/              # Sample data
├── docker-compose.yml      # Orchestration
└── README.md              # This file
```

### Running Individual Services

**Backend Only**:
```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload
```

**Frontend Only**:
```bash
cd frontend
npm install
npm run dev
```

**Database Only**:
```bash
docker-compose up mysql
```

---

## 🎓 Educational Value

This project demonstrates key database concepts:

### ACID Properties

- **Atomicity**: Distribution is all-or-nothing (commit or rollback)
- **Consistency**: Database constraints prevent invalid states
- **Isolation**: SELECT FOR UPDATE prevents concurrent conflicts
- **Durability**: Committed transactions persist permanently

### Database Features

- **Normalization (3NF)**: Eliminates redundancy
- **Referential Integrity**: Foreign keys maintain relationships
- **Indexing**: B-tree indexes optimize queries
- **Stored Procedures**: Encapsulate complex logic
- **Views**: Simplify complex queries
- **Transaction Management**: Explicit commit/rollback

### Real-World Scenarios

- **Race Conditions**: Multiple users, same resource
- **Inventory Management**: Stock tracking
- **Audit Trails**: Immutable logging
- **Business Rules**: Eligibility checks, validity periods
- **Reporting**: Aggregation queries, analytics

---

## 🐛 Troubleshooting

### Issue: Containers won't start

```bash
docker-compose down -v
docker-compose up --build
```

### Issue: Database connection failed

Check if MySQL is ready:
```bash
docker-compose logs mysql
```

Wait for: `ready for connections. Version: '8.0'`

### Issue: Frontend can't connect to backend

Verify backend is running:
```bash
curl http://localhost:8000/health
```

Check CORS settings in [backend/app/core/config.py](backend/app/core/config.py#L23)

### Issue: Port already in use

Change ports in `docker-compose.yml`:
```yaml
ports:
  - "3001:3000"  # Frontend
  - "8001:8000"  # Backend
  - "3307:3306"  # MySQL
```

---

## 📚 Additional Documentation

- **[DATABASE_DESIGN.md](docs/DATABASE_DESIGN.md)** - Detailed schema documentation
- **[API_DOCUMENTATION.md](docs/API_DOCUMENTATION.md)** - Complete API reference
- **[CONCURRENCY_DEMO.md](docs/CONCURRENCY_DEMO.md)** - Race condition explanation
- **[SETUP_GUIDE.md](docs/SETUP_GUIDE.md)** - Detailed setup instructions

---

## 👥 Team

- **Vineet Malewar**
- **Atharva Prasanna Mokashi**
- **Maitreya Patankar**
- **Shefali Saini**

**Course**: CMPE 180-B - Database Systems
**Institution**: San Jose State University

---

## 📄 License

This project is created for educational purposes as part of a database systems course.

---

## 🙏 Acknowledgments

- FastAPI for the excellent Python web framework
- Material-UI for beautiful React components
- MySQL for robust ACID transaction support
- Docker for simplified deployment

---

**Built with ❤️ for humanitarian aid distribution**

Last Updated: November 29, 2024
