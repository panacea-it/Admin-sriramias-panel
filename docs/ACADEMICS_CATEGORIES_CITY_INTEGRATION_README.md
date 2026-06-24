# City — Frontend Integration Guide

> **Academics → Categories → City**  
> Backend resource: `City` · API base: `/api/cities` · MongoDB collection: `cities`

**Backend source of truth.** This document is derived entirely from existing backend code. No APIs, fields, or behaviors have been invented.

Postman reference: `CITY_POSTMAN_COLLECTION.json`  
Related backend guide: `CITY_API_GUIDE.md`  
Downstream consumer: `CLASSROOM_API_GUIDE.md` (Center → City → Classroom)

---

## SECTION 1 — MODULE OVERVIEW

### What City Represents

A **City** record is a **physical branch / place address** belonging to exactly one **Center**. It is stored as free-text `cityAddress` (full address line) and is referenced by infrastructure modules — primarily **Classroom**.

> **Important distinction:** The `Center` model also has a string field `city` (geographic city name, e.g. `"Hyderabad"`). That is **not** the same as the `City` collection documented here. The `City` collection holds branch-level addresses (`cityAddress`) used for classroom placement and dependent dropdowns.

### Navigation Context

In the admin UI, **City** sits under **Academics → Categories** alongside exam category modules. In the **data model**, City is **not** a child of `AcademicCategory`. It belongs to a separate operational hierarchy:

```text
Center
  → City (branch / place — cityAddress)
    → Classroom
```

The academic hierarchy (Programs, Exam Categories, Courses, Batches) runs in parallel and does **not** reference the `City` collection:

```text
Center → Program → Exam Category → Exam Sub Category → Course → Batch
```

### Actual Backend Relationships

| Related Module | Relationship to City | Backend Evidence |
|----------------|---------------------|------------------|
| **Centers** | **Parent (required).** Every City has `centerId` → `Center._id`. Create/update validates center exists with `status: 'ACTIVE'`. | `models/City.js`, `controllers/cityController.js` → `findActiveCenter()` |
| **Classrooms** | **Child (downstream).** `Classroom.city` → `City._id` (required). Classroom create/update calls `validateCityBelongsToCenter()` — city must be ACTIVE, not deleted, and match the selected center. | `models/Classroom.js`, `utils/classroomHelpers.js` |
| **Courses** | **No direct reference.** Courses link via `centerId`, `programId`, `categoryId`, `subCategoryId` — not `City`. | `utils/courseHierarchyValidation.js` |
| **Subjects** | **No direct reference.** | `models/Subject.js` |
| **Faculty (Teachers)** | **No direct reference.** Teachers link via `centerId` only. | `models/Teacher.js` |
| **Batches** | **No direct reference.** Batches link via `course` → `Course`. | `models/Batch.js` |
| **Academic Categories** | **No direct reference.** Categories link via `centerId` + `programId`. | `models/AcademicCategory.js` |

### User Flow

1. Super Admin logs in (`POST /api/auth/login-super-admin` or `POST /api/auth/login-admin` with `SUPER_ADMIN` role).
2. Opens **Academics → Categories → City** list.
3. Filters by center and status; searches by address or center name; paginates/sorts.
4. **Create:** selects Center (dropdown) → enters `cityAddress` → optionally sets status → saves.
5. **Edit:** updates `centerId`, `cityAddress`, and/or `status` (all optional on update).
6. **Toggle status:** `ACTIVE` ↔ `INACTIVE` via `PATCH /api/cities/status/:id`.
7. **Delete:** soft delete — sets `isDeleted: true`, `status: INACTIVE`, `deletedAt: now`.

### Backend Architecture (No Separate Service Layer)

City business logic lives entirely in the controller. There is **no** `cityService.js` on the backend.

| Layer | File |
|-------|------|
| Routes | `routes/cityRoutes.js` |
| Controller | `controllers/cityController.js` |
| Model | `models/City.js` |
| Helpers | `utils/academicHierarchyHelpers.js` (`findActiveCenter`), `utils/contentMastersHelpers.js` (`NOT_DELETED`, `parsePagination`, `parseSort`, `escapeRegex`) |
| Mount | `app.js` → `app.use('/api/cities', cityRoutes)` |

---

## SECTION 2 — DATABASE MODEL

**Model:** `City` · **Collection:** `cities` · **Source:** `models/City.js`

| Field Name | Type | Required | Default Value | Validation | Description |
|------------|------|----------|---------------|------------|-------------|
| `_id` | ObjectId | auto | MongoDB-generated | — | Primary key |
| `centerId` | ObjectId → `Center` | **Yes** | — | Must reference an existing Center with `status: 'ACTIVE'` (validated in controller) | Parent center |
| `cityAddress` | String | **Yes** | — | `trim: true`; non-empty after trim (controller) | Full branch address text |
| `status` | String | No | `'ACTIVE'` | Enum: `'ACTIVE'` \| `'INACTIVE'` | Visibility flag |
| `isDeleted` | Boolean | No | `false` | Indexed | Soft-delete flag; deleted records excluded from all queries |
| `deletedAt` | Date | No | `null` | — | Set on soft delete |
| `createdAt` | Date | auto | timestamps | — | Auto-managed |
| `updatedAt` | Date | auto | timestamps | — | Auto-managed |

### Indexes

| Index | Fields |
|-------|--------|
| Single | `centerId` |
| Single | `isDeleted` |
| Single | `cityAddress` |
| Compound | `{ centerId: 1, status: 1, isDeleted: 1 }` |

