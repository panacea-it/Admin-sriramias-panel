# Program Module — Frontend Integration README

> **Backend base URL (production):** `https://sriramias-backend.onrender.com`  
> **Scope:** Frontend-only integration layer. No backend code, routes, payloads, or responses were modified.

---

## Module Overview

**Program Management** sits at the top of the academic hierarchy under **Academics**:

```text
Center → Program → Category → Sub-Category → Course
```

Programs link one or more **centers** and act as the parent scope for **categories**. Super Admins create programs, assign centers, toggle status, and use the center-scoped dropdown when creating categories.

This repository includes a production-ready **frontend integration scaffold** in `src/`:

- Centralized Axios client with JWT injection (`src/services/api.ts`)
- Domain services (`programService`, `commonService`, `centerService`, etc.)
- React Query hooks for all program operations
- Shared error handling and UI states
- Role-based route guards
- Full API documentation aligned with live backend source (`controllers/programController.js`, `routes/programRoutes.js`)

**Data flow:**

```text
React Component → Custom Hook (React Query) → Service → Axios (api.ts) → Backend API
```

---

## Phase 1 — Technical Audit Report

### Backend (discovered from source code)

| Domain | Base path | Auth |
|--------|-----------|------|
| Programs | `/api/programs` | Super Admin (`protect` + `requireSuperAdmin`) |
| Centers dropdown | `/api/admin/centers/dropdown` | Staff Admin+ |
| Categories | `/api/categories` | Super Admin (downstream of Programs) |

**Source files:**

- `routes/programRoutes.js` — route registration
- `controllers/programController.js` — handlers and validation
- `models/Program.js` — schema (`programId`, `programName`, `centers[]`, `status`)
- `middleware/requireSuperAdmin.js` — 401/403 enforcement

**Program endpoints:**

| Method | Endpoint | Handler | Purpose |
|--------|----------|---------|---------|
| POST | `/api/programs` | `createProgram` | Create program |
| GET | `/api/programs` | `getPrograms` | Paginated list + search/filters |
| GET | `/api/programs/by-center/:centerId` | `getProgramsByCenter` | ACTIVE programs dropdown |
| PATCH | `/api/programs/status/:id` | `updateProgramStatus` | Status-only update |
| GET | `/api/programs/:id` | `getProgramById` | Single program detail |
| PUT | `/api/programs/:id` | `updateProgram` | Partial update |
| DELETE | `/api/programs/:id` | `deleteProgram` | Hard delete |

> **Route order note:** `GET /by-center/:centerId` and `PATCH /status/:id` are registered **before** `GET /:id` to avoid param collisions (`programRoutes.js`).

### Frontend (audit)

| Finding | Status |
|---------|--------|
| Program UI pages in this repo | **None** — `src/` is an integration layer scaffold |
| Direct `axios` in components | **None** — all HTTP via `src/services/` |
| Direct `fetch` in components | **None** |
| Duplicate program API logic | **Resolved** — centralized in `programService.ts` |
| Duplicate loading/error UI | **Resolved** — `components/common/` |
| React Query for programs | **Implemented** — `usePrograms`, `useProgram`, mutations, dropdown |

Copy or merge `src/` into your LMS Admin Panel Vite project.

---

## Backend API Reference

All paths are relative to `VITE_API_BASE_URL` (`https://sriramias-backend.onrender.com`).

**Authentication (all program routes):**

```http
Authorization: Bearer <JWT>
```

Requires **Super Admin** — legacy `User.role === 'super_admin'` or `AdminAccess.roleCode === 'SUPER_ADMIN'`.

---

### 1. Create Program

| | |
|---|---|
| **Endpoint** | `POST /api/programs` |
| **Auth** | Super Admin |
| **Content-Type** | `application/json` |

**Request body:**

```json
{
  "programName": "UPSC Complete Program",
  "centers": ["CENTER_OBJECT_ID_1", "CENTER_OBJECT_ID_2"],
  "status": "ACTIVE"
}
```

| Field | Required | Notes |
|-------|----------|-------|
| `programName` | Yes | Non-empty string; trimmed server-side |
| `centers` | Yes | Array of active center ObjectIds; at least one |
| `status` | No | `ACTIVE` (default) or `INACTIVE` |

