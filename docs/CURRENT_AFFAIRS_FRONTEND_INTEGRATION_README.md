# CURRENT AFFAIRS FRONTEND INTEGRATION README

> **Official integration source of truth for Current Affairs module frontend development**  
> Admin API base: `/api/current-affairs` · Public portal API base: `/api/portal/current-affairs`  
> MongoDB collections: `current_affairs`, `current_affair_questions`  
> Swagger: `http://localhost:5000/api-docs` (when backend runs locally)

---

## Module Overview

### Purpose

The **Current Affairs** module manages UPSC preparation content across five content types:

| Category value | UI label (portal) | Content type |
|----------------|-------------------|--------------|
| `CURRENT_AFFAIRS` | Daily Current Affairs | PDF resource |
| `MONTHLY_MAGAZINE` | Monthly Magazine | Two PDFs (`pdf` + `uploadMagzine`) |
| `INFOGRAPHICS` | Infographics | PDF resource |
| `MONTHLY_RECAP` | Monthly Recap | PDF resource |
| `DAILY_PRACTICE_QUESTIONS` | Daily Practice Questions | MCQ paper with questions |

The module serves two frontends:

1. **Admin CMS** — create, update, delete, list, and manage status for all content types; manage daily-practice questions.
2. **Student/public portal** — browse active content, view/download PDFs, take daily-practice quizzes, and submit answers for evaluation.

### Backend Architecture

```text
app.js
├── app.use('/api/current-affairs', currentAffairsRoutes)        → Admin CMS
└── app.use('/api/portal/current-affairs', portalCurrentAffairsRoutes) → Public portal

Admin request flow:
Route → cmsAdminAuth [protect + allowCmsAdmin] → (paginate | upload | validate) → Controller → Service → Model → MongoDB

Portal request flow:
Route → optionalAuth → Controller → currentAffairPublicService → Model → MongoDB
```

**Key source files:**

| Layer | Path |
|-------|------|
| Admin routes | `routes/currentAffairsRoutes.js` |
| Portal routes | `routes/portalCurrentAffairsRoutes.js` |
| Admin controllers | `controllers/currentAffairController.js`, `controllers/dailyPracticeController.js` |
| Portal controller | `controllers/portalCurrentAffairsController.js` |
| Admin CMS service | `services/currentAffairCmsService.js` |
| Daily practice service | `services/dailyPracticeService.js` |
| Portal service | `services/currentAffairPublicService.js` |
| Models | `models/CurrentAffair.js`, `models/CurrentAffairQuestion.js` |
| Validation | `validations/currentAffairValidation.js` |
| Enums | `utils/currentAffairEnums.js`, `utils/currentAffairConstants.js` |
| Upload middleware | `middleware/currentAffairUpload.js`, `middleware/dailyPracticeUpload.js` |
| Auth | `middleware/cmsAdminAuth.js`, `middleware/optionalAuth.js` |

### Entity Relationships

```text
CurrentAffair (current_affairs)
├── category: enum (no separate Category collection)
├── createdBy / updatedBy → User (ObjectId)
├── pdfUrl, uploadMagzineUrl → Cloudinary (folder: current-affairs)
└── 1:N → CurrentAffairQuestion (current_affair_questions)
         └── currentAffairId → CurrentAffair._id
         └── imageUrl → Cloudinary (folder: current-affairs/question-images)
```

**Important:** This module does **not** use separate `Category`, `Subject`, `Topic`, `Author`, `Mentor`, `Faculty`, or `Tag` collections. `category` is a string enum on `CurrentAffair`. Dropdown values for admin forms come from backend enum constants (documented below) or from the portal filters API.

### Data Flow

1. **PDF content (admin):** `multipart/form-data` → multer → Joi validation → Cloudinary upload → `CurrentAffair.create()` → edit-shaped JSON response.
2. **Daily practice (admin):** JSON or `multipart/form-data` → service validation → `CurrentAffair` + `CurrentAffairQuestion` insert → section range auto-sync.
3. **Portal list:** query filters → `CurrentAffair.find({ status: true, ... })` → card-shaped items with `categoryLabel`.
4. **Portal quiz:** fetch questions (no `correctAnswer`) → user submits answers → server evaluates and returns review with `correctAnswer`.

### Legacy System (Do Not Mix)

A separate **Resources module** (`/api/resources/*`) uses `Resource`, `ResourceCategory`, and `Filter` models with `moduleType: 'CURRENT_AFFAIRS'`. That system is **not** wired to `/api/portal/current-affairs`. Use the primary CMS APIs documented here. **Do not mix IDs** between the two systems.

---

## API Base URL

### Environment Variable

```env
VITE_API_BASE_URL=http://localhost:5000
```

Default backend port: `5000` (`process.env.PORT || 5000` in `server.js`).

### Frontend Integration Example

```typescript
// src/lib/api.ts
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export const apiClient = {
  admin: `${API_BASE_URL}/api/current-affairs`,
  portal: `${API_BASE_URL}/api/portal/current-affairs`,
};

// Authenticated admin request
const token = localStorage.getItem('accessToken');
const response = await fetch(`${apiClient.admin}?page=1&limit=10`, {
  headers: {
    Authorization: `Bearer ${token}`,
  },
});
```

---

## ROUTES INVENTORY

### Admin CMS — `/api/current-affairs`

All routes require **Bearer JWT** and **CMS admin role** (`cmsAdminAuth`).

| Method | Endpoint | Auth Required | Role Required | Description |
|--------|----------|---------------|---------------|-------------|
| `GET` | `/api/current-affairs` | Yes | `super_admin` / `center_admin` or `SUPER_ADMIN` / `CENTER_ADMIN` | Paginated list with filters |
| `POST` | `/api/current-affairs` | Yes | CMS admin | Create PDF-based current affair |
| `GET` | `/api/current-affairs/:id` | Yes | CMS admin | Get single record (edit shape) |
| `PUT` | `/api/current-affairs/:id` | Yes | CMS admin | Update record (partial) |
| `DELETE` | `/api/current-affairs/:id` | Yes | CMS admin | Permanent delete |
| `PATCH` | `/api/current-affairs/:id/status` | Yes | CMS admin | Toggle `status` boolean |
| `GET` | `/api/current-affairs/daily-practice/mains-categories` | Yes | CMS admin | Mains category dropdown |
| `GET` | `/api/current-affairs/daily-practice/questions/bulk-template` | Yes | CMS admin | Download XLSX bulk template |
| `POST` | `/api/current-affairs/daily-practice` | Yes | CMS admin | Create daily practice paper |
| `DELETE` | `/api/current-affairs/daily-practice/:id` | Yes | CMS admin | Delete daily practice set |
| `POST` | `/api/current-affairs/:id/questions/bulk-upload` | Yes | CMS admin | Bulk import questions |
| `GET` | `/api/current-affairs/:id/questions` | Yes | CMS admin | List questions (includes `correctAnswer`) |
| `POST` | `/api/current-affairs/:id/questions` | Yes | CMS admin | Add single question |
| `PUT` | `/api/current-affairs/:id/questions/:questionId` | Yes | CMS admin | Update question |
| `DELETE` | `/api/current-affairs/:id/questions/:questionId` | Yes | CMS admin | Delete question |