### Query Filter Constant

All read/update/delete operations use `NOT_DELETED = { isDeleted: false }` from `utils/contentMastersHelpers.js`.

---

## SECTION 3 — COMPLETE API INVENTORY

| Feature | Method | Endpoint | Auth Required |
|---------|--------|----------|---------------|
| Create city | POST | `/api/cities` | Yes — Super Admin |
| List cities (search, filters, pagination, sort) | GET | `/api/cities` | Yes — Super Admin |
| Cities by center (dependent dropdown) | GET | `/api/cities/by-center/:centerId` | Yes — Super Admin |
| Get city by ID | GET | `/api/cities/:id` | Yes — Super Admin |
| Update city | PUT | `/api/cities/:id` | Yes — Super Admin |
| Update city status only | PATCH | `/api/cities/status/:id` | Yes — Super Admin |
| Delete city (soft) | DELETE | `/api/cities/:id` | Yes — Super Admin |

**Route middleware (all endpoints):** `protect` → `requireSuperAdmin`  
**Source:** `routes/cityRoutes.js` line 15

> There is **no** `GET /api/cities/dropdown` endpoint. Use `GET /api/cities/by-center/:centerId` for dependent dropdowns.

---

## SECTION 4 — CREATE CITY API

| | |
|---|---|
| **Endpoint** | `POST /api/cities` |
| **Method** | POST |
| **Authentication** | Bearer JWT — Super Admin only |

### Headers

| Header | Value |
|--------|-------|
| `Authorization` | `Bearer <JWT>` |
| `Content-Type` | `application/json` |
| `Accept` | `application/json` |

### Authorization

- `protect` middleware validates JWT (`middleware/authMiddleware.js`).
- `requireSuperAdmin` allows legacy `User` with `role: super_admin` OR `AdminAccess` with `roleCode: SUPER_ADMIN` (`middleware/requireSuperAdmin.js`).

### Request Body (DTO)

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `centerId` | ObjectId string | **Yes** | Must be an ACTIVE center |
| `cityAddress` | string | **Yes** | Also accepts aliases `cityaddress`, `city_address` (resolved by `resolveCityAddress()`) |
| `status` | string | No | `'ACTIVE'` (default) or `'INACTIVE'`; any value other than `'INACTIVE'` becomes `'ACTIVE'` |

### Validation Rules

1. `centerId` must be present → `400` `"centerId is required"`.
2. `cityAddress` must be non-empty after trim → `400` `"cityAddress is required"`.
3. Center must exist with `status: 'ACTIVE'` → `400` with message referencing centers dropdown endpoints.

### Example Request

```http
POST /api/cities
Authorization: Bearer <token>
Content-Type: application/json

{
  "centerId": "665a00000000000000000001",
  "cityAddress": "Plot 12, Road No 5, Banjara Hills, Hyderabad - 500034",
  "status": "ACTIVE"
}
```

### Example Success Response — `201`

```json
{
  "success": true,
  "message": "City created successfully",
  "data": {
    "_id": "665c1b2c3d4e5f6789012345",
    "centerId": "665a00000000000000000001",
    "centerName": "Hyderabad Main Center",
    "cityAddress": "Plot 12, Road No 5, Banjara Hills, Hyderabad - 500034",
    "status": "ACTIVE",
    "createdAt": "2025-06-01T10:00:00.000Z",
    "updatedAt": "2025-06-01T10:00:00.000Z"
  }
}
```

### Error Responses

| Status | Condition | Body |
|--------|-----------|------|
| 400 | Missing `centerId` | `{ "success": false, "message": "centerId is required" }` |
| 400 | Missing/empty `cityAddress` | `{ "success": false, "message": "cityAddress is required" }` |
| 400 | Invalid/inactive center | `{ "success": false, "message": "Invalid or inactive center. Use an ACTIVE center from GET /api/centers/dropdown or /api/admin/centers/dropdown." }` |
| 401 | No/invalid token | `{ "success": false, "message": "Not authorized, no token" }` or `"Not authenticated"` |
| 403 | Not Super Admin | `{ "success": false, "message": "Access denied. Super Admin only." }` |
| 500 | Server error | `{ "success": false, "message": "Server error", "error": "..." }` |

### MongoDB Operation

`City.create({ centerId, cityAddress, status })` → writes to `cities` collection.

---

## SECTION 5 — UPDATE CITY API

| | |
|---|---|
| **Endpoint** | `PUT /api/cities/:id` |
| **Method** | PUT |
| **Authentication** | Super Admin |

### Request Body (DTO) — All Fields Optional

| Field | Type | Validation |
|-------|------|------------|
| `centerId` | ObjectId string | Must reference ACTIVE center if provided |
| `cityAddress` | string | Cannot be empty if provided; aliases `cityaddress`, `city_address` accepted |
| `status` | string | Must be `'ACTIVE'` or `'INACTIVE'` |

Send only fields you want to change.

### Example Request

```http
PUT /api/cities/665c1b2c3d4e5f6789012345
Authorization: Bearer <token>
Content-Type: application/json

{
  "cityAddress": "Updated: MG Road, Secunderabad - 500003",
  "status": "ACTIVE"
}
```

### Example Success Response — `200`

```json
{
  "success": true,
  "message": "City updated successfully",
  "data": {
    "_id": "665c1b2c3d4e5f6789012345",
    "centerId": "665a00000000000000000001",
    "centerName": "Hyderabad Main Center",
    "cityAddress": "Updated: MG Road, Secunderabad - 500003",
    "status": "ACTIVE",
    "createdAt": "2025-06-01T10:00:00.000Z",
    "updatedAt": "2025-06-15T14:30:00.000Z"
  }
}
```

