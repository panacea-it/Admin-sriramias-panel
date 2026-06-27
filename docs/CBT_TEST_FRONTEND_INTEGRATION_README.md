# CBT Test — Frontend Integration README

**Version:** 1.0  
**Audience:** React + Vite frontend developers  
**Scope:** Consume existing backend APIs only — no backend changes  
**Single source of truth** for CBT (Computer-Based Test) integration in the LMS Admin Panel

---

## Table of Contents

1. [Module Overview](#1-module-overview)
2. [Complete API Inventory](#2-complete-api-inventory)
3. [All Dropdown APIs](#3-all-dropdown-apis)
4. [Request / Response Reference](#4-request--response-reference)
5. [React Service Layer](#5-react-service-layer)
6. [TanStack Query Integration](#6-tanstack-query-integration)
7. [Form Integration Guide](#7-form-integration-guide)
8. [Table Integration Guide](#8-table-integration-guide)
9. [Complete Data Flow](#9-complete-data-flow)
10. [Error Handling Guide](#10-error-handling-guide)
11. [File Upload Integration](#11-file-upload-integration)
12. [Authorization & Permissions](#12-authorization--permissions)
13. [Frontend Implementation Checklist](#13-frontend-implementation-checklist)
14. [Database Persistence Verification](#14-database-persistence-verification)
15. [Final Frontend Integration Rules](#15-final-frontend-integration-rules)

---

## 1. Module Overview

### Navigation path

```text
LMS Admin Panel
  └── Test Management
        ├── CBT Tests (create / edit / publish)     → /api/prelims-tests
        └── CBT Management (results / analytics)    → /api/cbt-management
```

### Backend naming (important)

In this backend, **CBT tests are stored as Prelims Tests**:

| UI concept | Backend model / field |
|------------|----------------------|
| CBT Test | `SubjectPrelimsTest` |
| Human-readable test code | `prelimsTestId` (prefix `PTM`, e.g. `PTM001`) |
| MongoDB primary key | `_id` (24-char hex ObjectId) |
| Faculty Subject | Must include category `PRELIMS_TEST` |
| Topic | `SubjectContentFolder` with `category: PRELIMS_TEST` |
| Questions | `SubjectPrelimsTestQuestion` (per language) |
| Student attempts (read-only in admin APIs) | `SubjectPrelimsTestAttempt` |

### Purpose

The CBT Test module lets admins:

1. **Create and manage** multi-language MCQ tests assigned to batches (Super Admin — `/api/prelims-tests`).
2. **Monitor evaluation progress** and **view student results** for published tests (Staff with `CBT_MANAGEMENT` permission — `/api/cbt-management`).

### User flows

#### Flow A — Create / manage a CBT test (Super Admin)

```text
Select Faculty Subject (PRELIMS_TEST)
  → Select Topic (folder)
  → Select Batches (multi)
  → Configure schedule, marks, languages, settings
  → Upload question sheets (XLSX/CSV per language)
  → Save as DRAFT or PUBLISHED
  → Optionally publish / duplicate / soft-delete later
```

#### Flow B — View CBT results (CBT Management permission)

```text
Dashboard (evaluation progress)
  → Faculty subjects with published tests
  → Topics under subject
  → Tests under topic
  → Student results table + analytics + CSV/PDF export
```

### Roles involved

| Role / permission | Module | Capabilities |
|-------------------|--------|--------------|
| **Super Admin** (`User.role = super_admin` or `AdminAccess.roleCode = SUPER_ADMIN`) | `/api/prelims-tests` + all dropdown APIs | Full CRUD, publish, duplicate, question upload |
| **Staff with `TEST_MANAGEMENT` → `CBT_MANAGEMENT`** | `/api/cbt-management` | Read-only reporting (dashboard, lists, results, exports) |
| Super Admin | Also bypasses all `checkPermission` gates | Can access CBT Management too |

### Expected frontend behavior

- Use **POST with JSON body** for all list/filter/read endpoints (backend does not use query-string filters for these).
- Use **`multipart/form-data`** only for test **create** and **question upload** endpoints.
- Use Mongo **`_id`** (not `prelimsTestId` string like `PTM001`) in URL params and in `view` body — `isValidObjectId` is enforced.
- **Scheduling** is embedded in `scheduleDate` + `scheduleTime` on create/update — there is **no separate schedule API**.
- **Archive** is **not implemented** — use soft delete (`DELETE`) or `UNPUBLISHED` publish status.
- CBT Management only shows **PUBLISHED** tests (`publishStatus: 'PUBLISHED'`, `isDeleted: false`).

---

## 2. Complete API Inventory

### Base URLs & auth headers

```http
Authorization: Bearer <JWT>
Content-Type: application/json
```

For multipart endpoints:

```http
Authorization: Bearer <JWT>
Content-Type: multipart/form-data
```

Environment variable:

```env
VITE_API_BASE_URL=https://your-backend-host
```

---

## Module A — Prelims Test CRUD (`/api/prelims-tests`)

**Mount:** `app.use('/api/prelims-tests', ...superAdminAuth, subjectPrelimsTestRoutes)`  
**Auth:** `protect` + `requireSuperAdmin`

---

### Create CBT Test

| Property | Value |
|----------|-------|
| **Endpoint** | `POST /api/prelims-tests` |
| **Method** | `POST` |
| **Authentication** | Super Admin JWT |
| **Content-Type** | `multipart/form-data` |
| **Middleware** | `subjectPrelimsTestCreateUpload` (max 15 files, 10 MB each) |

#### Required form fields

| Field | Type | Notes |
|-------|------|-------|
| `facultySubjectId` | ObjectId string | Active faculty subject with `PRELIMS_TEST` category |
| `folderId` | ObjectId string | Active folder under same faculty subject, `category: PRELIMS_TEST` |
| `batchIds` or `batchId` | JSON array string, comma-separated, or repeated | At least 1 valid batch linked to faculty subject |
| `testName` | string | Non-empty trimmed |
| `languages` | JSON array string or comma-separated | Min 1; must match active `TestConfigLanguage.languageName` |
| `scheduleDate` | ISO date string | e.g. `2026-06-24` |
| `scheduleTime` | string | `HH:mm` or `HH:mm:ss` (e.g. `10:00`) |
| `durationMinutes` | number | Positive; presets 30/60/90/120/180 or custom |
| `totalMarks` | number | ≥ 1 |
| `marksPerCorrectAnswer` | number | ≥ 0 |
| `resultDate` | ISO date string | Must be ≥ `scheduleDate` |
| `questionFile` | file(s) | One XLSX/CSV per selected language (or legacy `questionFile_English`, etc.) |

#### Optional form fields

| Field | Type | Default |
|-------|------|---------|
| `publishStatus` | `DRAFT` \| `PUBLISHED` \| `UNPUBLISHED` | `DRAFT` |
| `negativeMarking` | JSON string | `{ enabled: false, preset: "0.25", value: 0 }` |
| `attemptSettings` | JSON string | `{ enabled: false, attempts: 1, restrictionType: "LIFETIME", showRemainingAttempts: false }` |
| `rankingEnabled` | boolean / `"true"` / `"false"` | `false` |
| `examPatternId` | ObjectId or empty | `null` |
| `instructionsHtml` | string | `''` |
| `shuffleQuestions` | boolean | `false` |
| `shuffleOptions` | boolean | `false` |
| `duplicateMode` | `SKIP` \| `REPLACE` \| `ALLOW` | `SKIP` |

#### Validation rules

- All required fields present on create (`VALIDATION_REQUIRED_FIELDS`).
- `scheduleTime` regex: `^([01]?\d|2[0-3]):[0-5]\d(:[0-5]\d)?$`
- `resultDate` ≥ `scheduleDate` (`INVALID_RESULT_DATE`)
- `languages` must exist in active Test Configuration languages (`INVALID_LANGUAGE`)
- One question sheet required per configured language (`QUESTION_FILES_REQUIRED`)
- Sheet must pass column validation (see [File Upload Integration](#11-file-upload-integration))
- Publishing on create requires active questions for every language (`PRELIMS_TEST_NO_QUESTIONS`) — on failure the test is **rolled back** (soft-deleted)

#### Success response — `201`

```json
{
  "success": true,
  "message": "Prelims test created with questions for all languages",
  "languageUploads": [
    {
      "language": "English",
      "sheetStats": { "totalRows": 50, "validRows": 50, "skippedRows": 0 },
      "uploadStats": { "inserted": 50, "replaced": 0, "skipped": 0 }
    }
  ],
  "data": { }
}
```

`data` is a full `formatPrelimsTestRow` object (see [List CBT Tests](#list-cbt-tests) response row).

#### Error responses

| HTTP | Shape |
|------|-------|
| **400** | Structured CMS error (see §10) or sheet validation `{ success: false, message, language, valid: false, errors: [{ row, message }], stats }` |
| **401** | `{ success: false, statusCode, message: "Not authorized, no token", data: null, error: null }` |
| **403** | `{ success: false, message: "Access denied. Super Admin only." }` |
| **500** | `{ success: false, message: "Server error", error: "..." }` |

---

### Update CBT Test

| Property | Value |
|----------|-------|
| **Endpoint** | `PUT /api/prelims-tests/:id` |
| **Method** | `PUT` |
| **Authentication** | Super Admin JWT |
| **Content-Type** | `application/json` |
| **`:id`** | Mongo `_id` of the test |

#### Payload (partial update supported)

Any subset of create metadata fields. **No file upload on update** — use question upload endpoints.

```json
{
  "testName": "GS Paper I — Mock 2",
  "scheduleDate": "2026-07-01",
  "scheduleTime": "14:30",
  "resultDate": "2026-07-02",
  "durationMinutes": 120,
  "totalMarks": 100,
  "marksPerCorrectAnswer": 2,
  "batchIds": ["665d1b2c3d4e5f6789012345", "665d1b2c3d4e5f6789012346"],
  "languages": ["English", "Hindi"],
  "negativeMarking": { "enabled": true, "preset": "0.33", "value": 0.33 },
  "attemptSettings": { "enabled": true, "attempts": 2, "restrictionType": "LIFETIME", "showRemainingAttempts": true },
  "rankingEnabled": true,
  "examPatternId": "665d1b2c3d4e5f6789012347",
  "instructionsHtml": "<p>Read all instructions carefully.</p>",
  "shuffleQuestions": true,
  "shuffleOptions": false,
  "publishStatus": "DRAFT"
}
```

**Note:** Removing a language from `languages` soft-deletes all questions for that language.

#### Success response — `200`

```json
{
  "success": true,
  "message": "Prelims test updated successfully",
  "data": { }
}
```

#### Error responses

| HTTP | `errorCode` examples |
|------|---------------------|
| **400** | `VALIDATION_REQUIRED_FIELDS`, `INVALID_RESULT_DATE`, `INVALID_LANGUAGE`, etc. |
| **404** | `PRELIMS_TEST_NOT_FOUND` |

---

### Delete CBT Test

| Property | Value |
|----------|-------|
| **Endpoint** | `DELETE /api/prelims-tests/:id` |
| **Method** | `DELETE` |
| **Authentication** | Super Admin JWT |

Soft-deletes test and all its questions (`isDeleted: true`).

#### Success response — `200`

```json
{
  "success": true,
  "message": "Prelims test deleted successfully"
}
```

#### Error response — `404`

```json
{
  "success": false,
  "errorCode": "PRELIMS_TEST_NOT_FOUND",
  "message": "Prelims test not found",
  "reason": "Prelims test not found",
  "httpStatus": 404
}
```

---

### Get CBT Test By ID

| Property | Value |
|----------|-------|
| **Endpoint** | `POST /api/prelims-tests/view` |
| **Method** | `POST` |
| **Authentication** | Super Admin JWT |
| **Body** | `{ "id": "<Mongo _id>" }` or `{ "prelimsTestId": "<Mongo _id>" }` |

**Important:** Despite the field name `prelimsTestId`, the value must be a **24-char Mongo ObjectId**, not the `PTM…` display code.

#### Success response — `200`

```json
{
  "success": true,
  "data": {
    "_id": "665d1b2c3d4e5f6789012345",
    "prelimsTestId": "PTM042",
    "facultySubjectId": "665d1b2c3d4e5f6789012340",
    "folderId": "665d1b2c3d4e5f6789012341",
    "batchIds": ["665d1b2c3d4e5f6789012342"],
    "batches": [{ "_id": "665d1b2c3d4e5f6789012342", "batchId": "BAT001", "batchName": "IAS 2026 Morning" }],
    "assignedBatches": [{ "_id": "665d1b2c3d4e5f6789012342", "batchId": "BAT001", "batchName": "IAS 2026 Morning" }],
    "batchNamesLabel": "IAS 2026 Morning",
    "testName": "GS Paper I — Mock 1",
    "languages": ["English", "Hindi"],
    "durationPreset": "120",
    "durationMinutes": 120,
    "durationLabel": "2 hr",
    "totalMarks": 100,
    "marksPerCorrectAnswer": 2,
    "negativeMarking": { "enabled": true, "preset": "0.33", "value": 0.33 },
    "scheduleDate": "2026-06-24T00:00:00.000Z",
    "scheduleTime": "10:00",
    "resultDate": "2026-06-25T00:00:00.000Z",
    "rankingEnabled": true,
    "examPatternId": "665d1b2c3d4e5f6789012347",
    "instructionsHtml": "<p>Instructions</p>",
    "attemptSettings": { "enabled": false, "attempts": 1, "restrictionType": "LIFETIME", "showRemainingAttempts": false },
    "shuffleQuestions": false,
    "shuffleOptions": false,
    "totalQuestions": 50,
    "languageStats": [
      {
        "language": "English",
        "questionCount": 50,
        "uploadFile": {
          "url": "https://res.cloudinary.com/.../sheet.xlsx",
          "publicId": "faculty-subject/prelims-tests/sheets/abc",
          "format": "xlsx",
          "bytes": 45678,
          "originalName": "questions_en.xlsx",
          "viewUrl": "https://res.cloudinary.com/.../view",
          "downloadUrl": "https://res.cloudinary.com/.../download"
        }
      }
    ],
    "publishStatus": "DRAFT",
    "folderName": "Topic 1 — Polity",
    "facultySubjectName": "Indian Polity — Prelims",
    "createdAt": "2026-06-20T10:00:00.000Z",
    "updatedAt": "2026-06-20T10:00:00.000Z",
    "examPattern": {
      "instructionId": "EP001",
      "instructionDescription": "Standard UPSC Prelims instructions"
    }
  }
}
```

`examPattern` is included only when `examPatternId` is set.

---

### List CBT Tests

| Property | Value |
|----------|-------|
| **Endpoint** | `POST /api/prelims-tests/list` |
| **Method** | `POST` |
| **Authentication** | Super Admin JWT |

#### Body / query params (all in JSON body)

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `facultySubjectId` | ObjectId | — | Filter by faculty subject |
| `folderId` | ObjectId | — | Filter by topic folder |
| `batchId` | ObjectId | — | Tests assigned to this batch |
| `language` | string | — | Tests containing this language |
| `publishStatus` | `DRAFT` \| `PUBLISHED` \| `UNPUBLISHED` | — | Status filter |
| `search` | string | `''` | Matches `testName` or `prelimsTestId` (case-insensitive) |
| `scheduleDateFrom` | ISO date | — | `scheduleDate >= from` |
| `scheduleDateTo` | ISO date | — | `scheduleDate <= to` |
| `page` | number | `1` | Min 1 |
| `limit` | number | `10` | 1–100 |
| `sortBy` | string | `createdAt` | `createdAt`, `testName`, `prelimsTestId`, `scheduleDate`, `resultDate`, `totalQuestions` |
| `sortOrder` | `asc` \| `desc` | `desc` | Sort direction |

#### Success response — `200`

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
      "prelimsTestId": "PTM042",
      "facultySubjectId": "665d1b2c3d4e5f6789012340",
      "folderId": "665d1b2c3d4e5f6789012341",
      "batchIds": ["665d1b2c3d4e5f6789012342"],
      "batches": [{ "_id": "665d1b2c3d4e5f6789012342", "batchId": "BAT001", "batchName": "IAS 2026 Morning" }],
      "assignedBatches": [{ "_id": "665d1b2c3d4e5f6789012342", "batchId": "BAT001", "batchName": "IAS 2026 Morning" }],
      "batchNamesLabel": "IAS 2026 Morning",
      "testName": "GS Paper I — Mock 1",
      "languages": ["English"],
      "durationPreset": "120",
      "durationMinutes": 120,
      "durationLabel": "2 hr",
      "totalMarks": 100,
      "marksPerCorrectAnswer": 2,
      "negativeMarking": { "enabled": false, "preset": "0.25", "value": 0 },
      "scheduleDate": "2026-06-24T00:00:00.000Z",
      "scheduleTime": "10:00",
      "resultDate": "2026-06-25T00:00:00.000Z",
      "rankingEnabled": false,
      "examPatternId": null,
      "instructionsHtml": "",
      "attemptSettings": { "enabled": false, "attempts": 1, "restrictionType": "LIFETIME", "showRemainingAttempts": false },
      "shuffleQuestions": false,
      "shuffleOptions": false,
      "totalQuestions": 50,
      "languageStats": [],
      "publishStatus": "DRAFT",
      "folderName": "Topic 1 — Polity",
      "facultySubjectName": "Indian Polity — Prelims",
      "createdAt": "2026-06-20T10:00:00.000Z",
      "updatedAt": "2026-06-20T10:00:00.000Z"
    }
  ]
}
```

---

### Publish CBT Test

| Property | Value |
|----------|-------|
| **Endpoint** | `PATCH /api/prelims-tests/:id/publish-status` |
| **Method** | `PATCH` |
| **Authentication** | Super Admin JWT |
| **Body** | `{ "publishStatus": "DRAFT" | "PUBLISHED" | "UNPUBLISHED" }` |

Publishing to `PUBLISHED` requires active questions for **every** configured language (`PRELIMS_TEST_NO_QUESTIONS` if missing).

#### Success response — `200`

```json
{
  "success": true,
  "message": "Publish status set to PUBLISHED",
  "data": { }
}
```

---

### Schedule CBT Test

**No dedicated schedule endpoint exists.**

Scheduling is done by setting these fields on **create** or **update**:

| Field | Description |
|-------|-------------|
| `scheduleDate` | Date the test is scheduled |
| `scheduleTime` | Time in `HH:mm` or `HH:mm:ss` |
| `resultDate` | When results become available (≥ `scheduleDate`) |

Frontend should expose a **Date Picker** + **Time Picker** bound to these fields and submit via `POST /api/prelims-tests` or `PUT /api/prelims-tests/:id`.

---

### Clone CBT Test

| Property | Value |
|----------|-------|
| **Endpoint** | `POST /api/prelims-tests/:id/duplicate` |
| **Method** | `POST` |
| **Authentication** | Super Admin JWT |
| **Body** | `{ "testName"?: "string" }` — defaults to `"Copy of {source.testName}"` |

Creates a new test as **DRAFT**, copies all questions; does **not** copy uploaded sheet files (`uploadFile: null`).

#### Success response — `201`

```json
{
  "success": true,
  "message": "Prelims test duplicated as draft",
  "data": { }
}
```

---

### Archive CBT Test

**Not implemented in the backend.**

| Alternative | Endpoint |
|-------------|----------|
| Soft delete | `DELETE /api/prelims-tests/:id` |
| Hide from students / CBT Management | `PATCH /api/prelims-tests/:id/publish-status` with `{ "publishStatus": "UNPUBLISHED" }` |

---

### Additional Prelims Test APIs (questions)

| Method | Endpoint | Purpose |
|--------|----------|---------|
| `POST` | `/api/prelims-tests/create-form` | Form metadata, enums, dependency flow |
| `POST` | `/api/prelims-tests/dashboard-summary` | Counts by publish status |
| `POST` | `/api/prelims-tests/questions/list` | Paginated question list |
| `POST` | `/api/prelims-tests/questions/view` | Single question |
| `POST` | `/api/prelims-tests/questions/upload` | Upload sheet (multipart) |
| `POST` | `/api/prelims-tests/questions/reupload` | Re-upload sheet (multipart) |
| `POST` | `/api/prelims-tests/questions/sheet/view` | Sheet metadata + questions |
| `DELETE` | `/api/prelims-tests/questions/sheet` | Remove sheet + all questions for language |
| `PUT` | `/api/prelims-tests/:id/questions/:questionId` | Update single question |
| `DELETE` | `/api/prelims-tests/:id/questions/:questionId` | Soft-delete question |

---

## Module B — CBT Management (`/api/cbt-management`)

**Mount:** `app.use('/api/cbt-management', cbtManagementRoutes)`  
**Auth:** `protect` + `checkPermission('TEST_MANAGEMENT', 'CBT_MANAGEMENT')`  
**All endpoints:** `POST` with JSON body

---

### CBT Dashboard

| Endpoint | `POST /api/cbt-management/dashboard` |
|----------|--------------------------------------|
| **Body** | `{ "progressLimit"?: number }` — 1–10, default `5` |

Returns evaluation progress for **PUBLISHED** tests only.

---

### List Faculty Subjects (CBT)

| Endpoint | `POST /api/cbt-management/list` |
|----------|--------------------------------|
| **Body** | `search?`, `page?`, `limit?`, `sortBy?` (`updatedAt` \| `subjectName` \| `lastUpdated`), `sortOrder?` |

---

### List Topics

| Endpoint | `POST /api/cbt-management/topics` |
|----------|-----------------------------------|
| **Body** | `facultySubjectId` **(required)**, `search?`, `page?`, `limit?` |

---

### List Tests Under Topic

| Endpoint | `POST /api/cbt-management/tests` |
|----------|----------------------------------|
| **Body** | `topicId` **(required)** — this is `SubjectContentFolder._id`, `search?`, `page?`, `limit?` |

Only **PUBLISHED** tests returned.

---

### Test Results

| Endpoint | `POST /api/cbt-management/results` |
|----------|-------------------------------------|
| **Body** | `testId` **(required)**, `search?`, `attemptStatus?`, `resultStatus?`, `page?`, `limit?` |

`attemptStatus`: `ALL` \| `NOT_STARTED` \| `IN_PROGRESS` \| `COMPLETED` \| `NOT_ATTEMPTED`  
`resultStatus`: `ALL` \| `PUBLISHED` \| `PENDING` \| `UNDER_REVIEW`

---

### Results Analytics

| Endpoint | `POST /api/cbt-management/results/analytics` |
|----------|-----------------------------------------------|
| **Body** | Same filters as results (no pagination) |

---

### Export Results

| Endpoint | Response type |
|----------|---------------|
| `POST /api/cbt-management/results/export-csv` | `text/csv` attachment |
| `POST /api/cbt-management/results/export-pdf` | `application/pdf` attachment |

**Body:** `{ "testId": "...", "filters": { "search?", "attemptStatus?", "resultStatus?" } }`

---

## 3. All Dropdown APIs

Load order is defined by the backend `dependencyFlow` in `POST /api/prelims-tests/create-form`:

```text
1. Faculty Subject  →  2. Folder (Topic)  →  3. Batches  →  4. Languages  →  5. Exam Pattern  →  6. Create
```

Call `POST /api/prelims-tests/create-form` first — it returns `defaults`, `enums`, `allowedUpload`, `dropdownApis`, and preloads `folders` / `batches` when `facultySubjectId` is sent.

---

### Faculty Subjects

| Property | Value |
|----------|-------|
| **Endpoint** | `GET` or `POST` `/api/faculty-subjects/dropdown` |
| **Auth** | Super Admin |
| **Body / query** | `{ "category": "PRELIMS_TEST", "search?", "status?", "page?", "limit?" }` |

**Response:**

```json
{
  "success": true,
  "count": 1,
  "total": 1,
  "page": 1,
  "limit": 100,
  "totalPages": 1,
  "data": [
    {
      "_id": "665d1b2c3d4e5f6789012340",
      "facultySubjectId": "FSU012",
      "subjectName": "Indian Polity — Prelims",
      "teacherName": "Dr. Rajesh Kumar"
    }
  ]
}
```

| UI label | Value sent to API |
|----------|-------------------|
| `subjectName` (+ optional `teacherName`) | `_id` → `facultySubjectId` |

---

### Topics (Folders)

| Property | Value |
|----------|-------|
| **Endpoint** | `GET /api/folders/` or `POST /api/folders/list` |
| **Auth** | Super Admin |
| **Body** | `{ "facultySubjectId": "...", "category": "PRELIMS_TEST", "search?", "status?" }` |

**Response item:**

```json
{
  "_id": "665d1b2c3d4e5f6789012341",
  "folderId": "FLD003",
  "facultySubjectId": "665d1b2c3d4e5f6789012340",
  "category": "PRELIMS_TEST",
  "folderName": "Topic 1 — Constitution",
  "description": "",
  "status": "ACTIVE",
  "createdAt": "...",
  "updatedAt": "..."
}
```

| UI label | Value sent to API |
|----------|-------------------|
| `folderName` | `_id` → `folderId` |

---

### Batches

| Property | Value |
|----------|-------|
| **Endpoint** | `POST /api/batches/dropdown` |
| **Auth** | Super Admin |
| **Body** | `{ "facultySubjectId": "...", "courseId?", "centerId?", "status?", "excludeBatchId?" }` |

**Response:**

```json
{
  "success": true,
  "data": [
    { "_id": "665d1b2c3d4e5f6789012342", "batchId": "BAT001", "batchName": "IAS 2026 Morning" }
  ]
}
```

| UI label | Value sent to API |
|----------|-------------------|
| `batchName` | `_id` → `batchIds[]` (multi-select) |

Default status filter: `ACTIVE` and `UPCOMING` batches linked to `facultySubjectId`.

---

### Languages

| Property | Value |
|----------|-------|
| **Endpoint** | `GET` or `POST` `/api/test-configuration/languages/dropdown` |
| **Auth** | Super Admin |

**Response:**

```json
{
  "success": true,
  "count": 3,
  "data": [
    { "_id": "665d1b2c3d4e5f6789012350", "languageId": "LANG001", "languageName": "English" },
    { "_id": "665d1b2c3d4e5f6789012351", "languageId": "LANG002", "languageName": "Hindi" }
  ]
}
```

| UI label | Value sent to API |
|----------|-------------------|
| `languageName` | `languageName` string in `languages[]` array (not `_id`) |

---

### Exam Patterns

| Property | Value |
|----------|-------|
| **Endpoint** | `GET` or `POST` `/api/test-configuration/exam-patterns/dropdown` |
| **Auth** | Super Admin |

**Response:**

```json
{
  "success": true,
  "count": 2,
  "data": [
    {
      "_id": "665d1b2c3d4e5f6789012347",
      "instructionId": "EP001",
      "instructionDescription": "Standard UPSC Prelims instructions"
    }
  ]
}
```

| UI label | Value sent to API |
|----------|-------------------|
| `instructionDescription` (or `instructionId`) | `_id` → `examPatternId` |

---

### Publish Status (enum — not a separate API)

From `create-form` response `enums.publishStatuses`:

`DRAFT` | `PUBLISHED` | `UNPUBLISHED`

---

### Duration Presets (enum — not a separate API)

From `enums.durationMinutesPresets`: `30`, `60`, `90`, `120`, `180`  
Send only `durationMinutes` — backend auto-sets `durationPreset` (`CUSTOM` for non-preset values).

---

### Negative Marking Presets (enum)

`0.25` | `0.50` | `1.00` | `CUSTOM` (requires positive `value`)

---

### Attempt Restriction Types (enum)

`LIFETIME` | `DAILY` | `WEEKLY`

---

### Duplicate / Reupload Modes (enum)

- Question upload `duplicateMode`: `SKIP` | `REPLACE` | `ALLOW`
- Reupload `reuploadMode`: `REPLACE_ALL` | `MERGE` | `REPLACE`

---

### APIs NOT wired to CBT test creation

| API | Reason |
|-----|--------|
| Question Bank (`/api/question-bank/*`) | Prelims tests use bulk XLSX/CSV upload, not question bank import |
| Mentors dropdown | Used by Mains Answer Writing only |
| Centers / Courses dropdowns | Optional indirect filters for batches via `centerId` / `courseId` on batch dropdown |
| Test Configuration Sections | Exists at `/api/test-configuration/sections/dropdown` but not in prelims dependency flow |

---

## 4. Request / Response Reference

### Create test — sample multipart request

```http
POST /api/prelims-tests
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
Content-Type: multipart/form-data; boundary=----FormBoundary

------FormBoundary
Content-Disposition: form-data; name="facultySubjectId"

665d1b2c3d4e5f6789012340
------FormBoundary
Content-Disposition: form-data; name="folderId"

665d1b2c3d4e5f6789012341
------FormBoundary
Content-Disposition: form-data; name="batchIds"

["665d1b2c3d4e5f6789012342"]
------FormBoundary
Content-Disposition: form-data; name="testName"

GS Paper I — Mock 1
------FormBoundary
Content-Disposition: form-data; name="languages"

["English","Hindi"]
------FormBoundary
Content-Disposition: form-data; name="scheduleDate"

2026-06-24
------FormBoundary
Content-Disposition: form-data; name="scheduleTime"

10:00
------FormBoundary
Content-Disposition: form-data; name="durationMinutes"

120
------FormBoundary
Content-Disposition: form-data; name="totalMarks"

100
------FormBoundary
Content-Disposition: form-data; name="marksPerCorrectAnswer"

2
------FormBoundary
Content-Disposition: form-data; name="resultDate"

2026-06-25
------FormBoundary
Content-Disposition: form-data; name="publishStatus"

DRAFT
------FormBoundary
Content-Disposition: form-data; name="negativeMarking"

{"enabled":false,"preset":"0.25","value":0}
------FormBoundary
Content-Disposition: form-data; name="questionFile"; filename="questions_en.xlsx"
Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet

<binary>
------FormBoundary
Content-Disposition: form-data; name="questionFile"; filename="questions_hi.xlsx"
Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet

<binary>
------FormBoundary--
```

### Validation error — prelims-tests (structured)

```json
{
  "success": false,
  "errorCode": "VALIDATION_REQUIRED_FIELDS",
  "message": "facultySubjectId is required; folderId is required",
  "reason": "One or more required fields are missing for this prelims test request.",
  "httpStatus": 400,
  "field": null,
  "details": {
    "missingFields": ["facultySubjectId", "folderId"]
  },
  "suggestions": [
    "Required on create: facultySubjectId, folderId, batchIds, testName, languages, scheduleDate, scheduleTime, durationMinutes, totalMarks, marksPerCorrectAnswer, resultDate"
  ]
}
```

### Question sheet validation error

```json
{
  "success": false,
  "message": "Question sheet validation failed",
  "valid": false,
  "errors": [
    { "row": 3, "message": "correctAnswer must be 1-4 or A-D" }
  ],
  "stats": { "totalRows": 50, "validRows": 0, "skippedRows": 0 }
}
```

### Unauthorized — `401`

```json
{
  "success": false,
  "statusCode": 40101,
  "message": "Not authorized, no token",
  "data": null,
  "error": null
}
```

### Forbidden — Super Admin only — `403`

```json
{
  "success": false,
  "message": "Access denied. Super Admin only."
}
```

### Permission denied — CBT Management — `403`

```json
{
  "success": false,
  "message": "Permission denied",
  "moduleKey": "TEST_MANAGEMENT",
  "featureKey": "CBT_MANAGEMENT"
}
```

### Not found — `404`

```json
{
  "success": false,
  "errorCode": "PRELIMS_TEST_NOT_FOUND",
  "message": "Prelims test not found",
  "reason": "Prelims test not found",
  "httpStatus": 404
}
```

### CBT Management validation — `400`

```json
{
  "success": false,
  "message": "facultySubjectId is required"
}
```

### HTTP 402

**Not used** by any CBT or prelims-test endpoint in this backend. Do not expect `402 Payment Required`.

---

## 5. React Service Layer

Recommended structure:

```text
src/
  services/
    api.ts
    cbtTestService.ts
  types/
    cbtTest.types.ts
```

### `src/services/api.ts`

```typescript
import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ message?: string; errorCode?: string }>) => {
    const message =
      error.response?.data?.message ||
      error.message ||
      'An unexpected error occurred';
    return Promise.reject({ ...error, friendlyMessage: message });
  }
);

export default api;
```

### `src/services/cbtTestService.ts`

```typescript
import api from './api';

const BASE = '/api/prelims-tests';
const CBT_MGMT = '/api/cbt-management';

export interface PrelimsTestListFilters {
  facultySubjectId?: string;
  folderId?: string;
  batchId?: string;
  language?: string;
  publishStatus?: 'DRAFT' | 'PUBLISHED' | 'UNPUBLISHED';
  search?: string;
  scheduleDateFrom?: string;
  scheduleDateTo?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export const cbtTestService = {
  // --- Form bootstrap ---
  getCreateForm: (body?: { facultySubjectId?: string; folderId?: string }) =>
    api.post(`${BASE}/create-form`, body ?? {}).then((r) => r.data),

  getDashboardSummary: (body?: { facultySubjectId?: string; folderId?: string }) =>
    api.post(`${BASE}/dashboard-summary`, body ?? {}).then((r) => r.data),

  // --- CRUD ---
  createTest: (formData: FormData) =>
    api.post(BASE, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then((r) => r.data),

  updateTest: (id: string, payload: Record<string, unknown>) =>
    api.put(`${BASE}/${id}`, payload).then((r) => r.data),

  deleteTest: (id: string) =>
    api.delete(`${BASE}/${id}`).then((r) => r.data),

  getTestById: (id: string) =>
    api.post(`${BASE}/view`, { id }).then((r) => r.data),

  getTests: (filters: PrelimsTestListFilters = {}) =>
    api.post(`${BASE}/list`, filters).then((r) => r.data),

  publishTest: (id: string, publishStatus: 'DRAFT' | 'PUBLISHED' | 'UNPUBLISHED') =>
    api.patch(`${BASE}/${id}/publish-status`, { publishStatus }).then((r) => r.data),

  /** Scheduling is part of create/update — no separate schedule API */
  scheduleTest: (id: string, schedule: { scheduleDate: string; scheduleTime: string; resultDate: string }) =>
    api.put(`${BASE}/${id}`, schedule).then((r) => r.data),

  duplicateTest: (id: string, testName?: string) =>
    api.post(`${BASE}/${id}/duplicate`, testName ? { testName } : {}).then((r) => r.data),

  // --- Questions ---
  uploadQuestions: (formData: FormData) =>
    api.post(`${BASE}/questions/upload`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then((r) => r.data),

  reuploadQuestions: (formData: FormData) =>
    api.post(`${BASE}/questions/reupload`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then((r) => r.data),

  listQuestions: (body: { prelimsTestId: string; language?: string; search?: string; page?: number; limit?: number }) =>
    api.post(`${BASE}/questions/list`, body).then((r) => r.data),

  // --- CBT Management (reporting) ---
  getCbtDashboard: (progressLimit = 5) =>
    api.post(`${CBT_MGMT}/dashboard`, { progressLimit }).then((r) => r.data),

  listCbtFacultySubjects: (body: Record<string, unknown> = {}) =>
    api.post(`${CBT_MGMT}/list`, body).then((r) => r.data),

  listCbtTopics: (facultySubjectId: string, params: Record<string, unknown> = {}) =>
    api.post(`${CBT_MGMT}/topics`, { facultySubjectId, ...params }).then((r) => r.data),

  listCbtTests: (topicId: string, params: Record<string, unknown> = {}) =>
    api.post(`${CBT_MGMT}/tests`, { topicId, ...params }).then((r) => r.data),

  getCbtResults: (testId: string, params: Record<string, unknown> = {}) =>
    api.post(`${CBT_MGMT}/results`, { testId, ...params }).then((r) => r.data),

  getCbtResultsAnalytics: (testId: string, params: Record<string, unknown> = {}) =>
    api.post(`${CBT_MGMT}/results/analytics`, { testId, ...params }).then((r) => r.data),

  exportCbtResultsCsv: (testId: string, filters: Record<string, unknown> = {}) =>
    api.post(`${CBT_MGMT}/results/export-csv`, { testId, filters }, { responseType: 'blob' }),

  exportCbtResultsPdf: (testId: string, filters: Record<string, unknown> = {}) =>
    api.post(`${CBT_MGMT}/results/export-pdf`, { testId, filters }, { responseType: 'blob' }),
};

export default cbtTestService;
```

### Dropdown service helpers

```typescript
// src/services/cbtDropdownService.ts
import api from './api';

export const cbtDropdownService = {
  facultySubjects: (search = '') =>
    api.post('/api/faculty-subjects/dropdown', { category: 'PRELIMS_TEST', search }).then((r) => r.data),

  folders: (facultySubjectId: string, search = '') =>
    api.post('/api/folders/list', { facultySubjectId, category: 'PRELIMS_TEST', search }).then((r) => r.data),

  batches: (facultySubjectId: string) =>
    api.post('/api/batches/dropdown', { facultySubjectId }).then((r) => r.data),

  languages: () =>
    api.post('/api/test-configuration/languages/dropdown', {}).then((r) => r.data),

  examPatterns: () =>
    api.post('/api/test-configuration/exam-patterns/dropdown', {}).then((r) => r.data),
};
```

---

## 6. TanStack Query Integration

### Query keys

```typescript
export const cbtTestKeys = {
  all: ['cbt-tests'] as const,
  lists: () => [...cbtTestKeys.all, 'list'] as const,
  list: (filters: Record<string, unknown>) => [...cbtTestKeys.lists(), filters] as const,
  details: () => [...cbtTestKeys.all, 'detail'] as const,
  detail: (id: string) => [...cbtTestKeys.details(), id] as const,
  createForm: (facultySubjectId?: string) => [...cbtTestKeys.all, 'create-form', facultySubjectId] as const,
  dashboardSummary: (filters: Record<string, unknown>) => [...cbtTestKeys.all, 'dashboard-summary', filters] as const,
};
```

### `src/hooks/useCBTTests.ts`

```typescript
import { useQuery } from '@tanstack/react-query';
import { cbtTestService, PrelimsTestListFilters } from '../services/cbtTestService';
import { cbtTestKeys } from './cbtTestKeys';

export function useCBTTests(filters: PrelimsTestListFilters = {}) {
  return useQuery({
    queryKey: cbtTestKeys.list(filters),
    queryFn: () => cbtTestService.getTests(filters),
    placeholderData: (prev) => prev,
  });
}
```

### `src/hooks/useCBTTest.ts`

```typescript
import { useQuery } from '@tanstack/react-query';
import { cbtTestService } from '../services/cbtTestService';
import { cbtTestKeys } from './cbtTestKeys';

export function useCBTTest(id: string | undefined) {
  return useQuery({
    queryKey: cbtTestKeys.detail(id ?? ''),
    queryFn: () => cbtTestService.getTestById(id!),
    enabled: Boolean(id),
  });
}
```

### `src/hooks/useCreateCBTTest.ts`

```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { cbtTestService } from '../services/cbtTestService';
import { cbtTestKeys } from './cbtTestKeys';

export function useCreateCBTTest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (formData: FormData) => cbtTestService.createTest(formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cbtTestKeys.lists() });
      queryClient.invalidateQueries({ queryKey: cbtTestKeys.all });
    },
  });
}
```

### `src/hooks/useUpdateCBTTest.ts`

```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { cbtTestService } from '../services/cbtTestService';
import { cbtTestKeys } from './cbtTestKeys';

export function useUpdateCBTTest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Record<string, unknown> }) =>
      cbtTestService.updateTest(id, payload),
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({ queryKey: cbtTestKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: cbtTestKeys.lists() });
    },
  });
}
```

### `src/hooks/useDeleteCBTTest.ts`

```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { cbtTestService } from '../services/cbtTestService';
import { cbtTestKeys } from './cbtTestKeys';

export function useDeleteCBTTest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => cbtTestService.deleteTest(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cbtTestKeys.lists() });
    },
  });
}
```

### Publish mutation (recommended separate hook)

```typescript
export function usePublishCBTTest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, publishStatus }: { id: string; publishStatus: 'DRAFT' | 'PUBLISHED' | 'UNPUBLISHED' }) =>
      cbtTestService.publishTest(id, publishStatus),
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({ queryKey: cbtTestKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: cbtTestKeys.lists() });
    },
  });
}
```

---

## 7. Form Integration Guide

### Dependency-driven form sections

| Section | Fields | Load trigger |
|---------|--------|--------------|
| Context | Faculty Subject, Topic | On page load / step 1 |
| Assignment | Batches | After faculty subject selected |
| Test details | Name, languages, duration, marks | Independent |
| Schedule | scheduleDate, scheduleTime, resultDate | Independent |
| Settings | negative marking, attempts, shuffle, ranking | Independent |
| Instructions | examPatternId, instructionsHtml | Independent |
| Questions | questionFile per language | On submit (create) or separate upload step |

### Field mapping

| Field Name | Type | Required | Validation | API field | Example | Dropdown source | Component |
|------------|------|----------|------------|-----------|---------|-----------------|-----------|
| `facultySubjectId` | ObjectId | Yes | Active + `PRELIMS_TEST` category | `facultySubjectId` | `665d1b2c…` | Faculty subjects dropdown | Select |
| `folderId` | ObjectId | Yes | Active folder for subject + category | `folderId` | `665d1b2c…` | Folders list | Select |
| `batchIds` | ObjectId[] | Yes | Min 1; linked to faculty subject | `batchIds` | `["665d…"]` | Batches dropdown | Multi Select |
| `testName` | string | Yes | Non-empty trim | `testName` | `GS Mock 1` | — | Text Input |
| `languages` | string[] | Yes | Min 1; active config languages | `languages` | `["English","Hindi"]` | Languages dropdown | Multi Select |
| `scheduleDate` | date | Yes | Valid ISO date | `scheduleDate` | `2026-06-24` | — | Date Picker |
| `scheduleTime` | time | Yes | `HH:mm` or `HH:mm:ss` | `scheduleTime` | `10:00` | — | Time Picker |
| `resultDate` | date | Yes | ≥ `scheduleDate` | `resultDate` | `2026-06-25` | — | Date Picker |
| `durationMinutes` | number | Yes | ≥ 1 | `durationMinutes` | `120` | Preset chips 30/60/90/120/180 + custom | Select / Number Input |
| `totalMarks` | number | Yes | ≥ 1 | `totalMarks` | `100` | — | Number Input |
| `marksPerCorrectAnswer` | number | Yes | ≥ 0 | `marksPerCorrectAnswer` | `2` | — | Number Input |
| `negativeMarking.enabled` | boolean | No | — | `negativeMarking.enabled` | `true` | — | Switch |
| `negativeMarking.preset` | enum | If enabled | `0.25`/`0.50`/`1.00`/`CUSTOM` | `negativeMarking.preset` | `0.33` | Enum from create-form | Select |
| `negativeMarking.value` | number | If CUSTOM | > 0 | `negativeMarking.value` | `0.33` | — | Number Input |
| `attemptSettings.enabled` | boolean | No | — | `attemptSettings.enabled` | `true` | — | Switch |
| `attemptSettings.attempts` | number | If enabled | ≥ 1 | `attemptSettings.attempts` | `2` | — | Number Input |
| `attemptSettings.restrictionType` | enum | If enabled | `LIFETIME`/`DAILY`/`WEEKLY` | `attemptSettings.restrictionType` | `LIFETIME` | Enum from create-form | Select |
| `attemptSettings.showRemainingAttempts` | boolean | No | — | `attemptSettings.showRemainingAttempts` | `true` | — | Checkbox |
| `rankingEnabled` | boolean | No | — | `rankingEnabled` | `true` | — | Switch |
| `shuffleQuestions` | boolean | No | — | `shuffleQuestions` | `false` | — | Switch |
| `shuffleOptions` | boolean | No | — | `shuffleOptions` | `false` | — | Switch |
| `examPatternId` | ObjectId | No | Active pattern if set | `examPatternId` | `665d1b2c…` | Exam patterns dropdown | Select |
| `instructionsHtml` | HTML string | No | — | `instructionsHtml` | `<p>…</p>` | — | Rich Text |
| `publishStatus` | enum | No | `DRAFT`/`PUBLISHED`/`UNPUBLISHED` | `publishStatus` | `DRAFT` | Enum | Select / Radio |
| `duplicateMode` | enum | No (create upload) | `SKIP`/`REPLACE`/`ALLOW` | `duplicateMode` | `SKIP` | Enum | Select |
| `questionFile` | file | Yes on create | XLSX/CSV ≤ 10 MB per language | `questionFile` | `.xlsx` | — | File Upload (per language) |

### Building `FormData` for create

```typescript
function buildCreateFormData(values: CreateCBTTestFormValues, files: Record<string, File>) {
  const fd = new FormData();
  fd.append('facultySubjectId', values.facultySubjectId);
  fd.append('folderId', values.folderId);
  fd.append('batchIds', JSON.stringify(values.batchIds));
  fd.append('testName', values.testName);
  fd.append('languages', JSON.stringify(values.languages));
  fd.append('scheduleDate', values.scheduleDate);
  fd.append('scheduleTime', values.scheduleTime);
  fd.append('resultDate', values.resultDate);
  fd.append('durationMinutes', String(values.durationMinutes));
  fd.append('totalMarks', String(values.totalMarks));
  fd.append('marksPerCorrectAnswer', String(values.marksPerCorrectAnswer));
  fd.append('publishStatus', values.publishStatus ?? 'DRAFT');
  fd.append('negativeMarking', JSON.stringify(values.negativeMarking));
  fd.append('attemptSettings', JSON.stringify(values.attemptSettings));
  if (values.examPatternId) fd.append('examPatternId', values.examPatternId);
  if (values.instructionsHtml) fd.append('instructionsHtml', values.instructionsHtml);
  fd.append('rankingEnabled', String(values.rankingEnabled ?? false));
  fd.append('shuffleQuestions', String(values.shuffleQuestions ?? false));
  fd.append('shuffleOptions', String(values.shuffleOptions ?? false));

  values.languages.forEach((lang) => {
    const file = files[lang];
    if (file) fd.append('questionFile', file);
  });

  return fd;
}
```

---

## 8. Table Integration Guide

### Prelims test listing table (`POST /api/prelims-tests/list`)

| Column | Source field | Notes |
|--------|--------------|-------|
| Test ID | `prelimsTestId` | e.g. `PTM042` |
| Test Name | `testName` | Sortable |
| Topic | `folderName` | From join |
| Faculty Subject | `facultySubjectName` | From join |
| Batches | `batchNamesLabel` | Or expand `assignedBatches` |
| Languages | `languages` | Badge list |
| Questions | `totalQuestions` | Sortable |
| Duration | `durationLabel` | From `durationMinutes` |
| Schedule | `scheduleDate` + `scheduleTime` | Sortable by `scheduleDate` |
| Result Date | `resultDate` | Sortable |
| Status | `publishStatus` | `DRAFT` / `PUBLISHED` / `UNPUBLISHED` |
| Updated | `updatedAt` | Sortable via `sortBy: createdAt` default |

### Filters (send in POST body)

| Filter UI | API param |
|-----------|-----------|
| Faculty Subject | `facultySubjectId` |
| Topic | `folderId` |
| Batch | `batchId` |
| Language | `language` |
| Status | `publishStatus` |
| Search box | `search` |
| Schedule from / to | `scheduleDateFrom`, `scheduleDateTo` |

### Pagination

```typescript
const { data } = useCBTTests({ page, limit: 10, sortBy: 'scheduleDate', sortOrder: 'desc' });
// data.total, data.totalPages, data.page, data.count
```

### Row actions

| Action | API |
|--------|-----|
| View | `POST /view` |
| Edit | Navigate to edit form → `PUT /:id` |
| Publish / Unpublish | `PATCH /:id/publish-status` |
| Duplicate | `POST /:id/duplicate` |
| Delete | `DELETE /:id` |
| Manage questions | Question list / upload screens |

### Status rendering

```tsx
const statusColor: Record<string, string> = {
  DRAFT: 'gray',
  PUBLISHED: 'green',
  UNPUBLISHED: 'orange',
};

