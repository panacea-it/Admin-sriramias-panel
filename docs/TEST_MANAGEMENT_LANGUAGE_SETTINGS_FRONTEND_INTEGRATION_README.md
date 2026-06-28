# Test Management → Test Configuration → Language Settings — Frontend Integration Guide

**Audience:** React + Vite frontend developers integrating the **Language Settings** page under **Test Management → Test Configuration**.

**Backend module:** **Test Config Languages** (`TestConfigLanguage` model, `testConfigLanguageController`, `testConfigurationRoutes`).

**Base path:** `{VITE_API_BASE_URL}/api/test-configuration/languages`

**Frontend route (product UI):** `/test-management/test-configuration/language-settings`

**Auth:** `Authorization: Bearer <token>` — **Super Admin only**

---

## Critical naming distinction

| Layer | Name | Notes |
|-------|------|-------|
| Frontend page | **Language Settings** | UI route under Test Management → Test Configuration |
| Backend model | **TestConfigLanguage** | MongoDB collection for test languages |
| Backend module folder | `testconfiglanguages` | Controller: `testConfigLanguageController.js` |
| Backend display ID | `languageId` | Sequential code (e.g. `LG-4008`) — **not** the API path `:id` |
| API path `:id` | MongoDB `_id` | Always use `_id` from list/create/detail for update, delete, status |
| Blog languages | **`Language`** model | Separate module at `/api/blog` — **not** this API |

Test Configuration languages (`TestConfigLanguage`) are used for **test content language selection** (e.g. Prelims Test, Marketing Blog). They are **not** the blog CMS `Language` model.

---

## 1. Module Overview

### Purpose

**Language Settings** manages the catalog of languages available when configuring tests and related content. Each record is a named language with an active/inactive lifecycle flag.

Each record contains:

- A system-generated **`languageId`** (format `LG-0001`, `LG-4008`, … — 4-digit zero-padded suffix)
- A **`languageName`** (required, unique case-insensitive among non-deleted records)
- A **`status`** (`ACTIVE` | `INACTIVE`)

### What Language Settings manages

| Concern | Managed here? |
|---------|---------------|
| Language name (English, Hindi, Tamil, …) | Yes |
| Active/inactive availability | Yes |
| System display code (`languageId`) | Yes (read-only, auto-generated) |
| Blog CMS languages | **No** — use `/api/blog` |
| Translation strings / i18n locale files | **No** |
| Test question text content | **No** — languages are referenced by other modules |

### How it fits inside Test Management

```
Test Management
  └── Test Configuration
        ├── Exam Pattern          (separate module)
        ├── Section Management    (separate module)
        ├── Language Settings     ← this module
        └── Marking Rules         (separate module)
```

All Test Configuration sub-modules share the mount path prefix `/api/test-configuration` and the same auth gate (`protect` + `requireSuperAdmin`).

### Admin Panel placement

Super Admin navigates:

```
Admin Panel
  → Test Management
    → Test Configuration
      → Language Settings
```

The page typically shows a searchable, paginated table of languages with actions to add, edit, toggle status, and delete.

### Business flow

1. Super Admin opens **Language Settings**.
2. Admin views paginated list with search, status filter, and sorting.
3. Admin creates languages (name + optional status).
4. Admin edits language name and/or status, toggles status via dedicated PATCH endpoint, or soft-deletes a language.
5. Active languages appear in the **languages dropdown** for downstream modules (Prelims Test, Marketing Blog, etc.).

---

## 2. Backend Architecture

There is **no** dedicated Service, Repository, DTO, Joi/Zod validation middleware, or Swagger/OpenAPI spec for Language Settings. Logic lives directly in the controller with shared helpers.

| Layer | File | Role |
|-------|------|------|
| Route mount | `app.js` | `app.use('/api/test-configuration', testConfigurationRoutes)` |
| Routes | `routes/testConfigurationRoutes.js` | Registers 8 Language endpoints; applies `protect`, `requireSuperAdmin` to entire router |
| Controller | `controllers/testConfigLanguageController.js` | Validation, CRUD, formatting, list query building |
| Model | `models/TestConfigLanguage.js` | Mongoose schema, indexes |
| Helpers | `utils/testConfigurationHelpers.js` | Pagination, sort presets, status normalization, search filter, date formatting |
| Helpers | `utils/contentMastersHelpers.js` | `NOT_DELETED`, `parsePagination`, `parseSort`, regex escape |
| ID generator | `utils/contentIdGenerator.js` | `generateTestConfigLanguageId()` → prefix `LG-`, 4-digit padding |
| Auth | `middleware/authMiddleware.js` | `protect` — JWT Bearer validation |
| Auth | `middleware/requireSuperAdmin.js` | Super Admin role gate |
| Permissions | `utils/permissionHelpers.js` | `isSuperAdminRequest()` |

**Not implemented for Language Settings:** separate service layer, repository, DTOs, Joi/Zod middleware, OpenAPI/Swagger, restore endpoint, bulk actions, export/import, hard delete.

### Request flow

```
HTTP Request
  ↓
app.js  (/api/test-configuration)
  ↓
testConfigurationRoutes.js
  ↓
protect (JWT Bearer validation)
  ↓
requireSuperAdmin (roleCode SUPER_ADMIN or legacy super_admin)
  ↓
testConfigLanguageController.js
  ↓
testConfigurationHelpers.js + contentMastersHelpers.js
  ↓
TestConfigLanguage (Mongoose model)
  ↓
MongoDB
  ↓
JSON response { success, message?, data?, total?, page?, ... }
```

### Database schema (`TestConfigLanguage`)

| Field | Type | Notes |
|-------|------|-------|
| `languageId` | String | Unique, trimmed, auto-generated (`LG-0001`) |
| `languageName` | String | Required, trimmed |
| `status` | String | Enum: `ACTIVE` \| `INACTIVE`; default `ACTIVE` |
| `isDeleted` | Boolean | Default `false`; soft-delete flag |
| `deletedAt` | Date | Set on delete; default `null` |
| `createdAt` | Date | Mongoose timestamps |
| `updatedAt` | Date | Mongoose timestamps |