### Error Responses

| Status | Condition | Body |
|--------|-----------|------|
| 404 | City not found or soft-deleted | `{ "success": false, "message": "City not found" }` |
| 400 | Empty `cityAddress` | `{ "success": false, "message": "cityAddress cannot be empty" }` |
| 400 | Invalid/inactive center | Same center validation message as create |
| 400 | Invalid status | `{ "success": false, "message": "Status must be ACTIVE or INACTIVE" }` |
| 401 / 403 / 500 | Same as create | — |

### MongoDB Operation

`city.save()` after in-memory field updates on the found document.

---

## SECTION 6 — DELETE CITY API

| | |
|---|---|
| **Endpoint** | `DELETE /api/cities/:id` |
| **Method** | DELETE |
| **Authentication** | Super Admin |

### Behavior — Soft Delete

The record is **not** removed from MongoDB. The controller sets:

- `isDeleted: true`
- `deletedAt: new Date()`
- `status: 'INACTIVE'`

### Example Request

```http
DELETE /api/cities/665c1b2c3d4e5f6789012345
Authorization: Bearer <token>
```

### Example Success Response — `200`

```json
{
  "success": true,
  "message": "City deleted successfully",
  "data": {
    "_id": "665c1b2c3d4e5f6789012345"
  }
}
```

### Error Responses

| Status | Condition | Body |
|--------|-----------|------|
| 404 | Not found or already deleted | `{ "success": false, "message": "City not found" }` |
| 401 / 403 / 500 | Same as create | — |

> **Downstream impact:** Active classrooms referencing this city will fail `validateCityBelongsToCenter()` on create/update because deleted/inactive cities are excluded. Verify linked classrooms before deleting.

---

## SECTION 7 — GET CITY LIST API

| | |
|---|---|
| **Endpoint** | `GET /api/cities` |
| **Method** | GET |
| **Authentication** | Super Admin |

### Query Parameters

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `page` | number | `1` | Page number (min 1) |
| `limit` | number | `10` | Page size (min 1, max 100) |
| `search` | string | `""` | Case-insensitive regex on `cityAddress` OR `centerDoc.centerName` OR `centerDoc.name` |
| `center` | ObjectId | — | Filter by `centerId`; invalid ObjectIds are silently ignored |
| `status` | string | — | `ACTIVE` or `INACTIVE`; omit for all statuses |
| `sortBy` | string | `createdAt` | `createdAt`, `cityAddress`, `status`, `centerName` |
| `sortOrder` | string | `desc` | `asc` or `desc` |

### Pagination Logic

From `utils/contentMastersHelpers.js` → `parsePagination()`:

```text
page  = max(1, parseInt(page) || 1)
limit = min(100, max(1, parseInt(limit) || 10))
skip  = (page - 1) * limit
```

### Search Logic

Aggregation pipeline (`buildCityListPipeline`):

1. `$match` base filters (`isDeleted: false`, optional `center`, optional `status`).
2. `$lookup` centers collection.
3. `$unwind` centerDoc.
4. If `search` trimmed non-empty: `$match` with `$or` regex on `cityAddress`, `centerDoc.centerName`, `centerDoc.name`.
5. `$sort`, `$skip`, `$limit`.
6. `$project` with `centerName` from lookup.

### Sort Logic

- Allowed direct sort fields: `createdAt`, `cityAddress`, `status`.
- `sortBy=centerName` sorts on aggregated `centerName` field (not a DB column on City).
- Invalid `sortBy` falls back to `createdAt`.

### Status Logic

- Filter: only applied when `status` is exactly `ACTIVE` or `INACTIVE`.
- List includes both statuses when `status` param is omitted.
- Soft-deleted records never appear.

### Response DTO (per item via `formatCity`)

| Field | Type | Description |
|-------|------|-------------|
| `_id` | string | City ObjectId |
| `centerId` | string | Center ObjectId |
| `centerName` | string | Denormalized from center lookup |
| `cityAddress` | string | Address text |
| `status` | string | `ACTIVE` \| `INACTIVE` |
| `createdAt` | string (ISO) | Created timestamp |
| `updatedAt` | string (ISO) | Updated timestamp |

### Example Request

```http
GET /api/cities?page=1&limit=10&search=hyderabad&center=665a00000000000000000001&status=ACTIVE&sortBy=cityAddress&sortOrder=asc
Authorization: Bearer <token>
```

### Example Success Response — `200`

```json
{
  "success": true,
  "total": 15,
  "page": 1,
  "limit": 10,
  "totalPages": 2,
  "count": 10,
  "data": [
    {
      "_id": "665c1b2c3d4e5f6789012345",
      "centerId": "665a00000000000000000001",
      "centerName": "Hyderabad Main Center",
      "cityAddress": "Plot 12, Banjara Hills, Hyderabad",
      "status": "ACTIVE",
      "createdAt": "2025-06-01T10:00:00.000Z",
      "updatedAt": "2025-06-01T10:00:00.000Z"
    }
  ]
}
```

---

## SECTION 8 — GET SINGLE CITY API

| | |
|---|---|
| **Endpoint** | `GET /api/cities/:id` |
| **Method** | GET |
| **Authentication** | Super Admin |

### Behavior

