# ROLE ACCESS MANAGEMENT FRONTEND INTEGRATION README

**Single source of truth** for integrating the **Admin Management → Role Access Management** screen with a React + Vite frontend.

Every endpoint, payload, enum, validation rule, and response shape in this document is extracted from the backend implementation. Nothing is invented.

**Source files verified:**

| Layer | Path |
|-------|------|
| Routes | `routes/roleRoutes.js`, `routes/permissionRoutes.js`, `routes/adminRoutes.js` |
| Controllers | `controllers/roleController.js`, `controllers/permissionController.js` |
| Model | `models/Role.js`, `models/PermissionMatrix.js` |
| Helpers | `utils/roleHelpers.js`, `utils/permissionHelpers.js`, `utils/roleSeed.js` |
| Config | `config/permissionModules.js`, `config/rolePermissionDefaults.js` |
| Validation | `middleware/validation.js` |
| Auth / RBAC | `middleware/authMiddleware.js`, `middleware/roleMiddleware.js` |
| Mount | `app.js` → `app.use('/api/admin', adminRoutes)` |

**Base URL:** `import.meta.env.VITE_API_BASE_URL` (e.g. `http://localhost:5000`)  
**API prefix:** `/api/admin`  
**Role Access API prefix:** `/api/admin/roles`  
**Related permission matrix prefix:** `/api/admin/permissions`

---

## 1. MODULE OVERVIEW

### Purpose

**Role Access Management** governs **dynamic RBAC role records** stored in the MongoDB `roles` collection (`Role` model). Each role defines:

- A human-readable **title** (`roleTitle`)
- A unique machine **code** (`roleCode`, stored uppercase)
- An **active/inactive** lifecycle (`status`)

Roles are the foundation of the permission system. When a role is created, the backend automatically generates one `PermissionMatrix` document per module (from `config/permissionModules.js`) with all features initially **denied** (`allowed: false`). Optional bootstrap defaults from `config/rolePermissionDefaults.js` may pre-enable features for specific `roleCode` values on first creation.

> **UI mapping:** The admin panel route `/users/admin-access-types` is labeled **Role Access** in audit docs and maps to backend `/api/admin/roles`. Permission toggles for each role use `/api/admin/permissions/*` (separate but tightly coupled screen).

### Business Flow

```
Super Admin logs in (legacy User.role === 'super_admin')
        │
        ▼
GET /api/admin/roles ──► List / search / filter roles
        │
        ├── POST /api/admin/roles ──► Create role
        │         │
        │         ├── PermissionMatrix rows auto-created (all features denied)
        │         └── rolePermissionDefaults applied once per role+module
        │
        ├── PUT /api/admin/roles/:id ──► Edit title / code / status
        ├── PATCH /api/admin/roles/:id/status ──► Activate / deactivate
        └── DELETE /api/admin/roles/:id ──► Hard delete role + cascade delete PermissionMatrix
                │
                ▼
(Optional) Configure permissions via /api/admin/permissions/*
                │
                ▼
AdminAccess accounts reference roleId ──► GET /api/admin/permissions/my-access at login
```

### User Flow (Frontend)

1. Super Admin opens **Role Access** page.
2. Table loads via `GET /api/admin/roles` with pagination, search, status filter, sorting.
3. **Create:** form submits `roleTitle`, `roleCode`, optional `status` → `POST /api/admin/roles`.
4. **Edit:** form loads `GET /api/admin/roles/:id`, saves via `PUT /api/admin/roles/:id`.
5. **Status toggle:** `PATCH /api/admin/roles/:id/status` with `{ status: "ACTIVE" | "INACTIVE" }`.
6. **Delete:** confirm dialog → `DELETE /api/admin/roles/:id` (permanent).
7. **Permission matrix** (if on same or linked screen): load matrix via `GET /api/admin/permissions/role/:roleId`, save toggles via `PATCH` or `POST /api/admin/permissions/sync-bulk`.

### Permission Flow

| Actor | How access is determined |
|-------|--------------------------|
| **Super Admin** (`User` with `role: 'super_admin'`) | Full access to all Role Access CRUD endpoints via `allowRoles(ROLES.SUPER_ADMIN)`. Bypasses feature-level permission checks. |
| **AdminAccess JWT** (`authType: 'admin_access'`) | **Blocked** from `/api/admin/roles` and permission edit APIs. `allowRoles` returns 403 when `req.adminAccess` is set without `req.user`. |
| **Other legacy User roles** (`center_admin`, `employee`) | **Blocked** — 403 insufficient permissions. |

Role Access CRUD uses **role-based middleware only** — no `checkPermission` middleware on these routes.

### Important Backend Constraints

- **Legacy `User.role` enum** (`super_admin`, `center_admin`, `employee`) is **unchanged** for login and `allowRoles()`. Dynamic `Role` records run in parallel.
- **Seeded roles** on server start (`utils/roleSeed.js`): `SUPER_ADMIN`, `CENTER_ADMIN`, `EMPLOYEE`. Re-created on next startup if deleted.
- **No soft delete** for roles — `DELETE` permanently removes the document.
- **No export API** for roles.
- **No bulk create/update/delete** for roles.
- **Duplicate `roleCode`** returns HTTP **400** (not 409).
- **Deleting a role does not check** for `AdminAccess` records still referencing `roleId` — orphaned references are possible. Document this in UI warnings.

---

## 2. COMPLETE API INVENTORY

All Role Access endpoints require:

1. `protect` middleware — valid Bearer JWT
2. `allowRoles(ROLES.SUPER_ADMIN)` — legacy super admin `User` only

### Authentication Prerequisite

#### Login (obtain token)

### Endpoint

**METHOD:** `POST`  
**URL:** `/api/auth/login-admin` (alias: `/api/auth/login-super-admin`)

### Authentication

Required? **No** (public)  
Token Type? **N/A** — returns JWT on success

### Request Headers

| Header | Required | Value |
|--------|----------|-------|
| `Content-Type` | Yes | `application/json` |

### Request Body

```json
{
  "email": "superadmin@example.com",
  "password": "yourpassword"
}
```

Validation (`validations.adminLogin`): `email` required email; `password` required string.

### Success Response

HTTP `200` — uses `sendSuccess` with `nestDataOnly: true` (token and user at root):

```json
{
  "success": true,
  "statusCode": 10000,
  "message": "Login successful",
  "data": null,
  "error": null,
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "674a1b2c3d4e5f6789012345",
    "name": "Super Admin",
    "email": "admin@example.com",
    "role": "super_admin"
  }
}
```

### Error Responses

| HTTP | When |
|------|------|
| 400 | Missing email/password |
| 401 | Invalid credentials |
| 403 | Account inactive |
| 422 | Joi validation failure |
| 500 | Server error |

---

### API 1 — List Roles

### Endpoint

**METHOD:** `GET`  
**URL:** `/api/admin/roles`

### Authentication

Required? **Yes**  
Token Type? **Bearer JWT** (super admin `User` token from `generateToken`)

### Request Headers

| Header | Required | Value |
|--------|----------|-------|
| `Authorization` | Yes | `Bearer <token>` |

### Path Params

None

