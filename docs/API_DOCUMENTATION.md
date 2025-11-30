# AidTracker API Documentation

Complete reference for all backend API endpoints.

**Base URL**: `http://localhost:8000/api`

**Interactive Docs**: http://localhost:8000/docs (Swagger UI)

---

## Authentication

Current version: **No authentication required** (development only)

Production systems should implement:
- JWT tokens
- Role-based access control (RBAC)
- API key authentication

---

## Distribution Endpoints

### POST `/distribution/distribute`

Distribute an aid package to a household.

**⚠️ CRITICAL**: Uses `SELECT FOR UPDATE` for concurrency control.

**Request Body**:
```json
{
  "household_id": 1,
  "package_id": 1,
  "center_id": 1,
  "staff_id": 6,
  "quantity": 1
}
```

**Success Response (200)**:
```json
{
  "status": "success",
  "message": "Successfully distributed 1 package(s)",
  "log_id": 42,
  "distribution_date": "2024-11-29T10:30:00"
}
```

**Error Response (400)**:
```json
{
  "detail": "Insufficient inventory. Available: 0, Requested: 1"
}
```

**Possible Errors**:
- Household not found
- Household not active
- Package not found
- Package not active
- Center not found
- Center not active
- Household not eligible (validity period)
- Insufficient inventory

---

### POST `/distribution/check-eligibility`

Check if a household is eligible for a package.

**Request Body**:
```json
{
  "household_id": 1,
  "package_id": 2
}
```

**Response (200)**:
```json
{
  "eligible": true,
  "message": "Last received 35 days ago - ELIGIBLE",
  "household_id": 1,
  "package_id": 2
}
```

---

### GET `/distribution/logs`

Get distribution history (audit trail).

**Query Parameters**:
- `limit` (int, default: 100): Max records to return
- `offset` (int, default: 0): Skip this many records

**Response (200)**:
```json
{
  "logs": [
    {
      "log_id": 42,
      "household_id": 1,
      "package_id": 2,
      "center_id": 1,
      "staff_id": 6,
      "quantity_distributed": 1,
      "distribution_date": "2024-11-29T10:30:00",
      "transaction_status": "success",
      "failure_reason": null,
      "notes": "Successfully distributed via API"
    }
  ],
  "total": 150,
  "limit": 100,
  "offset": 0
}
```

---

### GET `/distribution/logs/household/{household_id}`

Get distribution history for a specific household.

**Path Parameters**:
- `household_id` (int): Household ID

**Response (200)**:
```json
{
  "household_id": 1,
  "distributions": [...],
  "total": 5
}
```

---

## Household Endpoints

### GET `/households`

Get all households.

**Query Parameters**:
- `skip` (int, default: 0)
- `limit` (int, default: 100)
- `status` (string): Filter by status (active, inactive, suspended)
- `priority` (string): Filter by priority (critical, high, medium, low)
- `city` (string): Filter by city

**Response (200)**:
```json
[
  {
    "household_id": 1,
    "family_name": "Ramirez Family",
    "primary_contact_name": "Carmen Ramirez",
    "phone_number": "408-555-2001",
    "email": "carmen.r@email.com",
    "address": "111 Oak Street",
    "city": "San Jose",
    "state": "California",
    "zip_code": "95110",
    "family_size": 5,
    "income_level": "no_income",
    "priority_level": "critical",
    "registration_date": "2024-01-10",
    "last_verified_date": "2024-11-01",
    "status": "active",
    "notes": "Single parent, 3 children under 10",
    "created_at": "2024-01-10T08:00:00",
    "updated_at": "2024-11-01T14:30:00"
  }
]
```

---

### POST `/households`

Register a new household.

**Request Body**:
```json
{
  "family_name": "Smith Family",
  "primary_contact_name": "John Smith",
  "phone_number": "408-555-9999",
  "email": "john.smith@email.com",
  "address": "123 Main Street",
  "city": "San Jose",
  "state": "California",
  "zip_code": "95110",
  "family_size": 4,
  "income_level": "low",
  "priority_level": "medium",
  "registration_date": "2024-11-29",
  "status": "active"
}
```

**Response (200)**: Same as GET response

---

## Inventory Endpoints

### GET `/inventory/status`

Get current inventory status from database view.

**Response (200)**:
```json
{
  "inventory": [
    {
      "inventory_id": 1,
      "center_id": 1,
      "center_name": "Downtown Relief Center",
      "city": "San Jose",
      "package_id": 1,
      "package_name": "Basic Food Kit",
      "category": "food",
      "quantity_on_hand": 150,
      "reorder_level": 50,
      "stock_status": "IN_STOCK",
      "last_restock_date": "2024-11-20",
      "updated_at": "2024-11-29T10:00:00"
    }
  ],
  "total": 84
}
```

**Stock Status Values**:
- `IN_STOCK`: quantity > reorder_level
- `LOW_STOCK`: quantity <= reorder_level but > 0
- `OUT_OF_STOCK`: quantity = 0

---

### GET `/inventory/low-stock`

Get items with low or no stock.

**Response (200)**:
```json
{
  "alerts": [
    {
      "center_name": "Milpitas Outreach Center",
      "package_name": "Basic Food Kit",
      "quantity_on_hand": 1,
      "reorder_level": 50,
      "stock_status": "LOW_STOCK"
    }
  ],
  "total": 12
}
```

---

### POST `/inventory/restock`

Add inventory to a center.