### Public Portal — `/api/portal/current-affairs`

All routes use **optional auth** — guest access allowed; valid Bearer token attaches `req.user` if active.

| Method | Endpoint | Auth Required | Role Required | Description |
|--------|----------|---------------|---------------|-------------|
| `GET` | `/api/portal/current-affairs` | No (optional) | None | List active resources |
| `GET` | `/api/portal/current-affairs/resources` | No (optional) | None | Same handler as `GET /` |
| `GET` | `/api/portal/current-affairs/filters` | No (optional) | None | Dynamic filter dropdowns |
| `GET` | `/api/portal/current-affairs/:id` | No (optional) | None | Single resource detail |
| `GET` | `/api/portal/current-affairs/:id/view` | No (optional) | None | Detail + `viewUrl` |
| `GET` | `/api/portal/current-affairs/:id/download` | No (optional) | None | Detail + `downloadUrl` |
| `GET` | `/api/portal/current-affairs/:id/questions` | No (optional) | None | Daily practice questions (no correct answer) |
| `POST` | `/api/portal/current-affairs/:id/submit` | No (optional) | None | Submit MCQ answers for evaluation |

---

## AUTHENTICATION REQUIREMENTS

### Admin CMS (`/api/current-affairs`)

**Middleware chain:** `protect` → `allowCmsAdmin`

**Required header:**

```http
Authorization: Bearer <JWT_TOKEN>
```

**Allowed identities:**

| Auth type | Allowed roles |
|-----------|---------------|
| `User` (`req.user`) | `super_admin`, `center_admin` |
| `AdminAccess` (`req.adminAccess`) | Role code `SUPER_ADMIN`, `CENTER_ADMIN` |

**JWT verification:** `jwt.verify(token, process.env.JWT_SECRET)` in `middleware/authMiddleware.js`.

**401 responses (from `protect`):**

```json
{ "success": false, "message": "Not authorized, no token" }
```

```json
{ "success": false, "message": "Not authorized, token failed" }
```

```json
{ "success": false, "message": "User not found" }
```

```json
{ "success": false, "message": "Not authorized, admin not found" }
```

**403 responses:**

```json
{ "success": false, "message": "Account is deactivated" }
```

```json
{ "success": false, "message": "Account is disabled" }
```

```json
{ "success": false, "message": "Access denied. Insufficient permissions." }
```

### Public Portal (`/api/portal/current-affairs`)

**Middleware:** `optionalAuth`

- No `Authorization` header → request proceeds as guest.
- Valid Bearer token with active user → `req.user` attached.
- Invalid/expired token → silently ignored; request proceeds as guest.

**No role restrictions** on portal routes.

### RBAC Feature Key

Admin permission matrix may reference `featureKey: "CURRENT_AFFAIRS"`, but route-level access is enforced by `cmsAdminAuth` only (not per-feature permission checks on individual endpoints).

---

## CURRENT AFFAIRS DATA MODEL

### `CurrentAffair` — collection `current_affairs`

| Field | Type | Required | Validation / Enum | Default | Notes |
|-------|------|----------|-------------------|---------|-------|
| `category` | `String` | **Yes** | `CURRENT_AFFAIRS`, `MONTHLY_MAGAZINE`, `INFOGRAPHICS`, `MONTHLY_RECAP`, `DAILY_PRACTICE_QUESTIONS` | — | Cannot change on update |
| `title` | `String` | Conditional | Max 300 chars (Joi on create) | — | Required for PDF categories |
| `magazineName` | `String` | No | Trimmed | — | Legacy alias; mapped to `title` in validation |
| `year` | `Number` | Conditional | Must be one of: `2026`, `2027`, `2028`, `2029`, `2030`, `2031` | — | Required for all categories |
| `month` | `String` | Conditional | `January` … `December` (full names) | — | Required for all categories |
| `description` | `String` | No | Max 5000 chars | — | Stripped/ignored for `CURRENT_AFFAIRS` and daily practice |
| `mainsCategory` | `String` | Daily practice only | `PRELIMS`, `MAINS` | — | Also accepts `Prelims`/`Mains`/`PRELIM` on input |
| `paperName` | `String` | Daily practice only | Max 300 chars | — | Stored as `title` as well |
| `date` | `Date` | Daily practice only | ISO date string | — | Required on daily practice create |
| `sectionFrom` | `Number` | Daily practice | Min `1` | — | Auto-synced from question numbers |
| `sectionTo` | `Number` | Daily practice | Min `1`, must be ≥ `sectionFrom` | — | Auto-synced from question numbers |
| `pdfUrl` | `String` | PDF categories | Cloudinary URL | — | Required on create for PDF categories |
| `pdfPublicId` | `String` | Internal | — | — | **Excluded** from list/detail API responses |
| `uploadMagzineUrl` | `String` | `MONTHLY_MAGAZINE` only | Cloudinary URL | — | Required on create for monthly magazine |
| `uploadMagzinePublicId` | `String` | Internal | — | — | **Excluded** from API responses |
| `imageUrl` | `String` | Internal | PDF first-page thumbnail | — | **Excluded** from API responses |
| `status` | `Boolean` | No | `true` / `false` | `true` | Active/inactive toggle |
| `createdBy` | `ObjectId` → `User` | No | — | — | Populated: `name`, `email`, `role` |
| `updatedBy` | `ObjectId` → `User` | No | — | `null` | Populated: `name`, `email`, `role` |
| `createdAt` | `Date` | Auto | — | — | Timestamp |
| `updatedAt` | `Date` | Auto | — | — | Timestamp |

### `CurrentAffairQuestion` — collection `current_affair_questions`

| Field | Type | Required | Validation / Enum | Default | Notes |
|-------|------|----------|-------------------|---------|-------|
| `currentAffairId` | `ObjectId` → `CurrentAffair` | **Yes** | — | — | Indexed |
| `questionNumber` | `Number` | **Yes** | Min `1`; unique per paper | — | |
| `question` | `String` | **Yes** | Trimmed | — | |
| `optionA` | `String` | **Yes** | Trimmed | — | |
| `optionB` | `String` | **Yes** | Trimmed | — | |
| `optionC` | `String` | **Yes** | Trimmed | — | |
| `optionD` | `String` | **Yes** | Trimmed | — | |
| `correctAnswer` | `String` | **Yes** | `A`, `B`, `C`, `D` | — | Exposed on admin APIs only |
| `explanation` | `String` | No | Trimmed | `""` | |
| `imageUrl` | `String` | No | Cloudinary URL | — | |
| `imagePublicId` | `String` | Internal | — | — | Not in API responses |
| `createdAt` | `Date` | Auto | — | — | |
| `updatedAt` | `Date` | Auto | — | — | |

