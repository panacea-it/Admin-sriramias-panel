# Users & Access — Frontend Integration Guide

**Base URL:** `{{BASE_URL}}` (e.g. `http://localhost:5000` or `https://sriramias-backend.onrender.com`)  
**Auth:** `Authorization: Bearer <super_admin_token>`  
**Module:** `STUDENT_MANAGEMENT` (Users & Access screen)

---

## Backend answers (confirmed)

### Q1 — Student APIs: use `id` or `studentRecordId`?

**Always use `row.id`. Never use `row.studentRecordId` for API calls.**

| `recordType` | What `id` is | Example |
|--------------|--------------|---------|
| `USER` | Portal **User** `_id` | `6a2be651...` (User) |
| `STUDENT` | **Student** `_id` (batch-only, no portal login) | `6a2bfadd...` |
| `ADMIN` | **AdminAccess** `_id` | `6a2ab1b1...` |

When `studentRecordId` differs from `id` (portal students), `studentRecordId` is **display/reference only**.

```javascript
// ✅ Correct
const apiId = row.id;

// ❌ Wrong for USER rows
const apiId = row.studentRecordId;
```

---

### Q2 — Admin Edit/Delete from Users & Access?

**Two layers:**

1. **`permissions` on list row** — tells you what **Student Management** endpoints allow:
   - Admin rows: `canView: true`, `canEdit: false`, `canDelete: false`
   - Meaning: do **not** call `PUT/DELETE /api/admin/users/:id` for admin rows

2. **Admin Management APIs** — separate endpoints for admin CRUD:
   - View/Edit/Delete/Status **do work** via `/api/admin/admin-access/...`
   - Frontend should route admin actions to these endpoints (see below)

**Recommendation:** Route by **`roleType`**, not by checking for `ADMIN` only. Use `permissions` to disable student endpoints on non-student rows. For all non-student roles, use **admin-access** APIs.

---

## Routing rule — use `roleType`, NOT `roleType === 'ADMIN'`

There are **many admin role types** in the system. Do **not** hardcode `ADMIN` only.

| Field | Purpose | Examples |
|-------|---------|----------|
| `role` | Display label in UI | `"Student"`, `"Admin1"`, `"Content Admin"`, `"Super Admin"` |
| `roleType` | **Primary routing key** | `"STUDENT"`, `"ADMIN"`, `"CONTENT_ADMIN"`, `"SUPER_ADMIN"`, `"TEACHER_ADMIN"`, … |
| `recordType` | Student API `?type=` query only | `"USER"`, `"STUDENT"`, `"ADMIN"` |
| `roleId` | Admin edit dropdown (ObjectId) | `"6a22fd9e332a81a3604e253b"` |

### The only rule frontend needs

```javascript
/** Student row → Student APIs */
const isStudentRow = (row) => row.roleType === 'STUDENT';

/** Any staff/admin role → Admin Access APIs */
const isStaffRow = (row) => row.roleType !== 'STUDENT';
```

### Examples from live API

| fullName | role (display) | roleType | recordType | API group |
|----------|----------------|----------|------------|-----------|
| darshan | Student | `STUDENT` | `STUDENT` | Student APIs |
| darshan | Student | `STUDENT` | `USER` | Student APIs |
| Main Mentor Admin | Admin1 | `ADMIN` | `ADMIN` | Admin Access APIs |
| Maharaj Singh | Content Admin | `CONTENT_ADMIN` | `ADMIN` | Admin Access APIs |
| Maharaj Singh | Super Admin | `SUPER_ADMIN` | `ADMIN` | Admin Access APIs |
| Sai | Teacher Admin | `TEACHER_ADMIN` | `ADMIN` | Admin Access APIs |

```javascript
// ❌ Wrong — misses CONTENT_ADMIN, SUPER_ADMIN, TEACHER_ADMIN, etc.
if (row.roleType === 'ADMIN') { ... }

// ✅ Correct
if (row.roleType === 'STUDENT') {
  // Student APIs
} else {
  // Admin Access APIs — works for ALL non-student roles
}
```

### Role filter dropdown (`GET /api/admin/user-roles`)

| Filter value | What it returns |
|--------------|-----------------|
| `ALL` | Students + all admin access accounts |
| `STUDENT` | Students only |
| `{roleId}` (ObjectId) | Admin accounts with that role only (Admin1, Content Admin, Super Admin, etc.) |

