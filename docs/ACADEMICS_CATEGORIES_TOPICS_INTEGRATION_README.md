# Academics → Categories → Topics — Frontend Integration README

> **Official integration source of truth for Topic module frontend development**  
> Backend resource: `Topic` · API base: `/api/topics` · MongoDB collection: `topics`  
> Admin route (UI): `/academics/categories/topic`

---

## SECTION 1 — MODULE OVERVIEW

### What Topic Represents

A **Topic** is a **global content master** — a named unit of curriculum content (e.g. "Fundamental Rights", "DPSP") that belongs to exactly **one Subject**. Topics are reusable across the LMS: faculty assignments, recordings, mains answer writing, and tests reference them by MongoDB `_id`.

Topics are **not** scoped to a center, program, exam category, course, or batch. They live in the **Content Masters** hierarchy, separate from the **Academic ERP** hierarchy.

### Admin Navigation Context

The admin sidebar groups **Subject**, **Topic**, **Program**, and **Exam Category** under **Academics → Categories**. That grouping is organizational only. The Topic API has **no** `centerId`, `programId`, `categoryId`, or `courseId` fields.

### Two Hierarchies (Critical)

```text
ACADEMIC ERP (center-scoped)
Center → Program → Exam Category → Exam Sub Category → Course → Batch

CONTENT MASTERS (global — Topic lives here)
Subject → Topic
```

There is **no database foreign key** between `Topic` and `AcademicCategory` (Exam Category).

### Relation with Category (Exam Category)

| Aspect | Detail |
|--------|--------|
| Database link | **None** — `Topic` has no `categoryId`; `AcademicCategory` has no `topics` field |
| API link | **None** — `/api/topics` does not accept center/program/category params |
| UI grouping | Both appear under Academics → Categories in the admin sidebar |
| Practical use | Exam Categories scope **courses**; Topics scope **content** within a Subject |

Do **not** filter Topic list by exam category. Use the `subject` query param to filter by parent Subject `_id`.

### Relation with Subject

| Aspect | Detail |
|--------|--------|
| Cardinality | Many Topics → one Subject |
| FK field | `Topic.subject` → `Subject._id` (required) |
| Create payload | `subjectId` (or alias `subject`) = Subject MongoDB `_id` |
| Response fields | `subject` (ObjectId), `subjectId` (code e.g. `SUB001`), `subjectName` |
| Dropdown dependency | `GET /api/subjects/dropdown` for create/edit parent picker |
| Subject delete guard | Subject cannot be soft-deleted while **active** non-deleted Topics exist |
| Topic dropdown | `GET /api/topics/by-subject/:subjectId` returns ACTIVE topics for a subject |

### Relation with Course

| Aspect | Detail |
|--------|--------|
| Direct link | **None** — `Course` model has no `topics` field |
| Indirect path | Course → Batch → `facultySubjects[]` → `FacultySubject.topics[]` → Topic |
| Frontend impact | Topic CRUD does not require course selection |

### Relation with Batch

| Aspect | Detail |
|--------|--------|
| Direct link | **None** — `Batch` has no `topics` field |
| Indirect path | `Batch.facultySubjects[]` → `FacultySubject` documents with `topics: [Topic ObjectId]` |
| FacultySubject | Also references `subject` (Subject) and `teacher`; `categories` on FacultySubject are faculty content enums — **not** Exam Category |

### Downstream Consumers (Read-Only Context)

Topics are referenced by (not managed via `/api/topics`):

- `FacultySubject.topics[]`
- `SubjectRecording.topicId` (required)
- `SubjectMainsAnswerWriting.topicId` (optional)

### Design Rules

| Rule | Detail |
|------|--------|
| Global scope | Topics are not tied to center, program, or exam category |
| Auto ID | `topicId` is server-generated (`TOP001`, `TOP002`, …) — never send on create |
| Soft delete | `DELETE` sets `isDeleted: true`, `deletedAt`, `status: INACTIVE` |
| Uniqueness | Duplicate `topicName` per subject triggers MongoDB error → 400 |
| Parent validation | Parent Subject must be `ACTIVE` and non-deleted |
| No uploads | All Topic endpoints use JSON — no file fields |

### User Flow

1. Super Admin logs in (`POST /api/auth/login-super-admin`).
2. Opens **Academics → Categories → Topic**.
3. Lists topics with search, subject filter, status filter, pagination, sorting.
4. **Create**: selects Subject from dropdown → enters topic name, optional description → saves.
5. **Edit**: updates name, description, status, or re-parents to another Subject.
6. **Toggle status**: `ACTIVE` ↔ `INACTIVE` via `PATCH /api/topics/status/:id`.
7. **Delete**: soft delete — topic becomes `INACTIVE` and hidden from non-deleted queries.

### Backend Layer Stack

```text
app.js → app.use('/api/topics', topicRoutes)
routes/topicRoutes.js
  └── middleware: protect → requireSuperAdmin (all routes)
  └── controllers/topicController.js
        └── models/Topic.js
        └── models/Subject.js (parent validation via findActiveSubject)
        └── utils/contentIdGenerator.js (generateTopicId)
        └── utils/contentMastersHelpers.js (pagination, sort, search, NOT_DELETED)
```

There is **no** dedicated `topicService.js` in the backend. All business logic lives in `topicController.js`. There is **no** Joi/Zod/express-validator — validation is inline in the controller.

---

## SECTION 2 — COMPLETE API INVENTORY

### Topic APIs (This Module)

| Feature | Method | Endpoint | Auth Required |
|---------|--------|----------|---------------|
| Create topic | POST | `/api/topics` | Yes — Super Admin |
| List topics (paginated) | GET | `/api/topics` | Yes — Super Admin |
| Topics by subject (dropdown) | GET | `/api/topics/by-subject/:subjectId` | Yes — Super Admin |
| Get topic by ID | GET | `/api/topics/:id` | Yes — Super Admin |
| Update topic | PUT | `/api/topics/:id` | Yes — Super Admin |
| Toggle topic status | PATCH | `/api/topics/status/:id` | Yes — Super Admin |
| Delete topic (soft) | DELETE | `/api/topics/:id` | Yes — Super Admin |