### Query Params

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `search` | string | `''` | Case-insensitive regex on `roleTitle` or `roleCode` |
| `status` | string | — | `ACTIVE`, `INACTIVE`, or omit/`ALL` for no status filter |
| `page` | number | `1` | Page number (min 1) |
| `limit` | number | `10` | Page size (min 1, max 100) |
| `sortBy` | string | `createdAt` | One of: `createdAt`, `roleTitle`, `roleCode`, `status` |
| `sortOrder` | string | `desc` | `asc` or `desc` |

> Query params are **not** Joi-validated on this route — invalid values fall back to defaults.

### Request Body

None

### Success Response

HTTP `200`:

```json
{
  "success": true,
  "total": 5,
  "page": 1,
  "limit": 10,
  "totalPages": 1,
  "count": 5,
  "data": [
    {
      "_id": "674a1b2c3d4e5f6789012345",
      "roleTitle": "Content Admin",
      "roleCode": "CONTENT_ADMIN",
      "status": "ACTIVE",
      "createdBy": "674a1b2c3d4e5f6789012346",
      "createdAt": "2025-01-15T10:00:00.000Z",
      "updatedAt": "2025-01-15T10:00:00.000Z"
    }
  ]
}
```

> **Note:** Role endpoints do **not** include `statusCode` in the JSON body (legacy controller format).

### Error Responses

| HTTP | Body |
|------|------|
| 401 | `{ "success": false, "statusCode": 11001, "message": "Not authorized, no token", ... }` or `{ "message": "Not authenticated" }` |
| 403 | `{ "message": "Access denied. Insufficient permissions.", "required": ["super_admin"], "current": "center_admin" }` |
| 500 | `{ "success": false, "message": "Server error", "error": "<message>" }` |

400, 404, 409 — **not used** on list endpoint.

---

### API 2 — Roles Dropdown (Active Only)

### Endpoint

**METHOD:** `GET`  
**URL:** `/api/admin/roles/dropdown`

### Authentication

Required? **Yes** — super admin only

### Request Headers

| Header | Required | Value |
|--------|----------|-------|
| `Authorization` | Yes | `Bearer <token>` |

### Path Params

None

### Query Params

None

### Request Body

None

### Success Response

HTTP `200`:

```json
{
  "success": true,
  "count": 3,
  "data": [
    {
      "_id": "674a1b2c3d4e5f6789012345",
      "roleTitle": "Center Admin",
      "roleCode": "CENTER_ADMIN"
    }
  ]
}
```

Only roles with `status: "ACTIVE"` are returned, sorted by `roleTitle` ascending.

### Error Responses

Same as List Roles (401, 403, 500).

---

### API 3 — Get Role By ID

### Endpoint

**METHOD:** `GET`  
**URL:** `/api/admin/roles/:id`

### Authentication

Required? **Yes** — super admin only

### Path Params

| Param | Type | Description |
|-------|------|-------------|
| `id` | MongoDB ObjectId | Role `_id` |

### Success Response

HTTP `200`:

```json
{
  "success": true,
  "data": {
    "_id": "674a1b2c3d4e5f6789012345",
    "roleTitle": "Content Admin",
    "roleCode": "CONTENT_ADMIN",
    "status": "ACTIVE",
    "createdBy": "674a1b2c3d4e5f6789012346",
    "createdAt": "2025-01-15T10:00:00.000Z",
    "updatedAt": "2025-01-15T10:00:00.000Z"
  }
}
```

### Error Responses

| HTTP | Body |
|------|------|
| 401 | Not authenticated |
| 403 | Insufficient permissions |
| 404 | `{ "success": false, "message": "Role not found" }` |
| 500 | Server error (includes invalid ObjectId cast errors) |

---

### API 4 — Create Role

### Endpoint

**METHOD:** `POST`  
**URL:** `/api/admin/roles`

### Authentication

Required? **Yes** — super admin only

### Request Headers

| Header | Required | Value |
|--------|----------|-------|
| `Authorization` | Yes | `Bearer <token>` |
| `Content-Type` | Yes | `application/json` |

### Request Body

```json
{
  "roleTitle": "Content Admin",
  "roleCode": "CONTENT_ADMIN",
  "status": "ACTIVE"
}
```

Validated by `validations.manageRoleCreate` (Joi, `stripUnknown: true`).

### Success Response

HTTP `201`:

```json
{
  "success": true,
  "message": "Role created successfully. Permission matrix generated.",
  "data": {
    "_id": "674a1b2c3d4e5f6789012345",
    "roleTitle": "Content Admin",
    "roleCode": "CONTENT_ADMIN",
    "status": "ACTIVE",
    "createdBy": "674a1b2c3d4e5f6789012346",
    "createdAt": "2025-01-15T10:00:00.000Z",
    "updatedAt": "2025-01-15T10:00:00.000Z"
  }
}
```

**Side effects:** `createPermissionMatrixForRole(role._id)` + `applyRolePermissionDefaults()`.

### Error Responses

