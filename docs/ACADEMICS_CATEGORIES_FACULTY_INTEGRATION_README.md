# Academics → Categories → Faculty — Frontend Integration README

> **Official integration source of truth for Faculty module frontend development**  
> Backend resource: `Teacher` (API messages use “Faculty”) · API base: `/api/teachers` · MongoDB collection: `teachers`  
> Admin route (UI): `/academics/categories/faculty`

---

## Critical Naming — Read First

The backend uses **three different “Faculty” concepts**. This document covers the **Academics → Categories → Faculty** module only.

| Concept | Model | API Base | Purpose | In Scope |
|---------|-------|----------|---------|----------|
| **Academic Faculty (this doc)** | `Teacher` | `/api/teachers` | ERP faculty — center-scoped instructors linked to global Subjects | **Yes — primary** |
| Faculty Subject CMS | `FacultySubject` | `/api/faculty-subjects` | Subject + teacher + topics + delivery categories for batches/content | Appendix A |
| Center website profiles | `Faculty` | `/api/centers/:id/faculty` | Marketing staff cards on center public pages | **No** — different module |

RBAC feature **“Faculty Management”** under module `ACADEMICS` maps to **`Teacher`** at `/api/teachers`, not center CMS `Faculty`.

> **Repo note:** `src/services/facultyService.ts` currently implements **FacultySubject** dropdown APIs. For this module, implement the methods in **Section 11** against `/api/teachers`. Rename the existing file to `facultySubjectService.ts` or split services to avoid collision.

---

## SECTION 1 — MODULE OVERVIEW

### What Faculty Represents

**Faculty** in the Academics admin UI is a **center-scoped instructor record** stored as `Teacher` in MongoDB. Each faculty member:

- Belongs to exactly **one Center** (`centerId`)
- Can teach one or more **global Subjects** (`subjects[]` → `Subject._id`)
- Has a server-generated code (`teacherId`, e.g. `TCH001`)
- Has lifecycle `status`: `ACTIVE` | `INACTIVE`
- Uses **soft delete** (`isDeleted`, `deletedAt`) — deleted records are hidden from list/detail queries

Faculty records are **content masters** (like Subject/Topic), not course taxonomy. They power downstream **FacultySubject** assignments, which batches and LMS content consume.

### Admin Navigation Context

The admin sidebar groups **Subject**, **Topic**, **Faculty**, **Program**, and **Exam Category** under **Academics → Categories**. That grouping is **organizational only**. The Faculty API has **no** `programId`, `categoryId`, `courseId`, or `batchId` fields.

### Two Hierarchies (Critical)

```text
ACADEMIC ERP (center-scoped taxonomy)
Center → Program → Exam Category (AcademicCategory) → Exam Sub Category → Course → Batch

CONTENT MASTERS (global + center-scoped faculty)
Subject → Topic
Teacher (Faculty) → centerId + subjects[]
FacultySubject → subject + teacher + topics[] + delivery categories[]
```

There is **no database foreign key** between `Teacher` and `AcademicCategory` (Exam Category).

### Relation with Categories (Exam Category / `AcademicCategory`)

| Aspect | Detail |
|--------|--------|
| Database link | **None** — `Teacher` has no `categoryId`; `AcademicCategory` has no `teachers` field |
| API link | **None** — `/api/teachers` does not accept `programId` or `categoryId` params |
| UI grouping | Both appear under Academics → Categories in the admin sidebar |
| Practical use | Exam Categories scope **courses**; Faculty scope **instruction** at a center |

Do **not** filter Faculty list by exam category. Use `center` / `centerId` and `subject` query params.

### Relation with Subjects

| Aspect | Detail |
|--------|--------|
| Cardinality | Many-to-many — `Teacher.subjects[]` holds Subject ObjectIds |
| Create requirement | **At least one** ACTIVE, non-deleted Subject required on create |
| Update | Replacing `subjects` re-validates all IDs are ACTIVE |
| Dropdown | `GET /api/subjects/dropdown` for multi-select on create/edit |
| Filter list | `GET /api/teachers?subject=<Subject._id>` |

### Relation with Courses

| Aspect | Detail |
|--------|--------|
| Direct link | **None** — `Course` has no `teacher` or `faculty` field |
| Indirect path | Course → Batch → `facultySubjects[]` → `FacultySubject.teacher` → Teacher |

### Relation with Batches

| Aspect | Detail |
|--------|--------|
| Direct link | **None** — `Batch` has no `teacher` field |
| Indirect path | `Batch.facultySubjects[]` → `FacultySubject` → `teacher` (Teacher `_id`) |
| Batch also has | `mentor` → `AdminAccess` (MENTOR_ADMIN) — separate from Faculty |

### Relation with Centers

| Aspect | Detail |
|--------|--------|
| FK field | `Teacher.centerId` → `Center._id` (**required** on create) |
| Validation | Center must be `status: 'ACTIVE'` (`findActiveCenter`) |
| Create payload | `centerId` (alias: `center`) |
| Response | `centerId`, `centerName` (populated) |
| Dropdown | `GET /api/centers/dropdown` or `GET /api/admin/centers/dropdown` |
| Filter list | `GET /api/teachers?centerId=<id>` or `?center=<id>` |

### FacultySubject Delivery Categories (Not Exam Category)

`FacultySubject.categories` stores **content delivery types** (`LIVE_CLASS`, `RECORDING`, etc.) — **not** `AcademicCategory`. See **Appendix A** for the FacultySubject module.

### Design Rules

| Rule | Detail |
|------|--------|
| Center-scoped | Every faculty member belongs to one center |
| Auto ID | `teacherId` is server-generated (`TCH001`, `TCH002`, …) — never send on create |
| Soft delete | `DELETE` sets `isDeleted: true`, `deletedAt`, `status: INACTIVE` |
| Subject validation | All `subjects[]` must be ACTIVE and non-deleted |
| No uploads | All Teacher endpoints use JSON — no file fields |
| Audit trail | Create/update/delete/status write to audit log module `Faculty Management` |

### User Flow

1. Super Admin logs in (`POST /api/auth/login-super-admin`).
2. Opens **Academics → Categories → Faculty**.
3. Lists faculty with search, center filter, subject filter, status filter, pagination, sorting.
4. **Create**: selects Center → multi-selects Subjects → enters name, optional description → saves.
5. **Edit**: updates name, center, subjects, description, or status.
6. **Toggle status**: `ACTIVE` ↔ `INACTIVE` via `PATCH /api/teachers/status/:id`.
7. **Delete**: soft delete — faculty becomes `INACTIVE` and hidden from non-deleted queries.

### Backend Layer Stack

```text
app.js → app.use('/api/teachers', teacherRoutes)
routes/teacherRoutes.js
  └── middleware: protect → requireSuperAdmin (all routes)
  └── controllers/teacherController.js
        └── models/Teacher.js
        └── models/Center.js (center validation via findActiveCenter)
        └── models/Subject.js (subject validation via validateActiveSubjectIds)
        └── utils/contentIdGenerator.js (generateTeacherId)
        └── utils/contentMastersHelpers.js (pagination, sort, search, NOT_DELETED)
        └── services/auditLogService.js (FACULTY_MANAGEMENT audit)
```