**Route order note:** `/by-subject/:subjectId` and `/status/:id` are registered **before** `/:id` to avoid param conflicts.

**Source:** `routes/topicRoutes.js`, `app.js` line 257

### Dependency APIs (Parent Subject — Required for Forms)

| Feature | Method | Endpoint | Auth Required | Used For |
|---------|--------|----------|---------------|----------|
| Subjects dropdown | GET | `/api/subjects/dropdown` | Yes — Super Admin | Create/edit form — parent Subject picker |
| Get subject by ID | GET | `/api/subjects/:id` | Yes — Super Admin | Optional — `linkedTopics` count on Subject detail |

**Source:** `routes/subjectRoutes.js`

### UI Action → Service Mapping

| UI Action | Service Method | HTTP | Endpoint |
|-----------|----------------|------|----------|
| List | `getTopics()` | GET | `/api/topics` |
| Detail | `getTopicById(id)` | GET | `/api/topics/:id` |
| Dropdown by subject | `getTopicsBySubject(subjectId)` | GET | `/api/topics/by-subject/:subjectId` |
| Create | `createTopic(payload)` | POST | `/api/topics` |
| Update | `updateTopic(id, payload)` | PUT | `/api/topics/:id` |
| Toggle status | `toggleTopicStatus(id, status)` | PATCH | `/api/topics/status/:id` |
| Delete | `deleteTopic(id)` | DELETE | `/api/topics/:id` |
| Parent subject dropdown | `subjectService.getSubjectsDropdown()` | GET | `/api/subjects/dropdown` |

---

## SECTION 3 — CREATE TOPIC API

| | |
|---|---|
| **Request URL** | `POST /api/topics` |
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
  "subjectId": "665a1b2c3d4e5f6789012345",
  "topicName": "Fundamental Rights",
  "description": "Articles 12–35",
  "status": "ACTIVE"
}
```

### Field Descriptions

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `subjectId` | ObjectId string | **Effective yes** | — | Parent Subject MongoDB `_id`. Alias: `subject` |
| `topicName` | string | **Yes** | — | Display name; trimmed server-side |
| `description` | string | No | `""` | Free text; trimmed server-side |
| `status` | `ACTIVE` \| `INACTIVE` | No | `ACTIVE` | Only these two values accepted |
| `topicId` | — | **Do not send** | auto | Server generates `TOP001`, `TOP002`, … |

> **Important:** `subjectId` in the request body is the Subject's MongoDB `_id`, **not** the human-readable code (`SUB001`). The response field `subjectId` is the code.

### Validation Rules

| Rule | HTTP | Error Message |
|------|------|---------------|
| `topicName` missing or whitespace-only | 400 | `topicName is required` |
| Subject missing, invalid ObjectId, inactive, or deleted | 400 | `Invalid or inactive subject` |
| Duplicate topic name for same subject | 400 | `Topic name already exists for this subject` |
| Invalid `status` value | — | Silently coerced: non-`INACTIVE` → `ACTIVE` on create |

### Example Request

```http
POST /api/topics HTTP/1.1
Host: localhost:5000
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
Content-Type: application/json