| HTTP | Body |
|------|------|
| 400 | `{ "success": false, "message": "Role title is required" }` |
| 400 | `{ "success": false, "message": "Role code is required" }` |
| 400 | `{ "success": false, "message": "Role code already exists" }` |
| 401 | Not authenticated |
| 403 | Insufficient permissions |
| 422 | Joi validation — see [Section 10](#10-validation-rules) |
| 500 | Server error |

409 — **NOT USED** (duplicates return 400).

---

### API 5 — Update Role

### Endpoint

**METHOD:** `PUT`  
**URL:** `/api/admin/roles/:id`

### Path Params

| Param | Type | Description |
|-------|------|-------------|
| `id` | MongoDB ObjectId | Role `_id` |

### Request Body

At least one field required (`validations.manageRoleUpdate` `.min(1)`):

```json
{
  "roleTitle": "Senior Content Admin",
  "roleCode": "CONTENT_ADMIN",
  "status": "ACTIVE"
}
```

### Success Response

HTTP `200`:

```json
{
  "success": true,
  "message": "Role updated successfully",
  "data": { /* formatRoleForAdmin shape */ }
}
```

### Error Responses

| HTTP | Body |
|------|------|
| 400 | `{ "success": false, "message": "No valid fields to update" }` |
| 400 | `{ "success": false, "message": "Role code already exists" }` |
| 400 | `{ "success": false, "message": "Status must be ACTIVE or INACTIVE" }` |
| 401 | Not authenticated |
| 403 | Insufficient permissions |
| 404 | `{ "success": false, "message": "Role not found" }` |
| 422 | Joi validation |
| 500 | Server error |

---

### API 6 — Update Role Status

### Endpoint

**METHOD:** `PATCH`  
**URL:** `/api/admin/roles/:id/status`

### Request Body

```json
{
  "status": "INACTIVE"
}
```

Validated by `validations.manageRoleStatus`.

### Success Response

HTTP `200`:

```json
{
  "success": true,
  "message": "Role status updated successfully",
  "data": { /* formatRoleForAdmin shape */ }
}
```

### Error Responses

| HTTP | Body |
|------|------|
| 400 | `{ "success": false, "message": "Status must be ACTIVE or INACTIVE" }` |
| 401 | Not authenticated |
| 403 | Insufficient permissions |
| 404 | `{ "success": false, "message": "Role not found" }` |
| 422 | Joi validation |
| 500 | Server error |

---

### API 7 — Delete Role

### Endpoint

**METHOD:** `DELETE`  
**URL:** `/api/admin/roles/:id`

### Request Body

None

### Success Response

HTTP `200`:

```json
{
  "success": true,
  "message": "Role and permission matrix deleted successfully"
}
```

**Side effects:** `deletePermissionMatrixForRole(role._id)` then `Role.findByIdAndDelete`. **Hard delete.**

### Error Responses

| HTTP | Body |
|------|------|
| 401 | Not authenticated |
| 403 | Insufficient permissions |
| 404 | `{ "success": false, "message": "Role not found" }` |
| 500 | Server error |

---

### Related Permission Matrix APIs

Used when configuring access **after** role creation. All require super admin except `my-access`.

| # | METHOD | URL | Purpose |
|---|--------|-----|---------|
| P1 | GET | `/api/admin/permissions/modules` | Master module/feature catalog |
| P2 | GET | `/api/admin/permissions` | Full matrix for all (filtered) roles |
| P3 | GET | `/api/admin/permissions/role/:roleId` | Matrix for one role |
| P4 | GET | `/api/admin/permissions/my-access` | Logged-in user's allowed features (`protect` only) |
| P5 | PATCH | `/api/admin/permissions/:permissionId` | Toggle one feature |
| P6 | PATCH | `/api/admin/permissions/:permissionId/enable-all` | Allow all features in module |
| P7 | PATCH | `/api/admin/permissions/:permissionId/restrict-all` | Deny all features in module |
| P8 | PATCH | `/api/admin/permissions/:permissionId/reset` | Reset to all denied |
| P9 | POST | `/api/admin/permissions/sync-bulk` | Bulk matrix save |

> `:permissionId` is the `PermissionMatrix` document `_id` (one module row), **not** the role `_id`.

Detailed payloads for P1–P9 are in [Sections 7–8](#7-role-dropdown-apis).

---

## 3. ROLE ACCESS LIST API

### Listing Endpoint

`GET /api/admin/roles`

### Search Support

| Query | Behavior |
|-------|----------|
| `search` | Trimmed string; case-insensitive regex match on `roleTitle` OR `roleCode` |

### Pagination

| Field | Source |
|-------|--------|
| Request `page` | Default `1`, minimum `1` |
| Request `limit` | Default `10`, clamped `1`–`100` |
| Response `total` | Total matching documents |
| Response `totalPages` | `Math.ceil(total / limit)` |
| Response `count` | Items in current `data` array |
| Response `page` | Current page number |
| Response `limit` | Current page size |

### Filters

| Query | Values | Effect |
|-------|--------|--------|
| `status` | `ACTIVE` | Only active roles |
| `status` | `INACTIVE` | Only inactive roles |
| `status` | omitted or `ALL` | No status filter |

### Sorting

| `sortBy` | Allowed |
|----------|---------|
| `createdAt` | ✓ (default) |
| `roleTitle` | ✓ |
| `roleCode` | ✓ |
| `status` | ✓ |
| anything else | Falls back to `createdAt` |

| `sortOrder` | Effect |
|-------------|--------|
| `asc` | Ascending |
| `desc` | Descending (default) |

### Frontend Request Example

```typescript
const response = await api.get('/api/admin/roles', {
  params: {
    page: 1,
    limit: 10,
    search: 'admin',
    status: 'ACTIVE',
    sortBy: 'roleTitle',
    sortOrder: 'asc',
  },
});
```

### Frontend Response Mapping

```typescript
interface RoleListResponse {
  success: boolean;
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  count: number;
  data: RoleRecord[];
}

interface RoleRecord {
  _id: string;
  roleTitle: string;
  roleCode: string;
  status: 'ACTIVE' | 'INACTIVE';
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
}

// Table row mapping
const rows = response.data.data.map((role) => ({
  id: role._id,
  title: role.roleTitle,
  code: role.roleCode,
  status: role.status,
  createdAt: new Date(role.createdAt),
}));
```

---

## 4. CREATE ROLE ACCESS API

### Exact Payload

```json
{
  "roleTitle": "Counseling Admin",
  "roleCode": "COUNSELING_ADMIN",
  "status": "ACTIVE"
}
```

### Required Fields

| Field | Joi Rule | Controller Check |
|-------|----------|------------------|
| `roleTitle` | `string`, min 2, max 100, required, trim | Also checked: non-empty after trim |
| `roleCode` | `string`, min 2, max 50, required, trim | Also checked: non-empty after trim |

### Optional Fields

| Field | Default | Values |
|-------|---------|--------|
| `status` | `ACTIVE` | `ACTIVE`, `INACTIVE` |

If `status` is anything other than `'INACTIVE'`, backend sets `ACTIVE`.

### Validation Rules

See [Section 10](#10-validation-rules).

### Backend Restrictions

- `roleCode` is stored **uppercase** (`String(roleCode).toUpperCase().trim()`).
- `roleCode` must be **unique** across all roles.
- `createdBy` is set server-side to `req.user._id` (not accepted from client).
- Unknown body fields are **stripped** by Joi `stripUnknown: true`.
- On success, permission matrix rows are created for all modules in `config/permissionModules.js`.
- `applyRolePermissionDefaults()` may pre-enable features if `roleCode` matches an entry in `config/rolePermissionDefaults.js`.

### Success Response

HTTP `201` — see [API 4](#api-4--create-role).

### Frontend Mapping Guide

```typescript
// Form → API
const payload = {
  roleTitle: form.title.trim(),
  roleCode: form.code.trim().toUpperCase(), // backend also uppercases
  ...(form.status ? { status: form.status } : {}),
};

const { data } = await api.post('/api/admin/roles', payload);
const createdRole = data.data;

// Invalidate list + dropdown caches
queryClient.invalidateQueries({ queryKey: ['roleAccess', 'list'] });
queryClient.invalidateQueries({ queryKey: ['roleAccess', 'dropdown'] });
```

---

## 5. UPDATE ROLE ACCESS API

### Endpoint

`PUT /api/admin/roles/:id`

### Payload

Partial update — at least one field:

```json
{
  "roleTitle": "Senior Counseling Admin",
  "roleCode": "COUNSELING_ADMIN",
  "status": "INACTIVE"
}
```

### Editable Fields

| Field | Notes |
|-------|-------|
| `roleTitle` | Trimmed string |
| `roleCode` | Uppercased, uniqueness checked excluding current role |
| `status` | `ACTIVE` or `INACTIVE` |

### Immutable Fields

| Field | Notes |
|-------|-------|
| `_id` | Path param only |
| `createdBy` | Set at creation |
| `createdAt` | Mongoose timestamp |
| `updatedAt` | Auto-updated by Mongoose |

Permission matrix is **not** updated via this endpoint — use permission APIs.

### Validation

`validations.manageRoleUpdate` — each present field must meet create rules; `.min(1)` requires at least one field.

Controller additionally rejects empty update object and invalid status values.

### Success Response

HTTP `200` — see [API 5](#api-5--update-role).

---

## 6. DELETE ROLE ACCESS API

### Endpoint

`DELETE /api/admin/roles/:id`

### Soft Delete or Hard Delete

**Hard delete** — document permanently removed from `roles` collection.

### Side Effects

1. All `PermissionMatrix` documents with matching `roleId` are deleted.
2. Role document is deleted.

### Restrictions

- **NOT AVAILABLE IN BACKEND:** check for `AdminAccess` users assigned to this role before delete.
- **NOT AVAILABLE IN BACKEND:** prevent deletion of seeded roles (`SUPER_ADMIN`, `CENTER_ADMIN`, `EMPLOYEE`).
- Seeded roles are re-created on next server start if missing (`utils/roleSeed.js`).

### Error Scenarios

| Scenario | HTTP | Message |
|----------|------|---------|
| Role not found | 404 | `Role not found` |
| Not super admin | 403 | `Access denied. Insufficient permissions.` |
| No token | 401 | `Not authorized, no token` |
| Server failure | 500 | `Server error` |

### Frontend Guidance

Show a strong confirmation warning: deleting a role removes its entire permission matrix. Admin accounts referencing this `roleId` may break.

---

## 7. ROLE DROPDOWN APIs

### Roles (Role Access — primary source)

| Item | Value |
|------|-------|
| **Endpoint** | `GET /api/admin/roles/dropdown` |
| **Auth** | Super admin |
| **Filter** | `status: ACTIVE` only |
| **Sort** | `roleTitle` ascending |

**Response:**

```json
{
  "success": true,
  "count": 3,
  "data": [
    { "_id": "...", "roleTitle": "Center Admin", "roleCode": "CENTER_ADMIN" }
  ]
}
```

**Frontend mapping:**

```typescript
options = data.data.map((r) => ({
  value: r._id,
  label: r.roleTitle,
  roleCode: r.roleCode,
}));
```

### Roles (List with inactive — for Role Access filters)

| Item | Value |
|------|-------|
| **Endpoint** | `GET /api/admin/roles?status=ALL&limit=100` |
| **Use** | Status filter dropdown on Role Access table |

### Roles (User Management filter — NOT for Role Access screen)

| Item | Value |
|------|-------|
| **Endpoint** | `GET /api/admin/user-roles` |
| **Auth** | Super admin |
| **Note** | Returns `ALL`, hardcoded `STUDENT`, and **all** roles including `INACTIVE`. **Do not use** on Role Access screen. |

### Permissions (Module catalog)

| Item | Value |
|------|-------|
| **Endpoint** | `GET /api/admin/permissions/modules` |
| **Use** | Build permission matrix column/row headers |

**Response:**

```json
{
  "success": true,
  "count": 8,
  "data": [
    {
      "moduleKey": "ACADEMICS",
      "moduleTitle": "Academics",
      "features": [
        { "featureTitle": "Student Management", "featureKey": "STUDENT_MANAGEMENT" }
      ]
    }
  ]
}
```

### Permissions (Matrix by role)

| Item | Value |
|------|-------|
| **Endpoint** | `GET /api/admin/permissions/role/:roleId` |
| **Use** | Load toggles for one role |

### Permissions (Matrix all roles)

| Item | Value |
|------|-------|
| **Endpoint** | `GET /api/admin/permissions?search=&roleId=` |
| **Query `search`** | Filter roles by title/code |
| **Query `roleId`** | Filter to single role |

### Menus

**NOT AVAILABLE IN BACKEND** — no menu/submenu dropdown APIs for Role Access.

### Submenus

**NOT AVAILABLE IN BACKEND**

### Centers

**NOT AVAILABLE IN BACKEND** for Role Access CRUD. Centers are used by Admin Access assignment (`/api/admin/centers/dropdown`), not Role Access.

### Users

**NOT AVAILABLE IN BACKEND** for Role Access CRUD.

---

## 8. PERMISSION MATRIX STRUCTURE

### Backend Model

Permissions are **not** CRUD columns (`View`, `Create`, `Update`, `Delete`, `Export`, `Approve`, `Assign`). Each feature is a **single boolean toggle** `allowed: true | false`.

### Storage Shape (`PermissionMatrix` collection)

```json
{
  "_id": "674a1b2c3d4e5f6789012347",
  "roleId": "674a1b2c3d4e5f6789012345",
  "moduleKey": "ACADEMICS",
  "moduleTitle": "Academics",
  "permissions": [
    {
      "featureKey": "STUDENT_MANAGEMENT",
      "featureTitle": "Student Management",
      "allowed": false
    }
  ],
  "defaultsApplied": false
}
```

### Feature Key Generation

`featureTitle` → uppercase, spaces to underscores, strip non-alphanumeric:

- `"Student Management"` → `STUDENT_MANAGEMENT`
- `"Lead Bulk Upload"` → `LEAD_BULK_UPLOAD`

Implemented in `utils/permissionHelpers.js` → `toFeatureKey()`.

### Master Modules (`config/permissionModules.js`)

| moduleKey | moduleTitle | Feature Count |
|-----------|-------------|---------------|
| `ACADEMICS` | Academics | 10 |
| `TEST_MANAGEMENT` | Test Management | 7 |
| `USERS_ACCESS` | Users & Access | 7 |
| `ENGAGEMENT_CRM` | Engagement & CRM | 16 |
| `CONTENT_MARKETING` | Content & Marketing | 7 |
| `FINANCE_OPERATIONS` | Finance Operations | 5 |
| `OPERATIONS` | Operations | 10 |
| `SYSTEM_TOOLS` | System Tools | 6 |

### All Features by Module

**ACADEMICS:** Student Management, Course Management, Batch Management, Live Classes, Assignments, Attendance, Exams, Results, Faculty Management, Study Materials

**TEST_MANAGEMENT:** OMR Management, CBT Management, Mains Management, Question Bank, Evaluations, Test Configuration, Test Reports

**USERS_ACCESS:** User Creation, Admin Creation, Role Assignment, Wallet Management, Coupons, Access Control, Permission Editing

**ENGAGEMENT_CRM:** Lead View, Lead Bulk Upload, Lead Assign, Lead Edit, Lead Delete, Lead Status Update, Enquiry View, Enquiry Assign, Enquiry Edit, Enquiry Status Update, Enquiries, Notifications, Help Desk View, Help Desk Reply, Campaign Tracking, Follow Ups

**CONTENT_MARKETING:** Blog Management, Free Resources, Current Affairs, Banner Management, Campaigns, SEO Content, Media Uploads

**FINANCE_OPERATIONS:** Payment Mode Management, Finance Reports, Payment Analytics, Reconciliation, Fee Collection

**OPERATIONS:** User Workflow, Reports & Analytics, Configurations, Audit Logs, Operational Tasks, Team Assignments, Process Tracking, Data Monitoring, Approval Management, Internal Escalations

**SYSTEM_TOOLS:** Logs, Database Access, Integrations, Platform Settings, Backup Control, API Settings

### Matrix Summary Response (`GET /api/admin/permissions/role/:roleId`)

```json
{
  "success": true,
  "data": {
    "role": {
      "_id": "...",
      "roleTitle": "Counseling Admin",
      "roleCode": "COUNSELING_ADMIN",
      "status": "ACTIVE"
    },
    "allowedCount": 4,
    "restrictedCount": 64,
    "totalFeatures": 68,
    "modules": [
      {
        "_id": "permissionMatrixDocId",
        "roleId": "...",
        "moduleKey": "ENGAGEMENT_CRM",
        "moduleTitle": "Engagement & CRM",
        "totalFeatures": 16,
        "allowedCount": 4,
        "restrictedCount": 12,
        "permissions": [
          { "featureKey": "LEAD_VIEW", "featureTitle": "Lead View", "allowed": true }
        ]
      }
    ]
  }
}
```

### How Frontend Should Render

1. **Do not** render View/Create/Update/Delete columns — render one **checkbox/toggle per feature** bound to `allowed`.
2. Group features under **module accordion/section** headers (`moduleTitle`).
3. Module-level actions map to:
   - Enable all → `PATCH /api/admin/permissions/:permissionId/enable-all`
   - Restrict all → `PATCH /api/admin/permissions/:permissionId/restrict-all`
   - Reset → `PATCH /api/admin/permissions/:permissionId/reset`
4. Single toggle → `PATCH /api/admin/permissions/:permissionId` with `{ featureKey, allowed }`.
5. Bulk save → `POST /api/admin/permissions/sync-bulk`.
6. Use `permissions/modules` for static catalog; use matrix API for current `allowed` state.
7. **Do not persist matrix to localStorage** — backend is the source of truth.

### Toggle Single Feature

```json
PATCH /api/admin/permissions/:permissionId
{
  "featureKey": "STUDENT_MANAGEMENT",
  "allowed": true
}
```

### Bulk Sync Payload

```json
POST /api/admin/permissions/sync-bulk
{
  "updates": [
    { "matrixId": "674a...", "action": "enable_all" },
    {
      "matrixId": "674b...",
      "action": "set_features",
      "features": [
        { "featureKey": "ADMIN_CREATION", "allowed": true }
      ]
    }
  ]
}
```

`action` enum: `enable_all` | `restrict_all` | `set_features`

---

## 9. RESPONSE FIELD MAPPING

### Role Entity (`formatRoleForAdmin`)

| Backend Field | Frontend Field | Display Label | Type | Notes |
|---------------|----------------|---------------|------|-------|
| `_id` | `id` | — | `string` | Primary key |
| `roleTitle` | `title` | Role Title | `string` | Table column, form field |
| `roleCode` | `code` | Role Code | `string` | Uppercase in DB |
| `status` | `status` | Status | `'ACTIVE' \| 'INACTIVE'` | Badge / toggle |
| `createdBy` | `createdBy` | Created By | `string \| null` | ObjectId ref User |
| `createdAt` | `createdAt` | Created At | `ISO string` | Formatted date |
| `updatedAt` | `updatedAt` | Updated At | `ISO string` | Formatted date |

### List Envelope

| Backend Field | Frontend Field | Display Label |
|---------------|----------------|---------------|
| `total` | `totalItems` | Total Roles |
| `page` | `currentPage` | Page |
| `limit` | `pageSize` | Per Page |
| `totalPages` | `totalPages` | Total Pages |
| `count` | `itemCount` | Items on Page |
| `data` | `items` | — |

### Dropdown Item

| Backend Field | Frontend Field | Display Label |
|---------------|----------------|---------------|
| `_id` | `value` | — |
| `roleTitle` | `label` | Role Title |
| `roleCode` | `roleCode` | Role Code |

### Permission Matrix Module Row

| Backend Field | Frontend Field | Display Label |
|---------------|----------------|---------------|
| `_id` | `matrixId` | — (used in PATCH URLs) |
| `moduleKey` | `moduleKey` | — |
| `moduleTitle` | `moduleTitle` | Module Name |
| `allowedCount` | `allowedCount` | Allowed |
| `restrictedCount` | `restrictedCount` | Restricted |
| `totalFeatures` | `totalFeatures` | Total |
| `permissions` | `features` | Feature toggles |

### Permission Feature

| Backend Field | Frontend Field | Display Label |
|---------------|----------------|---------------|
| `featureKey` | `featureKey` | — |
| `featureTitle` | `featureTitle` | Feature Name |
| `allowed` | `allowed` | Allowed |

---

## 10. VALIDATION RULES

### Create Role — `validations.manageRoleCreate`

| Field | Rule |
|-------|------|
| `roleTitle` | Required, string, min 2, max 100, trimmed |
| `roleCode` | Required, string, min 2, max 50, trimmed |
| `status` | Optional, enum: `ACTIVE`, `INACTIVE` |

### Update Role — `validations.manageRoleUpdate`

| Field | Rule |
|-------|------|
| `roleTitle` | Optional, string, min 2, max 100, trimmed |
| `roleCode` | Optional, string, min 2, max 50, trimmed |
| `status` | Optional, enum: `ACTIVE`, `INACTIVE` |
| Object | At least 1 key required (`.min(1)`) |

### Update Status — `validations.manageRoleStatus`

| Field | Rule |
|-------|------|
| `status` | Required, enum: `ACTIVE`, `INACTIVE` |

### Controller-Level Rules (beyond Joi)

| Rule | Endpoint | Message |
|------|----------|---------|
| `roleTitle` non-empty | POST | `Role title is required` |
| `roleCode` non-empty | POST | `Role code is required` |
| `roleCode` unique | POST, PUT | `Role code already exists` |
| At least one updatable field | PUT | `No valid fields to update` |
| `status` in enum | PUT (controller) | `Status must be ACTIVE or INACTIVE` |
| MongoDB unique index on `roleCode` | POST, PUT | `Role code already exists` (11000 → 400) |

### Permission Toggle — `validations.updateFeaturePermission`

| Field | Rule |
|-------|------|
| `featureKey` | Required, string, min 2, max 80, trimmed |
| `allowed` | Required, boolean |

### Bulk Sync — `validations.syncPermissionMatrixBulk`

| Field | Rule |
|-------|------|
| `updates` | Required array, min 1 item |
| `updates[].matrixId` | Required, 24-char hex ObjectId |
| `updates[].action` | Required, enum: `enable_all`, `restrict_all`, `set_features` |
| `updates[].features` | Required when `action === set_features`, min 1 item |
| `updates[].features[].featureKey` | Required, string, min 2, max 80 |
| `updates[].features[].allowed` | Required, boolean |

### Joi Validation Error Format (422)

```json
{
  "success": false,
  "statusCode": 11005,
  "message": "Validation failed",
  "data": null,
  "error": {
    "errors": [
      { "field": "roleTitle", "message": "\"roleTitle\" length must be at least 2 characters long" }
    ]
  },
  "errors": [
    { "field": "roleTitle", "message": "\"roleTitle\" length must be at least 2 characters long" }
  ]
}
```

---

## 11. ERROR HANDLING GUIDE

### 401 Unauthorized

**When:**

- Missing / malformed `Authorization` header
- Invalid or expired JWT
- User not found after decode

**Example (`protect` middleware):**

```json
{
  "success": false,
  "statusCode": 11001,
  "message": "Not authorized, no token",
  "data": null,
  "error": null
}
```

**Frontend strategy:** Clear token, redirect to login, dispatch `auth:unauthorized` event (matches `src/services/api.ts`).

### 403 Forbidden

**When:**

- Non–super-admin role
- AdminAccess JWT on super-admin-only routes
- Inactive user account

**Example (`allowRoles`):**

```json
{
  "message": "Access denied. Insufficient permissions.",
  "required": ["super_admin"],
  "current": "center_admin"
}
```

**Frontend strategy:** Show "You do not have permission" page; do not retry.

### 404 Not Found

**When:**

- Role ID does not exist (`GET`, `PUT`, `PATCH status`, `DELETE`)
- Permission matrix or feature not found (permission APIs)

**Example:**

```json
{ "success": false, "message": "Role not found" }
```

**Frontend strategy:** Toast + redirect to list or show empty state.

### 409 Conflict

**NOT USED** by Role Access endpoints. Duplicate `roleCode` returns **400**.

### 422 Validation Error

**When:** Joi validation fails on POST/PUT/PATCH with `validate()` middleware.

**Frontend strategy:** Map `error.errors[]` or `errors[]` to form field errors.

### 500 Server Error

**Example:**

```json
{
  "success": false,
  "message": "Server error",
  "error": "Cast to ObjectId failed for value \"invalid\" ..."
}
```

**Frontend strategy:** Generic error toast; log `error` field for debugging.

---

## 12. FRONTEND STATE MANAGEMENT GUIDE

Use **TanStack Query (React Query)** with the project's existing `src/services/api.ts` Axios instance.

### Query Keys

```typescript
export const roleAccessKeys = {
  all: ['roleAccess'] as const,
  list: (params: RoleListParams) => ['roleAccess', 'list', params] as const,
  detail: (id: string) => ['roleAccess', 'detail', id] as const,
  dropdown: () => ['roleAccess', 'dropdown'] as const,
  permissionModules: () => ['roleAccess', 'permissionModules'] as const,
  permissionMatrix: (roleId: string) => ['roleAccess', 'permissionMatrix', roleId] as const,
  permissionMatrixAll: (params?: { search?: string; roleId?: string }) =>
    ['roleAccess', 'permissionMatrixAll', params] as const,
};
```

### useQuery — List

```typescript
import { useQuery } from '@tanstack/react-query';
import { getRoleAccessList } from '@/services/roleAccessService';

export function useRoleAccessList(params: RoleListParams) {
  return useQuery({
    queryKey: roleAccessKeys.list(params),
    queryFn: () => getRoleAccessList(params),
    placeholderData: (prev) => prev,
  });
}
```

### useQuery — Detail

```typescript
export function useRoleAccess(id: string) {
  return useQuery({
    queryKey: roleAccessKeys.detail(id),
    queryFn: () => getRoleAccessById(id),
    enabled: Boolean(id),
  });
}
```

### useMutation — Create

```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query';

export function useCreateRoleAccess() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createRoleAccess,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: roleAccessKeys.all });
    },
  });
}
```

### useMutation — Update / Delete

Same pattern — invalidate `roleAccessKeys.all` on success.

### Cache Invalidation Strategy

| Action | Invalidate |
|--------|------------|
| Create role | `list`, `dropdown`, `permissionMatrixAll` |
| Update role | `list`, `detail(id)`, `dropdown` |
| Status change | `list`, `detail(id)`, `dropdown` |
| Delete role | `list`, `dropdown`, `permissionMatrix(roleId)` |
| Permission toggle | `permissionMatrix(roleId)`, `permissionMatrixAll` |

### Refetch Strategy

| Query | `staleTime` suggestion | Refetch |
|-------|------------------------|---------|
| List | 30s | On window focus optional |
| Dropdown | 5min | After any role mutation |
| Detail | 0 | On mount when editing |
| Permission matrix | 0 | After save |

---

## 13. FRONTEND SERVICE LAYER

**File:** `src/services/roleAccessService.ts`

```typescript
import api from './api';

export interface RoleListParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: 'ALL' | 'ACTIVE' | 'INACTIVE';
  sortBy?: 'createdAt' | 'roleTitle' | 'roleCode' | 'status';
  sortOrder?: 'asc' | 'desc';
}

export interface RoleRecord {
  _id: string;
  roleTitle: string;
  roleCode: string;
  status: 'ACTIVE' | 'INACTIVE';
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface RoleListResponse {
  success: boolean;
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  count: number;
  data: RoleRecord[];
}

export interface CreateRolePayload {
  roleTitle: string;
  roleCode: string;
  status?: 'ACTIVE' | 'INACTIVE';
}

export interface UpdateRolePayload {
  roleTitle?: string;
  roleCode?: string;
  status?: 'ACTIVE' | 'INACTIVE';
}

const BASE = '/api/admin/roles';
const PERM_BASE = '/api/admin/permissions';

export async function getRoleAccessList(params: RoleListParams = {}) {
  const { data } = await api.get<RoleListResponse>(BASE, { params });
  return data;
}

export async function getRoleAccessById(id: string) {
  const { data } = await api.get<{ success: boolean; data: RoleRecord }>(`${BASE}/${id}`);
  return data.data;
}

export async function createRoleAccess(payload: CreateRolePayload) {
  const { data } = await api.post<{ success: boolean; message: string; data: RoleRecord }>(
    BASE,
    payload
  );
  return data;
}

export async function updateRoleAccess(id: string, payload: UpdateRolePayload) {
  const { data } = await api.put<{ success: boolean; message: string; data: RoleRecord }>(
    `${BASE}/${id}`,
    payload
  );
  return data;
}

export async function updateRoleAccessStatus(id: string, status: 'ACTIVE' | 'INACTIVE') {
  const { data } = await api.patch<{ success: boolean; message: string; data: RoleRecord }>(
    `${BASE}/${id}/status`,
    { status }
  );
  return data;
}

export async function deleteRoleAccess(id: string) {
  const { data } = await api.delete<{ success: boolean; message: string }>(`${BASE}/${id}`);
  return data;
}

export async function getRoleDropdown() {
  const { data } = await api.get<{
    success: boolean;
    count: number;
    data: Array<{ _id: string; roleTitle: string; roleCode: string }>;
  }>(`${BASE}/dropdown`);
  return data.data;
}

export async function getPermissionModules() {
  const { data } = await api.get(`${PERM_BASE}/modules`);
  return data.data;
}

export async function getPermissionMatrixByRole(roleId: string) {
  const { data } = await api.get(`${PERM_BASE}/role/${roleId}`);
  return data.data;
}

export async function updateFeaturePermission(
  permissionId: string,
  payload: { featureKey: string; allowed: boolean }
) {
  const { data } = await api.patch(`${PERM_BASE}/${permissionId}`, payload);
  return data;
}

export async function syncPermissionMatrixBulk(payload: {
  updates: Array<{
    matrixId: string;
    action: 'enable_all' | 'restrict_all' | 'set_features';
    features?: Array<{ featureKey: string; allowed: boolean }>;
  }>;
}) {
  const { data } = await api.post(`${PERM_BASE}/sync-bulk`, payload);
  return data;
}
```

---

## 14. FRONTEND HOOKS

**File:** `src/hooks/useRoleAccess.ts`

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getRoleAccessList,
  getRoleAccessById,
  createRoleAccess,
  updateRoleAccess,
  updateRoleAccessStatus,
  deleteRoleAccess,
  getRoleDropdown,
  type RoleListParams,
  type CreateRolePayload,
  type UpdateRolePayload,
} from '@/services/roleAccessService';
import { roleAccessKeys } from './roleAccessKeys';

export function useRoleAccessList(params: RoleListParams) {
  return useQuery({
    queryKey: roleAccessKeys.list(params),
    queryFn: () => getRoleAccessList(params),
  });
}

export function useRoleAccess(id: string) {
  return useQuery({
    queryKey: roleAccessKeys.detail(id),
    queryFn: () => getRoleAccessById(id),
    enabled: Boolean(id),
  });
}

export function useRoleDropdown() {
  return useQuery({
    queryKey: roleAccessKeys.dropdown(),
    queryFn: getRoleDropdown,
    staleTime: 5 * 60 * 1000,
  });
}
```

**File:** `src/hooks/useCreateRoleAccess.ts`

```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createRoleAccess, type CreateRolePayload } from '@/services/roleAccessService';
import { roleAccessKeys } from './roleAccessKeys';

export function useCreateRoleAccess() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateRolePayload) => createRoleAccess(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: roleAccessKeys.all });
    },
  });
}
```

**File:** `src/hooks/useUpdateRoleAccess.ts`

```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateRoleAccess, updateRoleAccessStatus, type UpdateRolePayload } from '@/services/roleAccessService';
import { roleAccessKeys } from './roleAccessKeys';