**Unique index:** `{ currentAffairId: 1, questionNumber: 1 }`

---

## CREATE CURRENT AFFAIR

### Endpoint

```http
POST /api/current-affairs
```

**Auth:** CMS admin  
**Content-Type:** `multipart/form-data`

### Request Payload (Form Fields)

| Field | Required | Type | Validation |
|-------|----------|------|------------|
| `category` | **Yes** | string | One of: `CURRENT_AFFAIRS`, `MONTHLY_MAGAZINE`, `INFOGRAPHICS`, `MONTHLY_RECAP`. **Not** `DAILY_PRACTICE_QUESTIONS` |
| `title` | **Yes** | string | Max 300 chars, non-empty |
| `year` | **Yes** | number/string | One of: 2026–2031 |
| `month` | **Yes** | string | Full month name (`January` … `December`) |
| `description` | No | string | Max 5000 chars; ignored for `CURRENT_AFFAIRS` |
| `status` | No | boolean/string | `"true"` / `"false"` parsed to boolean; default `true` |
| `pdf` | **Yes*** | file | PDF only, max 10 MB |
| `uploadMagzine` | **Yes**** | file | PDF only, max 10 MB; only for `MONTHLY_MAGAZINE` |

\* Required for all PDF categories (`CURRENT_AFFAIRS`, `MONTHLY_MAGAZINE`, `INFOGRAPHICS`, `MONTHLY_RECAP`).  
\*\* Required only when `category === MONTHLY_MAGAZINE`.

**Legacy alias:** `magazineName` is accepted and mapped to `title` if `title` is not provided.

### Validation Rules

- `DAILY_PRACTICE_QUESTIONS` category rejected with message to use `POST /api/current-affairs/daily-practice`.
- `description` is deleted from payload for `CURRENT_AFFAIRS` category before save.
- PDF mimetype must be `application/pdf`.
- File size limit: **10 MB** per PDF field.

### Success Response — `201 Created`

```json
{
  "success": true,
  "message": "Current affairs created successfully",
  "data": {
    "_id": "665a1b2c3d4e5f6789012345",
    "category": "CURRENT_AFFAIRS",
    "title": "June 2026 Daily CA",
    "year": 2026,
    "month": "June",
    "pdfUrl": "https://res.cloudinary.com/.../file.pdf",
    "description": null,
    "status": true,
    "createdBy": { "_id": "...", "name": "Admin", "email": "admin@example.com", "role": "super_admin" },
    "updatedBy": null,
    "createdAt": "2026-06-15T10:00:00.000Z",
    "updatedAt": "2026-06-15T10:00:00.000Z"
  }
}
```

For `MONTHLY_MAGAZINE`, `data` also includes `uploadMagzineUrl`.

### Error Responses

**400 — Validation failed:**

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    { "field": "year", "message": "year is required for this category" }
  ]
}
```

**400 — Wrong category:**

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "category",
      "message": "Use POST /api/current-affairs/daily-practice for Daily Practice Questions"
    }
  ]
}
```

**400 — File errors:**

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [{ "field": "pdf", "message": "PDF file size must not exceed 10 MB" }]
}
```

**500:**

```json
{
  "success": false,
  "message": "Failed to create current affair"
}
```

### Frontend Form Mapping

| Backend Field | Frontend Component | Notes |
|---------------|-------------------|-------|
| `category` | `<Select>` | Enum values from constants below |
| `title` | `<Input>` | Max 300 chars |
| `year` | `<Select>` | 2026–2031 |
| `month` | `<Select>` | Full month names |
| `description` | `<Textarea>` | Hide for `CURRENT_AFFAIRS` |
| `status` | `<Switch>` / `<Checkbox>` | Default checked (`true`) |
| `pdf` | `<FileInput accept="application/pdf">` | Required |
| `uploadMagzine` | `<FileInput accept="application/pdf">` | Show only for `MONTHLY_MAGAZINE` |

---

## UPDATE CURRENT AFFAIR

### Endpoint

```http
PUT /api/current-affairs/:id
```

**Auth:** CMS admin  
**Content-Type:** `multipart/form-data`

### Request Payload (Partial — send only fields to change)

| Field | Type | Validation |
|-------|------|------------|
| `title` | string | Max 300; cannot be empty string |
| `year` | number/string | 2026–2031 |
| `month` | string | Full month name |
| `description` | string | Max 5000; stripped for `CURRENT_AFFAIRS` |
| `status` | boolean/string | `true` / `false` |
| `pdf` | file | PDF, max 10 MB; replaces existing |
| `uploadMagzine` | file | PDF, max 10 MB; only for `MONTHLY_MAGAZINE` |
| `mainsCategory` | string | `PRELIMS` / `MAINS` (daily practice only) |
| `paperName` | string | Max 300 (daily practice only) |
| `date` | string | ISO date (daily practice only) |
| `sectionFrom` | number | Min 1 (daily practice only) |
| `sectionTo` | number | Min 1, ≥ `sectionFrom` (daily practice only) |

**Rules:**

- At least one body field **or** a new `pdf` / `uploadMagzine` file is required.
- `category` **cannot be changed** on update (returns 400).
- `uploadMagzine` upload rejected for non-`MONTHLY_MAGAZINE` records.

### Success Response — `200 OK`

```json
{
  "success": true,
  "message": "Current affair updated successfully",
  "data": { /* edit-shaped record */ }
}
```

### Error Responses

**400 — Empty update:**

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "body",
      "message": "Send at least one field to update or attach a new pdf / uploadMagzine file"
    }
  ]
}
```

**400 — Category change:**

```json
{
  "success": false,
  "message": "Category cannot be changed on update"
}
```

**404:**

```json
{
  "success": false,
  "message": "Current affair not found"
}
```

### Frontend Update Flow

1. Fetch record via `GET /api/current-affairs/:id`.
2. Pre-fill form with returned `data`.
3. On submit, build `FormData` with only changed fields.
4. Attach new PDF files only if user selected replacements.
5. `PUT` to `/api/current-affairs/:id`.
6. Invalidate list and detail queries on success.

---

## DELETE CURRENT AFFAIR

### Endpoint

```http
DELETE /api/current-affairs/:id
```

**Auth:** CMS admin

### Requirements

- Record must exist.
- **Permanent delete** — removes Cloudinary PDFs, magazine PDFs, question images, and all linked `CurrentAffairQuestion` documents.

### Success Response — `200 OK`

```json
{
  "success": true,
  "message": "Current affair permanently deleted",
  "data": { /* deleted snapshot (edit shape) */ }
}
```

### Error Responses

**404:**

```json
{
  "success": false,
  "message": "Current affair not found"
}
```

### Daily Practice Delete

```http
DELETE /api/current-affairs/daily-practice/:id
```

Same permanent-delete behavior. Message: `"Daily practice set permanently deleted"`.

### Frontend Delete Flow