There is **no** dedicated `teacherService.js` in the backend. All business logic lives in `teacherController.js`. There is **no** Joi/Zod/express-validator on Teacher routes — validation is inline in the controller.

---

## SECTION 2 — DATABASE MODEL

MongoDB collection: **`teachers`** · Model file: `models/Teacher.js`

| Field Name | Type | Required | Default Value | Validation | Description |
|------------|------|----------|---------------|------------|-------------|
| `_id` | ObjectId | auto | — | MongoDB ID | Primary key |
| `teacherId` | String | no | auto-generated | `unique: true`, `trim: true` | Human-readable code (`TCH001`, …) |
| `teacherName` | String | **yes** | — | `trim: true` | Display name |
| `centerId` | ObjectId → `Center` | **yes** | — | `index: true` | Owning center |
| `subjects` | ObjectId[] → `Subject` | no (schema) | `[]` | ref array | Subjects this faculty teaches; **min 1 enforced on create** |
| `description` | String | no | `''` | — | Free text bio/notes |
| `status` | String | no | `'ACTIVE'` | enum: `ACTIVE`, `INACTIVE` | Lifecycle status |
| `isDeleted` | Boolean | no | `false` | `index: true` | Soft-delete flag |
| `deletedAt` | Date | no | `null` | — | Soft-delete timestamp |
| `createdAt` | Date | auto | — | timestamps | Created at |
| `updatedAt` | Date | auto | — | timestamps | Updated at |

### Indexes (from schema)

- `{ teacherName: 1 }`
- `{ centerId: 1, status: 1, isDeleted: 1 }`
- `{ subjects: 1, status: 1, isDeleted: 1 }`
- `{ status: 1, isDeleted: 1 }`
- `teacherId` — unique

### List Query Filter (`NOT_DELETED`)

All list/detail/dropdown queries exclude `{ isDeleted: false }` unless noted.

---

## SECTION 3 — COMPLETE API INVENTORY

### Faculty (Teacher) APIs — This Module

| Feature | Method | Endpoint | Auth Required |
|---------|--------|----------|---------------|
| Create faculty | POST | `/api/teachers` | Yes — Super Admin |
| List faculty (paginated) | GET | `/api/teachers` | Yes — Super Admin |
| Faculty dropdown | GET | `/api/teachers/dropdown` | Yes — Super Admin |
| Get faculty by ID | GET | `/api/teachers/:id` | Yes — Super Admin |
| Update faculty | PUT | `/api/teachers/:id` | Yes — Super Admin |
| Toggle faculty status | PATCH | `/api/teachers/status/:id` | Yes — Super Admin |
| Delete faculty (soft) | DELETE | `/api/teachers/:id` | Yes — Super Admin |

**Route order note:** `/dropdown` and `/status/:id` are registered **before** `/:id` to avoid param conflicts.

**Source:** `routes/teacherRoutes.js`, `app.js` line 258

### Dependency APIs (Required for Forms & Filters)

| Feature | Method | Endpoint | Auth Required | Used For |
|---------|--------|----------|---------------|----------|
| Centers dropdown (staff) | GET | `/api/centers/dropdown` | Yes — Staff Admin | Center picker on create/edit |
| Centers dropdown (admin) | GET | `/api/admin/centers/dropdown` | Yes — Staff Admin | Alternative center picker |
| Subjects dropdown | GET | `/api/subjects/dropdown` | Yes — Super Admin | Subject multi-select |
| Get subject by ID | GET | `/api/subjects/:id` | Yes — Super Admin | Optional — `linkedTeachers` count |

### UI Action → Service Mapping

| UI Action | Service Method | HTTP | Endpoint |
|-----------|----------------|------|----------|
| List | `getFacultyList()` | GET | `/api/teachers` |
| Detail | `getFacultyById(id)` | GET | `/api/teachers/:id` |
| Dropdown | `getFacultyDropdown(params)` | GET | `/api/teachers/dropdown` |
| Create | `createFaculty(payload)` | POST | `/api/teachers` |
| Update | `updateFaculty(id, payload)` | PUT | `/api/teachers/:id` |
| Toggle status | `updateFacultyStatus(id, status)` | PATCH | `/api/teachers/status/:id` |
| Delete | `deleteFaculty(id)` | DELETE | `/api/teachers/:id` |
| Center dropdown | `centerService.getCentersDropdown()` | GET | `/api/centers/dropdown` |
| Subject dropdown | `subjectService.getSubjectsDropdown()` | GET | `/api/subjects/dropdown` |

---

## SECTION 4 — CREATE FACULTY API

| | |
|---|---|
| **Request URL** | `POST /api/teachers` |
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
  "teacherName": "Dr. Rajesh Kumar",
  "centerId": "665a1b2c3d4e5f6789012345",
  "subjects": [
    "665b1b2c3d4e5f6789012345",
    "665c1b2c3d4e5f6789012345"
  ],
  "description": "Senior faculty for Indian Polity",
  "status": "ACTIVE"
}
```

### Field Descriptions

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `teacherName` | string | **Yes** | — | Faculty display name; trimmed server-side |
| `centerId` | ObjectId string | **Yes** | — | Center MongoDB `_id`. Alias: `center` |
| `subjects` | ObjectId string[] | **Yes** (effective) | `[]` | At least one ACTIVE Subject `_id` |
| `description` | string | No | `""` | Free text; trimmed server-side |
| `status` | `ACTIVE` \| `INACTIVE` | No | `ACTIVE` | Non-`INACTIVE` coerced to `ACTIVE` |
| `teacherId` | — | **Do not send** | auto | Server generates `TCH001`, `TCH002`, … |

### Validation Rules

| Rule | HTTP | Error Message |
|------|------|---------------|
| `teacherName` missing or whitespace-only | 400 | `Faculty name is required` |
| `centerId` / `center` missing | 400 | `centerId is required` |
| Center invalid or inactive | 400 | `Invalid or inactive center` |
| `subjects` empty or invalid | 400 | `At least one subject is required` or `Invalid subject id in subjects array` or `One or more subjects are invalid or inactive` |
| Invalid `status` on create | — | Silently coerced: non-`INACTIVE` → `ACTIVE` |

### Example Request

```http
POST /api/teachers HTTP/1.1
Host: localhost:5000
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
Content-Type: application/json