**Indexes:** `{ status: 1, isDeleted: 1 }`, `{ languageName: 1 }`

**Not returned in API responses:** `isDeleted`, `deletedAt`

### Available features (current implementation)

| Feature | Supported |
|---------|-----------|
| Create | Yes |
| List (paginated) | Yes |
| Get by ID | Yes |
| Update (PUT — partial body) | Yes |
| Status change (dedicated PATCH) | Yes |
| Status change via PUT | Yes (optional `status` in body) |
| Soft delete | Yes |
| Hard delete | **No** |
| Restore deleted record | **No** |
| Bulk delete | **No** |
| Bulk status update | **No** |
| Search | Yes — `languageName`, `languageId` |
| Pagination | Yes — `page`, `limit` (max 100) |
| Sorting | Yes — `sortBy` + `sortOrder` or `sortPreset` |
| Status filter | Yes — `ACTIVE` / `INACTIVE` |
| Dropdown (active only) | Yes — GET and POST |
| Export | **No** |
| Import | **No** |

---

## 3. API Discovery

All Language Settings routes require authentication and **Super Admin** role.

**Middleware chain (every route):**

```javascript
router.use(protect, requireSuperAdmin);
```

| # | Method | Endpoint | Purpose |
|---|--------|----------|---------|
| 1 | `POST` | `/api/test-configuration/languages` | Create language |
| 2 | `GET` | `/api/test-configuration/languages` | Paginated list with search, filter, sort |
| 3 | `GET` | `/api/test-configuration/languages/dropdown` | Active languages for dropdowns |
| 4 | `POST` | `/api/test-configuration/languages/dropdown` | Same as GET dropdown |
| 5 | `GET` | `/api/test-configuration/languages/:id` | Get single record by MongoDB `_id` |
| 6 | `PUT` | `/api/test-configuration/languages/:id` | Update name and/or status |
| 7 | `PATCH` | `/api/test-configuration/languages/status/:id` | Update status only |
| 8 | `DELETE` | `/api/test-configuration/languages/:id` | Soft delete |

---

### 3.1 Create Language

| Property | Value |
|----------|-------|
| **HTTP Method** | `POST` |
| **URL** | `/api/test-configuration/languages` |
| **Purpose** | Create a new test configuration language |
| **Authentication** | Required — Bearer token |
| **Role** | Super Admin only |

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
| `languageName` | `string` | Yes* | Trimmed; non-empty; unique (case-insensitive) |
| `language` | `string` | Alt key | Same as `languageName` |
| `name` | `string` | Alt key | Same as `languageName` |
| `status` | `string` | No | `ACTIVE` or `INACTIVE`; default `ACTIVE` |

\*Backend resolves name from `languageName` → `language` → `name` (first defined wins via `??`).

**Validation rules (controller)**

- Missing/blank name after trim → `400` — `"languageName is required"`
- Invalid `status` (when explicitly provided) → `400` — `"Status must be ACTIVE or INACTIVE"`
- Empty/missing `status` → defaults to `ACTIVE`
- Duplicate name (case-insensitive) → `409` — `"Language name already exists"`

**Success response — `201 Created`**

```json
{
  "success": true,
  "message": "Language created successfully",
  "data": {
    "_id": "674a1b2c3d4e5f6789012345",
    "languageId": "LG-4008",
    "languageName": "English",
    "status": "ACTIVE",
    "createdAt": "2026-06-27T10:00:00.000Z",
    "updatedAt": "2026-06-27T10:00:00.000Z",
    "createdOn": "2026-06-27",
    "modifiedOn": "2026-06-27"
  }
}
```

**Error responses**

| Status | Message | When |
|--------|---------|------|
| `400` | `languageName is required` | Name missing or blank |
| `400` | `Status must be ACTIVE or INACTIVE` | Invalid status value |
| `401` | Various auth messages | Missing/invalid token |
| `403` | `Access denied. Super Admin only.` | Non–Super Admin |
| `409` | `Language name already exists` | Duplicate name |
| `500` | `Server error` | Unexpected failure |

**Frontend integration notes**

- Auto-generated fields (`languageId`, timestamps) are read-only in the UI.
- Prefer sending `languageName` (camelCase) for consistency with responses.
- On success, store `data._id` for subsequent edit/delete/status calls.
- Do **not** send `languageId` in create body — backend generates it.

---

### 3.2 List Languages

| Property | Value |
|----------|-------|
| **HTTP Method** | `GET` |
| **URL** | `/api/test-configuration/languages` |
| **Purpose** | Paginated list with search, status filter, sorting |
| **Authentication** | Required |
| **Role** | Super Admin only |

**Headers:** `Authorization: Bearer <token>` (no body)

**Query parameters**

| Param | Type | Required | Default | Validation | Description |
|-------|------|----------|---------|------------|-------------|
| `page` | `number` | No | `1` | ≥ 1 | Page number (1-based) |
| `limit` | `number` | No | `10` | 1–100 | Items per page |
| `search` | `string` | No | `""` | — | Case-insensitive partial match on `languageName` OR `languageId` |
| `status` | `string` | No | — | `ACTIVE` \| `INACTIVE` | Omit for all non-deleted statuses |
| `sortBy` | `string` | No | `createdAt` | See allowed fields | Sort field |
| `sortOrder` | `string` | No | `desc` | `asc` \| `desc` | Sort direction |
| `sortPreset` | `string` | No | — | See presets | UI-friendly sort; overrides `sortBy`/`sortOrder` when valid |

**Allowed `sortBy` values:** `createdAt`, `updatedAt`, `languageName`, `languageId`, `status`

**Allowed `sortPreset` values (Language Settings):**

| Preset | Maps to |
|--------|---------|
| `createdOn_newest` | `createdAt` desc |
| `createdOn_oldest` | `createdAt` asc |
| `modifiedOn_newest` | `updatedAt` desc |
| `modifiedOn_oldest` | `updatedAt` asc |
| `languageName_az` | `languageName` asc |
| `languageName_za` | `languageName` desc |

**Success response — `200 OK`**

