# Test Management → Test Configuration → Section Management — Frontend Integration Guide

**Audience:** React + Vite frontend developers integrating the **Section Management** page under **Test Management → Test Configuration**.

**Backend module:** **Test Config Sections** (`TestConfigSection` model, `testConfigSectionController`, `testConfigurationRoutes`).

**Base path:** `{VITE_API_BASE_URL}/api/test-configuration/sections`

**Frontend route (product UI):** `/test-management/test-configuration/section-management`

**Auth:** `Authorization: Bearer <token>` — **Super Admin only**

---

## Critical naming distinction

| Layer | Name | Notes |
|-------|------|-------|
| Frontend page | **Section Management** | UI route under Test Management → Test Configuration |
| Backend model | **TestConfigSection** | MongoDB collection for test paper sections |
| Backend display ID | `sectionId` | Sequential code (e.g. `SEC-1010`) — **not** the API path `:id` |
| API path `:id` | MongoDB `_id` | Always use `_id` from list/create/detail for update, delete, status |
| Folder / module label | `testconfigsections` | Controller file: `testConfigSectionController.js` |

Section Management records represent **test paper sections** (e.g. "GS Paper 1", "English Comprehension", "Reasoning Section"). They are **not** the same as **Academics → Class Sections** (`/api/academics/classes`) or physical **Classrooms** (`/api/classrooms`).

---

## 1. Module Overview

### Purpose

**Section Management** (backend: `TestConfigSection`) manages reusable **test paper section definitions** used in Test Configuration. Each record is a named section with an active/inactive status.

Each record contains:

- A system-generated **`sectionId`** (format `SEC-0001`, `SEC-1010`, … — 4-digit zero-padded suffix)
- A **`sectionName`** (required, unique case-insensitive among non-deleted records)
- A **`status`** (`ACTIVE` | `INACTIVE`)

### Business flow

1. Super Admin opens **Test Management → Test Configuration → Section Management**.
2. Admin views a paginated list of sections with search, status filter, and sorting.
3. Admin creates new sections (name + optional status).
4. Admin edits section name and/or status, toggles status via dedicated endpoint, or soft-deletes a section.
5. Active sections appear in the **sections dropdown** for use elsewhere in Test Configuration or future test-building flows.

### User journey

```
Login (Super Admin)
  → Navigate to Section Management
  → View table (list API)
  → Optional: search by name/ID, filter by status, sort, paginate
  → Add Section → fill sectionName + status → Create
  → Edit row → update sectionName and/or status
  → Toggle status → PATCH status endpoint
  → Delete → confirm → soft delete (record hidden from list; status set INACTIVE)
```

### Backend architecture

There is **no** dedicated Service, Repository, DTO, Joi/Zod validation middleware, or Swagger spec for Section Management. Logic lives directly in the controller with shared helpers.

| Layer | File | Role |
|-------|------|------|
| Route mount | `app.js` | `app.use('/api/test-configuration', testConfigurationRoutes)` |
| Routes | `routes/testConfigurationRoutes.js` | Registers 7 Section endpoints; applies `protect`, `requireSuperAdmin` to entire router |
| Controller | `controllers/testConfigSectionController.js` | Validation, CRUD, formatting, list query building |
| Model | `models/TestConfigSection.js` | Mongoose schema, indexes |
| Helpers | `utils/testConfigurationHelpers.js` | Pagination, sort presets, status normalization, search filter |
| Helpers | `utils/contentMastersHelpers.js` | `NOT_DELETED`, `parsePagination`, `parseSort`, regex escape |
| ID generator | `utils/contentIdGenerator.js` | `generateTestConfigSectionId()` → prefix `SEC-`, 4-digit padding |
| Auth | `middleware/authMiddleware.js` | `protect` — JWT Bearer validation |
| Auth | `middleware/requireSuperAdmin.js` | Super Admin role gate |
| Permissions | `utils/permissionHelpers.js` | `isSuperAdminRequest()` |

**Not implemented for Section Management:** separate service layer, repository, DTOs, Joi/Zod middleware, OpenAPI/Swagger, restore endpoint, bulk actions, export/import, hard delete.

### Frontend responsibilities

| Responsibility | Details |
|----------------|---------|
| Auth | Attach Bearer token on every request; gate route to Super Admin |
| List UI | Table with pagination, search, status filter, sort presets |
| Create/Edit forms | `sectionName` text input, `status` select (Active/Inactive) |
| Status toggle | Call dedicated PATCH status endpoint or include status in PUT |
| Delete | Confirm dialog; call DELETE; refresh list |
| Error display | Surface `response.data.message` from backend |
| Caching | TanStack Query with invalidation on mutations |
| Dropdown (if needed on this page) | `GET /sections/dropdown` — usually not needed on admin list page itself |

### Available features (current implementation)

| Feature | Supported |
|---------|-----------|
| Create | Yes |
| List (paginated) | Yes |
| Get by ID | Yes |
| Update (full PUT) | Yes |
| Status change (dedicated PATCH) | Yes |
| Status change via PUT | Yes (optional `status` in body) |
| Soft delete | Yes |
| Hard delete | **No** |
| Restore deleted record | **No** |
| Bulk delete | **No** |
| Bulk status update | **No** |
| Search | Yes — `sectionName`, `sectionId` |
| Pagination | Yes — `page`, `limit` (max 100) |
| Sorting | Yes — `sortBy` + `sortOrder` or `sortPreset` |
| Status filter | Yes — `ACTIVE` / `INACTIVE` |
| Dropdown (active only) | Yes — **GET only** |
| Export | **No** |
| Import | **No** |

### Downstream consumers

As of the current codebase, **no other model references `TestConfigSection` by ObjectId**. The dropdown endpoint exists for future Test Configuration / test-building UIs. Do not confuse with Academics Class Sections.

---

## 2. Backend File Structure

Every backend file involved in Section Management:

```
app.js
  └── app.use('/api/test-configuration', testConfigurationRoutes)

routes/
  └── testConfigurationRoutes.js
        ├── router.use(protect, requireSuperAdmin)   // all routes
        ├── GET    /sections/dropdown  → getSectionsDropdown
        ├── PATCH  /sections/status/:id → updateSectionStatus
        ├── POST   /sections           → createSection
        ├── GET    /sections           → getSections
        ├── GET    /sections/:id       → getSectionById
        ├── PUT    /sections/:id       → updateSection
        └── DELETE /sections/:id       → deleteSection

controllers/
  └── testConfigSectionController.js
        ├── resolveSectionName()       // body alias resolver
        ├── formatSection()            // response formatter
        ├── buildListQuery()           // search + status filter
        ├── createSection
        ├── getSections
        ├── getSectionsDropdown
        ├── getSectionById
        ├── updateSection
        ├── updateSectionStatus
        └── deleteSection

models/
  └── TestConfigSection.js
        ├── sectionId (String, unique)
        ├── sectionName (String, required, trim)
        ├── status (enum: ACTIVE | INACTIVE, default ACTIVE)
        ├── isDeleted (Boolean, default false, indexed)
        ├── deletedAt (Date, default null)
        └── timestamps: createdAt, updatedAt

utils/
  ├── testConfigurationHelpers.js
  │     ├── formatDateOnly
  │     ├── normalizeStatus
  │     ├── parseTestConfigSort
  │     ├── buildStatusFilter
  │     ├── applySearchFilter
  │     └── SORT_PRESETS (includes sectionName_az, sectionName_za)
  ├── contentMastersHelpers.js
  │     ├── NOT_DELETED = { isDeleted: false }
  │     ├── parsePagination
  │     ├── parseSort
  │     └── escapeRegex
  └── contentIdGenerator.js
        └── generateTestConfigSectionId()  // SEC- + 4 digits

middleware/
  ├── authMiddleware.js      → protect
  └── requireSuperAdmin.js   → requireSuperAdmin

utils/
  └── permissionHelpers.js   → isSuperAdminRequest, getRoleCodeFromRequest
```

**No DTOs, validators, or enums files** exist for this module — validation is inline in the controller.

---

## 3. Complete API Inventory

All Section Management routes require authentication and **Super Admin** role.

**Middleware chain (every route):**

```javascript
router.use(protect, requireSuperAdmin);
```

| # | Method | Endpoint | Purpose |
|---|--------|----------|---------|
| 1 | `POST` | `/api/test-configuration/sections` | Create section |
| 2 | `GET` | `/api/test-configuration/sections` | Paginated list with search, filter, sort |
| 3 | `GET` | `/api/test-configuration/sections/dropdown` | Active sections for dropdowns |
| 4 | `GET` | `/api/test-configuration/sections/:id` | Get single record by MongoDB `_id` |
| 5 | `PUT` | `/api/test-configuration/sections/:id` | Update sectionName and/or status |
| 6 | `PATCH` | `/api/test-configuration/sections/status/:id` | Update status only |
| 7 | `DELETE` | `/api/test-configuration/sections/:id` | Soft delete |

> **Note:** Unlike Exam Pattern and Language Settings, Section Management dropdown supports **GET only** — there is no `POST /sections/dropdown` route.

---

### 3.1 Create Section

| Property | Value |
|----------|-------|
| **HTTP Method** | `POST` |
| **URL** | `/api/test-configuration/sections` |
| **Purpose** | Create a new test config section |
| **Authentication** | Required — Bearer token |
| **Authorization** | Super Admin only |
| **Roles** | `SUPER_ADMIN` (AdminAccess) or legacy `User.role === 'super_admin'` |

**Headers**

| Header | Required | Value |
|--------|----------|-------|
| `Authorization` | Yes | `Bearer <token>` |
| `Content-Type` | Yes | `application/json` |

**Path parameters:** None

**Query parameters:** None

**Request body**

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| `sectionName` | `string` | Yes | Trimmed; non-empty; unique among non-deleted (case-insensitive) |
| `section_name` | `string` | Alt key | Same as `sectionName` |
| `name` | `string` | Alt key | Same as `sectionName` |
| `status` | `string` | No | `ACTIVE` or `INACTIVE`; default `ACTIVE` |

**Success response — `201 Created`**

```json
{
  "success": true,
  "message": "Section created successfully",
  "data": {
    "_id": "674a1b2c3d4e5f6789012345",
    "sectionId": "SEC-1010",
    "sectionName": "English Comprehension",
    "status": "ACTIVE",
    "createdAt": "2026-06-27T10:00:00.000Z",
    "updatedAt": "2026-06-27T10:00:00.000Z",
    "createdOn": "2026-06-27",
    "modifiedOn": "2026-06-27"
  }
}
```