{
  "teacherName": "Dr. Rajesh Kumar",
  "centerId": "665a1b2c3d4e5f6789012345",
  "subjects": ["665b1b2c3d4e5f6789012345"],
  "description": "Senior faculty for Indian Polity",
  "status": "ACTIVE"
}
```

```typescript
await api.post('/api/teachers', {
  teacherName: name.trim(),
  centerId: selectedCenterId,
  subjects: selectedSubjectIds,
  description: description.trim(),
  status: 'ACTIVE',
});
```

### Example Success Response (201)

```json
{
  "success": true,
  "message": "Faculty created successfully",
  "data": {
    "_id": "665d1b2c3d4e5f6789012345",
    "teacherId": "TCH001",
    "teacherName": "Dr. Rajesh Kumar",
    "centerId": "665a1b2c3d4e5f6789012345",
    "centerName": "Delhi Center",
    "description": "Senior faculty for Indian Polity",
    "subjects": [
      {
        "_id": "665b1b2c3d4e5f6789012345",
        "subjectId": "SUB001",
        "subjectName": "Indian Polity"
      }
    ],
    "status": "ACTIVE",
    "createdAt": "2025-06-01T10:00:00.000Z",
    "updatedAt": "2025-06-01T10:00:00.000Z"
  }
}
```

### Example Error Responses

| Status | Body |
|--------|------|
| 400 | `{ "success": false, "message": "Faculty name is required" }` |
| 400 | `{ "success": false, "message": "centerId is required" }` |
| 400 | `{ "success": false, "message": "Invalid or inactive center" }` |
| 400 | `{ "success": false, "message": "At least one subject is required" }` |
| 401 | `{ "success": false, "message": "Not authorized, no token" }` |
| 403 | `{ "success": false, "message": "Access denied. Super Admin only." }` |
| 500 | `{ "success": false, "message": "Server error", "error": "..." }` |

---

## SECTION 5 — UPDATE FACULTY API

| | |
|---|---|
| **Request URL** | `PUT /api/teachers/:id` |
| **Method** | PUT |
| **Authentication** | Bearer JWT — Super Admin only |
| **URL Param** | `id` — Teacher MongoDB `_id` |

### Headers

Same as Create.

### Request Payload (all fields optional — send only fields to change)

```json
{
  "teacherName": "Dr. Rajesh Kumar (Updated)",
  "centerId": "665a1b2c3d4e5f6789012345",
  "subjects": ["665b1b2c3d4e5f6789012345"],
  "description": "Updated bio",
  "status": "INACTIVE"
}
```

### Validation Rules

| Rule | HTTP | Error Message |
|------|------|---------------|
| Faculty not found / soft-deleted | 404 | `Faculty not found` |
| `teacherName` sent as empty string | 400 | `Faculty name cannot be empty` |
| `centerId` / `center` sent as empty | 400 | `centerId cannot be empty` |
| Center invalid or inactive | 400 | `Invalid or inactive center` |
| Invalid `subjects` array | 400 | Subject validation messages (same as create) |
| Invalid `status` | 400 | `Status must be ACTIVE or INACTIVE` |

### Example Success Response (200)

```json
{
  "success": true,
  "message": "Faculty updated successfully",
  "data": {
    "_id": "665d1b2c3d4e5f6789012345",
    "teacherId": "TCH001",
    "teacherName": "Dr. Rajesh Kumar (Updated)",
    "centerId": "665a1b2c3d4e5f6789012345",
    "centerName": "Delhi Center",
    "description": "Updated bio",
    "subjects": [
      {
        "_id": "665b1b2c3d4e5f6789012345",
        "subjectId": "SUB001",
        "subjectName": "Indian Polity"
      }
    ],
    "status": "INACTIVE",
    "createdAt": "2025-06-01T10:00:00.000Z",
    "updatedAt": "2025-06-02T14:30:00.000Z"
  }
}
```

### Status Toggle (Dedicated Endpoint)

| | |
|---|---|
| **URL** | `PATCH /api/teachers/status/:id` |
| **Body** | `{ "status": "ACTIVE" }` or `{ "status": "INACTIVE" }` |
| **Success message** | `Faculty status updated` |

Use this for inline list toggles. Use `PUT` when changing status alongside other fields in an edit form.

---

## SECTION 6 — DELETE FACULTY API

| | |
|---|---|
| **Request URL** | `DELETE /api/teachers/:id` |
| **Method** | DELETE |
| **Authentication** | Bearer JWT — Super Admin only |
| **URL Param** | `id` — Teacher MongoDB `_id` |

### Behavior

- **Soft delete** — document remains in MongoDB
- Sets `isDeleted: true`, `deletedAt: <now>`, `status: 'INACTIVE'`
- **No** backend guard for linked `FacultySubject` records before delete
- Writes audit log action `DELETE`, module `Faculty Management`

### Example Success Response (200)

```json
{
  "success": true,
  "message": "Faculty deleted successfully",
  "data": {
    "_id": "665d1b2c3d4e5f6789012345"
  }
}
```

### Example Error Responses

| Status | Body |
|--------|------|
| 404 | `{ "success": false, "message": "Faculty not found" }` |
| 401 | `{ "success": false, "message": "Not authenticated" }` |
| 403 | `{ "success": false, "message": "Access denied. Super Admin only." }` |
| 500 | `{ "success": false, "message": "Server error", "error": "..." }` |

---

## SECTION 7 — GET FACULTY LIST API

| | |
|---|---|
| **Request URL** | `GET /api/teachers` |
| **Method** | GET |
| **Authentication** | Bearer JWT — Super Admin only |

### Query Parameters

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `search` | string | `""` | Case-insensitive regex on `teacherName` and `teacherId` |
| `status` | `ACTIVE` \| `INACTIVE` | — | Filter by status |
| `subject` | ObjectId | — | Faculty whose `subjects` array contains this Subject `_id` |
| `center` | ObjectId | — | Filter by center (alias for `centerId`) |
| `centerId` | ObjectId | — | Filter by center |
| `page` | number | `1` | Page number (min 1) |
| `limit` | number | `10` | Page size (min 1, max 100) |
| `sortBy` | string | `createdAt` | One of: `createdAt`, `teacherName`, `teacherId`, `status` |
| `sortOrder` | `asc` \| `desc` | `desc` | Sort direction |

### Response Structure

```json
{
  "success": true,
  "total": 42,
  "page": 1,
  "limit": 10,
  "totalPages": 5,
  "count": 10,
  "data": [
    {
      "_id": "665d1b2c3d4e5f6789012345",
      "teacherId": "TCH001",
      "teacherName": "Dr. Rajesh Kumar",
      "centerId": "665a1b2c3d4e5f6789012345",
      "centerName": "Delhi Center",
      "description": "Senior faculty for Indian Polity",
      "subjects": [
        {
          "_id": "665b1b2c3d4e5f6789012345",
          "subjectId": "SUB001",
          "subjectName": "Indian Polity"
        }
      ],
      "status": "ACTIVE",
      "createdAt": "2025-06-01T10:00:00.000Z",
      "updatedAt": "2025-06-01T10:00:00.000Z"
    }
  ]
}
```

### Example Requests

```http
GET /api/teachers?search=rajesh&status=ACTIVE&centerId=665a1b2c3d4e5f6789012345&page=1&limit=10&sortBy=teacherName&sortOrder=asc
Authorization: Bearer <token>
```

```http
GET /api/teachers?subject=665b1b2c3d4e5f6789012345
Authorization: Bearer <token>
```

### Pagination Logic (from `utils/contentMastersHelpers.js`)

```javascript
page = Math.max(1, parseInt(page, 10) || 1)
limit = Math.min(100, Math.max(1, parseInt(limit, 10) || 10))
skip = (page - 1) * limit
totalPages = Math.ceil(total / limit) || 0
```

---

## SECTION 8 — GET FACULTY DETAILS API

| | |
|---|---|
| **Request URL** | `GET /api/teachers/:id` |
| **Method** | GET |
| **Authentication** | Bearer JWT — Super Admin only |
| **URL Param** | `id` — Teacher MongoDB `_id` |

### Example Success Response (200)

```json
{
  "success": true,
  "data": {
    "_id": "665d1b2c3d4e5f6789012345",
    "teacherId": "TCH001",
    "teacherName": "Dr. Rajesh Kumar",
    "centerId": "665a1b2c3d4e5f6789012345",
    "centerName": "Delhi Center",
    "description": "Senior faculty for Indian Polity",
    "subjects": [
      {
        "_id": "665b1b2c3d4e5f6789012345",
        "subjectId": "SUB001",
        "subjectName": "Indian Polity"
      }
    ],
    "status": "ACTIVE",
    "createdAt": "2025-06-01T10:00:00.000Z",
    "updatedAt": "2025-06-01T10:00:00.000Z"
  }
}
```

### Example Error Response (404)

```json
{
  "success": false,
  "message": "Faculty not found"
}
```

Soft-deleted faculty return **404** on detail fetch.

---

## SECTION 9 — DROPDOWN APIs

### Faculty Dropdown (This Module)

| | |
|---|---|
| **Endpoint** | `GET /api/teachers/dropdown` |
| **Auth** | Super Admin |

#### Query Parameters

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `centerId` | ObjectId | — | Filter faculty by center |
| `subject` | ObjectId | — | Faculty teaching this subject |
| `status` | `ACTIVE` \| `INACTIVE` | `ACTIVE` | Status filter |

#### Response Structure

```json
{
  "success": true,
  "count": 3,
  "data": [
    {
      "_id": "665d1b2c3d4e5f6789012345",
      "teacherId": "TCH001",
      "teacherName": "Dr. Rajesh Kumar"
    }
  ]
}
```

#### Frontend Mapping

| Display Field | Value Field | Notes |
|---------------|-------------|-------|
| `teacherName` (optionally append `teacherId`) | `_id` | Use `_id` in create/update payloads as `teacherId` on FacultySubject only |

Sorted by `teacherName` ascending server-side.

---

### Centers Dropdown

| Endpoint | Auth | Display Field | Value Field |
|----------|------|---------------|-------------|
| `GET /api/centers/dropdown` | Staff Admin | `centerName` | `_id` |
| `GET /api/admin/centers/dropdown` | Staff Admin | `centerName` | `_id` |

**Response item shape:**

```json
{
  "_id": "...",
  "centerName": "Delhi Center",
  "centerCode": "DEL",
  "city": "New Delhi",
  "state": "Delhi"
}
```

**Used by:** Faculty create/edit form — center picker.

---

### Subjects Dropdown

| Endpoint | Auth | Display Field | Value Field |
|----------|------|---------------|-------------|
| `GET /api/subjects/dropdown` | Super Admin | `subjectName` | `_id` |

**Response item shape:**

```json
{
  "_id": "...",
  "subjectId": "SUB001",
  "subjectName": "Indian Polity"
}
```

**Used by:** Faculty create/edit form — subject multi-select. Returns ACTIVE, non-deleted subjects only.

---

### Exam Categories Filter (Context Only — Not Used by Faculty CRUD)

| Endpoint | Auth | Params | Used By |
|----------|------|--------|---------|
| `GET /api/categories/filter` | Super Admin | `centerId`, `programId` (required) | Courses, Exam Sub Category — **not** Faculty |

---

### FacultySubject Dropdown (Downstream Consumer — Appendix A)

| Endpoint | Auth | Display Field | Value Field |
|----------|------|---------------|-------------|
| `GET` or `POST` `/api/faculty-subjects/dropdown` | Super Admin | `subjectName` (+ `teacherName`) | `_id` |

Used by **Batch create**, not Faculty (Teacher) CRUD.

---

### Mentors Dropdown (Related Batch Field — Not Faculty)

| Endpoint | Auth | Display Field | Value Field |
|----------|------|---------------|-------------|
| `GET /api/admin/admin-access/mentors/dropdown` | Legacy `super_admin` User only | mentor name fields from controller | `_id` |

Batch `mentor` is separate from Faculty (`Teacher`).

---

## SECTION 10 — FILE UPLOADS

### Faculty (Teacher) Module

**No file uploads.** All `/api/teachers` endpoints accept `application/json` only.

| Field | Supported |
|-------|-----------|
| Profile Photo | **No** |
| Resume | **No** |
| Documents / Certificates | **No** |
| Images | **No** |

### Out of Scope — Center CMS Faculty (Different Model)

Center website faculty at `POST /api/centers/:id/faculty` **does** accept an `image` upload via `middleware/upload.js` (Cloudinary `centers/faculty`). That is **not** the Academics Faculty module documented here.

---

## SECTION 11 — FRONTEND SERVICE ARCHITECTURE

### Directory Structure

```text
src/
├── services/
│   ├── api.ts                  # Axios instance + auth interceptor (exists)
│   └── facultyService.ts       # Faculty (Teacher) API — implement per below
├── hooks/
│   ├── queryKeys.ts            # Add facultyKeys for teachers
│   ├── useFaculty.ts
│   ├── useFacultyDetails.ts
│   ├── useCreateFaculty.ts
│   ├── useUpdateFaculty.ts
│   ├── useDeleteFaculty.ts
│   └── useFacultyDropdown.ts
└── types/
    └── faculty.ts              # TypeScript interfaces