---

## Record types (for student API `?type=` query only)

When calling **Student APIs**, also pass `recordType` as the `type` query param:

| `recordType` | Meaning | `type` query |
|--------------|---------|--------------|
| `USER` | Student with portal login | `?type=USER` |
| `STUDENT` | Student batch record only | `?type=STUDENT` |

```javascript
const getStudentTypeQuery = (row) =>
  row.recordType === 'STUDENT' ? 'STUDENT' : 'USER';
```

Non-student rows always use **`/api/admin/admin-access/...`** — no `type` query needed.

---

## 1. List users

```http
GET /api/admin/users?page=1&limit=10&search=&role=ALL&centerId=ALL&status=ACTIVE
```

Optional query params: `search`, `role`, `centerId`, `status`, `page`, `limit`, `sortBy`, `sortOrder`

**Response shape:**

```json
{
  "success": true,
  "module": "STUDENT_MANAGEMENT",
  "total": 153,
  "page": 1,
  "limit": 10,
  "data": [ { "id", "recordType", "userType", "roleType", "permissions", ... } ]
}
```

**Dropdowns:**

```http
GET /api/admin/user-roles
GET /api/admin/user-centers
```

---

## 2. View action

### Student rows (`roleType === 'STUDENT'`)

```http
GET /api/admin/users/{id}?type=USER
GET /api/admin/users/{id}?type=STUDENT
```

Use `?type=USER` when `recordType === 'USER'`, and `?type=STUDENT` when `recordType === 'STUDENT'`.

Open **Student View Modal** with `response.summary`.

### Staff / Admin rows (`roleType !== 'STUDENT'`)

Applies to **all** non-student roles: `ADMIN`, `CONTENT_ADMIN`, `SUPER_ADMIN`, `TEACHER_ADMIN`, `MENTOR_ADMIN`, `CENTER_ADMIN`, etc.

```http
GET /api/admin/admin-access/{id}
```

Examples:

```http
GET /api/admin/admin-access/6a2ab1b1cc1663506764d72c          (ADMIN)
GET /api/admin/admin-access/6a2a884890504b6f9ad9c8b6          (CONTENT_ADMIN)
GET /api/admin/admin-access/6a2911f4f98d971da6b28c4c          (SUPER_ADMIN)
GET /api/admin/admin-access/6a2837eddd3668977c3222ec          (TEACHER_ADMIN)
```

Open **Admin Edit/View Modal** with response data.

---

## 3. Edit action

### Student rows — Student Edit Modal

```http
PUT /api/admin/users/{id}?type={recordType}
```

Use `row.id` and pass `type=USER` or `type=STUDENT` matching the list row.

**Example body (maps to your Edit User UI):**

```json
{
  "fullName": "Rahul Sharma",
  "email": "rahul.sharma@gmail.com",
  "mobile": "9876543210",
  "parentName": "Rajesh Sharma",
  "parentMobile": "9876501234",
  "centerId": "6a23e7f6687eddba52c0cfb6",
  "status": true
}
```

Field aliases accepted: `fullName`/`name`, `mobile`/`phoneNumber`, `status`/`isActive`.

### Staff / Admin rows — Admin Edit Modal (`roleType !== 'STUDENT'`)

```http
PUT /api/admin/admin-access/{id}
```

**Example body (maps to your Edit User Access UI):**

```json
{
  "fullName": "Main Mentor Admin",
  "officialEmail": "mentor22@sriramias.com",
  "contactNumber": "9876543278",
  "employeeId": "MENTOR0022",
  "roleId": "6a22fd9e332a81a3604e253b",
  "centerId": "6a23e7f6687eddba52c0cfb6",
  "password": "newPassword123",
  "confirmPassword": "newPassword123"
}
```

Password fields optional on update.

---

## 4. Delete action

### Student rows

```http
DELETE /api/admin/users/{id}?type={recordType}
```

### Staff / Admin rows (`roleType !== 'STUDENT'`)

```http
DELETE /api/admin/admin-access/{id}
```

Show confirmation dialog before both.

---

## 5. Enable / Disable status

### Student rows