{
  "subjectId": "665a1b2c3d4e5f6789012345",
  "topicName": "Fundamental Rights",
  "description": "Articles 12–35",
  "status": "ACTIVE"
}
```

```typescript
await api.post('/api/topics', {
  subjectId: selectedSubjectId,
  topicName: name.trim(),
  description: description.trim(),
  status: 'ACTIVE',
});
```

### Example Success Response (201)

```json
{
  "success": true,
  "message": "Topic created successfully",
  "data": {
    "_id": "665c1b2c3d4e5f6789012345",
    "topicId": "TOP001",
    "topicName": "Fundamental Rights",
    "description": "Articles 12–35",
    "subject": "665a1b2c3d4e5f6789012345",
    "subjectId": "SUB001",
    "subjectName": "Indian Polity",
    "status": "ACTIVE",
    "createdAt": "2025-06-01T10:00:00.000Z",
    "updatedAt": "2025-06-01T10:00:00.000Z"
  }
}
```

### Example Error Responses

| Status | Body |
|--------|------|
| 400 | `{ "success": false, "message": "topicName is required" }` |
| 400 | `{ "success": false, "message": "Invalid or inactive subject" }` |
| 400 | `{ "success": false, "message": "Topic name already exists for this subject" }` |
| 401 | `{ "success": false, "message": "Not authorized, no token" }` |
| 403 | `{ "success": false, "message": "Access denied. Super Admin only." }` |
| 500 | `{ "success": false, "message": "Server error", "error": "..." }` |

---

## SECTION 4 — UPDATE TOPIC API

| | |
|---|---|
| **Request URL** | `PUT /api/topics/:id` |
| **Method** | PUT |
| **Authentication** | Bearer JWT — Super Admin only |
| **URL Param** | `id` — Topic MongoDB `_id` |

### Headers

Same as Create.

### Request Payload (All Fields Optional — Partial Update)

```json
{
  "subjectId": "665a1b2c3d4e5f6789012346",
  "topicName": "DPSP",
  "description": "Directive Principles of State Policy",
  "status": "INACTIVE"
}
```

### Field Descriptions

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `subjectId` | ObjectId string | No | Re-parent topic; alias: `subject`. Must be ACTIVE non-deleted Subject |
| `topicName` | string | No | Cannot be empty string when provided |
| `description` | string | No | Trimmed |
| `status` | `ACTIVE` \| `INACTIVE` | No | Must be exactly one of these |

### Validation Rules

| Rule | HTTP | Error Message |
|------|------|---------------|
| Topic not found or soft-deleted | 404 | `Topic not found` |
| `topicName` provided but empty | 400 | `topicName cannot be empty` |
| Invalid/inactive subject when re-parenting | 400 | `Invalid or inactive subject` |
| Invalid `status` | 400 | `Status must be ACTIVE or INACTIVE` |
| Duplicate name for subject | 400 | `Topic name already exists for this subject` |

### Example Request

```typescript
await api.put(`/api/topics/${id}`, {
  topicName: 'DPSP',
  description: 'Directive Principles',
  status: 'ACTIVE',
});
```

### Example Success Response (200)

```json
{
  "success": true,
  "message": "Topic updated successfully",
  "data": {
    "_id": "665c1b2c3d4e5f6789012345",
    "topicId": "TOP001",
    "topicName": "DPSP",
    "description": "Directive Principles",
    "subject": "665a1b2c3d4e5f6789012345",
    "subjectId": "SUB001",
    "subjectName": "Indian Polity",
    "status": "ACTIVE",
    "createdAt": "2025-06-01T10:00:00.000Z",
    "updatedAt": "2025-06-01T11:30:00.000Z"
  }
}
```

### Example Error Responses

| Status | Body |
|--------|------|
| 404 | `{ "success": false, "message": "Topic not found" }` |
| 400 | `{ "success": false, "message": "topicName cannot be empty" }` |
| 400 | `{ "success": false, "message": "Status must be ACTIVE or INACTIVE" }` |
| 401 / 403 / 500 | Same as Create |

---

## SECTION 5 — DELETE TOPIC API

| | |
|---|---|
| **Request URL** | `DELETE /api/topics/:id` |
| **Method** | DELETE |
| **Authentication** | Bearer JWT — Super Admin only |
| **URL Param** | `id` — Topic MongoDB `_id` |

### Headers

| Header | Value | Required |
|--------|-------|----------|
| `Authorization` | `Bearer <JWT>` | Yes |

### Request Payload

None.

### Behavior

Soft delete only:

- Sets `isDeleted: true`
- Sets `deletedAt` to current timestamp
- Sets `status: 'INACTIVE'`

Record remains in MongoDB. Deleted topics are excluded from all list/detail queries (`isDeleted: false` filter).

There is **no** backend check for downstream references (FacultySubject, recordings, etc.) before delete.

### Example Request

```typescript
await api.delete(`/api/topics/${id}`);
```

### Example Success Response (200)

```json
{
  "success": true,
  "message": "Topic deleted successfully",
  "data": {
    "_id": "665c1b2c3d4e5f6789012345"
  }
}
```

### Example Error Responses

| Status | Body |
|--------|------|
| 404 | `{ "success": false, "message": "Topic not found" }` |
| 401 | `{ "success": false, "message": "Not authorized, no token" }` |
| 403 | `{ "success": false, "message": "Access denied. Super Admin only." }` |
| 500 | `{ "success": false, "message": "Server error", "error": "..." }` |

---

## SECTION 6 — GET TOPIC LIST API

| | |
|---|---|
| **Request URL** | `GET /api/topics` |
| **Method** | GET |
| **Authentication** | Bearer JWT — Super Admin only |

### Headers

| Header | Value | Required |
|--------|-------|----------|
| `Authorization` | `Bearer <JWT>` | Yes |
| `Accept` | `application/json` | Recommended |

### Query Parameters

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `page` | number | `1` | Page number (min 1) |
| `limit` | number | `10` | Page size (min 1, max 100) |
| `sortBy` | string | `createdAt` | Allowed: `createdAt`, `topicName`, `topicId`, `status` |
| `sortOrder` | string | `desc` | `asc` or `desc` |
| `search` | string | `""` | Case-insensitive regex on `topicName` OR `topicId` |
| `status` | string | — | `ACTIVE` or `INACTIVE` |
| `subject` | ObjectId string | — | Filter by parent Subject `_id` |

### Pagination Logic

Implemented in `utils/contentMastersHelpers.js` → `parsePagination`:

- `page` = `Math.max(1, parseInt(page) || 1)`
- `limit` = `Math.min(100, Math.max(1, parseInt(limit) || 10))`
- `skip` = `(page - 1) * limit`
- Response includes: `total`, `page`, `limit`, `totalPages`, `count`

### Search Logic

- Trims `search` param
- Case-insensitive regex match on `topicName` **or** `topicId`
- Special regex characters are escaped server-side

### Filters

| Filter | Query Param | Behavior |
|--------|-------------|----------|
| Status | `status` | Only applied if `ACTIVE` or `INACTIVE` |
| Subject | `subject` | Only applied if valid MongoDB ObjectId |
| Soft-deleted | — | Always excluded (`isDeleted: false`) |

### Sorting

- Invalid `sortBy` falls back to `createdAt`
- `sortOrder` other than `asc` defaults to descending (`-1`)

### Relationships in List Response

Each item includes populated Subject fields via `formatTopic`:

- `subject` — Subject ObjectId
- `subjectId` — Subject code (e.g. `SUB001`)
- `subjectName` — Subject display name

### Example Requests

```http
GET /api/topics?page=1&limit=10 HTTP/1.1
Authorization: Bearer <token>
```

```http
GET /api/topics?search=fundamental&subject=665a1b2c3d4e5f6789012345&status=ACTIVE&page=1&limit=10&sortBy=topicName&sortOrder=asc HTTP/1.1
Authorization: Bearer <token>
```

```typescript
const { data } = await api.get('/api/topics', {
  params: stripEmptyParams({
    search: 'fundamental',
    subject: subjectObjectId,
    status: 'ACTIVE',
    page: 1,
    limit: 10,
    sortBy: 'topicName',
    sortOrder: 'asc',
  }),
});
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
      "topicId": "TOP001",
      "topicName": "Fundamental Rights",
      "description": "Articles 12–35",
      "subject": "665a1b2c3d4e5f6789012345",
      "subjectId": "SUB001",
      "subjectName": "Indian Polity",
      "status": "ACTIVE",
      "createdAt": "2025-06-01T10:00:00.000Z",
      "updatedAt": "2025-06-01T10:00:00.000Z"
    }
  ]
}
```

### Example Error Responses

| Status | Body |
|--------|------|
| 401 | `{ "success": false, "message": "Not authorized, no token" }` |
| 403 | `{ "success": false, "message": "Access denied. Super Admin only." }` |
| 500 | `{ "success": false, "message": "Server error", "error": "..." }` |

---

## SECTION 7 — GET SINGLE TOPIC API

| | |
|---|---|
| **Request URL** | `GET /api/topics/:id` |
| **Method** | GET |
| **Authentication** | Bearer JWT — Super Admin only |
| **URL Param** | `id` — Topic MongoDB `_id` |

### Headers

| Header | Value | Required |
|--------|-------|----------|
| `Authorization` | `Bearer <JWT>` | Yes |

### Additional Endpoint: Topics by Subject (Dropdown)

| | |
|---|---|
| **Request URL** | `GET /api/topics/by-subject/:subjectId` |
| **Method** | GET |
| **Purpose** | ACTIVE topics for a subject — used in dependent dropdowns |

**Query fallback:** Also accepts `?subjectId=` if `:subjectId` param is absent.

**Returns only:** `_id`, `topicId`, `topicName` for ACTIVE, non-deleted topics. Sorted by `topicName` ascending.

### Example Request

```typescript
const { data } = await api.get(`/api/topics/${id}`);
const topic = data?.data;
```

```typescript
const { data } = await api.get(`/api/topics/by-subject/${subjectId}`);
const options = data?.data ?? [];
```

### Example Success Response — Single Topic (200)

```json
{
  "success": true,
  "data": {
    "_id": "665c1b2c3d4e5f6789012345",
    "topicId": "TOP001",
    "topicName": "Fundamental Rights",
    "description": "Articles 12–35",
    "subject": "665a1b2c3d4e5f6789012345",
    "subjectId": "SUB001",
    "subjectName": "Indian Polity",
    "status": "ACTIVE",
    "createdAt": "2025-06-01T10:00:00.000Z",
    "updatedAt": "2025-06-01T10:00:00.000Z"
  }
}
```

### Example Success Response — By Subject (200)

```json
{
  "success": true,
  "count": 4,
  "data": [
    { "_id": "665c1b2c3d4e5f6789012345", "topicId": "TOP001", "topicName": "Fundamental Rights" },
    { "_id": "665c1b2c3d4e5f6789012346", "topicId": "TOP002", "topicName": "DPSP" }
  ]
}
```

### Example Error Responses

| Status | Endpoint | Body |
|--------|----------|------|
| 404 | `GET /:id` | `{ "success": false, "message": "Topic not found" }` |
| 400 | `GET /by-subject/:subjectId` | `{ "success": false, "message": "Invalid or inactive subject" }` |
| 401 / 403 / 500 | All | Standard auth/server errors |

### Toggle Status Endpoint (Related)

| | |
|---|---|
| **Request URL** | `PATCH /api/topics/status/:id` |
| **Body** | `{ "status": "ACTIVE" \| "INACTIVE" }` |
| **Success message** | `Topic status updated` |

---

## SECTION 8 — FRONTEND INTEGRATION ARCHITECTURE

The frontend integration layer lives under `src/`. Topic module files are **planned** — follow the same conventions as `examCategoryService` / `useExamCategories`.

### Directory Structure

```text
src/
├── services/
│   ├── api.ts                    # Axios instance + auth interceptors (exists)
│   ├── commonService.ts          # stripEmptyParams (exists)
│   ├── subjectService.ts         # Parent dropdown dependency (planned — see SUBJECT_FRONTEND_GUIDE.md)
│   └── topicService.ts           # Topic API methods (to implement)
│
├── hooks/
│   ├── queryKeys.ts              # Add topicKeys factory (to implement)
│   └── useTopics.ts              # List, detail, by-subject, mutations (to implement)
│
├── types/
│   └── topic.ts                  # Topic, payloads, list params (to implement)
│
├── pages/
│   └── TopicManagement/
│       ├── TopicListPage.tsx     # Table + filters + pagination
│       ├── TopicCreatePage.tsx   # Create form
│       └── TopicEditPage.tsx     # Edit form (or shared TopicForm.tsx)
│
├── components/
│   └── topics/
│       ├── TopicTable.tsx        # Data table with sort/filter actions
│       ├── TopicForm.tsx         # Shared create/edit form
│       ├── TopicStatusToggle.tsx # Row-level status toggle
│       ├── TopicDeleteDialog.tsx # Delete confirmation
│       └── SubjectTopicSelect.tsx# Subject picker + dependent topic dropdown
│
├── routes/
│   ├── ProtectedRoute.tsx        # JWT gate (exists)
│   └── RoleGuard.tsx             # Super Admin gate (exists)
│
└── utils/
    └── errorHandler.ts           # parseApiError / handleApiError (exists)