```

### `src/services/facultyService.ts`

```typescript
import api from './api';
import type { ApiSuccessResponse } from '../types/api';
import type {
  CreateFacultyPayload,
  Faculty,
  FacultyDropdownItem,
  FacultyDropdownParams,
  FacultyListParams,
  FacultyStatus,
  UpdateFacultyPayload,
} from '../types/faculty';

const TEACHERS_BASE = '/api/teachers';

type FacultyListResponse = ApiSuccessResponse<Faculty[]> & {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  count: number;
};

export const facultyService = {
  /** GET /api/teachers — paginated list */
  getFacultyList: async (params?: FacultyListParams) => {
    const { data } = await api.get<FacultyListResponse>(TEACHERS_BASE, { params });
    return data;
  },

  /** GET /api/teachers/:id */
  getFacultyById: async (id: string) => {
    const { data } = await api.get<ApiSuccessResponse<Faculty>>(`${TEACHERS_BASE}/${id}`);
    return data;
  },

  /** GET /api/teachers/dropdown */
  getFacultyDropdown: async (params?: FacultyDropdownParams) => {
    const { data } = await api.get<ApiSuccessResponse<FacultyDropdownItem[]>>(
      `${TEACHERS_BASE}/dropdown`,
      { params }
    );
    return data;
  },

  /** POST /api/teachers */
  createFaculty: async (payload: CreateFacultyPayload) => {
    const { data } = await api.post<ApiSuccessResponse<Faculty>>(TEACHERS_BASE, payload);
    return data;
  },

  /** PUT /api/teachers/:id */
  updateFaculty: async (id: string, payload: UpdateFacultyPayload) => {
    const { data } = await api.put<ApiSuccessResponse<Faculty>>(`${TEACHERS_BASE}/${id}`, payload);
    return data;
  },

  /** PATCH /api/teachers/status/:id */
  updateFacultyStatus: async (id: string, status: FacultyStatus) => {
    const { data } = await api.patch<ApiSuccessResponse<Faculty>>(
      `${TEACHERS_BASE}/status/${id}`,
      { status }
    );
    return data;
  },

  /** DELETE /api/teachers/:id — soft delete */
  deleteFaculty: async (id: string) => {
    const { data } = await api.delete<ApiSuccessResponse<{ _id: string }>>(
      `${TEACHERS_BASE}/${id}`
    );
    return data;
  },
};

