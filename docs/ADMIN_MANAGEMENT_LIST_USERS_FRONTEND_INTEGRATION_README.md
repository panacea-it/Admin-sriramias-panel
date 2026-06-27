# LIST USERS FRONTEND INTEGRATION README

**Source of truth:** Backend implementation in this repository (Node.js / Express / MongoDB).  
**Base URL:** `import.meta.env.VITE_API_BASE_URL` (no hardcoded URLs)  
**API prefix:** `/api/admin`  
**Module key:** `STUDENT_MANAGEMENT`  
**Last verified against:** `routes/userManagementRoutes.js`, `routes/adminRoutes.js`, `controllers/userManagementController.js`, `utils/userManagementHelpers.js`, `utils/userManagementStudentModule.js`, `utils/userManagementUpdate.js`, `utils/userManagementStatus.js`, `utils/studentService.js`, `middleware/validation.js`, `middleware/authMiddleware.js`, `middleware/roleMiddleware.js`

---

## 1. MODULE OVERVIEW

### Purpose

The **Admin Management → List Users** screen displays a **unified governance table** of:

- **Students** — portal users (`User` with `role: 'student'`) and/or batch-only `Student` master records
- **Staff admins** — `AdminAccess` records with dynamic `Role` assignments

Backend label: `listUsersLabel: 'List Users'` (`utils/userManagementStudentModule.js`).

**Mutations from this screen are student-only.** Admin rows are **view-only** for edit/delete; admin lifecycle is managed via `/api/admin/admin-access` (separate screen).

### Business Flow

```
Super Admin logs in (legacy User, role: super_admin)
        │
        ▼
Bearer token on all /api/admin/users/* requests
        │
        ├── GET /api/admin/users/module-config ──► UI rules (labels, fields, permissions)
        ├── GET /api/admin/user-roles ──► Role filter dropdown (dynamic from DB)
        ├── GET /api/admin/user-centers ──► Center filter dropdown (dynamic from DB)
        ├── GET /api/admin/users ──► Merged student + admin list
        │
        ├── View any row ──► GET /api/admin/users/:id?type={recordType}
        │
        ├── Create ──► POST /api/admin/users (STUDENT only; role locked)
        ├── Edit student ──► PUT /api/admin/users/:id?type=USER|STUDENT
        ├── Toggle student status ──► PATCH /api/admin/users/:id/status
        ├── Delete student ──► DELETE /api/admin/users/:id (hard delete)
        │
        └── Admin status toggle ──► PATCH /api/admin/admin-access/:id/status
            (NOT via /api/admin/users/:id/status for ADMIN rows)
```

### User Flow

| Step | Actor | Action |
|------|-------|--------|
| 1 | Super Admin | Opens List Users page |
| 2 | Frontend | Loads `module-config`, role/center dropdowns, then user list |
| 3 | Super Admin | Searches, filters by role/center/status, paginates, sorts |
| 4 | Super Admin | Views any row (student or admin) |
| 5 | Super Admin | Creates student via Create Student form |
| 6 | Super Admin | Edits/deletes **student** rows only (admin rows show disabled actions per `permissions`) |
| 7 | Super Admin | Toggles student status inline; for admin rows, routes to Admin Access status API |

### Permission Flow

| Layer | Requirement | File |
|-------|-------------|------|
| `protect` | Valid Bearer JWT on all `/api/admin/*` routes | `middleware/authMiddleware.js` |
| `allowRoles(ROLES.SUPER_ADMIN)` | `req.user.role === 'super_admin'` | `middleware/roleMiddleware.js` |
| AdminAccess JWT | **Blocked** on List Users routes (`403`) | `middleware/roleMiddleware.js:14–20` |
| `checkPermission` | **NOT USED** on List Users routes | — |
| Row-level `permissions` | Returned per list/detail row from backend | `utils/userManagementStudentModule.js` |

**Login:** `POST /api/auth/login-admin` or `POST /api/auth/login-super-admin` → use returned `token` as `Authorization: Bearer <token>`.

---

## 2. COMPLETE API INVENTORY

All List Users endpoints require:

```
Authorization: Bearer <super_admin_token>
Content-Type: application/json   (for POST/PUT/PATCH with body)
```

### 2.1 GET `/api/admin/users/module-config`

| Property | Value |
|----------|-------|
| **METHOD** | `GET` (also `POST` — same handler) |
| **URL** | `/api/admin/users/module-config` |
| **AUTHENTICATION** | `super_admin` JWT |
| **HEADERS** | `Authorization: Bearer <token>` |
| **PATH PARAMS** | — |
| **QUERY PARAMS** | — |
| **REQUEST BODY** | — |

**SUCCESS (200):**

```json
{
  "success": true,
  "statusCode": 10000,
  "message": "Module config fetched successfully",
  "data": {
    "data": {
      "module": "STUDENT_MANAGEMENT",
      "listUsersLabel": "List Users",
      "createFormLabel": "Create Student",
      "createAllowedRoles": ["STUDENT"],
      "createFields": [
        { "field": "fullName", "required": true, "type": "string" },
        { "field": "email", "required": true, "type": "string", "note": "Gmail only" },
        { "field": "mobile", "required": true, "type": "string", "note": "10-digit Indian mobile" },
        { "field": "parentName", "required": false, "type": "string" },
        { "field": "parentMobile", "required": false, "type": "string" },
        { "field": "centerId", "required": true, "type": "ObjectId" },
        { "field": "status", "required": false, "type": "boolean", "default": true }
      ],
      "createExcludedFields": ["parentEmail"],
      "statusActions": {
        "USER": { "method": "PATCH", "path": "/api/admin/users/:id/status", "body": { "status": "boolean" } },
        "STUDENT": { "method": "PATCH", "path": "/api/admin/users/:id/status", "body": { "status": "boolean" } },
        "ADMIN": { "method": "PATCH", "path": "/api/admin/admin-access/:id/status", "body": { "status": "boolean" } }
      },
      "modifyAllowedRecordTypes": ["USER", "STUDENT"],
      "viewAllowedRecordTypes": ["USER", "STUDENT", "ADMIN"],
      "messages": {
        "MODIFY_BLOCKED": "Only student accounts can be modified from this module",
        "DELETE_BLOCKED": "Only student accounts can be deleted from Users & Access"
      }
    }
  }
}
```

**ERRORS:** 401, 403, 500 (see Section 12).

---

### 2.2 GET `/api/admin/users` — List Users

| Property | Value |
|----------|-------|
| **METHOD** | `GET` (also `POST /api/admin/users/list` — same handler) |
| **URL** | `/api/admin/users` |
| **AUTHENTICATION** | `super_admin` JWT |
| **HEADERS** | `Authorization: Bearer <token>` |
| **PATH PARAMS** | — |
| **QUERY PARAMS** | See Section 3 |
| **REQUEST BODY** | Optional for `POST /list` — same keys as query params |

**SUCCESS (200):** See Section 3.

**ERRORS:** 401, 403, 500.

---

### 2.3 GET `/api/admin/users/:id` — User Details

| Property | Value |
|----------|-------|
| **METHOD** | `GET` (also `POST /api/admin/users/detail`) |
| **URL** | `/api/admin/users/:id` |
| **AUTHENTICATION** | `super_admin` JWT |
| **QUERY PARAMS** | `type` or `recordType` — `USER`, `STUDENT`, `ADMIN`, or role code (e.g. `CONTENT_ADMIN`) |
| **REQUEST BODY** (POST /detail) | `{ "id": "...", "type": "USER|STUDENT|ADMIN" }` |