1. Show confirmation dialog (permanent action).
2. `DELETE /api/current-affairs/:id` (or `/daily-practice/:id` for daily practice sets).
3. On success, redirect to list and invalidate queries.
4. On 404, show "not found" and refresh list.

---

## GET LIST API

### Admin List

```http
GET /api/current-affairs
```

**Auth:** CMS admin  
**Middleware:** `paginate`

#### Query Parameters

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `page` | integer | `1` | Page number |
| `limit` | integer | `10` | Items per page |
| `sortBy` | string | `createdAt` | Field to sort by |
| `sortOrder` | `asc` / `desc` | `desc` | Sort direction |
| `category` | enum | — | Filter by category value |
| `year` | number | — | Filter by year |
| `month` | string | — | Filter by full month name |
| `status` | boolean/string | — | `true` / `false` or `"true"` / `"false"` |
| `search` | string | — | Case-insensitive regex on `title`, `magazineName`, `paperName`, `description` |

#### Example URLs

```text
GET /api/current-affairs?page=1&limit=10&sortBy=createdAt&sortOrder=desc
GET /api/current-affairs?category=MONTHLY_MAGAZINE&year=2026&status=true
GET /api/current-affairs?search=June&month=June
```

#### Success Response — `200 OK`

```json
{
  "success": true,
  "message": "Current affairs fetched successfully",
  "count": 10,
  "total": 42,
  "page": 1,
  "limit": 10,
  "totalPages": 5,
  "hasNextPage": true,
  "hasPrevPage": false,
  "data": [
    {
      "_id": "...",
      "category": "CURRENT_AFFAIRS",
      "title": "June 2026 Daily CA",
      "year": 2026,
      "month": "June",
      "pdfUrl": "https://...",
      "status": true,
      "createdBy": { "_id": "...", "name": "Admin", "email": "...", "role": "..." },
      "updatedBy": null,
      "createdAt": "...",
      "updatedAt": "..."
    }
  ]
}
```

**List item shapes:**

- **PDF categories:** card shape (`_id`, `category`, `title`, `year`, `month`, `pdfUrl`, `status`, audit fields, `uploadMagzineUrl` for monthly magazine).
- **Daily practice:** full edit shape with `questions[]`, `questionCount`, `mainsCategory`, `paperName`, `date`, `sectionFrom`, `sectionTo`.

**Excluded from all list responses:** `pdfPublicId`, `uploadMagzinePublicId`, `imageUrl`.

### Portal List

```http
GET /api/portal/current-affairs
GET /api/portal/current-affairs/resources
```

Both endpoints use the same handler.

#### Query Parameters

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `category` | enum | — | Filter by category |
| `year` | number | — | Filter by year |
| `month` | string/number | — | Full name or `1`–`12` |
| `mainsCategory` | string | — | `PRELIMS` / `MAINS` |
| `date` | string | — | ISO date (single-day filter) |
| `search` | string | — | Text search on title fields |
| `status` | boolean/string | `true` | Only active records by default |

**Important:** Portal routes do **not** use `paginate` middleware. `page`, `limit`, `sortBy`, and `sortOrder` query params are **not honored**. Pagination is fixed at **page 1, limit 12**, sorted by `createdAt` descending.

#### Example URLs

```text
GET /api/portal/current-affairs?category=CURRENT_AFFAIRS&year=2026
GET /api/portal/current-affairs?mainsCategory=PRELIMS&date=2026-06-15
GET /api/portal/current-affairs/resources?search=magazine&month=June
```

#### Success Response — `200 OK` (double-wrapped)

```json
{
  "success": true,
  "data": {
    "success": true,
    "count": 12,
    "total": 45,
    "page": 1,
    "limit": 12,
    "totalPages": 4,
    "hasNextPage": true,
    "hasPrevPage": false,
    "data": [
      {
        "_id": "...",
        "category": "CURRENT_AFFAIRS",
        "categoryLabel": "Daily Current Affairs",
        "title": "June 2026 Daily CA",
        "year": 2026,
        "month": "June",
        "mainsCategory": null,
        "mainsCategoryLabel": null,
        "date": null,
        "pdfUrl": "https://...",
        "description": "",
        "sectionFrom": null,
        "sectionTo": null,
        "status": true,
        "createdAt": "...",
        "updatedAt": "..."
      }
    ]
  }
}
```

**Frontend note:** Access items at `response.data.data`. Pagination metadata is at `response.data` (not root).

`uploadMagzineUrl` is included only for `MONTHLY_MAGAZINE` items.

---

## GET SINGLE RECORD API

### Admin

```http
GET /api/current-affairs/:id
```

**Success `200`:**

```json
{
  "success": true,
  "message": "Current affair fetched successfully",
  "data": {
    "_id": "...",
    "category": "DAILY_PRACTICE_QUESTIONS",
    "title": "Prelims Paper 1",
    "paperName": "Prelims Paper 1",
    "mainsCategory": "PRELIMS",
    "year": 2026,
    "month": "June",
    "date": "2026-06-15",
    "sectionFrom": 1,
    "sectionTo": 10,
    "questions": [ /* full question objects with correctAnswer */ ],
    "questionCount": 10,
    "status": true,
    "createdBy": { ... },
    "updatedBy": null,
    "createdAt": "...",
    "updatedAt": "..."
  }
}
```

### Portal

```http
GET /api/portal/current-affairs/:id
```

Returns card shape for **active** records only (`status: true`).

**404:**

```json
{
  "success": false,
  "message": "Resource not found"
}
```

### View / Download

```http
GET /api/portal/current-affairs/:id/view
GET /api/portal/current-affairs/:id/download
```

Both return card shape plus:

- `view`: adds `viewUrl` (PDF URL)
- `download`: adds `downloadUrl` (PDF URL); message `"Download tracked"`

### Frontend Detail Page Mapping

| UI Section | Admin field | Portal field |
|------------|-------------|--------------|
| Title | `data.title` | `data.title` |
| Category badge | `data.category` | `data.categoryLabel` |
| Year / Month | `data.year`, `data.month` | `data.year`, `data.month` |
| PDF viewer | `data.pdfUrl` | `data.viewUrl` or `data.pdfUrl` |
| Magazine download | `data.uploadMagzineUrl` | `data.uploadMagzineUrl` |
| Status toggle | `data.status` | N/A (always active) |
| Questions table | `data.questions` | `GET /:id/questions` |
| Audit info | `data.createdBy`, `data.updatedBy` | N/A |

---

## DROPDOWN APIs

This module does **not** expose separate Subject, Topic, Author, Mentor, Faculty, or Tag dropdown APIs. Use the endpoints and static enums below.

### Portal Dynamic Filters

```http
GET /api/portal/current-affairs/filters
```

**Auth:** None required (optional JWT)

**Response `200`:**

