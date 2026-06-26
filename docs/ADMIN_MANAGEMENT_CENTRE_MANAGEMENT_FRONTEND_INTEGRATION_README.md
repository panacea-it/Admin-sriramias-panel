# CENTRE MANAGEMENT FRONTEND INTEGRATION README

**Single source of truth** for integrating the **Admin Management → Centre Management** screen with a React + Vite frontend.

Every endpoint, payload, enum, validation rule, and response shape in this document is extracted from the backend implementation. Nothing is invented.

**Source files verified:**

| Layer | Path |
|-------|------|
| Routes | `routes/centerManagementRoutes.js`, `routes/adminRoutes.js`, `app.js` (dropdown alias) |
| Controller | `controllers/centerManagementController.js` |
| Model | `models/Center.js` |
| Helpers | `utils/centerHelpers.js`, `utils/centerEnums.js` |
| Validation | `middleware/validation.js` |
| Auth / RBAC | `middleware/authMiddleware.js`, `middleware/roleMiddleware.js`, `middleware/requireStaffAdmin.js` |
| Audit | `services/auditLogService.js`, `utils/auditLogConstants.js` |
| Mount | `app.js` → `app.use('/api/admin', adminRoutes)` → `router.use('/centers', centerManagementRoutes)` |

**Base URL:** `import.meta.env.VITE_API_BASE_URL` (e.g. `http://localhost:5000`)  
**API prefix:** `/api/admin/centers`  
**Dropdown alias:** `GET /api/centers/dropdown` (same handler as admin dropdown)

> **Important distinction:** Operational centre CRUD (`Center` model) at `/api/admin/centers` is separate from **website CenterData** (`CenterData` model) at `/api/centers/:id` (gallery, faculty, success stories). Do not use CenterData APIs for admin Centre Management.

---

## 1. MODULE OVERVIEW

### Purpose

**Centre Management** governs **operational centre records** stored in the MongoDB `centers` collection (`Center` model). These centres are used across the platform for:

- Assigning staff admins (`AdminAccess.centerId`, legacy `User.center`)
- Scoping courses (`Course.center`)
- Student signup centre selection (public `GET /api/centers/signup`)
- CRM and operational workflows

The admin panel Centre Management screen provides full CRUD, status toggling, bulk status updates, search, filtering, pagination, and sorting for Super Admins.

### Business Flow

```
Super Admin logs in (legacy User.role === 'super_admin')
        │
        ▼
GET /api/admin/centers/states ──► Populate state dropdown (enum-backed)
        │
        ▼
GET /api/admin/centers ──► List / search / filter / paginate centres
        │
        ├── POST /api/admin/centers ──► Create centre
        │         │
        │         └── (Optional) POST /api/admin/create-center-admin ──► Assign legacy center_admin user
        │
        ├── GET /api/admin/centers/:id ──► View centre detail
        ├── PUT /api/admin/centers/:id ──► Update centre fields
        ├── PATCH /api/admin/centers/:id/status ──► Enable / disable single centre
        ├── PATCH /api/admin/centers/bulk-status ──► Bulk enable / disable
        └── DELETE /api/admin/centers/:id ──► Hard delete (blocked if active courses linked)
                │
                ▼
Audit log written (non-blocking) for CREATE / UPDATE / DELETE / STATUS_CHANGE
```

### User Flow (Frontend)

1. Super Admin opens **Centre Management** page.
2. **States dropdown** loads via `GET /api/admin/centers/states` (create/edit forms).
3. **Table** loads via `GET /api/admin/centers` with `search`, `status`, `page`, `limit`, `sortBy`, `sortOrder`.
4. **Create:** form submits required fields → `POST /api/admin/centers` → navigate to detail or refresh list.
5. **View:** row click or view action → `GET /api/admin/centers/:id`.
6. **Edit:** form pre-filled from detail → `PUT /api/admin/centers/:id`.
7. **Toggle status:** row action or switch → `PATCH /api/admin/centers/:id/status`.
8. **Bulk enable/disable:** checkbox selection → `PATCH /api/admin/centers/bulk-status`.
9. **Delete:** confirm dialog → `DELETE /api/admin/centers/:id` (permanent; fails if active courses exist).

### Permission Flow

| Actor | Access |
|-------|--------|
| **Super Admin** (`User` with `role: 'super_admin'`) | Full CRUD on `/api/admin/centers/*` except dropdown. Login via `POST /api/auth/login-super-admin` or `POST /api/auth/login-admin`. |
| **AdminAccess JWT** (`authType: 'admin_access'`) | **Blocked** from CRUD endpoints. `allowRoles(ROLES.SUPER_ADMIN)` returns **403** when `req.adminAccess` is set without `req.user`. |
| **Staff Admin** (any authenticated `req.user` OR `req.adminAccess` via `requireStaffAdmin`) | **Dropdown only:** `GET /api/admin/centers/dropdown` and `GET /api/centers/dropdown`. |
| **Center Admin / Employee / Student** | **Blocked** from Centre Management CRUD — 403 insufficient permissions. |

Centre Management CRUD uses **role-based middleware only** (`allowRoles(ROLES.SUPER_ADMIN)`). There is **no** `checkPermission` middleware on these routes.

### Authentication Chain

All `/api/admin/*` routes run `protect` (`routes/adminRoutes.js` line 27) before centre routes.

```
Request
  │
  ▼
protect (Bearer JWT required)
  │
  ├── super_admin CRUD routes → allowRoles(ROLES.SUPER_ADMIN)
  └── dropdown routes → requireStaffAdmin
```

**Obtain Super Admin token:**

| Endpoint | Body |
|----------|------|
| `POST /api/auth/login-super-admin` | `{ "email": "...", "password": "..." }` |
| `POST /api/auth/login-admin` | `{ "email": "...", "password": "..." }` |

### Related Endpoints (Outside Centre CRUD)

| Endpoint | Purpose |
|----------|---------|
| `POST /api/admin/create-center-admin` | Creates legacy `User` with `role: 'center_admin'` and sets `Center.centerAdmin`. Requires existing `centerId`. |
| `GET /api/admin/user-centers` | User Management dropdown — **not** used by Centre Management forms. |
| `GET /api/centers/signup` | Public student signup centres — **not** admin Centre Management. |
| `GET /api/centers` (public) | Active centres list for website — **not** admin paginated list. |

### Features NOT in Backend (Centre Management)

| Feature | Status |
|---------|--------|
| Soft delete | NOT AVAILABLE — hard delete only |
| File upload (logo, images, documents) | NOT AVAILABLE IN BACKEND |
| Cities dropdown API | NOT AVAILABLE — `city` is free-text |
| Countries dropdown | NOT AVAILABLE IN BACKEND |
| Center types enum / dropdown | NOT AVAILABLE IN BACKEND |
| Managers / Counselors / Mentors assignment in centre CRUD | NOT AVAILABLE — `centerAdmin` exists on model but is **not** exposed in create/update APIs |
| State filter on list API | NOT AVAILABLE — only `status` filter |
| Export (CSV/Excel) | NOT AVAILABLE IN BACKEND |
| HTTP 409 for duplicates | NOT USED — duplicates return **400** |