```

### Route Configuration (Suggested)

```text
/academics/categories/topic              → TopicListPage
/academics/categories/topic/create       → TopicCreatePage
/academics/categories/topic/:id/edit     → TopicEditPage
```

Wrap with `ProtectedRoute` + `RoleGuard allowedRoles={['Admin']}` (maps to `super_admin` / `SUPER_ADMIN`).

### Environment

| Variable | Purpose |
|----------|---------|
| `VITE_API_BASE_URL` | Backend base URL (e.g. `http://localhost:5000`) |
| `VITE_AUTH_TOKEN_KEY` | localStorage key for JWT (default `authToken`) |

**Source:** `.env.example`, `src/services/api.ts`, `src/vite.config.ts` (`envDir: '..'`)`

---

## SECTION 9 — TOPIC SERVICE IMPLEMENTATION

Create `src/services/topicService.ts` following `examCategoryService.ts` conventions.

### Type Definitions (`src/types/topic.ts`)

```typescript
import type { PaginatedQuery } from './api';

export type TopicStatus = 'ACTIVE' | 'INACTIVE';

export interface Topic {
  _id: string;
  topicId: string;
  topicName: string;
  description: string;
  subject: string;
  subjectId?: string;
  subjectName?: string;
  status: TopicStatus;
  createdAt?: string;
  updatedAt?: string;
}

export interface TopicDropdownItem {
  _id: string;
  topicId: string;
  topicName: string;
}

export interface TopicListParams extends PaginatedQuery {
  subject?: string;
  status?: TopicStatus;
  sortBy?: 'createdAt' | 'topicName' | 'topicId' | 'status';
}