```json
{
  "success": true,
  "data": {
    "categories": [
      { "_id": "CURRENT_AFFAIRS", "value": "CURRENT_AFFAIRS", "label": "Daily Current Affairs" }
    ],
    "years": [
      { "_id": "2026", "value": "2026" }
    ],
    "months": [
      { "_id": "June", "value": "June", "label": "June" }
    ],
    "mainsCategories": [
      { "_id": "PRELIMS", "value": "PRELIMS", "label": "Prelims" }
    ],
    "dates": [
      { "_id": "2026-06-15", "value": "2026-06-15", "label": "2026-06-15" }
    ]
  }
}
```

Values are derived from **active** (`status: true`) records in the database.

**Frontend select mapping:**

```typescript
<Select options={filters.categories} valueKey="value" labelKey="label" />
<Select options={filters.years} valueKey="value" />
<Select options={filters.months} valueKey="value" labelKey="label" />
<Select options={filters.mainsCategories} valueKey="value" labelKey="label" />
<Select options={filters.dates} valueKey="value" labelKey="label" />
```

### Admin Mains Categories

```http
GET /api/current-affairs/daily-practice/mains-categories
```

**Auth:** CMS admin

**Response `200`:**

```json
{
  "success": true,
  "message": "Mains categories fetched successfully",
  "data": ["PRELIMS", "MAINS"]
}
```

### Admin Static Enums (no dedicated API — hardcode from backend constants)

Use these values directly in admin create/edit forms:

**Categories (PDF create):**

```typescript
const CATEGORIES = [
  { value: 'CURRENT_AFFAIRS', label: 'Daily Current Affairs' },
  { value: 'MONTHLY_MAGAZINE', label: 'Monthly Magazine' },
  { value: 'INFOGRAPHICS', label: 'Infographics' },
  { value: 'MONTHLY_RECAP', label: 'Monthly Recap' },
];
```

**All categories (list filter):** add `DAILY_PRACTICE_QUESTIONS`.

**Months:**

```typescript
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
```

**Years:**

```typescript
const YEARS = [2026, 2027, 2028, 2029, 2030, 2031];
```

**Correct answers (question forms):**

```typescript
const CORRECT_ANSWERS = ['A', 'B', 'C', 'D'];
```

---

## FILE UPLOADS

### PDF Upload (Create/Update Current Affair)

| Property | Value |
|----------|-------|
| Endpoint | `POST /api/current-affairs`, `PUT /api/current-affairs/:id` |
| Content-Type | `multipart/form-data` |
| Fields | `pdf` (required on create for PDF categories), `uploadMagzine` (required on create for `MONTHLY_MAGAZINE`) |
| Allowed type | `application/pdf` only |
| Max size | **10 MB** per file |
| Storage | Cloudinary folder `current-affairs` |
| Returned URL | `pdfUrl` (all PDF categories), `uploadMagzineUrl` (monthly magazine only) |

**Monthly Magazine has two PDFs:**

- `pdf` — card/thumbnail source (generates internal `imageUrl` from first page; not returned in API).
- `uploadMagzine` — downloadable magazine file.

### Daily Practice Bulk Upload (Create Paper)

| Property | Value |
|----------|-------|
| Endpoint | `POST /api/current-affairs/daily-practice` |
| Field | `file` (optional alternative to `questions[]`) |
| Allowed types | XLSX, CSV (`text/csv`, `application/vnd.ms-excel`, `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`) |
| Max size | **15 MB** |
| Mutually exclusive | Cannot send both `file` and `questions[]` |

### Question Bulk Upload (Existing Paper)

| Property | Value |
|----------|-------|
| Endpoint | `POST /api/current-affairs/:id/questions/bulk-upload` |
| Field | `file` (required) |
| Optional field | `replace` — `true` deletes existing questions first; default appends with renumbered `startFrom` |
| Allowed types | XLSX, CSV |
| Max size | **15 MB** |

**Bulk template columns:** `Question No`, `Question`, `Option 1`, `Option 2`, `Option 3`, `Option 4`, `Correct Answer`, `Explanation`

**Download template:**

```http
GET /api/current-affairs/daily-practice/questions/bulk-template
```

Returns XLSX file: `daily-practice-questions-template.xlsx`

### Question Image Upload

| Property | Value |
|----------|-------|
| Endpoints | `POST /api/current-affairs/:id/questions`, `PUT /api/current-affairs/:id/questions/:questionId` |
| Field | `image` (optional) |
| Allowed types | `image/jpeg`, `image/png`, `image/webp` |
| Max size | **5 MB** |
| Storage | Cloudinary folder `current-affairs/question-images` |
| Returned URL | `imageUrl` on question object |

### Frontend Upload Implementation

```typescript
const formData = new FormData();
formData.append('category', 'MONTHLY_MAGAZINE');
formData.append('title', 'June 2026 Magazine');
formData.append('year', '2026');
formData.append('month', 'June');
formData.append('pdf', pdfFile);
formData.append('uploadMagzine', magazineFile);

await fetch(`${API_BASE_URL}/api/current-affairs`, {
  method: 'POST',
  headers: { Authorization: `Bearer ${token}` },
  body: formData,
  // Do NOT set Content-Type — browser sets multipart boundary
});
```

---

## STATUS MANAGEMENT

### Status Field

`status` is a **boolean**, not a string enum.

| Value | Meaning | Portal visibility |
|-------|---------|-------------------|
| `true` | Active / published | Visible (default filter) |
| `false` | Inactive / hidden | Hidden from portal |

There are **no** `DRAFT`, `PUBLISHED`, `ARCHIVED`, `ACTIVE`, or `INACTIVE` string statuses in this module.

### Toggle Status Endpoint

```http
PATCH /api/current-affairs/:id/status
```

**Content-Type:** `application/json`

**Body:**

```json
{ "status": true }
```

or

```json
{ "status": false }
```

**Success `200`:**

```json
{
  "success": true,
  "message": "Current affair status updated successfully",
  "data": { /* edit-shaped record */ }
}
```

**Validation error `400`:**

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [{ "field": "status", "message": "status is required" }]
}
```

Status can also be set on create (`status` field) or update (`PUT` body `status`).

---

## SEARCH & FILTERS

### Admin List Filters

| Filter | Query param | Type | Behavior |
|--------|-------------|------|----------|
| Search | `search` | string | Case-insensitive regex on `title`, `magazineName`, `paperName`, `description` |
| Category | `category` | enum | Exact match |
| Year | `year` | number | Exact match |
| Month | `month` | string | Exact match (full name) |
| Status | `status` | boolean/string | `true` or `false` |
| Pagination | `page`, `limit` | integer | Default 1, 10 |
| Sort | `sortBy`, `sortOrder` | string | Default `createdAt` desc |

### Portal List Filters

| Filter | Query param | Type | Behavior |
|--------|-------------|------|----------|
| Search | `search` | string | Text search on title fields |
| Category | `category` | enum | Exact match |
| Year | `year` | number | Exact match |
| Month | `month` | string/number | Full name or 1–12 |
| Mains category | `mainsCategory` | string | `PRELIMS` / `MAINS` |
| Date | `date` | ISO string | Single-day range filter |
| Status | `status` | boolean/string | Defaults to `true` if omitted |

**Not supported:** `categoryId`, `topicId`, `authorId`, `tagId`, `publishedDate`, `dateRange` (use single `date` on portal).

---

## ERROR RESPONSES

### 400 Bad Request

Validation and business rule errors. Common shapes:

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [{ "field": "pdf", "message": "PDF file is required for this category" }]
}
```