---

## 2. COMPLETE API INVENTORY

**Common headers (all endpoints):**

| Header | Value | Required |
|--------|-------|----------|
| `Authorization` | `Bearer <token>` | Yes |
| `Content-Type` | `application/json` | Yes (POST, PUT, PATCH with body) |
| `Accept` | `application/json` | Recommended |

---

### 2.1 GET `/api/admin/centers/states`

| Property | Value |
|----------|-------|
| **METHOD** | `GET` |
| **URL** | `/api/admin/centers/states` |
| **AUTHENTICATION** | `protect` + `allowRoles(ROLES.SUPER_ADMIN)` |
| **PATH PARAMS** | None |
| **QUERY PARAMS** | None |
| **REQUEST BODY** | None |

**Success Response (200):**

```json
{
  "success": true,
  "count": 29,
  "data": [
    { "value": "Andhra Pradesh", "label": "Andhra Pradesh" },
    { "value": "Telangana", "label": "Telangana" }
  ]
}
```

**Error Responses:**

| HTTP | When | Body shape |
|------|------|------------|
| **401** | Missing/invalid token | `{ "success": false, "statusCode": 11001, "message": "Not authorized, no token" }` or `{ "message": "Not authenticated" }` |
| **403** | Non–super-admin or AdminAccess JWT on CRUD | `{ "message": "Access denied. Insufficient permissions.", "required": ["super_admin"], "current": "<role>" }` |
| **500** | Server error | `{ "success": false, "message": "Server error", "error": "<message>" }` |

---

### 2.2 GET `/api/admin/centers/dropdown`

| Property | Value |
|----------|-------|
| **METHOD** | `GET` |
| **URL** | `/api/admin/centers/dropdown` |
| **AUTHENTICATION** | `protect` + `requireStaffAdmin` |
| **PATH PARAMS** | None |
| **QUERY PARAMS** | None |
| **REQUEST BODY** | None |

Returns **ACTIVE centres only**, sorted by `centerName` ascending.

**Success Response (200):**

```json
{
  "success": true,
  "count": 3,
  "data": [
    {
      "_id": "674a1b2c3d4e5f6789012345",
      "centerName": "Hyderabad Main Center",
      "centerCode": "HYD01",
      "city": "Hyderabad",
      "state": "Telangana"
    }
  ]
}
```

**Error Responses:** 401, 403 (deactivated/disabled account), 500 — same patterns as above.

**Alias:** `GET /api/centers/dropdown` — identical handler (`app.js`).

---

### 2.3 GET `/api/admin/centers`