export interface CreateTopicPayload {
  subjectId: string;
  topicName: string;
  description?: string;
  status?: TopicStatus;
}

export interface UpdateTopicPayload {
  subjectId?: string;
  topicName?: string;
  description?: string;
  status?: TopicStatus;
}
```

### Service Implementation

```typescript
import api from './api';
import { stripEmptyParams } from './commonService';
import type { ApiSuccessResponse } from '../types/api';
import type {
  CreateTopicPayload,
  Topic,
  TopicDropdownItem,
  TopicListParams,
  TopicStatus,
  UpdateTopicPayload,
} from '../types/topic';

const TOPICS_BASE = '/api/topics';

type PaginatedTopicsResponse = ApiSuccessResponse<Topic[]> & {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  count: number;
};

export const topicService = {
  /** GET /api/topics — paginated list */
  getTopics: async (params?: TopicListParams) => {
    const { data } = await api.get<PaginatedTopicsResponse>(TOPICS_BASE, {
      params: stripEmptyParams(params),
    });
    return data;
  },

  /** GET /api/topics/:id — single record */
  getTopicById: async (id: string) => {
    const { data } = await api.get<ApiSuccessResponse<Topic>>(`${TOPICS_BASE}/${id}`);
    return data;
  },

  /** GET /api/topics/by-subject/:subjectId — ACTIVE dropdown */
  getTopicsBySubject: async (subjectId: string) => {
    const { data } = await api.get<ApiSuccessResponse<TopicDropdownItem[]>>(
      `${TOPICS_BASE}/by-subject/${subjectId}`
    );
    return data;
  },

  /** POST /api/topics — create */
  createTopic: async (payload: CreateTopicPayload) => {
    const { data } = await api.post<ApiSuccessResponse<Topic>>(TOPICS_BASE, payload);
    return data;
  },

  /** PUT /api/topics/:id — partial update */
  updateTopic: async (id: string, payload: UpdateTopicPayload) => {
    const { data } = await api.put<ApiSuccessResponse<Topic>>(
      `${TOPICS_BASE}/${id}`,
      payload
    );
    return data;
  },

  /** PATCH /api/topics/status/:id — status-only update */
  toggleTopicStatus: async (id: string, status: TopicStatus) => {
    const { data } = await api.patch<ApiSuccessResponse<Topic>>(
      `${TOPICS_BASE}/status/${id}`,
      { status }
    );
    return data;
  },

  /** DELETE /api/topics/:id — soft delete */
  deleteTopic: async (id: string) => {
    const { data } = await api.delete<ApiSuccessResponse<{ _id: string }>>(
      `${TOPICS_BASE}/${id}`
    );
    return data;
  },
};

export default topicService;
```

### Export from Barrel

Add to `src/services/index.ts`:

```typescript
export { topicService } from './topicService';
```

---

## SECTION 10 — REACT QUERY INTEGRATION

Add to `src/hooks/queryKeys.ts`:

```typescript
import type { TopicListParams } from '../types/topic';

export const topicKeys = {
  all: ['topics'] as const,
  lists: () => [...topicKeys.all, 'list'] as const,
  list: (params?: TopicListParams) => [...topicKeys.lists(), params ?? {}] as const,
  details: () => [...topicKeys.all, 'detail'] as const,
  detail: (id: string) => [...topicKeys.details(), id] as const,
  bySubject: (subjectId: string) => [...topicKeys.all, 'by-subject', subjectId] as const,
};
```

### Hooks (`src/hooks/useTopics.ts`)

```typescript
import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseQueryOptions,
} from '@tanstack/react-query';
import { topicService } from '../services/topicService';
import { topicKeys } from './queryKeys';
import { handleApiError } from '../utils/errorHandler';
import type { ApiSuccessResponse } from '../types/api';
import type {
  CreateTopicPayload,
  Topic,
  TopicDropdownItem,
  TopicListParams,
  TopicStatus,
  UpdateTopicPayload,
} from '../types/topic';

type TopicsResponse = ApiSuccessResponse<Topic[]> & {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  count: number;
};

/** GET /api/topics — paginated list */
export const useTopics = (
  params?: TopicListParams,
  options?: Omit<UseQueryOptions<TopicsResponse>, 'queryKey' | 'queryFn'>
) =>
  useQuery({
    queryKey: topicKeys.list(params),
    queryFn: () => topicService.getTopics(params),
    ...options,
  });

/** GET /api/topics/:id */
export const useTopic = (
  id: string | undefined,
  options?: Omit<UseQueryOptions<ApiSuccessResponse<Topic>>, 'queryKey' | 'queryFn'>
) =>
  useQuery({
    queryKey: topicKeys.detail(id ?? ''),
    queryFn: () => topicService.getTopicById(id!),
    enabled: Boolean(id),
    ...options,
  });

/** GET /api/topics/by-subject/:subjectId — ACTIVE dropdown */
export const useTopicsBySubject = (
  subjectId: string | undefined,
  options?: Omit<
    UseQueryOptions<ApiSuccessResponse<TopicDropdownItem[]>>,
    'queryKey' | 'queryFn'
  >
) =>
  useQuery({
    queryKey: topicKeys.bySubject(subjectId ?? ''),
    queryFn: () => topicService.getTopicsBySubject(subjectId!),
    enabled: Boolean(subjectId),
    staleTime: 5 * 60 * 1000,
    ...options,
  });

/** POST /api/topics */
export const useCreateTopic = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateTopicPayload) => topicService.createTopic(payload),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: topicKeys.all });
      const subjectId = response.data?.subject;
      if (subjectId) {
        queryClient.invalidateQueries({ queryKey: topicKeys.bySubject(subjectId) });
      }
    },
    onError: (error) => handleApiError(error),
  });
};