- Finds city where `_id` matches and `isDeleted: false`.
- Populates `centerId` with `centerName`, `name`, `centerCode`, `city`, `state`, `status` (populated fields are used internally; response uses `formatCity` which returns `_id`, `centerId`, `centerName`, `cityAddress`, `status`, timestamps).

### Example Success Response — `200`

```json
{
  "success": true,
  "data": {
    "_id": "665c1b2c3d4e5f6789012345",
    "centerId": "665a00000000000000000001",
    "centerName": "Hyderabad Main Center",
    "cityAddress": "Plot 12, Banjara Hills, Hyderabad",
    "status": "ACTIVE",
    "createdAt": "2025-06-01T10:00:00.000Z",
    "updatedAt": "2025-06-01T10:00:00.000Z"
  }
}
```

### Error Responses

| Status | Body |
|--------|------|
| 404 | `{ "success": false, "message": "City not found" }` |
| 500 | `{ "success": false, "message": "Server error", "error": "..." }` |

---

## SECTION 8b — UPDATE CITY STATUS API

| | |
|---|---|
| **Endpoint** | `PATCH /api/cities/status/:id` |
| **Method** | PATCH |
| **Authentication** | Super Admin |

### Request Body

| Field | Type | Required |
|-------|------|----------|
| `status` | string | **Yes** — must be `ACTIVE` or `INACTIVE` |

### Example Request

```http
PATCH /api/cities/status/665c1b2c3d4e5f6789012345
Authorization: Bearer <token>
Content-Type: application/json

{ "status": "INACTIVE" }
```

### Example Success Response — `200`

```json
{
  "success": true,
  "message": "City status updated",
  "data": {
    "_id": "665c1b2c3d4e5f6789012345",
    "centerId": "665a00000000000000000001",
    "centerName": "Hyderabad Main Center",
    "cityAddress": "Plot 12, Banjara Hills, Hyderabad",
    "status": "INACTIVE",
    "createdAt": "2025-06-01T10:00:00.000Z",
    "updatedAt": "2025-06-15T14:30:00.000Z"
  }
}
```

---

## SECTION 9 — DROPDOWN APIs

### APIs Required by the City Module (Create/Edit Form)

#### 1. Centers Dropdown

| | |
|---|---|
| **Endpoint** | `GET /api/admin/centers/dropdown` |
| **Alternate** | `GET /api/centers/dropdown` (same handler, mounted in `app.js`) |
| **Auth** | Staff Admin+ (`protect` + `requireStaffAdmin`) — Super Admin qualifies |
| **Source** | `controllers/centerManagementController.js` → `getCentersDropdown` |

**Response Structure:**

```json
{
  "success": true,
  "count": 2,
  "data": [
    {
      "_id": "665a00000000000000000001",
      "centerName": "Hyderabad Main Center",
      "centerCode": "HYD01",
      "city": "Hyderabad",
      "state": "Telangana"
    }
  ]
}
```

| Frontend Mapping | Value | Label |
|------------------|-------|-------|
| Center select | `data[]._id` | `data[].centerName` (optionally append `centerCode`) |

> Note: `city` and `state` here are **Center** geographic fields (strings), not the `City` collection.

**Existing frontend service:** `centerService.getCentersDropdown()` → `src/services/centerService.ts`

---

### APIs Provided by the City Module (For Downstream Forms)

#### 2. Cities by Center (Dependent Dropdown)

| | |
|---|---|
| **Endpoint** | `GET /api/cities/by-center/:centerId` |
| **Auth** | Super Admin |
| **Source** | `controllers/cityController.js` → `getCitiesByCenter` |

Returns only cities where:

- `centerId` matches the given center
- `status: 'ACTIVE'`
- `isDeleted: false`

**Response Structure:**

```json
{
  "success": true,
  "count": 2,
  "data": [
    {
      "_id": "665c1b2c3d4e5f6789012345",
      "centerId": "665a00000000000000000001",
      "cityAddress": "Ameerpet, Hyderabad",
      "cityName": "Ameerpet, Hyderabad"
    }
  ]
}
```

| Frontend Mapping | Value | Label |
|------------------|-------|-------|
| City select (Classroom etc.) | `data[]._id` | `data[].cityAddress` or `data[].cityName` (alias, same value) |

**Enable query only when `centerId` is selected.**

---

### Dropdown APIs NOT Required by City Module

The City create/edit form does **not** use these. They are documented because downstream modules consume City output:

| Dropdown | Endpoint | Used By | City Connection |
|----------|----------|---------|-----------------|
| Classrooms | `GET /api/classrooms/dropdown?centerId=&city=` | Live classes, scheduling | Filters by `city` ObjectId |
| Faculty | `GET /api/teachers/dropdown` | Teacher management | No City ref |
| Courses | `GET /api/courses/dropdown` | Course forms | No City ref |
| Subjects | `GET /api/subjects/dropdown` | Subject forms | No City ref |
| Batches | `POST /api/batches/dropdown` | Batch forms | No City ref |

### Dependent Dropdown Chain (Classroom Module)

```text
1. GET /api/admin/centers/dropdown          → select center
2. GET /api/cities/by-center/:centerId    → select city
3. POST /api/classrooms                     → create with center + city
```

---

## SECTION 10 — FILE UPLOADS

**City does not support file uploads.** There are no image, document, brochure, or media fields on the `City` model and no upload endpoints in `cityRoutes.js`.

---

## SECTION 11 — FRONTEND SERVICE ARCHITECTURE

Target structure (to be implemented by frontend team):