```json
{
  "success": true,
  "total": 12,
  "page": 1,
  "limit": 10,
  "totalPages": 2,
  "count": 10,
  "data": [
    {
      "_id": "674a1b2c3d4e5f6789012345",
      "languageId": "LG-4008",
      "languageName": "English",
      "status": "ACTIVE",
      "createdAt": "2026-06-27T10:00:00.000Z",
      "updatedAt": "2026-06-27T10:00:00.000Z",
      "createdOn": "2026-06-27",
      "modifiedOn": "2026-06-27"
    }
  ]
}
```

**Frontend integration notes**

- List uses **GET with query string** (not POST body).
- Deleted records (`isDeleted: true`) are excluded automatically.
- Use `placeholderData: keepPreviousData` during pagination/filter changes.
- Display `createdOn` / `modifiedOn` in table (date-only, `YYYY-MM-DD`).

---

### 3.3 Get Languages Dropdown

| Property | Value |
|----------|-------|
| **HTTP Method** | `GET` or `POST` |
| **URL** | `/api/test-configuration/languages/dropdown` |
| **Purpose** | Active, non-deleted languages for select/dropdown UI |
| **Authentication** | Required |
| **Role** | Super Admin only |

**Path parameters:** None

**Query parameters:** None

**Request body (POST only):** Ignored — handler does not read body.

**Success response — `200 OK`**

```json
{
  "success": true,
  "count": 3,
  "data": [
    {
      "_id": "674a1b2c3d4e5f6789012345",
      "languageId": "LG-4008",
      "languageName": "English"
    },
    {
      "_id": "674a1b2c3d4e5f6789012346",
      "languageId": "LG-4009",
      "languageName": "Hindi"
    }
  ]
}
```

**Frontend integration notes**

- Sorted alphabetically by `languageName` ascending.
- Only `ACTIVE` + non-deleted records returned.
- Dropdown items omit `status`, `createdAt`, etc.
- **Value for downstream APIs:** `_id` (ObjectId string)
- **Label for UI:** `languageName` (optionally prefix with `languageId`)
- POST variant exists for parity with Prelims Test wizard — prefer GET for Language Settings admin page unless matching existing frontend patterns.

---

### 3.4 Get Language by ID

| Property | Value |
|----------|-------|
| **HTTP Method** | `GET` |
| **URL** | `/api/test-configuration/languages/:id` |
| **Purpose** | Fetch single language details |
| **Authentication** | Required |
| **Role** | Super Admin only |

**Path parameters**

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | Yes | MongoDB `_id` (24-char hex ObjectId) |

**Success response — `200 OK`**

```json
{
  "success": true,
  "data": {
    "_id": "674a1b2c3d4e5f6789012345",
    "languageId": "LG-4008",
    "languageName": "English",
    "status": "ACTIVE",
    "createdAt": "2026-06-27T10:00:00.000Z",
    "updatedAt": "2026-06-27T10:00:00.000Z",
    "createdOn": "2026-06-27",
    "modifiedOn": "2026-06-27"
  }
}
```

**Error:** `404` — `"Language not found"` (invalid id, deleted, or non-existent)

---

### 3.5 Update Language

| Property | Value |
|----------|-------|
| **HTTP Method** | `PUT` |
| **URL** | `/api/test-configuration/languages/:id` |
| **Purpose** | Update `languageName` and/or `status` |
| **Authentication** | Required |
| **Role** | Super Admin only |

**Path parameters:** `id` — MongoDB `_id`

**Request body** (partial update — only send fields to change)

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| `languageName` | `string` | No* | If provided: trimmed, non-empty; unique (case-insensitive) |
| `language` | `string` | Alt key | Same as `languageName` |
| `name` | `string` | Alt key | Same as `languageName` |
| `status` | `string` | No | `ACTIVE` or `INACTIVE` when provided |

\*On update, `languageName` is only validated if sent in the body.

**Success response — `200 OK`**

```json
{
  "success": true,
  "message": "Language updated successfully",
  "data": {
    "_id": "674a1b2c3d4e5f6789012345",
    "languageId": "LG-4008",
    "languageName": "English (UK)",
    "status": "INACTIVE",
    "createdAt": "2026-06-27T10:00:00.000Z",
    "updatedAt": "2026-06-27T11:30:00.000Z",
    "createdOn": "2026-06-27",
    "modifiedOn": "2026-06-27"
  }
}
```

**Error responses**

| Status | Message | When |
|--------|---------|------|
| `400` | `languageName cannot be empty` | Name sent but blank after trim |
| `400` | `Status must be ACTIVE or INACTIVE` | Invalid status |
| `404` | `Language not found` | Record missing or soft-deleted |
| `409` | `Language name already exists` | Duplicate name |

**Frontend integration notes**

- `languageId` is **not** updatable.
- Empty PUT body still returns `200` with unchanged record (no server-side "at least one field" check).

---

### 3.6 Update Language Status

| Property | Value |
|----------|-------|
| **HTTP Method** | `PATCH` |
| **URL** | `/api/test-configuration/languages/status/:id` |
| **Purpose** | Update status only |
| **Authentication** | Required |
| **Role** | Super Admin only |

**Path parameters:** `id` — MongoDB `_id`

**Request body**

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| `status` | `string` | Yes | `ACTIVE` or `INACTIVE` |

**Success response — `200 OK`**

```json
{
  "success": true,
  "message": "Language status updated",
  "data": {
    "_id": "674a1b2c3d4e5f6789012345",
    "languageId": "LG-4008",
    "languageName": "English",
    "status": "INACTIVE",
    "createdAt": "2026-06-27T10:00:00.000Z",
    "updatedAt": "2026-06-27T11:30:00.000Z",
    "createdOn": "2026-06-27",
    "modifiedOn": "2026-06-27"
  }
}
```

**Error responses**

| Status | Message | When |
|--------|---------|------|
| `400` | `Status must be ACTIVE or INACTIVE` | Missing or invalid status |
| `404` | `Language not found` | Record missing or soft-deleted |

**Frontend integration notes**

- Use this endpoint for row toggle switches (cleaner than full PUT).
- Status values are case-insensitive on input (`active` → `ACTIVE`).

---

### 3.7 Delete Language