/** PUT /api/topics/:id */
export const useUpdateTopic = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateTopicPayload }) =>
      topicService.updateTopic(id, payload),
    onSuccess: (response, variables) => {
      queryClient.invalidateQueries({ queryKey: topicKeys.all });
      queryClient.invalidateQueries({ queryKey: topicKeys.detail(variables.id) });
      const subjectId = response.data?.subject;
      if (subjectId) {
        queryClient.invalidateQueries({ queryKey: topicKeys.bySubject(subjectId) });
      }
      if (variables.payload.subjectId) {
        queryClient.invalidateQueries({
          queryKey: topicKeys.bySubject(variables.payload.subjectId),
        });
      }
    },
    onError: (error) => handleApiError(error),
  });
};

/** PATCH /api/topics/status/:id — optimistic status toggle */
export const useToggleTopicStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: TopicStatus }) =>
      topicService.toggleTopicStatus(id, status),
    onMutate: async ({ id, status }) => {
      await queryClient.cancelQueries({ queryKey: topicKeys.detail(id) });
      const previous = queryClient.getQueryData<ApiSuccessResponse<Topic>>(
        topicKeys.detail(id)
      );
      if (previous?.data) {
        queryClient.setQueryData(topicKeys.detail(id), {
          ...previous,
          data: { ...previous.data, status },
        });
      }
      return { previous };
    },
    onError: (error, variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(topicKeys.detail(variables.id), context.previous);
      }
      handleApiError(error);
    },
    onSettled: (_data, _error, variables) => {
      queryClient.invalidateQueries({ queryKey: topicKeys.all });
      queryClient.invalidateQueries({ queryKey: topicKeys.detail(variables.id) });
    },
  });
};

/** DELETE /api/topics/:id */
export const useDeleteTopic = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => topicService.deleteTopic(id),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: topicKeys.all });
      queryClient.removeQueries({ queryKey: topicKeys.detail(id) });
    },
    onError: (error) => handleApiError(error),
  });
};

export default useTopics;
```

### Query Key Reference

| Key | Pattern | Used By |
|-----|---------|---------|
| `topicKeys.all` | `['topics']` | Broad invalidation after mutations |
| `topicKeys.list(params)` | `['topics', 'list', params]` | `useTopics` |
| `topicKeys.detail(id)` | `['topics', 'detail', id]` | `useTopic` |
| `topicKeys.bySubject(subjectId)` | `['topics', 'by-subject', subjectId]` | `useTopicsBySubject` |

### Cache Invalidation Strategy

| Mutation | Invalidation |
|----------|--------------|
| Create | `topicKeys.all` + `topicKeys.bySubject(subjectId)` |
| Update | `topicKeys.all` + `topicKeys.detail(id)` + affected `bySubject` keys |
| Toggle status | Optimistic `detail(id)`; `onSettled` → `all` + `detail(id)` |
| Delete | `topicKeys.all` + `removeQueries(detail(id))` |

### Global Query Defaults

From `src/providers/QueryProvider.tsx`:

- `staleTime`: 60 seconds
- No retry on 401, 403, 404
- `refetchOnWindowFocus`: false

---

## SECTION 11 — FORM INTEGRATION

### Create / Edit Form Field Mapping

| Frontend Field | Backend Field | Required | Validation |
|----------------|---------------|----------|------------|
| Subject dropdown value | `subjectId` | **Yes** (create) | Must be ACTIVE Subject `_id` from `GET /api/subjects/dropdown` |
| Topic name input | `topicName` | **Yes** | Non-empty after `.trim()` |
| Description textarea | `description` | No | Trim before submit; default `""` |
| Status select/toggle | `status` | No | `ACTIVE` or `INACTIVE` only; default `ACTIVE` |
| Topic ID (read-only) | `topicId` | — | Server-generated; display only on edit |
| Mongo ID (hidden) | `_id` | — | URL param for edit; never sent on create |

### Create Form Submit

```typescript
const create = useCreateTopic();

const onSubmit = (values: FormValues) => {
  if (!values.subjectId?.trim()) return;
  if (!values.topicName?.trim()) return;

  create.mutate({
    subjectId: values.subjectId,
    topicName: values.topicName.trim(),
    description: values.description?.trim() ?? '',
    status: values.status ?? 'ACTIVE',
  });
};
```

### Edit Form Prefill

```typescript
const { data, isLoading } = useTopic(topicId);
const topic = data?.data;

// Prefill:
// subjectId  → topic.subject (ObjectId string)
// topicName  → topic.topicName
// description → topic.description
// status     → topic.status
// topicId    → topic.topicId (read-only display)
```

### Edit Form Submit

```typescript
const update = useUpdateTopic();

update.mutate({
  id: topicId,
  payload: {
    subjectId: values.subjectId,
    topicName: values.topicName.trim(),
    description: values.description?.trim(),
    status: values.status,
  },
});
```

### Parent Subject Dropdown

Load from `GET /api/subjects/dropdown`:

```json
{
  "success": true,
  "count": 8,
  "data": [
    { "_id": "665a1b2c3d4e5f6789012345", "subjectId": "SUB001", "subjectName": "Indian Polity" }
  ]
}
```

Display: `subjectName` (`subjectId`). Submit value: `_id`.

### Dependent Topic Dropdown (Other Modules)

When another form needs topics for a selected subject:

```typescript
const { data } = useTopicsBySubject(selectedSubjectId);
const options = data?.data ?? [];
// Each option: { _id, topicId, topicName }
```

### Upload Fields

**None.** Topic create/update uses JSON only. Do not use `multipart/form-data`.

---

## SECTION 12 — TABLE INTEGRATION

### Recommended Columns

| Column | Data Field | Sortable (`sortBy`) | Notes |
|--------|------------|---------------------|-------|
| Topic ID | `topicId` | `topicId` | Server-generated code |
| Topic Name | `topicName` | `topicName` | Primary display |
| Subject | `subjectName` | — | Populated from parent Subject |
| Subject ID | `subjectId` | — | Code e.g. `SUB001` |
| Status | `status` | `status` | Badge: ACTIVE / INACTIVE |
| Created | `createdAt` | `createdAt` | Format as locale date |
| Updated | `updatedAt` | — | Optional |
| Actions | — | — | Edit, Toggle Status, Delete |

### Filters

| UI Filter | Query Param | Component | Notes |
|-----------|-------------|-----------|-------|
| Search | `search` | Text input (debounce 300ms) | Matches `topicName` or `topicId` |
| Subject | `subject` | Dropdown from `/api/subjects/dropdown` | Pass Subject `_id` |
| Status | `status` | Select: All / ACTIVE / INACTIVE | Omit param for "All" |

**Not available:** center, program, exam category, course, batch filters.

### Actions (Per Row)

| Action | Hook | API |
|--------|------|-----|
| Edit | Navigate to edit page | — |
| Toggle status | `useToggleTopicStatus` | `PATCH /api/topics/status/:id` |
| Delete | `useDeleteTopic` | `DELETE /api/topics/:id` |

### Search

```typescript
const [search, setSearch] = useState('');
const debouncedSearch = useDebouncedValue(search, 300);