| Property | Value |
|----------|-------|
| **METHOD** | `GET` |
| **URL** | `/api/admin/centers` |
| **AUTHENTICATION** | `protect` + `allowRoles(ROLES.SUPER_ADMIN)` |
| **QUERY PARAMS** | See [Section 3](#3-centre-list-api) |
| **REQUEST BODY** | None |

**Success Response (200):**

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
      "centerName": "Hyderabad Main Center",
      "centerCode": "HYD01",
      "address": "Road No 12, Banjara Hills",
      "city": "Hyderabad",
      "state": "Telangana",
      "contactNumber": "9876543210",
      "email": "hyd@sriramias.com",
      "status": "ACTIVE",
      "createdBy": null,
      "createdAt": "2025-01-15T10:30:00.000Z",
      "updatedAt": "2025-01-15T10:30:00.000Z"
    }
  ]
}
```

**Error Responses:** 401, 403, 500.

---

### 2.4 POST `/api/admin/centers`

| Property | Value |
|----------|-------|
| **METHOD** | `POST` |
| **URL** | `/api/admin/centers` |
| **AUTHENTICATION** | `protect` + `allowRoles(ROLES.SUPER_ADMIN)` |
| **VALIDATION** | `validate(validations.manageCenterCreate)` — Joi; unknown fields stripped |
| **REQUEST BODY** | See [Section 5](#5-create-centre-api) |

**Success Response (201):**

```json
{
  "success": true,
  "message": "Center created successfully",
  "data": { /* formatCenterForAdmin object */ }
}
```

**Error Responses:**

| HTTP | When | Example |
|------|------|---------|
| **400** | Controller pre-checks, duplicates, Mongoose unique index | `{ "success": false, "message": "Center name is required" }` |
| **400** | Duplicate fields | `{ "success": false, "message": "...", "errors": { "centerCode": "..." }, "duplicates": [...] }` |
| **401** | Not authenticated | See above |
| **403** | Insufficient role | See above |
| **422** | Joi validation failure | `{ "success": false, "statusCode": 11005, "message": "Validation failed", "errors": [{ "field": "state", "message": "..." }] }` |
| **500** | Server error | `{ "success": false, "message": "Server error", "error": "..." }` |

**409:** NOT USED for this module.

---

### 2.5 GET `/api/admin/centers/:id`

| Property | Value |
|----------|-------|
| **METHOD** | `GET` |
| **URL** | `/api/admin/centers/:id` |
| **AUTHENTICATION** | `protect` + `allowRoles(ROLES.SUPER_ADMIN)` |
| **PATH PARAMS** | `id` — MongoDB ObjectId string |
| **REQUEST BODY** | None |

**Success Response (200):**

```json
{
  "success": true,
  "data": {
    "_id": "674a1b2c3d4e5f6789012345",
    "centerName": "Hyderabad Main Center",
    "centerCode": "HYD01",
    "address": "Road No 12, Banjara Hills",
    "city": "Hyderabad",
    "state": "Telangana",
    "contactNumber": "9876543210",
    "email": "hyd@sriramias.com",
    "status": "ACTIVE",
    "createdBy": {
      "_id": "674a1b2c3d4e5f6789012340",
      "name": "Super Admin",
      "email": "admin@sriram.com"
    },
    "createdAt": "2025-01-15T10:30:00.000Z",
    "updatedAt": "2025-01-15T10:30:00.000Z"
  }
}
```

> `createdBy` is populated with `name` and `email` on detail fetch only. List endpoint returns `createdBy` as ObjectId or `null` (not populated).

**Error Responses:**

| HTTP | When | Body |
|------|------|------|
| **404** | Centre not found | `{ "success": false, "message": "Center not found" }` |
| **401** | Not authenticated | — |
| **403** | Insufficient role | — |
| **500** | Invalid ObjectId cast or server error | `{ "success": false, "message": "Server error", "error": "..." }` |

---

### 2.6 PUT `/api/admin/centers/:id`

| Property | Value |
|----------|-------|
| **METHOD** | `PUT` |
| **URL** | `/api/admin/centers/:id` |
| **AUTHENTICATION** | `protect` + `allowRoles(ROLES.SUPER_ADMIN)` |
| **VALIDATION** | `validate(validations.manageCenterUpdate)` — at least 1 field required |
| **PATH PARAMS** | `id` — MongoDB ObjectId |
| **REQUEST BODY** | See [Section 6](#6-update-centre-api) |

**Success Response (200):**

```json
{
  "success": true,
  "message": "Center updated successfully",
  "data": { /* formatCenterForAdmin object */ }
}
```

**Error Responses:** 400, 401, 403, 404, 422, 500 — same patterns as create.

---

### 2.7 PATCH `/api/admin/centers/:id/status`

| Property | Value |
|----------|-------|
| **METHOD** | `PATCH` |
| **URL** | `/api/admin/centers/:id/status` |
| **AUTHENTICATION** | `protect` + `allowRoles(ROLES.SUPER_ADMIN)` |
| **VALIDATION** | `validate(validations.manageCenterStatus)` |
| **PATH PARAMS** | `id` — MongoDB ObjectId |
| **REQUEST BODY** | `{ "status": "ACTIVE" | "DISABLED" | "INACTIVE" }` — `INACTIVE` normalized to `DISABLED` |

**Success Response (200):**

```json
{
  "success": true,
  "message": "Center status updated",
  "data": { /* formatCenterForAdmin object */ }
}
```

**Error Responses:**

| HTTP | When |
|------|------|
| **400** | Invalid status (after normalization) |
| **404** | Centre not found |
| **422** | Joi validation (missing/invalid status) |
| **401/403/500** | Standard |

---

### 2.8 PATCH `/api/admin/centers/bulk-status`

| Property | Value |
|----------|-------|
| **METHOD** | `PATCH` |
| **URL** | `/api/admin/centers/bulk-status` |
| **AUTHENTICATION** | `protect` + `allowRoles(ROLES.SUPER_ADMIN)` |
| **VALIDATION** | `validate(validations.manageCenterBulkStatus)` |
| **REQUEST BODY** | `{ "centerIds": string[], "status": "ACTIVE" | "DISABLED" | "INACTIVE" }` |

**Success Response (200):**

```json
{
  "success": true,
  "message": "2 center(s) disabled successfully",
  "status": "DISABLED",
  "requestedCount": 2,
  "matchedCount": 2,
  "updatedCount": 2
}
```

**Error Responses:**

| HTTP | When | Body |
|------|------|------|
| **400** | Invalid status | `{ "success": false, "message": "Status must be ACTIVE or DISABLED" }` |
| **400** | Empty/missing centerIds | `{ "success": false, "message": "centerIds array is required" }` |
| **400** | Invalid ObjectIds | `{ "success": false, "message": "Invalid center id(s) in centerIds", "invalidIds": ["..."] }` |
| **422** | Joi validation | Standard validation error |

> Route is registered **before** `/:id` to avoid path collision.

---

### 2.9 DELETE `/api/admin/centers/:id`

| Property | Value |
|----------|-------|
| **METHOD** | `DELETE` |
| **URL** | `/api/admin/centers/:id` |
| **AUTHENTICATION** | `protect` + `allowRoles(ROLES.SUPER_ADMIN)` |
| **PATH PARAMS** | `id` — MongoDB ObjectId |
| **REQUEST BODY** | None |

**Success Response (200):**

```json
{
  "success": true,
  "message": "Center deleted successfully"
}
```

**Error Responses:**

| HTTP | When | Body |
|------|------|------|
| **400** | Active courses linked | `{ "success": false, "message": "Cannot delete center. 3 active course(s) are linked. Disable the center or reassign courses first." }` |
| **404** | Centre not found | `{ "success": false, "message": "Center not found" }` |
| **401/403/500** | Standard | — |

**Delete type:** **Hard delete** (`Center.findByIdAndDelete`). No soft-delete flag.

---

## 3. CENTRE LIST API

### Endpoint

`GET /api/admin/centers`

### Search Support

| Query Param | Type | Default | Behavior |
|-------------|------|---------|----------|
| `search` | string | `""` | Case-insensitive regex match on `centerName`, legacy `name`, `centerCode`, or `city` |

Implementation: `buildCenterListQuery` in `utils/centerHelpers.js`.

### Filters

| Query Param | Type | Default | Behavior |
|-------------|------|---------|----------|
| `status` | string | omitted | If provided and **not** `"ALL"`, exact match on `status` (`ACTIVE` or `DISABLED`) |

> There is **no** `state`, `city`, or date-range filter on the list API.

### Pagination

| Query Param | Type | Default | Min | Max |
|-------------|------|---------|-----|-----|
| `page` | number | `1` | `1` | — |
| `limit` | number | `10` | `1` | `100` |

Response includes: `total`, `page`, `limit`, `totalPages`, `count` (items in current page).

### Sorting

| Query Param | Type | Default | Allowed values |
|-------------|------|---------|----------------|
| `sortBy` | string | `createdAt` | `createdAt`, `centerName`, `centerCode`, `city`, `status` |
| `sortOrder` | string | `desc` | `asc`, `desc` |

Invalid `sortBy` falls back to `createdAt`.

### Frontend Request Example

```typescript
const params = {
  search: 'hyd',
  status: 'ALL',      // or 'ACTIVE' | 'DISABLED' | omit
  page: 1,
  limit: 10,
  sortBy: 'centerName',
  sortOrder: 'asc',
};

const response = await api.get('/api/admin/centers', { params });
```

### Frontend Response Mapping

```typescript
interface CenterListResponse {
  success: true;
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  count: number;
  data: Center[];
}

// Map to table
const rows = response.data.data;
const pagination = {
  page: response.data.page,
  limit: response.data.limit,
  total: response.data.total,
  totalPages: response.data.totalPages,
};
```

---

## 4. CENTRE DETAILS API

### Endpoint

`GET /api/admin/centers/:id`

### Request

```
GET /api/admin/centers/674a1b2c3d4e5f6789012345
Authorization: Bearer <super_admin_token>
```

### Response

Single `data` object via `formatCenterForAdmin`:

| Field | Type | Notes |
|-------|------|-------|
| `_id` | string | MongoDB ObjectId |
| `centerName` | string | Falls back from legacy `name` |
| `centerCode` | string | Uppercase |
| `address` | string | Default `""` |
| `city` | string | |
| `state` | string | Indian state enum value |
| `contactNumber` | string | Normalized digits (last 10) |
| `email` | string | Lowercase |
| `status` | `"ACTIVE"` \| `"DISABLED"` | Default `ACTIVE` |
| `createdBy` | object \| null | Populated: `{ _id, name, email }` |
| `createdAt` | ISO date string | |
| `updatedAt` | ISO date string | |

> `centerAdmin` exists on the MongoDB model but is **not** included in API responses.

### Frontend Mapping

```typescript
interface Center {
  _id: string;
  centerName: string;
  centerCode: string;
  address: string;
  city: string;
  state: string;
  contactNumber: string;
  email: string;
  status: 'ACTIVE' | 'DISABLED';
  createdBy: { _id: string; name: string; email: string } | string | null;
  createdAt: string;
  updatedAt: string;
}