```http
PATCH /api/admin/users/{id}/status?type={recordType}
Content-Type: application/json

{ "status": true }
```

| Value | Meaning |
|-------|---------|
| `true` | ACTIVE |
| `false` | INACTIVE |

### Staff / Admin rows (`roleType !== 'STUDENT'`)

```http
PATCH /api/admin/admin-access/{id}/status
Content-Type: application/json

{ "status": true }
```

> Note: Both student and admin use **`status`** (boolean). `accountStatus` is **not** the request field name.

**UI rule:**

```javascript
const isActive = row.status === 'ACTIVE';
const nextLabel = isActive ? 'Disable' : 'Enable';
const nextStatus = !isActive; // send true to enable, false to disable
```

---

## 6. Frontend action router (copy-paste)

```javascript
/** Primary routing — use roleType, not recordType or roleType === 'ADMIN' */
const isStudentRow = (row) => row.roleType === 'STUDENT';

const getStudentTypeQuery = (row) =>
  row.recordType === 'STUDENT' ? 'STUDENT' : 'USER';

export const handleView = async (row) => {
  if (isStudentRow(row)) {
    const res = await api.get(
      `/api/admin/users/${row.id}?type=${getStudentTypeQuery(row)}`
    );
    openStudentViewModal(res.data.summary);
  } else {
    // CONTENT_ADMIN, SUPER_ADMIN, TEACHER_ADMIN, ADMIN, etc.
    const res = await api.get(`/api/admin/admin-access/${row.id}`);
    openAdminViewModal(res.data.data ?? res.data);
  }
};

export const handleEdit = async (row) => {
  if (isStudentRow(row)) {
    if (!row.permissions?.canEdit) return;
    const res = await api.get(
      `/api/admin/users/${row.id}?type=${getStudentTypeQuery(row)}`
    );
    openStudentEditModal(res.data.summary);
  } else {
    const res = await api.get(`/api/admin/admin-access/${row.id}`);
    openAdminEditModal(res.data.data ?? res.data);
  }
};

export const handleSaveStudent = (row, body) =>
  api.put(`/api/admin/users/${row.id}?type=${getStudentTypeQuery(row)}`, body);

export const handleSaveAdmin = (row, body) =>
  api.put(`/api/admin/admin-access/${row.id}`, body);

export const handleDelete = async (row) => {
  if (isStudentRow(row)) {
    if (!row.permissions?.canDelete) return;
    await api.delete(
      `/api/admin/users/${row.id}?type=${getStudentTypeQuery(row)}`
    );
  } else {
    await api.delete(`/api/admin/admin-access/${row.id}`);
  }
  refreshList();
};

export const handleStatusToggle = async (row) => {
  const enable = row.status !== 'ACTIVE';
  if (isStudentRow(row)) {
    await api.patch(
      `/api/admin/users/${row.id}/status?type=${getStudentTypeQuery(row)}`,
      { status: enable }
    );
  } else {
    await api.patch(`/api/admin/admin-access/${row.id}/status`, {
      status: enable
    });
  }
  refreshList();
};
```

---

## 7. Action button visibility

```javascript
// View — always allowed
showView = row.permissions?.canView !== false;

// Student: respect permissions. Staff/Admin: always allow edit/delete via admin-access APIs
showEdit = isStudentRow(row) ? row.permissions?.canEdit : true;
showDelete = isStudentRow(row) ? row.permissions?.canDelete : true;

showStatusToggle = true;
```

Show tooltip from `editDisabledReason` / `deleteDisabledReason` when buttons are disabled.

---

## 8. UI → API field mapping

### Student Edit Modal

| UI field | API field |
|----------|-----------|
| Full Name | `fullName` |
| Email | `email` |
| Phone Number | `mobile` |
| Parent Name | `parentName` |
| Parent Phone | `parentMobile` |
| Assigned Center | `centerId` |
| Status Active/Inactive | `status: true/false` |

### Admin Edit Modal

| UI field | API field |
|----------|-----------|
| Full Name | `fullName` |
| Official Email | `officialEmail` |
| Mobile Number | `contactNumber` |
| Employee ID | `employeeId` |
| Admin Access (dropdown) | `roleId` |
| Assigned Center | `centerId` |
| New password | `password` + `confirmPassword` |

---

## 9. Error handling