**SUCCESS (200):** See Section 4.

**ERRORS:** 400 (`id is required`), 401, 403, 404, 500.

---

### 2.4 POST `/api/admin/users` — Create Student

| Property | Value |
|----------|-------|
| **METHOD** | `POST` |
| **URL** | `/api/admin/users` |
| **AUTHENTICATION** | `super_admin` JWT |
| **HEADERS** | `Authorization: Bearer <token>`, `Content-Type: application/json` |
| **REQUEST BODY** | See Section 5 |

**SUCCESS (201):** See Section 5.

**ERRORS:** 400, 401, 403, 409, 422, 500.

---

### 2.5 PUT `/api/admin/users/:id` — Update Student

| Property | Value |
|----------|-------|
| **METHOD** | `PUT` |
| **URL** | `/api/admin/users/:id` |
| **AUTHENTICATION** | `super_admin` JWT |
| **QUERY PARAMS** | `type` or `recordType` — `USER` or `STUDENT` |
| **REQUEST BODY** | At least one updatable field (see Section 6) |

**SUCCESS (200):** See Section 6.

**ERRORS:** 400, 401, 403, 404, 409, 500. **No Joi middleware** — validation is service-layer.

---

### 2.6 PATCH `/api/admin/users/:id/status` — Toggle Student Status

| Property | Value |
|----------|-------|
| **METHOD** | `PATCH` |
| **URL** | `/api/admin/users/:id/status` |
| **AUTHENTICATION** | `super_admin` JWT |
| **QUERY PARAMS** | `type` or `recordType` (optional — auto-resolved if omitted) |
| **REQUEST BODY** | `{ "status": true }` or `{ "status": false }` |

**SUCCESS (200):**

```json
{
  "success": true,
  "statusCode": 10000,
  "message": "User enabled successfully",
  "data": {
    "module": "STUDENT_MANAGEMENT",
    "status": "ACTIVE",
    "summary": { "...normalized row with permissions..." }
  }
}
```

**ERRORS:**

| HTTP | When |
|------|------|
| 400 | Admin record — `Use PATCH /api/admin/admin-access/:id/status for admin records` |
| 403 | Non-student user |
| 404 | User/Student not found |
| 422 | Missing/invalid `status` boolean |
| 401, 403, 500 | Auth/server |

---

### 2.7 DELETE `/api/admin/users/:id` — Delete Student

| Property | Value |
|----------|-------|
| **METHOD** | `DELETE` |
| **URL** | `/api/admin/users/:id` |
| **AUTHENTICATION** | `super_admin` JWT |
| **QUERY PARAMS** | `type` or `recordType` |

**SUCCESS (200):**

```json
{
  "success": true,
  "statusCode": 10000,
  "message": "Student permanently deleted",
  "data": null
}
```

**ERRORS:** 403 (admin row), 404, 401, 500.

---

### 2.8 GET `/api/admin/users/update-fields` — Updatable Field Catalog

| Property | Value |
|----------|-------|
| **METHOD** | `GET` |
| **URL** | `/api/admin/users/update-fields?type=USER` |
| **QUERY PARAMS** | `type` — `USER` (default) or `ADMIN` |
| **AUTHENTICATION** | `super_admin` JWT |

**SUCCESS (200) for `type=USER`:**

```json
{
  "success": true,
  "statusCode": 10000,
  "message": "Update fields fetched successfully",
  "data": {
    "module": "STUDENT_MANAGEMENT",
    "editable": true,
    "editDisabledReason": null,
    "userType": "USER",
    "account": [ "...field catalog..." ],
    "studentProfile": [ "...field catalog..." ],
    "employeeProfile": [ "...field catalog..." ],
    "readOnly": ["_id", "createdAt", "updatedAt"],
    "notes": [
      "studentProfile fields apply when user.role is student",
      "employeeProfile fields apply when user.role is employee"
    ]
  }
}
```

For `type=ADMIN`: `editable: false`, `editDisabledReason` set — admin edits are **NOT** done from List Users.

---

### 2.9 GET `/api/admin/user-roles` — Role Filter Dropdown

| Property | Value |
|----------|-------|
| **METHOD** | `GET` |
| **URL** | `/api/admin/user-roles` |
| **AUTHENTICATION** | `super_admin` JWT |

**SUCCESS (200):** See Section 8.

---

### 2.10 GET `/api/admin/user-centers` — Center Filter Dropdown

| Property | Value |
|----------|-------|
| **METHOD** | `GET` |
| **URL** | `/api/admin/user-centers` |
| **AUTHENTICATION** | `super_admin` JWT |

**SUCCESS (200):** See Section 9.

---

### 2.11 GET `/api/admin/user-create-roles` — Create Form Role (Locked)

| Property | Value |
|----------|-------|
| **METHOD** | `GET` |
| **URL** | `/api/admin/user-create-roles` |
| **AUTHENTICATION** | `super_admin` JWT |

**SUCCESS (200):**

```json
{
  "success": true,
  "statusCode": 10000,
  "message": "Create user roles fetched successfully",
  "data": {
    "module": "STUDENT_MANAGEMENT",
    "createFormLabel": "Create Student",
    "roleSelectionEnabled": false,
    "count": 1,
    "data": [
      {
        "value": "STUDENT",
        "label": "Student",
        "roleCode": "STUDENT",
        "kind": "STUDENT",
        "locked": true
      }
    ]
  }
}
```

---

### 2.12 GET `/api/admin/centers/dropdown` — Center Dropdown (Create Form)

| Property | Value |
|----------|-------|
| **METHOD** | `GET` |
| **URL** | `/api/admin/centers/dropdown` (also `/api/centers/dropdown`) |
| **AUTHENTICATION** | `protect` + `requireStaffAdmin` (super_admin passes) |

**SUCCESS (200):**

```json
{
  "success": true,
  "count": 3,
  "data": [
    {
      "_id": "674abc...",
      "centerName": "Hyderabad Center",
      "centerCode": "HYD01",
      "city": "Hyderabad",
      "state": "Telangana"
    }
  ]
}
```

---

### 2.13 PATCH `/api/admin/admin-access/:id/status` — Admin Status Toggle

Used **only** when `recordType === 'ADMIN'` (from `module-config.statusActions.ADMIN`).

| Property | Value |
|----------|-------|
| **METHOD** | `PATCH` |
| **URL** | `/api/admin/admin-access/:id/status` |
| **AUTHENTICATION** | `super_admin` JWT |
| **REQUEST BODY** | `{ "status": true }` or `{ "status": false }` |

**SUCCESS (200):** Returns updated admin record (legacy envelope may be normalized by `responseNormalizer`).

---

### APIs NOT Available for List Users

| Feature | Status |
|---------|--------|
| Create/update admin via `/api/admin/users` | **NOT AVAILABLE** — student only |
| Courses dropdown | **NOT AVAILABLE IN BACKEND** |
| Programs dropdown | **NOT AVAILABLE IN BACKEND** |
| Departments dropdown | **NOT AVAILABLE IN BACKEND** |
| Counselors dropdown | **NOT AVAILABLE IN BACKEND** (for this module) |
| Mentors dropdown | **NOT AVAILABLE IN BACKEND** (belongs to Admin Access module: `/api/admin/admin-access/mentors/dropdown`) |
| Bulk user actions | **NOT AVAILABLE IN BACKEND** |
| Export (CSV/Excel) | **NOT AVAILABLE IN BACKEND** |
| `POST /api/admin/users` with admin payload | **NOT AVAILABLE** — `createUnifiedUserAdmin` validator exists but is **not wired** to any route |