**Error responses:** See [§5 Response Documentation](#5-response-documentation) and [§16 Error Handling Guide](#16-error-handling-guide).

---

### 3.2 List Sections

| Property | Value |
|----------|-------|
| **HTTP Method** | `GET` |
| **URL** | `/api/test-configuration/sections` |
| **Purpose** | Paginated list with search, status filter, sorting |
| **Authentication** | Required |
| **Authorization** | Super Admin only |

**Headers:** `Authorization: Bearer <token>` (no body)

**Query parameters**

| Param | Type | Required | Default | Validation | Description |
|-------|------|----------|---------|------------|-------------|
| `page` | `number` | No | `1` | ≥ 1 | Page number (1-based) |
| `limit` | `number` | No | `10` | 1–100 | Items per page |
| `search` | `string` | No | `""` | — | Case-insensitive partial match on `sectionName` OR `sectionId` |
| `status` | `string` | No | — | `ACTIVE` \| `INACTIVE` | Omit for all non-deleted statuses |
| `sortBy` | `string` | No | `createdAt` | See allowed fields | Sort field |
| `sortOrder` | `string` | No | `desc` | `asc` \| `desc` | Sort direction |
| `sortPreset` | `string` | No | — | See presets | UI-friendly sort; overrides `sortBy`/`sortOrder` when valid |

**Allowed `sortBy` values:** `createdAt`, `updatedAt`, `sectionName`, `sectionId`, `status`

**Allowed `sortPreset` values (Section Management):**

| Preset | Maps to |
|--------|---------|
| `createdOn_newest` | `createdAt` desc |
| `createdOn_oldest` | `createdAt` asc |
| `modifiedOn_newest` | `updatedAt` desc |
| `modifiedOn_oldest` | `updatedAt` asc |
| `sectionName_az` | `sectionName` asc |
| `sectionName_za` | `sectionName` desc |

**Success response — `200 OK`**

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
      "_id": "674a1b2c3d4e5f6789012345",
      "sectionId": "SEC-1010",
      "sectionName": "English Comprehension",
      "status": "ACTIVE",
      "createdAt": "2026-06-27T10:00:00.000Z",
      "updatedAt": "2026-06-27T10:00:00.000Z",
      "createdOn": "2026-06-27",
      "modifiedOn": "2026-06-27"
    }
  ]
}
```

**Pagination fields**

| Field | Description |
|-------|-------------|
| `total` | Total matching records (all pages) |
| `page` | Current page (echoed from request) |
| `limit` | Page size (echoed from request) |
| `totalPages` | `Math.ceil(total / limit)` or `0` if empty |
| `count` | Number of items in current `data` array |

---

### 3.3 Sections Dropdown

| Property | Value |
|----------|-------|
| **HTTP Method** | `GET` |
| **URL** | `/api/test-configuration/sections/dropdown` |
| **Purpose** | Lightweight list of active sections for select/dropdown UIs |
| **Authentication** | Required |
| **Authorization** | Super Admin only |

**Query parameters:** None

**Filters applied server-side:** `status: 'ACTIVE'` and `isDeleted: false`

**Sort:** `sectionName` ascending

**Success response — `200 OK`**

```json
{
  "success": true,
  "count": 3,
  "data": [
    {
      "_id": "674a1b2c3d4e5f6789012345",
      "sectionId": "SEC-1010",
      "sectionName": "English Comprehension"
    }
  ]
}
```

**Frontend mapping**

| UI role | Field |
|---------|-------|
| **Value** | `_id` |
| **Label** | `sectionName` (optionally prefix with `sectionId`) |

---

### 3.4 Get Section by ID

| Property | Value |
|----------|-------|
| **HTTP Method** | `GET` |
| **URL** | `/api/test-configuration/sections/:id` |
| **Purpose** | Fetch one section by MongoDB `_id` |
| **Authentication** | Required |
| **Authorization** | Super Admin only |

**Path parameters**

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | `string` | Yes | MongoDB ObjectId (`_id`) |

**Success response — `200 OK`**

```json
{
  "success": true,
  "data": {
    "_id": "674a1b2c3d4e5f6789012345",
    "sectionId": "SEC-1010",
    "sectionName": "English Comprehension",
    "status": "ACTIVE",
    "createdAt": "2026-06-27T10:00:00.000Z",
    "updatedAt": "2026-06-27T10:00:00.000Z",
    "createdOn": "2026-06-27",
    "modifiedOn": "2026-06-27"
  }
}
```

**Error:** `404` — `"Section not found"` (invalid id, deleted, or non-existent)

---

### 3.5 Update Section

| Property | Value |
|----------|-------|
| **HTTP Method** | `PUT` |
| **URL** | `/api/test-configuration/sections/:id` |
| **Purpose** | Update sectionName and/or status |
| **Authentication** | Required |
| **Authorization** | Super Admin only |

**Path parameters:** `id` — MongoDB `_id`

**Request body** (at least one field recommended)

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| `sectionName` | `string` | No* | If provided: trimmed, non-empty; unique (case-insensitive) |
| `section_name` | `string` | Alt key | Same as `sectionName` |
| `name` | `string` | Alt key | Same as `sectionName` |
| `status` | `string` | No | `ACTIVE` or `INACTIVE` when provided |

\*On update, `sectionName` is only validated if sent in the body.

**Success response — `200 OK`**

```json
{
  "success": true,
  "message": "Section updated successfully",
  "data": {
    "_id": "674a1b2c3d4e5f6789012345",
    "sectionId": "SEC-1010",
    "sectionName": "Updated Section Name",
    "status": "INACTIVE",
    "createdAt": "2026-06-27T10:00:00.000Z",
    "updatedAt": "2026-06-27T11:30:00.000Z",
    "createdOn": "2026-06-27",
    "modifiedOn": "2026-06-27"
  }
}
```

---

### 3.6 Update Section Status

| Property | Value |
|----------|-------|
| **HTTP Method** | `PATCH` |
| **URL** | `/api/test-configuration/sections/status/:id` |
| **Purpose** | Update status only |
| **Authentication** | Required |
| **Authorization** | Super Admin only |

**Path parameters:** `id` — MongoDB `_id`

**Request body**

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| `status` | `string` | Yes | `ACTIVE` or `INACTIVE` |

**Success response — `200 OK`**

```json
{
  "success": true,
  "message": "Section status updated",
  "data": {
    "_id": "674a1b2c3d4e5f6789012345",
    "sectionId": "SEC-1010",
    "sectionName": "English Comprehension",
    "status": "INACTIVE",
    "createdAt": "2026-06-27T10:00:00.000Z",
    "updatedAt": "2026-06-27T11:30:00.000Z",
    "createdOn": "2026-06-27",
    "modifiedOn": "2026-06-27"
  }
}
```

---

### 3.7 Delete Section

| Property | Value |
|----------|-------|
| **HTTP Method** | `DELETE` |
| **URL** | `/api/test-configuration/sections/:id` |
| **Purpose** | Soft delete section |
| **Authentication** | Required |
| **Authorization** | Super Admin only |

**Path parameters:** `id` — MongoDB `_id`

**Request body:** None

**Soft delete behaviour (server-side):**

- Sets `isDeleted: true`
- Sets `deletedAt` to current timestamp
- Sets `status: 'INACTIVE'`
- Record excluded from all list/detail/dropdown queries

**Success response — `200 OK`**

```json
{
  "success": true,
  "message": "Section deleted successfully",
  "data": {
    "_id": "674a1b2c3d4e5f6789012345",
    "sectionId": "SEC-1010"
  }
}
```

**Error:** `404` — `"Section not found"`

---

## 4. Request Documentation

Complete field reference for all request payloads and query params.

### 4.1 Create — request body

| Field Name | Data Type | Required | Validation Rules | Allowed Values | Default | Description |
|------------|-----------|----------|------------------|----------------|---------|-------------|
| `sectionName` | `string` | Yes* | Trim; non-empty after trim | Any non-empty string | — | Primary section name field |
| `section_name` | `string` | Alt | Same as `sectionName` | — | — | Snake_case alias |
| `name` | `string` | Alt | Same as `sectionName` | — | — | Short alias |
| `status` | `string` | No | Case-insensitive; normalized to uppercase | `ACTIVE`, `INACTIVE` | `ACTIVE` | Record visibility |

\*Backend resolves name from `sectionName` → `section_name` → `name` (first defined wins).

### 4.2 Update — request body

| Field Name | Data Type | Required | Validation Rules | Allowed Values | Default | Description |
|------------|-----------|----------|------------------|----------------|---------|-------------|
| `sectionName` | `string` | No | If sent: trim; must not be empty | Non-empty string | — | Updated name |
| `section_name` | `string` | Alt | Same | — | — | Alias |
| `name` | `string` | Alt | Same | — | — | Alias |
| `status` | `string` | No | Must be valid when provided | `ACTIVE`, `INACTIVE` | — | Updated status |

### 4.3 Status PATCH — request body

| Field Name | Data Type | Required | Validation Rules | Allowed Values | Default | Description |
|------------|-----------|----------|------------------|----------------|---------|-------------|
| `status` | `string` | Yes | Normalized uppercase | `ACTIVE`, `INACTIVE` | — | New status |

### 4.4 List — query parameters

| Field Name | Data Type | Required | Validation Rules | Allowed Values | Default | Description |
|------------|-----------|----------|------------------|----------------|---------|-------------|
| `page` | `number` | No | ≥ 1 | Positive integer | `1` | Page number |
| `limit` | `number` | No | 1–100 | 1–100 | `10` | Page size |
| `search` | `string` | No | Trimmed; regex-escaped partial match | Any string | `""` | Search sectionName or sectionId |
| `status` | `string` | No | Normalized to ACTIVE/INACTIVE | `ACTIVE`, `INACTIVE` | — | Status filter |
| `sortBy` | `string` | No | Must be in allowed list | `createdAt`, `updatedAt`, `sectionName`, `sectionId`, `status` | `createdAt` | Sort field |
| `sortOrder` | `string` | No | | `asc`, `desc` | `desc` | Sort direction |
| `sortPreset` | `string` | No | Must match SORT_PRESETS key | See §3.2 | — | Preset sort |

### 4.5 Path parameters

| Field Name | Data Type | Required | Validation Rules | Description |
|------------|-----------|----------|------------------|-------------|
| `id` | `string` | Yes | MongoDB ObjectId for existing non-deleted record | Used in GET/PUT/PATCH/DELETE by `_id` |

---

## 5. Response Documentation

### 5.1 Success — create (`201`)

```json
{
  "success": true,
  "message": "Section created successfully",
  "data": {
    "_id": "674a1b2c3d4e5f6789012345",
    "sectionId": "SEC-1010",
    "sectionName": "English Comprehension",
    "status": "ACTIVE",
    "createdAt": "2026-06-27T10:00:00.000Z",
    "updatedAt": "2026-06-27T10:00:00.000Z",
    "createdOn": "2026-06-27",
    "modifiedOn": "2026-06-27"
  }
}
```

### 5.2 Success — list (`200`)

See §3.2.

### 5.3 Success — update / status / delete (`200`)

See §3.5, §3.6, §3.7.

### 5.4 Validation error (`400`)

```json
{ "success": false, "message": "sectionName is required" }
```

```json
{ "success": false, "message": "sectionName cannot be empty" }
```

```json
{ "success": false, "message": "Status must be ACTIVE or INACTIVE" }
```

### 5.5 Unauthorized (`401`)

From `protect` middleware (may include `statusCode`):

```json
{ "success": false, "statusCode": 11001, "message": "Not authorized, no token", "data": null, "error": null }
```

Other messages: `"Not authorized, token failed"`, `"Not authorized, admin not found"`, `"User not found"`, `"Not authenticated"`.

### 5.6 Forbidden (`403`)

```json
{ "success": false, "message": "Access denied. Super Admin only." }
```

Account issues: `"Account is disabled"`, `"Account is deactivated"`.

### 5.7 Conflict / duplicate (`409`)

```json
{ "success": false, "message": "Section name already exists" }
```

### 5.8 Not found (`404`)

```json
{ "success": false, "message": "Section not found" }
```

### 5.9 Internal server error (`500`)

```json
{ "success": false, "message": "Server error", "error": "<error details>" }
```

> Section Management controller uses direct `res.status().json()` — responses typically include `success`, `message`, and optionally `error`. They do **not** always include `statusCode` (unlike some auth middleware responses).

---

## 6. Frontend Integration Flow

Step-by-step integration using actual backend APIs:

```
Open Section Management Page
        ↓
