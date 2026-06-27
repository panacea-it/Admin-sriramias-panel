# Academics → Categories → Classroom — Frontend Integration README

> **Official integration source of truth for Classroom module frontend development**  
> Backend resource: `Classroom` · API base: `/api/classrooms` · MongoDB collection: `classrooms`  
> Admin route (UI): `/academics/categories/class-rooms`

---

## SECTION 1 — MODULE OVERVIEW

### What Classroom Represents

A **Classroom** is a **physical teaching room** at a specific **City** (branch/place) within an operational **Center**. It is infrastructure metadata — room name, code, and seating capacity — used to schedule in-person or hybrid sessions.

Classrooms are **not** academic content entities. They do not store curriculum, faculty assignments, or batch enrollments directly.

### Admin Navigation Context

The admin sidebar groups **City** and **Class Rooms** under **Academics → Categories** alongside Programs, Courses, Subjects, etc. That grouping is **organizational only**. Classroom APIs are scoped to the **infrastructure hierarchy**, not the academic ERP hierarchy.

| UI Route | Module |
|----------|--------|
| `/academics/categories/city` | City (prerequisite parent) |
| `/academics/categories/class-rooms` | Classroom (this document) |

### Two Hierarchies (Critical)

```text
INFRASTRUCTURE (Classroom lives here)
Center → City (branch / cityAddress) → Classroom

ACADEMIC ERP (separate — NOT linked to Classroom CRUD)
Center → Program → Exam Category → Exam Sub Category → Course → Batch
```

There is **no database foreign key** between `Classroom` and `Course`, `Subject`, `Faculty`, or `Batch`.

### Actual Backend Relationships

| Entity | Relationship to Classroom | Detail |
|--------|---------------------------|--------|
| **Center** | **Direct parent (required)** | `Classroom.center` → `Center._id`. Center must be `status: ACTIVE`. |
| **City** | **Direct parent (required)** | `Classroom.city` → `City._id`. City must belong to selected center, be `ACTIVE`, and not soft-deleted. |
| **Course** | **None** | No `classroom` field on `Course`. |
| **Subject** | **None** | No link at schema or API level. |
| **Faculty / Teacher** | **None** | No link at schema or API level. |
| **Batch** | **None** | No link at schema or API level. |

### Downstream Consumer (Read-Only Context)

`SubjectLiveClass` (Academic CMS live classes) references classrooms:

```text
SubjectLiveClass.classroomId → Classroom._id (required on live class create)
```

Live class scheduling validates that the classroom is active, not deleted, and belongs to the batch's center. Classroom CRUD does **not** check for existing live class bookings on delete.

### Design Rules

| Rule | Detail |
|------|--------|
| Auto ID | `classroomId` is server-generated (`CLS001`, `CLS002`, …) — never send on create |
| Code uniqueness | `classroomCode` is globally unique; stored uppercase |
| Soft delete | `DELETE` sets `isDeleted: true`, `deletedAt`, `status: INACTIVE` |
| Capacity | Integer ≥ 0; omitted on create defaults to `0` |
| Center–City chain | City must belong to center and be active |
| Usage field | `usage.upcoming` and `usage.totalBookings` are **placeholders** (always `0`) — reserved for future scheduling |
| No uploads | All Classroom endpoints use JSON — no file fields |
| No bulk APIs | No bulk status, bulk delete, or export endpoints exist |

### Dependent Dropdown Flow (Create / Edit Form)

```text
1. GET /api/admin/centers/dropdown   (or GET /api/centers/dropdown)
2. User selects center → GET /api/cities/by-center/:centerId
3. User selects city → POST /api/classrooms with center + city + room fields
```

### User Flow

1. Super Admin logs in (`POST /api/auth/login-super-admin` or equivalent admin JWT).
2. Opens **Academics → Categories → Class Rooms**.
3. Lists classrooms with search, center/city/status filters, pagination, sorting.
4. **Create**: selects Center → loads Cities for center → enters name, code, capacity → saves.
5. **Edit**: updates center/city (re-validated), name, code, capacity, or status.
6. **Toggle status**: `ACTIVE` ↔ `INACTIVE` via `PATCH /api/classrooms/status/:id`.
7. **Delete**: soft delete — classroom becomes `INACTIVE`, hidden from non-deleted queries.

### Backend Layer Stack

```text
app.js → app.use('/api/classrooms', classroomRoutes)
routes/classroomRoutes.js
  └── middleware: protect → requireSuperAdmin (all routes)
  └── controllers/classroomController.js
        └── models/Classroom.js
        └── models/City.js (parent validation)
        └── models/Center.js (via findActiveCenter)
        └── utils/classroomHelpers.js (center/city resolution, capacity, chain validation)
        └── utils/contentIdGenerator.js (generateClassroomId)
        └── utils/contentMastersHelpers.js (pagination, sort, search, NOT_DELETED)
```

There is **no** dedicated `classroomService.js` in the backend. All business logic lives in `classroomController.js`. There is **no** Joi/Zod/express-validator middleware — validation is inline in the controller + Mongoose schema.

**Source files:**

| Layer | Path |
|-------|------|
| Routes | `routes/classroomRoutes.js` |
| Controller | `controllers/classroomController.js` |
| Model | `models/Classroom.js` |
| Helpers | `utils/classroomHelpers.js` |
| Shared list helpers | `utils/contentMastersHelpers.js` |
| ID generator | `utils/contentIdGenerator.js` |
| Auth | `middleware/authMiddleware.js` |
| Authorization | `middleware/requireSuperAdmin.js` |

---

## SECTION 2 — DATABASE MODEL

MongoDB collection: **`classrooms`**  
Schema: `models/Classroom.js`

| Field Name | Type | Required | Default Value | Validation | Description |
|------------|------|----------|---------------|------------|-------------|
| `classroomId` | String | No (auto-generated) | — | Unique, trimmed; format `CLS001`, `CLS002`, … | Human-readable sequential ID |
| `center` | ObjectId → `Center` | **Yes** | — | Indexed; must reference active center | Operational center |
| `city` | ObjectId → `City` | **Yes** | — | Indexed; must belong to `center` | Branch/place (`City.cityAddress`) |
| `classroomName` | String | **Yes** | — | Trimmed | Display name (e.g. "Class Room 1") |
| `classroomCode` | String | **Yes** | — | Unique, trimmed, uppercase | Short code (e.g. `CR-01`) |
| `capacity` | Number | No | `0` | `min: 0`; floored to integer server-side | Seating capacity |
| `status` | String | No | `'ACTIVE'` | Enum: `ACTIVE`, `INACTIVE` | Operational status |
| `isDeleted` | Boolean | No | `false` | Indexed | Soft-delete flag |
| `deletedAt` | Date | No | `null` | Set on delete | Soft-delete timestamp |
| `createdAt` | Date | Auto | — | Mongoose timestamps | Created timestamp |
| `updatedAt` | Date | Auto | — | Mongoose timestamps | Last updated timestamp |

### Compound Indexes

| Index | Fields |
|-------|--------|
| Compound | `{ center: 1, city: 1, status: 1, isDeleted: 1 }` |
| Single | `{ classroomName: 1 }` |