---

## 3. USER LIST API

### Endpoint

```
GET /api/admin/users
POST /api/admin/users/list   (identical handler)
```

Input is merged: `{ ...req.query, ...(req.body || {}) }`.

### Search Support

| Parameter | Type | Default | Behavior |
|-----------|------|---------|----------|
| `search` | string | `""` | Case-insensitive regex |

**Student side** matches: `studentName`, `email`, `mobileNumber`, `studentId`; orphan portal users: `name`, `email`, `mobile`.  
Special case: search term `"student"` (case-insensitive) matches **all** students without text filter.

**Admin side** matches: `fullName`, `officialEmail`, `contactNumber`, `employeeId`, plus `Role.roleTitle` / `Role.roleCode`.

### Filters

| Parameter | Aliases | Values | Behavior |
|-----------|---------|--------|----------|
| `role` | — | `ALL` / omitted, `STUDENT`, `<Role._id>`, `<roleCode>` | `STUDENT` → students only; ObjectId or role code → admins with that role only; unknown role → empty list |
| `center` | `centerId` | `ALL` / omitted, `<Center._id>` | Filters by center assignment |
| `status` | — | `ACTIVE`, `INACTIVE` | Filters active/inactive accounts |
| `recordType` | `userType` | `ALL` / omitted, `USER`, `STUDENT`, `ADMIN` | `USER`/`STUDENT` → student side only; `ADMIN` → admin side only |

### Pagination

| Parameter | Type | Default | Constraints |
|-----------|------|---------|-------------|
| `page` | number | `1` | Min 1 |
| `limit` | number | `10` | Min 1, max 100 |

**Important:** Pagination is **in-memory** after merging student + admin collections. `total` reflects merged count before slice.

### Sorting

| Parameter | Type | Default | Allowed values |
|-----------|------|---------|----------------|
| `sortBy` | string | `createdAt` | `createdAt`, `fullName`, `email`, `role`, `status`, `joinedDate` (`joinedDate` maps to `createdAt`) |
| `sortOrder` | string | `desc` | `asc`, `desc` |

### Frontend Request Example

```typescript
// GET variant (recommended)
const params = {
  search: 'arjun',
  role: 'ALL',           // or 'STUDENT' or Role._id
  center: 'ALL',         // or centerId
  status: 'ACTIVE',      // optional
  recordType: 'ALL',     // optional: USER | STUDENT | ADMIN
  page: 1,
  limit: 10,
  sortBy: 'createdAt',
  sortOrder: 'desc',
};

const response = await api.get('/api/admin/users', { params });
```

```typescript
// POST variant (backward compatible)
const response = await api.post('/api/admin/users/list', {
  search: 'arjun',
  role: 'ALL',
  center: 'ALL',
  page: 1,
  limit: 10,
});
```

### Success Response

```json
{
  "success": true,
  "statusCode": 10000,
  "message": "Users fetched successfully",
  "data": {
    "module": "STUDENT_MANAGEMENT",
    "total": 42,
    "page": 1,
    "limit": 10,
    "totalPages": 5,
    "count": 10,
    "data": [ "...row objects..." ]
  }
}
```

### Frontend Response Mapping

```typescript
interface UserListResponse {
  success: boolean;
  statusCode: number;
  message: string;
  data: {
    module: string;
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    count: number;
    data: UserListRow[];
  };
}

// Access rows:
const rows = response.data.data.data;
const { total, page, limit, totalPages } = response.data.data;
```

### Student Row Shape

```json
{
  "id": "USER_OR_STUDENT_ID",
  "studentRecordId": "STUDENT_DOC_ID",
  "studentId": "STU001",
  "fullName": "Arjun Mehta",
  "email": "arjun@gmail.com",
  "phoneNumber": "9876543210",
  "role": "Student",
  "roleType": "STUDENT",
  "roleKey": "student",
  "center": "Hyderabad Center",
  "centerId": "674abc...",
  "status": "ACTIVE",
  "userType": "STUDENT",
  "recordType": "USER",
  "joinedDate": "2026-05-25",
  "createdAt": "2026-05-25T08:00:00.000Z",
  "studentDetails": {
    "parentName": "Parent Name",
    "parentEmail": null,
    "parentMobile": "9876543211"
  },
  "permissions": {
    "canView": true,
    "canEdit": true,
    "canDelete": true,
    "editDisabledReason": null,
    "deleteDisabledReason": null
  }
}
```

`recordType: "USER"` = has portal account; `recordType: "STUDENT"` = batch-only (no `userId`).

### Admin Row Shape

```json
{
  "id": "ADMIN_ACCESS_ID",
  "fullName": "Content Admin",
  "email": "admin@example.com",
  "phoneNumber": "9876543210",
  "role": "Content Admin",
  "roleType": "CONTENT_ADMIN",
  "roleKey": "CONTENT_ADMIN",
  "roleId": "674def...",
  "center": "Hyderabad Center",
  "centerId": "674abc...",
  "status": "ACTIVE",
  "userType": "CONTENT_ADMIN",
  "recordType": "ADMIN",
  "joinedDate": "2026-05-25",
  "createdAt": "2026-05-25T08:00:00.000Z",
  "permissions": {
    "canView": true,
    "canEdit": false,
    "canDelete": false,
    "editDisabledReason": "Only student accounts can be modified from this module",
    "deleteDisabledReason": "Only student accounts can be deleted from Users & Access"
  }
}
```

**Always use `row.permissions` from backend** to enable/disable Edit and Delete actions. Do not infer from `recordType` alone.

---

## 4. USER DETAILS API

### Get User By ID

```
GET /api/admin/users/:id?type={recordType}
POST /api/admin/users/detail  { "id": "...", "type": "USER|STUDENT|ADMIN" }
```

### Request

| Param | Required | Notes |
|-------|----------|-------|
| `id` | Yes | User `_id`, Student `_id`, or AdminAccess `_id`. If Student `_id` is passed, backend resolves to linked `userId`. |
| `type` / `recordType` | Recommended | `USER`, `STUDENT`, `ADMIN`, or role code (e.g. `CONTENT_ADMIN` → treated as `ADMIN`). Auto-resolved from ID if omitted. |

### Response — Student (`recordType: USER` or `STUDENT`)

```json
{
  "success": true,
  "statusCode": 10000,
  "message": "Student fetched successfully",
  "data": {
    "module": "STUDENT_MANAGEMENT",
    "userType": "STUDENT",
    "recordType": "USER",
    "permissions": { "canView": true, "canEdit": true, "canDelete": true, "...": "..." },
    "summary": { "...same shape as list row..." }
  }
}
```

### Response — Admin (`recordType: ADMIN`)

```json
{
  "success": true,
  "statusCode": 10000,
  "message": "Admin user fetched successfully",
  "data": {
    "module": "STUDENT_MANAGEMENT",
    "userType": "CONTENT_ADMIN",
    "recordType": "ADMIN",
    "roleType": "CONTENT_ADMIN",
    "permissions": { "canView": true, "canEdit": false, "canDelete": false, "...": "..." },
    "summary": {
      "id": "...",
      "fullName": "...",
      "officialEmail": "...",
      "contactNumber": "...",
      "employeeId": "...",
      "roleTitle": "...",
      "centerName": "...",
      "centerCode": "...",
      "city": "...",
      "state": "...",
      "roleStatus": "ACTIVE",
      "lastLoginAt": null,
      "updatedAt": "..."
    },
    "data": { "...formatAdminAccessForAdmin fields..." }
  }
}
```

### Frontend Mapping