const { data, isLoading, isFetching, refetch } = useTopics({
  page,
  limit: 10,
  search: debouncedSearch,
  subject: subjectFilter,
  status: statusFilter,
  sortBy,
  sortOrder,
});
```

### Pagination

```typescript
const rows = data?.data ?? [];
const total = data?.total ?? 0;
const totalPages = data?.totalPages ?? 0;
const currentPage = data?.page ?? 1;

// Page change:
setPage((p) => Math.min(Math.max(1, p), totalPages || 1));
```

### Bulk Actions

**Not supported by backend.** No bulk delete, bulk status update, or multi-select endpoints exist for Topics. Implement only per-row actions.

### Status Handling

| UI State | Backend Value | Display |
|----------|---------------|---------|
| Active | `ACTIVE` | Green badge / toggle on |
| Inactive | `INACTIVE` | Gray badge / toggle off |
| Deleted | — | Not returned in list (soft-deleted) |

Use `useToggleTopicStatus` for inline row toggles (optimistic update). For edit forms that change status alongside other fields, use `useUpdateTopic` with `status` in payload.

### Loading / Error / Empty States

Use existing common components:

- `PageLoader` when `isLoading`
- `ErrorState` with `onRetry={() => refetch()}` when `isError`
- `EmptyState` when `!isLoading && rows.length === 0`

---

## SECTION 13 — ERROR HANDLING

The backend Topic controller returns **400, 401, 403, 404, 500** only. It does **not** return **409** or **422** for Topic endpoints.

Use `handleApiError` from `src/utils/errorHandler.ts` in all mutation `onError` handlers.

### 400 — Validation / Business Rule

| Message | Cause | Frontend Behavior |
|---------|-------|-------------------|
| `topicName is required` | Empty name on create | Highlight name field; block submit |
| `topicName cannot be empty` | Empty name on update | Highlight name field |
| `Invalid or inactive subject` | Bad/missing `subjectId` | Highlight subject dropdown |
| `Status must be ACTIVE or INACTIVE` | Invalid status | Reset status control |
| `Topic name already exists for this subject` | Duplicate per subject | Show inline error on name field |

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

**Frontend behavior:** Show permission error; redirect to `/unauthorized` if using `RoleGuard`.

### 404 — Not Found

| Message | Cause |
|---------|-------|
| `Topic not found` | Invalid ID or soft-deleted topic |

**Frontend behavior:** Show not-found state; redirect to list after delete.

### 409 — Conflict

**Not returned by Topic API.** Handle generically via `parseApiError` if added in future.

### 422 — Unprocessable Entity

**Not returned by Topic API.** No schema validator middleware on Topic routes.

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

## SECTION 14 — AUTHORIZATION

### Backend Requirements

All `/api/topics` routes apply:

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

No feature-level permission matrix is checked for Topic routes.

### Role Permissions Matrix

| Role | Topic CRUD |
|------|------------|
| Super Admin (`super_admin` / `SUPER_ADMIN`) | Full access |
| Center Admin, Finance Admin, Mentor, etc. | **403 Forbidden** |
| Unauthenticated | **401 Unauthorized** |

### Login

```http
POST /api/auth/login-super-admin
Content-Type: application/json

{ "email": "admin@example.com", "password": "..." }
```

Store returned token via `setAuthToken(token)` and user via `persistSession()`.

### Protected Routes (Frontend)

```tsx
<Route element={<ProtectedRoute />}>
  <Route
    path="/academics/categories/topic"
    element={
      <RoleGuard allowedRoles={['Admin']}>
        <TopicListPage />
      </RoleGuard>
    }
  />
</Route>
```

`RoleGuard` with `allowedRoles={['Admin']}` resolves to `super_admin` and `SUPER_ADMIN` via `ROLE_ALIASES` in `src/routes/roleConfig.ts`.

### Access Rules

1. Token must exist before any Topic API call (`api.ts` interceptor attaches it).
2. Topic management UI should only render for Super Admin.
3. Do not expose Topic CRUD to non-Super Admin roles — backend will return 403.

---

## SECTION 15 — SERVER PERSISTENCE VERIFICATION

Every CRUD operation must confirm success from the **API response** — never from local/mock state.

### Create — Data Successfully Saved

1. Call `createTopic` mutation → `POST /api/topics`.
2. Verify `response.success === true` and `response.status === 201`.
3. Verify `response.data` contains server-generated `_id`, `topicId`, `createdAt`.
4. Invalidate `topicKeys.all` and navigate to list (or show success from `response.message`).
5. **Do not** append to local array without refetch.

```typescript
create.mutate(payload, {
  onSuccess: (res) => {
    if (!res.success || !res.data?._id) return;
    // res.data._id and res.data.topicId prove MongoDB write
    navigate('/academics/categories/topic');
  },
});
```

### Update — Data Successfully Updated

1. Call `updateTopic` → `PUT /api/topics/:id`.
2. Verify `response.success === true` and `response.message === 'Topic updated successfully'`.
3. Verify `response.data.updatedAt` changed.
4. Invalidate `topicKeys.detail(id)` and `topicKeys.all`.

### Delete — Data Successfully Deleted

1. Call `deleteTopic` → `DELETE /api/topics/:id`.
2. Verify `response.success === true` and `response.message === 'Topic deleted successfully'`.
3. Verify `response.data._id` matches deleted ID.
4. Refetch list — deleted topic must not appear.
5. `GET /api/topics/:id` on deleted ID returns 404.

### Fetch — Data From Database

1. List: `useTopics` → `GET /api/topics` — rows come from `data.data[]`.
2. Detail: `useTopic(id)` → `GET /api/topics/:id` — form prefilled from `data.data`.
3. Use `isFetching` indicator during background refetch.
4. **Do not** seed tables with hardcoded Topic arrays.
5. **Do not** show success toasts without `mutation.isSuccess` and valid response body.

### Persistence Flow

```text
Frontend (topicService.createTopic)
  → POST /api/topics
  → routes/topicRoutes.js (protect → requireSuperAdmin)
  → controllers/topicController.createTopic
      1. Validate topicName non-empty
      2. findActiveSubject(subjectId) → utils/contentMastersHelpers.js
      3. generateTopicId() → utils/contentIdGenerator.js (TOP001, TOP002, …)
      4. Topic.create({ topicId, subject, topicName, description, status })
         → MongoDB collection: topics
      5. Populate subject → formatTopic → 201 response