export default facultyService;
```

### `src/types/faculty.ts` (suggested)

```typescript
export type FacultyStatus = 'ACTIVE' | 'INACTIVE';

export interface FacultySubjectRef {
  _id: string;
  subjectId?: string;
  subjectName?: string;
}

export interface Faculty {
  _id: string;
  teacherId: string;
  teacherName: string;
  centerId: string;
  centerName: string;
  description: string;
  subjects: FacultySubjectRef[];
  status: FacultyStatus;
  createdAt: string;
  updatedAt: string;
}

export interface FacultyDropdownItem {
  _id: string;
  teacherId: string;
  teacherName: string;
}

export interface FacultyListParams {
  search?: string;
  status?: FacultyStatus;
  subject?: string;
  center?: string;
  centerId?: string;
  page?: number;
  limit?: number;
  sortBy?: 'createdAt' | 'teacherName' | 'teacherId' | 'status';
  sortOrder?: 'asc' | 'desc';
}

export interface FacultyDropdownParams {
  centerId?: string;
  subject?: string;
  status?: FacultyStatus;
}

export interface CreateFacultyPayload {
  teacherName: string;
  centerId: string;
  subjects: string[];
  description?: string;
  status?: FacultyStatus;
}

export interface UpdateFacultyPayload {
  teacherName?: string;
  centerId?: string;
  subjects?: string[];
  description?: string;
  status?: FacultyStatus;
}
```

---

## SECTION 12 — REACT QUERY INTEGRATION

### Query Keys (`src/hooks/queryKeys.ts`)

Add alongside existing keys (rename current `facultyKeys` for faculty-subjects if needed):

```typescript
export const facultyKeys = {
  all: ['faculty'] as const,
  lists: () => [...facultyKeys.all, 'list'] as const,
  list: (params?: FacultyListParams) => [...facultyKeys.lists(), params ?? {}] as const,
  details: () => [...facultyKeys.all, 'detail'] as const,
  detail: (id: string) => [...facultyKeys.details(), id] as const,
  dropdown: (params?: FacultyDropdownParams) =>
    [...facultyKeys.all, 'dropdown', params ?? {}] as const,
};
```

### `src/hooks/useFaculty.ts`

```typescript
import { useQuery, type UseQueryOptions } from '@tanstack/react-query';
import { facultyService } from '../services/facultyService';
import { facultyKeys } from './queryKeys';
import type { FacultyListParams } from '../types/faculty';

export const useFaculty = (
  params?: FacultyListParams,
  options?: Omit<
    UseQueryOptions<Awaited<ReturnType<typeof facultyService.getFacultyList>>>,
    'queryKey' | 'queryFn'
  >
) =>
  useQuery({
    queryKey: facultyKeys.list(params),
    queryFn: () => facultyService.getFacultyList(params),
    ...options,
  });
```

### `src/hooks/useFacultyDetails.ts`

```typescript
import { useQuery, type UseQueryOptions } from '@tanstack/react-query';
import { facultyService } from '../services/facultyService';
import { facultyKeys } from './queryKeys';

export const useFacultyDetails = (
  id: string | undefined,
  options?: Omit<
    UseQueryOptions<Awaited<ReturnType<typeof facultyService.getFacultyById>>>,
    'queryKey' | 'queryFn'
  >
) =>
  useQuery({
    queryKey: facultyKeys.detail(id ?? ''),
    queryFn: () => facultyService.getFacultyById(id!),
    enabled: Boolean(id),
    ...options,
  });
```

### `src/hooks/useFacultyDropdown.ts`

```typescript
import { useQuery, type UseQueryOptions } from '@tanstack/react-query';
import { facultyService } from '../services/facultyService';
import { facultyKeys } from './queryKeys';
import type { FacultyDropdownParams } from '../types/faculty';

export const useFacultyDropdown = (
  params?: FacultyDropdownParams,
  options?: Omit<
    UseQueryOptions<Awaited<ReturnType<typeof facultyService.getFacultyDropdown>>>,
    'queryKey' | 'queryFn'
  >
) =>
  useQuery({
    queryKey: facultyKeys.dropdown(params),
    queryFn: () => facultyService.getFacultyDropdown(params),
    staleTime: 5 * 60 * 1000,
    ...options,
  });
```

### `src/hooks/useCreateFaculty.ts`

```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { facultyService } from '../services/facultyService';
import { facultyKeys } from './queryKeys';
import { handleApiError } from '../utils/errorHandler';
import type { CreateFacultyPayload } from '../types/faculty';

export const useCreateFaculty = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateFacultyPayload) => facultyService.createFaculty(payload),
    onSuccess: (response) => {
      if (response.success && response.data?._id) {
        queryClient.invalidateQueries({ queryKey: facultyKeys.all });
      }
    },
    onError: (error) => handleApiError(error),
  });
};
```

### `src/hooks/useUpdateFaculty.ts`

```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { facultyService } from '../services/facultyService';
import { facultyKeys } from './queryKeys';
import { handleApiError } from '../utils/errorHandler';
import type { FacultyStatus, UpdateFacultyPayload } from '../types/faculty';

export const useUpdateFaculty = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateFacultyPayload }) =>
      facultyService.updateFaculty(id, payload),
    onSuccess: (response, { id }) => {
      if (response.success) {
        queryClient.invalidateQueries({ queryKey: facultyKeys.detail(id) });
        queryClient.invalidateQueries({ queryKey: facultyKeys.all });
      }
    },
    onError: (error) => handleApiError(error),
  });
};

/** Status-only toggle with optimistic update */
export const useToggleFacultyStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: FacultyStatus }) =>
      facultyService.updateFacultyStatus(id, status),
    onMutate: async ({ id, status }) => {
      await queryClient.cancelQueries({ queryKey: facultyKeys.detail(id) });
      const previous = queryClient.getQueryData(facultyKeys.detail(id));
      queryClient.setQueryData(facultyKeys.detail(id), (old: unknown) => {
        if (!old || typeof old !== 'object') return old;
        const o = old as { data?: { status?: FacultyStatus } };
        return { ...o, data: { ...o.data, status } };
      });
      return { previous };
    },
    onError: (error, { id }, context) => {
      if (context?.previous) {
        queryClient.setQueryData(facultyKeys.detail(id), context.previous);
      }
      handleApiError(error);
    },
    onSettled: (_data, _error, { id }) => {
      queryClient.invalidateQueries({ queryKey: facultyKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: facultyKeys.all });
    },
  });
};
```

### `src/hooks/useDeleteFaculty.ts`

```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { facultyService } from '../services/facultyService';
import { facultyKeys } from './queryKeys';
import { handleApiError } from '../utils/errorHandler';