```typescript
const { summary, permissions, recordType, userType } = response.data.data;

// Use summary for display fields
// Use permissions.canEdit / canDelete for action buttons
// Pass recordType back on update/delete/status calls
```

---

## 5. CREATE USER API

### Endpoint

```
POST /api/admin/users
```

**Creates STUDENT only.** Admin fields are stripped by `sanitizeStudentCreatePayload` before validation.

### Exact Payload

```json
{
  "fullName": "Arjun Mehta",
  "email": "arjun@gmail.com",
  "mobile": "9876543210",
  "parentName": "Parent Name",
  "parentMobile": "9876543211",
  "centerId": "674a1b2c3d4e5f6789012345",
  "status": true
}
```

### Required Fields

| Field | Type | Rules |
|-------|------|-------|
| `fullName` | string | Min 2, max 100, trimmed |
| `email` | string | Valid Gmail only (`name@gmail.com`) |
| `mobile` | string | `/^[6-9]\d{9}$/` — Indian mobile |
| `centerId` | string | 24-char hex ObjectId; must be ACTIVE center |

### Optional Fields

| Field | Type | Default |
|-------|------|---------|
| `parentName` | string | — (min 2, max 100 if provided) |
| `parentMobile` | string | — (`/^[6-9]\d{9}$/` if provided) |
| `status` | boolean | `true` (ACTIVE) |
| `userType` | string | Forced to `STUDENT` by middleware |

### Forbidden / Stripped Fields

These are **removed** server-side and must not be sent:

`userType`, `role`, `roleId`, `officialEmail`, `employeeId`, `password`, `confirmPassword`, `accountStatus`, `twoFactorEnabled`, `loginAlertEnabled`, `sessionTimeout`, `contactNumber`, **`parentEmail`**

Sending `parentEmail` → **422** validation error.

### Validation Rules (Joi — `createUnifiedUserStudent`)

See Section 11.

### Business Restrictions

| Rule | Error |
|------|-------|
| Duplicate email/mobile in `User` collection | 400 — `User already exists with this email or mobile` |
| Duplicate email/mobile in `Student` collection | 400 — `A student already exists with this email/mobile` |
| Invalid/inactive center | 400 — `Invalid or inactive center` |
| Non-Gmail email | 422 — `Student email must be a Gmail address` |
| Non-student role in body | Ignored; `roleIgnored: true` in response |

### Success Response (201)

```json
{
  "success": true,
  "statusCode": 10000,
  "message": "Student created successfully",
  "data": {
    "module": "STUDENT_MANAGEMENT",
    "roleIgnored": false,
    "recordType": "USER",
    "userType": "STUDENT",
    "createRoleValue": "STUDENT",
    "selectedRole": {
      "value": "STUDENT",
      "label": "Student",
      "roleCode": "STUDENT",
      "kind": "STUDENT",
      "locked": true
    },
    "summary": { "...list row shape with permissions..." },
    "data": { "...populated User document..." },
    "studentProfile": { "...Student document..." }
  }
}
```

### Frontend Integration Guide

1. Load `GET /api/admin/user-create-roles` — display locked "Student" role (no selection).
2. Load centers from `GET /api/admin/centers/dropdown` or filter `ALL` from `GET /api/admin/user-centers`.
3. Submit `POST /api/admin/users` with payload above.
4. On success, **refetch list** from server (Section 18).
5. Do **not** hardcode role options — use API response only.

---

## 6. UPDATE USER API

### Endpoint

```
PUT /api/admin/users/:id?type=USER|STUDENT
```

**Student records only.** Admin rows return **403**.

### Editable Fields

Fetch catalog: `GET /api/admin/users/update-fields?type=USER`

**Account fields** (portal user — `recordType: USER`):

| Field | Aliases | Type |
|-------|---------|------|
| `name` | `fullName` | string |
| `email` | — | string (unique) |
| `mobile` | `phoneNumber`, `contactNumber` | string |
| `centerId` | `center` | ObjectId |
| `isActive` | `accountStatus`, `status` | boolean |
| `password` | — | string (min 6; requires `confirmPassword`) |
| `confirmPassword` | — | string |
| `role` | — | enum: `student`, `parent`, `employee`, `center_admin`, `super_admin` |
| `location` | — | enum: `Hyderabad`, `New Delhi`, `Pune` |

**Student profile fields:**

| Field | Type |
|-------|------|
| `parentName` | string |
| `parentMobile` | string |
| `parentEmail` | string |
| `parentMobileVerified` | boolean |
| `parentEmailVerified` | boolean |

**Batch-only student** (`recordType: STUDENT` — no portal user):

| Field | Aliases |
|-------|---------|
| `studentName` | `name`, `fullName` |
| `email` | — |
| `mobileNumber` | `mobile`, `phoneNumber` |
| `centerId` | `center` |
| `status` | `isActive`, `accountStatus` |
| Parent fields | same as above |

### Immutable Fields

`_id`, `createdAt`, `updatedAt`, `studentId` (auto-generated), `recordType`, admin-specific fields.

### Validation Rules (Service Layer — no Joi on route)

| Rule | HTTP | Message |
|------|------|---------|
| Empty body | 400 | `Request body is empty. Send at least one field to update.` |
| Admin record | 403 | `Only student accounts can be modified from this module` |
| Duplicate email/mobile | 409 | `A student already exists with this email/mobile` |
| Center not found | 404 | `Center not found` |
| Password mismatch | 400 | `Passwords do not match` |
| Password too short | 400 | `Password must be at least 6 characters` |
| Invalid role | 400 | `role must be one of: super_admin, center_admin, employee, student, parent` |

### Success Response (200)

```json
{
  "success": true,
  "statusCode": 10000,
  "message": "Student updated successfully",
  "data": {
    "module": "STUDENT_MANAGEMENT",
    "userType": "STUDENT",
    "recordType": "USER",
    "permissions": { "...": "..." },
    "summary": { "...updated list row shape..." }
  }
}
```

### Frontend Integration Guide

1. Load detail: `GET /api/admin/users/:id?type={recordType from list row}`.
2. Load field catalog: `GET /api/admin/users/update-fields?type=USER`.
3. Disable form if `permissions.canEdit === false`.
4. Submit `PUT` with `type` query param matching list row `recordType`.
5. Refetch detail + list after success.

---

## 7. DELETE USER API

### Type

**Hard delete** — permanently removes `Student` and linked `User` records. Purges related enrollment data via `purgeStudentRelatedData`.

### Endpoint

```
DELETE /api/admin/users/:id?type=USER|STUDENT
```

### Restrictions

| Restriction | Result |
|-------------|--------|
| `recordType: ADMIN` | **403** — `Only student accounts can be deleted from Users & Access` |
| Non-student `User` | **403** |
| Record not found | **404** — `Student not found` / `User not found` |

### Dependencies

Deletion cascades through `utils/studentDeleteCascade.js` (batch enrollments, related data) and syncs batch student counts.

### Error Scenarios

| HTTP | Message |
|------|---------|
| 403 | Admin row or non-student |
| 404 | Student/User not found |
| 401 | Not authenticated |
| 500 | Server error |

### Success

```json
{
  "success": true,
  "statusCode": 10000,
  "message": "Student permanently deleted",
  "data": null
}
```

---

## 8. USER ROLE APIS

**STRICT RULE:** Frontend must only display roles returned by backend APIs. Never hardcode role lists.

### 8.1 GET `/api/admin/user-roles` — List Filter Roles

**Purpose:** Role filter dropdown on List Users table.