| Status | Meaning |
|--------|---------|
| `403` | Tried student endpoint on admin row |
| `404` | Wrong id (e.g. used `studentRecordId` instead of `id`) |
| `400` | Validation error / empty body |
| `503` | Email not configured (signup OTP — separate flow) |

After edit/delete/status change → refresh list with `GET /api/admin/users`.

---

## 10. Cursor AI prompt (give this to frontend team)

Copy everything inside the block below into Cursor:

```text
Integrate the Sriram IAS "Users & Access" page with these backend APIs.

SCREEN: Users Management table — Full Name, Email, Phone, Role, Center, Status, Joined, Actions (View, Edit, Disable/Enable, Delete).

LIST API:
GET {{BASE_URL}}/api/admin/users?page=1&limit=25&search=&role=ALL&centerId=ALL&status=ACTIVE

Each row has:
- id (USE THIS for all API calls — never studentRecordId)
- roleType: "STUDENT" | "ADMIN" | "CONTENT_ADMIN" | "SUPER_ADMIN" | "TEACHER_ADMIN" | etc.
- recordType: "USER" | "STUDENT" | "ADMIN" (use only for student ?type= query)
- role: display label ("Student", "Admin1", "Content Admin", ...)
- roleId: ObjectId for admin role dropdown on edit
- status: "ACTIVE" | "INACTIVE"
- permissions: { canView, canEdit, canDelete }

PRIMARY ROUTING RULE (do NOT check roleType === "ADMIN" only):

  if (row.roleType === "STUDENT") → Student APIs
  else → Admin Access APIs (works for ADMIN, CONTENT_ADMIN, SUPER_ADMIN, TEACHER_ADMIN, MENTOR_ADMIN, CENTER_ADMIN, etc.)

STUDENT (roleType === "STUDENT"):
- View:  GET /api/admin/users/{row.id}?type=USER or ?type=STUDENT (match row.recordType)
- Edit:  PUT /api/admin/users/{row.id}?type=USER|STUDENT
         Body: fullName, email, mobile, parentName, parentMobile, centerId, status (boolean)
- Delete: DELETE /api/admin/users/{row.id}?type=USER|STUDENT
- Status: PATCH /api/admin/users/{row.id}/status?type=USER|STUDENT  { status: true|false }
- Respect permissions.canEdit / canDelete

NON-STUDENT (roleType !== "STUDENT") — all staff/admin roles:
- View:  GET /api/admin/admin-access/{row.id}
- Edit:  PUT /api/admin/admin-access/{row.id}
         Body: fullName, officialEmail, contactNumber, employeeId, roleId, centerId, password, confirmPassword
- Delete: DELETE /api/admin/admin-access/{row.id}
- Status: PATCH /api/admin/admin-access/{row.id}/status  { status: true|false }

UI MODALS:
- roleType === "STUDENT" → Student Edit Modal (Basic Info + Family + Center + Status)
- roleType !== "STUDENT" → Admin Edit Modal (Personal Info + Access Config + Password)

ROLE FILTER: GET /api/admin/user-roles
- value "STUDENT" → students only
- value "{roleId}" → filter by Admin1, Content Admin, Super Admin, etc.

CENTER FILTER: GET /api/admin/user-centers

After mutations, refetch GET /api/admin/users.
```

---

## Quick reference

| Action | Student (`roleType === 'STUDENT'`) | Staff/Admin (`roleType !== 'STUDENT'`) |
|--------|-----------------------------------|----------------------------------------|
| List | `GET /api/admin/users` | same |
| View | `GET /api/admin/users/{id}?type=USER\|STUDENT` | `GET /api/admin/admin-access/{id}` |
| Edit | `PUT /api/admin/users/{id}?type=...` | `PUT /api/admin/admin-access/{id}` |
| Delete | `DELETE /api/admin/users/{id}?type=...` | `DELETE /api/admin/admin-access/{id}` |
| Status | `PATCH /api/admin/users/{id}/status` | `PATCH /api/admin/admin-access/{id}/status` |
| ID | **`row.id`** | **`row.id`** |
| Roles covered | Student only | ADMIN, CONTENT_ADMIN, SUPER_ADMIN, TEACHER_ADMIN, MENTOR_ADMIN, CENTER_ADMIN, … |