export function useUpdateRoleAccess() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateRolePayload }) =>
      updateRoleAccess(id, payload),
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({ queryKey: roleAccessKeys.all });
      queryClient.invalidateQueries({ queryKey: roleAccessKeys.detail(id) });
    },
  });
}

export function useUpdateRoleAccessStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'ACTIVE' | 'INACTIVE' }) =>
      updateRoleAccessStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: roleAccessKeys.all });
    },
  });
}
```

**File:** `src/hooks/useDeleteRoleAccess.ts`

```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deleteRoleAccess } from '@/services/roleAccessService';
import { roleAccessKeys } from './roleAccessKeys';

export function useDeleteRoleAccess() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteRoleAccess(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: roleAccessKeys.all });
    },
  });
}
```

---

## 15. TABLE IMPLEMENTATION GUIDE

### Columns

| Column | Source Field | Render |
|--------|--------------|--------|
| Role Title | `roleTitle` | Plain text |
| Role Code | `roleCode` | Monospace badge |
| Status | `status` | `ACTIVE` → green badge; `INACTIVE` → gray/red badge |
| Created At | `createdAt` | Locale date/time |
| Actions | — | Edit, Toggle Status, Delete, (optional) Configure Permissions |

### Search

- Debounced input (300ms) → `search` query param
- Searches both title and code

### Filters

| UI Filter | Query Param | Options |
|-----------|-------------|---------|
| Status | `status` | All (omit), Active, Inactive |

> Use `GET /api/admin/roles` for filter options — **not** hardcoded role names.

### Pagination

- Server-side: bind `page`, `limit` to query params
- Display `total`, `totalPages` from response
- Page size options: 10, 25, 50, 100 (max 100 per backend)

### Sorting

- Map column clicks to `sortBy` + `sortOrder`
- Sortable columns: `roleTitle`, `roleCode`, `status`, `createdAt`

### Actions

| Action | API |
|--------|-----|
| Edit | Navigate to edit form → `GET /api/admin/roles/:id` |
| Activate / Deactivate | `PATCH /api/admin/roles/:id/status` |
| Delete | `DELETE /api/admin/roles/:id` with confirmation |
| Permissions | Navigate to matrix → `GET /api/admin/permissions/role/:roleId` |

### Status Rendering

```typescript
const statusConfig = {
  ACTIVE: { label: 'Active', variant: 'success' },
  INACTIVE: { label: 'Inactive', variant: 'secondary' },
} as const;
```

### Permission Rendering

**NOT on the Role Access list table** — permissions are on the separate matrix view. If showing a summary column, use `allowedCount` / `totalFeatures` from `GET /api/admin/permissions?roleId=...` (optional enhancement — requires extra API call per row).

---

## 16. FORM IMPLEMENTATION GUIDE

### Create Form

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| Role Title | `text` | Yes | min 2, max 100 |
| Role Code | `text` | Yes | min 2, max 50; auto-uppercase on blur |
| Status | `select` or `radio` | No | Default `ACTIVE` |

**No role dropdown on create** — user defines a new role.

### Edit Form

Load `GET /api/admin/roles/:id`, same fields as create.

`roleCode` is editable but must remain unique.

### View Form (Read-Only)

Same fields, disabled inputs. Optionally link to permission matrix.

### Field Types

| Field | Component |
|-------|-----------|
| `roleTitle` | Text input |
| `roleCode` | Text input (uppercase transform) |
| `status` | Select: Active / Inactive |

### Dropdowns

Only `status` is a static enum dropdown. **No role picker** on this form.

### Checkboxes

Used on **permission matrix** sub-view only — one per feature (`allowed`).

### Permission Matrix Rendering

1. Select role (from list row or role selector populated by `GET /api/admin/roles`).
2. Load `GET /api/admin/permissions/role/:roleId`.
3. Render modules as sections; features as checkboxes.
4. Save via `sync-bulk` or individual PATCH calls.

### Default Values

| Field | Create Default |
|-------|----------------|
| `roleTitle` | `''` |
| `roleCode` | `''` |
| `status` | `ACTIVE` |

### Validation (Client-Side — mirror backend)

```typescript
const roleTitleSchema = z.string().trim().min(2).max(100);
const roleCodeSchema = z.string().trim().min(2).max(50);
const statusSchema = z.enum(['ACTIVE', 'INACTIVE']).optional();
```

### Submission Flow

```
User submits form
  → Client validation
  → POST or PUT /api/admin/roles
  → On 201/200: toast success, invalidate queries, navigate to list
  → On 400: show message (e.g. duplicate code)
  → On 422: map field errors