**Response:**

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
      {
        "value": "674a1b2c3d4e5f6789012345",
        "label": "Content Admin",
        "roleCode": "CONTENT_ADMIN",
        "status": "ACTIVE"
      },
      {
        "value": "674a1b2c3d4e5f6789012346",
        "label": "Mentor Admin",
        "roleCode": "MENTOR_ADMIN",
        "status": "INACTIVE"
      }
    ]
  }
}
```

**Notes:**

- Includes **both ACTIVE and INACTIVE** roles from `Role` collection.
- `STUDENT` is a synthetic platform role (not a `Role` document).
- Admin roles use `Role._id` as `value` for list filter `role` param.

**Frontend mapping:**

```typescript
const roles = response.data.data.data;
// Use role.value as filter param for GET /api/admin/users?role={value}
// Display role.label in dropdown
// Optionally show inactive badge when role.status === 'INACTIVE'
```

### 8.2 GET `/api/admin/user-create-roles` — Create Form Role

Returns single locked `STUDENT` entry. `roleSelectionEnabled: false`.

### 8.3 Role Display in List Rows

| Source | `role` field | `roleType` / `roleKey` |
|--------|-------------|------------------------|
| Student | `"Student"` (hardcoded in normalizer) | `STUDENT` / `student` |
| Admin | `Role.roleTitle` from DB | `Role.roleCode` e.g. `CONTENT_ADMIN`, `MENTOR_ADMIN` |

Display `row.role` for table column. For admin badge color, use `row.roleType` or `row.roleKey` dynamically — do not assume fixed role names.

### 8.4 GET `/api/admin/roles/dropdown` — NOT for List Users

This endpoint serves **Admin Access** create/edit forms, not List Users. **Do not use** for List Users create (create is student-only).

### Platform Role Enum (legacy `User.role` — not List Users filter)

From `middleware/roleMiddleware.js`:

`super_admin`, `center_admin`, `employee`, `student`, `parent`

These are **not** the List Users role filter options. List Users uses `GET /api/admin/user-roles`.

---

## 9. DROPDOWN APIS

### 9.1 Roles — `GET /api/admin/user-roles`

| Property | Value |
|----------|-------|
| Endpoint | `/api/admin/user-roles` |
| Use | Table role filter |
| Response | Section 8.1 |

**Frontend mapping:** `value` → `role` query param; `label` → display text.

---

### 9.2 Centers (Filter) — `GET /api/admin/user-centers`

| Property | Value |
|----------|-------|
| Endpoint | `/api/admin/user-centers` |
| Use | Table center filter |

**Response:**

```json
{
  "success": true,
  "statusCode": 10000,
  "message": "User centers fetched successfully",
  "data": {
    "count": 4,
    "data": [
      { "value": "ALL", "label": "All Centers" },
      {
        "value": "674abc...",
        "label": "Hyderabad Center",
        "centerCode": "HYD01",
        "city": "Hyderabad",
        "state": "Telangana"
      }
    ]
  }
}
```

**Frontend mapping:** `value` → `center` query param; `label` → display text. Only ACTIVE centers (`Center.status: 'ACTIVE'`).

---

### 9.3 Centers (Create Form) — `GET /api/admin/centers/dropdown`

| Property | Value |
|----------|-------|
| Endpoint | `/api/admin/centers/dropdown` |
| Use | Create Student form center select |
| Auth | `requireStaffAdmin` (super_admin qualifies) |

**Frontend mapping:** `_id` → `centerId` in create payload; `centerName` → display label.

---

### 9.4 Status Filter — No Dedicated Dropdown API

Status filter values are fixed enums from backend list logic:

| Value | Label |
|-------|-------|
| *(omit)* | All statuses |
| `ACTIVE` | Active |
| `INACTIVE` | Inactive |

Hardcode only these **two filter values** — they are defined in `buildStudentCollectionQuery` and `buildAdminCollectionQueryAsync`.

---

### 9.5 Record Type Filter — No Dedicated Dropdown API

| Value | Label | Effect |
|-------|-------|--------|
| `ALL` / omit | All Types | Students + admins |
| `USER` / `STUDENT` | Students | Student side only |
| `ADMIN` | Admins | Admin side only |

---

### NOT AVAILABLE IN BACKEND (for List Users)

| Dropdown | Status |
|----------|--------|
| Courses | **NOT AVAILABLE IN BACKEND** |
| Programs | **NOT AVAILABLE IN BACKEND** |
| Departments | **NOT AVAILABLE IN BACKEND** |
| Mentors | **NOT AVAILABLE IN BACKEND** |
| Counselors | **NOT AVAILABLE IN BACKEND** |

---

## 10. FIELD MAPPING TABLE

### List Table Columns

| Backend Field | Frontend Field | Display Label | Data Type | Required (display) |
|---------------|----------------|---------------|-----------|-------------------|
| `id` | `id` | — (internal) | string (ObjectId) | — |
| `studentRecordId` | `studentRecordId` | — (internal) | string | — |
| `studentId` | `studentId` | Student ID | string \| null | No |
| `fullName` | `fullName` | Full Name | string | Yes |
| `email` | `email` | Email | string | Yes |
| `phoneNumber` | `phoneNumber` | Phone | string | Yes |
| `role` | `role` | Role | string | Yes |
| `roleType` | `roleType` | — (badge key) | string | — |
| `roleKey` | `roleKey` | — (badge key) | string | — |
| `roleId` | `roleId` | — (admin only) | string | Admin only |
| `center` | `center` | Center | string | Yes |
| `centerId` | `centerId` | — (internal) | string | — |
| `status` | `status` | Status | `ACTIVE` \| `INACTIVE` | Yes |
| `userType` | `userType` | — (internal) | string | — |
| `recordType` | `recordType` | Type | `USER` \| `STUDENT` \| `ADMIN` | Yes |
| `joinedDate` | `joinedDate` | Joined | string (YYYY-MM-DD) | No |
| `createdAt` | `createdAt` | Created | ISO date | No |
| `studentDetails.parentName` | `parentName` | Parent Name | string \| null | No |
| `studentDetails.parentEmail` | `parentEmail` | Parent Email | string \| null | No |
| `studentDetails.parentMobile` | `parentMobile` | Parent Mobile | string \| null | No |
| `permissions.canView` | `canView` | — | boolean | — |
| `permissions.canEdit` | `canEdit` | — | boolean | — |
| `permissions.canDelete` | `canDelete` | — | boolean | — |
| `permissions.editDisabledReason` | `editDisabledReason` | — | string \| null | — |
| `permissions.deleteDisabledReason` | `deleteDisabledReason` | — | string \| null | — |

### Create Form Fields

| Backend Field | Frontend Field | Display Label | Data Type | Required |
|---------------|----------------|---------------|-----------|----------|
| `fullName` | `fullName` | Full Name | string | Yes |
| `email` | `email` | Email (Gmail) | string | Yes |
| `mobile` | `mobile` | Mobile | string | Yes |
| `parentName` | `parentName` | Parent Name | string | No |
| `parentMobile` | `parentMobile` | Parent Mobile | string | No |
| `centerId` | `centerId` | Center | ObjectId string | Yes |
| `status` | `status` | Active | boolean | No (default `true`) |

### Edit Form Fields (Student)

Same as create plus `parentEmail`, `parentMobileVerified`, `parentEmailVerified` (via update-fields catalog). Use field aliases documented in Section 6.

### Admin Detail View Fields (Read-Only in List Users)

| Backend Field | Display Label | Data Type |
|---------------|---------------|-----------|
| `summary.officialEmail` | Official Email | string |
| `summary.contactNumber` | Contact Number | string |
| `summary.employeeId` | Employee ID | string |
| `summary.roleTitle` | Role | string |
| `summary.centerName` | Center | string |
| `summary.lastLoginAt` | Last Login | date \| null |

---

## 11. VALIDATION RULES

Extracted from `middleware/validation.js` and service-layer checks.

### Create Student (`createUnifiedUserStudent`)

| Field | Rule |
|-------|------|
| `fullName` | Required; min 2; max 100; trimmed |
| `email` | Required; valid email; **Gmail only** (`isGmailAddress`) |
| `mobile` | Required; regex `/^[6-9]\d{9}$/` |
| `parentName` | Optional; min 2; max 100; trimmed |
| `parentMobile` | Optional; regex `/^[6-9]\d{9}$/` |
| `parentEmail` | **Forbidden** — 422 if sent |
| `centerId` | Required; hex; length 24 |
| `status` | Optional boolean |
| `userType` | Optional; must be `STUDENT` if sent; default `STUDENT` |

### Status Toggle (`updateUnifiedUserStatus`)

| Field | Rule |
|-------|------|
| `status` | Required boolean |

### Update Student (Service Layer)

| Field | Rule |
|-------|------|
| Body | Min 1 field |
| `email` / `mobile` | Unique across students (409 on conflict) |
| `password` | Min 6 chars; must match `confirmPassword` |
| `centerId` | Must exist in `Center` collection |
| `role` | One of: `super_admin`, `center_admin`, `employee`, `student`, `parent` |
| `location` | One of: `Hyderabad`, `New Delhi`, `Pune` |

### Create Business Validations (Service)

| Check | HTTP | Message |
|-------|------|---------|
| Center inactive/missing | 400 | `Invalid or inactive center` |
| Duplicate User email/mobile | 400 | `User already exists with this email or mobile` |
| Duplicate Student email/mobile | 400 | `A student already exists with this email/mobile` |
| MongoDB duplicate key | 409 | `Duplicate email, mobile, or employee ID` |

### Joi Validation Error Format (422)

```json
{
  "success": false,
  "statusCode": 11005,
  "message": "Validation failed",
  "data": null,
  "error": {
    "errors": [
      { "field": "email", "message": "Student email must be a Gmail address (e.g. name@gmail.com)" },
      { "field": "mobile", "message": "Invalid Indian mobile number" }
    ]
  },
  "errors": [
    { "field": "email", "message": "..." }
  ]
}
```

---

## 12. ERROR HANDLING GUIDE

### Standard Envelope (`utils/apiResponse.js`)

```json
{
  "success": false,
  "statusCode": 11001,
  "message": "Error message",
  "data": null,
  "error": null
}
```

### HTTP Status Reference

| HTTP | statusCode | When | Example Message | Frontend Strategy |
|------|------------|------|-----------------|-------------------|
| **400** | 11000 | Bad request, business rule | `Request body is empty...`, `Invalid or inactive center`, `Use PATCH /api/admin/admin-access/:id/status for admin records` | Show `message`; for empty body, use `extra.updatableFields` if present |
| **401** | 11001 | No/invalid token | `Not authorized, no token`, `Not authorized, token failed` | Redirect to login; clear token |
| **403** | 11002 | Wrong role or blocked action | `Access denied. Insufficient permissions.`, `Only student accounts can be modified from this module` | Show toast; disable action button; check `permissions` from list row |
| **404** | 11003 | Record not found | `User not found`, `Student not found` | Show not-found state; refetch list |
| **409** | 11004 | Duplicate | `Duplicate email or phone`, `A student already exists with this email` | Highlight conflicting field |
| **422** | 11005 | Joi validation | `Validation failed` + `error.errors[]` | Map `field` → form field errors |
| **500** | 13000 | Server error | `Server error` | Generic error toast; log details |

### Role Middleware 403 (non-apiResponse style)

```json
{
  "message": "Access denied. Insufficient permissions.",
  "required": ["super_admin"],
  "current": "center_admin"
}
```

### Frontend Global Handler (Axios interceptor)

```typescript
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const body = error.response?.data;
    const message = body?.message || body?.error?.message || 'Request failed';

    if (status === 401) {
      // clear token, redirect login
    } else if (status === 422 && body?.error?.errors) {
      // return structured field errors to form
    } else if (status === 403) {
      // show message; may include editDisabledReason from prior list load
    }
    return Promise.reject({ status, message, errors: body?.error?.errors ?? body?.errors });
  }
);
```

---

## 13. TABLE IMPLEMENTATION GUIDE

### Columns (Recommended)

| Column | Source Field | Sortable (`sortBy`) | Notes |
|--------|-------------|---------------------|-------|
| Full Name | `fullName` | `fullName` | Primary link to detail |
| Email | `email` | `email` | — |
| Phone | `phoneNumber` | — | — |
| Role | `role` | `role` | From backend only |
| Center | `center` | — | — |
| Status | `status` | `status` | Badge: ACTIVE=green, INACTIVE=gray |
| Joined | `joinedDate` | `joinedDate` | Format `YYYY-MM-DD` |
| Type | `recordType` | — | USER / STUDENT / ADMIN badge |
| Actions | `permissions` | — | View always; Edit/Delete per `canEdit`/`canDelete` |

Optional: `studentId` column for student rows.

### Search

- Debounce 300–500ms.
- Bind to `search` query param.
- Clear resets to page 1.

### Filters

| Filter | API Param | Dropdown Source |
|--------|-----------|-----------------|
| Role | `role` | `GET /api/admin/user-roles` |
| Center | `center` | `GET /api/admin/user-centers` |
| Status | `status` | Static: `ACTIVE`, `INACTIVE` |
| Record Type | `recordType` | Static: `ALL`, `USER`, `ADMIN` |

Reset all filters → `role=ALL`, `center=ALL`, omit `status` and `recordType`.

### Pagination

```typescript
const page = filters.page;       // 1-based
const limit = filters.limit;     // default 10, max 100
const totalPages = response.data.data.totalPages;
```

Use server `total` and `totalPages` — do not client-side paginate.

### Sorting

Pass `sortBy` + `sortOrder` to API. Reset page to 1 on sort change.

### Status Rendering

| `status` | Badge | Toggle Action |
|----------|-------|---------------|
| `ACTIVE` | Green "Active" | PATCH `status: false` |
| `INACTIVE` | Gray "Inactive" | PATCH `status: true` |

For `recordType: ADMIN` → use `PATCH /api/admin/admin-access/:id/status` with `id` from row.

Status body: `{ "status": true }` = ACTIVE, `{ "status": false }` = INACTIVE.

### Actions

| Action | Condition | API |
|--------|-----------|-----|
| View | `permissions.canView` (always true) | `GET /api/admin/users/:id?type={recordType}` |
| Edit | `permissions.canEdit` | `PUT /api/admin/users/:id?type={recordType}` |
| Delete | `permissions.canDelete` | `DELETE /api/admin/users/:id?type={recordType}` |
| Toggle Status | Student rows | `PATCH /api/admin/users/:id/status` |
| Toggle Status | Admin rows | `PATCH /api/admin/admin-access/:id/status` |

Show tooltip with `editDisabledReason` / `deleteDisabledReason` when actions disabled.

### Date Formatting

- `joinedDate`: already `YYYY-MM-DD` from backend.
- `createdAt`: format with locale or `Intl.DateTimeFormat`.

### Badges

- **Status:** ACTIVE / INACTIVE
- **Record Type:** USER (portal), STUDENT (batch-only), ADMIN (staff)
- **Role:** use `role` label from row; color by `roleType` hash — not hardcoded role names

---

## 14. FORM IMPLEMENTATION GUIDE

### Create User (Create Student)

| UI Element | Implementation |
|------------|----------------|
| Title | From `module-config.createFormLabel` → `"Create Student"` |
| Role field | From `GET /api/admin/user-create-roles`; disabled/locked |
| Center | `GET /api/admin/centers/dropdown` → select `centerId` |
| Status | Toggle, default `true` |
| Submit | `POST /api/admin/users` |
| Validation | Section 11; Gmail + Indian mobile |

### Edit User (Student Only)

| UI Element | Implementation |
|------------|----------------|
| Load | `GET /api/admin/users/:id?type={recordType}` |
| Field catalog | `GET /api/admin/users/update-fields?type=USER` |
| Disabled state | `permissions.canEdit === false` → read-only with reason |
| Center | Same centers dropdown as create |
| Parent fields | From `summary.studentDetails` or `studentProfile` |
| Submit | `PUT /api/admin/users/:id?type={recordType}` |

### View User (Any Type)

| UI Element | Implementation |
|------------|----------------|
| Student | Display `summary` + `studentDetails` |
| Admin | Display `summary` (read-only); link to Admin Access screen for edits |
| Actions | Hide Edit/Delete when `permissions` false |

### Field Types

| Field | Input Type |
|-------|------------|
| `fullName` | text |
| `email` | email |
| `mobile` / `phoneNumber` | tel (10 digits) |
| `centerId` | select (searchable) |
| `status` / `isActive` | toggle |
| `parentName` | text |
| `parentMobile` | tel |
| `parentEmail` | email (edit only) |

### Submission Flow

```
Validate client-side (mirror Section 11)
        │
        ▼