| Property | Value |
|----------|-------|
| **HTTP Method** | `DELETE` |
| **URL** | `/api/test-configuration/languages/:id` |
| **Purpose** | Soft delete language |
| **Authentication** | Required |
| **Role** | Super Admin only |

**Path parameters:** `id` — MongoDB `_id`

**Request body:** None

**Success response — `200 OK`**

```json
{
  "success": true,
  "message": "Language deleted successfully",
  "data": {
    "_id": "674a1b2c3d4e5f6789012345",
    "languageId": "LG-4008"
  }
}
```

**Side effects (backend)**

- Sets `isDeleted: true`
- Sets `deletedAt` to current timestamp
- Sets `status: 'INACTIVE'`

**Error:** `404` — `"Language not found"`

**Frontend integration notes**

- There is **no** linked-record guard in Language Settings delete.
- **Hard delete** and **restore** are **not implemented**.
- After delete, record disappears from list and dropdown.

---

### HTTP status codes summary

| Code | When |
|------|------|
| `200` | Successful GET, PUT, PATCH, DELETE |
| `201` | Successful POST create |
| `400` | Validation error (missing name, empty name, invalid status) |
| `401` | Missing/invalid token, not authenticated |
| `403` | Valid token but not Super Admin; account disabled |
| `404` | Record not found (get/update/status/delete) |
| `409` | Duplicate language name |
| `422` | **Not used** by Language Settings |
| `500` | Server error (includes possible invalid ObjectId CastError) |

---

## 4. Complete Request/Response Examples

### 4.1 Create — success

**Request**

```http
POST /api/test-configuration/languages
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "languageName": "Tamil",
  "status": "ACTIVE"
}
```

**Alternate body (alias key)**

```json
{
  "language": "Hindi",
  "status": "ACTIVE"
}
```

**Response `201`**

```json
{
  "success": true,
  "message": "Language created successfully",
  "data": {
    "_id": "685f1a2b3c4d5e6f78901234",
    "languageId": "LG-4010",
    "languageName": "Tamil",
    "status": "ACTIVE",
    "createdAt": "2026-06-27T14:22:00.000Z",
    "updatedAt": "2026-06-27T14:22:00.000Z",
    "createdOn": "2026-06-27",
    "modifiedOn": "2026-06-27"
  }
}
```

### 4.2 Create — validation failure (missing name)

**Request**

```json
{
  "status": "ACTIVE"
}
```

**Response `400`**

```json
{
  "success": false,
  "message": "languageName is required"
}
```

### 4.3 Create — duplicate name

**Request**

```json
{
  "languageName": "English"
}
```

**Response `409`**

```json
{
  "success": false,
  "message": "Language name already exists"
}
```

### 4.4 Create — invalid status

**Request**

```json
{
  "languageName": "French",
  "status": "ENABLED"
}
```

**Response `400`**

```json
{
  "success": false,
  "message": "Status must be ACTIVE or INACTIVE"
}
```

### 4.5 List — with search, filter, pagination

**Request**

```http
GET /api/test-configuration/languages?search=tamil&status=ACTIVE&page=1&limit=10&sortPreset=languageName_az
Authorization: Bearer <token>
```

**Response `200`**

```json
{
  "success": true,
  "total": 1,
  "page": 1,
  "limit": 10,
  "totalPages": 1,
  "count": 1,
  "data": [
    {
      "_id": "685f1a2b3c4d5e6f78901234",
      "languageId": "LG-4010",
      "languageName": "Tamil",
      "status": "ACTIVE",
      "createdAt": "2026-06-27T14:22:00.000Z",
      "updatedAt": "2026-06-27T14:22:00.000Z",
      "createdOn": "2026-06-27",
      "modifiedOn": "2026-06-27"
    }
  ]
}
```

### 4.6 List — empty result

**Response `200`**

```json
{
  "success": true,
  "total": 0,
  "page": 1,
  "limit": 10,
  "totalPages": 0,
  "count": 0,
  "data": []
}
```

### 4.7 Update — partial (name only)

**Request**

```http
PUT /api/test-configuration/languages/685f1a2b3c4d5e6f78901234
Authorization: Bearer <token>
Content-Type: application/json

{
  "languageName": "Tamil (Classic)"
}
```

**Response `200`**

```json
{
  "success": true,
  "message": "Language updated successfully",
  "data": {
    "_id": "685f1a2b3c4d5e6f78901234",
    "languageId": "LG-4010",
    "languageName": "Tamil (Classic)",
    "status": "ACTIVE",
    "createdAt": "2026-06-27T14:22:00.000Z",
    "updatedAt": "2026-06-27T15:00:00.000Z",
    "createdOn": "2026-06-27",
    "modifiedOn": "2026-06-27"
  }
}
```

### 4.8 Status toggle

**Request**

```http
PATCH /api/test-configuration/languages/status/685f1a2b3c4d5e6f78901234
Authorization: Bearer <token>
Content-Type: application/json

{
  "status": "INACTIVE"
}
```

**Response `200`**

```json
{
  "success": true,
  "message": "Language status updated",
  "data": {
    "_id": "685f1a2b3c4d5e6f78901234",
    "languageId": "LG-4010",
    "languageName": "Tamil (Classic)",
    "status": "INACTIVE",
    "createdAt": "2026-06-27T14:22:00.000Z",
    "updatedAt": "2026-06-27T15:05:00.000Z",
    "createdOn": "2026-06-27",
    "modifiedOn": "2026-06-27"
  }
}
```

### 4.9 Delete

**Request**

```http
DELETE /api/test-configuration/languages/685f1a2b3c4d5e6f78901234
Authorization: Bearer <token>
```

**Response `200`**

```json
{
  "success": true,
  "message": "Language deleted successfully",
  "data": {
    "_id": "685f1a2b3c4d5e6f78901234",
    "languageId": "LG-4010"
  }
}
```

### Field reference summary