function PublishStatusBadge({ status }: { status: string }) {
  return <span className={`badge badge-${statusColor[status]}`}>{status}</span>;
}
```

### Bulk actions

No bulk API exists in the backend. Implement bulk actions as **sequential mutations** (e.g. loop `deleteTest`) with per-row error handling, or disable bulk until backend support is added.

### Selection logic

```typescript
const [selectedIds, setSelectedIds] = useState<string[]>([]);
// Use row._id (Mongo ObjectId) for all mutations — not prelimsTestId string
```

### CBT Management results table

| Column | Source |
|--------|--------|
| Student Name | `studentName` |
| Roll Number | `rollNumber` |
| Attempt Status | `attemptStatus` |
| Score | `score` |
| Accuracy | `accuracy` |
| Rank | `rank` |
| Time Taken | `timeTaken` |
| Result Status | `resultStatus` |

Filters: `attemptStatus`, `resultStatus`, `search` (student name / roll number).

---

## 9. Complete Data Flow

```mermaid
flowchart TD
  A[User opens CBT Test page] --> B[POST /prelims-tests/create-form]
  B --> C[Load dropdown APIs in dependency order]
  C --> D[User fills form + uploads sheets]
  D --> E[Frontend validation]
  E --> F{Valid?}
  F -->|No| G[Show field / sheet errors]
  F -->|Yes| H[POST /prelims-tests multipart]
  H --> I{Backend response}
  I -->|201| J[Toast success]
  I -->|400| K[Show errorCode + suggestions]
  J --> L[invalidateQueries list + detail]
  L --> M[Table refresh shows new row]
  M --> N[Optional: POST /view to confirm persistence]