// View form — display createdBy when populated
const creatorName =
  typeof center.createdBy === 'object' && center.createdBy
    ? center.createdBy.name
    : '—';
```

---

## 5. CREATE CENTRE API

### Endpoint

`POST /api/admin/centers`

### Exact Payload

```json
{
  "centerName": "Hyderabad Main Center",
  "centerCode": "HYD01",
  "address": "Road No 12, Banjara Hills",
  "city": "Hyderabad",
  "state": "Telangana",
  "contactNumber": "9876543210",
  "email": "hyd@sriramias.com",
  "status": "ACTIVE"
}
```

### Required Fields

| Field | Joi | Controller |
|-------|-----|------------|
| `centerName` | min 2, max 150, required | trim; empty → 400 |
| `centerCode` | min 2, max 20, required | uppercased; empty → 400 |
| `city` | min 2, max 100, required | trim; empty → 400 |
| `state` | must be in `INDIAN_STATES`, required | trim; empty → 400 |

### Optional Fields

| Field | Default | Notes |
|-------|---------|-------|
| `address` | `""` | max 500; empty string allowed |
| `contactNumber` | `""` | Indian mobile pattern if provided |
| `email` | `""` | Valid email if provided |
| `status` | `"ACTIVE"` | Only `ACTIVE` or `DISABLED`; any other value → `ACTIVE` |

### Validation Rules

See [Section 10](#10-validation-rules).

### Business Restrictions

1. **Uniqueness** (application-level via `validateCenterUniqueness`):
   - `centerCode` — exact match (case-insensitive via uppercase)
   - `centerName` — case-insensitive exact match
   - `city` — case-insensitive exact match (global, not per-state)
   - `email` — exact match (if non-empty)
   - `contactNumber` — normalized last-10-digit match (if non-empty)

2. **MongoDB unique index** on `centerCode` — duplicate → 400 with `errors` / `duplicates`.

3. **`createdBy`** set automatically to `req.user._id` (not in request body).

4. **`state`** must exactly match one of 29 Indian states from `utils/centerEnums.js` (e.g. `"Delhi"`, not `"New Delhi"`).

### Success Response

HTTP **201** with `data` containing the created centre (`formatCenterForAdmin`).

### Frontend Integration Guide

1. Load states dropdown before showing create form: `GET /api/admin/centers/states`.
2. Uppercase `centerCode` in UI on blur (backend also uppercases).
3. On submit, send only allowed fields; Joi strips unknown keys.
4. On success, use `response.data.data._id` for navigation; **do not** fabricate local IDs.
5. Map duplicate errors from `errors` object and/or `duplicates[]` array to field-level form errors.
6. Show `matchedCenter` from `duplicates[].matchedCenter` in duplicate warning UI if needed.

---

## 6. UPDATE CENTRE API

### Endpoint

`PUT /api/admin/centers/:id`

### Editable Fields

From `pickUpdatableFields` in controller:

| Field | Notes |
|-------|-------|
| `centerName` | Cannot be empty if provided |
| `centerCode` | Uppercased on save |
| `address` | |
| `city` | Trimmed |
| `state` | Must be valid Indian state |
| `contactNumber` | Normalized; empty string clears |
| `email` | Normalized; empty string clears |
| `status` | `ACTIVE` or `DISABLED` only |

### Immutable Fields (via API)

| Field | Reason |
|-------|--------|
| `_id` | Path param only |
| `createdBy` | Set at create time |
| `createdAt` / `updatedAt` | Mongoose timestamps |
| `centerAdmin` | Set only via `POST /api/admin/create-center-admin` |
| `name` (legacy) | Synced from `centerName` in model pre-validate hook |

### Validation Rules

- Joi `manageCenterUpdate`: at least **1** field required; same field rules as create (all optional individually).
- Same duplicate checks as create with `excludeId` for current centre.
- Invalid `status` → 400 `"Status must be ACTIVE or DISABLED"`.

### Success Response

HTTP **200**:

```json
{
  "success": true,
  "message": "Center updated successfully",
  "data": { /* updated centre */ }
}
```

### Frontend Integration Guide

1. Load detail via `GET /api/admin/centers/:id` before edit form.
2. Send only changed fields (partial update supported).
3. After success, replace form state with `response.data.data` (server is source of truth).
4. Invalidate list and detail query caches (TanStack Query).
5. Refetch detail after update to verify persistence.

---

## 7. DELETE CENTRE API

### Type

**Hard delete** — document permanently removed from MongoDB.

### Restrictions

1. **Active courses:** If `Course.countDocuments({ center: center._id, isActive: true }) > 0`, delete is blocked with HTTP **400**.
2. Centre must exist — otherwise **404**.

### Dependencies

| Dependency | Behavior on delete |
|------------|-------------------|
| Active courses (`Course.isActive: true`) | **Blocks delete** |
| Disabled centre | Can still be deleted if no active courses |
| `AdminAccess.centerId` | NOT checked before delete |
| `User.center` | NOT checked before delete |

### Validation

No request body. Path `id` must be valid centre ObjectId.

### Error Scenarios

| Scenario | HTTP | Message |
|----------|------|---------|
| Centre not found | 404 | `Center not found` |
| Active courses exist | 400 | `Cannot delete center. N active course(s) are linked...` |
| Server error | 500 | `Server error` |

### Frontend Integration Guide

1. Show confirmation dialog with warning about permanent deletion.
2. If 400 with course-linked message, suggest disabling centre (`PATCH .../status` with `DISABLED`) instead.
3. On success, remove row from table and invalidate caches.
4. Refetch list to confirm centre no longer appears.

---

## 8. DROPDOWN APIs

### 8.1 Indian States

| Property | Value |
|----------|-------|
| **Endpoint** | `GET /api/admin/centers/states` |
| **Auth** | Super Admin |
| **Used in** | Create / Edit centre forms (`state` select) |

**Response:**

```json
{
  "success": true,
  "count": 29,
  "data": [{ "value": "Maharashtra", "label": "Maharashtra" }]
}
```

**Frontend mapping:**

```typescript
options = data.data.map((s) => ({ value: s.value, label: s.label }));
// Bind to <Select> for state field
```

**Valid values (29 states):** Andhra Pradesh, Arunachal Pradesh, Assam, Bihar, Chhattisgarh, Delhi, Goa, Gujarat, Haryana, Himachal Pradesh, Jharkhand, Karnataka, Kerala, Madhya Pradesh, Maharashtra, Manipur, Meghalaya, Mizoram, Nagaland, Odisha, Punjab, Rajasthan, Sikkim, Tamil Nadu, Telangana, Tripura, Uttar Pradesh, Uttarakhand, West Bengal.

---

### 8.2 Centres Dropdown (Active Only)

| Property | Value |
|----------|-------|
| **Endpoint** | `GET /api/admin/centers/dropdown` or `GET /api/centers/dropdown` |
| **Auth** | Staff Admin (`requireStaffAdmin`) |
| **Used in** | Other admin forms (user assignment, etc.) — not required for Centre Management CRUD screen itself |

**Response item:**

```typescript
{ _id, centerName, centerCode, city, state }
```

**Frontend mapping:**

```typescript
{ value: item._id, label: `${item.centerName} (${item.centerCode})` }
```

---

### 8.3 Status Values (Enum — No Separate API)

| Value | UI Label |
|-------|----------|
| `ACTIVE` | Active |
| `DISABLED` | Disabled |

`INACTIVE` is accepted as input alias for `DISABLED` on status PATCH endpoints only.

---

### NOT AVAILABLE IN BACKEND (Centre Management Dropdowns)

| Dropdown | Status |
|----------|--------|
| Cities | NOT AVAILABLE — use free-text `city` input |
| Countries | NOT AVAILABLE IN BACKEND |
| Center Types | NOT AVAILABLE IN BACKEND |
| Managers | NOT AVAILABLE IN BACKEND |
| Counselors | NOT AVAILABLE IN BACKEND |
| Mentors | NOT AVAILABLE IN BACKEND |
| Regions | NOT AVAILABLE IN BACKEND |

---

## 9. FIELD MAPPING TABLE

| Backend Field | Frontend Field | UI Label | Data Type | Required? |
|---------------|----------------|----------|-----------|-----------|
| `_id` | `id` | Centre ID | string (ObjectId) | Auto (read-only) |
| `centerName` | `centerName` | Centre Name | string | Yes (create) |
| `centerCode` | `centerCode` | Centre Code | string | Yes (create) |
| `address` | `address` | Address | string | No |
| `city` | `city` | City | string | Yes (create) |
| `state` | `state` | State | string (enum) | Yes (create) |
| `contactNumber` | `contactNumber` | Contact Number | string | No |
| `email` | `email` | Email | string | No |
| `status` | `status` | Status | `'ACTIVE' \| 'DISABLED'` | No (default ACTIVE) |
| `createdBy` | `createdBy` | Created By | object \| null | Read-only |
| `createdAt` | `createdAt` | Created At | ISO datetime | Read-only |
| `updatedAt` | `updatedAt` | Updated At | ISO datetime | Read-only |

**Model fields not exposed in API:**

| Model Field | Status |
|-------------|--------|
| `name` (legacy) | Synced from `centerName` — not in API |
| `centerAdmin` | NOT AVAILABLE IN BACKEND (Centre CRUD API) |

---

## 10. VALIDATION RULES

### Joi Schema — Create (`manageCenterCreate`)

| Field | Rules |
|-------|-------|
| `centerName` | string, min 2, max 150, required, trim |
| `centerCode` | string, min 2, max 20, required, trim |
| `address` | string, max 500, allow `""` |
| `city` | string, min 2, max 100, required, trim |
| `state` | must be one of `INDIAN_STATES`, required; message: `State must be a valid Indian state` |
| `contactNumber` | pattern `/^[6-9]\d{9}$/`, allow `""`, `null`, optional |
| `email` | valid email, allow `""`, `null`, optional |
| `status` | `ACTIVE` or `DISABLED`, optional |

Unknown fields: **stripped** (`stripUnknown: true`).

### Joi Schema — Update (`manageCenterUpdate`)

Same field rules as create, but all fields optional; **minimum 1 field** required in body.

### Joi Schema — Status (`manageCenterStatus`)

| Field | Rules |
|-------|-------|
| `status` | `ACTIVE`, `DISABLED`, or `INACTIVE`, required |

### Joi Schema — Bulk Status (`manageCenterBulkStatus`)

| Field | Rules |
|-------|-------|
| `centerIds` | array of 24-char hex strings, min 1, max 100, required |
| `status` | `ACTIVE`, `DISABLED`, or `INACTIVE`, required |

### Controller-Level Rules (beyond Joi)

| Rule | Detail |
|------|--------|
| `centerName` required on create | Empty/whitespace → 400 |
| `centerCode` required on create | Empty/whitespace → 400 |
| `city` and `state` required on create | Empty → 400 |
| `centerName` on update | If provided, cannot be empty after trim |
| `status` on update | Must be `ACTIVE` or `DISABLED` |
| `centerCode` normalization | Uppercased and trimmed |
| `contactNumber` normalization | Strip non-digits; if length ≥ 10, keep last 10 digits |
| `email` normalization | trim + lowercase |
| Uniqueness | `centerCode`, `centerName`, `city`, `email`, `contactNumber` — see Section 5 |

### Mongoose Schema Rules (`models/Center.js`)

| Field | Schema rule |
|-------|-------------|
| `centerName` | required, trim |
| `centerCode` | required, unique, uppercase, trim |
| `city` | required, trim |
| `state` | required, enum `INDIAN_STATES`, trim |
| `status` | enum `['ACTIVE', 'DISABLED']`, default `ACTIVE` |
| `email` | lowercase, trim, default `""` |

### Duplicate Error Messages

| Field | Message |
|-------|---------|
| `centerCode` | `Center code already exists` |
| `centerName` | `Center name already exists` |
| `city` | `City already exists` |
| `contactNumber` | `Contact number already exists` |
| `email` | `Email already exists` |

---

## 11. ERROR HANDLING GUIDE

### HTTP Status Reference

| Code | Used in Centre Management? | Typical cause |
|------|---------------------------|---------------|
| **400** | Yes | Missing required fields, invalid status, duplicates, delete blocked by courses, invalid bulk IDs |
| **401** | Yes | Missing/invalid/expired JWT |
| **403** | Yes | Wrong role, AdminAccess on super-admin route, deactivated account |
| **404** | Yes | Centre not found (get/update/delete/status) |
| **409** | **No** | NOT USED — duplicates return 400 |
| **422** | Yes | Joi validation failure (create/update/status/bulk) |
| **500** | Yes | Unhandled server errors, possible invalid ObjectId cast |

### Response Shapes

**401 (authMiddleware):**

```json
{ "success": false, "statusCode": 11001, "message": "Not authorized, no token" }
```

**401 (roleMiddleware):**

```json
{ "message": "Not authenticated" }
```

**403 (roleMiddleware):**

```json
{
  "message": "Access denied. Insufficient permissions.",
  "required": ["super_admin"],
  "current": "center_admin"
}
```

**422 (Joi):**

```json
{
  "success": false,
  "statusCode": 11005,
  "message": "Validation failed",
  "errors": [
    { "field": "contactNumber", "message": "\"contactNumber\" with value \"123\" fails to match the required pattern" }
  ]
}
```

**400 (duplicates):**

```json
{
  "success": false,
  "message": "Center code already exists",
  "errors": { "centerCode": "Center code already exists" },
  "duplicates": [
    {
      "field": "centerCode",
      "message": "Center code already exists",
      "matchedCenter": {
        "_id": "...",
        "centerName": "...",
        "centerCode": "HYD01",
        "city": "...",
        "state": "...",
        "contactNumber": "...",
        "email": "..."
      }
    }
  ]
}
```

### Frontend Handling Strategy

```typescript
// In mutation onError / global interceptor (src/utils/errorHandler.ts)
const status = error.response?.status;
const data = error.response?.data;