| Field | Required (create) | Optional (create) | Updatable | Nullable in response | Format |
|-------|-------------------|-------------------|-----------|----------------------|--------|
| `_id` | Auto | — | No | No | MongoDB ObjectId string |
| `languageId` | Auto | — | No | No | `LG-` + 4 digits |
| `languageName` | Yes | — | Yes | No | Trimmed string |
| `status` | No (default ACTIVE) | Yes | Yes | No | `ACTIVE` \| `INACTIVE` |
| `createdAt` | Auto | — | No | No | ISO 8601 UTC |
| `updatedAt` | Auto | — | No | No | ISO 8601 UTC |
| `createdOn` | Auto | — | No | Can be null if missing date | `YYYY-MM-DD` |
| `modifiedOn` | Auto | — | No | Can be null if missing date | `YYYY-MM-DD` |

---

## 5. Frontend Folder Architecture

Recommended structure (frontend guidance only — no backend changes):

```
src/
  services/
    api.ts
    testConfigLanguageService.ts
  hooks/
    useLanguages.ts
    useCreateLanguage.ts
    useUpdateLanguage.ts
    useDeleteLanguage.ts
    useLanguageDetails.ts
    useLanguagesDropdown.ts
  providers/
    QueryProvider.tsx
  pages/
    LanguageSettings/
      LanguageSettingsPage.tsx
      components/
        LanguageTable.tsx
        LanguageForm.tsx
        LanguageModal.tsx
        DeleteDialog.tsx
        LanguageFilters.tsx
        StatusToggle.tsx
  types/
    language.ts
  utils/
    errorHandler.ts
```

**Principles**

- Components **never** call axios directly.
- All HTTP calls go through `testConfigLanguageService.ts`.
- TanStack Query hooks wrap service functions.
- Types mirror backend response shapes exactly.

---

## 6. Service Layer Example

```typescript
// services/testConfigLanguageService.ts
import api from './api';

const BASE = '/api/test-configuration/languages';

export type LanguageStatus = 'ACTIVE' | 'INACTIVE';

export interface LanguageListParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: LanguageStatus;
  sortBy?: 'createdAt' | 'updatedAt' | 'languageName' | 'languageId' | 'status';
  sortOrder?: 'asc' | 'desc';
  sortPreset?:
    | 'createdOn_newest'
    | 'createdOn_oldest'
    | 'modifiedOn_newest'
    | 'modifiedOn_oldest'
    | 'languageName_az'
    | 'languageName_za';
}

export interface CreateLanguagePayload {
  languageName: string;
  status?: LanguageStatus;
}

export interface UpdateLanguagePayload {
  languageName?: string;
  status?: LanguageStatus;
}

export const getLanguages = (params: LanguageListParams = {}) =>
  api.get(BASE, { params });

export const getLanguageById = (id: string) =>
  api.get(`${BASE}/${id}`);

export const getLanguagesDropdown = () =>
  api.get(`${BASE}/dropdown`);

/** Same handler as GET — supported for Prelims Test wizard parity */
export const postLanguagesDropdown = () =>
  api.post(`${BASE}/dropdown`);

export const createLanguage = (payload: CreateLanguagePayload) =>
  api.post(BASE, payload);

export const updateLanguage = (id: string, payload: UpdateLanguagePayload) =>
  api.put(`${BASE}/${id}`, payload);

export const updateLanguageStatus = (id: string, status: LanguageStatus) =>
  api.patch(`${BASE}/status/${id}`, { status });

export const deleteLanguage = (id: string) =>
  api.delete(`${BASE}/${id}`);
```

**Not available (do not implement calls):**

- `restoreLanguage()`
- `bulkDeleteLanguages()`
- `bulkStatusUpdate()`
- `exportLanguages()` / `importLanguages()`
- `toggleStatus()` as a separate backend endpoint — use `updateLanguageStatus()` (PATCH)

---

## 7. Axios Configuration

```typescript
// services/api.ts
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 30_000,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken'); // or your auth store
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;

    if (status === 401) {
      // Clear token, redirect to Super Admin login
      // e.g. window.location.href = '/login';
    }

    if (status === 403) {
      // Show forbidden toast — Super Admin only
    }

    if (!error.response) {
      // Network error — timeout, offline, CORS
    }

    return Promise.reject(error);
  }
);

export default api;
```

| Requirement | Implementation |
|-------------|----------------|
| Base URL | `import.meta.env.VITE_API_BASE_URL` |
| Authorization | `Bearer ${token}` on every request |
| Timeout | 30s recommended |
| 401 handling | Redirect to login; clear stale token |
| 403 handling | Show "Super Admin only" message |
| Network errors | Generic retry/offline message |
| Retry strategy | Optional for GET list only; **not** required by backend |

**No hardcoded URLs** — never use `localhost:5000` or Render URLs in source code.

---

## 8. Environment Variables

```env
# .env
VITE_API_BASE_URL=https://your-api-host.com
```

```typescript
const baseUrl = import.meta.env.VITE_API_BASE_URL;
// Full language list URL: `${baseUrl}/api/test-configuration/languages`
```

| Variable | Required | Purpose |
|----------|----------|---------|
| `VITE_API_BASE_URL` | Yes | API host without trailing slash |

Vite exposes only `VITE_*` prefixed variables to client code.

---

## 9. React Query Integration

### Query keys

```typescript
export const languageKeys = {
  all: ['testConfigLanguages'] as const,
  lists: () => [...languageKeys.all, 'list'] as const,
  list: (filters: LanguageListParams) =>
    [...languageKeys.lists(), filters] as const,
  details: () => [...languageKeys.all, 'detail'] as const,
  detail: (id: string) => [...languageKeys.details(), id] as const,
  dropdown: () => [...languageKeys.all, 'dropdown'] as const,
};
```

### Queries

```typescript
export function useLanguages(filters: LanguageListParams) {
  return useQuery({
    queryKey: languageKeys.list(filters),
    queryFn: () => getLanguages(filters).then((r) => r.data),
    placeholderData: (prev) => prev,
    staleTime: 30_000,
  });
}

export function useLanguageDetails(id: string | undefined) {
  return useQuery({
    queryKey: languageKeys.detail(id!),
    queryFn: () => getLanguageById(id!).then((r) => r.data),
    enabled: Boolean(id),
  });
}

export function useLanguagesDropdown() {
  return useQuery({
    queryKey: languageKeys.dropdown(),
    queryFn: () => getLanguagesDropdown().then((r) => r.data),
    staleTime: 5 * 60_000,
  });
}
```