**Response `201`:**

```json
{
  "success": true,
  "message": "Program created successfully",
  "data": {
    "_id": "679abc...",
    "programId": "PRG001",
    "programName": "UPSC Complete Program",
    "centers": [
      { "_id": "...", "centerName": "Delhi Center" }
    ],
    "linkedCourses": 0,
    "status": "ACTIVE",
    "createdAt": "2026-06-24T10:00:00.000Z",
    "updatedAt": "2026-06-24T10:00:00.000Z"
  }
}
```

**Errors:** `400` (validation), `401`, `403`, `500`

---

### 2. List Programs

| | |
|---|---|
| **Endpoint** | `GET /api/programs` |
| **Auth** | Super Admin |

**Query parameters:**

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `search` | string | `""` | Program name (contains); center name/code/state (starts with); city (word start) |
| `center` | ObjectId | — | Filter programs linked to this center |
| `status` | string | — | `ACTIVE` or `INACTIVE` |
| `page` | number | `1` | Page number |
| `limit` | number | `10` | Max `100` |
| `sortBy` | string | `createdAt` | `createdAt`, `programName`, `programId`, `status` |
| `sortOrder` | string | `desc` | `asc` or `desc` |

**Response `200`:**

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
      "_id": "...",
      "programId": "PRG001",
      "programName": "UPSC Complete Program",
      "centers": [{ "_id": "...", "centerName": "Delhi Center" }],
      "linkedCourses": 3,
      "status": "ACTIVE",
      "createdAt": "...",
      "updatedAt": "..."
    }
  ]
}
```

`linkedCourses` = count of `Course` documents where `program` equals this program `_id`.

---

### 3. Get Program by ID

| | |
|---|---|
| **Endpoint** | `GET /api/programs/:id` |
| **Auth** | Super Admin |

**Response `200`:**

```json
{
  "success": true,
  "data": {
    "_id": "...",
    "programId": "PRG001",
    "programName": "UPSC Complete Program",
    "centers": [
      {
        "_id": "...",
        "centerName": "Delhi Center",
        "centerCode": "DEL",
        "city": "New Delhi"
      }
    ],
    "linkedCourses": 3,
    "status": "ACTIVE",
    "createdAt": "...",
    "updatedAt": "..."
  }
}
```

**Errors:** `404` Program not found

---

### 4. Update Program

| | |
|---|---|
| **Endpoint** | `PUT /api/programs/:id` |
| **Auth** | Super Admin |

**Request body (partial):**

```json
{
  "programName": "UPSC Complete Program 2026",
  "centers": ["CENTER_ID_1"],
  "status": "ACTIVE"
}
```

**Response `200`:**

```json
{
  "success": true,
  "message": "Program updated successfully",
  "data": { "...": "full program object" }
}
```

---

### 5. Patch Program Status

| | |
|---|---|
| **Endpoint** | `PATCH /api/programs/status/:id` |
| **Auth** | Super Admin |

**Request body:**

```json
{ "status": "INACTIVE" }
```

**Response `200`:**

```json
{
  "success": true,
  "message": "Program status updated",
  "data": { "...": "program object" }
}
```

---

### 6. Delete Program

| | |
|---|---|
| **Endpoint** | `DELETE /api/programs/:id` |
| **Auth** | Super Admin |

**Response `200`:**

```json
{
  "success": true,
  "message": "Program deleted successfully",
  "data": { "_id": "..." }
}
```

Hard delete — document is permanently removed.

---

### 7. Programs by Center (Dropdown)

| | |
|---|---|
| **Endpoint** | `GET /api/programs/by-center/:centerId` |
| **Auth** | Super Admin |

Returns only **ACTIVE** programs where `centers` includes `centerId`.

**Response `200`:**

```json
{
  "success": true,
  "count": 2,
  "data": [
    {
      "_id": "...",
      "programId": "PRG001",
      "programName": "UPSC Complete Program"
    }
  ]
}
```

**Errors:** `404` Center not found or inactive

**Used by:** Category create form — select center first, then load programs.

---

## Frontend Folder Structure

```text
src/
├── services/
│   ├── api.ts              # Axios instance, JWT, interceptors, timeout
│   ├── authService.ts      # Login, token persistence
│   ├── programService.ts   # All program CRUD + dropdown
│   ├── commonService.ts    # Shared utilities (ping, stripEmptyParams)
│   ├── centerService.ts    # Center dropdown for program forms
│   └── index.ts
├── hooks/
│   ├── queryKeys.ts        # programKeys.all | list | detail | dropdown
│   ├── usePrograms.ts
│   ├── useProgram.ts
│   ├── useCreateProgram.ts
│   ├── useUpdateProgram.ts
│   ├── useDeleteProgram.ts
│   ├── useProgramDropdown.ts
│   └── index.ts
├── providers/
│   └── QueryProvider.tsx
├── utils/
│   └── errorHandler.ts
├── components/common/
│   ├── LoadingSpinner.tsx
│   ├── PageLoader.tsx
│   ├── ErrorState.tsx
│   └── EmptyState.tsx
├── routes/
│   ├── ProtectedRoute.tsx
│   ├── RoleGuard.tsx
│   └── roleConfig.ts
└── types/
    ├── api.ts
    └── program.ts
