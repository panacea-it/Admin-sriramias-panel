# ADMIN MANAGEMENT FRONTEND INTEGRATION GUIDE

**Source of truth:** Backend implementation in this repository (Node.js / Express 5 / MongoDB).  
**Base URL:** `{{BASE_URL}}` (default dev: `http://localhost:5000`)  
**API prefix:** `/api/admin`  
**Last verified against:** `routes/adminAccessRoutes.js`, `controllers/adminAccessController.js`, `routes/roleRoutes.js`, `routes/permissionRoutes.js`, `routes/centerManagementRoutes.js`, `middleware/validation.js`, `models/AdminAccess.js`

---

## TABLE OF CONTENTS

1. [Module Overview](#module-overview)
2. [Authentication Requirements](#authentication-requirements)
3. [API Endpoints](#api-endpoints)
4. [List API](#list-api)
5. [Create Admin API](#create-admin-api)
6. [Update Admin API](#update-admin-api)
7. [Delete Admin API](#delete-admin-api)
8. [Status Management](#status-management)
9. [Role & Permission Management](#role--permission-management)
10. [Dropdown APIs](#dropdown-apis)
11. [File Uploads](#file-uploads)
12. [Error Handling](#error-handling)
13. [Frontend Implementation Guide](#frontend-implementation-guide)
14. [Centralized Service Layer](#centralized-service-layer)
15. [Frontend Table Mapping](#frontend-table-mapping)
16. [Form Field Mapping](#form-field-mapping)
17. [Integration Safety Checklist](#integration-safety-checklist)

---

## MODULE OVERVIEW

### Purpose

The **Admin Management** module governs **staff admin accounts** stored in the `AdminAccess` collection. These are operational users (mentors, content admins, finance admins, etc.) who authenticate via `AdminAccess` JWT (`authType: 'admin_access'`) and are assigned:

- A **Role** (`Role` model — dynamic RBAC role with `roleCode`)
- A **Center** (`Center` model — operational center)
- A **Permission Matrix** (per role, per module — `PermissionMatrix` model)

Super Admins (legacy `User` with `role: 'super_admin'`) manage this module via `/api/admin/admin-access`.

### Business Flow

```
Super Admin logs in (POST /api/auth/login-admin)
        │
        ▼
Bearer token on all /api/admin/* requests
        │
        ├── Create Role (optional) ──► Permission matrix auto-generated
        ├── Configure Permissions ──► PATCH /api/admin/permissions/*
        ├── Create Center (optional) ──► Required for admin assignment
        └── Create Admin Access ──► Assign role + center + credentials
                │
                ▼
        Admin logs in (POST /api/auth/login-admin)
                │
                ▼
        GET /api/admin/permissions/my-access ──► Sidebar / route gating
```

### Admin Lifecycle

| Stage | Backend State | API |
|-------|---------------|-----|
| Created | `accountStatus: true` → `status: "ACTIVE"` | `POST /api/admin/admin-access` |
| Active | Can log in; permissions enforced | — |
| Disabled | `accountStatus: false` → `status: "INACTIVE"` | `PATCH /api/admin/admin-access/:id/status` |
| Re-enabled | `accountStatus: true` | `PATCH /api/admin/admin-access/:id/status` |
| Deleted | **Hard delete** — record removed from DB | `DELETE /api/admin/admin-access/:id` |

There is **no soft delete**, **no archive**, and **no suspend** state for admin accounts. Status is binary: `ACTIVE` / `INACTIVE`.

### Role Relationships

- Every `AdminAccess` record **must** have `roleId` → `Role._id`.
- Role must be `status: "ACTIVE"` at create/update time.
- Role `roleCode` is stored uppercase (e.g. `MENTOR_ADMIN`, `CONTENT_ADMIN`).
- Seeded roles on startup: `SUPER_ADMIN`, `CENTER_ADMIN`, `EMPLOYEE` (`utils/roleSeed.js`).
- Additional roles are created via `POST /api/admin/roles`.

### Permission Relationships

- On role creation, `PermissionMatrix` rows are auto-created (one per module, all features `allowed: false`).
- Defaults from `config/rolePermissionDefaults.js` are applied once per role+module (`defaultsApplied` flag).
- Admin users inherit permissions from their assigned role.
- Super Admin (`User.role === 'super_admin'`) bypasses all permission checks.
- Feature keys are derived from titles: `"Student Management"` → `STUDENT_MANAGEMENT`.

### Related Screens (not AdminAccess CRUD but part of Users & Access)

| UI Area | Backend Prefix |
|---------|----------------|
| Admin list / CRUD | `/api/admin/admin-access` |
| Role Access (role types) | `/api/admin/roles` |
| Permission Matrix | `/api/admin/permissions` |
| Centre Management | `/api/admin/centers` |

### APIs That Do NOT Exist

The following were checked and **are not implemented** in the Admin Management module:

- Bulk admin actions (no bulk delete/status for `admin-access`)
- Export APIs (CSV/Excel)
- File upload APIs for admin profiles
- Admin list `status` query filter (documented in some guides but **not wired** in `getAdminAccessList`)
- `twoFactorEnabled`, `loginAlertEnabled`, `sessionTimeout` fields (not in `AdminAccess` model)

---

## AUTHENTICATION REQUIREMENTS

### Authorization Header

```
Authorization: Bearer <token>
```

Obtain token via:

| Endpoint | Purpose | Body |
|----------|---------|------|
| `POST /api/auth/login-admin` | **Required for Admin Management CRUD** | `{ "email": "...", "password": "..." }` |
| `POST /api/auth/login-super-admin` | Alias for super admin login | `{ "email": "...", "password": "..." }` |

**Login success response** (`authController.loginAdmin`):

```json
{
  "success": true,
  "statusCode": 10000,
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "674a1b2c3d4e5f6789012345",
    "name": "Super Admin",
    "email": "admin@example.com",
    "role": "super_admin"
  }
}
```

### Authentication Middleware

| Middleware | File | Behavior |
|------------|------|----------|
| `protect` | `middleware/authMiddleware.js` | Validates Bearer JWT. Sets `req.user` (legacy User) OR `req.adminAccess` (AdminAccess JWT). |
| `allowRoles(ROLES.SUPER_ADMIN)` | `middleware/roleMiddleware.js` | Requires `req.user.role === 'super_admin'`. **Blocks AdminAccess JWT entirely.** |

All routes under `/api/admin` use `router.use(protect)` in `routes/adminRoutes.js`.

### Authorization for Admin Management CRUD

| Requirement | Value |
|-------------|-------|
| Required role | `super_admin` (legacy `User` model) |
| Required permissions | None — role check only (`allowRoles`); no `checkPermission` middleware on admin-access routes |
| AdminAccess JWT | **Not authorized** for `/api/admin/admin-access`, `/roles`, `/permissions` (edit), `/centers` CRUD |

**Critical:** Frontend developers managing admins must authenticate as a **legacy super admin User**, not as an AdminAccess account — even if that account has `roleCode: SUPER_ADMIN`.

### JWT Payloads

| Auth type | Payload fields | Expiry |
|-----------|----------------|--------|
| User | `{ id, role, location }` | `1d` |
| AdminAccess | `{ id, authType: 'admin_access', roleId, roleCode, centerId, centerName }` | `JWT_ADMIN_EXPIRES_IN` env or `1h` |

### Exception: Staff-Accessible Endpoints

| Endpoint | Middleware | Who can call |
|----------|------------|--------------|
| `GET /api/admin/permissions/my-access` | `protect` only | Any authenticated User or AdminAccess |
| `GET /api/admin/centers/dropdown` | `protect` + `requireStaffAdmin` | Any active staff |
| `GET /api/centers/dropdown` | `protect` + `requireStaffAdmin` | Same handler, alternate mount in `app.js` |

---

## API ENDPOINTS

### Admin Access — Base: `/api/admin/admin-access`

All endpoints require: `protect` + `allowRoles(ROLES.SUPER_ADMIN)`.

---

### List Admin Users

**Method:** `GET`  
**Actual Route:** `/api/admin/admin-access`  
**Purpose:** Paginated list of all admin access accounts with search and filters.  
**Authentication:** Required  
**Permissions:** `super_admin` role only  

**Request Headers**

| Header | Required | Value |
|--------|----------|-------|
| `Authorization` | Yes | `Bearer <super_admin_token>` |
| `Content-Type` | No | — |

**Query Parameters**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `search` | string | `""` | Matches fullName, officialEmail, employeeId, contactNumber, role title/code, center name/code |
| `roleId` | ObjectId string | — | Exact role filter |
| `centerId` | ObjectId string | — | Exact center filter |
| `page` | number | `1` | Page number (min 1) |
| `limit` | number | `10` | Page size (min 1, max 100) |
| `sortBy` | string | `createdAt` | One of: `createdAt`, `fullName`, `officialEmail`, `employeeId` |
| `sortOrder` | string | `desc` | `asc` or `desc` |

**Success Response** `200`

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
      "fullName": "Maharaj Singh",
      "officialEmail": "maharaj@example.com",
      "contactNumber": "9876543210",
      "employeeId": "EMP001",
      "roleId": "674a1b2c3d4e5f6789012346",
      "roleTitle": "Content Admin",
      "roleCode": "CONTENT_ADMIN",
      "centerId": "674a1b2c3d4e5f6789012347",
      "centerName": "Hyderabad Center",
      "centerCode": "HYD01",
      "accountStatus": true,
      "status": "ACTIVE",
      "lastLoginAt": "2025-06-20T10:30:00.000Z",
      "createdBy": "674a1b2c3d4e5f6789012340",
      "createdAt": "2025-06-01T08:00:00.000Z",
      "updatedAt": "2025-06-20T10:30:00.000Z"
    }
  ]
}
```

**Error Responses:** See [Error Handling](#error-handling).

**Frontend Notes**

- Use `data` array for table rows; use `total`, `page`, `limit`, `totalPages` for pagination.
- Display `status` string (`ACTIVE`/`INACTIVE`), not raw `accountStatus` boolean.
- `status` query parameter is **not implemented** — filter client-side or request backend enhancement.

---

### Get Admin By ID

**Method:** `GET`  
**Actual Route:** `/api/admin/admin-access/:id`  
**Purpose:** Fetch a single admin record (view drawer / edit form prefill).  
**Authentication:** Required  
**Permissions:** `super_admin` role only  

**Path Variables**

| Name | Type | Required |
|------|------|----------|
| `id` | MongoDB ObjectId | Yes |

**Success Response** `200`

```json
{
  "success": true,
  "data": {
    "_id": "674a1b2c3d4e5f6789012345",
    "fullName": "Maharaj Singh",
    "officialEmail": "maharaj@example.com",
    "contactNumber": "9876543210",
    "employeeId": "EMP001",
    "roleId": "674a1b2c3d4e5f6789012346",
    "roleTitle": "Content Admin",
    "roleCode": "CONTENT_ADMIN",
    "centerId": "674a1b2c3d4e5f6789012347",
    "centerName": "Hyderabad Center",
    "centerCode": "HYD01",
    "accountStatus": true,
    "status": "ACTIVE",
    "lastLoginAt": null,
    "createdBy": "674a1b2c3d4e5f6789012340",
    "createdAt": "2025-06-01T08:00:00.000Z",
    "updatedAt": "2025-06-01T08:00:00.000Z"
  }
}
```

**Error Responses**

| HTTP | Message |
|------|---------|
| 404 | `Admin user not found` |

**Frontend Notes**

- This is the **only** detail endpoint. There is no separate "Get Admin Details" API.
- Password is never returned.

---

### Create Admin

**Method:** `POST`  
**Actual Route:** `/api/admin/admin-access`  
**Purpose:** Create a new admin access account.  
**Authentication:** Required  
**Permissions:** `super_admin` role only  

**Request Headers**

| Header | Required | Value |
|--------|----------|-------|
| `Authorization` | Yes | `Bearer <super_admin_token>` |
| `Content-Type` | Yes | `application/json` |

**Request Body** — validated by `manageAdminAccessCreate` (Joi, `stripUnknown: true`)

```json
{
  "fullName": "Maharaj Singh",
  "officialEmail": "maharaj@example.com",
  "contactNumber": "9876543210",
  "employeeId": "EMP001",
  "roleId": "674a1b2c3d4e5f6789012346",
  "centerId": "674a1b2c3d4e5f6789012347",
  "password": "secure123",
  "confirmPassword": "secure123"
}
```

**Validation Rules**

| Field | Required | Rules |
|-------|----------|-------|
| `fullName` | Yes | string, min 2, max 150, trimmed |
| `officialEmail` | Yes | valid email, trimmed, stored lowercase |
| `contactNumber` | Yes | 10-digit Indian mobile: `/^[6-9]\d{9}$/` |
| `employeeId` | Yes | string, min 2, max 30, trimmed, stored uppercase |
| `roleId` | Yes | 24-char hex ObjectId |
| `centerId` | Yes | 24-char hex ObjectId |
| `password` | Yes | string, min 6 |
| `confirmPassword` | Yes | must equal `password` |

**Additional Controller Validation**

- Role must exist and be `ACTIVE`
- Center must exist and not be `DISABLED`
- Email and employeeId must be unique

**Success Response** `201`

```json
{
  "success": true,
  "message": "Admin access created successfully",
  "data": { /* formatAdminAccessForAdmin — same shape as Get By ID */ }
}
```

**Error Responses**

| HTTP | Message |
|------|---------|
| 400 | `Password is required and must be at least 6 characters` |
| 400 | `Passwords do not match` |
| 400 | `Email already exists` |
| 400 | `Employee ID already exists` |
| 404 | `Role not found` |
| 400 | `Role is not active` |
| 404 | `Center not found` |
| 400 | `Center is disabled` |
| 422 | Joi validation errors |

---

### Update Admin

**Method:** `PUT`  
**Actual Route:** `/api/admin/admin-access/:id`  
**Purpose:** Update admin profile fields and/or password.  
**Authentication:** Required  
**Permissions:** `super_admin` role only  

**Path Variables**

| Name | Type | Required |
|------|------|----------|
| `id` | MongoDB ObjectId | Yes |

**Request Body** — validated by `manageAdminAccessUpdate` (min 1 field)

```json
{
  "fullName": "Updated Name",
  "officialEmail": "updated@example.com",
  "contactNumber": "9876543211",
  "employeeId": "EMP002",
  "roleId": "674a1b2c3d4e5f6789012346",
  "centerId": "674a1b2c3d4e5f6789012347",
  "password": "newpass123",
  "confirmPassword": "newpass123"
}
```

**Editable Fields**

| Field | Editable | Notes |
|-------|----------|-------|
| `fullName` | Yes | min 2, max 150 |
| `officialEmail` | Yes | unique check |
| `contactNumber` | Yes | 10-digit Indian mobile |
| `employeeId` | Yes | unique check, stored uppercase |
| `roleId` | Yes | must be active role |
| `centerId` | Yes | must not be disabled |
| `password` | Yes | min 6; requires `confirmPassword` |
| `confirmPassword` | Conditional | Required when `password` is sent |

**Non-Editable Fields**

- `_id`, `accountStatus` (use status endpoint), `lastLoginAt`, `createdBy`, `createdAt`, `updatedAt`
- Status changes via `PATCH /:id/status` only

**Success Response** `200`

```json
{
  "success": true,
  "message": "Admin access updated successfully",
  "data": { /* updated admin record */ }
}
```

**Error Responses**

| HTTP | Message |
|------|---------|
| 400 | `No valid fields to update` |
| 400 | `Password must be at least 6 characters` |
| 400 | `Passwords do not match` |
| 400 | `Email already exists` |
| 400 | `Employee ID already exists` |
| 400 | `Duplicate email or employee ID` |
| 404 | `Admin user not found` |

---

### Update Admin Status

**Method:** `PATCH`  
**Actual Route:** `/api/admin/admin-access/:id/status`  
**Purpose:** Enable or disable an admin account.  
**Authentication:** Required  
**Permissions:** `super_admin` role only  

**Request Body** — validated by `updateAdminAccessStatus`

```json
{
  "status": true
}
```

| Field | Type | Description |
|-------|------|-------------|
| `status` | boolean | `true` = ACTIVE (enabled), `false` = INACTIVE (disabled) |

**Success Response** `200`

```json
{
  "success": true,
  "message": "Admin user enabled successfully",
  "status": "ACTIVE",
  "data": { /* formatAdminAccessForAdmin */ },
  "summary": {
    "id": "674a1b2c3d4e5f6789012345",
    "fullName": "Maharaj Singh",
    "status": "ACTIVE",
    "permissions": {
      "canView": true,
      "canEdit": true,
      "canDelete": true
    }
  }
}
```

**Error Responses**

| HTTP | Message |
|------|---------|
| 404 | `Admin user not found` |

**Frontend Notes**

- Request body uses **boolean**; response uses **string** `ACTIVE`/`INACTIVE`.
- Disabled admins cannot authenticate (`protect` returns 403 `Account is disabled`).

---

### Delete Admin

**Method:** `DELETE`  
**Actual Route:** `/api/admin/admin-access/:id`  
**Purpose:** Permanently delete an admin account.  
**Authentication:** Required  
**Permissions:** `super_admin` role only  

**Success Response** `200`

```json
{
  "success": true,
  "message": "Admin user permanently deleted",
  "deleteType": "HARD",
  "data": { /* deleted record summary */ }
}
```

**Error Responses**

| HTTP | Message |
|------|---------|
| 400 | `Invalid admin user ID` |
| 404 | `Admin user not found` |

**Restrictions**

- Hard delete only — no undo, no soft delete flag.
- No dependency check before delete (record is removed unconditionally if found).

---

### Mentor Admins Dropdown

**Method:** `GET`  
**Actual Route:** `/api/admin/admin-access/mentors/dropdown`  
**Purpose:** Dropdown of admins with `roleCode = MENTOR_ADMIN` only.  
**Authentication:** Required (`super_admin`)  

**Query Parameters**

| Parameter | Type | Description |
|-----------|------|-------------|
| `search` | string | Filters fullName, officialEmail, employeeId |
| `centerId` | ObjectId | Optional center filter |

**Success Response** `200`

```json
{
  "success": true,
  "count": 2,
  "data": [
    {
      "_id": "674a1b2c3d4e5f6789012345",
      "fullName": "Mentor One",
      "officialEmail": "mentor@example.com",
      "employeeId": "MEN001",
      "centerId": "674a1b2c3d4e5f6789012347",
      "centerName": "Hyderabad Center",
      "centerCode": "HYD01",
      "roleCode": "MENTOR_ADMIN",
      "roleTitle": "Mentor Admin"
    }
  ]
}
```

Returns `{ success: true, count: 0, data: [] }` if `MENTOR_ADMIN` role does not exist.

---

## ROLE ENDPOINTS — Base: `/api/admin/roles`

All require `super_admin`.

### List Roles

**Method:** `GET` `/api/admin/roles`

**Query Parameters:** `search`, `status` (`ALL`|`ACTIVE`|`INACTIVE`), `page` (default 1), `limit` (default 10, max 100), `sortBy` (`createdAt`|`roleTitle`|`roleCode`|`status`), `sortOrder` (`asc`|`desc`)

**Success Response** `200` — same pagination envelope as admin list; `data[]`:

```json
{
  "_id": "...",
  "roleTitle": "Content Admin",
  "roleCode": "CONTENT_ADMIN",
  "status": "ACTIVE",
  "createdBy": "...",
  "createdAt": "...",
  "updatedAt": "..."
}
```

### Roles Dropdown

**Method:** `GET` `/api/admin/roles/dropdown`  
**Purpose:** Active roles for admin create/edit form.

```json
{
  "success": true,
  "count": 5,
  "data": [
    { "_id": "...", "roleTitle": "Content Admin", "roleCode": "CONTENT_ADMIN" }
  ]
}
```

### Create Role

**Method:** `POST` `/api/admin/roles`

```json
{
  "roleTitle": "Content Admin",
  "roleCode": "CONTENT_ADMIN",
  "status": "ACTIVE"
}
```

| Field | Required | Rules |
|-------|----------|-------|
| `roleTitle` | Yes | min 2, max 100 |
| `roleCode` | Yes | min 2, max 50, stored uppercase |
| `status` | No | `ACTIVE` (default) or `INACTIVE` |

**Side effect:** Permission matrix rows auto-created; defaults applied.

### Get Role By ID

**Method:** `GET` `/api/admin/roles/:id`

### Update Role

**Method:** `PUT` `/api/admin/roles/:id` — min 1 of `roleTitle`, `roleCode`, `status`

### Update Role Status

**Method:** `PATCH` `/api/admin/roles/:id/status`

```json
{ "status": "ACTIVE" }
```

Status enum: `ACTIVE` | `INACTIVE`

### Delete Role

**Method:** `DELETE` `/api/admin/roles/:id`  
**Side effect:** Deletes all `PermissionMatrix` rows for the role, then hard-deletes role.

---

## PERMISSION ENDPOINTS — Base: `/api/admin/permissions`

### Get Permission Module Config

**Method:** `GET` `/api/admin/permissions/modules`  
**Auth:** `super_admin`

Returns all 8 modules and feature keys from `config/permissionModules.js`.

### Get My Permissions

**Method:** `GET` `/api/admin/permissions/my-access`  
**Auth:** Any authenticated token (`protect` only)

**Super Admin response:**

```json
{
  "success": true,
  "isSuperAdmin": true,
  "message": "Full access — super admin bypass",
  "data": [ /* full permissionModules config */ ]
}
```

**AdminAccess response:**

```json
{
  "success": true,
  "isSuperAdmin": false,
  "roleId": "...",
  "data": [
    {
      "moduleKey": "USERS_ACCESS",
      "moduleTitle": "Users & Access",
      "features": [
        { "featureKey": "ADMIN_CREATION", "featureTitle": "Admin Creation" }
      ]
    }
  ]
}
```

### Get Permission Matrix (all roles)

**Method:** `GET` `/api/admin/permissions`  
**Query:** `search` (role title/code), `roleId`

### Get Permission Matrix By Role

**Method:** `GET` `/api/admin/permissions/role/:roleId`

### Update Feature Permission

**Method:** `PATCH` `/api/admin/permissions/:permissionId`

```json
{
  "featureKey": "ADMIN_CREATION",
  "allowed": true
}
```

`:permissionId` is the `PermissionMatrix` document `_id` (module row), not role ID.

### Enable All / Restrict All / Reset Module

| Method | Route | Effect |
|--------|-------|--------|
| PATCH | `/api/admin/permissions/:permissionId/enable-all` | All features `allowed: true` |
| PATCH | `/api/admin/permissions/:permissionId/restrict-all` | All features `allowed: false` |
| PATCH | `/api/admin/permissions/:permissionId/reset` | All features `allowed: false` (default) |

### Bulk Sync Permission Matrix

**Method:** `POST` `/api/admin/permissions/sync-bulk`

```json
{
  "updates": [
    {
      "matrixId": "674a1b2c3d4e5f6789012345",
      "action": "enable_all"
    },
    {
      "matrixId": "674a1b2c3d4e5f6789012346",
      "action": "set_features",
      "features": [
        { "featureKey": "ADMIN_CREATION", "allowed": true },
        { "featureKey": "ROLE_ASSIGNMENT", "allowed": false }
      ]
    }
  ]
}
```

`action` enum: `enable_all` | `restrict_all` | `set_features`  
When `action` is `set_features`, `features` array is required (min 1 item).

---

## CENTRE ENDPOINTS — Base: `/api/admin/centers`

Used by admin forms for center assignment. All CRUD requires `super_admin` except dropdown.

### Centres Dropdown

**Method:** `GET` `/api/admin/centers/dropdown` or `GET /api/centers/dropdown`  
**Auth:** `protect` + `requireStaffAdmin`

```json
{
  "success": true,
  "count": 3,
  "data": [
    {
      "_id": "...",
      "centerName": "Hyderabad Center",
      "centerCode": "HYD01",
      "city": "Hyderabad",
      "state": "Telangana"
    }
  ]
}
```

### Centre Bulk Status (only bulk action in module)

**Method:** `PATCH` `/api/admin/centers/bulk-status`

```json
{
  "centerIds": ["674a1b2c3d4e5f6789012345", "674a1b2c3d4e5f6789012346"],
  "status": "DISABLED"
}
```

| Field | Rules |
|-------|-------|
| `centerIds` | Array of ObjectIds, min 1, max 100 |
| `status` | `ACTIVE` \| `DISABLED` \| `INACTIVE` (`INACTIVE` normalized to `DISABLED`) |

---

## LIST API

### Admin List — Full Reference

**Endpoint:** `GET /api/admin/admin-access`

### Search Parameters

| Param | Matches |
|-------|---------|
| `search` | `fullName`, `officialEmail`, `employeeId`, `contactNumber`, role title, role code, center name, center code |

Search is case-insensitive regex. Single search box covers all fields.

### Pagination Parameters

| Param | Default | Min | Max |
|-------|---------|-----|-----|
| `page` | `1` | `1` | — |
| `limit` | `10` | `1` | `100` |

### Filter Parameters

| Param | Type | Behavior |
|-------|------|----------|
| `roleId` | ObjectId | Exact match on `roleId` |
| `centerId` | ObjectId | Exact match on `centerId` |

### Sort Parameters

| Param | Default | Allowed values |
|-------|---------|----------------|
| `sortBy` | `createdAt` | `createdAt`, `fullName`, `officialEmail`, `employeeId` |
| `sortOrder` | `desc` | `asc`, `desc` |

### Example Request

```
GET /api/admin/admin-access?search=maharaj&roleId=674a1b2c3d4e5f6789012346&page=1&limit=10&sortBy=fullName&sortOrder=asc
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

### Example Response

See [List Admin Users](#list-admin-users) success response above.

---

## CREATE ADMIN API

### Complete Payload

```json
{
  "fullName": "Maharaj Singh",
  "officialEmail": "maharaj@example.com",
  "contactNumber": "9876543210",
  "employeeId": "EMP001",
  "roleId": "674a1b2c3d4e5f6789012346",
  "centerId": "674a1b2c3d4e5f6789012347",
  "password": "secure123",
  "confirmPassword": "secure123"
}
```

### Field-by-Field Explanation

| Field | UI Label Suggestion | Required | Notes |
|-------|----------------------|----------|-------|
| `fullName` | Full Name | Yes | Display name |
| `officialEmail` | Official Email | Yes | Login email; unique |
| `contactNumber` | Contact Number | Yes | Indian 10-digit mobile |
| `employeeId` | Employee ID | Yes | Unique; auto-uppercased |
| `roleId` | Role | Yes | Dropdown from `GET /api/admin/roles/dropdown` |
| `centerId` | Center | Yes | Dropdown from `GET /api/centers/dropdown` |
| `password` | Password | Yes | Min 6 chars; bcrypt-hashed server-side |
| `confirmPassword` | Confirm Password | Yes | Must match password |

### Relationships

- `roleId` → must reference active `Role`
- `centerId` → must reference non-disabled `Center`
- `createdBy` → set server-side from `req.user._id`

### Dropdown Mapping for Create Form

| Form Field | API | Label Field | Value Field |
|------------|-----|-------------|-------------|
| Role | `GET /api/admin/roles/dropdown` | `roleTitle` | `_id` |
| Center | `GET /api/centers/dropdown` | `centerName` | `_id` |

---

## UPDATE ADMIN API

### Update Restrictions

- At least one updatable field required (or password).
- Cannot update `accountStatus` via PUT — use `PATCH /:id/status`.
- Password change requires both `password` and `confirmPassword`.
- Role/center changes re-validate active role and non-disabled center.

### Partial Update Example

```json
{
  "fullName": "Updated Name",
  "roleId": "674a1b2c3d4e5f6789012348"
}
```

---

## DELETE ADMIN API

| Property | Value |
|----------|-------|
| Delete type | **Hard delete** (`deleteType: "HARD"`) |
| Soft delete | Not supported |
| Dependencies | No cascade checks |
| Restrictions | Valid ObjectId required |
| Error: not found | 404 `Admin user not found` |
| Error: invalid ID | 400 `Invalid admin user ID` |

---

## STATUS MANAGEMENT

### Admin Account Status

| Display | DB Field | API Request (`PATCH /status`) | API Response |
|---------|----------|-------------------------------|--------------|
| Active | `accountStatus: true` | `{ "status": true }` | `"status": "ACTIVE"` |
| Inactive | `accountStatus: false` | `{ "status": false }` | `"status": "INACTIVE"` |

### Allowed Transitions

```
ACTIVE ──(status: false)──► INACTIVE
INACTIVE ──(status: true)──► ACTIVE
```

No suspend, archive, or pending states exist for admin accounts.

### Role Status (separate entity)

| Value | Meaning |
|-------|---------|
| `ACTIVE` | Role can be assigned to new admins |
| `INACTIVE` | Role cannot be assigned; existing admins with inactive role may fail validation on update |

### Center Status (affects admin assignment)

| Value | Effect on admin create/update |
|-------|-------------------------------|
| `ACTIVE` | Allowed |
| `DISABLED` | Rejected with `Center is disabled` |

---

## ROLE & PERMISSION MANAGEMENT

### RBAC Flow

```
Role (roleCode)
    │
    ├──► PermissionMatrix (per moduleKey)
    │         └── permissions[]: { featureKey, featureTitle, allowed }
    │
    └──► AdminAccess.roleId
              │
              ▼
         Login → JWT with roleId, roleCode
              │
              ▼
         GET /permissions/my-access → allowed features for UI
              │
              ▼
         checkPermission(module, feature) on protected routes
```

### Permission Modules (8)

| moduleKey | moduleTitle |
|-----------|-------------|
| `ACADEMICS` | Academics |
| `TEST_MANAGEMENT` | Test Management |
| `USERS_ACCESS` | Users & Access |
| `ENGAGEMENT_CRM` | Engagement & CRM |
| `CONTENT_MARKETING` | Content & Marketing |
| `FINANCE_OPERATIONS` | Finance Operations |
| `OPERATIONS` | Operations |
| `SYSTEM_TOOLS` | System Tools |

Full feature lists: `config/permissionModules.js`.

### Frontend Rendering Requirements

1. **Admin Management CRUD screen:** Gate on `super_admin` login (not permission matrix).
2. **Sidebar / navigation:** Call `GET /api/admin/permissions/my-access` after login.
3. **Permission Matrix screen:** Use `GET /api/admin/permissions`; save via `PATCH` per feature or `POST /sync-bulk`.
4. **Role assignment dropdown:** Only show roles from `GET /api/admin/roles/dropdown` (ACTIVE only).

### Role Assignment

- Assigned at admin create/update via `roleId` field.
- No separate "assign role" endpoint.

### Permission Assignment

- Per role via Permission Matrix APIs.
- Not per-user — permissions are role-based.

---

## DROPDOWN APIs

| Route | Auth | Label Field | Value Field | Usage |
|-------|------|-------------|-------------|-------|
| `GET /api/admin/roles/dropdown` | super_admin | `roleTitle` | `_id` | Admin create/edit role select |
| `GET /api/centers/dropdown` | staff admin | `centerName` | `_id` | Admin create/edit center select |
| `GET /api/admin/centers/dropdown` | staff admin | `centerName` | `_id` | Same as above (admin prefix) |
| `GET /api/admin/admin-access/mentors/dropdown` | super_admin | `fullName` | `_id` | Mentor assignment (MENTOR_ADMIN only) |
| `GET /api/admin/user-roles` | super_admin | `label` | `value` | Unified users list role filter |
| `GET /api/admin/user-centers` | super_admin | `label` | `value` | Unified users list center filter |
| `GET /api/admin/centers/states` | super_admin | state name | state name | Centre create/edit state select |

### User Roles Dropdown Response (`GET /api/admin/user-roles`)

```json
{
  "success": true,
  "statusCode": 10000,
  "message": "User roles fetched successfully",
  "data": {
    "count": 6,
    "data": [
      { "value": "ALL", "label": "All Roles" },
      { "value": "STUDENT", "label": "Student", "roleCode": "STUDENT" },
      { "value": "674a1b2c...", "label": "Content Admin", "roleCode": "CONTENT_ADMIN", "status": "ACTIVE" }
    ]
  }
}
```

### User Centers Dropdown Response (`GET /api/admin/user-centers`)

```json
{
  "success": true,
  "statusCode": 10000,
  "message": "User centers fetched successfully",
  "data": {
    "count": 4,
    "data": [
      { "value": "ALL", "label": "All Centers" },
      { "value": "674a1b2c...", "label": "Hyderabad Center", "centerCode": "HYD01", "city": "Hyderabad", "state": "Telangana" }
    ]
  }
}
```

---

## FILE UPLOADS

**No file upload APIs exist** in the Admin Management module. Admin profiles do not support avatar or document uploads. Static files are served at `/uploads` for unrelated modules.

---

## ERROR HANDLING

### Standard Envelopes

**Legacy controllers** (admin-access, roles, permissions, centers):

```json
{
  "success": false,
  "message": "Human-readable error message",
  "error": "optional error detail string"
}
```

**apiResponse controllers** (user dropdowns, auth):

```json
{
  "success": false,
  "statusCode": 11001,
  "message": "Not authorized, no token",
  "data": null,
  "error": null
}
```

`responseNormalizer` middleware may add `statusCode` and wrap payloads on legacy responses.

### HTTP Status Codes

#### 400 Bad Request

```json
{ "success": false, "message": "Email already exists" }
```

Common messages:
- `Password is required and must be at least 6 characters`
- `Passwords do not match`
- `Employee ID already exists`
- `Role is not active`
- `Center is disabled`
- `No valid fields to update`
- `Invalid admin user ID`
- `Status must be ACTIVE or INACTIVE`
- `Role code already exists`

#### 401 Unauthorized

```json
{
  "success": false,
  "statusCode": 11001,
  "message": "Not authorized, no token",
  "data": null,
  "error": null
}
```

Also: `Not authorized, token failed`, `Not authorized, admin not found`, `User not found`

#### 403 Forbidden

**allowRoles failure:**

```json
{
  "message": "Access denied. Insufficient permissions.",
  "required": ["super_admin"],
  "current": "center_admin"
}
```

**AdminAccess on super-admin route:**

```json
{
  "success": false,
  "message": "Counselors (Admin Access) cannot use center enquiry routes. Use /api/crm/enquiries instead.",
  "hint": "Login: POST /api/auth/login with roleCode COUNSELING_ADMIN"
}
```

**Disabled account:**

```json
{
  "success": false,
  "statusCode": 11002,
  "message": "Account is disabled"
}
```

**Permission middleware:**

```json
{
  "success": false,
  "message": "Permission denied",
  "moduleKey": "USERS_ACCESS",
  "featureKey": "ADMIN_CREATION"
}
```

#### 404 Not Found

```json
{ "success": false, "message": "Admin user not found" }
```

Also: `Role not found`, `Center not found`, `Permission matrix not found`, `Feature not found`

#### 409 Conflict

Used by `apiResponse.sendConflict` in some modules. Admin-access controllers use **400** for duplicate email/employeeId instead of 409.

#### 422 Validation Error

```json
{
  "success": false,
  "statusCode": 11005,
  "message": "Validation failed",
  "data": null,
  "error": {
    "errors": [
      {
        "field": "contactNumber",
        "message": "\"contactNumber\" with value \"123\" fails to match the required pattern: /^[6-9]\\d{9}$/"
      }
    ]
  }
}
```

Joi validation uses `abortEarly: false` (all errors returned) and `stripUnknown: true`.

#### 429 Too Many Requests

Auth routes are rate-limited:

```json
{
  "success": false,
  "message": "Too many login attempts, please try again later"
}
```

#### 500 Internal Server Error

```json
{
  "success": false,
  "message": "Server error",
  "error": "Error detail message"
}
```

---

## FRONTEND IMPLEMENTATION GUIDE

### Recommended Structure

```
src/
├── services/
│   └── adminManagementService.ts
├── hooks/
│   ├── useAdmins.ts
│   ├── useCreateAdmin.ts
│   ├── useUpdateAdmin.ts
│   └── useDeleteAdmin.ts
```

### TanStack Query Integration

#### Query Keys

```typescript
export const adminKeys = {
  all: ['admins'] as const,
  lists: () => [...adminKeys.all, 'list'] as const,
  list: (params: AdminListParams) => [...adminKeys.lists(), params] as const,
  details: () => [...adminKeys.all, 'detail'] as const,
  detail: (id: string) => [...adminKeys.details(), id] as const,
  rolesDropdown: () => ['roles', 'dropdown'] as const,
  centersDropdown: () => ['centers', 'dropdown'] as const,
};
```

#### List Query (`useAdmins.ts`)

```typescript
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { adminManagementService } from '../services/adminManagementService';
import { adminKeys } from './adminKeys';

export function useAdmins(params: AdminListParams) {
  return useQuery({
    queryKey: adminKeys.list(params),
    queryFn: () => adminManagementService.getAdmins(params),
    placeholderData: keepPreviousData,
  });
}
```

#### Create Mutation (`useCreateAdmin.ts`)

```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { adminManagementService } from '../services/adminManagementService';
import { adminKeys } from './adminKeys';

export function useCreateAdmin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: adminManagementService.createAdmin,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.lists() });
    },
  });
}
```

#### Update Mutation (`useUpdateAdmin.ts`)

```typescript
export function useUpdateAdmin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateAdminPayload }) =>
      adminManagementService.updateAdmin(id, payload),
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({ queryKey: adminKeys.lists() });
      queryClient.invalidateQueries({ queryKey: adminKeys.detail(id) });
    },
  });
}
```

#### Delete Mutation (`useDeleteAdmin.ts`)

```typescript
export function useDeleteAdmin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => adminManagementService.deleteAdmin(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.lists() });
    },
  });
}
```

#### Status Toggle Mutation

```typescript
export function useToggleAdminStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: boolean }) =>
      adminManagementService.updateAdminStatus(id, status),
    onMutate: async ({ id, status }) => {
      await queryClient.cancelQueries({ queryKey: adminKeys.lists() });
      // Optional optimistic update on list cache
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.lists() });
    },
  });
}
```

### Error Handling

```typescript
function handleApiError(error: unknown) {
  if (isAxiosError(error)) {
    const data = error.response?.data;
    if (error.response?.status === 422 && data?.error?.errors) {
      return mapJoiErrorsToForm(data.error.errors);
    }
    return data?.message || 'Request failed';
  }
  return 'Unexpected error';
}
```

### Loading States

| Action | Loading indicator |
|--------|-------------------|
| List fetch | `isLoading` / `isFetching` from `useAdmins` |
| Create | `isPending` from `useCreateAdmin` |
| Update | `isPending` from `useUpdateAdmin` |
| Delete | `isPending` from `useDeleteAdmin` + confirm dialog |
| Status toggle | Per-row `isPending` with mutation variables |

### Pagination Handling

```typescript
const { data } = useAdmins({ page, limit, search, roleId, centerId, sortBy, sortOrder });

const rows = data?.data ?? [];
const total = data?.total ?? 0;
const totalPages = data?.totalPages ?? 0;
```

### Search & Filter Handling

- Debounce `search` input (300–500ms) before updating query params.
- `roleId` and `centerId` filters: pass ObjectId strings from dropdowns.
- Reset `page` to `1` when search/filters change.

---

## CENTRALIZED SERVICE LAYER

```typescript
// src/services/adminManagementService.ts
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5000';

const api = axios.create({ baseURL: API_BASE });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('super_admin_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ─── Types (match backend responses) ───────────────────────────────────────

export interface AdminRecord {
  _id: string;
  fullName: string;
  officialEmail: string;
  contactNumber: string;
  employeeId: string;
  roleId: string;
  roleTitle: string | null;
  roleCode: string | null;
  centerId: string;
  centerName: string | null;
  centerCode: string | null;
  accountStatus: boolean;
  status: 'ACTIVE' | 'INACTIVE';
  lastLoginAt: string | null;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AdminListParams {
  search?: string;
  roleId?: string;
  centerId?: string;
  page?: number;
  limit?: number;
  sortBy?: 'createdAt' | 'fullName' | 'officialEmail' | 'employeeId';
  sortOrder?: 'asc' | 'desc';
}

export interface AdminListResponse {
  success: boolean;
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  count: number;
  data: AdminRecord[];
}

export interface CreateAdminPayload {
  fullName: string;
  officialEmail: string;
  contactNumber: string;
  employeeId: string;
  roleId: string;
  centerId: string;
  password: string;
  confirmPassword: string;
}

export interface UpdateAdminPayload {
  fullName?: string;
  officialEmail?: string;
  contactNumber?: string;
  employeeId?: string;
  roleId?: string;
  centerId?: string;
  password?: string;
  confirmPassword?: string;
}

export interface DropdownRole {
  _id: string;
  roleTitle: string;
  roleCode: string;
}

export interface DropdownCenter {
  _id: string;
  centerName: string;
  centerCode: string;
  city: string;
  state: string;
}

// ─── Service ────────────────────────────────────────────────────────────────

export const adminManagementService = {
  /** GET /api/admin/admin-access */
  getAdmins: async (params: AdminListParams): Promise<AdminListResponse> => {
    const { data } = await api.get<AdminListResponse>('/api/admin/admin-access', { params });
    return data;
  },

  /** GET /api/admin/admin-access/:id */
  getAdminById: async (id: string): Promise<AdminRecord> => {
    const { data } = await api.get<{ success: boolean; data: AdminRecord }>(
      `/api/admin/admin-access/${id}`
    );
    return data.data;
  },

  /** POST /api/admin/admin-access */
  createAdmin: async (payload: CreateAdminPayload): Promise<AdminRecord> => {
    const { data } = await api.post<{ success: boolean; data: AdminRecord }>(
      '/api/admin/admin-access',
      payload
    );
    return data.data;
  },

  /** PUT /api/admin/admin-access/:id */
  updateAdmin: async (id: string, payload: UpdateAdminPayload): Promise<AdminRecord> => {
    const { data } = await api.put<{ success: boolean; data: AdminRecord }>(
      `/api/admin/admin-access/${id}`,
      payload
    );
    return data.data;
  },

  /** PATCH /api/admin/admin-access/:id/status */
  updateAdminStatus: async (id: string, status: boolean) => {
    const { data } = await api.patch(`/api/admin/admin-access/${id}/status`, { status });
    return data;
  },

  /** DELETE /api/admin/admin-access/:id */
  deleteAdmin: async (id: string) => {
    const { data } = await api.delete(`/api/admin/admin-access/${id}`);
    return data;
  },

  /** GET /api/admin/roles/dropdown */
  getRolesDropdown: async (): Promise<DropdownRole[]> => {
    const { data } = await api.get<{ success: boolean; data: DropdownRole[] }>(
      '/api/admin/roles/dropdown'
    );
    return data.data;
  },

  /** GET /api/centers/dropdown */
  getCentersDropdown: async (): Promise<DropdownCenter[]> => {
    const { data } = await api.get<{ success: boolean; data: DropdownCenter[] }>(
      '/api/centers/dropdown'
    );
    return data.data;
  },

  /** GET /api/admin/admin-access/mentors/dropdown */
  getMentorAdminsDropdown: async (params?: { search?: string; centerId?: string }) => {
    const { data } = await api.get('/api/admin/admin-access/mentors/dropdown', { params });
    return data;
  },
};
```

---

## FRONTEND TABLE MAPPING

### Table Columns

| Column Header | Response Field | Notes |
|---------------|----------------|-------|
| Full Name | `fullName` | Sortable (`sortBy=fullName`) |
| Email | `officialEmail` | Sortable |
| Contact | `contactNumber` | — |
| Employee ID | `employeeId` | Sortable |
| Role | `roleTitle` | Badge: use `roleCode` for color mapping |
| Center | `centerName` | Show `centerCode` as subtitle optional |
| Status | `status` | `ACTIVE` / `INACTIVE` |
| Last Login | `lastLoginAt` | Format as locale datetime; show `-` if null |
| Created | `createdAt` | Sortable via `sortBy=createdAt` (default) |
| Actions | — | View, Edit, Enable/Disable, Delete |

### Status Badge Mapping

| `status` | Badge | Action |
|----------|-------|--------|
| `ACTIVE` | Green / "Active" | Disable → `PATCH` `{ status: false }` |
| `INACTIVE` | Gray / "Inactive" | Enable → `PATCH` `{ status: true }` |

### Role Badge Mapping

Use `roleCode` for consistent colors (examples from live data):

| `roleCode` | Suggested Color |
|------------|-----------------|
| `SUPER_ADMIN` | Purple |
| `CONTENT_ADMIN` | Blue |
| `MENTOR_ADMIN` | Teal |
| `FINANCE_ADMIN` | Orange |
| `COUNSELING_ADMIN` | Indigo |
| Other | Default gray |

### Pagination Mapping

| UI Control | API Param | Response Field |
|------------|-----------|----------------|
| Current page | `page` | `page` |
| Page size | `limit` | `limit` |
| Total items | — | `total` |
| Total pages | — | `totalPages` |
| Items on page | — | `count` |

### Search Mapping

| UI Search Box | API Param |
|---------------|-----------|
| Global search input | `search` |

### Filter Mapping

| UI Filter | API Param | Dropdown Source |
|-----------|-----------|-----------------|
| Role filter | `roleId` | `GET /api/admin/roles/dropdown` |
| Center filter | `centerId` | `GET /api/centers/dropdown` |

---

## FORM FIELD MAPPING

### Add Admin Form

| Form Field | API Field | Validation (mirror Joi) |
|------------|-----------|-------------------------|
| Full Name | `fullName` | Required, 2–150 chars |
| Official Email | `officialEmail` | Required, valid email |
| Contact Number | `contactNumber` | Required, `/^[6-9]\d{9}$/` |
| Employee ID | `employeeId` | Required, 2–30 chars |
| Role | `roleId` | Required, ObjectId from roles dropdown |
| Center | `centerId` | Required, ObjectId from centers dropdown |
| Password | `password` | Required, min 6 |
| Confirm Password | `confirmPassword` | Required, must match password |

### Edit Admin Form

Same fields as Add, except:

| Field | Edit Behavior |
|-------|---------------|
| Password | Optional — only send if changing |
| Confirm Password | Required only when password is sent |
| All others | Optional partial update (min 1 field) |

### View Admin Drawer / Details Page

| Display Label | API Field |
|---------------|-----------|
| Full Name | `fullName` |
| Official Email | `officialEmail` |
| Contact Number | `contactNumber` |
| Employee ID | `employeeId` |
| Role | `roleTitle` (`roleCode` as subtitle) |
| Center | `centerName` (`centerCode`, city/state if needed from center API) |
| Status | `status` |
| Last Login | `lastLoginAt` |
| Created At | `createdAt` |
| Updated At | `updatedAt` |

**API:** `GET /api/admin/admin-access/:id`

### Dropdown Mapping

| Form Field | Endpoint | `label` | `value` |
|------------|----------|---------|---------|
| Role | `/api/admin/roles/dropdown` | `roleTitle` | `_id` |
| Center | `/api/centers/dropdown` | `centerName` | `_id` |

### Client-Side Validation (mirror backend)

```typescript
const INDIAN_MOBILE = /^[6-9]\d{9}$/;

export const adminFormSchema = {
  fullName: { required: true, minLength: 2, maxLength: 150 },
  officialEmail: { required: true, type: 'email' },
  contactNumber: { required: true, pattern: INDIAN_MOBILE },
  employeeId: { required: true, minLength: 2, maxLength: 30 },
  roleId: { required: true, pattern: /^[a-f0-9]{24}$/ },
  centerId: { required: true, pattern: /^[a-f0-9]{24}$/ },
  password: { required: true, minLength: 6 },
  confirmPassword: { required: true, match: 'password' },
};
```

---

## INTEGRATION SAFETY CHECKLIST

Use this checklist before shipping the Admin Management module:

- [ ] **API route verified** — All calls use `/api/admin/admin-access` (not `/api/admin/users` for admin CRUD)
- [ ] **Payload verified** — Create/update bodies match Joi schemas exactly (field names: `officialEmail`, not `email`)
- [ ] **Response verified** — Table uses `data[]` from list; detail uses `data` object from get-by-id
- [ ] **Validation verified** — 422 errors mapped to form fields via `error.errors[].field`
- [ ] **Auth verified** — Super admin `User` token used; AdminAccess JWT tested and confirmed blocked (403)
- [ ] **Permission verified** — Admin CRUD gated on `super_admin` role, not permission matrix
- [ ] **Search verified** — Single `search` param sent; debounced
- [ ] **Pagination verified** — `page`, `limit`, `total`, `totalPages` wired to table
- [ ] **Filters verified** — `roleId`, `centerId` from dropdown ObjectIds
- [ ] **Upload verified** — N/A (no upload APIs)
- [ ] **Status verified** — PATCH sends boolean; UI displays `ACTIVE`/`INACTIVE` string from response
- [ ] **Role verified** — Create/edit uses `GET /api/admin/roles/dropdown`; only ACTIVE roles returned
- [ ] **Center verified** — Create/edit uses `GET /api/centers/dropdown`; disabled centers rejected on submit
- [ ] **Delete verified** — Confirm dialog warns permanent deletion (`deleteType: "HARD"`)
- [ ] **Password verified** — `confirmPassword` always sent with `password` on create; on update only when changing
- [ ] **No status filter** — List `status` query param not implemented; client-side filter if needed

---

## AUDIT LOGS

Admin access mutations write audit logs (non-blocking) via `auditLogService.logAdminAudit`:

| Action | Trigger |
|--------|---------|
| `CREATE` | Admin created |
| `UPDATE` | Admin fields updated |
| `RESET_PASSWORD` | Password changed via update |
| `STATUS_CHANGE` | Status toggled |
| `DELETE` | Admin deleted |

Module key: `ADMIN_ACCESS`. Audit log **read** APIs are outside this module scope.

---

## APPENDIX: Source File Reference

| Concern | File |
|---------|------|
| Admin routes | `routes/adminAccessRoutes.js` |
| Admin controller | `controllers/adminAccessController.js` |
| Admin model | `models/AdminAccess.js` |
| Admin helpers | `utils/adminAccessHelpers.js` |
| Role routes/controller | `routes/roleRoutes.js`, `controllers/roleController.js` |
| Permission routes/controller | `routes/permissionRoutes.js`, `controllers/permissionController.js` |
| Center routes/controller | `routes/centerManagementRoutes.js`, `controllers/centerManagementController.js` |
| Validation schemas | `middleware/validation.js` |
| Auth middleware | `middleware/authMiddleware.js` |
| Role middleware | `middleware/roleMiddleware.js` |
| Permission middleware | `middleware/permissionMiddleware.js` |
| Permission config | `config/permissionModules.js` |
| Parent admin router | `routes/adminRoutes.js` |
| App mount | `app.js` (`/api/admin`, `/api/centers/dropdown`) |