### Mutations + cache invalidation

```typescript
export function useCreateLanguage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateLanguagePayload) =>
      createLanguage(payload).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: languageKeys.lists() });
      qc.invalidateQueries({ queryKey: languageKeys.dropdown() });
    },
  });
}

export function useUpdateLanguage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateLanguagePayload }) =>
      updateLanguage(id, payload).then((r) => r.data),
    onSuccess: (_data, { id }) => {
      qc.invalidateQueries({ queryKey: languageKeys.lists() });
      qc.invalidateQueries({ queryKey: languageKeys.detail(id) });
      qc.invalidateQueries({ queryKey: languageKeys.dropdown() });
    },
  });
}

export function useUpdateLanguageStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: LanguageStatus }) =>
      updateLanguageStatus(id, status).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: languageKeys.lists() });
      qc.invalidateQueries({ queryKey: languageKeys.dropdown() });
    },
  });
}

export function useDeleteLanguage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteLanguage(id).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: languageKeys.lists() });
      qc.invalidateQueries({ queryKey: languageKeys.dropdown() });
    },
  });
}
```

### Optimistic updates

**Not required.** Backend does not mandate optimistic UI. Simple invalidation after mutation success is sufficient and matches sibling Test Configuration modules.

### Loading / error states

| State | Source | UI |
|-------|--------|-----|
| List loading | `isLoading` / `isFetching` | Table skeleton or spinner |
| List error | `isError`, `error` | Error banner with retry |
| Create/update pending | `isPending` | Disable submit button |
| Delete pending | `isPending` | Disable confirm button |

---

## 10. Custom Hooks

| Hook | Backend API | Purpose |
|------|-------------|---------|
| `useLanguages(filters)` | GET `/languages` | Paginated list |
| `useLanguageDetails(id)` | GET `/languages/:id` | Edit modal / detail view |
| `useLanguagesDropdown()` | GET `/languages/dropdown` | Select options (if needed on page) |
| `useCreateLanguage()` | POST `/languages` | Create mutation |
| `useUpdateLanguage()` | PUT `/languages/:id` | Update mutation |
| `useUpdateLanguageStatus()` | PATCH `/languages/status/:id` | Status toggle |
| `useDeleteLanguage()` | DELETE `/languages/:id` | Delete mutation |

**Do not create hooks for non-existent APIs** (bulk, restore, export).

---

## 11. UI Integration Flow

### Page load

```
Open Language Settings page
  ↓
useLanguages({ page: 1, limit: 10 })
  ↓
Show loading skeleton
  ↓
Render LanguageTable with data[]
  ↓
Bind pagination to page, total, totalPages
```

### Create

```
User clicks Add Language
  ↓
Open LanguageModal with empty LanguageForm
  ↓
Client validate: languageName required (non-empty trim)
  ↓
useCreateLanguage.mutate({ languageName, status })
  ↓
POST /api/test-configuration/languages
  ↓
201 → toast "Language created successfully"
  ↓
Invalidate list + dropdown queries
  ↓
Close modal → table refreshes
```

### Edit

```
User clicks Edit on row
  ↓
Use row data OR useLanguageDetails(row._id)
  ↓
Populate LanguageForm
  ↓
User submits changes
  ↓
PUT /api/test-configuration/languages/:id
  ↓
200 → toast "Language updated successfully"
  ↓
Invalidate list + detail + dropdown
```

### Delete

```
User clicks Delete → DeleteDialog confirm
  ↓
DELETE /api/test-configuration/languages/:id
  ↓
200 → toast "Language deleted successfully"
  ↓
Invalidate list + dropdown → row removed
```

### Search

```
User types in search box (debounce 300–500ms)
  ↓
Update filters.search
  ↓
Refetch GET /languages?search=...
  ↓
Table updates (matches languageName OR languageId)
```

### Pagination

```
User changes page or page size
  ↓
Update page / limit (limit max 100)
  ↓
Refetch with updated query params
```

### Status change

```
User toggles status on row
  ↓
PATCH /api/test-configuration/languages/status/:id
  ↓
200 → toast "Language status updated"
  ↓
Update badge / invalidate queries
```

### Filters

```
User selects status filter (All / Active / Inactive)
  ↓
Omit status param for "All"
  ↓
Pass status=ACTIVE or status=INACTIVE otherwise
  ↓
Refetch list
```

### Bulk actions

**Not supported by backend.** Do not implement bulk delete or bulk status UI.

---

## 12. Sequence Flow Diagram

```
┌─────────┐
│  Admin  │
└────┬────┘
     │ opens Language Settings
     ▼
┌─────────────────────┐
│ LanguageSettingsPage│
└────┬────────────────┘
     │ useLanguages()
     ▼
┌─────────────────────┐
│   React Query       │
└────┬────────────────┘
     │ queryFn
     ▼
┌─────────────────────────────┐
│ testConfigLanguageService   │
│ getLanguages(params)        │
└────┬────────────────────────┘
     │
     ▼
┌─────────────────────┐
│   Axios (api.ts)    │
│ Bearer token inject │
└────┬────────────────┘
     │ GET /api/test-configuration/languages
     ▼
┌─────────────────────────────┐
│ testConfigurationRoutes.js  │
│ protect → requireSuperAdmin │
└────┬────────────────────────┘
     ▼
┌─────────────────────────────┐
│ testConfigLanguageController│
│ getLanguages()              │
└────┬────────────────────────┘
     ▼
┌─────────────────────┐
│ TestConfigLanguage  │
│ (MongoDB)           │
└────┬────────────────┘
     │ { success, total, data[] }
     ▼
┌─────────────────────┐
│ React Query cache   │
└────┬────────────────┘
     ▼
┌─────────────────────┐
│ LanguageTable UI    │
└─────────────────────┘
```

### Create mutation sequence

```
Admin → LanguageModal → useCreateLanguage
  → testConfigLanguageService.createLanguage()
  → Axios POST /languages
  → createLanguage controller
  → MongoDB insert
  → 201 response
  → invalidateQueries
  → toast + close modal + table refresh
```