```json
{
  "success": false,
  "message": "Category cannot be changed on update"
}
```

```json
{
  "success": false,
  "message": "Duplicate questionNumber found for this paper"
}
```

### 401 Unauthorized

```json
{ "success": false, "message": "Not authorized, no token" }
```

```json
{ "success": false, "message": "Not authenticated" }
```

### 403 Forbidden

```json
{ "success": false, "message": "Access denied. Insufficient permissions." }
```

```json
{ "success": false, "message": "Account is deactivated" }
```

### 404 Not Found

**Admin:**

```json
{ "success": false, "message": "Current affair not found" }
```

```json
{ "success": false, "message": "Daily practice paper not found" }
```

```json
{ "success": false, "message": "Question not found" }
```

**Portal:**

```json
{ "success": false, "message": "Resource not found" }
```

### 409 Conflict

Not used as an explicit HTTP status in Current Affairs controllers. Duplicate `questionNumber` returns **400** with message `"Duplicate questionNumber found for this paper"`.

### 422 Unprocessable Entity

**Not used** in Current Affairs module. Validation errors return **400**.

### 500 Internal Server Error

**Admin:**

```json
{ "success": false, "message": "Failed to fetch current affairs" }
```

**Portal:**

```json
{
  "success": false,
  "message": "Server error",
  "error": "error message detail"
}
```

---

## CREATE DAILY PRACTICE PAPER

### Endpoint

```http
POST /api/current-affairs/daily-practice
```

**Auth:** CMS admin  
**Content-Type:** `application/json` or `multipart/form-data` (when using bulk `file`)

### Request Body

| Field | Required | Type | Notes |
|-------|----------|------|-------|
| `paperName` | **Yes** | string | Also stored as `title` |
| `mainsCategory` | **Yes** | string | `PRELIMS` or `MAINS` |
| `year` | **Yes** | number | 2026–2031 |
| `month` | **Yes** | string | Full month name |
| `date` | **Yes** | string | ISO date |
| `sectionFrom` | **Yes*** | number | Min 1 |
| `sectionTo` | **Yes*** | number | Min 1, ≥ `sectionFrom` |
| `status` | No | boolean | Default `true` |
| `description` | No | string | Ignored on save |
| `questions` | No | array | Manual questions |
| `file` | No | file | Bulk XLSX/CSV |

\* `sectionFrom` / `sectionTo` not required when bulk `file` is provided (auto-derived from question numbers).

**Question object:**

```json
{
  "questionNumber": 1,
  "question": "What is the capital of India?",
  "optionA": "Mumbai",
  "optionB": "New Delhi",
  "optionC": "Kolkata",
  "optionD": "Chennai",
  "correctAnswer": "B",
  "explanation": "Optional explanation"
}
```

**Success `201`:**

```json
{
  "success": true,
  "message": "Daily practice set created successfully",
  "data": {
    "_id": "...",
    "category": "DAILY_PRACTICE_QUESTIONS",
    "paperName": "Prelims Paper 1",
    "title": "Prelims Paper 1",
    "mainsCategory": "PRELIMS",
    "date": "2026-06-15",
    "year": 2026,
    "month": "June",
    "sectionFrom": 1,
    "sectionTo": 10,
    "questions": [ /* ... */ ],
    "questionCount": 10,
    "status": true,
    "createdBy": { ... },
    "createdAt": "...",
    "updatedAt": "..."
  }
}
```

---

## PORTAL DAILY PRACTICE — QUESTIONS & SUBMIT

### Get Questions

```http
GET /api/portal/current-affairs/:id/questions
```

Only for active `DAILY_PRACTICE_QUESTIONS` papers.

**Success `200`:**

```json
{
  "success": true,
  "data": {
    "paper": { /* card shape */ },
    "count": 10,
    "questions": [
      {
        "_id": "...",
        "currentAffairId": "...",
        "questionNumber": 1,
        "question": "...",
        "options": [
          { "key": "A", "value": "..." },
          { "key": "B", "value": "..." },
          { "key": "C", "value": "..." },
          { "key": "D", "value": "..." }
        ],
        "imageUrl": null,
        "explanation": ""
      }
    ]
  }
}
```

**Note:** `correctAnswer` is **not** exposed before submission.

### Submit Answers

```http
POST /api/portal/current-affairs/:id/submit
```

**Content-Type:** `application/json`

**Body:**

```json
{
  "answers": [
    { "questionId": "665a...", "selectedAnswer": "A" },
    { "_id": "665b...", "selectedAnswer": "C" }
  ]
}
```

Accepts `questionId`, `_id`, or `id` per answer item.

**Success `200`:**

```json
{
  "success": true,
  "message": "Answers evaluated successfully",
  "data": {
    "paper": { /* card */ },
    "totalQuestions": 10,
    "attemptedCount": 8,
    "correctCount": 6,
    "wrongCount": 2,
    "skippedCount": 2,
    "percentage": 60,
    "grade": "C",
    "review": [
      {
        "_id": "...",
        "questionNumber": 1,
        "question": "...",
        "options": [ ... ],
        "selectedAnswer": "A",
        "correctAnswer": "B",
        "isCorrect": false,
        "isSkipped": false,
        "explanation": "...",
        "imageUrl": null
      }
    ]
  }
}
```

**Grading thresholds:**

| Grade | Percentage |
|-------|------------|
| A | ≥ 90% |
| B | ≥ 75% |
| C | ≥ 50% |
| D | < 50% |

---

## FRONTEND SERVICE LAYER

```typescript
// src/services/currentAffairsService.ts
const API_BASE = import.meta.env.VITE_API_BASE_URL;

const getAuthHeaders = (json = true): HeadersInit => {
  const headers: HeadersInit = {
    Authorization: `Bearer ${localStorage.getItem('accessToken') ?? ''}`,
  };
  if (json) headers['Content-Type'] = 'application/json';
  return headers;
};

// ─── Admin ───────────────────────────────────────────────

export interface CurrentAffairListParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  category?: string;
  year?: number;
  month?: string;
  status?: boolean;
  search?: string;
}

export const getCurrentAffairs = async (params: CurrentAffairListParams = {}) => {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== '') query.set(key, String(value));
  });
  const res = await fetch(`${API_BASE}/api/current-affairs?${query}`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw await res.json();
  return res.json();
};

export const getCurrentAffairById = async (id: string) => {
  const res = await fetch(`${API_BASE}/api/current-affairs/${id}`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw await res.json();
  return res.json();
};

export const createCurrentAffair = async (formData: FormData) => {
  const res = await fetch(`${API_BASE}/api/current-affairs`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${localStorage.getItem('accessToken') ?? ''}` },
    body: formData,
  });
  if (!res.ok) throw await res.json();
  return res.json();
};