```

---

## 17. COMPLETE FRONTEND DATA FLOW

```
┌─────────────────────────────────────────────────────────────────┐
│ PAGE LOAD                                                        │
│  1. Check auth token (super_admin)                               │
│  2. GET /api/admin/roles?page=1&limit=10                         │
│  3. Render table with pagination envelope                        │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ DROPDOWN LOAD (when needed — e.g. linked screens)                │
│  GET /api/admin/roles/dropdown → ACTIVE roles only               │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ LIST LOAD / SEARCH / FILTER / SORT                               │
│  User changes search/filter/sort/page                            │
│  → Debounce search → GET /api/admin/roles?...                    │
│  → Replace table rows from response.data                         │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ CREATE                                                           │
│  Open form → defaults applied                                    │
│  Submit → POST /api/admin/roles                                  │
│  Backend creates Role + PermissionMatrix rows                    │
│  → Invalidate list + dropdown                                    │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ EDIT                                                             │
│  GET /api/admin/roles/:id → populate form                        │
│  Submit → PUT /api/admin/roles/:id                               │
│  → Invalidate list + detail                                      │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ STATUS TOGGLE                                                    │
│  PATCH /api/admin/roles/:id/status { status }                    │
│  → INACTIVE roles disappear from dropdown API                    │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ DELETE                                                           │
│  Confirm → DELETE /api/admin/roles/:id                           │
│  → Cascade deletes PermissionMatrix                                │
│  → Invalidate list + dropdown                                    │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ PERMISSION MATRIX (optional linked flow)                         │
│  GET /api/admin/permissions/role/:roleId                         │
│  User toggles features                                           │
│  Save → POST /api/admin/permissions/sync-bulk                    │
│       or PATCH /api/admin/permissions/:permissionId              │
│  → Refetch matrix                                                │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ REFRESH                                                          │
│  Hard refresh page → list reloads from server                      │
│  Verify created/edited/deleted data persists                       │
└─────────────────────────────────────────────────────────────────┘
```

---

## 18. ROLE FILTERING RULE (VERY IMPORTANT)

### Which API Returns Roles

| Use Case | Endpoint | Roles Returned |
|----------|----------|----------------|
| **Role Access table** | `GET /api/admin/roles` | All roles (filterable by `status`) |
| **Dropdowns (assign role elsewhere)** | `GET /api/admin/roles/dropdown` | **ACTIVE only** |
| **User Management filter** | `GET /api/admin/user-roles` | ALL + STUDENT + dynamic roles (includes INACTIVE) — **not for Role Access** |

### Database Table

- **Collection:** `roles` (Mongoose model `Role`)
- **Fields:** `roleTitle`, `roleCode`, `status`, `createdBy`, timestamps

### Which Roles Are Valid

Any document in the `roles` collection returned by the APIs above.

**Seeded defaults** (created on server start if missing):

| roleTitle | roleCode | status |
|-----------|----------|--------|
| Super Admin | `SUPER_ADMIN` | ACTIVE |
| Center Admin | `CENTER_ADMIN` | ACTIVE |
| Employee | `EMPLOYEE` | ACTIVE |

Additional roles are created via `POST /api/admin/roles`.

### STRICT RULE

```
┌──────────────────────────────────────────────────────────────────┐
│  Frontend must ONLY display roles returned by backend APIs.       │
│  NO hardcoded role lists.                                        │
│  NO mock data.                                                   │
│  NO static enums for role names/codes.                           │
└──────────────────────────────────────────────────────────────────┘
```

If a role does not exist in the `roles` collection response, it **MUST NEVER** appear in:

- Create Form (N/A — user types new role)
- Edit Form role display (load from `GET /api/admin/roles/:id`)
- Filters (load from list API or `status=ALL`)
- Dropdowns (`GET /api/admin/roles/dropdown`)
- Permission Assignment role selector (`GET /api/admin/roles` or matrix API)

**Do not** hardcode `SUPER_ADMIN`, `CENTER_ADMIN`, `MENTOR_ADMIN`, etc. Always fetch dynamically.

### Static vs Dynamic Roles

| System | Source | Used For |
|--------|--------|----------|
| Legacy `User.role` | `users` collection enum | Login middleware `allowRoles()` |
| Dynamic `Role.roleCode` | `roles` collection | AdminAccess assignment, permission matrix |

These are **parallel systems**. Role Access screen manages the **dynamic** `roles` collection only.

---

## 19. CENTRALIZED API ARCHITECTURE

Integrate with the existing `src/services/api.ts`:

```typescript
// src/services/api.ts (existing pattern)
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30_000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// Request interceptor — Bearer token injection
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken') ?? localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor — global error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      window.dispatchEvent(new CustomEvent('auth:unauthorized'));
    }
    return Promise.reject(error);
  }
);
```

### Environment Variables

| Variable | Purpose |
|----------|---------|
| `VITE_API_BASE_URL` | Backend base URL (e.g. `http://localhost:5000`) |
| `VITE_AUTH_TOKEN_KEY` | localStorage key for JWT (default: `authToken`) |