### Fields NOT in Schema (Response-Only)

| Field | Source | Notes |
|-------|--------|-------|
| `centerName` | Populated from `Center.centerName` or `Center.name` | List/detail response only |
| `cityAddress` | Populated from `City.cityAddress` | List/detail response only |
| `usage.upcoming` | Hardcoded `0` in controller | Placeholder for future scheduling |
| `usage.totalBookings` | Hardcoded `0` in controller | Placeholder for future scheduling |

### Related Entity Schemas (Dropdown Parents)

**City** (`models/City.js`):

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `centerId` | ObjectId → Center | Yes | Parent center |
| `cityAddress` | String | Yes | Branch address / place label |
| `status` | String | Default `ACTIVE` | `ACTIVE` \| `INACTIVE` |
| `isDeleted` / `deletedAt` | Boolean / Date | Soft delete | |

**Center** (`models/Center.js`):

| Field | Notes |
|-------|-------|
| `centerName`, `centerCode` | Used in dropdowns and list search |
| `city`, `state` | Geographic metadata (string) — **not** the `City` collection |
| `status` | Must be `ACTIVE` for classroom create validation |

> **Important:** `Center.city` (string) is geographic metadata. `City` (collection) is a separate branch entity linked via `City.centerId`.

---

## SECTION 3 — COMPLETE API INVENTORY

### Classroom APIs (This Module)

| Feature | Method | Endpoint | Auth Required |
|---------|--------|----------|---------------|
| Create classroom | POST | `/api/classrooms` | Yes — Super Admin |
| List classrooms (paginated) | GET | `/api/classrooms` | Yes — Super Admin |
| Classroom dropdown | GET | `/api/classrooms/dropdown` | Yes — Super Admin |
| Get classroom by ID | GET | `/api/classrooms/:id` | Yes — Super Admin |
| Update classroom | PUT | `/api/classrooms/:id` | Yes — Super Admin |
| Toggle classroom status | PATCH | `/api/classrooms/status/:id` | Yes — Super Admin |
| Delete classroom (soft) | DELETE | `/api/classrooms/:id` | Yes — Super Admin |

**Route order note:** `/dropdown` and `/status/:id` are registered **before** `/:id` to avoid param conflicts.

**`:id` param:** MongoDB `_id` (ObjectId string), **not** `classroomId` (e.g. `CLS001`).

**Source:** `routes/classroomRoutes.js`, `app.js` line 260

### Dependency APIs (Required for Forms)

| Feature | Method | Endpoint | Auth Required | Used For |
|---------|--------|----------|---------------|----------|
| Centers dropdown | GET | `/api/admin/centers/dropdown` | Staff Admin+ | Create/edit — Center picker |
| Centers dropdown (alt) | GET | `/api/centers/dropdown` | Staff Admin+ | Same handler as above |
| Cities by center | GET | `/api/cities/by-center/:centerId` | Super Admin | Dependent City picker after center selection |

**Not used by Classroom CRUD forms:**

| Entity | Reason |
|--------|--------|
| Course dropdown | No `course` field on Classroom |
| Subject dropdown | No `subject` field on Classroom |
| Faculty dropdown | No `faculty` field on Classroom |
| Batch dropdown | No `batch` field on Classroom |

### UI Action → Service Mapping

| UI Action | Service Method | HTTP | Endpoint |
|-----------|----------------|------|----------|
| List | `getClassrooms()` | GET | `/api/classrooms` |
| Detail | `getClassroomById(id)` | GET | `/api/classrooms/:id` |
| Dropdown | `getClassroomDropdown()` | GET | `/api/classrooms/dropdown` |
| Create | `createClassroom(payload)` | POST | `/api/classrooms` |
| Update | `updateClassroom(id, payload)` | PUT | `/api/classrooms/:id` |
| Toggle status | `updateClassroomStatus(id, status)` | PATCH | `/api/classrooms/status/:id` |
| Delete | `deleteClassroom(id)` | DELETE | `/api/classrooms/:id` |
| Center dropdown | `centerService.getCentersDropdown()` | GET | `/api/admin/centers/dropdown` |
| Cities by center | `cityService.getCitiesByCenter(centerId)` | GET | `/api/cities/by-center/:centerId` |

---

## SECTION 4 — CREATE CLASSROOM API

| | |
|---|---|
| **Request URL** | `POST /api/classrooms` |
| **Method** | POST |
| **Authentication** | Bearer JWT — Super Admin only |

### Headers

| Header | Value | Required |
|--------|-------|----------|
| `Authorization` | `Bearer <JWT>` | Yes |
| `Content-Type` | `application/json` | Yes |
| `Accept` | `application/json` | Recommended |

### Request Payload

```json
{
  "center": "665a1b2c3d4e5f6789012345",
  "city": "665b1b2c3d4e5f6789012345",
  "classroomName": "Class Room 1",
  "classroomCode": "CR-01",
  "capacity": 40,
  "status": "ACTIVE"
}
```

### Field Descriptions

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `center` | ObjectId string | **Yes** | — | Center MongoDB `_id`. Alias: `centerId` |
| `city` | ObjectId string | **Yes** | — | City MongoDB `_id`. Alias: `cityId` |
| `classroomName` | string | **Yes** | — | Display name; trimmed server-side |
| `classroomCode` | string | **Yes** | — | Unique code; trimmed and uppercased server-side |
| `capacity` | number | No | `0` | Non-negative integer; floored server-side |
| `status` | `ACTIVE` \| `INACTIVE` | No | `ACTIVE` | Only `INACTIVE` explicitly sets inactive; any other value → `ACTIVE` |
| `classroomId` | — | **Do not send** | auto | Server generates `CLS001`, `CLS002`, … |

### Validation Rules

| Rule | HTTP | Error Message |
|------|------|---------------|
| Missing center or city | 400 | `center and city are required` |
| Empty `classroomName` | 400 | `classroomName is required` |
| Empty `classroomCode` | 400 | `classroomCode is required` |
| Invalid ObjectId for center/city | 400 | `Invalid center or city id` |
| Center inactive or not found | 400 | `Invalid or inactive center` |
| City not in center or inactive | 400 | `City does not belong to the selected center or is inactive` |
| Invalid capacity | 400 | `Invalid capacity. Must be zero or a positive number.` |
| Duplicate `classroomCode` | 400 | `classroomCode already exists` |

### Example Request

```http
POST /api/classrooms HTTP/1.1
Host: localhost:5000
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
Content-Type: application/json

{
  "center": "665a1b2c3d4e5f6789012345",
  "city": "665b1b2c3d4e5f6789012345",
  "classroomName": "Class Room 1",
  "classroomCode": "CR-01",
  "capacity": 40,
  "status": "ACTIVE"
}
```

```typescript
await api.post('/api/classrooms', {
  center: selectedCenterId,
  city: selectedCityId,
  classroomName: name.trim(),
  classroomCode: code.trim(),
  capacity: Number(capacity) || 0,
  status: 'ACTIVE',
});
```