switch (status) {
  case 401:
    // Dispatch auth:unauthorized (already in api.ts interceptor)
    // Redirect to login
    break;
  case 403:
    // Show permission denied toast
    break;
  case 404:
    // Navigate away from detail / show not found
    break;
  case 400:
    // Map data.errors (object) or data.duplicates to form fields
    break;
  case 422:
    // Map data.errors (array of { field, message }) to form fields
    break;
  case 500:
    // Generic server error toast
    break;
}
```

---

## 12. FILE UPLOAD SUPPORT

**NOT AVAILABLE IN BACKEND**

Centre Management has no image, logo, document, or PDF upload endpoints. The `Center` model contains no file/URL fields for uploads.

---

## 13. TABLE IMPLEMENTATION GUIDE

### Columns

| Column | Source Field | Display |
|--------|--------------|---------|
| Centre Name | `centerName` | Plain text |
| Centre Code | `centerCode` | Monospace / badge |
| City | `city` | Plain text |
| State | `state` | Plain text |
| Contact | `contactNumber` | Format as 10-digit Indian mobile if present |
| Email | `email` | Plain text or `—` if empty |
| Status | `status` | Badge: green `ACTIVE`, gray/red `DISABLED` |
| Created | `createdAt` | Format locale datetime |
| Actions | — | View, Edit, Enable/Disable, Delete |

> `address` is not in typical list columns but available in `data` if needed.

### Search

- Single search input bound to `search` query param.
- Debounce 300–500ms before API call.
- Placeholder: *Search by name, code, or city*.

### Filters

| Filter | Query Param | Options |
|--------|-------------|---------|
| Status | `status` | `ALL` (no filter), `ACTIVE`, `DISABLED` |

No state/city filter in backend.

### Pagination

- Use `page`, `limit`, `total`, `totalPages` from response.
- Default `limit`: 10; max 100.

### Sorting

- Column headers map to `sortBy`: `centerName`, `centerCode`, `city`, `status`, `createdAt`.
- Toggle `sortOrder` between `asc` and `desc`.

### Actions

| Action | API |
|--------|-----|
| View | Navigate to detail; `GET /api/admin/centers/:id` |
| Edit | Navigate to edit form |
| Enable | `PATCH /api/admin/centers/:id/status` `{ status: "ACTIVE" }` |
| Disable | `PATCH /api/admin/centers/:id/status` `{ status: "DISABLED" }` |
| Bulk Enable | `PATCH /api/admin/centers/bulk-status` |
| Bulk Disable | `PATCH /api/admin/centers/bulk-status` |
| Delete | `DELETE /api/admin/centers/:id` |

### Status Badge Display

```typescript
const statusConfig = {
  ACTIVE: { label: 'Active', variant: 'success' },
  DISABLED: { label: 'Disabled', variant: 'secondary' },
};
```

### Date Display

Format `createdAt` / `updatedAt` with `Intl.DateTimeFormat` or date library. Values are ISO 8601 UTC strings from MongoDB timestamps.

---

## 14. FORM IMPLEMENTATION GUIDE

### Create Centre Form

| Field | Input Type | Source |
|-------|------------|--------|
| Centre Name | text | user input |
| Centre Code | text (uppercase on blur) | user input |
| Address | textarea | user input |
| City | text | user input (no dropdown) |
| State | select | `GET /api/admin/centers/states` |
| Contact Number | tel | user input; pattern `^[6-9]\d{9}$` |
| Email | email | user input |
| Status | select / toggle | `ACTIVE` (default) or `DISABLED` |

**Default values:**

```typescript
{
  centerName: '',
  centerCode: '',
  address: '',
  city: '',
  state: '',
  contactNumber: '',
  email: '',
  status: 'ACTIVE',
}
```

**Submission flow:**

1. Client-side validate (mirror Joi rules).
2. `POST /api/admin/centers`.
3. On 201: toast success, invalidate `centerKeys.lists()`, navigate to detail or list.
4. On error: map field errors, keep form data.

### Edit Centre Form

Same fields as create. Pre-populate from `GET /api/admin/centers/:id`.

**Submission flow:**

1. Build partial payload with only changed fields (minimum 1).
2. `PUT /api/admin/centers/:id`.
3. On 200: replace form state with `data` from response.
4. Refetch detail query to verify persistence.

### View Centre Form

Read-only display of all `formatCenterForAdmin` fields plus populated `createdBy` (name, email).

**Status toggle** on view page: use `PATCH /api/admin/centers/:id/status` (dedicated endpoint) rather than full PUT when only toggling status.

---

## 15. FRONTEND SERVICE LAYER

**File:** `src/services/centerService.ts`

```typescript
import api from './api';
import type { ApiSuccessResponse } from '../types/api';