Authenticate User (Bearer token from login)
        ↓
Verify Super Admin role (client-side route guard)
        ↓
Load Section List
  GET /api/test-configuration/sections?page=1&limit=10
        ↓
Render Table
  Columns: sectionId, sectionName, status, createdOn, modifiedOn, actions
        ↓
Apply Search (debounced)
  GET ...?search=<term>
  (matches sectionName OR sectionId)
        ↓
Apply Status Filter
  GET ...?status=ACTIVE|INACTIVE
        ↓
Apply Sorting
  GET ...?sortPreset=sectionName_az
  OR ...?sortBy=sectionName&sortOrder=asc
        ↓
Pagination
  GET ...?page=2&limit=10
        ↓
Create Section
  POST /api/test-configuration/sections
  Body: { sectionName, status? }
        ↓
Edit Section
  Option A: use row data directly
  Option B: GET /api/test-configuration/sections/:id
  PUT /api/test-configuration/sections/:id
        ↓
Status Change (toggle)
  PATCH /api/test-configuration/sections/status/:id
  Body: { status: "ACTIVE" | "INACTIVE" }
        ↓
Delete Section
  DELETE /api/test-configuration/sections/:id
        ↓
Refresh Cached Data
  Invalidate TanStack Query keys (lists + dropdown)
        ↓