### Example Success Response (201)

```json
{
  "success": true,
  "message": "Classroom created successfully",
  "data": {
    "_id": "665c1b2c3d4e5f6789012345",
    "classroomId": "CLS001",
    "center": "665a1b2c3d4e5f6789012345",
    "centerName": "Hyderabad Main Center",
    "city": "665b1b2c3d4e5f6789012345",
    "cityAddress": "Ameerpet, Hyderabad",
    "classroomName": "Class Room 1",
    "classroomCode": "CR-01",
    "capacity": 40,
    "status": "ACTIVE",
    "usage": {
      "upcoming": 0,
      "totalBookings": 0
    },
    "createdAt": "2025-06-01T10:00:00.000Z",
    "updatedAt": "2025-06-01T10:00:00.000Z"
  }
}
```

### Example Error Responses

**400 — Missing fields:**

```json
{
  "success": false,
  "message": "center and city are required"
}
```

**400 — City/center mismatch:**

```json
{
  "success": false,
  "message": "City does not belong to the selected center or is inactive"
}
```

**400 — Duplicate code:**

```json
{
  "success": false,
  "message": "classroomCode already exists"
}
```

---

## SECTION 5 — UPDATE CLASSROOM API

| | |
|---|---|
| **Request URL** | `PUT /api/classrooms/:id` |
| **Method** | PUT |
| **Authentication** | Bearer JWT — Super Admin only |

### Headers

Same as Create.

### Request Payload (Partial Update Supported)

All fields optional — only send fields being changed:

```json
{
  "center": "665a1b2c3d4e5f6789012345",
  "city": "665b1b2c3d4e5f6789012345",
  "classroomName": "Class Room 1 — Updated",
  "classroomCode": "CR-01A",
  "capacity": 50,
  "status": "INACTIVE"
}
```

### Update Behavior

| Field | Behavior |
|-------|----------|
| `center` / `centerId` | If sent (with or without city), re-validates center–city chain |
| `city` / `cityId` | If sent (with or without center), re-validates center–city chain |
| `classroomName` | Cannot be empty string |
| `classroomCode` | Cannot be empty string; uppercased |
| `capacity` | Validated via `validateCapacity` |
| `status` | Must be exactly `ACTIVE` or `INACTIVE` |

If center/city are **not** sent, existing values are retained.

### Validation Rules

| Rule | HTTP | Error Message |
|------|------|---------------|
| Classroom not found or soft-deleted | 404 | `Classroom not found` |
| Empty `classroomName` | 400 | `classroomName cannot be empty` |
| Empty `classroomCode` | 400 | `classroomCode cannot be empty` |
| Invalid center/city chain | 400 | See create validation messages |
| Invalid capacity | 400 | `Invalid capacity. Must be zero or a positive number.` |
| Invalid status | 400 | `Status must be ACTIVE or INACTIVE` |
| Duplicate `classroomCode` | 400 | `classroomCode already exists` |

### Example Success Response (200)

```json
{
  "success": true,
  "message": "Classroom updated successfully",
  "data": {
    "_id": "665c1b2c3d4e5f6789012345",
    "classroomId": "CLS001",
    "center": "665a1b2c3d4e5f6789012345",
    "centerName": "Hyderabad Main Center",
    "city": "665b1b2c3d4e5f6789012345",
    "cityAddress": "Ameerpet, Hyderabad",
    "classroomName": "Class Room 1 — Updated",
    "classroomCode": "CR-01A",
    "capacity": 50,
    "status": "INACTIVE",
    "usage": { "upcoming": 0, "totalBookings": 0 },
    "createdAt": "2025-06-01T10:00:00.000Z",
    "updatedAt": "2025-06-01T11:30:00.000Z"
  }
}
```

### Status-Only Update (Dedicated Endpoint)

Prefer `PATCH /api/classrooms/status/:id` for inline row toggles:

```json
{ "status": "INACTIVE" }
```

---

## SECTION 6 — DELETE CLASSROOM API

| | |
|---|---|
| **Request URL** | `DELETE /api/classrooms/:id` |
| **Method** | DELETE |
| **Authentication** | Bearer JWT — Super Admin only |

### Behavior

- **Soft delete** — record remains in MongoDB
- Sets `isDeleted: true`, `deletedAt: new Date()`, `status: 'INACTIVE'`
- Does **not** check for existing `SubjectLiveClass` references

### Example Success Response (200)

```json
{
  "success": true,
  "message": "Classroom deleted successfully",
  "data": {
    "_id": "665c1b2c3d4e5f6789012345"
  }
}
```

### Example Error Response (404)

```json
{
  "success": false,
  "message": "Classroom not found"
}
```

---

## SECTION 7 — GET CLASSROOM LIST API

| | |
|---|---|
| **Request URL** | `GET /api/classrooms` |
| **Method** | GET |
| **Authentication** | Bearer JWT — Super Admin only |

### Query Parameters

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `page` | number | `1` | Page number (min 1) |
| `limit` | number | `10` | Page size (min 1, max 100) |
| `search` | string | `''` | Case-insensitive regex on `classroomName`, `classroomCode`, center name, city address |
| `center` | ObjectId | — | Filter by center `_id` |
| `city` | ObjectId | — | Filter by city `_id` |
| `status` | string | — | `ACTIVE` or `INACTIVE` |
| `sortBy` | string | `createdAt` | See sort table below |
| `sortOrder` | string | `desc` | `asc` or `desc` |

### Sort Fields

| `sortBy` Value | Sort Target |
|----------------|-------------|
| `createdAt` | Document `createdAt` |
| `classroomName` | `classroomName` |
| `classroomCode` | `classroomCode` |
| `capacity` | `capacity` |
| `status` | `status` |
| `centerName` | Joined center name (aggregation) |
| `cityAddress` | Joined city address (aggregation) |

Invalid `sortBy` falls back to `createdAt`.

### Search Logic

Search term is escaped and matched (case-insensitive) against:

- `classroomName`
- `classroomCode`
- `centerDoc.centerName`
- `centerDoc.name`
- `cityDoc.cityAddress`

### Pagination Logic

```text
page  = max(1, parseInt(page) || 1)
limit = min(100, max(1, parseInt(limit) || 10))
skip  = (page - 1) * limit
totalPages = ceil(total / limit)
```

### Soft-Delete Filter

All list queries include `{ isDeleted: false }`.

### Example Request