Submit mutation
        │
        ├── Success → refetch list + detail (Section 18)
        └── Error → map 422 errors to fields; show toast for others
```

### Default Values

| Field | Default |
|-------|---------|
| `status` | `true` |
| `role` | Locked `STUDENT` (display only) |
| Filters `role`, `center` | `ALL` |
| `page` | `1` |
| `limit` | `10` |
| `sortBy` | `createdAt` |
| `sortOrder` | `desc` |

---

## 15. FRONTEND SERVICE LAYER

### Architecture

```
src/services/api.ts          ← Axios instance (VITE_API_BASE_URL, token injection)
src/services/userService.ts  ← List Users API calls
```

### `src/services/userService.ts`

```typescript
import api from './api';

export interface UserListParams {
  search?: string;
  role?: string;
  center?: string;
  centerId?: string;
  status?: 'ACTIVE' | 'INACTIVE';
  recordType?: 'ALL' | 'USER' | 'STUDENT' | 'ADMIN';
  userType?: string;
  page?: number;
  limit?: number;
  sortBy?: 'createdAt' | 'fullName' | 'email' | 'role' | 'status' | 'joinedDate';
  sortOrder?: 'asc' | 'desc';
}

export interface CreateStudentPayload {
  fullName: string;
  email: string;
  mobile: string;
  parentName?: string;
  parentMobile?: string;
  centerId: string;
  status?: boolean;
}