export const useDeleteFaculty = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => facultyService.deleteFaculty(id),
    onSuccess: (response) => {
      if (response.success) {
        queryClient.invalidateQueries({ queryKey: facultyKeys.all });
      }
    },
    onError: (error) => handleApiError(error),
  });
};
```

### Cache Invalidation Strategy

| Mutation | Invalidate |
|----------|------------|
| Create | `facultyKeys.all` |
| Update | `facultyKeys.detail(id)` + `facultyKeys.all` |
| Status toggle | `facultyKeys.detail(id)` + `facultyKeys.all` |
| Delete | `facultyKeys.all` |

### Refetch Strategy

| Query | `staleTime` | Notes |
|-------|-------------|-------|
| List | default (0) | Refetch on window focus |
| Detail | default (0) | Refetch after mutations |
| Dropdown | `5 * 60 * 1000` | Cache 5 minutes; invalidate `facultyKeys.all` on create/update/delete |

### Optimistic Updates

- **Recommended for:** `useToggleFacultyStatus` only (status column toggle)
- **Not recommended for:** create, update, delete — wait for server `success: true`

---

## SECTION 13 — FORM FIELD MAPPING

### Add / Edit Faculty Form

| Frontend Field | Backend Field | Required | Validation | Default Value | Dropdown Source |
|----------------|---------------|----------|------------|---------------|-----------------|
| Faculty Name | `teacherName` | **Yes** | Non-empty trimmed string | — | — |
| Center | `centerId` | **Yes** | Valid ACTIVE Center `_id` | — | `GET /api/centers/dropdown` |
| Subjects | `subjects` | **Yes** (create) | Array of ACTIVE Subject `_id`, min 1 | `[]` | `GET /api/subjects/dropdown` |
| Description | `description` | No | String, trimmed | `""` | — |
| Status | `status` | No | `ACTIVE` \| `INACTIVE` | `ACTIVE` | Static enum |

### Payload Mapping Notes

| UI Control | Send As |
|------------|---------|
| Center select value | `centerId: center._id` |
| Subject multi-select values | `subjects: [subject._id, ...]` |
| Status toggle / select | `status: 'ACTIVE' \| 'INACTIVE'` |

**Do not send** `teacherId` on create — it is server-generated.

### Client-Side Validation (mirror backend)

```typescript
import { z } from 'zod';

export const createFacultySchema = z.object({
  teacherName: z.string().trim().min(1, 'Faculty name is required'),
  centerId: z.string().min(1, 'Center is required'),
  subjects: z.array(z.string()).min(1, 'At least one subject is required'),
  description: z.string().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']).default('ACTIVE'),
});

export const updateFacultySchema = createFacultySchema.partial().refine(
  (data) => Object.keys(data).length > 0,
  { message: 'At least one field is required' }
);
```

---

## SECTION 14 — TABLE FIELD MAPPING

### Faculty List Table

| Column | Response Field | Sortable (`sortBy`) | Notes |
|--------|----------------|---------------------|-------|
| Faculty ID | `teacherId` | `teacherId` | Server-generated code |
| Faculty Name | `teacherName` | `teacherName` | Primary display |
| Center | `centerName` | — | From populated `centerId` |
| Subjects | `subjects[].subjectName` | — | Render as chips/tags; count if many |
| Status | `status` | `status` | `ACTIVE` / `INACTIVE` badge |
| Created | `createdAt` | `createdAt` | Format as locale date |
| Actions | — | — | View, Edit, Toggle Status, Delete |

### Search Fields

| UI Search Box | Query Param | Backend Matches |
|---------------|-------------|-----------------|
| Global search | `search` | `teacherName`, `teacherId` (case-insensitive regex) |

### Filters

| UI Filter | Query Param | Values |
|-----------|-------------|--------|
| Status | `status` | `ACTIVE`, `INACTIVE`, or empty (all) |
| Center | `centerId` | Center `_id` from centers dropdown |
| Subject | `subject` | Subject `_id` from subjects dropdown |

### Actions

| Action | API Call | Confirm? |
|--------|----------|----------|
| View | Navigate to detail; `GET /api/teachers/:id` | No |
| Edit | Navigate to form; `PUT /api/teachers/:id` | No |
| Toggle Status | `PATCH /api/teachers/status/:id` | Optional |
| Delete | `DELETE /api/teachers/:id` | **Yes** — destructive (soft) |

### Pagination

| UI Control | Query Param | Backend Default |
|------------|-------------|-----------------|
| Page number | `page` | `1` |
| Page size | `limit` | `10` (max `100`) |
| Total count | `total` from response | — |
| Total pages | `totalPages` from response | — |

### Status Display

| UI State | Backend Value | Display |
|----------|---------------|---------|
| Active | `ACTIVE` | Green badge / toggle on |
| Inactive | `INACTIVE` | Gray badge / toggle off |
| Deleted | — | Not returned in list |

### Bulk Actions

**Not supported** — backend exposes no bulk create/update/delete/status endpoints for Faculty.

### Export Support

**Not supported** — no export endpoint on `/api/teachers`. If export is needed, fetch paginated list client-side or request a new backend endpoint.

---

## SECTION 15 — ERROR HANDLING

The backend Teacher controller returns **400, 401, 403, 404, 500** for Faculty endpoints. It does **not** return **409** or **422** for `/api/teachers`.

Use `handleApiError` from `src/utils/errorHandler.ts` in all mutation `onError` handlers.

### 400 — Validation / Business Rule

| Message | Cause | Frontend Behavior |
|---------|-------|-------------------|
| `Faculty name is required` | Empty name on create | Highlight name field |
| `Faculty name cannot be empty` | Empty name on update | Highlight name field |
| `centerId is required` | Missing center on create | Highlight center dropdown |
| `centerId cannot be empty` | Empty center on update | Highlight center dropdown |
| `Invalid or inactive center` | Bad center ID | Reset center dropdown |
| `At least one subject is required` | Empty subjects on create | Highlight subjects multi-select |
| `Invalid subject id in subjects array` | Malformed ObjectId | Highlight subjects |
| `One or more subjects are invalid or inactive` | Inactive/deleted subject | Highlight subjects |
| `Status must be ACTIVE or INACTIVE` | Invalid status | Reset status control |

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

**Frontend behavior:** Show permission error; redirect to `/unauthorized` if using `RoleGuard`.

### 404 — Not Found

| Message | Cause |
|---------|-------|
| `Faculty not found` | Invalid ID or soft-deleted faculty |

**Frontend behavior:** Show not-found state; redirect to list after delete.

### 409 — Conflict

**Not returned by `/api/teachers`.** FacultySubject delete returns 409 when linked to batches (see Appendix A).

### 422 — Unprocessable Entity

**Not returned** — Teacher routes use plain `400` for validation, no Joi middleware.

### 500 — Server Error

```json
{ "success": false, "message": "Server error", "error": "..." }
```

**Frontend behavior:** Show generic server error; offer retry via `refetch()` or re-submit.

### Network Errors

| Condition | Message | Code |
|-----------|---------|------|
| Timeout (30s) | `Request timed out. Please check your connection and try again.` | `TIMEOUT` |
| No response | `Unable to connect to server` | `NETWORK_ERROR` |

**Frontend behavior:** Show retry button; do not update local cache optimistically except for status toggle rollback.

---

## SECTION 16 — AUTHORIZATION

### Backend Requirements

All `/api/teachers` routes apply:

```javascript
router.use(protect, requireSuperAdmin);
```

| Middleware | File | Purpose |
|------------|------|---------|
| `protect` | `middleware/authMiddleware.js` | Validates `Authorization: Bearer <JWT>` |
| `requireSuperAdmin` | `middleware/requireSuperAdmin.js` | Ensures Super Admin role |

### Allowed Identities

`isSuperAdminRequest()` (`utils/permissionHelpers.js`) returns true for:

- Legacy `User` with `role: 'super_admin'`
- `AdminAccess` with `roleId.roleCode: 'SUPER_ADMIN'`

No feature-level permission matrix is checked for Teacher routes (unlike CBT/Evaluation modules).

### Role Permissions Matrix

| Role | Faculty CRUD |
|------|--------------|
| Super Admin (`super_admin` / `SUPER_ADMIN`) | Full access |
| Center Admin, Finance Admin, Mentor, etc. | **403 Forbidden** |
| Unauthenticated | **401 Unauthorized** |

### RBAC Module Reference

`config/permissionModules.js` lists **Faculty Management** under `ACADEMICS`. Teacher routes currently gate on Super Admin only — not per-feature permission flags.

### Login

```http
POST /api/auth/login-super-admin
Content-Type: application/json