```

| Action | Controller | MongoDB Operation |
|--------|------------|-----------------|
| Create | `createTopic` | `Topic.create()` |
| Update | `updateTopic` | `topic.save()` |
| Status | `updateTopicStatus` | `findOneAndUpdate({ status })` |
| Delete | `deleteTopic` | `topic.save()` with `isDeleted: true` |
| List/Detail | `getTopics` / `getTopicById` | `Topic.find()` / `findOne()` |

---

## SECTION 16 — IMPLEMENTATION CHECKLIST

### Foundation

- [ ] Configure `VITE_API_BASE_URL` in `.env`
- [ ] Login as Super Admin; store JWT via `setAuthToken`
- [ ] Verify `Authorization: Bearer` header on Topic requests (Network tab)

### Service Layer

- [ ] `src/types/topic.ts` created with all interfaces
- [ ] Service Created — `src/services/topicService.ts`
- [ ] Exported from `src/services/index.ts`

### Hooks Layer

- [ ] Hooks Created — `src/hooks/useTopics.ts`
- [ ] Query Keys Added — `topicKeys` in `src/hooks/queryKeys.ts`
- [ ] Exported from `src/hooks/index.ts`

### UI Wiring

- [ ] Table Connected — `TopicTable` uses `useTopics` with pagination params
- [ ] Form Connected — `TopicForm` uses create/update mutations
- [ ] Validation Connected — client-side trim + required checks mirror backend
- [ ] Subject dropdown wired to `GET /api/subjects/dropdown`
- [ ] Status toggle uses `useToggleTopicStatus`
- [ ] Delete confirmation uses `useDeleteTopic`

### API Testing

- [ ] API Tested — all 7 endpoints respond correctly with Super Admin token
- [ ] CRUD Tested — create, read, update, delete full cycle
- [ ] Pagination Tested — `page`, `limit`, `totalPages` match UI
- [ ] Search Tested — `search` matches `topicName` and `topicId`
- [ ] Filters Tested — `subject` and `status` filters work
- [ ] Sort Tested — `sortBy` + `sortOrder` on all four allowed fields
- [ ] By-subject dropdown tested — `GET /api/topics/by-subject/:subjectId`

### Authorization

- [ ] Authorization Tested — 403 for non-Super Admin; 401 without token
- [ ] `RoleGuard` wraps Topic routes
- [ ] 401 redirects to login

### Production Readiness

- [ ] No mock data or hardcoded topic rows
- [ ] No fake success messages without API `success: true`
- [ ] Cache invalidation after all mutations
- [ ] Error messages display `response.data.message`
- [ ] Production Ready

---

## MongoDB Schema Reference

**Model:** `Topic` · **Collection:** `topics`  
**Source:** `models/Topic.js`

| Field | Type | Required | Default | Notes |
|-------|------|----------|---------|-------|
| `topicId` | String | auto | — | Unique; `TOP###` via `generateTopicId()` |
| `subject` | ObjectId → Subject | **Yes** | — | Parent FK |
| `topicName` | String | **Yes** | — | Trimmed |
| `description` | String | No | `""` | |
| `status` | `ACTIVE` \| `INACTIVE` | No | `ACTIVE` | Enum |
| `isDeleted` | Boolean | No | `false` | Indexed |
| `deletedAt` | Date | No | `null` | Set on soft delete |
| `createdAt` | Date | auto | timestamps | |
| `updatedAt` | Date | auto | timestamps | |

**Indexes:** `{ subject: 1, topicName: 1 }`, `{ subject: 1, status: 1, isDeleted: 1 }`, `{ topicName: 1 }`, `{ isDeleted: 1 }`

---

## Backend Source References

| File | Purpose |
|------|---------|
| `routes/topicRoutes.js` | Route definitions + middleware |
| `controllers/topicController.js` | All request handlers + validation |
| `models/Topic.js` | Mongoose schema |
| `utils/contentMastersHelpers.js` | Pagination, sort, search, `findActiveSubject` |
| `utils/contentIdGenerator.js` | `generateTopicId()` → `TOP###` |
| `middleware/authMiddleware.js` | JWT `protect` |
| `middleware/requireSuperAdmin.js` | Super Admin gate |
| `app.js` line 257 | Mount: `/api/topics` |

---

## Related Documentation

| Document | Purpose |
|----------|---------|
| `docs/SUBJECT_FRONTEND_GUIDE.md` | Parent Subject module integration |
| `docs/academics/exam-category-integration-guide.md` | Sibling Exam Category module (different hierarchy) |
| `SUBJECT_TOPIC_TEACHER_API_GUIDE.md` | Backend API reference for Subject + Topic + Teacher |
| `SUBJECT_TOPIC_TEACHER_POSTMAN_COLLECTION.json` | Postman collection for Topic CRUD |
| `docs/frontend-architecture.md` | Frontend layer conventions |

---

*Generated from backend source of truth: `topicController.js`, `topicRoutes.js`, `models/Topic.js`. Backend fields, endpoints, and validation rules are authoritative over any frontend assumptions.*