```http
GET /api/classrooms?page=1&limit=10&search=room&center=665a1b2c3d4e5f6789012345&city=665b1b2c3d4e5f6789012345&status=ACTIVE&sortBy=classroomName&sortOrder=asc
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

### Example Success Response (200)

```json
{
  "success": true,
  "total": 25,
  "page": 1,
  "limit": 10,
  "totalPages": 3,
  "count": 10,
  "data": [
    {
      "_id": "665c1b2c3d4e5f6789012345",
      "classroomId": "CLS001",
      "center": "665a1b2c3d4e5f6789012345",
      "centerName": "Hyderabad Main Center",
      "city": "665b1b2c3d4e5f6789012345",
      "cityAddress": "Ameerpet, Hyderabad",
      "classroomName": "Class Room 1",
      "classroomCode": "CR-01",
      "capacity": 40,
      "status": "ACTIVE",
      "usage": { "upcoming": 0, "totalBookings": 0 },
      "createdAt": "2025-06-01T10:00:00.000Z",
      "updatedAt": "2025-06-01T10:00:00.000Z"
    }
  ]
}
```

### Relationships in List Response

| Response Field | Source |
|----------------|--------|
| `center` | Classroom `center` ObjectId |
| `centerName` | `$lookup` on `centers` collection |
| `city` | Classroom `city` ObjectId |
| `cityAddress` | `$lookup` on `cities` collection |

---

## SECTION 8 — GET CLASSROOM DETAILS API

| | |
|---|---|
| **Request URL** | `GET /api/classrooms/:id` |
| **Method** | GET |
| **Authentication** | Bearer JWT — Super Admin only |

### Behavior

- Loads single classroom where `_id = :id` and `isDeleted: false`
- Populates `center` (fields: `centerName`, `name`, `centerCode`, `city`, `state`)
- Populates `city` (fields: `cityAddress`, `status`)

### Example Success Response (200)

```json
{
  "success": true,
  "data": {
    "_id": "665c1b2c3d4e5f6789012345",
    "classroomId": "CLS001",
    "center": "665a1b2c3d4e5f6789012345",
    "centerName": "Hyderabad Main Center",
    "city": "665b1b2c3d4e5f6789012345",
    "cityAddress": "Ameerpet, Hyderabad",
    "classroomName": "Class Room 1",
    "classroomCode": "CR-01",
    "capacity": 40,
    "status": "ACTIVE",
    "usage": { "upcoming": 0, "totalBookings": 0 },
    "createdAt": "2025-06-01T10:00:00.000Z",
    "updatedAt": "2025-06-01T10:00:00.000Z"
  }
}
```

### Example Error Response (404)

```json
{
  "success": false,
  "message": "Classroom not found"
}
```

---

## SECTION 9 — DROPDOWN APIs

### 9.1 Center Dropdown (Form Step 1)

| | |
|---|---|
| **Endpoint** | `GET /api/admin/centers/dropdown` |
| **Alt Endpoint** | `GET /api/centers/dropdown` |
| **Auth** | Staff Admin (`protect` + `requireStaffAdmin`) |
| **Filter** | Returns centers with `status: ACTIVE` only |
| **Sort** | `centerName` ascending |

**Response:**

```json
{
  "success": true,
  "count": 2,
  "data": [
    {
      "_id": "665a1b2c3d4e5f6789012345",
      "centerName": "Hyderabad Main Center",
      "centerCode": "HYD01",
      "city": "Hyderabad",
      "state": "Telangana"
    }
  ]
}
```

| Frontend Mapping | Value | Label |
|------------------|-------|-------|
| Submit value | `_id` | — |
| Display | — | `centerName` (optionally append `centerCode`) |

### 9.2 City Dropdown by Center (Form Step 2)

| | |
|---|---|
| **Endpoint** | `GET /api/cities/by-center/:centerId` |
| **Auth** | Super Admin |
| **Filter** | `centerId` match, `status: ACTIVE`, `isDeleted: false` |
| **Sort** | `cityAddress` ascending |

**Response:**

```json
{
  "success": true,
  "count": 2,
  "data": [
    {
      "_id": "665b1b2c3d4e5f6789012345",
      "centerId": "665a1b2c3d4e5f6789012345",
      "cityAddress": "Ameerpet, Hyderabad",
      "cityName": "Ameerpet, Hyderabad"
    }
  ]
}
```

| Frontend Mapping | Value | Label |
|------------------|-------|-------|
| Submit value | `_id` | — |
| Display | — | `cityAddress` or `cityName` (alias) |

**Error (invalid center):**

```json
{
  "success": false,
  "message": "Invalid or inactive center. Use an ACTIVE center from GET /api/centers/dropdown or /api/admin/centers/dropdown."
}
```

### 9.3 Classroom Dropdown (This Module — For Other Screens)

| | |
|---|---|
| **Endpoint** | `GET /api/classrooms/dropdown` |
| **Auth** | Super Admin |

**Query Parameters:**

| Param | Default | Description |
|-------|---------|-------------|
| `centerId` | — | Filter by center `_id` (**note: param name is `centerId`, not `center`**) |
| `city` | — | Filter by city `_id` |
| `status` | `ACTIVE` | `ACTIVE` or `INACTIVE` |

**Response:**

```json
{
  "success": true,
  "count": 5,
  "data": [
    {
      "_id": "665c1b2c3d4e5f6789012345",
      "classroomId": "CLS001",
      "classroomName": "Class Room 1",
      "classroomCode": "CR-01",
      "centerId": "665a1b2c3d4e5f6789012345",
      "capacity": 40
    }
  ]
}
```

| Frontend Mapping | Value | Label |
|------------------|-------|-------|
| Submit value | `_id` | — |
| Display | — | `classroomName` (optionally append `classroomCode` or `classroomId`) |

### 9.4 Course / Subject / Faculty / Batch Dropdowns

**Not required** for Classroom CRUD. No backend fields reference these entities.

Used only in **Live Class** scheduling (separate module) where `classroomId` is selected after center/batch context is resolved via `/api/live-classes/batch-context`.

---

## SECTION 10 — FILE & MEDIA SUPPORT

**Not supported.** Classroom has:

- No upload endpoints
- No multer middleware on classroom routes
- No image, document, floor plan, or attachment fields on the schema

All operations are JSON request/response only.

---

## SECTION 11 — FRONTEND SERVICE ARCHITECTURE

### Directory Structure

```text
src/
├── services/
│   ├── api.ts                  # Axios instance + auth interceptors
│   ├── centerService.ts        # Center dropdown (dependency)
│   ├── cityService.ts          # Cities by center (dependency)
│   └── classroomService.ts     # Classroom CRUD + dropdown
├── types/
│   └── classroom.ts            # TypeScript interfaces
```

### TypeScript Types (`src/types/classroom.ts`)

```typescript
export type ClassroomStatus = 'ACTIVE' | 'INACTIVE';

export interface Classroom {
  _id: string;
  classroomId: string;
  center: string;
  centerName?: string;
  city: string;
  cityAddress?: string;
  classroomName: string;
  classroomCode: string;
  capacity: number;
  status: ClassroomStatus;
  usage?: { upcoming: number; totalBookings: number };
  createdAt?: string;
  updatedAt?: string;
}

export interface ClassroomDropdownItem {
  _id: string;
  classroomId: string;
  classroomName: string;
  classroomCode: string;
  centerId: string;
  capacity: number;
}

export interface ClassroomListParams {
  page?: number;
  limit?: number;
  search?: string;
  center?: string;
  city?: string;
  status?: ClassroomStatus;
  sortBy?:
    | 'createdAt'
    | 'classroomName'
    | 'classroomCode'
    | 'capacity'
    | 'status'
    | 'centerName'
    | 'cityAddress';
  sortOrder?: 'asc' | 'desc';
}