---

## 13. Frontend State Flow

| State | Trigger | UI behavior |
|-------|---------|-------------|
| **Idle** | Page mounted, cached data valid | Show table |
| **Loading** | Initial fetch, filter change | Skeleton / spinner |
| **Success** | `success: true` | Render data |
| **Error** | 4xx/5xx or network failure | Error message + retry |
| **Refetch** | Pagination, search, filter | `isFetching` indicator optional |
| **Mutation pending** | Create/update/delete/status | Disable actions |
| **Optimistic update** | Not used | N/A |

---

## 14. Error Handling Guide

Always read `error.response?.data?.message` first — backend uses `{ success: false, message: string }`.

| Status | Backend message examples | Frontend display |
|--------|--------------------------|------------------|
| **400** | `languageName is required`, `languageName cannot be empty`, `Status must be ACTIVE or INACTIVE` | Inline field error or toast; highlight invalid field |
| **401** | `Not authorized, no token`, `Not authorized, token failed`, `Not authenticated` | Clear auth state; redirect to Super Admin login |
| **403** | `Access denied. Super Admin only.`, `Account is disabled` | Full-page forbidden or toast |
| **404** | `Language not found` | Toast; close edit modal; refresh list |
| **409** | `Language name already exists` | Inline error on name field |
| **422** | Not used | — |
| **500** | `Server error` (+ optional `error` field) | Generic error toast; log `error` for support |
| **Network** | No response | "Unable to reach server" + retry button |

```typescript
// utils/errorHandler.ts
import { AxiosError } from 'axios';

interface ApiErrorBody {
  success?: boolean;
  message?: string;
  error?: string;
}

export function getApiErrorMessage(error: unknown, fallback = 'Something went wrong'): string {
  if (error instanceof AxiosError) {
    const data = error.response?.data as ApiErrorBody | undefined;
    if (data?.message) return data.message;
    if (!error.response) return 'Network error. Check your connection.';
  }
  return fallback;
}
```

---

## 15. Validation Rules

Extracted from `testConfigLanguageController.js` and `TestConfigLanguage` model.

| Rule | Create | Update | Details |
|------|--------|--------|---------|
| `languageName` required | Yes | If provided | Trimmed via `String().trim()` |
| `languageName` non-empty | Yes | If provided | Blank → 400 |
| `languageName` unique | Yes | Yes | Case-insensitive exact match among non-deleted |
| `languageName` max length | — | — | **No explicit max** in controller (Mongoose has no maxlength) |
| `status` enum | Optional | Optional | `ACTIVE` \| `INACTIVE` only |
| `status` default | `ACTIVE` | — | When omitted on create |
| `status` normalization | Yes | Yes | Case-insensitive (`active` → `ACTIVE`) |
| Invalid status | 400 | 400 | `"Status must be ACTIVE or INACTIVE"` |
| `languageId` | Auto | Not updatable | Format `LG-` + 4-digit number |
| Request body aliases | `language`, `name` | Same | Resolved to `languageName` |
| Pagination `page` | — | — | Default 1, min 1 |
| Pagination `limit` | — | — | Default 10, min 1, max 100 |
| Search | — | — | Partial, case-insensitive on `languageName`, `languageId` |
| `:id` param | — | — | Valid MongoDB ObjectId expected; invalid may → 500 |

**Unique fields:** `languageId` (system), `languageName` (business rule, case-insensitive)

**Enums:** `status`: `ACTIVE`, `INACTIVE`

**Date formats**

| Field | Format |
|-------|--------|
| `createdAt`, `updatedAt` | ISO 8601 UTC (`2026-06-27T10:00:00.000Z`) |
| `createdOn`, `modifiedOn` | `YYYY-MM-DD` |

---

## 16. Integration Checklist

```
☐ VITE_API_BASE_URL configured
☐ Axios instance created with Bearer interceptor
☐ Super Admin login integrated (POST /api/auth/login-super-admin)
☐ ProtectedRoute + RoleGuard (SUPER_ADMIN) on Language Settings route
☐ testConfigLanguageService.ts created with all 8 endpoint methods
☐ TanStack Query provider configured
☐ useLanguages hook (list with filters in query key)
☐ useLanguageDetails hook (detail)
☐ useLanguagesDropdown hook (optional on admin page)
☐ useCreateLanguage mutation + form validation (languageName required)
☐ useUpdateLanguage mutation (PUT)
☐ useUpdateLanguageStatus mutation (PATCH /status/:id)
☐ useDeleteLanguage mutation with confirmation dialog
☐ Search debounced → search query param
☐ Status filter → status query param
☐ Pagination → page + limit params (max limit 100)
☐ Sort presets wired (languageName_az, languageName_za, createdOn_*, modifiedOn_*)
☐ Table columns: languageId, languageName, status, createdOn, modifiedOn
☐ Error handling via response.data.message
☐ 401 → redirect login; 403 → forbidden; 409 → duplicate name UI
☐ Cache invalidation on all mutations (lists + dropdown)
☐ Loading / empty / error states
☐ Do NOT implement bulk/export/import (not supported)
☐ Use _id for API path :id (not languageId)
☐ Distinguish from blog /api/blog Language APIs in UI copy
☐ API manually tested against backend
☐ UI tested end-to-end
```

---

## 17. Testing Checklist

| Scenario | Expected |
|----------|----------|
| **Create** valid language | `201`, record in list, `languageId` auto-generated |
| **Create** missing name | `400`, `languageName is required` |
| **Create** duplicate name | `409`, case-insensitive (e.g. "english" vs "English") |
| **Create** invalid status | `400` |
| **Create** omit status | `201`, status defaults to `ACTIVE` |
| **List** default | `200`, pagination metadata present |
| **List** search by name | Matching rows returned |
| **List** search by languageId | Matching rows returned |
| **List** status filter | Only ACTIVE or INACTIVE rows |
| **List** sort preset `languageName_az` | Alphabetical order |
| **List** page beyond total | Empty `data[]`, valid metadata |
| **Detail** valid `_id` | `200`, full formatted object |
| **Detail** deleted/invalid id | `404` |
| **Update** name | `200`, `modifiedOn` changes |
| **Update** empty name | `400` |
| **Update** duplicate name | `409` |
| **Status PATCH** | `200`, message `Language status updated` |
| **Status PATCH** invalid | `400` |
| **Delete** | `200`, record removed from list; status set INACTIVE server-side |
| **Dropdown** | Only ACTIVE, sorted by name |
| **Unauthorized** (no token) | `401` |
| **Forbidden** (non–Super Admin) | `403` |
| **Validation errors** | Toast/inline from `message` |
| **Network failure** | Graceful offline message |
| **Empty response** | Empty state UI |
| **Large dataset** | Pagination with limit up to 100 |
| **Concurrent requests** | React Query deduplication; no duplicate creates on double-click |