```

---

## Environment Setup

```env
VITE_API_BASE_URL=https://sriramias-backend.onrender.com
```

Use `import.meta.env.VITE_API_BASE_URL` everywhere. No hardcoded URLs.

```bash
cd src
npm install
```

---

## Service Layer Examples

```ts
import { programService } from '@/services/programService';

// List with filters
const list = await programService.getPrograms({
  page: 1,
  limit: 10,
  search: 'upsc',
  center: centerId,
  status: 'ACTIVE',
});

// Detail
const detail = await programService.getProgramById(programId);

// Create
await programService.createProgram({
  programName: 'UPSC Complete Program',
  centers: [centerId1, centerId2],
  status: 'ACTIVE',
});

// Update
await programService.updateProgram(programId, { programName: 'Updated Name' });

// Status toggle
await programService.updateProgramStatus(programId, 'INACTIVE');

// Delete
await programService.deleteProgram(programId);

// Dropdown (after center selected)
const dropdown = await programService.getProgramDropdown(centerId);
```

---

## React Query Examples

```tsx
import {
  usePrograms,
  useProgram,
  useCreateProgram,
  useUpdateProgram,
  useDeleteProgram,
  useProgramDropdown,
} from '@/hooks';
import { PageLoader, ErrorState, EmptyState } from '@/components/common';

// List page
function ProgramListPage() {
  const [filters, setFilters] = useState({ page: 1, limit: 10 });
  const { data, isLoading, isError, error, refetch } = usePrograms(filters);

  if (isLoading) return <PageLoader message="Loading programs…" />;
  if (isError) return <ErrorState message={error.message} onRetry={refetch} />;
  if (!data?.data?.length) return <EmptyState title="No programs found" />;

  return (/* render table */);
}

// Create
const createProgram = useCreateProgram();
createProgram.mutate(
  { programName: 'New Program', centers: [centerId] },
  { onSuccess: () => navigate('/academics/programs') }
);

// Update
const updateProgram = useUpdateProgram();
updateProgram.mutate({ id: programId, payload: { status: 'INACTIVE' } });

// Delete
const deleteProgram = useDeleteProgram();
deleteProgram.mutate(programId);