export interface CreateClassroomPayload {
  center: string;
  city: string;
  classroomName: string;
  classroomCode: string;
  capacity?: number;
  status?: ClassroomStatus;
}

export interface UpdateClassroomPayload {
  center?: string;
  city?: string;
  classroomName?: string;
  classroomCode?: string;
  capacity?: number;
  status?: ClassroomStatus;
}

export interface ClassroomDropdownParams {
  centerId?: string;
  city?: string;
  status?: ClassroomStatus;
}
```

### Service Implementation (`src/services/classroomService.ts`)

```typescript
import api from './api';
import { stripEmptyParams } from './commonService';
import type { ApiSuccessResponse } from '../types/api';
import type {
  Classroom,
  ClassroomDropdownItem,
  ClassroomDropdownParams,
  ClassroomListParams,
  ClassroomStatus,
  CreateClassroomPayload,
  UpdateClassroomPayload,
} from '../types/classroom';

const CLASSROOMS_BASE = '/api/classrooms';

type PaginatedClassroomsResponse = ApiSuccessResponse<Classroom[]> & {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  count: number;
};

export const classroomService = {
  /** GET /api/classrooms — paginated list */
  getClassrooms: async (params?: ClassroomListParams) => {
    const { data } = await api.get<PaginatedClassroomsResponse>(CLASSROOMS_BASE, {
      params: stripEmptyParams(params),
    });
    return data;
  },

  /** GET /api/classrooms/:id — single record */
  getClassroomById: async (id: string) => {
    const { data } = await api.get<ApiSuccessResponse<Classroom>>(
      `${CLASSROOMS_BASE}/${id}`
    );
    return data;
  },

  /** GET /api/classrooms/dropdown */
  getClassroomDropdown: async (params?: ClassroomDropdownParams) => {
    const { data } = await api.get<
      ApiSuccessResponse<ClassroomDropdownItem[]> & { count: number }
    >(`${CLASSROOMS_BASE}/dropdown`, { params: stripEmptyParams(params) });
    return data;
  },

  /** POST /api/classrooms */
  createClassroom: async (payload: CreateClassroomPayload) => {
    const { data } = await api.post<ApiSuccessResponse<Classroom>>(
      CLASSROOMS_BASE,
      payload
    );
    return data;
  },

  /** PUT /api/classrooms/:id */
  updateClassroom: async (id: string, payload: UpdateClassroomPayload) => {
    const { data } = await api.put<ApiSuccessResponse<Classroom>>(
      `${CLASSROOMS_BASE}/${id}`,
      payload
    );
    return data;
  },

  /** PATCH /api/classrooms/status/:id */
  updateClassroomStatus: async (id: string, status: ClassroomStatus) => {
    const { data } = await api.patch<ApiSuccessResponse<Classroom>>(
      `${CLASSROOMS_BASE}/status/${id}`,
      { status }
    );
    return data;
  },

  /** DELETE /api/classrooms/:id — soft delete */
  deleteClassroom: async (id: string) => {
    const { data } = await api.delete<ApiSuccessResponse<{ _id: string }>>(
      `${CLASSROOMS_BASE}/${id}`
    );
    return data;
  },
};

export default classroomService;
```

### Dependency: City Service (`src/services/cityService.ts`)

```typescript
import api from './api';
import type { ApiSuccessResponse } from '../types/api';

export interface CityDropdownItem {
  _id: string;
  centerId: string;
  cityAddress: string;
  cityName: string;
}

const CITIES_BASE = '/api/cities';

export const cityService = {
  /** GET /api/cities/by-center/:centerId */
  getCitiesByCenter: async (centerId: string) => {
    const { data } = await api.get<
      ApiSuccessResponse<CityDropdownItem[]> & { count: number }
    >(`${CITIES_BASE}/by-center/${centerId}`);
    return data;
  },
};
```

---

## SECTION 12 — REACT QUERY INTEGRATION

### Query Keys (`src/hooks/queryKeys.ts`)

```typescript
export const classroomKeys = {
  all: ['classrooms'] as const,
  lists: () => [...classroomKeys.all, 'list'] as const,
  list: (params?: Record<string, unknown>) =>
    [...classroomKeys.lists(), params ?? {}] as const,
  details: () => [...classroomKeys.all, 'detail'] as const,
  detail: (id: string) => [...classroomKeys.details(), id] as const,
  dropdown: (params?: Record<string, unknown>) =>
    [...classroomKeys.all, 'dropdown', params ?? {}] as const,
};
```

### Hooks (`src/hooks/useClassrooms.ts`)

```typescript
import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseQueryOptions,
} from '@tanstack/react-query';
import { classroomService } from '../services/classroomService';
import { classroomKeys } from './queryKeys';
import { handleApiError } from '../utils/errorHandler';
import type { ApiSuccessResponse } from '../types/api';
import type {
  Classroom,
  ClassroomDropdownItem,
  ClassroomDropdownParams,
  ClassroomListParams,
  ClassroomStatus,
  CreateClassroomPayload,
  UpdateClassroomPayload,
} from '../types/classroom';

type ClassroomsResponse = ApiSuccessResponse<Classroom[]> & {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  count: number;
};

/** GET /api/classrooms — paginated list */
export const useClassrooms = (
  params?: ClassroomListParams,
  options?: Omit<UseQueryOptions<ClassroomsResponse>, 'queryKey' | 'queryFn'>
) =>
  useQuery({
    queryKey: classroomKeys.list(params),
    queryFn: () => classroomService.getClassrooms(params),
    ...options,
  });

/** GET /api/classrooms/:id */
export const useClassroom = (
  id: string | undefined,
  options?: Omit<UseQueryOptions<ApiSuccessResponse<Classroom>>, 'queryKey' | 'queryFn'>
) =>
  useQuery({
    queryKey: classroomKeys.detail(id ?? ''),
    queryFn: () => classroomService.getClassroomById(id!),
    enabled: Boolean(id),
    ...options,
  });

/** GET /api/classrooms/dropdown */
export const useClassroomDropdown = (
  params?: ClassroomDropdownParams,
  options?: Omit<
    UseQueryOptions<ApiSuccessResponse<ClassroomDropdownItem[]> & { count: number }>,
    'queryKey' | 'queryFn'
  >
) =>
  useQuery({
    queryKey: classroomKeys.dropdown(params),
    queryFn: () => classroomService.getClassroomDropdown(params),
    enabled: Boolean(params?.centerId),
    staleTime: 5 * 60 * 1000,
    ...options,
  });

/** POST /api/classrooms */
export const useCreateClassroom = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateClassroomPayload) =>
      classroomService.createClassroom(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: classroomKeys.all });
    },
    onError: (error) => handleApiError(error),
  });
};

/** PUT /api/classrooms/:id */
export const useUpdateClassroom = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateClassroomPayload }) =>
      classroomService.updateClassroom(id, payload),
    onSuccess: (_response, variables) => {
      queryClient.invalidateQueries({ queryKey: classroomKeys.all });
      queryClient.invalidateQueries({ queryKey: classroomKeys.detail(variables.id) });
    },
    onError: (error) => handleApiError(error),
  });
};