```

### Step-by-step

1. **Page load** — `useQuery` → `POST /api/prelims-tests/create-form` for enums and defaults.
2. **Dropdown cascade** — Faculty Subject → Folders → Batches → Languages → Exam Patterns.
3. **User fills form** — client-side validation mirrors backend rules (§7).
4. **Submit** — build `FormData`, `POST /api/prelims-tests`.
5. **Backend** — validates payload, parses sheets, creates `SubjectPrelimsTest` + `SubjectPrelimsTestQuestion` rows, uploads sheets to Cloudinary.
6. **Success** — `201` with `data._id`, `data.prelimsTestId`, `languageUploads`.
7. **Toast** — show `message` from response.
8. **Cache invalidation** — `invalidateQueries` on list keys.
9. **Table refresh** — re-fetch list; new test appears with correct `totalQuestions` and `publishStatus`.
10. **Persistence check** — `POST /view` with returned `_id` (see §14).

---

## 10. Error Handling Guide

### Error categories

| HTTP | When | Frontend action |
|------|------|-----------------|
| **400** | Validation, sheet parse, missing files | Map `errorCode` / `field` to form inputs; show `suggestions[]` |
| **401** | Missing / invalid JWT | Redirect to login; clear `authToken` |
| **402** | **Not used** | — |
| **403** | Super Admin only / permission denied | Show access denied UI; hide actions |
| **404** | Test / question / sheet not found | Toast + redirect to list |
| **409** | Not used for CBT CRUD | — |
| **500** | Server error | Generic toast; log `error` field |

### Structured prelims error handler

```typescript
interface CmsApiError {
  success: false;
  errorCode?: string;
  message: string;
  reason?: string;
  field?: string;
  details?: Record<string, unknown>;
  suggestions?: string[];
  httpStatus?: number;
}