export interface UpdateStudentPayload {
  fullName?: string;
  name?: string;
  email?: string;
  mobile?: string;
  phoneNumber?: string;
  centerId?: string;
  status?: boolean;
  isActive?: boolean;
  parentName?: string;
  parentMobile?: string;
  parentEmail?: string;
}

const BASE = '/api/admin/users';

export const userService = {
  getModuleConfig: () => api.get(`${BASE}/module-config`),

  getUsers: (params: UserListParams) => api.get(BASE, { params }),

  getUsersPost: (body: UserListParams) => api.post(`${BASE}/list`, body),

  getUserById: (id: string, type?: string) =>
    api.get(`${BASE}/${id}`, { params: type ? { type } : undefined }),

  getUserDetailPost: (id: string, type?: string) =>
    api.post(`${BASE}/detail`, { id, type }),

  createUser: (payload: CreateStudentPayload) => api.post(BASE, payload),

  updateUser: (id: string, payload: UpdateStudentPayload, type?: string) =>
    api.put(`${BASE}/${id}`, payload, { params: type ? { type } : undefined }),

  deleteUser: (id: string, type?: string) =>
    api.delete(`${BASE}/${id}`, { params: type ? { type } : undefined }),

  updateUserStatus: (id: string, status: boolean, type?: string) =>
    api.patch(`${BASE}/${id}/status`, { status }, { params: type ? { type } : undefined }),

  getUpdateFields: (type: 'USER' | 'ADMIN' = 'USER') =>
    api.get(`${BASE}/update-fields`, { params: { type } }),

  getRoleDropdown: () => api.get('/api/admin/user-roles'),

  getCenterDropdown: () => api.get('/api/admin/user-centers'),

  getCreateRoleDropdown: () => api.get('/api/admin/user-create-roles'),

  getCenterFormDropdown: () => api.get('/api/admin/centers/dropdown'),

  updateAdminStatus: (adminId: string, status: boolean) =>
    api.patch(`/api/admin/admin-access/${adminId}/status`, { status }),
};
```

---

## 16. TANSTACK QUERY INTEGRATION

### Query Keys

```typescript
export const userKeys = {
  all: ['users'] as const,
  lists: () => [...userKeys.all, 'list'] as const,
  list: (params: UserListParams) => [...userKeys.lists(), params] as const,
  details: () => [...userKeys.all, 'detail'] as const,
  detail: (id: string, type?: string) => [...userKeys.details(), id, type] as const,
  moduleConfig: () => [...userKeys.all, 'module-config'] as const,
  updateFields: (type: string) => [...userKeys.all, 'update-fields', type] as const,
  roles: () => [...userKeys.all, 'dropdown', 'roles'] as const,
  centers: () => [...userKeys.all, 'dropdown', 'centers'] as const,
  createRoles: () => [...userKeys.all, 'dropdown', 'create-roles'] as const,
  centerForm: () => [...userKeys.all, 'dropdown', 'center-form'] as const,
};
```

### `src/hooks/useUsers.ts`

```typescript
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { userService, UserListParams } from '@/services/userService';
import { userKeys } from './userKeys';

export function useUsers(params: UserListParams) {
  return useQuery({
    queryKey: userKeys.list(params),
    queryFn: async () => {
      const { data } = await userService.getUsers(params);
      return data.data; // { total, page, limit, totalPages, count, data: rows[] }
    },
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  });
}
```

### `src/hooks/useUser.ts`

```typescript
import { useQuery } from '@tanstack/react-query';
import { userService } from '@/services/userService';
import { userKeys } from './userKeys';

export function useUser(id: string, type?: string, enabled = true) {
  return useQuery({
    queryKey: userKeys.detail(id, type),
    queryFn: async () => {
      const { data } = await userService.getUserById(id, type);
      return data.data;
    },
    enabled: !!id && enabled,
  });
}
```

### `src/hooks/useCreateUser.ts`

```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { userService, CreateStudentPayload } from '@/services/userService';
import { userKeys } from './userKeys';

export function useCreateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateStudentPayload) => userService.createUser(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });
    },
  });
}
```

### `src/hooks/useUpdateUser.ts`

```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { userService, UpdateStudentPayload } from '@/services/userService';
import { userKeys } from './userKeys';

export function useUpdateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      payload,
      type,
    }: {
      id: string;
      payload: UpdateStudentPayload;
      type?: string;
    }) => userService.updateUser(id, payload, type),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: userKeys.detail(variables.id, variables.type),
      });
    },
  });
}
```

### `src/hooks/useDeleteUser.ts`

```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { userService } from '@/services/userService';
import { userKeys } from './userKeys';