/** PATCH /api/classrooms/status/:id */
export const useUpdateClassroomStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: ClassroomStatus }) =>
      classroomService.updateClassroomStatus(id, status),
    onSuccess: (_response, variables) => {
      queryClient.invalidateQueries({ queryKey: classroomKeys.all });
      queryClient.invalidateQueries({ queryKey: classroomKeys.detail(variables.id) });
    },
    onError: (error) => handleApiError(error),
  });
};

/** DELETE /api/classrooms/:id */
export const useDeleteClassroom = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => classroomService.deleteClassroom(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: classroomKeys.all });
    },
    onError: (error) => handleApiError(error),
  });
};
```

### Mutation Strategy

| Operation | Strategy |
|-----------|----------|
| Create | `invalidateQueries(classroomKeys.all)` on success |
| Update | Invalidate list + detail for updated ID |
| Status toggle | Invalidate list + detail |
| Delete | Invalidate list; navigate away from detail if open |

### Cache Invalidation

Always invalidate `classroomKeys.all` after any mutation — this covers lists and dropdowns.

### Refetch Logic

- List page: refetch when filters/page/sort change via query key
- City dropdown: refetch when `centerId` changes; clear city selection on center change
- Classroom dropdown: `enabled: Boolean(params?.centerId)` — do not fetch until center selected

### Optimistic Updates (Optional)

For status toggle only:

```typescript
onMutate: async ({ id, status }) => {
  await queryClient.cancelQueries({ queryKey: classroomKeys.lists() });
  const previous = queryClient.getQueryData(classroomKeys.list());
  // Update cached list rows where _id === id → status
  return { previous };
},
onError: (_err, _vars, context) => {
  if (context?.previous) {
    queryClient.setQueryData(classroomKeys.list(), context.previous);
  }
},
```

Prefer server-confirmed state for create/update/delete — no optimistic insert.

---

## SECTION 13 — FORM FIELD MAPPING

### Add / Edit Classroom Form

| Frontend Field | Backend Field | Required | Validation | Default Value | Dropdown Source |
|----------------|---------------|----------|------------|---------------|-----------------|
| Center select | `center` (alias `centerId`) | **Yes** | Must be active center ObjectId | — | `GET /api/admin/centers/dropdown` |
| City select | `city` (alias `cityId`) | **Yes** | Must belong to selected center, active | — | `GET /api/cities/by-center/:centerId` |
| Classroom Name | `classroomName` | **Yes** | Non-empty trimmed string | — | — |
| Classroom Code | `classroomCode` | **Yes** | Non-empty; globally unique; uppercased server-side | — | — |
| Capacity | `capacity` | No | Integer ≥ 0 | `0` | — |
| Status select/toggle | `status` | No | `ACTIVE` or `INACTIVE` | `ACTIVE` | Static enum |
| Classroom ID (read-only) | `classroomId` | — | Server-generated | — | Display only on edit |
| Mongo ID (hidden) | `_id` | — | URL param for edit | — | Never sent on create |

### Cascading Dropdown Rules

1. Load centers on form mount.
2. On center change: clear city, fetch cities for new center.
3. Disable city select until center is selected.
4. On edit: load classroom detail first, then fetch cities for `data.center`, pre-select `data.city`.

### Create Form Submit

```typescript
const create = useCreateClassroom();

const onSubmit = (values: FormValues) => {
  if (!values.center?.trim() || !values.city?.trim()) return;
  if (!values.classroomName?.trim() || !values.classroomCode?.trim()) return;

  create.mutate({
    center: values.center,
    city: values.city,
    classroomName: values.classroomName.trim(),
    classroomCode: values.classroomCode.trim(),
    capacity: Number(values.capacity) || 0,
    status: values.status ?? 'ACTIVE',
  });
};
```

### Edit Form Prefill

```typescript
const { data } = useClassroom(classroomId);
const classroom = data?.data;