### Usage in Role Access Service

```typescript
// Correct — relative paths, no hardcoded host
await api.get('/api/admin/roles');
await api.post('/api/admin/roles', payload);

// Wrong — never do this
await axios.get('http://localhost:5000/api/admin/roles');
```

### Login Before Role Access

```typescript
const { data } = await api.post('/api/auth/login-admin', { email, password });
const token = data.token; // nestDataOnly spreads token to root
localStorage.setItem('authToken', token);
```

---

## 20. FINAL IMPLEMENTATION CHECKLIST

Developer must verify:

- [ ] **List works** — `GET /api/admin/roles` returns paginated data
- [ ] **Search works** — `search` param filters `roleTitle` / `roleCode`
- [ ] **Filters work** — `status=ACTIVE|INACTIVE|ALL` behaves correctly
- [ ] **Create works** — `POST /api/admin/roles` persists to `roles` collection
- [ ] **Update works** — `PUT /api/admin/roles/:id` saves changes
- [ ] **Delete works** — `DELETE /api/admin/roles/:id` hard-deletes role + matrix
- [ ] **Status toggle works** — `PATCH /api/admin/roles/:id/status`
- [ ] **Permission matrix works** — toggles persist via `/api/admin/permissions/*` (not localStorage)
- [ ] **Role filtering works** — table/filter uses API data only
- [ ] **Dropdowns load dynamically** — `GET /api/admin/roles/dropdown` for ACTIVE roles
- [ ] **Backend validation respected** — 422 errors mapped to form fields
- [ ] **No hardcoded roles** — all role lists from API
- [ ] **No mock data** — all data from backend
- [ ] **TanStack Query integrated** — query keys, mutations, invalidation
- [ ] **Server persistence verified** — data survives hard refresh
- [ ] **Data saved successfully to database** — confirm via GET after create/update
- [ ] **Data visible after refresh** — list reflects latest server state
- [ ] **Super admin auth only** — AdminAccess token receives 403 on role routes
- [ ] **Existing functionality unchanged** — no backend modifications required