```text
src/
├── services/
│   ├── api.ts              # Existing — Axios instance with Bearer interceptor
│   └── cityService.ts      # New — City API methods
├── types/
│   └── city.ts             # New — TypeScript interfaces
└── hooks/
    └── useCities.ts        # New — React Query hooks
```

### `src/types/city.ts`

```typescript
export type CityStatus = 'ACTIVE' | 'INACTIVE';

export interface City {
  _id: string;
  centerId: string;
  centerName: string;
  cityAddress: string;
  status: CityStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CityDropdownItem {
  _id: string;
  centerId: string;
  cityAddress: string;
  cityName: string; // alias for cityAddress
}

export interface CityListParams {
  page?: number;
  limit?: number;
  search?: string;
  center?: string;
  status?: CityStatus;
  sortBy?: 'createdAt' | 'cityAddress' | 'status' | 'centerName';
  sortOrder?: 'asc' | 'desc';
}

export interface CreateCityPayload {
  centerId: string;
  cityAddress: string;
  status?: CityStatus;
}

export interface UpdateCityPayload {
  centerId?: string;
  cityAddress?: string;
  status?: CityStatus;
}
```

### `src/services/cityService.ts`

```typescript
import api from './api';
import { stripEmptyParams } from './commonService';
import type { ApiSuccessResponse } from '../types/api';
import type {
  City,
  CityDropdownItem,
  CityListParams,
  CityStatus,
  CreateCityPayload,
  UpdateCityPayload,
} from '../types/city';

const CITIES_BASE = '/api/cities';

type PaginatedCitiesResponse = ApiSuccessResponse<City[]> & {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  count: number;
};

export const cityService = {
  /** GET /api/cities — paginated list */
  getCities: async (params?: CityListParams) => {
    const { data } = await api.get<PaginatedCitiesResponse>(CITIES_BASE, {
      params: stripEmptyParams(params),
    });
    return data;
  },

  /** GET /api/cities/:id — single record */
  getCityById: async (id: string) => {
    const { data } = await api.get<ApiSuccessResponse<City>>(`${CITIES_BASE}/${id}`);
    return data;
  },

  /** POST /api/cities — create */
  createCity: async (payload: CreateCityPayload) => {
    const { data } = await api.post<ApiSuccessResponse<City>>(CITIES_BASE, payload);
    return data;
  },

  /** PUT /api/cities/:id — partial update */
  updateCity: async (id: string, payload: UpdateCityPayload) => {
    const { data } = await api.put<ApiSuccessResponse<City>>(`${CITIES_BASE}/${id}`, payload);
    return data;
  },

  /** PATCH /api/cities/status/:id — status-only update */
  updateCityStatus: async (id: string, status: CityStatus) => {
    const { data } = await api.patch<ApiSuccessResponse<City>>(
      `${CITIES_BASE}/status/${id}`,
      { status }
    );
    return data;
  },

  /** DELETE /api/cities/:id — soft delete */
  deleteCity: async (id: string) => {
    const { data } = await api.delete<ApiSuccessResponse<{ _id: string }>>(
      `${CITIES_BASE}/${id}`
    );
    return data;
  },

  /** GET /api/cities/by-center/:centerId — ACTIVE cities dropdown */
  getCitiesByCenter: async (centerId: string) => {
    const { data } = await api.get<ApiSuccessResponse<CityDropdownItem[]>>(
      `${CITIES_BASE}/by-center/${centerId}`
    );
    return data;
  },
};

export default cityService;
```

> **Note:** `getCityDropdown()` maps to `getCitiesByCenter(centerId)` — there is no global city dropdown endpoint.

---

## SECTION 12 — REACT QUERY INTEGRATION

### Query Keys (`src/hooks/queryKeys.ts`)

```typescript
import type { CityListParams } from '../types/city';

export const cityKeys = {
  all: ['cities'] as const,
  lists: () => [...cityKeys.all, 'list'] as const,
  list: (params?: CityListParams) => [...cityKeys.lists(), params ?? {}] as const,
  details: () => [...cityKeys.all, 'detail'] as const,
  detail: (id: string) => [...cityKeys.details(), id] as const,
  byCenter: (centerId: string) => [...cityKeys.all, 'by-center', centerId] as const,
};
```

### `src/hooks/useCities.ts`