// Prefill:
// center        → classroom.center
// city          → classroom.city
// classroomName → classroom.classroomName
// classroomCode → classroom.classroomCode
// capacity      → classroom.capacity
// status        → classroom.status
// classroomId   → classroom.classroomId (read-only)
```

---

## SECTION 14 — TABLE FIELD MAPPING

### Classroom List Table

| Column | Response Field | Sortable (`sortBy`) | Notes |
|--------|----------------|---------------------|-------|
| Classroom ID | `classroomId` | — | Human-readable ID |
| Name | `classroomName` | `classroomName` | Primary label |
| Code | `classroomCode` | `classroomCode` | Uppercase in DB |
| Center | `centerName` | `centerName` | From `$lookup` |
| City / Branch | `cityAddress` | `cityAddress` | From `$lookup` |
| Capacity | `capacity` | `capacity` | Number |
| Status | `status` | `status` | `ACTIVE` / `INACTIVE` badge |
| Upcoming | `usage.upcoming` | — | Always `0` (placeholder) |
| Total Bookings | `usage.totalBookings` | — | Always `0` (placeholder) |
| Created | `createdAt` | `createdAt` | Default sort field |
| Actions | — | — | Edit, Delete, Status toggle |

### Search Fields (Single Search Input)

Backend `search` param matches:

- Classroom name
- Classroom code
- Center name
- City address

### Filters

| Filter UI | Query Param | Source |
|-----------|-------------|--------|
| Center | `center` | Center dropdown `_id` |
| City | `city` | Cities-by-center `_id` (load when center filter selected) |
| Status | `status` | Static: `ACTIVE`, `INACTIVE`, or empty for all |

> **Note:** List filter uses `center`; dropdown endpoint uses `centerId`. Map accordingly.

### Pagination

| UI Control | Query Param | Default |
|------------|-------------|---------|
| Page number | `page` | `1` |
| Page size | `limit` | `10` (max `100`) |

Display: `total`, `totalPages`, `count` from response.

### Row Actions

| Action | Hook | Endpoint |
|--------|------|----------|
| View / Edit | Navigate to edit form | `GET /api/classrooms/:id` |
| Toggle status | `useUpdateClassroomStatus` | `PATCH /api/classrooms/status/:id` |
| Delete | `useDeleteClassroom` | `DELETE /api/classrooms/:id` |

### Bulk Actions

**Not supported** — no bulk status, bulk delete, or multi-select endpoints exist.

### Status Handling

| UI State | Backend Value | Display |
|----------|---------------|---------|
| Active | `ACTIVE` | Green badge / toggle on |
| Inactive | `INACTIVE` | Gray badge / toggle off |
| Deleted | — | Not returned in list (soft-deleted) |

### Export Support

**Not supported** — no export endpoint exists for classrooms.

### Loading / Error / Empty States

- `PageLoader` when `isLoading`
- `ErrorState` with `onRetry={() => refetch()}` when `isError`
- `EmptyState` when `!isLoading && rows.length === 0`

---

## SECTION 15 — ERROR HANDLING

The backend Classroom controller returns **400, 401, 403, 404, 500** only. It does **not** return **409** or **422** for Classroom endpoints.

Use `handleApiError` from `src/utils/errorHandler.ts` in all mutation `onError` handlers.

### 400 — Validation / Business Rule

| Message | Cause | Frontend Behavior |
|---------|-------|-------------------|
| `center and city are required` | Missing parent IDs on create | Highlight center/city fields |
| `classroomName is required` | Empty name on create | Highlight name field |
| `classroomCode is required` | Empty code on create | Highlight code field |
| `classroomName cannot be empty` | Empty name on update | Highlight name field |
| `classroomCode cannot be empty` | Empty code on update | Highlight code field |
| `Invalid center or city id` | Malformed ObjectId | Reset invalid dropdown selection |
| `Invalid or inactive center` | Center not found or not ACTIVE | Highlight center dropdown |
| `City does not belong to the selected center or is inactive` | City/center mismatch | Highlight city dropdown; re-fetch cities |
| `Invalid capacity. Must be zero or a positive number.` | Negative or non-numeric capacity | Highlight capacity field |
| `Status must be ACTIVE or INACTIVE` | Invalid status value | Reset status control |
| `classroomCode already exists` | Duplicate global code | Inline error on code field |

Display `response.data.message` via toast or inline alert.

### 401 — Unauthorized

| Message (examples) | Cause |
|--------------------|-------|
| `Not authorized, no token` | Missing Bearer token |
| `Not authorized, token failed` | Expired/invalid JWT |
| `Not authenticated` | `requireSuperAdmin` with no user |

**Frontend behavior:**

- `api.ts` interceptor dispatches `auth:unauthorized` event
- Redirect to `/login`
- Clear token via `clearAuthToken()`
- Do not show fake success

### 403 — Forbidden

| Message | Cause |
|---------|-------|
| `Access denied. Super Admin only.` | Authenticated but not Super Admin |
| `Account is disabled` | AdminAccess disabled |
| `Account is deactivated` | Legacy user inactive |

**Frontend behavior:** Show permission error; redirect to `/unauthorized` if using `RoleGuard`.

### 404 — Not Found

| Message | Cause |
|---------|-------|
| `Classroom not found` | Invalid ID or soft-deleted classroom |

**Frontend behavior:** Show not-found state; redirect to list after delete.

### 409 — Conflict

**Not returned by Classroom CRUD API.**

Downstream live class scheduling may return `CLASSROOM_SCHEDULE_CONFLICT` when double-booking — unrelated to Classroom management screens.

### 422 — Unprocessable Entity

**Not returned by Classroom API.** No schema validator middleware on classroom routes.

### 500 — Server Error

```json
{
  "success": false,
  "message": "Server error",
  "error": "<error.message>"
}
```

**Frontend behavior:** Show generic error toast; allow retry; log `error` field in dev.

### Network Errors

| Condition | Frontend Behavior |
|-----------|-------------------|
| Timeout (30s axios default) | Show retry option |
| No response / offline | Show connectivity message |
| CORS / DNS failure | Show support contact message |

Never update UI as success without `success: true` in response body.

---

## SECTION 16 — AUTHORIZATION

### Roles

| Role | Classroom Access |
|------|------------------|
| **Super Admin** (`roleCode: SUPER_ADMIN` or legacy `role: super_admin`) | Full CRUD on all `/api/classrooms` endpoints |
| **All other roles** | **Denied** — 403 `Access denied. Super Admin only.` |

### Permissions Matrix

Classroom routes use a **hard Super Admin gate** (`requireSuperAdmin`). They do **not** use `hasFeaturePermission` or the permission matrix module keys.

No `CLASSROOM` feature key exists in `config/permissionModules.js` for granular toggles.

### Dependency Endpoint Auth

| Endpoint | Auth |
|----------|------|
| `/api/admin/centers/dropdown` | Staff Admin+ (Super Admin satisfies this) |
| `/api/cities/by-center/:centerId` | Super Admin |

### Access Rules

| Route (Frontend) | Guard |
|------------------|-------|
| `/academics/categories/class-rooms` | Super Admin only |
| Create / Edit modals | Same guard as list |

### Protected Routes (Frontend)

```typescript
<Route
  path="/academics/categories/class-rooms"
  element={
    <RoleGuard allowedRoles={['SUPER_ADMIN']}>
      <ClassroomManagementPage />
    </RoleGuard>
  }
/>
```

### Future Role Scalability

If non–Super Admin roles need classroom access later, backend must:

1. Replace or supplement `requireSuperAdmin` on `classroomRoutes.js`
2. Add permission module features to `config/permissionModules.js`
3. Frontend updates `RoleGuard` and route guards accordingly

Until then, treat Classroom as **Super Admin only**.

---

## SECTION 17 — SERVER PERSISTENCE VERIFICATION

All UI success states must be confirmed from **backend responses** — never from optimistic local state alone.

### Classroom Created Successfully

Verify:

```typescript
const response = await classroomService.createClassroom(payload);
// response.success === true
// response.message === 'Classroom created successfully'
// response.data._id exists
// response.data.classroomId starts with 'CLS'
```

Optional confirmation: `GET /api/classrooms/:id` with returned `_id`.

### Classroom Updated Successfully

Verify:

```typescript
const response = await classroomService.updateClassroom(id, payload);
// response.success === true
// response.message === 'Classroom updated successfully'
// response.data.updatedAt changed
```

### Classroom Deleted Successfully

Verify:

```typescript
const response = await classroomService.deleteClassroom(id);
// response.success === true
// response.message === 'Classroom deleted successfully'
// response.data._id === deleted id
```

Confirm removal: `GET /api/classrooms/:id` returns 404.

### Classroom Retrieved Successfully

Verify:

```typescript
const response = await classroomService.getClassroomById(id);
// response.success === true
// response.data is populated object
```

### Data Saved in MongoDB

The backend writes directly to the `classrooms` collection via Mongoose:

- **Create:** `Classroom.create(...)` — returns 201 with full `data`
- **Update:** `classroom.save()` — returns 200 with populated `data`
- **Delete:** sets `isDeleted`, `deletedAt`, `status: INACTIVE` — returns 200
- **List/Detail:** queries `{ isDeleted: false }` — deleted records excluded

Frontend must not assume persistence from mutation call alone — always check `response.success`.

---

## SECTION 18 — PRODUCTION TESTING CHECKLIST

- [ ] Classroom Service Created (`classroomService.ts`)
- [ ] City dependency service wired (`cityService.getCitiesByCenter`)
- [ ] Center dependency service wired (`centerService.getCentersDropdown`)
- [ ] React Query Hooks Created (`useClassrooms`, `useClassroom`, mutations, dropdown)
- [ ] CRUD Connected (create, read, update, delete)
- [ ] Search Connected (`search` query param)
- [ ] Filters Connected (center, city, status)
- [ ] Pagination Connected (page, limit, totalPages)
- [ ] Sorting Connected (all `sortBy` values)
- [ ] Center Dropdown Connected
- [ ] City Cascading Dropdown Connected (clears on center change)
- [ ] Classroom Dropdown Connected (for other modules if needed)
- [ ] Status Toggle Connected (`PATCH /status/:id`)
- [ ] Authentication Tested (401 → login redirect)
- [ ] Authorization Tested (403 for non–Super Admin)
- [ ] Error Handling Tested (400 messages mapped to fields)
- [ ] Server Persistence Verified (201/200 responses, detail refetch)
- [ ] Soft Delete Verified (deleted row absent from list, 404 on detail)
- [ ] Production Ready

---

## SECTION 19 — IMPLEMENTATION FLOW

### End-to-End Lifecycle

```text
┌─────────────────┐
│  Frontend Form  │  User selects center → city → enters name/code/capacity
└────────┬────────┘
         ▼
