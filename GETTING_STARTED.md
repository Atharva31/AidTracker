# Getting Started with AidTracker

**5-Minute Quick Start Guide**

---

## Prerequisites

✅ Docker Desktop installed and running
✅ 8GB RAM available
✅ Ports 3000, 8000, 3306 free

---

## Start the Application

### Option 1: Using the startup script (Recommended)

```bash
./start.sh
```

### Option 2: Using Docker Compose directly

```bash
docker-compose up --build
```

---

## Access the Application

After 2-3 minutes, open your browser:

🌐 **Frontend**: http://localhost:3000
🔌 **API**: http://localhost:8000
📚 **API Docs**: http://localhost:8000/docs

---

## First Steps

### 1. Explore the Dashboard

Visit http://localhost:3000

You'll see:
- 30 Registered households
- 7 Active distribution centers
- Real-time statistics

### 2. Try a Distribution

1. Click **Distribution** in the sidebar
2. Fill in the form:
   - **Center**: Downtown Relief Center
   - **Package**: Basic Food Kit
   - **Household**: Ramirez Family
3. Click **Check Eligibility**
4. Click **Distribute**
5. See success message! ✅

### 3. Test Concurrency Control ⭐

1. Click **Concurrency Demo** in the sidebar
2. Read the problem explanation
3. Click **"Test Race Condition"** button
4. Watch: Only 1 of 2 simultaneous requests succeeds
5. **This proves the database prevents race conditions!**

---

## Project Features

### What You Can Do

✅ **Distribute Aid** - Give packages to families
✅ **Manage Households** - Register and track beneficiaries
✅ **Monitor Inventory** - Track stock levels
✅ **View Reports** - Analytics and statistics
✅ **Demo Concurrency** - See ACID transactions in action

### Database Features

✅ **ACID Transactions** - All-or-nothing operations
✅ **Pessimistic Locking** - SELECT FOR UPDATE prevents race conditions
✅ **Normalized Schema** - 3NF, no data redundancy
✅ **Audit Trail** - Complete, immutable distribution history
✅ **Performance Indexes** - Fast queries on large datasets

---

## Stopping the Application

```bash
# Stop (keeps data)
docker-compose down

# Stop and delete all data
docker-compose down -v
```

---

## Troubleshooting

### Containers won't start?
```bash
docker-compose down -v
docker-compose up --build
```

### Can't connect to database?
Wait 30 more seconds, then:
```bash
docker-compose restart backend
```

### Port already in use?
Edit `docker-compose.yml` and change the port mappings.

---

## Documentation

📖 **[README.md](README.md)** - Full project overview
📖 **[SETUP_GUIDE.md](docs/SETUP_GUIDE.md)** - Detailed setup instructions
📖 **[CONCURRENCY_DEMO.md](docs/CONCURRENCY_DEMO.md)** - Race condition explanation
📖 **[DATABASE_DESIGN.md](docs/DATABASE_DESIGN.md)** - Schema documentation
📖 **[API_DOCUMENTATION.md](docs/API_DOCUMENTATION.md)** - API reference

---

## Project Structure

```
AidTracker/
├── backend/          # FastAPI Python backend
├── frontend/         # React JavaScript frontend
├── database/         # MySQL schema and seed data
├── docs/            # Documentation
├── docker-compose.yml
└── start.sh         # Quick start script
```

---

## Test Data

The system comes pre-loaded with:

- **30 households** across San Jose area
- **7 distribution centers**
- **12 aid package types**
- **15 staff members**
- **~40 historical distributions**

**Special**: Milpitas center has only **1 food kit** for concurrency testing!

---

## What Makes This Special?

### The Race Condition Demo

This project's **key feature** is demonstrating how databases prevent data corruption when multiple users access the same resource simultaneously.

**The Problem**: Two workers try to distribute the last food kit at the exact same time.

**Without locking**: Both succeed, inventory goes negative ❌

**With SELECT FOR UPDATE**: Only one succeeds, data stays correct ✅

**Try it yourself** at http://localhost:3000/concurrency-demo

---

## Key Concepts Demonstrated

1. **ACID Properties**
   - Atomicity: All-or-nothing transactions
   - Consistency: Database constraints maintained
   - Isolation: Concurrent transactions don't interfere
   - Durability: Committed data persists

2. **Concurrency Control**
   - Pessimistic locking (SELECT FOR UPDATE)
   - Row-level locks
   - Transaction isolation

3. **Database Design**
   - Normalization (3NF)
   - Foreign key constraints
   - Indexes for performance
   - Views for simplified queries
   - Stored procedures for business logic

4. **Real-World Application**
   - Inventory management
   - Audit trails
   - Eligibility checks
   - Reporting and analytics

---

## Next Steps

After exploring the demo:

1. ✅ Try different distribution scenarios
2. ✅ Register a new household
3. ✅ Restock inventory
4. ✅ View reports and analytics
5. ✅ Study the source code
6. ✅ Read the documentation
7. ✅ Test the API directly at `/docs`

---

## For Developers

### Running Individual Services

**Backend only**:
```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload
```

**Frontend only**:
```bash
cd frontend
npm install
npm run dev
```

**Database only**:
```bash
docker-compose up mysql
```

### Making Changes

- **Backend**: Auto-reloads on file save
- **Frontend**: Hot module replacement (HMR)
- **Database**: Run `docker-compose down -v` to reset

---

## Common Commands

| Task | Command |
|------|---------|
| Start | `./start.sh` or `docker-compose up` |
| Stop | `docker-compose down` |
| View logs | `docker-compose logs -f` |
| Reset all | `docker-compose down -v` |
| Backend logs | `docker-compose logs -f backend` |
| MySQL shell | `docker exec -it aidtracker_mysql mysql -u root -p` |

---

## Support

### Check Logs First

```bash
docker-compose logs -f backend
```

Errors usually appear here.

### Verify Health

```bash
curl http://localhost:8000/health
```

Should return `{"status": "healthy", ...}`

---

## Team

- Vineet Malewar
- Atharva Prasanna Mokashi
- Maitreya Patankar
- Shefali Saini

**Course**: CMPE 180-B - Database Systems
**Institution**: San Jose State University

---

**🎉 You're all set! Start exploring AidTracker.**

Visit http://localhost:3000 to begin.

---

**Last Updated**: November 29, 2024