Update UI
  Toast success/error; close modals; refresh table
```

**Dropdown flow (when this module's data is needed elsewhere):**

```
Other page needs section picker
        ↓
GET /api/test-configuration/sections/dropdown
        ↓
Map data[] → { value: _id, label: sectionName }
```

---

## 7. ASCII Flow Chart

```
┌─────────────┐
│  Frontend   │  Section Management Page (React + Vite)
│  (React UI) │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ React Query │  useTestConfigSections, useCreateSection, …
│   (hooks)   │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   Service   │  testConfigSectionService.ts
│    Layer    │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│    Axios    │  api.ts — baseURL, Bearer token, interceptors
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  REST API   │  /api/test-configuration/sections/*
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ Middleware  │  protect → requireSuperAdmin
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ Controller  │  testConfigSectionController.js
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   Helpers   │  testConfigurationHelpers, contentMastersHelpers
└──────┬──────┘
       │
       ▼
┌─────────────┐
│    Model    │  TestConfigSection (Mongoose)
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  MongoDB    │  testconfigsections collection
└──────┬──────┘
       │
       │  (response travels back up the stack)
       ▼
┌─────────────┐
│  Frontend   │  Table / toast / modal update
└─────────────┘
```

---

## 8. React + Vite Enterprise Architecture (2026)

Recommended frontend structure (no backend changes):

```
src/
├── services/
│   ├── api.ts                          # Shared Axios instance
│   └── testConfigSectionService.ts     # Section Management HTTP calls
├── hooks/
│   └── useTestConfigSections.ts        # TanStack Query hooks
├── providers/
│   └── QueryProvider.tsx               # QueryClientProvider wrapper
├── utils/
│   └── errorHandler.ts                 # Map Axios errors → user messages
├── routes/
│   ├── ProtectedRoute.tsx              # Requires authenticated session
│   └── RoleGuard.tsx                   # Super Admin only
├── pages/
│   └── test-management/
│       └── test-configuration/
│           └── SectionManagementPage.tsx
└── components/
    └── common/
        ├── LoadingSpinner.tsx
        ├── PageLoader.tsx
        ├── ErrorState.tsx
        └── EmptyState.tsx
```

### API → frontend mapping

| Backend endpoint | Service method | Hook |
|------------------|----------------|------|
| `GET /sections` | `getSections(params)` | `useTestConfigSections(filters)` |
| `GET /sections/:id` | `getSection(id)` | `useTestConfigSection(id)` |
| `GET /sections/dropdown` | `getSectionsDropdown()` | `useTestConfigSectionsDropdown()` |
| `POST /sections` | `createSection(payload)` | `useCreateSection()` |
| `PUT /sections/:id` | `updateSection(id, payload)` | `useUpdateSection()` |
| `PATCH /sections/status/:id` | `updateSectionStatus(id, status)` | `useUpdateSectionStatus()` |
| `DELETE /sections/:id` | `deleteSection(id)` | `useDeleteSection()` |

---

## 9. Centralized API Layer

### `services/api.ts`

Shared Axios instance used by all modules. See [§10 Axios Configuration](#10-axios-configuration).

### `services/testConfigSectionService.ts`

```typescript
import api from './api';

const BASE = '/api/test-configuration/sections';

export type SectionStatus = 'ACTIVE' | 'INACTIVE';

export interface TestConfigSectionListParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: SectionStatus;
  sortBy?: 'createdAt' | 'updatedAt' | 'sectionName' | 'sectionId' | 'status';
  sortOrder?: 'asc' | 'desc';
  sortPreset?:
    | 'createdOn_newest'
    | 'createdOn_oldest'
    | 'modifiedOn_newest'
    | 'modifiedOn_oldest'
    | 'sectionName_az'
    | 'sectionName_za';
}

export interface CreateSectionPayload {
  sectionName: string;
  status?: SectionStatus;
}

export interface UpdateSectionPayload {
  sectionName?: string;
  status?: SectionStatus;
}

export interface TestConfigSection {
  _id: string;
  sectionId: string;
  sectionName: string;
  status: SectionStatus;
  createdAt: string;
  updatedAt: string;
  createdOn: string;
  modifiedOn: string;
}

export interface SectionDropdownItem {
  _id: string;
  sectionId: string;
  sectionName: string;
}

export interface PaginatedSectionsResponse {
  success: true;
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  count: number;
  data: TestConfigSection[];
}

// --- API methods ---

export const getSections = (params: TestConfigSectionListParams = {}) =>
  api.get<PaginatedSectionsResponse>(BASE, { params });

export const getSection = (id: string) =>
  api.get<{ success: true; data: TestConfigSection }>(`${BASE}/${id}`);

export const getSectionsDropdown = () =>
  api.get<{ success: true; count: number; data: SectionDropdownItem[] }>(
    `${BASE}/dropdown`
  );

export const createSection = (payload: CreateSectionPayload) =>
  api.post<{ success: true; message: string; data: TestConfigSection }>(
    BASE,
    payload
  );

export const updateSection = (id: string, payload: UpdateSectionPayload) =>
  api.put<{ success: true; message: string; data: TestConfigSection }>(
    `${BASE}/${id}`,
    payload
  );

export const updateSectionStatus = (id: string, status: SectionStatus) =>
  api.patch<{ success: true; message: string; data: TestConfigSection }>(
    `${BASE}/status/${id}`,
    { status }
  );

export const deleteSection = (id: string) =>
  api.delete<{ success: true; message: string; data: { _id: string; sectionId: string } }>(
    `${BASE}/${id}`
  );
```

**Not available (do not implement):**

- `postSectionsDropdown()` — no POST route exists
- `restoreSection()`, `bulkDeleteSections()`, `bulkStatusUpdate()`
- `exportSections()` / `importSections()`

---

## 10. Axios Configuration

```typescript
// services/api.ts
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: Number(import.meta.env.VITE_API_TIMEOUT) || 30_000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken'); // or your auth store
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  if (import.meta.env.VITE_ENABLE_API_LOGS === 'true') {
    console.debug('[API]', config.method?.toUpperCase(), config.url, config.params ?? config.data);
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const message = error.response?.data?.message;

    if (status === 401) {
      // Clear token + redirect to login
    }
    if (status === 403) {
      // Show forbidden — do not retry
    }

    return Promise.reject(error);
  }
);

export default api;
```

| Setting | Value |
|---------|-------|
| **Base URL** | `import.meta.env.VITE_API_BASE_URL` (e.g. `http://localhost:5000`) |
| **Timeout** | Configurable via env; recommend 30s default |
| **Authorization** | `Bearer <JWT>` on every Section Management request |
| **Content-Type** | `application/json` for POST/PUT/PATCH |

Backend does **not** require custom headers beyond standard Bearer auth.

---

## 11. Environment Variables

```env
# Required
VITE_API_BASE_URL=http://localhost:5000

# Recommended
VITE_API_TIMEOUT=30000

# Optional — dev debugging
VITE_ENABLE_API_LOGS=false
```

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_API_BASE_URL` | Yes | Backend origin (no trailing slash) |
| `VITE_API_TIMEOUT` | No | Axios timeout in ms |
| `VITE_ENABLE_API_LOGS` | No | Log requests in dev console |

---

## 12. React Query Integration

### Query keys

```typescript
export const testConfigSectionKeys = {
  all: ['testConfigSections'] as const,
  lists: () => [...testConfigSectionKeys.all, 'list'] as const,
  list: (filters: TestConfigSectionListParams) =>
    [...testConfigSectionKeys.lists(), filters] as const,
  details: () => [...testConfigSectionKeys.all, 'detail'] as const,
  detail: (id: string) => [...testConfigSectionKeys.details(), id] as const,
  dropdown: () => [...testConfigSectionKeys.all, 'dropdown'] as const,
};
```

### useQuery — list

```typescript
export function useTestConfigSections(filters: TestConfigSectionListParams) {
  return useQuery({
    queryKey: testConfigSectionKeys.list(filters),
    queryFn: () => getSections(filters).then((r) => r.data),
    placeholderData: (prev) => prev,
    staleTime: 30_000,
  });
}
```

### useQuery — detail

```typescript
export function useTestConfigSection(id: string, enabled = true) {
  return useQuery({
    queryKey: testConfigSectionKeys.detail(id),
    queryFn: () => getSection(id).then((r) => r.data.data),
    enabled: Boolean(id) && enabled,
  });
}
```

### useQuery — dropdown

```typescript
export function useTestConfigSectionsDropdown() {
  return useQuery({
    queryKey: testConfigSectionKeys.dropdown(),
    queryFn: () => getSectionsDropdown().then((r) => r.data.data),
    staleTime: 5 * 60 * 1000,
  });
}
```

### useMutation examples

```typescript
export function useCreateSection() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateSectionPayload) =>
      createSection(payload).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: testConfigSectionKeys.lists() });
      qc.invalidateQueries({ queryKey: testConfigSectionKeys.dropdown() });
    },
  });
}

export function useUpdateSectionStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: SectionStatus }) =>
      updateSectionStatus(id, status).then((r) => r.data),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: testConfigSectionKeys.lists() });
      qc.invalidateQueries({ queryKey: testConfigSectionKeys.detail(id) });
      qc.invalidateQueries({ queryKey: testConfigSectionKeys.dropdown() });
    },
  });
}
```

### Cache strategy

| Query | staleTime | Notes |
|-------|-----------|-------|
| List | 30s | Include filters in query key |
| Detail | 60s | Invalidate on update/delete |
| Dropdown | 5 min | Invalidate on any CRUD mutation |

### Invalidation matrix

| Mutation | Invalidate |
|----------|------------|
| Create | `lists()`, `dropdown()` |
| Update | `lists()`, `detail(id)`, `dropdown()` |
| Status change | `lists()`, `detail(id)`, `dropdown()` |
| Delete | `lists()`, `dropdown()` |

### Retry strategy

- **Queries:** retry 1–2 times; **do not** retry on 400, 401, 403, 404, 409.
- **Mutations:** `retry: false`.

### Optimistic updates

Optional for status toggle — snapshot list cache, update row status, rollback on error.

### Refetch strategy

- Refetch list on window focus if `staleTime` elapsed.
- Use `placeholderData: (prev) => prev` for smooth pagination/filter transitions.

---

## 13. CRUD Integration Guide

### Create

1. Open create modal with empty form.
2. Client validation: `sectionName` required (trim, non-empty).
3. `POST /api/test-configuration/sections` with `{ sectionName, status?: 'ACTIVE' | 'INACTIVE' }`.
4. On `201`: toast `message`, invalidate queries, close modal.
5. On `409`: show "Section name already exists" inline on name field.

### Read (list)

1. `GET /api/test-configuration/sections` with query params.
2. Bind `data` to table; use `total`, `page`, `limit`, `totalPages` for pagination UI.
3. Display `createdOn` / `modifiedOn` for date columns (pre-formatted `YYYY-MM-DD`).

### Read (single)

1. `GET /api/test-configuration/sections/:id` when edit drawer needs fresh data.
2. Alternatively use row object from list (same shape).

### Update

1. Populate form from row or detail query.
2. `PUT /api/test-configuration/sections/:id` with changed fields only or full object.
3. On `200`: toast, invalidate, close modal.

### Delete

1. Confirm dialog with `sectionName`.
2. `DELETE /api/test-configuration/sections/:id`.
3. On `200`: toast, invalidate list + dropdown.
4. Record will no longer appear in list (soft deleted).

### Search

- Debounce input (~300ms).
- Pass `search` query param.
- Matches partial `sectionName` or `sectionId` (case-insensitive).

### Filters

- Status dropdown: `ACTIVE`, `INACTIVE`, or "All" (omit param).
- Only non-deleted records are ever returned.

### Pagination

- Default `page=1`, `limit=10`.
- Allow user to change limit (max 100 per backend).
- Reset to page 1 when search/filter changes.

### Sorting

- UI sort presets map directly to `sortPreset` query param.
- Or use `sortBy` + `sortOrder` for custom column headers.

### Status update

- Prefer dedicated `PATCH /sections/status/:id` for toggle switches.
- Status values: `ACTIVE` (UI: "Active"), `INACTIVE` (UI: "Inactive").

### Bulk operations

**Not supported.** Do not implement bulk delete or bulk status.

### Export / Import

**Not supported.**

---

## 14. Validation Rules

All rules enforced by backend (controller + model):

| Rule | Endpoint | HTTP | Message |
|------|----------|------|---------|
| `sectionName` required on create | POST | 400 | `sectionName is required` |
| `sectionName` non-empty on update | PUT | 400 | `sectionName cannot be empty` |
| `status` must be ACTIVE or INACTIVE when provided | POST, PUT, PATCH | 400 | `Status must be ACTIVE or INACTIVE` |
| Duplicate section name (case-insensitive) | POST, PUT | 409 | `Section name already exists` |
| Record must exist and not be deleted | GET/:id, PUT, PATCH, DELETE | 404 | `Section not found` |
| Default status on create | POST | — | `ACTIVE` when omitted |
| `sectionName` trimmed | All writes | — | Mongoose `trim: true` on model |
| No max length on `sectionName` | — | — | **Not enforced in controller** (only DB practical limits) |
| List excludes deleted | GET list | — | `isDeleted: false` filter always applied |
| Dropdown active only | GET dropdown | — | `status: 'ACTIVE'` + not deleted |
| Pagination bounds | GET list | — | `page` ≥ 1; `limit` 1–100 |
| Invalid sort field | GET list | — | Falls back to `createdAt` |

**Status normalization:** Backend accepts any case (`active`, `Active`, `ACTIVE`) and stores uppercase.

---

## 15. Authentication & Authorization

### JWT usage

Obtain Super Admin JWT via your existing login flow:

```http
POST /api/auth/login-super-admin
Content-Type: application/json

{
  "email": "admin@sriram.com",
  "password": "<password>"
}
```

Use returned token as:

```http
Authorization: Bearer <token>
```

### Authorization header

Required on **every** Section Management request. Missing token → `401`.

### Required roles

| Auth type | Role check |
|-----------|------------|
| Legacy `User` | `user.role === 'super_admin'` → treated as `SUPER_ADMIN` |
| `AdminAccess` | `roleId.roleCode === 'SUPER_ADMIN'` |

Any other role → `403` — `"Access denied. Super Admin only."`

### Middleware chain

```
Request
  → protect (authMiddleware.js)
      Validates Bearer JWT
      Sets req.user OR req.adminAccess
  → requireSuperAdmin (requireSuperAdmin.js)
      Calls isSuperAdminRequest(req)
  → testConfigSectionController handler
```

### Permission checks

Section Management does **not** use `PermissionMatrix` / `hasFeaturePermission`. Access is binary Super Admin only via `requireSuperAdmin`.

### Frontend guards

```tsx
// RoleGuard — allow only Super Admin
<RoleGuard allowedRoles={['SUPER_ADMIN']}>
  <SectionManagementPage />
</RoleGuard>
```

Align client-side role check with `getRoleCodeFromRequest` logic.

---

## 16. Error Handling Guide

| HTTP | Scenario | Backend message (examples) | Frontend action |
|------|----------|--------------------------|-----------------|
| 400 | Validation | `sectionName is required`, `Status must be ACTIVE or INACTIVE` | Inline field errors / toast |
| 401 | No/invalid token | `Not authorized, no token`, `Not authorized, token failed` | Redirect to login |
| 403 | Not Super Admin | `Access denied. Super Admin only.` | Forbidden page |
| 403 | Account disabled | `Account is disabled`, `Account is deactivated` | Logout + message |
| 404 | Not found | `Section not found` | Toast + navigate to list |
| 409 | Duplicate name | `Section name already exists` | Highlight sectionName field |
| 500 | Server error | `Server error` | Generic toast; log `error` in dev |
| Network | No response | — | "Network error" toast; retry option |

### Recommended `errorHandler.ts`

```typescript
import { AxiosError } from 'axios';

export function getApiErrorMessage(error: unknown): string {
  if (error instanceof AxiosError) {
    if (!error.response) return 'Network error. Please check your connection.';
    return error.response.data?.message ?? 'Something went wrong';
  }
  return 'Something went wrong';
}
```

Preserve backend messages — do not override with generic text when `message` is present.

---

## 17. Sequence Diagram

### Create section

```
Frontend          React Query       Service           Axios            Controller         MongoDB
   │                  │                │                 │                  │                │
   │── submit form ──►│                │                 │                  │                │
   │                  │── mutate ─────►│                 │                  │                │
   │                  │                │── POST /sections│                  │                │
   │                  │                │                 │── JSON body ────►│                │
   │                  │                │                 │                  │── validate ───►│
   │                  │                │                 │                  │── create doc ─►│
   │                  │                │                 │                  │◄── saved ──────│
   │                  │                │                 │◄── 201 + data ───│                │
   │                  │◄── invalidate ─│                 │                  │                │
   │◄── toast + refresh│                │                 │                  │                │
```

### List with search and pagination

```
Frontend → useTestConfigSections({ search, page, limit, status, sortPreset })
         → getSections(params)
         → GET /api/test-configuration/sections?...
         → buildListQuery + parsePagination + parseTestConfigSort
         → TestConfigSection.find().sort().skip().limit()
         → 200 { total, page, limit, totalPages, count, data }
         → React Query cache → Table render
```

---

## 18. API Dependency Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    Section Management                        │
│              /api/test-configuration/sections/*              │
└───────────────────────────┬─────────────────────────────────┘
                            │
         ┌──────────────────┼──────────────────┐
         │                  │                  │
         ▼                  ▼                  ▼
┌────────────────┐ ┌────────────────┐ ┌────────────────────┐
│ Authentication │ │ Shared Helpers │ │ ID Generator       │
│ POST /api/auth │ │ testConfig     │ │ generateTestConfig │
│ /login-super-  │ │ Helpers.js     │ │ SectionId()        │
│ admin          │ │ contentMasters │ │ contentIdGenerator │
│                │ │ Helpers.js     │ │ .js                │
└────────────────┘ └────────────────┘ └────────────────────┘
         │
         ▼
┌────────────────┐
│ Middleware     │
│ protect        │
│ requireSuper   │
│ Admin          │
└────────────────┘

Shared APIs used by Section Management page:
  ✅ POST /api/auth/login-super-admin  (obtain JWT)

Shared APIs NOT required by Section Management admin page:
  ❌ Exam Pattern dropdown
  ❌ Language Settings dropdown
  ❌ Marking Rules
  ❌ Subjects, Courses, Centers, etc.

Section dropdown (this module provides):
  GET /api/test-configuration/sections/dropdown
  → For future consumers; not required on the Section Management list page itself

Sibling modules (same router, same auth):
  /api/test-configuration/exam-patterns/*
  /api/test-configuration/languages/*
  /api/test-configuration/marking-rules/*
```

---

## 19. Frontend Integration Checklist

```
☐ VITE_API_BASE_URL configured
☐ Axios instance created with Bearer interceptor
☐ Super Admin login integrated (POST /api/auth/login-super-admin)
☐ ProtectedRoute + RoleGuard (SUPER_ADMIN) on Section Management route
☐ testConfigSectionService.ts created with all 7 endpoints
☐ TanStack Query provider configured
☐ useTestConfigSections hook (list with filters in query key)
☐ useTestConfigSection hook (detail)
☐ useTestConfigSectionsDropdown hook (if needed)
☐ Create mutation + form validation (sectionName required)
☐ Update mutation (PUT)
☐ Status toggle mutation (PATCH /status/:id)
☐ Delete mutation with confirmation dialog
☐ Search debounced → search query param
☐ Status filter → status query param
☐ Pagination → page + limit params (max limit 100)
☐ Sort presets wired (sectionName_az, sectionName_za, createdOn_*, modifiedOn_*)
☐ Table columns: sectionId, sectionName, status, createdOn, modifiedOn
☐ Error handling via response.data.message
☐ 401 → redirect login; 403 → forbidden; 409 → duplicate name UI
☐ Cache invalidation on all mutations (lists + dropdown)
☐ Loading / empty / error states (LoadingSpinner, EmptyState, ErrorState)
☐ Do NOT implement bulk/export/import (not supported)
☐ Use _id for API path :id (not sectionId)
☐ API manually tested against backend
☐ UI tested end-to-end
```

---

## 20. Enterprise Safety Checklist

Verification that this document reflects the backend **without modification**:

| Item | Status |
|------|--------|
| Backend code unchanged | ✅ Documentation only |
| API routes unchanged | ✅ 7 endpoints as registered in `testConfigurationRoutes.js` |
| HTTP methods unchanged | ✅ POST, GET, PUT, PATCH, DELETE as implemented |
| Request payloads unchanged | ✅ `sectionName` / aliases, `status` only |
| Response structures unchanged | ✅ `formatSection()` shape documented |
| Authentication unchanged | ✅ JWT Bearer via `protect` |
| Authorization unchanged | ✅ Super Admin via `requireSuperAdmin` |
| Validation unchanged | ✅ Inline controller rules documented |
| Business logic unchanged | ✅ Soft delete, duplicate check, search/filter/sort |
| Database schema unchanged | ✅ `TestConfigSection` model fields documented |
| Existing functionality preserved | ✅ No backend edits made |
| Frontend can integrate with confidence | ✅ All behaviour sourced from implementation |

---

## Appendix A — Complete Field Mapping

| Frontend Field | Backend Field | Type | Required (create) | Validation | Example | Display | API Key |
|----------------|---------------|------|-------------------|------------|---------|---------|---------|
| Record ID | `_id` | ObjectId string | Auto | MongoDB id | `674a1b2c...` | Hidden / actions | `_id` |
| Section ID | `sectionId` | string | Auto | Unique `SEC-` + 4 digits | `SEC-1010` | Table "ID" | `sectionId` |
| Section Name | `sectionName` | string | Yes | Trim; unique CI | `English Comprehension` | Input / table | `sectionName` |
| Status | `status` | enum | No | ACTIVE \| INACTIVE | `ACTIVE` | Badge | `status` |
| Created At | `createdAt` | ISO date | Auto | — | `2026-06-27T10:00:00.000Z` | Optional | `createdAt` |
| Updated At | `updatedAt` | ISO date | Auto | — | `2026-06-27T11:30:00.000Z` | Optional | `updatedAt` |
| Created On | `createdOn` | string | Auto | YYYY-MM-DD | `2026-06-27` | Table column | `createdOn` |
| Modified On | `modifiedOn` | string | Auto | YYYY-MM-DD | `2026-06-27` | Table column | `modifiedOn` |

**Request body aliases (create/update):** `section_name`, `name` → resolved to `sectionName`

**Not exposed in API responses:** `isDeleted`, `deletedAt`

---

## Appendix B — Status Values

| Backend value | UI label | In list filter | In dropdown |
|---------------|----------|----------------|-------------|
| `ACTIVE` | Active | Yes | Included |
| `INACTIVE` | Inactive | Yes | Excluded |

---

## Appendix C — Related Documentation

| Document | Purpose |
|----------|---------|
| `TEST_CONFIGURATION_API_GUIDE.md` | Backend API overview for all Test Configuration sub-modules |
| `TEST_CONFIGURATION_POSTMAN_COLLECTION.json` | Postman requests for manual testing |
| `docs/TEST_MANAGEMENT_EXAM_PATTERN_FRONTEND_INTEGRATION_README.md` | Sibling module integration guide (same auth/patterns) |

---

*Generated from backend source: `testConfigSectionController.js`, `TestConfigSection.js`, `testConfigurationRoutes.js`, `testConfigurationHelpers.js`, `contentMastersHelpers.js`, `contentIdGenerator.js`, `authMiddleware.js`, `requireSuperAdmin.js`. Backend unchanged.*