{ "email": "admin@example.com", "password": "..." }
```

Store returned token via `setAuthToken(token)`.

### Protected Routes (Frontend)

```tsx
<Route element={<ProtectedRoute />}>
  <Route
    path="/academics/categories/faculty"
    element={
      <RoleGuard allowedRoles={['Admin']}>
        <FacultyListPage />
      </RoleGuard>
    }
  />
</Route>
```

### Access Rules

1. Token must exist before any Faculty API call (`api.ts` interceptor attaches it).
2. Faculty management UI should only render for Super Admin.
3. Do not expose Faculty CRUD to non–Super Admin roles — backend returns 403.

### Future Role Scalability

If RBAC expands beyond Super Admin for Faculty Management, backend would need middleware changes on `teacherRoutes.js`. Frontend should centralize auth checks in `RoleGuard` and service layer — do not scatter role checks in components.

---

## SECTION 17 — SERVER PERSISTENCE VERIFICATION

Every CRUD operation must confirm success from the **API response** — never from local/mock state.

### Create — Data Successfully Saved

1. Call `createFaculty` → `POST /api/teachers`.
2. Verify `response.success === true` and HTTP status `201`.
3. Verify `response.data` contains server-generated `_id`, `teacherId`, `createdAt`.
4. Invalidate `facultyKeys.all` and navigate to list.
5. **Do not** append to local array without refetch.

```typescript
create.mutate(payload, {
  onSuccess: (res) => {
    if (!res.success || !res.data?._id) return;
    // res.data._id and res.data.teacherId prove MongoDB write
    navigate('/academics/categories/faculty');
  },
});
```

### Update — Data Successfully Updated

1. Call `updateFaculty` → `PUT /api/teachers/:id`.
2. Verify `response.success === true` and `response.message === 'Faculty updated successfully'`.
3. Verify `response.data.updatedAt` changed.
4. Invalidate `facultyKeys.detail(id)` and `facultyKeys.all`.

### Delete — Data Successfully Deleted

1. Call `deleteFaculty` → `DELETE /api/teachers/:id`.
2. Verify `response.success === true` and `response.message === 'Faculty deleted successfully'`.
3. Verify `response.data._id` matches deleted ID.
4. Refetch list — deleted faculty must not appear.
5. `GET /api/teachers/:id` must return **404**.

### Retrieve — Data from MongoDB

1. List: `GET /api/teachers` returns paginated `data[]` from database.
2. Detail: `GET /api/teachers/:id` returns single document.
3. Dropdown: `GET /api/teachers/dropdown` returns ACTIVE faculty from database.

### Verification Checklist After Each Operation

| Operation | Verify |
|-----------|--------|
| Create | `201` + `data._id` + `data.teacherId` + list refetch shows row |
| Update | `200` + `message` + `data.updatedAt` + detail refetch matches |
| Status | `200` + `data.status` matches sent value |
| Delete | `200` + row absent from list + detail returns 404 |

---

## SECTION 18 — TESTING CHECKLIST

Production integration checklist:

- [ ] Faculty Service Created (`facultyService.ts` → `/api/teachers`)
- [ ] React Query Hooks Created (`useFaculty`, `useFacultyDetails`, `useCreateFaculty`, `useUpdateFaculty`, `useDeleteFaculty`, `useFacultyDropdown`)
- [ ] Create API Tested (`POST /api/teachers` → `201`, `teacherId` generated)
- [ ] Update API Tested (`PUT /api/teachers/:id` → `200`)
- [ ] Delete API Tested (`DELETE /api/teachers/:id` → soft delete, list excludes row)
- [ ] List API Tested (`GET /api/teachers` → pagination metadata)
- [ ] Search Tested (`search` param matches `teacherName` / `teacherId`)
- [ ] Filters Tested (`status`, `centerId`, `subject`)
- [ ] Pagination Tested (`page`, `limit`, `totalPages`)
- [ ] Sorting Tested (`sortBy`, `sortOrder`)
- [ ] Dropdown Tested (`GET /api/teachers/dropdown` with `centerId` / `subject`)
- [ ] Center Dropdown Tested (`GET /api/centers/dropdown`)
- [ ] Subject Dropdown Tested (`GET /api/subjects/dropdown`)
- [ ] Authentication Tested (401 without token)
- [ ] Authorization Tested (403 for non–Super Admin)
- [ ] Status Toggle Tested (`PATCH /api/teachers/status/:id`)
- [ ] Server Persistence Verified (create → GET by id → list includes row)
- [ ] No Mock Data / No Placeholder APIs
- [ ] Production Ready

---

## SECTION 19 — IMPLEMENTATION SOURCE OF TRUTH

### End-to-End Lifecycle

```text
Frontend Form (Add/Edit Faculty)
    ↓
React Hook (useCreateFaculty / useUpdateFaculty)
    ↓
Service Layer (facultyService.ts)
    ↓
Axios Instance (api.ts — Bearer token attached)
    ↓
Backend API (POST|PUT /api/teachers)
    ↓
Middleware (protect → requireSuperAdmin)
    ↓
Controller (teacherController.js)
    ↓
Validation (inline — center, subjects, name)
    ↓
MongoDB (teachers collection — Teacher.create / .save)
    ↓
Audit Log (Faculty Management module)
    ↓
API Response ({ success, message, data })
    ↓
React Query Cache (invalidateQueries facultyKeys)
    ↓
