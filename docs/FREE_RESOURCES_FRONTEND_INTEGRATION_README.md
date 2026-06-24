# Free Resources — Frontend Integration Guide

**Single source of truth** for integrating the Free Resources module with a React + Vite frontend. Every endpoint, payload, enum, and validation rule documented here is derived directly from the backend implementation.

---

## Table of Contents

1. [Module Overview](#module-overview)
2. [Architecture: Two API Surfaces](#architecture-two-api-surfaces)
3. [API Base URL & Environment](#api-base-url--environment)
4. [Routes Inventory](#routes-inventory)
5. [Resource Categories & Types](#resource-categories--types)
6. [Authentication & Authorization](#authentication--authorization)
7. [Data Models](#data-models)
8. [Admin CMS APIs](#admin-cms-apis)
9. [Dropdown APIs](#dropdown-apis)
10. [File Uploads](#file-uploads)
11. [Search & Filters](#search--filters)
12. [Status Management](#status-management)
13. [Error Responses](#error-responses)
14. [Portal (Student-Facing) APIs](#portal-student-facing-apis)
15. [Frontend Service Layer](#frontend-service-layer)
16. [React Query Integration](#react-query-integration)
17. [Form Field Mapping](#form-field-mapping)
18. [Table Integration Guide](#table-integration-guide)
19. [Server Persistence Validation](#server-persistence-validation)
20. [Frontend Implementation Checklist](#frontend-implementation-checklist)

---

## Module Overview

### Purpose

The Free Resources module lets CMS administrators create, manage, and publish free educational content across four categories:

| Category | Stored As | Has File Upload | Has Questions |
|----------|-----------|-----------------|---------------|
| NCERT Books | `NCERT_BOOKS` | PDF | No |
| Previous Year Questions | `PREVIOUS_YEAR_QUESTIONS` | PDF | No |
| Free Mock Tests | `FREE_MOCK_TEST` | Bulk XLSX/CSV (optional) | Yes (`free_mock_test_questions`) |
| Study Material | `STUDY_MATERIAL` | PDF/DOC/DOCX/PPT/PPTX | No |

Students consume published content through the **portal API**, which reads from a separate legacy data layer (`resources`, `mocktests`, `resourcecategories`).

### Entity Relationships (Admin CMS)

```
User (createdBy / updatedBy)
  └── FreeResource (collection: free_resources)
        └── FreeMockTestQuestion[] (collection: free_mock_test_questions)
              mockTestId → FreeResource._id (only when resourceCategory = FREE_MOCK_TEST)

Subject (master) ──► NCERT subject dropdown (status: ACTIVE, not deleted)
Cloudinary folder: free-resources ──► fileUrl, previewUrl, downloadUrl on FreeResource
```

### Backend Architecture Flow

```
Route (freeResourceRoutes.js)
  → cmsAdminAuth [protect → allowCmsAdmin]
  → Upload middleware (multer, if multipart)
  → Joi validation (freeResourceValidation.js)
  → Controller (freeResourceController.js)
  → Service (freeResourceService.js)
  → Model (FreeResource / FreeMockTestQuestion)
  → MongoDB + Cloudinary
```

Mounted in `app.js`:

- Admin CMS: `app.use('/api/free-resources', freeResourceRoutes)`
- Portal: `app.use('/api/portal/free-resources', portalFreeResourceRoutes)`

### Resource Lifecycle

1. **Create** — Admin submits form (multipart for file-based categories). Record saved to `free_resources`. File uploaded to Cloudinary folder `free-resources`. Mock test questions saved to `free_mock_test_questions`.
2. **List / View** — Paginated queries with optional search, category, and status filters. Mock tests include `questionCount`.
3. **Update** — Partial field updates. New file replaces old Cloudinary asset (old asset destroyed).
4. **Status toggle** — `PATCH /:id/status` sets `ACTIVE` or `INACTIVE`.
5. **Delete** — Document removed from MongoDB. Cloudinary file destroyed. Mock test questions cascade-deleted.

### Upload Workflow

Files are **not** uploaded via a standalone endpoint. Uploads are embedded in create/update `multipart/form-data` requests:

| Category | Form field | When |
|----------|-----------|------|
| NCERT / PYQ / Study Material | `file` | Create (required), Update (optional) |
| Mock Test bulk import | `bulkFile` | Create / Update (optional) |
| Mock Test question bulk | `file` | `POST /mock-tests/:id/questions/upload` |
| Mock Test preview | `bulkFile` | `POST /mock-tests/questions/preview` |

### Publishing Workflow

There is no `DRAFT` / `PUBLISHED` / `ARCHIVED` enum. Visibility is controlled by:

- **`ACTIVE`** — resource is active
- **`INACTIVE`** — resource is inactive

Use `PATCH /api/free-resources/:id/status` with `{ "status": "ACTIVE" }` or `{ "status": "INACTIVE" }`.

---

## Architecture: Two API Surfaces

| Surface | Base Path | Auth | Database Collections | Use Case |
|---------|-----------|------|---------------------|----------|
| **Admin CMS** | `/api/free-resources` | `cmsAdminAuth` (required) | `free_resources`, `free_mock_test_questions` | Admin panel CRUD |
| **Student Portal** | `/api/portal/free-resources` | `optionalAuth` (public) | `resources`, `mocktests`, `resourcecategories`, `filters`, `subcategories` | Student browsing |

> **Critical:** Admin CMS writes to `free_resources`. Portal reads from `resources` / `mocktests`. **No sync logic exists between these stores in the backend.** Admin panel integration uses `/api/free-resources`. Student portal integration uses `/api/portal/free-resources`.

---

## API Base URL & Environment

### Environment Variable

```env
VITE_API_BASE_URL=http://localhost:5000
```

Replace with your deployed backend URL in production (e.g. `https://api.example.com`).

### Frontend API Configuration

```typescript
// src/config/api.ts
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export const FREE_RESOURCES_BASE = `${API_BASE_URL}/api/free-resources`;
export const PORTAL_FREE_RESOURCES_BASE = `${API_BASE_URL}/api/portal/free-resources`;

export const getAuthHeaders = (token: string): HeadersInit => ({
  Authorization: `Bearer ${token}`,
});

export const getJsonHeaders = (token: string): HeadersInit => ({
  Authorization: `Bearer ${token}`,
  'Content-Type': 'application/json',
});
```

All admin CMS requests require `Authorization: Bearer <JWT>`.

---

## Routes Inventory

### Admin CMS — `/api/free-resources`

| Method | Endpoint | Auth Required | Role Required | Description |
|--------|----------|---------------|---------------|-------------|
| GET | `/dropdowns/ncert-subjects` | Yes | `super_admin`, `center_admin` or `SUPER_ADMIN`, `CENTER_ADMIN` | Active subjects from Subject master |
| GET | `/dropdowns/ncert-classes` | Yes | Same | NCERT class list |
| GET | `/dropdowns/exam-categories` | Yes | Same | Exam category options |
| GET | `/dropdowns/paper-types` | Yes | Same | Paper types (Prelims, Mains) |
| GET | `/dropdowns/years` | Yes | Same | Year integers (currentYear+1 down to 2015) |
| GET | `/dropdowns/study-material-categories` | Yes | Same | Study material category options |
| GET | `/dropdowns/resource-categories` | Yes | Same | All free resource categories |
| POST | `/list` | Yes | Same | Unified paginated list (body params) |
| GET | `/` | Yes | Same | Unified paginated list (query params) |
| GET | `/mock-tests/questions/bulk-template` | Yes | Same | Download XLSX question template |
| POST | `/mock-tests/questions/preview` | Yes | Same | Preview bulk questions from file |
| POST | `/ncert-books` | Yes | Same | Create NCERT book (multipart) |
| GET | `/ncert-books` | Yes | Same | List NCERT books |
| GET | `/ncert-books/:id` | Yes | Same | Get NCERT book by ID |
| PUT | `/ncert-books/:id` | Yes | Same | Update NCERT book (multipart) |
| DELETE | `/ncert-books/:id` | Yes | Same | Delete NCERT book |
| POST | `/previous-year-papers` | Yes | Same | Create PYQ paper (multipart) |
| GET | `/previous-year-papers` | Yes | Same | List PYQ papers |
| GET | `/previous-year-papers/:id` | Yes | Same | Get PYQ paper by ID |
| PUT | `/previous-year-papers/:id` | Yes | Same | Update PYQ paper (multipart) |
| DELETE | `/previous-year-papers/:id` | Yes | Same | Delete PYQ paper |
| POST | `/mock-tests/:id/questions/upload` | Yes | Same | Bulk upload questions to existing mock test |
| GET | `/mock-tests/:id/questions` | Yes | Same | List questions for mock test |
| POST | `/mock-tests/:id/questions` | Yes | Same | Add single question |
| PUT | `/mock-tests/:id/questions/:questionId` | Yes | Same | Update question |
| DELETE | `/mock-tests/:id/questions/:questionId` | Yes | Same | Delete question |
| POST | `/mock-tests/:id/questions/:questionId/duplicate` | Yes | Same | Duplicate question |
| POST | `/mock-tests` | Yes | Same | Create mock test (optional bulkFile) |
| GET | `/mock-tests` | Yes | Same | List mock tests |
| GET | `/mock-tests/:id` | Yes | Same | Get mock test with questions |
| PUT | `/mock-tests/:id` | Yes | Same | Update mock test (optional bulkFile) |
| DELETE | `/mock-tests/:id` | Yes | Same | Delete mock test + questions |
| POST | `/study-materials` | Yes | Same | Create study material (multipart) |
| GET | `/study-materials` | Yes | Same | List study materials |
| GET | `/study-materials/:id` | Yes | Same | Get study material by ID |
| PUT | `/study-materials/:id` | Yes | Same | Update study material (multipart) |
| DELETE | `/study-materials/:id` | Yes | Same | Delete study material |
| GET | `/view/:id` | Yes | Same | Get any resource by ID (any category) |
| PATCH | `/:id/status` | Yes | Same | Update resource status |

### Portal — `/api/portal/free-resources`

| Method | Endpoint | Auth Required | Role Required | Description |
|--------|----------|---------------|---------------|-------------|
| GET | `/filters` | Optional | None | Category types + NCERT subject/class filters |
| GET | `/dynamic-filters` | Optional | None | Dynamic filters for a category (`typeId` required) |
| GET | `/resources` | Optional | None | List resources/mock tests (`typeId` required) |
| GET | `/:id` | Optional | None | Resource or mock test detail |
| GET | `/:id/view` | Optional | None | Track view + return view URL |
| GET | `/:id/download` | Optional | None | Track download + return download URL |

---

## Resource Categories & Types

### Admin CMS Categories (`resourceCategory` field)

| Value | Label | API Prefix |
|-------|-------|------------|
| `NCERT_BOOKS` | NCERT Books | `/ncert-books` |
| `PREVIOUS_YEAR_QUESTIONS` | Previous Year Question papers | `/previous-year-papers` |
| `FREE_MOCK_TEST` | Free Mock Tests | `/mock-tests` |
| `STUDY_MATERIAL` | Study Material | `/study-materials` |

### Status Values

| Value | Description |
|-------|-------------|
| `ACTIVE` | Active (default on create) |
| `INACTIVE` | Inactive |

> `DRAFT`, `PUBLISHED`, and `ARCHIVED` are **not** supported by this backend.

### NCERT Classes

`Class 6`, `Class 7`, `Class 8`, `Class 9`, `Class 10`, `Class 11`, `Class 12`

### Exam Categories

| value | label |
|-------|-------|
| `UPSC` | UPSC |
| `APPSC` | APPSC |
| `TSPSC` | TSPSC |
| `SSC` | SSC |
| `BANKING` | Banking |
| `RAILWAY` | Railway |
| `STATE_PSC` | State PSC |

### Paper Types

| value | label | In Dropdown |
|-------|-------|-------------|
| `PRELIMS` | Prelims | Yes |
| `MAINS` | Mains | Yes |
| `INTERVIEW` | Interview | No (schema allows; dropdown excludes) |

### PYQ / Mock Test Paper Values (conditional on `paperType`)

**When `paperType` = `PRELIMS`:** `General Studies`, `CSAT`

**When `paperType` = `MAINS`:** `GS I`, `GS II`, `GS III`, `GS IV`

### Study Material Categories

| value | label |
|-------|-------|
| `POLITY` | Polity |
| `HISTORY` | History |
| `GEOGRAPHY` | Geography |
| `ECONOMICS` | Economics |
| `ETHICS` | Ethics |

### Mock Test Question Types

| Value | Description |
|-------|-------------|
| `SINGLE` | Single correct answer (default) |
| `MULTIPLE` | Multiple correct answers |

### Portal Category Kinds (derived from `ResourceCategory.name`)

`NCERT`, `PYQ`, `STUDY_MATERIAL`, `MOCK_TEST`, `GENERIC`

---

## Authentication & Authorization

### Admin CMS (`/api/free-resources`)

**Middleware chain:** `cmsAdminAuth` = `[protect, allowCmsAdmin]`

#### JWT Requirements

| Header | Value |
|--------|-------|
| `Authorization` | `Bearer <JWT>` |

Token is verified against `process.env.JWT_SECRET`.

**Supported token types:**

1. **User token** — `decoded.id` → `User` document. User must have `isActive: true`.
2. **Admin access token** — `decoded.authType === 'admin_access'` → `AdminAccess` document. Account must have `accountStatus !== false`.

#### Allowed Roles

| Source | Allowed Values |
|--------|----------------|
| `req.user.role` | `super_admin`, `center_admin` |
| `req.adminAccess` role code | `SUPER_ADMIN`, `CENTER_ADMIN` |

#### Error Responses

| HTTP | Body |
|------|------|
| 401 | `{ "success": false, "message": "Not authorized, no token" }` |
| 401 | `{ "success": false, "message": "Not authenticated" }` |
| 403 | `{ "success": false, "message": "Access denied. Insufficient permissions." }` |
| 403 | `{ "success": false, "message": "Account is deactivated" }` |

> No `featureKey: FREE_RESOURCES` permission check is enforced at runtime. Center-based filtering is **not** applied to `/api/free-resources` routes.

#### Actor Tracking

`createdBy` and `updatedBy` are set from `req.user._id` or `req.adminAccess._id`.

### Portal (`/api/portal/free-resources`)

**Middleware:** `optionalAuth`

- Public access — no token required.
- If valid `Bearer` token provided and user is active, `req.user` is attached (used for view/download tracking).
- Invalid tokens are silently ignored.

---

## Data Models

### FreeResource (`free_resources` collection)

| Field | Type | Required | Default | Validation / Enum | Relationships |
|-------|------|----------|---------|-------------------|---------------|
| `_id` | ObjectId | Auto | — | — | — |
| `resourceCategory` | String | Yes | — | `NCERT_BOOKS`, `PREVIOUS_YEAR_QUESTIONS`, `FREE_MOCK_TEST`, `STUDY_MATERIAL` | — |
| `status` | String | No | `ACTIVE` | `ACTIVE`, `INACTIVE` | — |
| `subject` | String | Category-dependent | — | Trimmed | NCERT, Mock Test |
| `class` | String | Category-dependent | — | NCERT_CLASSES enum | NCERT |
| `bookName` | String | Category-dependent | — | Trimmed | NCERT |
| `examCategory` | String | Category-dependent | — | EXAM_CATEGORY_VALUES | PYQ, Mock Test |
| `paperType` | String | Category-dependent | — | `PRELIMS`, `MAINS`, `INTERVIEW` | PYQ, Mock Test |
| `paper` | String | Conditional | — | Prelims/Mains paper values | PYQ, Mock Test |
| `year` | Number | Category-dependent | — | Integer | PYQ |
| `paperName` | String | Category-dependent | — | Trimmed | PYQ |
| `mockTestTitle` | String | Category-dependent | — | Trimmed | Mock Test |
| `topic` | String | Category-dependent | — | Trimmed | Mock Test |
| `duration` | Number | Category-dependent | — | Integer, min 1 (minutes) | Mock Test |
| `totalMarks` | Number | Category-dependent | — | Number, min 0 | Mock Test |
| `negativeMarking` | Number | No | `0` | Number, min 0 | Mock Test |
| `instructions` | String | No | `''` | — | Mock Test |
| `numberOfQuestions` | Number | No | `0` | Number, min 0 | Mock Test (synced from questions) |
| `studyMaterialCategory` | String | Category-dependent | — | STUDY_MATERIAL_CATEGORY_VALUES | Study Material |
| `studyMaterialName` | String | Category-dependent | — | Trimmed | Study Material |
| `fileUrl` | String | No | — | Cloudinary URL | File-based categories |
| `filePublicId` | String | No | — | Stripped from API response | Cloudinary |
| `fileResourceType` | String | No | `raw` | `raw`, `image` | Cloudinary |
| `fileName` | String | No | — | Original filename | File-based categories |
| `fileSize` | Number | No | — | Bytes | File-based categories |
| `previewUrl` | String | No | — | PDF page-1 JPG or null | File-based categories |
| `downloadUrl` | String | No | — | Resolved download URL | File-based categories |
| `createdBy` | ObjectId | No | — | — | ref `User` |
| `updatedBy` | ObjectId | No | `null` | — | ref `User` |
| `createdAt` | Date | Auto | — | — | Timestamp |
| `updatedAt` | Date | Auto | — | — | Timestamp |

### API Response Enrichment (`formatFreeResourceResponse`)

Every resource in API responses includes computed fields:

| Field | Description |
|-------|-------------|
| `resourceName` | Derived display name by category |
| `resourceCategoryLabel` | Human-readable category label |
| `file` | `{ fileName, fileUrl, previewUrl, downloadUrl, uploadedAt }` or `null` |
| `filePublicId` | **Stripped** — never returned to client |
| `questionCount` | Mock tests in list views |
| `questions` | Mock tests in detail views |
| `createdBy` / `updatedBy` | Populated: `{ name, email, role }` on list/detail |

### FreeMockTestQuestion (`free_mock_test_questions` collection)

| Field | Type | Required | Default | Validation |
|-------|------|----------|---------|------------|
| `_id` | ObjectId | Auto | — | — |
| `mockTestId` | ObjectId | Yes | — | ref `FreeResource` |
| `questionNo` | Number | Yes | — | Integer, min 1; unique per mockTestId |
| `questionType` | String | No | `SINGLE` | `SINGLE`, `MULTIPLE` |
| `question` | String | Yes | — | Trimmed; no duplicates per mock test |
| `option1` | String | Yes | — | Trimmed |
| `option2` | String | Yes | — | Trimmed |
| `option3` | String | No | `''` | Trimmed |
| `option4` | String | No | `''` | Trimmed |
| `correctAnswer` | String | Yes | — | `1`–`4` or comma-separated for MULTIPLE |
| `explanation` | String | No | `''` | — |
| `marks` | Number | Yes | `1` | min 0 |
| `negativeMark` | Number | No | `0` | min 0 |
| `createdAt` / `updatedAt` | Date | Auto | — | Timestamps |

**Formatted question response** also includes:

```json
{
  "options": [
    { "key": "1", "text": "...", "isCorrect": true }
  ],
  "correctAnswerLabels": ["..."]
}
```

---

## Admin CMS APIs

### Unified List

#### `POST /api/free-resources/list`

**Content-Type:** `application/json`

**Body:**

| Field | Type | Required | Default | Validation |
|-------|------|----------|---------|------------|
| `search` | string | No | — | Case-insensitive regex on name fields |
| `category` | string | No | — | One of FREE_RESOURCE_CATEGORY_LIST |
| `status` | string | No | — | `ACTIVE` or `INACTIVE` |
| `page` | number | No | `1` | Integer ≥ 1 |
| `limit` | number | No | `10` | Integer 1–100 |
| `sortBy` | string | No | `createdAt` | Any sortable field |
| `sortOrder` | string | No | `desc` | `asc` or `desc` |

#### `GET /api/free-resources`

Same parameters as query string. Uses `paginate` middleware + `validateListQuery`.

**Search matches:** `bookName`, `paperName`, `mockTestTitle`, `studyMaterialName`, `subject`, `topic`, `examCategory`

**Success Response (200):**

```json
{
  "success": true,
  "message": "Free resources fetched successfully",
  "count": 10,
  "total": 45,
  "page": 1,
  "limit": 10,
  "totalPages": 5,
  "hasNextPage": true,
  "hasPrevPage": false,
  "data": [ /* formatted resources */ ]
}
```

**Example URLs:**

```
GET /api/free-resources?page=1&limit=20&category=NCERT_BOOKS&status=ACTIVE&search=history&sortBy=createdAt&sortOrder=desc
POST /api/free-resources/list  (body: { "page": 1, "limit": 20, "category": "FREE_MOCK_TEST" })
```

---

### NCERT Books

#### Create — `POST /api/free-resources/ncert-books`

**Content-Type:** `multipart/form-data`

| Field | Required | Validation |
|-------|----------|------------|
| `subject` | Yes | String (from Subject master dropdown) |
| `class` | Yes | One of NCERT_CLASSES |
| `bookName` | Yes | String |
| `status` | No | `ACTIVE` (default) or `INACTIVE` |
| `file` | Yes | PDF only, max 25 MB |

**Success (201):**

```json
{
  "success": true,
  "message": "NCERT book created successfully",
  "data": { /* formatted FreeResource */ }
}
```

#### List — `GET /api/free-resources/ncert-books`

Query: `page`, `limit`, `sortBy`, `sortOrder`, `search`, `status` (category fixed to `NCERT_BOOKS`)

#### Get — `GET /api/free-resources/ncert-books/:id`

#### Update — `PUT /api/free-resources/ncert-books/:id`

**Content-Type:** `multipart/form-data`

All fields optional; at least one field required. `file` optional (replaces existing).

#### Delete — `DELETE /api/free-resources/ncert-books/:id`

**Success (200):**

```json
{
  "success": true,
  "message": "NCERT book deleted successfully",
  "data": { "_id": "...", "deleted": true }
}
```

---

### Previous Year Papers

#### Create — `POST /api/free-resources/previous-year-papers`

**Content-Type:** `multipart/form-data`

| Field | Required | Validation |
|-------|----------|------------|
| `examCategory` | Yes | EXAM_CATEGORY_VALUES |
| `paperType` | Yes | `PRELIMS` or `MAINS` |
| `paper` | Conditional | Required when paperType is PRELIMS/MAINS |
| `year` | Yes | Integer 2015–2100 |
| `paperName` | Yes | String |
| `status` | No | Default `ACTIVE` |
| `file` | Yes | PDF only, max 25 MB |

#### List — `GET /api/free-resources/previous-year-papers`

Query: `page`, `limit`, `sortBy`, `sortOrder`, `search`, `status`

#### Get / Update / Delete — same pattern as NCERT with `:id` routes

---

### Mock Tests

#### Create — `POST /api/free-resources/mock-tests`

**Content-Type:** `multipart/form-data`

| Field | Required | Validation |
|-------|----------|------------|
| `examCategory` | Yes | EXAM_CATEGORY_VALUES |
| `mockTestTitle` | Yes | String |
| `paperType` | Yes | `PRELIMS` or `MAINS` |
| `paper` | Conditional | Required when paperType is PRELIMS/MAINS |
| `subject` | Yes | String |
| `topic` | Yes | String |
| `duration` | Yes | Integer ≥ 1 (minutes) |
| `totalMarks` | Yes | Number ≥ 0 |
| `negativeMarking` | No | Default `0`, min 0 |
| `instructions` | No | String |
| `numberOfQuestions` | No | Default `0` (used when no bulk file) |
| `status` | No | Default `ACTIVE` |
| `bulkFile` | No | XLSX/CSV, max 15 MB |

**Success (201):**

```json
{
  "success": true,
  "message": "Mock test created successfully with 50 question(s)",
  "data": {
    "mockTest": { /* formatted FreeResource with questions */ },
    "questionsCount": 50,
    "questions": [ /* formatted questions */ ]
  }
}
```

#### Update — `PUT /api/free-resources/mock-tests/:id`

Same fields as create (all optional, min 1). Additional field:

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `replace` | boolean | `false` | When `bulkFile` uploaded: `true` replaces all questions |

**Success (200) with bulk import:**

```json
{
  "success": true,
  "message": "Mock test updated successfully with 50 question(s) imported",
  "data": {
    "mockTest": { /* ... */ },
    "questionsCount": 50,
    "questions": [ /* ... */ ],
    "importedCount": 50
  }
}
```

#### Mock Test Questions

| Method | Endpoint | Body / Params |
|--------|----------|---------------|
| GET | `/mock-tests/:id/questions` | — |
| POST | `/mock-tests/:id/questions` | JSON question object |
| PUT | `/mock-tests/:id/questions/:questionId` | JSON (min 1 field) |
| DELETE | `/mock-tests/:id/questions/:questionId` | — |
| POST | `/mock-tests/:id/questions/:questionId/duplicate` | — |
| POST | `/mock-tests/:id/questions/upload` | multipart: `file` (required), `replace` (optional) |

**Single Question Body:**

| Field | Required | Validation |
|-------|----------|------------|
| `questionNo` | No | Integer ≥ 1 (auto-assigned on bulk) |
| `questionType` | No | `SINGLE` (default) or `MULTIPLE` |
| `question` | Yes | String; no duplicate text per mock test |
| `option1` | Yes | String |
| `option2` | Yes | String |
| `option3` | No | String |
| `option4` | No | String |
| `correctAnswer` | Yes | `1`–`4` or comma-separated for MULTIPLE |
| `explanation` | No | String |
| `marks` | Yes | Number ≥ 0 |
| `negativeMark` | No | Default `0`, min 0 |

#### Bulk Template — `GET /api/free-resources/mock-tests/questions/bulk-template`

Returns XLSX file: `free-mock-test-questions-template.xlsx`

**Columns:** `questionNo`, `questionType`, `question`, `option1`, `option2`, `option3`, `option4`, `correctAnswer`, `explanation`, `marks`, `negativeMark`

#### Preview — `POST /api/free-resources/mock-tests/questions/preview`

**Content-Type:** `multipart/form-data`

| Field | Required |
|-------|----------|
| `bulkFile` | Yes |

Optional body fields: `mockTestTitle`, `title` (used in preview response).

**Success (200):**

```json
{
  "success": true,
  "message": "Mock test preview generated successfully",
  "data": {
    "title": "Untitled",
    "questionsCount": 50,
    "questions": [ /* formatted with options */ ]
  }
}
```

---

### Study Materials

#### Create — `POST /api/free-resources/study-materials`

**Content-Type:** `multipart/form-data`

| Field | Required | Validation |
|-------|----------|------------|
| `category` | Yes | STUDY_MATERIAL_CATEGORY_VALUES (stored as `studyMaterialCategory`) |
| `studyMaterialName` | Yes | String |
| `status` | No | Default `ACTIVE` |
| `file` | Yes | PDF/DOC/DOCX/PPT/PPTX, max 25 MB |

#### List / Get / Update / Delete — same pattern as NCERT

---

### Global Endpoints

#### Get Any Resource — `GET /api/free-resources/view/:id`

Returns resource of any category. Mock tests include full `questions` array.

#### Update Status — `PATCH /api/free-resources/:id/status`

**Content-Type:** `application/json`

```json
{ "status": "ACTIVE" }
```

or

```json
{ "status": "INACTIVE" }
```

**Success (200):**

```json
{
  "success": true,
  "message": "Resource status updated successfully",
  "data": { /* formatted resource */ }
}
```

---

## Dropdown APIs

All dropdown endpoints return **raw JSON arrays** (no `{ success, data }` wrapper) on success.

| Endpoint | Response Type | Example |
|----------|---------------|---------|
| `GET /dropdowns/ncert-subjects` | `string[]` | `["Economics", "Geography", "History"]` |
| `GET /dropdowns/ncert-classes` | `string[]` | `["Class 6", "Class 7", ...]` |
| `GET /dropdowns/exam-categories` | `{ value, label }[]` | `[{ "value": "UPSC", "label": "UPSC" }]` |
| `GET /dropdowns/paper-types` | `{ value, label }[]` | `[{ "value": "PRELIMS", "label": "Prelims" }]` |
| `GET /dropdowns/years` | `number[]` | `[2027, 2026, 2025, ..., 2015]` |
| `GET /dropdowns/study-material-categories` | `{ value, label }[]` | `[{ "value": "POLITY", "label": "Polity" }]` |
| `GET /dropdowns/resource-categories` | `{ value, label }[]` | `[{ "value": "NCERT_BOOKS", "label": "NCERT Books" }]` |

**NCERT subjects** are loaded from the `Subject` model (`status: 'ACTIVE'`, not soft-deleted), sorted by `subjectName`.

**Dropdown error (500):**

```json
{ "success": false, "message": "Failed to load subjects" }
```

---

## File Uploads

### No Standalone Upload Endpoint

Files are uploaded as part of create/update multipart requests or dedicated bulk upload endpoints. There is no `POST /upload` route.

### Upload Matrix

| Handler | Form Field | Endpoints | Max Size | Accepted Types |
|---------|-----------|-----------|----------|----------------|
| `handleNcertUpload` | `file` | NCERT create/update | 25 MB | PDF (`application/pdf`) |
| `handlePyqUpload` | `file` | PYQ create/update | 25 MB | PDF |
| `handleStudyMaterialUpload` | `file` | Study material create/update | 25 MB | PDF, DOC, DOCX, PPT, PPTX |
| `handleMockTestBulkUpload` | `bulkFile` | Mock test create/update | 15 MB | XLSX, CSV |
| `handleMockTestPreviewUpload` | `bulkFile` | Mock test preview | 15 MB | XLSX, CSV |
| `handleBulkQuestionUpload` | `file` | Question bulk upload | 15 MB | XLSX, CSV |

### Storage

| Setting | Value |
|---------|-------|
| Provider | Cloudinary |
| Folder | `free-resources` |
| PDF resource type | `raw` |
| PDF preview | Page 1 rendered as JPG (`previewUrl`) |
| Non-PDF documents | `previewUrl: null` |

### Returned URL Structure

After upload, the API response includes:

```json
{
  "fileUrl": "https://res.cloudinary.com/.../raw/upload/...",
  "previewUrl": "https://res.cloudinary.com/.../image/upload/...jpg",
  "downloadUrl": "https://res.cloudinary.com/.../raw/upload/...",
  "file": {
    "fileName": "document.pdf",
    "fileUrl": "...",
    "previewUrl": "...",
    "downloadUrl": "...",
    "uploadedAt": "2026-06-24T10:00:00.000Z"
  }
}
```

### Upload Error Response (400)

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    { "field": "file", "message": "Only PDF files are allowed" }
  ]
}
```

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    { "field": "file", "message": "File size must not exceed 25 MB" }
  ]
}
```

### Frontend Upload Integration

```typescript
const formData = new FormData();
formData.append('bookName', 'India and Contemporary World');
formData.append('subject', 'History');
formData.append('class', 'Class 10');
formData.append('status', 'ACTIVE');
formData.append('file', pdfFile); // File object from input

await fetch(`${FREE_RESOURCES_BASE}/ncert-books`, {
  method: 'POST',
  headers: { Authorization: `Bearer ${token}` },
  body: formData,
  // Do NOT set Content-Type — browser sets multipart boundary
});
```

On update, omit `file` to keep the existing file. Include `file` to replace (old Cloudinary asset is destroyed).

---

## Search & Filters

### Admin Unified List

| Parameter | Location | Type | Description |
|-----------|----------|------|-------------|
| `search` | body (POST /list) or query (GET /) | string | Regex search across name fields |
| `category` | body or query | string | Filter by resourceCategory |
| `status` | body or query | string | `ACTIVE` or `INACTIVE` |
| `page` | body or query | number | Page number (default 1) |
| `limit` | body or query | number | Items per page (default 10, max 100) |
| `sortBy` | body or query | string | Sort field (default `createdAt`) |
| `sortOrder` | body or query | string | `asc` or `desc` (default `desc`) |

### Category-Specific Lists

Same query params except `category` is fixed by endpoint:

| Endpoint | Fixed Category |
|----------|----------------|
| `/ncert-books` | `NCERT_BOOKS` |
| `/previous-year-papers` | `PREVIOUS_YEAR_QUESTIONS` |
| `/mock-tests` | `FREE_MOCK_TEST` |
| `/study-materials` | `STUDY_MATERIAL` |

Category lists support: `page`, `limit`, `sortBy`, `sortOrder`, `search`, `status`.

> Date filters (`createdDate`, `startDate`, `endDate`) are **not** implemented.

---

## Status Management

| Status | Meaning | How to Set |
|--------|---------|------------|
| `ACTIVE` | Resource is active | Create default, or `PATCH /:id/status` |
| `INACTIVE` | Resource is inactive | `PATCH /:id/status` |

**Activate (publish):**

```http
PATCH /api/free-resources/:id/status
Content-Type: application/json

{ "status": "ACTIVE" }
```

**Deactivate (unpublish):**

```http
PATCH /api/free-resources/:id/status
Content-Type: application/json

{ "status": "INACTIVE" }
```

Status can also be set during create/update via the `status` form field.

---

## Error Responses

### 400 — Validation Failed

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    { "field": "bookName", "message": "Book name is required" }
  ]
}
```

Bulk upload errors include `row` field:

```json
{
  "success": false,
  "message": "Bulk upload validation failed",
  "errors": [
    { "row": 3, "field": "correctAnswer", "message": "correctAnswer must be a single option number between 1 and 4" }
  ]
}
```

Missing file on create:

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    { "field": "file", "message": "File upload is required" }
  ]
}
```

### 401 — Unauthorized

```json
{ "success": false, "message": "Not authorized, no token" }
```

```json
{ "success": false, "message": "Not authenticated" }
```

### 403 — Forbidden

```json
{ "success": false, "message": "Access denied. Insufficient permissions." }
```

### 404 — Not Found

```json
{ "success": false, "message": "Resource not found" }
```

Category-specific:

```json
{ "success": false, "message": "NCERT_BOOKS resource not found" }
```

### 409 — Conflict

**Not used** by the Free Resources module.

### 422 — Unprocessable Entity

**Not used** — validation errors return **400**.

### 500 — Server Error

```json
{ "success": false, "message": "Failed to create NCERT book" }
```

Portal errors may include `error` field:

```json
{ "success": false, "message": "Server error", "error": "..." }
```

---

## Portal (Student-Facing) APIs

Base: `/api/portal/free-resources`

### `GET /filters`

**Query:** `typeId` (optional) — when provided and category kind is NCERT, subjects/classes come from that category.

**Response:**

```json
{
  "success": true,
  "data": {
    "subjects": [{ "_id": "...", "value": "History", "type": "SUBJECT" }],
    "classes": [{ "_id": "...", "value": "Class 10", "type": "CLASS" }],
    "ncertTypeId": "...",
    "types": [
      {
        "_id": "...",
        "name": "NCERT Books",
        "thumbnail": "https://...",
        "kind": "NCERT"
      }
    ]
  }
}
```

### `GET /dynamic-filters?typeId=<categoryId>`

**Required:** `typeId` (ResourceCategory `_id`)

**Response:**

```json
{
  "success": true,
  "data": {
    "typeId": "...",
    "typeName": "Previous Year Questions",
    "kind": "PYQ",
    "filters": ["SUB_CATEGORY", "PAPER", "YEAR"],
    "subjects": [],
    "classes": [],
    "subCategories": [{ "_id": "...", "name": "UPSC" }],
    "papers": [{ "_id": "...", "value": "GS I", "type": "PAPER" }],
    "years": [{ "_id": "...", "value": "2024", "type": "YEAR" }]
  }
}
```

**Filter keys by kind:**

| Kind | Filter Keys |
|------|-------------|
| `NCERT` | `SUBJECT`, `CLASS` |
| `PYQ` | `SUB_CATEGORY`, `PAPER`, `YEAR` |
| `STUDY_MATERIAL` | `SUB_CATEGORY` |
| `MOCK_TEST` | `SUB_CATEGORY` |
| `GENERIC` | `SUBJECT`, `CLASS` |

### `GET /resources?typeId=<categoryId>`

**Required:** `typeId`

**Optional:** `subjectId`, `classId`, `subCategoryId`, `paperId`, `yearId`, `search`

**No pagination** — returns full array.

**File card:**

```json
{
  "_id": "...",
  "itemType": "file",
  "title": "NCERT History Class 10",
  "pdfUrl": "https://...",
  "thumbnail": "https://...",
  "subject": "History",
  "class": "Class 10",
  "type": "NCERT Books",
  "subCategory": null,
  "paper": null,
  "year": null,
  "downloads": 42
}
```

**Mock test card:**

```json
{
  "_id": "...",
  "itemType": "mock_test",
  "title": "UPSC Prelims Mock 1",
  "pdfUrl": null,
  "thumbnail": null,
  "subject": "General Studies",
  "class": null,
  "type": "Free Mock Tests",
  "subCategory": "UPSC",
  "paper": "General Studies",
  "year": "2024",
  "duration": 120,
  "totalMarks": 200,
  "passingMarks": 100,
  "questionCount": 100,
  "downloads": 0
}
```

### `GET /:id`

Returns file detail or mock test detail with questions.

### `GET /:id/view`

Tracks view in `ResourceViewHistory` (files only, not mock tests).

```json
{
  "success": true,
  "data": {
    /* detail fields */,
    "viewUrl": "https://..."
  }
}
```

### `GET /:id/download`

Increments `downloads` on `Resource`, creates `ResourceDownload` record.

```json
{
  "success": true,
  "message": "Download tracked",
  "data": {
    "_id": "...",
    "title": "...",
    "downloadUrl": "https://...",
    "downloads": 43
  }
}
```

---

## Frontend Service Layer

```typescript
// src/services/freeResourcesService.ts

import { FREE_RESOURCES_BASE, getAuthHeaders } from '../config/api';

export type ResourceCategory =
  | 'NCERT_BOOKS'
  | 'PREVIOUS_YEAR_QUESTIONS'
  | 'FREE_MOCK_TEST'
  | 'STUDY_MATERIAL';

export type ResourceStatus = 'ACTIVE' | 'INACTIVE';

export interface ListParams {
  search?: string;
  category?: ResourceCategory;
  status?: ResourceStatus;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  success: boolean;
  message: string;
  count: number;
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  data: T[];
}

async function request<T>(
  path: string,
  token: string,
  options: RequestInit = {}
): Promise<T> {
  const res = await fetch(`${FREE_RESOURCES_BASE}${path}`, {
    ...options,
    headers: {
      ...getAuthHeaders(token),
      ...options.headers,
    },
  });
  const json = await res.json();
  if (!res.ok) throw json;
  return json;
}

// ─── List ───

export async function getResources(
  token: string,
  params: ListParams,
  method: 'GET' | 'POST' = 'GET'
): Promise<PaginatedResponse<unknown>> {
  if (method === 'POST') {
    return request('/list', token, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
  }
  const query = new URLSearchParams(
    Object.entries(params)
      .filter(([, v]) => v !== undefined && v !== '')
      .map(([k, v]) => [k, String(v)])
  );
  return request(`/?${query}`, token);
}

// ─── Get by ID ───

export async function getResourceById(token: string, id: string) {
  return request(`/view/${id}`, token);
}

export async function getNcertBookById(token: string, id: string) {
  return request(`/ncert-books/${id}`, token);
}

export async function getMockTestById(token: string, id: string) {
  return request(`/mock-tests/${id}`, token);
}

// ─── Create ───

export async function createNcertBook(token: string, formData: FormData) {
  return request('/ncert-books', token, { method: 'POST', body: formData });
}

export async function createPreviousYearPaper(token: string, formData: FormData) {
  return request('/previous-year-papers', token, { method: 'POST', body: formData });
}

export async function createMockTest(token: string, formData: FormData) {
  return request('/mock-tests', token, { method: 'POST', body: formData });
}

export async function createStudyMaterial(token: string, formData: FormData) {
  return request('/study-materials', token, { method: 'POST', body: formData });
}

// ─── Update ───

export async function updateNcertBook(token: string, id: string, formData: FormData) {
  return request(`/ncert-books/${id}`, token, { method: 'PUT', body: formData });
}

export async function updateMockTest(token: string, id: string, formData: FormData) {
  return request(`/mock-tests/${id}`, token, { method: 'PUT', body: formData });
}

// ─── Delete ───

export async function deleteResource(
  token: string,
  category: ResourceCategory,
  id: string
) {
  const pathMap: Record<ResourceCategory, string> = {
    NCERT_BOOKS: `/ncert-books/${id}`,
    PREVIOUS_YEAR_QUESTIONS: `/previous-year-papers/${id}`,
    FREE_MOCK_TEST: `/mock-tests/${id}`,
    STUDY_MATERIAL: `/study-materials/${id}`,
  };
  return request(pathMap[category], token, { method: 'DELETE' });
}

// ─── Status ───

export async function updateResourceStatus(
  token: string,
  id: string,
  status: ResourceStatus
) {
  return request(`/${id}/status`, token, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  });
}

// ─── Upload helper (no standalone endpoint) ───

/**
 * Builds FormData for file-based resource create/update.
 * File upload is embedded in create/update — there is no separate upload API.
 */
export function buildResourceFormData(
  fields: Record<string, string | number | boolean>,
  file?: File,
  fileFieldName: 'file' | 'bulkFile' = 'file'
): FormData {
  const formData = new FormData();
  Object.entries(fields).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      formData.append(key, String(value));
    }
  });
  if (file) formData.append(fileFieldName, file);
  return formData;
}

export async function uploadResourceFile(
  token: string,
  category: ResourceCategory,
  id: string | null,
  fields: Record<string, string | number | boolean>,
  file: File
) {
  const formData = buildResourceFormData(fields, file);
  const isCreate = !id;

  const routes: Record<ResourceCategory, { create: string; update: (id: string) => string }> = {
    NCERT_BOOKS: { create: '/ncert-books', update: (i) => `/ncert-books/${i}` },
    PREVIOUS_YEAR_QUESTIONS: {
      create: '/previous-year-papers',
      update: (i) => `/previous-year-papers/${i}`,
    },
    FREE_MOCK_TEST: { create: '/mock-tests', update: (i) => `/mock-tests/${i}` },
    STUDY_MATERIAL: { create: '/study-materials', update: (i) => `/study-materials/${i}` },
  };

  const path = isCreate ? routes[category].create : routes[category].update(id!);
  return request(path, token, {
    method: isCreate ? 'POST' : 'PUT',
    body: formData,
  });
}

// ─── Dropdowns ───

export async function getDropdown<T>(token: string, name: string): Promise<T> {
  const res = await fetch(`${FREE_RESOURCES_BASE}/dropdowns/${name}`, {
    headers: getAuthHeaders(token),
  });
  if (!res.ok) {
    const json = await res.json();
    throw json;
  }
  return res.json();
}

// ─── Mock Test Questions ───

export async function getMockTestQuestions(token: string, mockTestId: string) {
  return request(`/mock-tests/${mockTestId}/questions`, token);
}

export async function addMockTestQuestion(
  token: string,
  mockTestId: string,
  question: Record<string, unknown>
) {
  return request(`/mock-tests/${mockTestId}/questions`, token, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(question),
  });
}

export async function bulkUploadQuestions(
  token: string,
  mockTestId: string,
  file: File,
  replace = false
) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('replace', String(replace));
  return request(`/mock-tests/${mockTestId}/questions/upload`, token, {
    method: 'POST',
    body: formData,
  });
}

export async function downloadBulkTemplate(token: string): Promise<Blob> {
  const res = await fetch(
    `${FREE_RESOURCES_BASE}/mock-tests/questions/bulk-template`,
    { headers: getAuthHeaders(token) }
  );
  if (!res.ok) throw new Error('Failed to download template');
  return res.blob();
}
```

---

## React Query Integration

```typescript
// src/hooks/useFreeResources.ts

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getResources,
  getResourceById,
  createNcertBook,
  updateNcertBook,
  deleteResource,
  uploadResourceFile,
  updateResourceStatus,
  ListParams,
  ResourceCategory,
  ResourceStatus,
} from '../services/freeResourcesService';
import { useAuth } from '../context/AuthContext';

const QUERY_KEY = 'free-resources';

export function useResources(params: ListParams) {
  const { token } = useAuth();
  return useQuery({
    queryKey: [QUERY_KEY, 'list', params],
    queryFn: () => getResources(token, params),
    enabled: !!token,
  });
}

export function useResource(id: string) {
  const { token } = useAuth();
  return useQuery({
    queryKey: [QUERY_KEY, 'detail', id],
    queryFn: () => getResourceById(token, id),
    enabled: !!token && !!id,
  });
}

export function useCreateResource(category: ResourceCategory) {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  const createFn = (formData: FormData) => {
    switch (category) {
      case 'NCERT_BOOKS':
        return createNcertBook(token, formData);
      // add other categories as needed
      default:
        throw new Error(`Use category-specific create for ${category}`);
    }
  };

  return useMutation({
    mutationFn: createFn,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [QUERY_KEY] }),
  });
}

export function useUpdateResource(category: ResourceCategory) {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, formData }: { id: string; formData: FormData }) => {
      if (category === 'NCERT_BOOKS') return updateNcertBook(token, id, formData);
      throw new Error(`Use category-specific update for ${category}`);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [QUERY_KEY] }),
  });
}

export function useDeleteResource() {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ category, id }: { category: ResourceCategory; id: string }) =>
      deleteResource(token, category, id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [QUERY_KEY] }),
  });
}

export function useUploadResource() {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      category,
      id,
      fields,
      file,
    }: {
      category: ResourceCategory;
      id: string | null;
      fields: Record<string, string | number | boolean>;
      file: File;
    }) => uploadResourceFile(token, category, id, fields, file),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [QUERY_KEY] }),
  });
}

export function useUpdateResourceStatus() {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: ResourceStatus }) =>
      updateResourceStatus(token, id, status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [QUERY_KEY] }),
  });
}
```

---

## Form Field Mapping

### NCERT Books

| Backend Field | Frontend Component | Notes |
|---------------|---------------------|-------|
| `subject` | Select | Options from `GET /dropdowns/ncert-subjects` |
| `class` | Select | Options from `GET /dropdowns/ncert-classes` |
| `bookName` | Input | Required text |
| `status` | Select / Toggle | `ACTIVE` / `INACTIVE` |
| `file` | File Upload | PDF only, max 25 MB, required on create |

### Previous Year Papers

| Backend Field | Frontend Component | Notes |
|---------------|---------------------|-------|
| `examCategory` | Select | `GET /dropdowns/exam-categories` |
| `paperType` | Select | `GET /dropdowns/paper-types` |
| `paper` | Select (conditional) | Show when paperType is PRELIMS/MAINS |
| `year` | Select | `GET /dropdowns/years` |
| `paperName` | Input | Required |
| `status` | Select / Toggle | `ACTIVE` / `INACTIVE` |
| `file` | File Upload | PDF only, max 25 MB |

### Mock Tests

| Backend Field | Frontend Component | Notes |
|---------------|---------------------|-------|
| `examCategory` | Select | Exam categories dropdown |
| `mockTestTitle` | Input | Required |
| `paperType` | Select | Prelims / Mains |
| `paper` | Select (conditional) | Prelims/Mains paper values |
| `subject` | Input | Required text |
| `topic` | Input | Required text |
| `duration` | Number Input | Minutes, min 1 |
| `totalMarks` | Number Input | min 0 |
| `negativeMarking` | Number Input | Default 0 |
| `instructions` | Textarea | Optional |
| `numberOfQuestions` | Number Input | Used when no bulk file |
| `status` | Select / Toggle | `ACTIVE` / `INACTIVE` |
| `bulkFile` | File Upload | XLSX/CSV, max 15 MB |
| `replace` | Checkbox | On update with bulk file |

### Study Materials

| Backend Field | Frontend Component | Notes |
|---------------|---------------------|-------|
| `category` | Select | `GET /dropdowns/study-material-categories` |
| `studyMaterialName` | Input | Required |
| `status` | Select / Toggle | `ACTIVE` / `INACTIVE` |
| `file` | File Upload | PDF/DOC/DOCX/PPT/PPTX, max 25 MB |

### Mock Test Question (single)

| Backend Field | Frontend Component |
|---------------|---------------------|
| `questionNo` | Number Input |
| `questionType` | Select (`SINGLE` / `MULTIPLE`) |
| `question` | Textarea |
| `option1`–`option4` | Input |
| `correctAnswer` | Select / Multi-select |
| `explanation` | Textarea |
| `marks` | Number Input |
| `negativeMark` | Number Input |

---

## Table Integration Guide

### Recommended Columns (Unified List)

| Column | Source Field | Notes |
|--------|-------------|-------|
| Name | `resourceName` | Computed by backend |
| Category | `resourceCategoryLabel` | Human-readable |
| Status | `status` | Badge: ACTIVE / INACTIVE |
| Questions | `questionCount` | Mock tests only |
| Created | `createdAt` | Sortable |
| Created By | `createdBy.name` | Populated on list |
| Actions | — | See below |

### Search Mapping

Map table search input → `search` query/body param.

### Filter Mapping

| UI Filter | API Param | Endpoint |
|-----------|-----------|----------|
| Category | `category` | Unified list |
| Status | `status` | All list endpoints |
| Search | `search` | All list endpoints |

### Pagination Mapping

| UI State | API Param |
|----------|-----------|
| Current page | `page` |
| Page size | `limit` (max 100) |
| Sort column | `sortBy` |
| Sort direction | `sortOrder` (`asc` / `desc`) |

Use response fields: `total`, `totalPages`, `hasNextPage`, `hasPrevPage`.

### Row Actions

| Action | API Call | Notes |
|--------|----------|-------|
| View | `GET /view/:id` or category-specific `GET /:category/:id` | Detail page |
| Edit | `PUT /:category/:id` | Multipart form |
| Delete | `DELETE /:category/:id` | Confirm dialog; returns `{ deleted: true }` |
| Activate | `PATCH /:id/status` with `{ status: "ACTIVE" }` | Replaces "Publish" |
| Deactivate | `PATCH /:id/status` with `{ status: "INACTIVE" }` | Replaces "Unpublish" |

Route `:category` mapping:

| resourceCategory | Delete/Edit prefix |
|------------------|-------------------|
| `NCERT_BOOKS` | `/ncert-books` |
| `PREVIOUS_YEAR_QUESTIONS` | `/previous-year-papers` |
| `FREE_MOCK_TEST` | `/mock-tests` |
| `STUDY_MATERIAL` | `/study-materials` |

---

## Server Persistence Validation

### How Records Are Stored

1. **Create request** hits controller → service.
2. **File** (if present) uploaded to Cloudinary folder `free-resources`.
3. **MongoDB document** created in `free_resources` with file metadata (`fileUrl`, `filePublicId`, `fileName`, `fileSize`, `previewUrl`, `downloadUrl`).
4. **Mock test questions** inserted into `free_mock_test_questions` with `mockTestId` reference.
5. **`numberOfQuestions`** synced via `countDocuments` after question changes.

### Database Collections

| Collection | Model | Purpose |
|------------|-------|---------|
| `free_resources` | `FreeResource` | All admin CMS resources |
| `free_mock_test_questions` | `FreeMockTestQuestion` | Mock test questions |

### File Storage

| Provider | Folder | On Delete |
|----------|--------|-----------|
| Cloudinary | `free-resources` | `cloudinary.uploader.destroy(publicId)` |

### Data Persistence Flow

```
Frontend FormData
  → Multer (memory buffer)
  → Cloudinary upload
  → FreeResource.create() / .save()
  → Response with formatFreeResourceResponse()
```

### Success Verification

After create/update, verify:

1. Response `success: true`
2. Response `data._id` exists
3. For file resources: `data.file.fileUrl` is non-null
4. For mock tests with bulk: `data.questionsCount` matches expected count
5. Re-fetch via `GET /view/:id` to confirm persistence

```typescript
const verifyPersistence = async (token: string, id: string) => {
  const res = await getResourceById(token, id);
  if (!res.success || !res.data?._id) {
    throw new Error('Resource not persisted');
  }
  return res.data;
};
```

---

## Frontend Implementation Checklist

### Admin CMS (`/api/free-resources`)

- [ ] Resource List (unified table with pagination)
- [ ] Resource Details (category-specific detail pages)
- [ ] Create Resource (NCERT, PYQ, Mock Test, Study Material forms)
- [ ] Edit Resource (multipart update per category)
- [ ] Delete Resource (with confirmation)
- [ ] Upload Resource File (embedded in create/update FormData)
- [ ] Search (map to `search` param)
- [ ] Filters (category, status)
- [ ] Pagination (page, limit, sortBy, sortOrder)
- [ ] Status Management (ACTIVE / INACTIVE via PATCH)
- [ ] Permissions (Bearer token, super_admin / center_admin)
- [ ] Error Handling (400 validation errors array, 401, 403, 404, 500)
- [ ] Server Persistence Verification (re-fetch after create/update)
- [ ] Dropdown data loading (7 dropdown endpoints)
- [ ] Mock Test Questions CRUD
- [ ] Mock Test Bulk Upload (template download, preview, import)
- [ ] Mock Test Question Duplicate

### Student Portal (`/api/portal/free-resources`)

- [ ] Category type selector (`GET /filters`)
- [ ] Dynamic filters per category (`GET /dynamic-filters`)
- [ ] Resource listing (`GET /resources`)
- [ ] Resource detail (`GET /:id`)
- [ ] View tracking (`GET /:id/view`)
- [ ] Download tracking (`GET /:id/download`)

---

## Request Pipeline Reference

```
POST /api/free-resources/ncert-books
  → cmsAdminAuth [protect → allowCmsAdmin]
  → handleNcertUpload (multer: field "file", PDF, 25MB)
  → validateNcertCreate (Joi)
  → createNcertBook (controller)
  → freeResourceService.createNcertBook
  → uploadPdfToCloudinary → FreeResource.create → formatFreeResourceResponse
  → 201 { success, message, data }
```

---

*Document generated from backend source: `routes/freeResourceRoutes.js`, `controllers/freeResourceController.js`, `services/freeResourceService.js`, `models/FreeResource.js`, `models/FreeMockTestQuestion.js`, `validations/freeResourceValidation.js`, `middleware/freeResourceUpload.js`, `middleware/cmsAdminAuth.js`, `utils/freeResourceEnums.js`, `utils/freeResourceConstants.js`, `utils/freeResourceHelpers.js`, `routes/portalFreeResourceRoutes.js`, `services/resourceService.js`.*