```typescript
import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseQueryOptions,
} from '@tanstack/react-query';
import { cityService } from '../services/cityService';
import { cityKeys } from './queryKeys';
import { handleApiError } from '../utils/errorHandler';
import type { ApiSuccessResponse } from '../types/api';
import type {
  City,
  CityDropdownItem,
  CityListParams,
  CityStatus,
  CreateCityPayload,
  UpdateCityPayload,
} from '../types/city';

type CitiesResponse = ApiSuccessResponse<City[]> & {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  count: number;
};

/** GET /api/cities — paginated list */
export const useCities = (
  params?: CityListParams,
  options?: Omit<UseQueryOptions<CitiesResponse>, 'queryKey' | 'queryFn'>
) =>
  useQuery({
    queryKey: cityKeys.list(params),
    queryFn: () => cityService.getCities(params),
    ...options,
  });

/** GET /api/cities/:id */
export const useCity = (
  id: string | undefined,
  options?: Omit<UseQueryOptions<ApiSuccessResponse<City>>, 'queryKey' | 'queryFn'>
) =>
  useQuery({
    queryKey: cityKeys.detail(id ?? ''),
    queryFn: () => cityService.getCityById(id!),
    enabled: Boolean(id),
    ...options,
  });

/** GET /api/cities/by-center/:centerId — dependent dropdown */
export const useCitiesByCenter = (
  centerId: string | undefined,
  options?: Omit<UseQueryOptions<ApiSuccessResponse<CityDropdownItem[]>>, 'queryKey' | 'queryFn'>
) =>
  useQuery({
    queryKey: cityKeys.byCenter(centerId ?? ''),
    queryFn: () => cityService.getCitiesByCenter(centerId!),
    enabled: Boolean(centerId),
    staleTime: 60_000,
    ...options,
  });

/** POST /api/cities */
export const useCreateCity = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateCityPayload) => cityService.createCity(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cityKeys.all });
    },
    onError: (error) => handleApiError(error),
  });
};

/** PUT /api/cities/:id */
export const useUpdateCity = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateCityPayload }) =>
      cityService.updateCity(id, payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: cityKeys.all });
      queryClient.invalidateQueries({ queryKey: cityKeys.detail(variables.id) });
    },
    onError: (error) => handleApiError(error),
  });
};

/** PATCH /api/cities/status/:id — optimistic status toggle */
export const useUpdateCityStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: CityStatus }) =>
      cityService.updateCityStatus(id, status),
    onMutate: async ({ id, status }) => {
      await queryClient.cancelQueries({ queryKey: cityKeys.detail(id) });
      const previous = queryClient.getQueryData<ApiSuccessResponse<City>>(
        cityKeys.detail(id)
      );
      if (previous?.data) {
        queryClient.setQueryData(cityKeys.detail(id), {
          ...previous,
          data: { ...previous.data, status },
        });
      }
      return { previous };
    },
    onError: (error, variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(cityKeys.detail(variables.id), context.previous);
      }
      handleApiError(error);
    },
    onSettled: (_data, _error, variables) => {
      queryClient.invalidateQueries({ queryKey: cityKeys.all });
      queryClient.invalidateQueries({ queryKey: cityKeys.detail(variables.id) });
    },
  });
};

/** DELETE /api/cities/:id */
export const useDeleteCity = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => cityService.deleteCity(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cityKeys.all });
    },
    onError: (error) => handleApiError(error),
  });
};
```

### Cache Strategy

| Hook | `staleTime` | Notes |
|------|-------------|-------|
| `useCities` | default (0) | Refetch on window focus; invalidate after mutations |
| `useCity` | default (0) | Enabled only when `id` is truthy |
| `useCitiesByCenter` | `60_000` ms | Dropdown data changes infrequently |

### Refetch Strategy

- After create/update/delete/status: `invalidateQueries({ queryKey: cityKeys.all })`.
- After update/status: also invalidate `cityKeys.detail(id)`.
- List page: pass new `page`/`search`/`center`/`status` via `CityListParams` — query key changes trigger refetch.

### Optimistic Updates

- Apply optimistic update only on `useUpdateCityStatus` (list-row toggle pattern).
- Create, update, and delete wait for server response before cache invalidation.

---

## SECTION 13 — FORM FIELD MAPPING

### Add / Edit City Form

| Frontend Field | Backend Field | Required (Create) | Validation | Default Value | Dropdown Source |
|----------------|---------------|-------------------|------------|---------------|-----------------|
| Center | `centerId` | **Yes** | Must be ACTIVE center ObjectId | — | `GET /api/admin/centers/dropdown` → `centerService.getCentersDropdown()` |
| City Address | `cityAddress` | **Yes** | Non-empty trimmed string | — | Free text |
| Status | `status` | No | `ACTIVE` \| `INACTIVE` | `ACTIVE` | Static enum select |

### Edit-Only Notes

- All fields optional on `PUT` — send only changed fields.
- `cityAddress` aliases accepted by backend: `cityaddress`, `city_address` (prefer `cityAddress` in frontend).
- Changing `centerId` re-validates against ACTIVE centers.

### Client-Side Pre-Validation (Recommended)

```typescript
const schema = {
  centerId: (v: string) => Boolean(v?.trim()) || 'Center is required',
  cityAddress: (v: string) => Boolean(v?.trim()) || 'City address is required',
  status: (v: string) => !v || v === 'ACTIVE' || v === 'INACTIVE' || 'Invalid status',
};
```

---

## SECTION 14 — TABLE FIELD MAPPING

### City Listing Table

| Column | Source Field | Sortable (`sortBy`) | Notes |
|--------|--------------|---------------------|-------|
| Center Name | `centerName` | `centerName` | Denormalized in list response |
| City Address | `cityAddress` | `cityAddress` | Primary display field |
| Status | `status` | `status` | Badge: ACTIVE / INACTIVE |
| Created | `createdAt` | `createdAt` | Format as locale date |
| Updated | `updatedAt` | — | Not in default sort options but available in data |
| Actions | — | — | View, Edit, Toggle Status, Delete |

### Search

| UI Control | Query Param | Backend Matches |
|------------|-------------|-----------------|
| Search input | `search` | `cityAddress`, center `centerName`, center `name` (case-insensitive contains) |

Debounce recommended: 300ms.

### Filters

| UI Control | Query Param | Values |
|------------|-------------|--------|
| Center filter | `center` | Center ObjectId from centers dropdown |
| Status filter | `status` | `ACTIVE`, `INACTIVE`, or omit for all |

### Pagination

| UI Control | Query Param | Backend |
|------------|-------------|---------|
| Page number | `page` | Default 1 |
| Page size | `limit` | Default 10, max 100 |
| Total pages | — | From response `totalPages` |
| Total records | — | From response `total` |