export interface Center {
  _id: string;
  centerName: string;
  centerCode: string;
  address: string;
  city: string;
  state: string;
  contactNumber: string;
  email: string;
  status: 'ACTIVE' | 'DISABLED';
  createdBy:
    | { _id: string; name: string; email: string }
    | string
    | null;
  createdAt: string;
  updatedAt: string;
}

export interface CenterListParams {
  search?: string;
  status?: 'ALL' | 'ACTIVE' | 'DISABLED';
  page?: number;
  limit?: number;
  sortBy?: 'createdAt' | 'centerName' | 'centerCode' | 'city' | 'status';
  sortOrder?: 'asc' | 'desc';
}

export interface CenterListResponse {
  success: true;
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  count: number;
  data: Center[];
}

export interface CenterDropdownItem {
  _id: string;
  centerName: string;
  centerCode?: string;
  city?: string;
  state?: string;
}

export interface StateDropdownItem {
  value: string;
  label: string;
}

export interface CreateCenterPayload {
  centerName: string;
  centerCode: string;
  address?: string;
  city: string;
  state: string;
  contactNumber?: string;
  email?: string;
  status?: 'ACTIVE' | 'DISABLED';
}

export type UpdateCenterPayload = Partial<CreateCenterPayload>;

export interface BulkStatusPayload {
  centerIds: string[];
  status: 'ACTIVE' | 'DISABLED' | 'INACTIVE';
}

const CENTERS_BASE = '/api/admin/centers';