export const updateCurrentAffair = async (id: string, formData: FormData) => {
  const res = await fetch(`${API_BASE}/api/current-affairs/${id}`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${localStorage.getItem('accessToken') ?? ''}` },
    body: formData,
  });
  if (!res.ok) throw await res.json();
  return res.json();
};

export const deleteCurrentAffair = async (id: string) => {
  const res = await fetch(`${API_BASE}/api/current-affairs/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw await res.json();
  return res.json();
};

export const updateCurrentAffairStatus = async (id: string, status: boolean) => {
  const res = await fetch(`${API_BASE}/api/current-affairs/${id}/status`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify({ status }),
  });
  if (!res.ok) throw await res.json();
  return res.json();
};

export const createDailyPracticePaper = async (payload: FormData | Record<string, unknown>) => {
  const isFormData = payload instanceof FormData;
  const res = await fetch(`${API_BASE}/api/current-affairs/daily-practice`, {
    method: 'POST',
    headers: isFormData
      ? { Authorization: `Bearer ${localStorage.getItem('accessToken') ?? ''}` }
      : getAuthHeaders(),
    body: isFormData ? payload : JSON.stringify(payload),
  });
  if (!res.ok) throw await res.json();
  return res.json();
};

export const getMainsCategories = async () => {
  const res = await fetch(`${API_BASE}/api/current-affairs/daily-practice/mains-categories`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw await res.json();
  return res.json();
};

export const getQuestionsByPaper = async (paperId: string) => {
  const res = await fetch(`${API_BASE}/api/current-affairs/${paperId}/questions`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw await res.json();
  return res.json();
};

// ─── Portal ──────────────────────────────────────────────

export const getPortalCurrentAffairs = async (params: Record<string, string> = {}) => {
  const query = new URLSearchParams(params);
  const res = await fetch(`${API_BASE}/api/portal/current-affairs?${query}`);
  if (!res.ok) throw await res.json();
  return res.json();
};

export const getPortalFilters = async () => {
  const res = await fetch(`${API_BASE}/api/portal/current-affairs/filters`);
  if (!res.ok) throw await res.json();
  return res.json();
};

export const getPortalCurrentAffairById = async (id: string) => {
  const res = await fetch(`${API_BASE}/api/portal/current-affairs/${id}`);
  if (!res.ok) throw await res.json();
  return res.json();
};

export const submitDailyPracticeAnswers = async (
  paperId: string,
  answers: Array<{ questionId?: string; _id?: string; id?: string; selectedAnswer: string }>
) => {
  const res = await fetch(`${API_BASE}/api/portal/current-affairs/${paperId}/submit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ answers }),
  });
  if (!res.ok) throw await res.json();
  return res.json();
};
```

---

## REACT QUERY INTEGRATION

```typescript
// src/hooks/useCurrentAffairs.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getCurrentAffairs,
  getCurrentAffairById,
  createCurrentAffair,
  updateCurrentAffair,
  deleteCurrentAffair,
  updateCurrentAffairStatus,
  getPortalCurrentAffairs,
  getPortalFilters,
  getPortalCurrentAffairById,
  submitDailyPracticeAnswers,
  type CurrentAffairListParams,
} from '../services/currentAffairsService';

const ADMIN_KEY = ['current-affairs', 'admin'] as const;
const PORTAL_KEY = ['current-affairs', 'portal'] as const;

// ─── Admin hooks ─────────────────────────────────────────

export const useCurrentAffairs = (params: CurrentAffairListParams = {}) =>
  useQuery({
    queryKey: [...ADMIN_KEY, 'list', params],
    queryFn: () => getCurrentAffairs(params),
  });

export const useCurrentAffair = (id: string) =>
  useQuery({
    queryKey: [...ADMIN_KEY, 'detail', id],
    queryFn: () => getCurrentAffairById(id),
    enabled: Boolean(id),
  });

export const useCreateCurrentAffair = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createCurrentAffair,
    onSuccess: () => qc.invalidateQueries({ queryKey: ADMIN_KEY }),
  });
};

export const useUpdateCurrentAffair = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, formData }: { id: string; formData: FormData }) =>
      updateCurrentAffair(id, formData),
    onSuccess: (_data, { id }) => {
      qc.invalidateQueries({ queryKey: ADMIN_KEY });
      qc.invalidateQueries({ queryKey: [...ADMIN_KEY, 'detail', id] });
    },
  });
};

export const useDeleteCurrentAffair = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteCurrentAffair,
    onSuccess: () => qc.invalidateQueries({ queryKey: ADMIN_KEY }),
  });
};

export const useUpdateCurrentAffairStatus = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: boolean }) =>
      updateCurrentAffairStatus(id, status),
    onSuccess: () => qc.invalidateQueries({ queryKey: ADMIN_KEY }),
  });
};

// ─── Portal hooks ────────────────────────────────────────

export const usePortalCurrentAffairs = (filters: Record<string, string> = {}) =>
  useQuery({
    queryKey: [...PORTAL_KEY, 'list', filters],
    queryFn: async () => {
      const response = await getPortalCurrentAffairs(filters);
      // Unwrap double-nested pagination: response.data.data = items
      return {
        items: response.data?.data ?? [],
        pagination: {
          count: response.data?.count,
          total: response.data?.total,
          page: response.data?.page,
          limit: response.data?.limit,
          totalPages: response.data?.totalPages,
          hasNextPage: response.data?.hasNextPage,
          hasPrevPage: response.data?.hasPrevPage,
        },
      };
    },
  });

export const usePortalFilters = () =>
  useQuery({
    queryKey: [...PORTAL_KEY, 'filters'],
    queryFn: () => getPortalFilters(),
  });

export const usePortalCurrentAffair = (id: string) =>
  useQuery({
    queryKey: [...PORTAL_KEY, 'detail', id],
    queryFn: () => getPortalCurrentAffairById(id),
    enabled: Boolean(id),
  });

export const useSubmitDailyPractice = (paperId: string) =>
  useMutation({
    mutationFn: (answers: Array<{ questionId: string; selectedAnswer: string }>) =>
      submitDailyPracticeAnswers(paperId, answers),
  });
```

---

## FORM INTEGRATION GUIDE

### Admin — PDF Content Create/Edit

| Backend Field | Frontend Component | Visibility |
|---------------|-------------------|------------|
| `category` | `<Select>` | Create only (read-only on edit) |
| `title` | `<Input maxLength={300}>` | Always |
| `year` | `<Select>` options 2026–2031 | Always |
| `month` | `<Select>` full month names | Always |
| `description` | `<Textarea maxLength={5000}>` | Hide for `CURRENT_AFFAIRS` |
| `status` | `<Switch>` | Always |
| `pdf` | `<FileInput accept=".pdf">` | Required on create |
| `uploadMagzine` | `<FileInput accept=".pdf">` | `MONTHLY_MAGAZINE` only |

### Admin — Daily Practice Create

| Backend Field | Frontend Component |
|---------------|-------------------|
| `paperName` | `<Input maxLength={300}>` |
| `mainsCategory` | `<Select>` from `/daily-practice/mains-categories` |
| `year` | `<Select>` 2026–2031 |
| `month` | `<Select>` full month names |
| `date` | `<DatePicker>` → ISO `YYYY-MM-DD` |
| `sectionFrom` | `<Input type="number" min={1}>` |
| `sectionTo` | `<Input type="number" min={1}>` |
| `status` | `<Switch>` |
| `questions` | Dynamic question form array **or** |
| `file` | Bulk upload `<FileInput accept=".xlsx,.csv">` |

### Admin — Question Form (per question)

| Backend Field | Frontend Component |
|---------------|-------------------|
| `questionNumber` | `<Input type="number" min={1}>` |
| `question` | `<Textarea>` |
| `optionA`–`optionD` | `<Input>` × 4 |
| `correctAnswer` | `<RadioGroup>` A/B/C/D |
| `explanation` | `<Textarea>` optional |
| `image` | `<FileInput accept="image/*">` optional |

### Portal — Filter Bar

| Backend param | Frontend Component | Source |
|---------------|-------------------|--------|
| `category` | `<Select>` | `GET /filters` → `categories` |
| `year` | `<Select>` | `GET /filters` → `years` |
| `month` | `<Select>` | `GET /filters` → `months` |
| `mainsCategory` | `<Select>` | `GET /filters` → `mainsCategories` |
| `date` | `<Select>` or `<DatePicker>` | `GET /filters` → `dates` |
| `search` | `<SearchInput>` | Free text |

---

## TABLE INTEGRATION GUIDE

### Admin List Table

| Column | Data field | Notes |
|--------|-----------|-------|
| Title | `title` | Or `paperName` for daily practice |
| Category | `category` | Map to label |
| Year | `year` | |
| Month | `month` | |
| Status | `status` | Boolean badge: Active / Inactive |
| Created | `createdAt` | Format date |
| Created by | `createdBy.name` | |
| Actions | — | View, Edit, Delete, Toggle status |

### Search Mapping

```typescript
// Debounced search input → query param
const [search, setSearch] = useState('');
const { data } = useCurrentAffairs({ search, page, limit, category, year, month, status });
```

### Filters

```typescript
const filters = {
  category: selectedCategory || undefined,
  year: selectedYear || undefined,
  month: selectedMonth || undefined,
  status: statusFilter, // true | false | undefined
};
```

### Pagination Mapping

```typescript
const page = data?.page ?? 1;
const totalPages = data?.totalPages ?? 1;
const hasNextPage = data?.hasNextPage ?? false;
const hasPrevPage = data?.hasPrevPage ?? false;
// onPageChange → setPage → refetch with { page, limit: 10 }
```

### Row Actions

| Action | API call |
|--------|----------|
| View | Navigate to `/current-affairs/:id` |
| Edit | Navigate to `/current-affairs/:id/edit` |
| Delete | `DELETE /api/current-affairs/:id` with confirm |
| Toggle status | `PATCH /api/current-affairs/:id/status` |

### Portal List Table / Cards

| Column | Data field |
|--------|-----------|
| Title | `title` |
| Category | `categoryLabel` |
| Year / Month | `year`, `month` |
| Date | `date` (daily practice) |
| PDF | Link to `pdfUrl` or view endpoint |

**Note:** Portal pagination is fixed at 12 items. Plan UI accordingly or coordinate a backend change if full pagination is needed.

---

## FRONTEND IMPLEMENTATION CHECKLIST

### Admin CMS

- [ ] List page with pagination (`page`, `limit`, `sortBy`, `sortOrder`)
- [ ] List search (`search` param)
- [ ] List filters (`category`, `year`, `month`, `status`)
- [ ] Detail page (`GET /:id`)
- [ ] Create page — PDF categories (`POST /` with `FormData`)
- [ ] Create page — Daily practice (`POST /daily-practice`)
- [ ] Edit page (`PUT /:id` with partial `FormData`)
- [ ] Delete flow with permanent-delete warning
- [ ] Status toggle (`PATCH /:id/status`)
- [ ] PDF upload (`pdf` field, 10 MB limit)
- [ ] Magazine upload (`uploadMagzine` for `MONTHLY_MAGAZINE`)
- [ ] Daily practice question management (CRUD + bulk upload)
- [ ] Bulk template download (`GET /daily-practice/questions/bulk-template`)
- [ ] CMS admin auth (`Bearer` token, `super_admin` / `center_admin`)
- [ ] Validation error display (`errors[]` array from 400 responses)
- [ ] Category-specific form field visibility

### Student Portal

- [ ] Resource list page (`GET /api/portal/current-affairs`)
- [ ] Filter bar from `GET /filters`
- [ ] Detail page (`GET /:id`)
- [ ] PDF view (`GET /:id/view` → `viewUrl`)
- [ ] PDF download (`GET /:id/download` → `downloadUrl`)
- [ ] Daily practice quiz (`GET /:id/questions`)
- [ ] Answer submission (`POST /:id/submit`)
- [ ] Results review screen (grade, percentage, `review[]`)
- [ ] Handle double-wrapped portal list response (`response.data.data`)
- [ ] Guest access (no token required)

---

## CRITICAL REQUIREMENTS

1. **Use `/api/current-affairs` for admin** and **`/api/portal/current-affairs` for student portal**.
2. **`DAILY_PRACTICE_QUESTIONS` must be created via `POST /daily-practice`**, not `POST /`.
3. **`MONTHLY_MAGAZINE` requires two PDFs:** `pdf` and `uploadMagzine`.
4. **Status is boolean** (`true`/`false`), not string enums.
5. **Portal list pagination is fixed** at page 1 / limit 12 — `page`/`limit` query params are ignored.
6. **Portal list response is double-wrapped** — items at `response.data.data`.
7. **Portal questions do not expose `correctAnswer`** until after `POST /:id/submit`.
8. **Category cannot be changed** after create.
9. **No Subject/Topic/Author/Tag APIs** — category is an enum, not a foreign key.
10. **Do not mix IDs** with the legacy Resources module (`/api/resources/*`).
11. **Excluded from API responses:** `pdfPublicId`, `uploadMagzinePublicId`, `imageUrl`, `imagePublicId`.
12. **Cloudinary folder:** `current-affairs` (PDFs), `current-affairs/question-images` (question images).

---

## Related Documentation

| Resource | Path |
|----------|------|
| API testing guide | `docs/current-affairs/API_TESTING_GUIDE.md` |
| Postman collection | `docs/current-affairs/CURRENT_AFFAIRS_POSTMAN_COLLECTION.json` |
| Postman environment | `docs/current-affairs/CURRENT_AFFAIRS_POSTMAN_ENVIRONMENT.json` |
| Swagger UI | `/api-docs` (when server is running) |
