# AidTracker - Detailed Setup Guide

Complete step-by-step instructions for setting up and running the AidTracker application.

---

## Prerequisites

### Required Software

1. **Docker Desktop** (Latest version)
   - **Windows**: [Download Docker Desktop for Windows](https://docs.docker.com/desktop/install/windows-install/)
   - **Mac**: [Download Docker Desktop for Mac](https://docs.docker.com/desktop/install/mac-install/)
   - **Linux**: [Install Docker Engine](https://docs.docker.com/engine/install/)

2. **Docker Compose** (Included with Docker Desktop)
   - Verify: `docker-compose --version`

3. **Git** (Optional, for cloning)
   - [Download Git](https://git-scm.com/downloads)

### System Requirements

- **RAM**: 8GB minimum (4GB for Docker)
- **Storage**: 5GB free disk space
- **Ports**: 3000, 8000, 3306 must be available
- **OS**: Windows 10/11, macOS 10.15+, or Linux

---

## Installation Steps

### Step 1: Get the Code

If you have the project folder already:
```bash
cd /path/to/AidTracker
```

Or clone from repository:
```bash
git clone <repository-url>
cd AidTracker
```

### Step 2: Verify File Structure

Ensure you have these directories:
```
AidTracker/
├── backend/
├── frontend/
├── database/
├── docker-compose.yml
└── .env.example
```

### Step 3: Configure Environment Variables

1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

2. (Optional) Edit `.env` if you want to change defaults:
   ```bash
   nano .env  # or use any text editor
   ```

   Default values are fine for development:
   ```env
   MYSQL_ROOT_PASSWORD=rootpassword123
   MYSQL_DATABASE=aidtracker_db
   MYSQL_USER=aidtracker_user
   MYSQL_PASSWORD=aidtracker_pass
   ```

### Step 4: Build and Start Services

This single command will:
- Build Docker images for backend and frontend
- Pull MySQL 8.0 image
- Create network and volumes
- Start all containers
- Initialize database with schema and seed data

```bash
docker-compose up --build
```

**Expected output**:
```
Creating network "aidtracker_aidtracker_network" ... done
Creating volume "aidtracker_mysql_data" ... done
Building backend...
Building frontend...
Pulling mysql...
Creating aidtracker_mysql ... done
Creating aidtracker_backend ... done
Creating aidtracker_frontend ... done
```

### Step 5: Wait for Initialization

The first startup takes 2-3 minutes. Watch for these messages:

**MySQL Ready**:
```
aidtracker_mysql | [Server] /usr/sbin/mysqld: ready for connections.
```

**Backend Ready**:
```
aidtracker_backend | INFO:     Application startup complete.
aidtracker_backend | INFO:     Uvicorn running on http://0.0.0.0:8000
```

**Frontend Ready**:
```
aidtracker_frontend |   VITE v5.0.8  ready in 1234 ms
aidtracker_frontend |   ➜  Local:   http://localhost:3000/
```

---

## Verification

### Check Container Status

```bash
docker-compose ps
```

Expected output:
```
Name                      Command               State           Ports
-------------------------------------------------------------------------------------
aidtracker_mysql      docker-entrypoint.sh mysqld   Up      0.0.0.0:3306->3306/tcp
aidtracker_backend    uvicorn app.main:app --ho...  Up      0.0.0.0:8000->8000/tcp
aidtracker_frontend   docker-entrypoint.sh npm ...  Up      0.0.0.0:3000->3000/tcp
```

All containers should show `State: Up`.

### Test Backend API

```bash
curl http://localhost:8000/health
```

Expected response:
```json
{
  "status": "healthy",
  "database": "connected",
  "environment": "development"
}
```

### Test Frontend

Open browser: http://localhost:3000

You should see the AidTracker dashboard.

### Test Database

Connect to MySQL:
```bash
docker exec -it aidtracker_mysql mysql -u aidtracker_user -paidtracker_pass aidtracker_db
```

Run a test query:
```sql
SELECT COUNT(*) FROM Households;
```

Should return around 30 households.

---

## First-Time Usage

### 1. Explore the Dashboard

Navigate to http://localhost:3000

The dashboard shows:
- Total households: 30
- Total distributions: ~40
- Active centers: 7
- Low stock items: Several

### 2. Try a Distribution

1. Click **Distribution** in the sidebar
2. Select:
   - **Center**: Downtown Relief Center
   - **Package**: Basic Food Kit
   - **Household**: Any active household
3. Click **Check Eligibility** (optional)
4. Click **Distribute**
5. See success message and updated inventory

### 3. Test the Concurrency Demo

1. Click **Concurrency Demo** in the sidebar
2. Read the explanation
3. Click **Test Race Condition**
4. Observe: Only 1 of 2 simultaneous requests succeeds

---

## Common Issues and Solutions

### Issue 1: Port Already in Use

**Error**: `Bind for 0.0.0.0:3000 failed: port is already allocated`

**Solution**: Change port in `docker-compose.yml`:

```yaml
frontend:
  ports:
    - "3001:3000"  # Use 3001 instead
```

Then access at http://localhost:3001

### Issue 2: MySQL Connection Refused

**Error**: `Can't connect to MySQL server on 'mysql'`

**Cause**: MySQL not fully started yet

**Solution**: Wait 30 more seconds, then restart backend:
```bash
docker-compose restart backend
```

### Issue 3: Database Not Initialized

**Symptoms**: Tables don't exist, seed data missing

**Solution**: Completely reset database:
```bash
docker-compose down -v  # Delete volumes
docker-compose up --build  # Rebuild everything
```

### Issue 4: Frontend Shows CORS Error

**Error**: `Access to XMLHttpRequest has been blocked by CORS policy`

**Solution**: Check backend CORS settings in `backend/app/core/config.py`:
```python
BACKEND_CORS_ORIGINS: list = [
    "http://localhost:3000",
    "http://localhost:5173",  # Add if using different port
]
```

### Issue 5: Docker Build Fails

**Error**: `Failed to solve: failed to compute cache key`

**Solution**: Clear Docker cache:
```bash
docker system prune -a
docker-compose build --no-cache
docker-compose up
```

### Issue 6: Backend Crashes on Startup

**Check logs**:
```bash
docker-compose logs backend
```

**Common causes**:
- Database not ready: Wait longer or restart backend
- Python dependency issue: Rebuild with `--no-cache`
- Config error: Check `.env` file

---

## Stopping and Restarting

### Stop Services (Keep Data)

```bash
docker-compose down
```

This stops containers but preserves:
- Database data in volume `mysql_data`
- Application state

### Start Again

```bash
docker-compose up
```

Data will still be there.

### Complete Reset (Delete Everything)

```bash
docker-compose down -v  # -v deletes volumes too
```

This removes:
- All containers
- All data
- All volumes

Next `docker-compose up` will be like first time.

---

## Advanced Configuration

### Change Database Credentials

1. Edit `.env`:
   ```env
   MYSQL_PASSWORD=new_secure_password
   ```

2. Rebuild:
   ```bash
   docker-compose down -v
   docker-compose up --build
   ```

### Enable Production Mode

1. Edit `.env`:
   ```env
   ENVIRONMENT=production
   DEBUG=False
   ```

2. Restart:
   ```bash
   docker-compose restart backend
   ```

### View Logs

**All services**:
```bash
docker-compose logs -f
```

**Specific service**:
```bash
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f mysql
```

**Last 100 lines**:
```bash
docker-compose logs --tail=100 backend
```

### Access Container Shell

**Backend**:
```bash
docker exec -it aidtracker_backend bash
```

**Frontend**:
```bash
docker exec -it aidtracker_frontend sh
```

**MySQL**:
```bash
docker exec -it aidtracker_mysql bash
```

---

## Database Management

### Backup Database

```bash
docker exec aidtracker_mysql mysqldump -u root -prootpassword123 aidtracker_db > backup.sql
```

### Restore Database

```bash
docker exec -i aidtracker_mysql mysql -u root -prootpassword123 aidtracker_db < backup.sql
```

### Run SQL Scripts

```bash
docker exec -i aidtracker_mysql mysql -u root -prootpassword123 aidtracker_db < myscript.sql
```

### Connect with MySQL Client

**From host**:
```bash
mysql -h 127.0.0.1 -P 3306 -u aidtracker_user -paidtracker_pass aidtracker_db
```

**From container**:
```bash
docker exec -it aidtracker_mysql mysql -u aidtracker_user -paidtracker_pass aidtracker_db
```

---

## Development Workflow

### Making Code Changes

**Backend changes**:
- FastAPI has auto-reload enabled
- Save Python file → Backend restarts automatically

**Frontend changes**:
- Vite has hot module replacement (HMR)
- Save JSX file → Browser updates instantly

**Database changes**:
- Edit SQL files in `database/schemas/` or `database/seeds/`
- Reset database: `docker-compose down -v && docker-compose up`

### Installing New Dependencies

**Backend (Python)**:
1. Add to `backend/requirements.txt`
2. Rebuild:
   ```bash
   docker-compose build backend
   docker-compose up
   ```

**Frontend (Node)**:
1. Add to `frontend/package.json`
2. Rebuild:
   ```bash
   docker-compose build frontend
   docker-compose up
   ```

---

## Performance Tuning

### Increase MySQL Memory

Edit `docker-compose.yml`:
```yaml
mysql:
  command: --innodb-buffer-pool-size=1G --max-connections=200
```

### Adjust Connection Pool

Edit `backend/app/core/database.py`:
```python
engine = create_engine(
    settings.database_url,
    pool_size=20,  # Increase
    max_overflow=40,  # Increase
)
```

---

## Security Notes

### ⚠️ Development vs Production

Current configuration is for **DEVELOPMENT ONLY**.

For production:
1. Change all default passwords
2. Use environment-specific `.env` files
3. Enable HTTPS
4. Use secrets management (not plain text `.env`)
5. Set `DEBUG=False`
6. Use proper authentication
7. Restrict CORS origins

### Default Credentials (CHANGE THESE)

```env
MySQL Root: root / rootpassword123
MySQL User: aidtracker_user / aidtracker_pass
```

---

## Useful Commands Reference

| Task | Command |
|------|---------|
| Start all services | `docker-compose up` |
| Start in background | `docker-compose up -d` |
| Stop services | `docker-compose down` |
| View logs | `docker-compose logs -f` |
| Rebuild images | `docker-compose build` |
| Reset everything | `docker-compose down -v` |
| Check status | `docker-compose ps` |
| Restart service | `docker-compose restart backend` |
| Access shell | `docker exec -it <container> bash` |
| View resources | `docker stats` |

---

## Getting Help

### Check Logs First

```bash
docker-compose logs -f backend
```

Errors usually appear here.

### Verify Network

```bash
docker network inspect aidtracker_aidtracker_network
```

All containers should be connected.

### Test Connectivity

From backend to MySQL:
```bash
docker exec -it aidtracker_backend ping mysql
```

Should succeed.

---

## Next Steps

After successful setup:

1. ✅ Read [README.md](../README.md) for project overview
2. ✅ Explore [API_DOCUMENTATION.md](API_DOCUMENTATION.md) for API details
3. ✅ Study [CONCURRENCY_DEMO.md](CONCURRENCY_DEMO.md) to understand locking
4. ✅ Review [DATABASE_DESIGN.md](DATABASE_DESIGN.md) for schema details
5. ✅ Try the Concurrency Demo in the UI
6. ✅ Experiment with distributions and inventory

---

**Setup complete! You're ready to use AidTracker.**

For questions or issues, refer to the troubleshooting section or check the documentation files.

---

**Last Updated**: November 29, 2024