**Request Body**:
```json
{
  "center_id": 1,
  "package_id": 1,
  "quantity": 100
}
```

**Response (200)**:
```json
{
  "status": "success",
  "message": "Successfully restocked 100 units"
}
```

---

## Aid Package Endpoints

### GET `/packages`

Get all aid packages.

**Query Parameters**:
- `skip` (int)
- `limit` (int)
- `category` (string): food, medical, shelter, hygiene, education, emergency
- `is_active` (boolean)

**Response (200)**:
```json
[
  {
    "package_id": 1,
    "package_name": "Basic Food Kit",
    "description": "Rice, beans, pasta...",
    "category": "food",
    "unit_weight_kg": 15.50,
    "estimated_cost": 45.00,
    "validity_period_days": 7,
    "is_active": true,
    "created_at": "2024-01-01T00:00:00",
    "updated_at": "2024-01-01T00:00:00"
  }
]
```

---

## Distribution Center Endpoints

### GET `/centers`

Get all distribution centers.

**Query Parameters**:
- `skip` (int)
- `limit` (int)
- `status` (string): active, inactive, maintenance

**Response (200)**:
```json
[
  {
    "center_id": 1,
    "center_name": "Downtown Relief Center",
    "address": "123 Main Street",
    "city": "San Jose",
    "state": "California",
    "zip_code": "95110",
    "phone_number": "408-555-0101",
    "email": "downtown@aidtracker.org",
    "capacity": 1500,
    "status": "active",
    "created_at": "2024-01-01T00:00:00",
    "updated_at": "2024-01-01T00:00:00"
  }
]
```

---

## Reports Endpoints

### GET `/reports/dashboard`

Get overall dashboard statistics.

**Response (200)**:
```json
{
  "total_households": 30,
  "total_distributions": 150,
  "total_centers": 7,
  "low_stock_items": 12,
  "critical_households": 3,
  "recent_distributions": 25
}
```

---

### GET `/reports/monthly-summary`

Get monthly distribution summary.

**Response (200)**:
```json
{
  "summary": [
    {
      "month": "2024-11",
      "center_name": "Downtown Relief Center",
      "category": "food",
      "total_distributions": 45,
      "unique_households": 28,
      "total_packages": 45,
      "total_value": 2250.00
    }
  ]
}
```

---

### GET `/reports/pending-households`

Get households that haven't received aid recently.

**Response (200)**:
```json
{
  "households": [
    {
      "household_id": 25,
      "family_name": "Garcia Family",
      "priority_level": "high",
      "registration_date": "2024-08-01",
      "total_distributions_received": 2,
      "last_distribution_date": "2024-09-15",
      "distribution_status": "OVERDUE"
    }
  ],
  "total": 8
}
```

---

## Error Responses

All error responses follow this format:

**400 Bad Request**:
```json
{
  "detail": "Household with this phone number already exists"
}
```

**404 Not Found**:
```json
{
  "detail": "Household not found"
}
```

**422 Validation Error**:
```json
{
  "detail": [
    {
      "loc": ["body", "email"],
      "msg": "value is not a valid email address",
      "type": "value_error.email"
    }
  ]
}
```

**500 Internal Server Error**:
```json
{
  "detail": "Internal server error"
}
```

---

## Rate Limiting

Current version: **No rate limiting** (development only)

Production should implement:
- Per-IP rate limiting
- Per-user rate limiting
- Endpoint-specific limits

---

## CORS Configuration

Allowed origins (development):
- http://localhost:3000
- http://localhost:5173

Configure in `backend/app/core/config.py`

---

## WebSocket Support

Current version: **Not implemented**

Future enhancement for real-time updates.

---

## Pagination

List endpoints support pagination:

**Query Parameters**:
- `skip`: Number of records to skip (offset)
- `limit`: Max records to return

**Example**:
```
GET /api/households?skip=20&limit=10
```

Returns households 21-30.

---

## Filtering

Some endpoints support filtering:

**Examples**:
```
GET /api/households?status=active&priority=critical
GET /api/packages?category=food&is_active=true
GET /api/inventory?center_id=1
```

---

## Sorting

Current version: **Fixed sorting** (usually by ID or date)

Future enhancement: Custom sorting via query parameters.

---

## Testing with cURL

### Distribute Package
```bash
curl -X POST http://localhost:8000/api/distribution/distribute \
  -H "Content-Type: application/json" \
  -d '{
    "household_id": 1,
    "package_id": 1,
    "center_id": 1,
    "staff_id": 6,
    "quantity": 1
  }'
```

### Check Eligibility
```bash
curl -X POST http://localhost:8000/api/distribution/check-eligibility \
  -H "Content-Type: application/json" \
  -d '{
    "household_id": 1,
    "package_id": 1
  }'
```

### Get Dashboard Stats
```bash
curl http://localhost:8000/api/reports/dashboard
```

---

## Testing with Python

```python
import requests

BASE_URL = "http://localhost:8000/api"

# Distribute package
response = requests.post(
    f"{BASE_URL}/distribution/distribute",
    json={
        "household_id": 1,
        "package_id": 1,
        "center_id": 1,
        "staff_id": 6,
        "quantity": 1
    }
)
print(response.json())

# Get dashboard
response = requests.get(f"{BASE_URL}/reports/dashboard")
print(response.json())
```

---

## OpenAPI Specification

Full OpenAPI 3.0 specification available at:
- JSON: http://localhost:8000/openapi.json
- Interactive Docs: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

---

**Last Updated**: November 29, 2024