---

## 18. API Mapping Table

| UI Screen / Action | Service Method | Backend Endpoint | HTTP Method | React Query Hook | Status |
|--------------------|----------------|------------------|-------------|------------------|--------|
| Language Settings — page load | `getLanguages()` | `/api/test-configuration/languages` | GET | `useLanguages()` | ✅ Implemented |
| Language Settings — search | `getLanguages({ search })` | `/api/test-configuration/languages?search=` | GET | `useLanguages()` | ✅ Implemented |
| Language Settings — status filter | `getLanguages({ status })` | `/api/test-configuration/languages?status=` | GET | `useLanguages()` | ✅ Implemented |
| Language Settings — pagination | `getLanguages({ page, limit })` | `/api/test-configuration/languages?page=&limit=` | GET | `useLanguages()` | ✅ Implemented |
| Language Settings — sorting | `getLanguages({ sortBy, sortOrder })` or `sortPreset` | `/api/test-configuration/languages?sortPreset=` | GET | `useLanguages()` | ✅ Implemented |
| Add Language modal — submit | `createLanguage()` | `/api/test-configuration/languages` | POST | `useCreateLanguage()` | ✅ Implemented |
| Edit Language — load detail | `getLanguageById()` | `/api/test-configuration/languages/:id` | GET | `useLanguageDetails()` | ✅ Implemented |
| Edit Language — submit | `updateLanguage()` | `/api/test-configuration/languages/:id` | PUT | `useUpdateLanguage()` | ✅ Implemented |
| Row status toggle | `updateLanguageStatus()` | `/api/test-configuration/languages/status/:id` | PATCH | `useUpdateLanguageStatus()` | ✅ Implemented |
| Delete confirmation | `deleteLanguage()` | `/api/test-configuration/languages/:id` | DELETE | `useDeleteLanguage()` | ✅ Implemented |
| Dropdown (admin or consumer) | `getLanguagesDropdown()` | `/api/test-configuration/languages/dropdown` | GET | `useLanguagesDropdown()` | ✅ Implemented |
| Dropdown POST variant | `postLanguagesDropdown()` | `/api/test-configuration/languages/dropdown` | POST | `useLanguagesDropdown()` | ✅ Implemented |
| Bulk delete | — | — | — | — | ❌ Not implemented |
| Bulk status update | — | — | — | — | ❌ Not implemented |
| Restore deleted | — | — | — | — | ❌ Not implemented |
| Export / Import | — | — | — | — | ❌ Not implemented |

---

## Appendix A — Success Messages

| Action | HTTP | Backend `message` | Frontend handling |
|--------|------|-------------------|-------------------|
| Create | `201` | `Language created successfully` | Success toast; close modal; invalidate list |
| Update | `200` | `Language updated successfully` | Success toast; invalidate list + detail |
| Status change | `200` | `Language status updated` | Success toast; update row status |
| Delete | `200` | `Language deleted successfully` | Success toast; remove from list |
| List | `200` | *(no message)* | Render table silently |
| Detail | `200` | *(no message)* | Populate form |
| Dropdown | `200` | *(no message)* | Populate select options |

Use backend `message` verbatim in toasts for consistency with API docs and Postman collection.

---

## Appendix B — Downstream Consumers

Other backend modules reference `TestConfigLanguage` (frontend may need dropdown integration elsewhere):

| Consumer | Usage |
|----------|-------|
| Subject Prelims Test | `GET`/`POST /api/test-configuration/languages/dropdown` |
| Marketing Blog | Validates language ObjectId against active `TestConfigLanguage` |
| Faculty content helpers | Suggests languages dropdown when validation fails |

The **Language Settings admin page** itself only requires CRUD list APIs — dropdown is optional on that page but should invalidate when mutations run (other pages may cache dropdown data).

---

## Appendix C — Distinction from Blog Language API

| Aspect | Test Config (`/api/test-configuration/languages`) | Blog (`/api/blog/...`) |
|--------|---------------------------------------------------|------------------------|
| Model | `TestConfigLanguage` | `Language` |
| Purpose | Test configuration | Blog CMS |
| Auth | Super Admin | Different module permissions |
| ID field | `languageId` (`LG-4008`) | Blog-specific IDs |

Frontend must **not** mix these APIs on the Language Settings page.

---

## Appendix D — Enterprise Safety Verification

| Item | Status |
|------|--------|
| Backend code unchanged | ✅ Documentation only |
| API routes unchanged | ✅ 8 endpoints as registered in `testConfigurationRoutes.js` |
| HTTP methods unchanged | ✅ POST, GET, PUT, PATCH, DELETE as implemented |
| Request payloads unchanged | ✅ `languageName` / aliases, `status` only |
| Response structures unchanged | ✅ `formatLanguage()` shape documented |
| Authentication unchanged | ✅ JWT Bearer via `protect` |
| Authorization unchanged | ✅ Super Admin via `requireSuperAdmin` |
| Validation unchanged | ✅ Inline controller rules documented |
| Business logic unchanged | ✅ Soft delete, duplicate check, search/filter/sort |
| Database schema unchanged | ✅ `TestConfigLanguage` model fields documented |
| Frontend can integrate with confidence | ✅ All behaviour sourced from implementation |

---

*Generated from backend source: `controllers/testConfigLanguageController.js`, `models/TestConfigLanguage.js`, `routes/testConfigurationRoutes.js`, `utils/testConfigurationHelpers.js`.*