// Category form — program dropdown after center pick
const { data: programs } = useProgramDropdown(selectedCenterId);
```

**Query keys:**

```ts
programKeys.all                          // ['programs']
programKeys.list({ page: 1 })            // ['programs', 'list', { page: 1 }]
programKeys.detail('679abc...')          // ['programs', 'detail', '679abc...']
programKeys.dropdown('centerId...')      // ['programs', 'dropdown', 'centerId...']
```

---

## Program List Integration

1. Wrap app with `QueryProvider` and register toast via `registerToastNotifier`.
2. Protect route: `<ProtectedRoute />` + `<RoleGuard allowedRoles={['Admin']} />`.
3. Add list page state: `{ page, limit, search, center, status }`.
4. Call `usePrograms(filters)`.
5. Wire search input → debounce → update `filters.search`.
6. Wire center/status filters → update `filters.center` / `filters.status`.
7. Render pagination from `data.totalPages`, `data.page`.
8. Map `data.data` rows: `programId`, `programName`, centers, `linkedCourses`, `status`.
9. Use `PageLoader` / `ErrorState` / `EmptyState` for UI states.

---

## Program Create Integration

1. Load centers: `useCentersDropdown()` or `programService.getCentersDropdown()`.
2. Form fields: `programName` (required), `centers` (multi-select, required), `status` (default `ACTIVE`).
3. On submit: `useCreateProgram().mutate(payload)`.
4. On success: invalidate list cache (automatic), navigate to list.
5. Handle `400` validation errors from `error.response.data.message`.

---

## Program Edit Integration

1. Read `id` from route params.
2. `useProgram(id)` — show `PageLoader` while loading.
3. Pre-fill form from `data.data`.
4. Centers multi-select from `useCentersDropdown()`.
5. Submit: `useUpdateProgram().mutate({ id, payload })`.
6. Optional status toggle: `programService.updateProgramStatus(id, status)` or include `status` in PUT payload.

---

## Program Delete Integration

1. Confirm dialog in UI.
2. `useDeleteProgram().mutate(id)`.
3. On success: list cache invalidated, detail cache removed.
4. Show success toast; stay on list or redirect.

---

## Program Search & Filters

| UI control | API param | Backend behavior |
|------------|-----------|------------------|
| Search box | `search` | `programName` contains term; center fields prefix-match |
| Center filter | `center` | Programs where `centers` includes center ObjectId |
| Status filter | `status` | `ACTIVE` or `INACTIVE` |
| Sort column | `sortBy`, `sortOrder` | See list API |
| Pagination | `page`, `limit` | Server-side |

```http
GET /api/programs?search=upsc&center=CENTER_ID&status=ACTIVE&page=1&limit=10&sortBy=programName&sortOrder=asc
```

---

## Error Handling

Centralized in `src/utils/errorHandler.ts`:

| Condition | User message | Action |
|-----------|--------------|--------|
| Network failure | Unable to connect to server | Retry |
| Timeout (`ECONNABORTED`) | Request timed out… | Retry |
| `401` | Session expired. Please log in again. | Redirect login; `auth:unauthorized` event |
| `403` | You do not have permission… | Show forbidden state |
| `404` | The requested resource was not found. | Show not-found |
| `500` | Something went wrong on the server… | Retry + support |

```ts
import { handleApiError, parseApiError } from '@/utils/errorHandler';

// Mutations call handleApiError automatically in hooks
// Manual usage:
try {
  await programService.createProgram(payload);
} catch (error) {
  const parsed = handleApiError(error, { fallbackMessage: 'Failed to create program' });
}
```

Register toast at bootstrap:

```ts
registerToastNotifier((message) => toast.error(message));
```

---

## Best Practices

### DO

- Use `programService` for all program HTTP calls
- Use React Query hooks in components
- Use `import.meta.env.VITE_API_BASE_URL` (via `api.ts`)
- Use `PageLoader`, `ErrorState`, `EmptyState`
- Invalidate `programKeys` after mutations
- Load program dropdown only after center is selected

### DO NOT

- Call `axios` or `fetch` inside components
- Hardcode `https://sriramias-backend.onrender.com` in UI code
- Duplicate pagination/filter logic per page
- Modify backend payloads or expect different response shapes

---

## Academics → Categories Handoff

After a program exists:

1. User selects **Center** → `GET /api/programs/by-center/:centerId` (`useProgramDropdown`)
2. User selects **Program** from dropdown
3. User creates **Category** → `POST /api/categories` with `{ centerId, programId, categoryName, status }`

Backend validates `program.centers` includes `centerId` (`validateProgramCenterLink`).

---

## Related Documentation

- `docs/frontend-architecture.md` — layer diagram and conventions
- `docs/program-module-flow.md` — sequence diagrams per user journey
- `docs/api-integration-guide.md` — full API tables including categories
- `PROGRAM_CATEGORY_SUBCATEGORY_API_GUIDE.md` — backend hierarchy reference