function handleCbtApiError(err: { response?: { data?: CmsApiError } }) {
  const data = err.response?.data;
  if (!data) return 'Network error — please try again';

  if (data.suggestions?.length) {
    return `${data.message}\n${data.suggestions.join('\n')}`;
  }
  return data.message;
}
```

### Sheet row errors

When `valid: false` and `errors: [{ row, message }]`, render a table of row-level issues so admins can fix the Excel file.

### Network failures

```typescript
if (!error.response) {
  toast.error('Unable to reach server. Check your connection.');
}
```

### Known `errorCode` values (prelims-tests)

`VALIDATION_REQUIRED_FIELDS`, `FACULTY_SUBJECT_NOT_ACTIVE`, `FACULTY_SUBJECT_CATEGORY_DISABLED`, `FOLDER_INVALID_FOR_PRELIMS_TEST`, `BATCH_IDS_REQUIRED`, `INVALID_LANGUAGE`, `INVALID_SCHEDULE_TIME`, `INVALID_RESULT_DATE`, `INVALID_TOTAL_MARKS`, `INVALID_MARKS_PER_CORRECT`, `INVALID_NEGATIVE_MARKING_PRESET`, `CUSTOM_NEGATIVE_MARKING_REQUIRED`, `INVALID_ATTEMPT_COUNT`, `INVALID_ATTEMPT_RESTRICTION_TYPE`, `INVALID_EXAM_PATTERN_ID`, `EXAM_PATTERN_NOT_FOUND`, `INVALID_PUBLISH_STATUS`, `QUESTION_FILE_REQUIRED`, `QUESTION_FILES_REQUIRED`, `QUESTION_FILE_INVALID`, `INVALID_DUPLICATE_MODE`, `INVALID_REUPLOAD_MODE`, `PRELIMS_TEST_ID_REQUIRED`, `PRELIMS_TEST_NOT_FOUND`, `PRELIMS_TEST_NO_QUESTIONS`, `LANGUAGE_REQUIRED`, `LANGUAGE_NOT_IN_TEST`, `DUPLICATE_QUESTION_NO`, `PRELIMS_TEST_QUESTION_NOT_FOUND`, `QUESTION_SHEET_NOT_FOUND`

---

## 11. File Upload Integration

### Supported uploads

| Operation | Endpoint | Field | Types | Max size |
|-----------|----------|-------|-------|----------|
| Create test | `POST /api/prelims-tests` | `questionFile` (×N) or `questionFile_<Language>` | `.xlsx`, `.xls`, `.csv` | 10 MB / file, max 15 files |
| Upload questions | `POST /api/prelims-tests/questions/upload` | `questionFile` | `.xlsx`, `.csv` | 10 MB |
| Reupload | `POST /api/prelims-tests/questions/reupload` | `questionFile` | `.xlsx`, `.csv` | 10 MB |

**Not supported:** PDF question import, image uploads, Excel import via Question Bank.

### Required sheet columns

| Column | Required | Notes |
|--------|----------|-------|
| `language` | Yes | Must match test language |
| `questionNo` | Yes | Positive integer; unique per language |
| `questionText` | Yes | |
| `option1`–`option4` | Yes | |
| `correctAnswer` | Yes | `1`–`4` or `A`–`D` |
| `explanation` | Yes | Can be empty string |

Header aliases accepted (case/spacing insensitive): `questionnumber` → `questionNo`, etc.

### Upload questions after create

```typescript
const fd = new FormData();
fd.append('prelimsTestId', testMongoId);
fd.append('language', 'English');
fd.append('duplicateMode', 'SKIP');
fd.append('questionFile', file);
await cbtTestService.uploadQuestions(fd);
```

### Reupload

```typescript
fd.append('reuploadMode', 'MERGE'); // REPLACE_ALL | MERGE | REPLACE
await cbtTestService.reuploadQuestions(fd);
```

### Stored file metadata (`languageStats[].uploadFile`)

```json
{
  "url": "https://res.cloudinary.com/.../sheet.xlsx",
  "publicId": "faculty-subject/prelims-tests/sheets/abc",
  "format": "xlsx",
  "bytes": 45678,
  "originalName": "questions_en.xlsx",
  "viewUrl": "https://...",
  "downloadUrl": "https://..."
}
```

Cloudinary folder: `faculty-subject/prelims-tests/sheets`

---

## 12. Authorization & Permissions

### Prelims Test CRUD (`/api/prelims-tests/*`)

| Action | Who can perform |
|--------|-----------------|
| Create | Super Admin |
| Edit (update metadata) | Super Admin |
| Delete | Super Admin |
| Publish / Unpublish | Super Admin |
| Schedule (via create/update) | Super Admin |
| View / List | Super Admin |
| Upload / manage questions | Super Admin |
| Duplicate (clone) | Super Admin |

Middleware: `protect` + `requireSuperAdmin`  
403 message: `"Access denied. Super Admin only."`

### CBT Management (`/api/cbt-management/*`)

| Action | Who can perform |
|--------|-----------------|
| View dashboard | `TEST_MANAGEMENT` → `CBT_MANAGEMENT` (or Super Admin bypass) |
| List subjects / topics / tests | Same |
| View results / analytics | Same |
| Export CSV / PDF | Same |
| Create / Edit / Delete tests | **Not available** on this module — use prelims-tests |

Permission feature key in `config/permissionModules.js`: module `TEST_MANAGEMENT`, feature `CBT Management` (normalized to `CBT_MANAGEMENT` in middleware).

Super Admin bypasses `checkPermission` entirely.

---

## 13. Frontend Implementation Checklist

### Service & data layer

- [ ] Create `src/services/api.ts` with token injection and error interceptor
- [ ] Create `src/services/cbtTestService.ts` with all prelims + CBT management methods
- [ ] Create `src/services/cbtDropdownService.ts`
- [ ] Configure `VITE_API_BASE_URL`

### Hooks (TanStack Query)

- [ ] `useCBTTests` — list with filters / pagination
- [ ] `useCBTTest` — get by Mongo `_id`
- [ ] `useCreateCBTTest` — multipart create + invalidate list
- [ ] `useUpdateCBTTest` — JSON update + invalidate detail/list
- [ ] `useDeleteCBTTest` — soft delete + invalidate list
- [ ] `usePublishCBTTest` — publish status mutation
- [ ] `useDuplicateCBTTest` — clone mutation
- [ ] `useCBTCreateForm` — bootstrap enums and defaults

### UI pages

- [ ] CBT test listing page with filters, search, pagination, sorting
- [ ] Create form with dependency-driven dropdowns
- [ ] Edit form (metadata only — separate question management)
- [ ] Question upload / reupload UI per language
- [ ] CBT Management dashboard (results module)
- [ ] Results table + analytics + export buttons

### API wiring

- [ ] Implement create API (`multipart/form-data`)
- [ ] Implement update API (`application/json`)
- [ ] Implement delete API
- [ ] Implement publish API (`PATCH publish-status`)
- [ ] Implement schedule via update (`scheduleDate`, `scheduleTime`, `resultDate`)
- [ ] Implement duplicate API
- [ ] Connect all dropdown APIs in correct order
- [ ] Wire question upload / reupload endpoints

### Quality

- [ ] Handle structured `errorCode` responses
- [ ] Handle sheet row validation errors
- [ ] Handle 401 / 403 with route guards
- [ ] Verify persistence after create (§14)
- [ ] No hardcoded API URLs

---

## 14. Database Persistence Verification

After any create or update, verify data round-trips through the API (frontend cannot query MongoDB directly).

### 1. Response validation (immediate)

On `201` create or `200` update:

```typescript
const { data } = response;
console.assert(data._id, 'Mongo _id must be present');
console.assert(data.prelimsTestId?.startsWith('PTM'), 'prelimsTestId must be generated');
console.assert(data.testName === submittedTestName, 'testName must match');
console.assert(data.totalQuestions > 0 || publishStatus === 'DRAFT', 'questions counted');
```

### 2. Get By ID validation

```typescript
const view = await cbtTestService.getTestById(data._id);
expect(view.data._id).toBe(data._id);
expect(view.data.testName).toBe(submittedTestName);
expect(view.data.batchIds).toEqual(expect.arrayContaining(submittedBatchIds));
```

### 3. Listing validation

```typescript
const list = await cbtTestService.getTests({ search: data.prelimsTestId });
expect(list.data.some((row) => row._id === data._id)).toBe(true);
```

### 4. Refresh validation

1. Create test → note `_id`
2. `invalidateQueries` → list re-fetches
3. Row appears with correct `publishStatus`, `totalQuestions`, `languageStats`

### 5. Publish persistence

1. Upload questions for all languages
2. `PATCH publish-status` → `PUBLISHED`
3. `POST /view` → `publishStatus === 'PUBLISHED'`
4. Test appears in `POST /api/cbt-management/tests` for the topic (CBT Management only shows published tests)

### 6. Delete persistence

1. `DELETE /:id` → `{ success: true }`
2. `POST /view` → `404 PRELIMS_TEST_NOT_FOUND`
3. List no longer includes the `_id`

---

## 15. Final Frontend Integration Rules

Frontend must:

- ✔ Use centralized services (`api.ts`, `cbtTestService.ts`) — no raw `fetch` scattered in components
- ✔ Use TanStack Query for all server state (`useQuery`, `useMutation`, `invalidateQueries`)
- ✔ Use `VITE_API_BASE_URL` — never hardcode backend host
- ✔ Use reusable hooks per operation
- ✔ Use common error handling for `errorCode`, sheet errors, and HTTP status
- ✔ Preserve backend contracts — field names, enums, multipart field names exactly as documented
- ✔ Preserve existing functionality — scheduling via metadata fields; no invented schedule/archive APIs
- ✔ Ensure successful database persistence — verify via `view` + `list` after mutations
- ✔ Use Mongo `_id` for all mutations and view calls (not `PTM…` display id in API paths)
- ✔ Follow enterprise architecture — service layer → hooks → presentational components
- ✔ Load `POST /api/prelims-tests/create-form` as the bootstrap source for enums and upload rules
- ✔ Send list/filter params in **POST body**, not query string (backend convention)
- ✔ Use `multipart/form-data` only for create and question upload endpoints
- ✔ Require question sheets for every selected language on create
- ✔ Gate prelims CRUD UI to Super Admin; gate CBT Management UI to `CBT_MANAGEMENT` permission

---

## Backend source reference

| Area | Path |
|------|------|
| Prelims routes | `routes/subjectPrelimsTestRoutes.js` |
| Prelims controller | `controllers/subjectPrelimsTestController.js` |
| Validation | `utils/facultyContentHelpers.js` → `validatePrelimsTestPayload` |
| List helpers | `utils/prelimsTestListHelpers.js` |
| Sheet parser | `utils/prelimsTestBulkParser.js` |
| CBT Management routes | `routes/cbtManagementRoutes.js` |
| CBT Management validation | `validations/cbtManagementValidation.js` |
| Model | `models/SubjectPrelimsTest.js` |
| Permissions | `config/permissionModules.js`, `middleware/cbtManagementAuth.js` |
| App mount | `app.js` lines 276, 282 |

---

*Generated from backend code analysis. All endpoints, payloads, and responses reflect the current `sriram-ias-backend` implementation.*