---

## APPENDIX A — APIs NOT AVAILABLE IN BACKEND

| Feature | Status |
|---------|--------|
| Role export (CSV/Excel) | NOT AVAILABLE IN BACKEND |
| Bulk role create/update/delete | NOT AVAILABLE IN BACKEND |
| Soft delete / archive for roles | NOT AVAILABLE IN BACKEND |
| Role assignment validation on delete | NOT AVAILABLE IN BACKEND |
| Menu / submenu dropdown APIs | NOT AVAILABLE IN BACKEND |
| HTTP 409 for duplicate roleCode | NOT AVAILABLE IN BACKEND (uses 400) |
| `statusCode` field in role JSON responses | NOT AVAILABLE IN BACKEND (legacy format) |
| View/Create/Update/Delete permission columns | NOT AVAILABLE IN BACKEND (boolean `allowed` per feature only) |

---

## APPENDIX B — Backend File Reference

```
app.js
  └── /api/admin → routes/adminRoutes.js
        ├── protect (all routes)
        ├── /roles → routes/roleRoutes.js
        │     ├── GET    /           → getRoles
        │     ├── GET    /dropdown   → getRolesDropdown
        │     ├── POST   /           → createRole
        │     ├── GET    /:id        → getRoleById
        │     ├── PUT    /:id        → updateRole
        │     ├── PATCH  /:id/status → updateRoleStatus
        │     └── DELETE /:id        → deleteRole
        └── /permissions → routes/permissionRoutes.js
              ├── GET    /modules
              ├── GET    /my-access
              ├── GET    /role/:roleId
              ├── GET    /
              ├── PATCH  /:permissionId
              ├── PATCH  /:permissionId/enable-all
              ├── PATCH  /:permissionId/restrict-all
              ├── PATCH  /:permissionId/reset
              └── POST   /sync-bulk
```

---

*Document generated from backend source. Do not modify backend code based on this document — modify the frontend to match the backend.*