export const centerService = {
  getCenters: async (params?: CenterListParams) => {
    const { data } = await api.get<CenterListResponse>(CENTERS_BASE, { params });
    return data;
  },

  getCenterById: async (id: string) => {
    const { data } = await api.get<ApiSuccessResponse<Center>>(`${CENTERS_BASE}/${id}`);
    return data;
  },

  createCenter: async (payload: CreateCenterPayload) => {
    const { data } = await api.post<ApiSuccessResponse<Center>>(CENTERS_BASE, payload);
    return data;
  },

  updateCenter: async (id: string, payload: UpdateCenterPayload) => {
    const { data } = await api.put<ApiSuccessResponse<Center>>(
      `${CENTERS_BASE}/${id}`,
      payload
    );
    return data;
  },

  updateCenterStatus: async (id: string, status: 'ACTIVE' | 'DISABLED' | 'INACTIVE') => {
    const { data } = await api.patch<ApiSuccessResponse<Center>>(
      `${CENTERS_BASE}/${id}/status`,
      { status }
    );
    return data;
  },

  bulkUpdateCenterStatus: async (payload: BulkStatusPayload) => {
    const { data } = await api.patch<{
      success: true;
      message: string;
      status: string;
      requestedCount: number;
      matchedCount: number;
      updatedCount: number;
    }>(`${CENTERS_BASE}/bulk-status`, payload);
    return data;
  },

  deleteCenter: async (id: string) => {
    const { data } = await api.delete<ApiSuccessResponse<null>>(`${CENTERS_BASE}/${id}`);
    return data;
  },

  getIndianStates: async () => {
    const { data } = await api.get<{
      success: true;
      count: number;
      data: StateDropdownItem[];
    }>(`${CENTERS_BASE}/states`);
    return data;
  },

  getCentersDropdown: async () => {
    const { data } = await api.get<ApiSuccessResponse<CenterDropdownItem[]>>(
      `${CENTERS_BASE}/dropdown`
    );
    return data;
  },
};

export default centerService;
```

---

## 16. TANSTACK QUERY INTEGRATION

**Extend `src/hooks/queryKeys.ts`:**

```typescript
export const centerKeys = {
  all: ['centers'] as const,
  lists: () => [...centerKeys.all, 'list'] as const,
  list: (params?: Record<string, unknown>) => [...centerKeys.lists(), params ?? {}] as const,
  details: () => [...centerKeys.all, 'detail'] as const,
  detail: (id: string) => [...centerKeys.details(), id] as const,
  dropdown: () => [...centerKeys.all, 'dropdown'] as const,
  states: () => [...centerKeys.all, 'states'] as const,
};
```

**File:** `src/hooks/useCenters.ts`

```typescript
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { centerService, type CenterListParams } from '../services/centerService';
import { centerKeys } from './queryKeys';

export const useCenters = (params?: CenterListParams) =>
  useQuery({
    queryKey: centerKeys.list(params),
    queryFn: () => centerService.getCenters(params),
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  });
```

**File:** `src/hooks/useCenter.ts`

```typescript
import { useQuery } from '@tanstack/react-query';
import { centerService } from '../services/centerService';
import { centerKeys } from './queryKeys';

export const useCenter = (id: string, enabled = true) =>
  useQuery({
    queryKey: centerKeys.detail(id),
    queryFn: () => centerService.getCenterById(id),
    enabled: Boolean(id) && enabled,
    staleTime: 60_000,
  });
```

**File:** `src/hooks/useCreateCenter.ts`

```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { centerService, type CreateCenterPayload } from '../services/centerService';
import { centerKeys } from './queryKeys';

export const useCreateCenter = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateCenterPayload) => centerService.createCenter(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: centerKeys.lists() });
      queryClient.invalidateQueries({ queryKey: centerKeys.dropdown() });
    },
  });
};
```

**File:** `src/hooks/useUpdateCenter.ts`

```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  centerService,
  type UpdateCenterPayload,
} from '../services/centerService';
import { centerKeys } from './queryKeys';

export const useUpdateCenter = (id: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateCenterPayload) =>
      centerService.updateCenter(id, payload),
    onSuccess: (response) => {
      queryClient.setQueryData(centerKeys.detail(id), response);
      queryClient.invalidateQueries({ queryKey: centerKeys.lists() });
      queryClient.invalidateQueries({ queryKey: centerKeys.dropdown() });
    },
  });
};
```

**File:** `src/hooks/useDeleteCenter.ts`

```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { centerService } from '../services/centerService';
import { centerKeys } from './queryKeys';

export const useDeleteCenter = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => centerService.deleteCenter(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: centerKeys.lists() });
      queryClient.invalidateQueries({ queryKey: centerKeys.dropdown() });
    },
  });
};
```

### Query Keys Summary

| Key | Usage |
|-----|-------|
| `centerKeys.list(params)` | Paginated table |
| `centerKeys.detail(id)` | Detail / edit form |
| `centerKeys.states()` | State dropdown |
| `centerKeys.dropdown()` | Active centres dropdown (other screens) |

### Cache Strategy

| Query | staleTime | Notes |
|-------|-----------|-------|
| List | 30s | Use `keepPreviousData` for smooth pagination |
| Detail | 60s | Refetch on window focus optional |
| States | 24h | Static enum-backed; rarely changes |
| Dropdown | 5min | Match existing `useCentersDropdown` |

### Refetch Strategy

- After create/update/delete/status change: `invalidateQueries` on `centerKeys.lists()` and `centerKeys.dropdown()`.
- After update: also `setQueryData` on detail key with mutation response, then optionally `refetch` detail to verify server state.

### Mutation Strategy

- Use `onSuccess` to invalidate list; never append to list from local state alone.
- For bulk status: invalidate entire list; show `updatedCount` from response in toast.

---

## 17. CENTRALIZED API INTEGRATION

Compatible with existing `src/services/api.ts`:

| Requirement | Implementation |
|-------------|----------------|
| Axios instance | `api` default export |
| Base URL | `import.meta.env.VITE_API_BASE_URL` |
| Token injection | Request interceptor adds `Authorization: Bearer ${token}` |
| Token storage | `VITE_AUTH_TOKEN_KEY` (fallback `authToken`, `token`) |
| Request interceptor | Attaches token from `getAuthToken()` |
| Response interceptor | `handleApiError`; dispatches `auth:unauthorized` on 401 |
| Global error handling | `src/utils/errorHandler.ts` |

**Environment:**

```env
VITE_API_BASE_URL=http://localhost:5000
VITE_AUTH_TOKEN_KEY=authToken
```

**No hardcoded URLs** — all centre service paths are relative to `VITE_API_BASE_URL`.

---

## 18. SERVER PERSISTENCE RULES

### Create

1. Submit `POST /api/admin/centers`.
2. On 201, read `data._id` from response.
3. **Verify:** `GET /api/admin/centers/:id` — centre must exist with submitted values.
4. **Verify:** Refresh list — new row appears.
5. Never add to local table without server-confirmed `_id`.

### Update

1. Submit `PUT /api/admin/centers/:id`.
2. On 200, replace UI state with `response.data`.
3. **Verify:** Refetch `GET /api/admin/centers/:id` and compare fields.
4. **Verify:** List row reflects changes after `invalidateQueries`.

### Delete

1. Submit `DELETE /api/admin/centers/:id`.
2. On 200, remove from UI.
3. **Verify:** `GET /api/admin/centers/:id` returns 404.
4. **Verify:** List no longer contains deleted `_id` after refetch.

### Status Change

1. Submit `PATCH .../status` or `PATCH .../bulk-status`.
2. **Verify:** Refetch affected detail/list rows; `status` must match server.

**Rule:** Server response is always the source of truth. Never trust optimistic-only local state without refetch confirmation.

---

## 19. COMPLETE DATA FLOW

### Page Load

```
Super Admin token in storage
        │
        ▼