### Row Actions

| Action | API Call |
|--------|----------|
| View | `GET /api/cities/:id` |
| Edit | Navigate to form → `PUT /api/cities/:id` |
| Toggle status | `PATCH /api/cities/status/:id` |
| Delete | `DELETE /api/cities/:id` (confirm dialog) |

### Bulk Actions

**Not supported.** No bulk status or bulk delete endpoints exist for City.

### Status Handling

- Display `ACTIVE` / `INACTIVE` from `data.status`.
- Row toggle calls `PATCH /api/cities/status/:id` with `{ status: toggledValue }`.
- Deleted cities do not appear in list (soft-deleted).

### Export Support

**Not supported.** No export endpoint exists for City.

---

## SECTION 15 — ERROR HANDLING

| Status | When | Response Shape | Frontend Behavior |
|--------|------|----------------|-------------------|
| **400** | Validation failure (missing fields, invalid center, empty address, invalid status) | `{ success: false, message: "..." }` | Show `message` inline on form or toast; do not update cache |
| **401** | Missing/invalid/expired JWT | `{ success: false, message: "Not authorized, no token" }` or `"Not authenticated"` | Clear token; dispatch `auth:unauthorized` (handled by `api.ts` interceptor); redirect to login |
| **403** | Authenticated but not Super Admin; disabled account | `{ success: false, message: "Access denied. Super Admin only." }` or `"Account is disabled"` | Show access denied page; do not retry |
| **404** | City not found (invalid id or soft-deleted) | `{ success: false, message: "City not found" }` | Redirect to list; show toast |
| **409** | — | **Not used by City APIs** | — |
| **422** | — | **Not used by City APIs** (no express-validator middleware on city routes) | — |
| **500** | Unhandled server error | `{ success: false, message: "Server error", error: "..." }` | Show generic error toast; log `error` field |
| **Network** | Timeout, offline, CORS | Axios error without `response` | `handleApiError()` in `src/utils/errorHandler.ts`; show retry option |

---

## SECTION 16 — AUTHORIZATION

### Roles

| Role | Access to City APIs |
|------|---------------------|
| **SUPER_ADMIN** (legacy `User.role = super_admin` OR `AdminAccess.roleCode = SUPER_ADMIN`) | Full CRUD |
| All other roles | **Denied** — 403 |

### Permissions Matrix

City routes use `requireSuperAdmin` — **not** the granular `PermissionMatrix` feature system. Super Admin bypasses all feature checks (`hasFeaturePermission` returns `true` for Super Admin).

| Endpoint Group | Middleware Chain |
|----------------|------------------|
| `/api/cities/*` | `protect` → `requireSuperAdmin` |
| `/api/admin/centers/dropdown` | `protect` → `requireStaffAdmin` |

### Protected Routes (Frontend)

| Route | Guard |
|-------|-------|
| `/academics/categories/city` (list) | Require Super Admin session |
| `/academics/categories/city/create` | Require Super Admin session |
| `/academics/categories/city/:id/edit` | Require Super Admin session |

### Authentication

```http
POST /api/auth/login-super-admin
Content-Type: application/json

{ "email": "admin@sriram.com", "password": "admin123" }
```

**Response** (via `sendSuccess`):

```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "<JWT>",
    "user": { "id": "...", "name": "...", "email": "...", "role": "super_admin" }
  }
}
```

Store token via `setAuthToken()` in `src/services/api.ts`.

### Future Role Support

If non–Super Admin roles need City access, backend route middleware must change. Currently **only Super Admin** is authorized. Frontend should not assume broader access.

---

## SECTION 17 — SERVER PERSISTENCE VERIFICATION

Never assume local state alone confirms persistence. Verify using backend responses:

| Operation | Verify With | Success Criteria |
|-----------|-------------|------------------|
| **Create** | `POST /api/cities` response | `success: true`, `message: "City created successfully"`, `data._id` present, `data.cityAddress` matches payload |
| **Update** | `PUT /api/cities/:id` response | `success: true`, `message: "City updated successfully"`, `data` reflects changes |
| **Status toggle** | `PATCH /api/cities/status/:id` response | `success: true`, `data.status` matches sent value |
| **Delete** | `DELETE /api/cities/:id` response | `success: true`, `message: "City deleted successfully"`, `data._id` matches |
| **Retrieve list** | `GET /api/cities` response | Created city appears in `data[]`; deleted city absent |
| **Retrieve single** | `GET /api/cities/:id` response | `success: true` with full `data` object |
| **Post-delete** | `GET /api/cities/:id` | `404` `{ "message": "City not found" }` |

### Re-fetch After Mutation

```typescript
const create = useCreateCity();
create.mutate(payload, {
  onSuccess: (res) => {
    if (res.success && res.data?._id) {
      // Confirmed persisted — navigate or show success
    }
  },
});
```

### MongoDB Write Operations

| Action | Controller Method | MongoDB Operation |
|--------|-------------------|-------------------|
| Create | `createCity` | `City.create()` |
| Update | `updateCity` | `city.save()` |
| Status | `updateCityStatus` | `findOneAndUpdate({ status })` |
| Delete | `deleteCity` | `city.save()` with `isDeleted: true` |

---

## SECTION 18 — PRODUCTION TEST CHECKLIST