export function useDeleteUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, type }: { id: string; type?: string }) =>
      userService.deleteUser(id, type),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });
    },
  });
}
```

### Cache Strategy

| Data | staleTime | Notes |
|------|-----------|-------|
| User list | 30s | `keepPreviousData` during pagination/filter |
| User detail | 0 | Always fresh after edit |
| Dropdowns (roles, centers) | 5 min | Invalidate on role/center CRUD from other screens |
| Module config | 10 min | Rarely changes |

### Mutation Strategy

- Optimistic updates: **not recommended** — server merges students + admins in memory; use pessimistic + refetch.
- On success: `invalidateQueries` for list; for update also invalidate detail.

### Refetch Strategy

- After create/update/delete/status: invalidate list.
- After update: also refetch detail by ID.
- On window focus: optional `refetchOnWindowFocus: true` for list.

---

## 17. CENTRALIZED API ARCHITECTURE

### `src/services/api.ts`

```typescript
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30_000,
});

// Token injection
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token'); // or your auth store
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor — global error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const data = error.response?.data;

    if (status === 401) {
      localStorage.removeItem('auth_token');
      // dispatch logout / redirect to /login
    }

    return Promise.reject({
      status,
      message: data?.message ?? 'Request failed',
      statusCode: data?.statusCode,
      errors: data?.error?.errors ?? data?.errors,
    });
  }
);

export default api;
```

### Environment Variables

```env
VITE_API_BASE_URL=http://localhost:5000
```

**Never hardcode** `localhost:5000` or production URLs in service files.

---

## 18. SERVER PERSISTENCE RULES

Server data is the **source of truth**. Never trust mutation response alone for table state.

### Create

1. `POST /api/admin/users` → 201
2. **Refetch** `GET /api/admin/users` with current filters
3. Optionally verify: `GET /api/admin/users/:id?type=USER` using `data.summary.id`
4. Confirm new row appears with matching `email` and `fullName`

### Update

1. `PUT /api/admin/users/:id?type={recordType}` → 200
2. **Refetch** detail: `GET /api/admin/users/:id?type={recordType}`
3. **Refetch** list with current filters
4. Compare `summary` fields to submitted payload

### Delete

1. `DELETE /api/admin/users/:id?type={recordType}` → 200
2. **Refetch** list
3. Confirm row absent; `GET` by ID returns 404

### Status Toggle

1. `PATCH` appropriate status endpoint → 200
2. **Refetch** list row or full list
3. Confirm `status` is `ACTIVE` or `INACTIVE` matching boolean sent

### Refresh Flow

Full page reload must show same data — all state comes from API, not localStorage (except auth token).

---

## 19. COMPLETE DATA FLOW

### Page Load

```
Mount ListUsersPage
    ├── useQuery module-config
    ├── useQuery user-roles (filter dropdown)
    ├── useQuery user-centers (filter dropdown)
    └── useQuery users(defaultParams)
```

### Dropdown Load

```
GET /api/admin/user-roles  → role filter options
GET /api/admin/user-centers → center filter options
(On create modal open)
GET /api/admin/user-create-roles → locked STUDENT display
GET /api/admin/centers/dropdown → center select options
```

### User List Load

```
GET /api/admin/users?search&role&center&status&recordType&page&limit&sortBy&sortOrder
    → render table from data.data.data
    → render pagination from data.data.totalPages
    → enable/disable actions from row.permissions
```

### Create User

```
Open Create Student modal
    → load create-roles + centers/dropdown
    → validate form (Section 11)
    → POST /api/admin/users
    → on success: invalidate list, close modal
    → refetch list, verify row exists
```

### Edit User

```
Click Edit (permissions.canEdit)
    → GET /api/admin/users/:id?type={recordType}
    → GET /api/admin/users/update-fields?type=USER
    → populate form from summary
    → PUT /api/admin/users/:id?type={recordType}
    → refetch detail + list
```

### Delete User

```
Click Delete (permissions.canDelete)
    → confirm dialog
    → DELETE /api/admin/users/:id?type={recordType}
    → refetch list
```

### Refresh Flow

```
User clicks Refresh OR refetchOnWindowFocus
    → invalidateQueries userKeys.lists()
    → re-run GET /api/admin/users with current params
```

### Error Flow

```
API error
    → 401: logout + redirect
    → 403: toast + disable action
    → 422: map field errors to form
    → 409: highlight duplicate field
    → 500: generic error toast
```

### Success Flow

```
Mutation success
    → toast success message from response.data.message
    → invalidate + refetch list
    → close modal / navigate back
```

---

## 20. IMPLEMENTATION CHECKLIST

Developer must verify:

- [ ] User List works (`GET /api/admin/users`)
- [ ] Search works (`search` param)
- [ ] Filters work (`role`, `center`, `status`, `recordType`)
- [ ] Pagination works (`page`, `limit`, `totalPages` from server)
- [ ] Sorting works (`sortBy`, `sortOrder`)
- [ ] View User works (`GET /api/admin/users/:id?type=...`)
- [ ] Create User works (`POST /api/admin/users` — student only)
- [ ] Update User works (`PUT /api/admin/users/:id` — student only)
- [ ] Delete User works (`DELETE /api/admin/users/:id` — student only)
- [ ] Role APIs work (`GET /api/admin/user-roles`, `GET /api/admin/user-create-roles`)
- [ ] Dropdown APIs work (`user-roles`, `user-centers`, `centers/dropdown`)
- [ ] Validation rules implemented (Gmail, Indian mobile, required fields)
- [ ] Error handling implemented (401, 403, 404, 409, 422, 500)
- [ ] Loading states implemented (list, detail, mutations, dropdowns)
- [ ] Data persists on server (refetch after mutations)
- [ ] Data visible after refresh (no local-only state)
- [ ] No hardcoded roles (use `user-roles` API)
- [ ] No hardcoded data (centers from API)
- [ ] No mock data
- [ ] No console errors
- [ ] No TypeScript errors
- [ ] No build errors
- [ ] Admin rows: Edit/Delete disabled per `permissions`
- [ ] Admin status uses `/api/admin/admin-access/:id/status`
- [ ] `parentEmail` not sent on create
- [ ] Existing functionality preserved

---

## APPENDIX: Backend File Index

| Concern | File |
|---------|------|
| Routes | `routes/userManagementRoutes.js`, `routes/adminRoutes.js` |
| Controller | `controllers/userManagementController.js` |
| List normalization | `utils/userManagementHelpers.js` |
| Module config / permissions | `utils/userManagementStudentModule.js` |
| Create | `utils/userManagementCreate.js`, `utils/studentService.js` |
| Update | `utils/userManagementUpdate.js` |
| Status | `utils/userManagementStatus.js` |
| Delete | `utils/studentService.js` (`deleteStudent`) |
| Field catalog | `utils/userManagementFields.js` |
| Validation | `middleware/validation.js` |
| Auth | `middleware/authMiddleware.js` |
| Role guard | `middleware/roleMiddleware.js` |
| Response builder | `utils/apiResponse.js` |
| Status codes | `constants/apiStatusCodes.js` |
| Models | `models/User.js`, `models/Student.js`, `models/AdminAccess.js`, `models/Role.js`, `models/Center.js` |

---

*Generated from actual backend implementation. Do not use `USER_MANAGEMENT_API_GUIDE.md` for admin create/update via `/api/admin/users` — that path is student-only in wired routes.*