Centre Management page mounts
        │
        ▼
useCenters({ page: 1, limit: 10, status: 'ALL' })
        │
        ▼
GET /api/admin/centers ──► Render table
```

### Dropdown Load (Create/Edit Form)

```
Form mounts
        │
        ▼
useQuery(centerKeys.states()) ──► GET /api/admin/centers/states
        │
        ▼
Populate state <Select>
```

### Centre List Load

```
User changes search / filter / page / sort
        │
        ▼
Update query params in useCenters
        │
        ▼
GET /api/admin/centers?search=...&status=...&page=...&limit=...&sortBy=...&sortOrder=...
        │
        ▼
Render rows from response.data
```

### Create Centre

```
User fills form ──► Client validation
        │
        ▼
POST /api/admin/centers
        │
        ├── 201 ──► Toast success ──► invalidateQueries(lists) ──► Navigate / refetch
        └── 400/422 ──► Map errors to form fields
```

### Edit Centre

```
GET /api/admin/centers/:id ──► Pre-fill form
        │
        ▼
User edits ──► PUT /api/admin/centers/:id
        │
        ├── 200 ──► Update cache ──► invalidateQueries(lists) ──► Refetch detail
        └── 400/422/404 ──► Error handling
```

### Delete Centre

```
Confirm dialog
        │
        ▼
DELETE /api/admin/centers/:id
        │
        ├── 200 ──► invalidateQueries ──► Refetch list
        ├── 400 (courses linked) ──► Show message, suggest disable
        └── 404 ──► Already deleted; refresh list
```

### Refresh Flow

- Manual refresh button: `queryClient.invalidateQueries({ queryKey: centerKeys.lists() })`.
- After any mutation: automatic invalidation + refetch.

### Error Flow

```
API error
        │
        ▼
api.ts interceptor ──► handleApiError
        │
        ├── 401 ──► auth:unauthorized event ──► redirect login
        └── Other ──► Mutation onError ──► field errors / toast
```

### Success Flow

```
Mutation success
        │
        ▼
Toast with response.message
        │
        ▼
invalidateQueries + optional refetch
        │
        ▼
UI reflects server data (not stale local copy)
```

---

## 20. IMPLEMENTATION CHECKLIST

Developer must verify:

- [ ] List API works (`GET /api/admin/centers`)
- [ ] Search works (`search` param — name, code, city)
- [ ] Filters work (`status`: ALL / ACTIVE / DISABLED)
- [ ] Pagination works (`page`, `limit`, `totalPages`)
- [ ] Sorting works (`sortBy`, `sortOrder`)
- [ ] View works (`GET /api/admin/centers/:id`)
- [ ] Create works (`POST /api/admin/centers`)
- [ ] Update works (`PUT /api/admin/centers/:id`)
- [ ] Delete works (`DELETE /api/admin/centers/:id`)
- [ ] Single status toggle works (`PATCH /api/admin/centers/:id/status`)
- [ ] Bulk status works (`PATCH /api/admin/centers/bulk-status`)
- [ ] States dropdown works (`GET /api/admin/centers/states`)
- [ ] Centres dropdown works (`GET /api/admin/centers/dropdown`) — if used elsewhere
- [ ] Validation rules implemented (mirror Joi + controller rules)
- [ ] Duplicate errors mapped (`errors`, `duplicates`)
- [ ] Error handling implemented (400, 401, 403, 404, 422, 500)
- [ ] Loading states implemented (list, detail, mutations)
- [ ] Server persistence verified (refetch after mutations)
- [ ] Data visible after browser refresh
- [ ] No hardcoded centre data
- [ ] No mock data
- [ ] No console errors
- [ ] No TypeScript errors
- [ ] No build errors
- [ ] Super Admin auth only for CRUD (not AdminAccess JWT)
- [ ] Existing functionality preserved

---

## APPENDIX A: Audit Logs

Centre mutations write non-blocking audit logs (`auditLogService.logAdminAudit`):

| Action | Trigger | Module |
|--------|---------|--------|
| `CREATE` | Centre created | `Center Management` |
| `UPDATE` | Centre updated | `Center Management` |
| `STATUS_CHANGE` | Status PATCH | `Center Management` |
| `DELETE` | Centre deleted | `Center Management` |

Audit log **read** APIs are outside Centre Management scope.

---

## APPENDIX B: Source File Reference

| Concern | File |
|---------|------|
| Centre routes | `routes/centerManagementRoutes.js` |
| Centre controller | `controllers/centerManagementController.js` |
| Centre model | `models/Center.js` |
| Helpers | `utils/centerHelpers.js` |
| State enum | `utils/centerEnums.js` |
| Validation | `middleware/validation.js` (`manageCenterCreate`, `manageCenterUpdate`, `manageCenterStatus`, `manageCenterBulkStatus`) |
| Auth | `middleware/authMiddleware.js` |
| Role guard | `middleware/roleMiddleware.js` |
| Staff guard | `middleware/requireStaffAdmin.js` |
| Parent admin router | `routes/adminRoutes.js` |
| Dropdown alias mount | `app.js` line 283 |
| Postman collection | `CENTER_MANAGEMENT_POSTMAN_COLLECTION.json` |
| Existing frontend service | `src/services/centerService.ts` (partial — extend per Section 15) |
| Existing dropdown hook | `src/hooks/useCentersDropdown.ts` |

---

## APPENDIX C: Centre vs CenterData

| Aspect | Operational Centre (`Center`) | Website CentreData (`CenterData`) |
|--------|------------------------------|-----------------------------------|
| Admin API | `/api/admin/centers` | `/api/centers` (different controller) |
| Purpose | Operations, assignments, courses | Public website pages (gallery, faculty) |
| Auth for CRUD | Super Admin | Separate routes in `centerDataRoutes.js` |
| Use for this screen | **Yes** | **No** |