┌─────────────────┐
│   Validation    │  Client: required fields, capacity ≥ 0
└────────┬────────┘
         ▼
┌─────────────────┐
│ React Query     │  useCreateClassroom / useUpdateClassroom mutation
│ Mutation        │
└────────┬────────┘
         ▼
┌─────────────────┐
│ classroomService│  POST/PUT /api/classrooms
└────────┬────────┘
         ▼
┌─────────────────┐
│ Axios Instance  │  api.ts — attaches Bearer token, JSON headers
└────────┬────────┘
         ▼
┌─────────────────┐
│ Backend Route   │  routes/classroomRoutes.js
│                 │  middleware: protect → requireSuperAdmin
└────────┬────────┘
         ▼
┌─────────────────┐
│ Controller      │  classroomController.js
│                 │  validateCityBelongsToCenter, validateCapacity
└────────┬────────┘
         ▼
┌─────────────────┐
│ MongoDB         │  classrooms collection (Mongoose Classroom model)
└────────┬────────┘
         ▼
┌─────────────────┐
│ Response        │  { success, message, data } — 201 or 200
└────────┬────────┘
         ▼
┌─────────────────┐
│ React Query     │  invalidateQueries(classroomKeys.all)
│ Cache Update    │
└────────┬────────┘
         ▼
┌─────────────────┐
│  UI Refresh     │  Table refetch, toast, navigate to list/detail
└─────────────────┘
```

### List Page Lifecycle

```text
Page mount → useClassrooms({ page, limit, search, center, city, status, sortBy, sortOrder })
  → classroomService.getClassrooms(params)
  → GET /api/classrooms
  → aggregation pipeline with $lookup (centers, cities)
  → paginated JSON response
  → table render
```

### Cascading Dropdown Lifecycle

```text
Form mount → useCentersDropdown()
User picks center → useCitiesByCenter(centerId) enabled
User picks city → enable submit
Submit → POST with center + city ObjectIds
```

---

## SECTION 20 — IMPLEMENTATION SOURCE OF TRUTH

### Recommended Frontend Architecture

```text
src/
├── services/
│   ├── api.ts                         # Axios instance, auth interceptors
│   ├── centerService.ts               # Center dropdown
│   ├── cityService.ts                 # Cities by center
│   └── classroomService.ts            # Classroom CRUD + dropdown
├── hooks/
│   ├── queryKeys.ts                   # classroomKeys factory
│   ├── useClassrooms.ts               # All classroom React Query hooks
│   ├── useCentersDropdown.ts          # Center picker (existing)
│   └── useCitiesByCenter.ts           # Dependent city picker
├── types/
│   └── classroom.ts                   # Classroom interfaces
├── providers/
│   └── QueryProvider.tsx              # React Query client
├── routes/
│   └── academicsRoutes.tsx            # /academics/categories/class-rooms
├── components/common/
│   ├── DataTable.tsx                  # Reusable paginated table
│   ├── SearchInput.tsx
│   ├── StatusBadge.tsx
│   ├── PageLoader.tsx
│   ├── ErrorState.tsx
│   └── EmptyState.tsx
└── pages/ClassroomManagement/
    ├── ClassroomListPage.tsx          # Table + filters + search
    ├── ClassroomFormPage.tsx          # Create / Edit shared form
    └── components/
        ├── ClassroomFilters.tsx
        ├── ClassroomTable.tsx
        └── ClassroomForm.tsx
```

### Integration with Centralized Architecture

| Layer | Responsibility |
|-------|----------------|
| **Environment Variables** | `VITE_API_BASE_URL`, `VITE_AUTH_TOKEN_KEY` in `.env` |
| **Axios Instance** | `api.ts` — single base URL, 30s timeout, Bearer injection, 401 event |
| **Service Layer** | `classroomService.ts` — one method per backend endpoint; no invented URLs |
| **React Query** | Hooks wrap services; query keys include filter params; mutations invalidate `classroomKeys.all` |
| **Error Handling** | `handleApiError` in mutation `onError`; field-level mapping for 400 messages |
| **Route Guards** | `RoleGuard` with `SUPER_ADMIN` on classroom pages |

### Academics → Categories Module Placement

```text
Academics
└── Categories (sidebar group)
    ├── Programs          → /api/programs
    ├── Exam Category     → /api/categories
    ├── Courses           → /api/courses
    ├── Subject           → /api/subjects
    ├── Topic             → /api/topics
    ├── Teachers          → /api/teachers
    ├── City              → /api/cities          (prerequisite)
    └── Class Rooms       → /api/classrooms      (this module)
```

### Preserving 100% Existing Functionality

| Rule | Detail |
|------|--------|
| Use exact endpoints | `/api/classrooms`, not invented paths |
| Use exact field names | `center`, `city`, `classroomName`, `classroomCode`, `capacity`, `status` |
| Accept aliases | `centerId`, `cityId` in request body only |
| List vs dropdown params | List: `center`; Dropdown: `centerId` |
| ID param | URL `:id` = MongoDB `_id`, not `classroomId` |
| Auth header | `Authorization: Bearer <token>` on every request |
| Super Admin only | Match backend `requireSuperAdmin` gate |
| No mock APIs | All data from live backend |
| No local persistence | Confirm via `success: true` responses |

---

## APPENDIX — Quick Reference

### Environment

```env
VITE_API_BASE_URL=http://localhost:5000
VITE_AUTH_TOKEN_KEY=authToken
```

### Auth Header (All Requests)

```http
Authorization: Bearer <JWT>
Content-Type: application/json
```

### Param Name Cheat Sheet

| Context | Center Param | City Param |
|---------|--------------|------------|
| List `GET /api/classrooms` | `center` | `city` |
| Dropdown `GET /api/classrooms/dropdown` | `centerId` | `city` |
| Create/Update body | `center` or `centerId` | `city` or `cityId` |

### Backend Source of Truth Files

| File | Purpose |
|------|---------|
| `routes/classroomRoutes.js` | Route definitions + middleware |
| `controllers/classroomController.js` | All business logic + response shapes |
| `models/Classroom.js` | MongoDB schema |
| `utils/classroomHelpers.js` | Center/city validation |
| `CLASSROOM_API_GUIDE.md` | Supplementary API guide |
| `CLASSROOM_POSTMAN_COLLECTION.json` | Postman test collection |

---

*Document generated from backend source analysis. Backend is the single source of truth — do not invent APIs, fields, or validation rules beyond what is documented here.*