UI Update (list refetch / navigate)
```

### Sequence Diagram

```mermaid
sequenceDiagram
  participant UI as FacultyForm
  participant Hook as useCreateFaculty
  participant Svc as facultyService
  participant API as Axios api.ts
  participant MW as protect + requireSuperAdmin
  participant Ctrl as teacherController
  participant DB as MongoDB teachers
  participant Audit as auditLogService

  UI->>Hook: mutate({ teacherName, centerId, subjects })
  Hook->>Svc: createFaculty(payload)
  Svc->>API: POST /api/teachers
  API->>MW: Authorization Bearer JWT
  MW->>Ctrl: req.body
  Ctrl->>Ctrl: validate name, center, subjects
  Ctrl->>Ctrl: generateTeacherId() → TCH00N
  Ctrl->>DB: Teacher.create()
  DB-->>Ctrl: saved document
  Ctrl->>Audit: logAdminAudit(FACULTY_MANAGEMENT, CREATE)
  Ctrl-->>API: 201 { success, data }
  API-->>Svc: response
  Svc-->>Hook: ApiSuccessResponse
  Hook->>Hook: invalidateQueries(facultyKeys.all)
  Hook-->>UI: onSuccess → navigate / refresh list
```

### Source Files (Backend)

| Layer | File |
|-------|------|
| Route mount | `app.js` |
| Routes | `routes/teacherRoutes.js` |
| Controller | `controllers/teacherController.js` |
| Model | `models/Teacher.js` |
| ID generation | `utils/contentIdGenerator.js` |
| Pagination/search | `utils/contentMastersHelpers.js` |
| Center validation | `utils/academicHierarchyHelpers.js` |
| Auth | `middleware/authMiddleware.js`, `middleware/requireSuperAdmin.js` |
| Audit | `services/auditLogService.js`, `utils/auditLogConstants.js` |

---

## APPENDIX A — FacultySubject Module (Related, Separate CRUD)

FacultySubject links a **Subject + Teacher + Topics + delivery categories**. It is the bridge between content masters and batches/CMS content. It is **not** the same as Faculty (Teacher) CRUD but depends on teachers created via `/api/teachers`.

### Model: `FacultySubject` · Collection: `facultysubjects` · API: `/api/faculty-subjects`

| Field | Type | Required | Default | Notes |
|-------|------|----------|---------|-------|
| `facultySubjectId` | String | auto | unique code `FSU…` | |
| `subjectName` | String | yes | — | Display name |
| `subject` | ObjectId → Subject | yes | — | Must be ACTIVE |
| `topics` | ObjectId[] → Topic | no | `[]` | Must belong to subject |
| `teacher` | ObjectId → Teacher | yes | — | Must be ACTIVE faculty |
| `categories` | String[] | no | `[]` | Delivery enums — min 1 on create |
| `status` | String | no | `ACTIVE` | `ACTIVE` \| `INACTIVE` |
| `isDeleted` | Boolean | no | `false` | |
| `deletedAt` | Date | no | `null` | |

### Delivery Categories (NOT Exam Category)

From `utils/batchFacultyConstants.js`:

| Value | Label |
|-------|-------|
| `LIVE_CLASS` | Live Class |
| `RECORDING` | Recording |
| `PRELIMS_TEST` | Prelims Test |
| `MAINS_ANSWER_WRITING` | Mains Answer Writing |
| `PDF` | PDF |

Legacy `TEST` maps to `PRELIMS_TEST`.  
Dropdown: `GET /api/faculty-subjects/categories`

### FacultySubject API Inventory (Super Admin — `superAdminAuth` on mount)

| Feature | Method | Endpoint |
|---------|--------|----------|
| Create form dropdowns | GET | `/api/faculty-subjects/create-form` |
| Delivery categories | GET | `/api/faculty-subjects/categories` |
| Dropdown | GET / POST | `/api/faculty-subjects/dropdown` |
| Summary | GET | `/api/faculty-subjects/summary/:id` |
| Content tree | GET | `/api/faculty-subjects/:id/content-tree` |
| List content | POST | `/api/faculty-subjects/content/categories` |
| Create folder | POST | `/api/faculty-subjects/content/folders` |
| Update folder | PUT | `/api/faculty-subjects/content/folders/:id` |
| Toggle status | PATCH | `/api/faculty-subjects/status/:id` |
| Create | POST | `/api/faculty-subjects` |
| List | GET | `/api/faculty-subjects` |
| Detail | GET | `/api/faculty-subjects/:id` |
| Update | PUT | `/api/faculty-subjects/:id` |
| Delete (hard) | DELETE | `/api/faculty-subjects/:id` |

### FacultySubject Create Payload

```json
{
  "subjectName": "Indian Polity — Dr Rajesh",
  "subjectId": "<Subject._id>",
  "topicIds": ["<Topic._id>"],
  "teacherId": "<Teacher._id>",
  "categories": ["LIVE_CLASS", "RECORDING"],
  "status": "ACTIVE"
}
```

### FacultySubject List Query Params

| Param | Description |
|-------|-------------|
| `search` or `q` | Regex on `subjectName` |
| `status` | `ACTIVE` \| `INACTIVE` |
| `category` | Filter by delivery category |
| `page`, `limit`, `sortBy`, `sortOrder` | Same pagination helper (limit max 100) |

`sortBy`: `createdAt`, `subjectName`, `facultySubjectId`, `status`

### FacultySubject Delete

- **Hard delete** with cascade (folders, live classes, recordings, PDFs, tests, etc.)
- Returns **409** if linked to any batch: `Cannot delete faculty subject linked to N batch(es). Remove it from batches first.`

### Create-Form Endpoint

`GET /api/faculty-subjects/create-form?subjectId=&centerId=`

| Step | Params | Returns |
|------|--------|---------|
| 1 | none | `subjects[]` |
| 2 | `subjectId` | + `topics[]`, `teachers[]` (filtered by subject; optional `centerId`) |

### Existing Frontend Code

`src/services/facultyService.ts` and `src/hooks/useFacultySubjectsDropdown.ts` currently target **FacultySubject** APIs. Rename or split when implementing Teacher-based `facultyService.ts` from Section 11.

---

## APPENDIX B — Academic ERP Hierarchy Reference

```text
Center
  └── Program
        └── Exam Category (AcademicCategory)     ← /api/categories
              └── Exam Sub Category              ← /api/sub-categories
                    └── Course                   ← /api/courses
                          └── Batch              ← /api/batches
                                ├── facultySubjects[] → FacultySubject
                                └── mentor → AdminAccess

Content Masters (parallel)
  Subject → Topic
  Teacher (Faculty) → centerId + subjects[]
  FacultySubject → subject + teacher + topics[] + delivery categories[]
```

**Faculty (Teacher)** sits in Content Masters. **Exam Category** sits in Academic ERP. They are grouped in the admin UI under Academics → Categories but are **not** linked in the database.

---

*Document generated from backend source: `models/Teacher.js`, `controllers/teacherController.js`, `routes/teacherRoutes.js`, `models/FacultySubject.js`, `controllers/facultySubjectController.js`, and related utilities. No endpoints, fields, or validation rules were invented beyond what exists in code.*