- [ ] City Service Created (`src/services/cityService.ts`)
- [ ] City Types Created (`src/types/city.ts`)
- [ ] React Query Hooks Created (`src/hooks/useCities.ts`)
- [ ] Query Keys Added (`cityKeys` in `src/hooks/queryKeys.ts`)
- [ ] CRUD Connected (create, read, update, delete)
- [ ] Status Toggle Connected (`PATCH /api/cities/status/:id`)
- [ ] Search Connected (`search` query param)
- [ ] Filters Connected (`center`, `status`)
- [ ] Pagination Connected (`page`, `limit`, `totalPages`)
- [ ] Sorting Connected (`sortBy`, `sortOrder`)
- [ ] Center Dropdown Connected (`GET /api/admin/centers/dropdown`)
- [ ] Cities-by-Center Dropdown Connected (`GET /api/cities/by-center/:centerId`) — for downstream modules
- [ ] Authorization Tested (403 for non–Super Admin)
- [ ] Authentication Tested (401 without token)
- [ ] Server Persistence Verified (re-fetch after create/update/delete)
- [ ] Error Handling Verified (400, 401, 403, 404, 500)
- [ ] Production Ready

---

## SECTION 19 — IMPLEMENTATION FLOW

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│ 1. FRONTEND FORM                                                            │
│    User selects Center (dropdown) + enters cityAddress + optional status    │
└──────────────────────────────────┬──────────────────────────────────────────┘
                                   ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ 2. CLIENT VALIDATION                                                        │
│    centerId non-empty · cityAddress trimmed non-empty · status enum         │
└──────────────────────────────────┬──────────────────────────────────────────┘
                                   ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ 3. REACT QUERY MUTATION                                                     │
│    useCreateCity() / useUpdateCity() / useDeleteCity() / useUpdateCityStatus│
└──────────────────────────────────┬──────────────────────────────────────────┘
                                   ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ 4. SERVICE LAYER                                                            │
│    cityService.createCity(payload) → stripEmptyParams for list queries      │
└──────────────────────────────────┬──────────────────────────────────────────┘
                                   ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ 5. AXIOS INSTANCE (src/services/api.ts)                                     │
│    Base URL from VITE_API_BASE_URL · Authorization: Bearer <token>            │
└──────────────────────────────────┬──────────────────────────────────────────┘
                                   ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ 6. BACKEND ROUTE (routes/cityRoutes.js)                                     │
│    protect → requireSuperAdmin → controller handler                           │
└──────────────────────────────────┬──────────────────────────────────────────┘
                                   ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ 7. CONTROLLER (controllers/cityController.js)                               │
│    Validate input · findActiveCenter() · resolveCityAddress()               │
│    buildCityListPipeline() for list · formatCity() for responses              │
└──────────────────────────────────┬──────────────────────────────────────────┘
                                   ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ 8. MONGODB (collection: cities)                                             │
│    create / save / aggregate / findOneAndUpdate                               │
└──────────────────────────────────┬──────────────────────────────────────────┘
                                   ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ 9. RESPONSE                                                                 │
│    { success, message?, data, total?, page?, limit?, totalPages?, count? }  │
└──────────────────────────────────┬──────────────────────────────────────────┘
                                   ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ 10. REACT QUERY CACHE UPDATE                                                │
│     invalidateQueries(cityKeys.all) · optimistic status on toggle             │
└──────────────────────────────────┬──────────────────────────────────────────┘
                                   ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ 11. UI REFRESH                                                              │
│     List re-renders from cache · toast success/error · navigate on create   │
└─────────────────────────────────────────────────────────────────────────────┘
```

### List Page Flow

```text
useCities({ page, limit, search, center, status, sortBy, sortOrder })
  → cityService.getCities(params)
  → GET /api/cities?...
  → cityController.getCities
  → City.aggregate(dataPipeline) + City.aggregate(countPipeline)
  → { total, page, limit, totalPages, count, data[] }
  → Render table with pagination controls
```

### Dependent Dropdown Flow (Downstream — Classroom)

```text
useCentersDropdown()
  → GET /api/admin/centers/dropdown
  → User selects centerId

useCitiesByCenter(centerId)
  → GET /api/cities/by-center/:centerId
  → User selects city _id

(Classroom form submits center + city to POST /api/classrooms)
```

---

## BACKEND SOURCE REFERENCES

| File | Purpose |
|------|---------|
| `routes/cityRoutes.js` | Route definitions and middleware |
| `controllers/cityController.js` | All request handlers |
| `models/City.js` | Mongoose schema |
| `utils/academicHierarchyHelpers.js` | `findActiveCenter()` |
| `utils/contentMastersHelpers.js` | Pagination, sort, `NOT_DELETED`, regex escape |
| `utils/classroomHelpers.js` | `validateCityBelongsToCenter()` — downstream validation |
| `middleware/authMiddleware.js` | JWT `protect` |
| `middleware/requireSuperAdmin.js` | Super Admin gate |
| `app.js` line 259 | Mount: `/api/cities` |
| `CITY_POSTMAN_COLLECTION.json` | Postman test collection |
| `CITY_API_GUIDE.md` | Backend API quick reference |
| `CLASSROOM_API_GUIDE.md` | Center → City → Classroom hierarchy |

---

## RELATED DOCUMENTATION

- [Exam Category Integration Guide](./academics/exam-category-integration-guide.md) — sibling module under Academics → Categories
- [Exam Sub Category Integration Guide](./academics/exam-sub-category-integration-guide.md)
- `PROGRAM_CATEGORY_SUBCATEGORY_API_GUIDE.md` — academic hierarchy (parallel to City)
- `CLASSROOM_API_GUIDE.md` — primary downstream consumer of City dropdown
