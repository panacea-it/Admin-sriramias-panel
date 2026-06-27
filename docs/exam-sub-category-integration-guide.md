# Exam Sub Category — Frontend Integration Guide

> **Academics → Categories → Exam Sub Category**  
> Backend resource: `AcademicSubCategory` · API base: `/api/sub-categories` · MongoDB collection: `academicsubcategories`

---

## Module Overview

### Purpose

Exam Sub Categories refine an **Exam Category** into finer academic streams (e.g. Foundation, Prelims, Mains). Each record belongs to a **Center + Program + Exam Category** chain. Courses reference sub-categories as part of the academic hierarchy.

### Hierarchy

```text
Center → Program → Exam Category → Exam Sub Category → Course → Batch
```

### User Flow

1. Super Admin logs in with Super Admin credentials.
2. Opens **Academics → Categories → Exam Sub Category** list.
3. Filters by center, program, category, status; searches by name or ID; paginates/sorts.
4. **Create**: selects Center → Program → Exam Category (cascading) → enters sub-category name → saves.
5. **Edit**: updates name, hierarchy, or status.
6. **Toggle status**: `ACTIVE` ↔ `INACTIVE`.
7. **Delete**: hard delete (check linked courses first).

### Dependencies

| Dependency | API | Auth | Used For |
|------------|-----|------|----------|
| Centers dropdown | `GET /api/admin/centers/dropdown` | Staff Admin+ | Form step 1 |
| Programs by center | `GET /api/programs/by-center/:centerId` | Super Admin | Form step 2 |
| Categories filter | `GET /api/categories/filter?centerId=&programId=` | Super Admin | Form step 3 |
| Sub-category filter (downstream) | `GET /api/sub-categories/filter` | Super Admin | Course creation forms |

### Required APIs (this module)

| # | Method | Endpoint | Purpose |
|---|--------|----------|---------|
| 1 | GET | `/api/sub-categories` | Paginated list |
| 2 | GET | `/api/sub-categories/:id` | Detail |
| 3 | POST | `/api/sub-categories` | Create |
| 4 | PUT | `/api/sub-categories/:id` | Update |
| 5 | PATCH | `/api/sub-categories/status/:id` | Status toggle |
| 6 | DELETE | `/api/sub-categories/:id` | Delete |
| 7 | GET | `/api/sub-categories/filter` | ACTIVE dropdown |

---

## Authentication & Permissions

| Requirement | Value |
|-------------|-------|
| Header | `Authorization: Bearer <JWT>` |
| Role | **Super Admin only** |
| 401 | Not authenticated |
| 403 | Not Super Admin |

**Source:** `routes/academicSubCategoryRoutes.js` line 15

---

## API Mapping Table

| UI Action | Service Method | HTTP | Endpoint |
|-----------|----------------|------|----------|
| List | `getExamSubCategories()` | GET | `/api/sub-categories` |
| Detail | `getExamSubCategoryById(id)` | GET | `/api/sub-categories/:id` |
| Create | `createExamSubCategory(payload)` | POST | `/api/sub-categories` |
| Update | `updateExamSubCategory(id, payload)` | PUT | `/api/sub-categories/:id` |
| Toggle status | `toggleExamSubCategoryStatus(id, status)` | PATCH | `/api/sub-categories/status/:id` |
| Delete | `deleteExamSubCategory(id)` | DELETE | `/api/sub-categories/:id` |
| Dropdown | `getExamSubCategoriesFilter(params)` | GET | `/api/sub-categories/filter` |

---

## API Documentation

### 1. List Exam Sub Categories

| | |
|---|---|
| **Endpoint** | `GET /api/sub-categories` |
| **Method** | GET |
| **Authentication** | Bearer JWT — Super Admin |
| **Headers** | `Authorization: Bearer <token>`, `Accept: application/json` |

**Query Parameters:**

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `search` | string | `""` | Matches `subCategoryName` OR `subCategoryId` (case-insensitive) |
| `subCategoryName` | string | — | Alias for `search` (either works) |
| `center` | ObjectId | — | Filter by center |
| `program` | ObjectId | — | Filter by program |
| `category` | ObjectId | — | Filter by exam category |
| `status` | string | — | `ACTIVE` or `INACTIVE` |
| `page` | number | `1` | Page number |
| `limit` | number | `10` | Page size (1–100) |
| `sortBy` | string | `createdAt` | `createdAt`, `subCategoryName`, `subCategoryId`, `status` |
| `sortOrder` | string | `desc` | `asc` or `desc` |

**Success Response (200):**

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
      "subCategoryId": "SUB001",
      "subCategoryName": "Foundation",
      "centerId": "665a00000000000000000001",
      "centerName": "Hyderabad Center",
      "programId": "665b00000000000000000001",
      "programName": "IAS Foundation",
      "categoryId": "665a1b2c3d4e5f6789012345",
      "categoryName": "UPSC",
      "status": "ACTIVE",
      "linkedCourses": 0,
      "createdAt": "2025-06-01T10:00:00.000Z",
      "updatedAt": "2025-06-01T10:00:00.000Z"
    }
  ]
}
```

**Error Responses:** 401, 403, 500 (same pattern as categories).

**Frontend Usage Notes:**

- Prefer `search` param; `subCategoryName` is a backend alias.
- List always returns `linkedCourses: 0` — use detail for actual count.
- Debounce search input (matches name and ID).

**Example Axios Request:**

```typescript
const { data } = await api.get('/api/sub-categories', {
  params: {
    search: 'Foundation',
    center: centerId,
    program: programId,
    category: categoryId,
    status: 'ACTIVE',
    page: 1,
    limit: 10,
  },
});
```

**Example React Query Integration:**

```typescript
const { data, isLoading, isError } = useExamSubCategories({
  search: debouncedSearch,
  center: selectedCenter,
  program: selectedProgram,
  category: selectedCategory,
  status: statusFilter,
  page,
  limit: 10,
});
```

---

### 2. Get Exam Sub Category by ID

| | |
|---|---|
| **Endpoint** | `GET /api/sub-categories/:id` |
| **Method** | GET |
| **Authentication** | Super Admin |

**Success Response (200):**

```json
{
  "success": true,
  "data": {
    "_id": "665c1b2c3d4e5f6789012345",
    "subCategoryId": "SUB001",
    "subCategoryName": "Foundation",
    "centerId": "...",
    "centerName": "Hyderabad Center",
    "programId": "...",
    "programName": "IAS Foundation",
    "categoryId": "...",
    "categoryName": "UPSC",
    "status": "ACTIVE",
    "linkedCourses": 5,
    "createdAt": "...",
    "updatedAt": "..."
  }
}
```

**Error:** 404 `{ "success": false, "message": "SubCategory not found" }`

**Example React Query:**

```typescript
const { data } = useExamSubCategory(subCategoryId);
const subCategory = data?.data;
const courseCount = subCategory?.linkedCourses ?? 0;
```

---

### 3. Create Exam Sub Category

| | |
|---|---|
| **Endpoint** | `POST /api/sub-categories` |
| **Method** | POST |
| **Authentication** | Super Admin |
| **Headers** | `Content-Type: application/json` |

**Request Body:**

```json
{
  "centerId": "665a00000000000000000001",
  "programId": "665b00000000000000000001",
  "categoryId": "665a1b2c3d4e5f6789012345",
  "subCategoryName": "Foundation",
  "status": "ACTIVE"
}
```

| Field | Required | Type | Notes |
|-------|----------|------|-------|
| `centerId` | Yes | ObjectId | ACTIVE center |
| `programId` | Yes | ObjectId | ACTIVE program linked to center |
| `categoryId` | Yes | ObjectId | ACTIVE category matching center+program |
| `subCategoryName` | Yes | string | Unique per center+program+category |
| `status` | No | `ACTIVE` \| `INACTIVE` | Defaults `ACTIVE` |

**Success Response (201):**

```json
{
  "success": true,
  "message": "SubCategory created successfully",
  "data": { /* formatSubCategory */ }
}
```

**Error Responses:**

| Status | Message |
|--------|---------|
| 400 | `SubCategory name is required` |
| 400 | `Invalid category selection for the selected center and program` |
| 400 | `Invalid or inactive center` / `Invalid or inactive program` |
| 400 | `Selected program is not available for the selected center` |
| 400 | `SubCategory name already exists for this category` |

**Validation Notes:**

- `subCategoryId` auto-generated (`SUB001`, `SUB002`, …).
- `validateCategoryForHierarchy` ensures category is ACTIVE and matches center+program.

**Example Axios:**

```typescript
await api.post('/api/sub-categories', {
  centerId,
  programId,
  categoryId,
  subCategoryName: name.trim(),
  status: 'ACTIVE',
});
```

**Example React Query:**

```typescript
const createMutation = useCreateExamSubCategory();
createMutation.mutate({
  centerId,
  programId,
  categoryId,
  subCategoryName: name.trim(),
});
```

---

### 4. Update Exam Sub Category

| | |
|---|---|
| **Endpoint** | `PUT /api/sub-categories/:id` |
| **Method** | PUT |
| **Authentication** | Super Admin |

**Request Body (partial — all optional):**

```json
{
  "centerId": "...",
  "programId": "...",
  "categoryId": "...",
  "subCategoryName": "Foundation Advanced",
  "status": "INACTIVE"
}
```

**Success Response (200):**

```json
{
  "success": true,
  "message": "SubCategory updated successfully",
  "data": { /* formatSubCategory */ }
}
```

**Frontend Usage Notes:** Changing hierarchy fields re-runs full `validateCategoryForHierarchy`.

**Example React Query:**

```typescript
const updateMutation = useUpdateExamSubCategory();
updateMutation.mutate({ id, payload: { subCategoryName: newName } });
```

---

### 5. Toggle Exam Sub Category Status

| | |
|---|---|
| **Endpoint** | `PATCH /api/sub-categories/status/:id` |
| **Method** | PATCH |
| **Authentication** | Super Admin |

**Request Body:**

```json
{ "status": "INACTIVE" }
```

**Success Response (200):**

```json
{
  "success": true,
  "message": "SubCategory status updated",
  "data": { /* formatSubCategory */ }
}
```

**Example React Query (optimistic):**

```typescript
const toggleMutation = useToggleExamSubCategoryStatus();
toggleMutation.mutate({
  id: row._id,
  status: row.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE',
});
```

---

### 6. Delete Exam Sub Category

| | |
|---|---|
| **Endpoint** | `DELETE /api/sub-categories/:id` |
| **Method** | DELETE |
| **Authentication** | Super Admin |

**Success Response (200):**

```json
{
  "success": true,
  "message": "SubCategory deleted successfully",
  "data": { "_id": "665c1b2c3d4e5f6789012345" }
}
```

**Frontend Usage Notes:** Hard delete. Warn if `linkedCourses > 0` from detail endpoint.

---

### 7. Exam Sub Categories Filter (Dropdown)

| | |
|---|---|
| **Endpoint** | `GET /api/sub-categories/filter` |
| **Method** | GET |
| **Authentication** | Super Admin |

**Query Parameters (all required):**

| Param | Required |
|-------|----------|
| `centerId` | Yes |
| `programId` | Yes |
| `categoryId` | Yes |

**Success Response (200):**

```json
{
  "success": true,
  "count": 3,
  "data": [
    { "_id": "...", "subCategoryId": "SUB001", "subCategoryName": "Foundation" },
    { "_id": "...", "subCategoryId": "SUB002", "subCategoryName": "Prelims" }
  ]
}
```

**Error:** 400 `centerId, programId, and categoryId query parameters are required`

**Example React Query:**

```typescript
const { data } = useExamSubCategoriesFilter(
  centerId && programId && categoryId
    ? { centerId, programId, categoryId }
    : undefined
);
const options = data?.data ?? [];
```

---

## MongoDB Schema

**Model:** `AcademicSubCategory` · **Collection:** `academicsubcategories`

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `subCategoryId` | String | auto | Unique; `SUB###` |
| `subCategoryName` | String | yes | Unique per center+program+category |
| `centerId` | ObjectId → Center | yes | |
| `programId` | ObjectId → Program | yes | |
| `categoryId` | ObjectId → AcademicCategory | yes | |
| `status` | `ACTIVE` \| `INACTIVE` | default ACTIVE | |
| `createdAt`, `updatedAt` | Date | auto | |

**Unique index:** `{ centerId, programId, categoryId, subCategoryName }` (case-insensitive).

---

## Data Persistence Flow

```text
Frontend (examSubCategoryService.createExamSubCategory)
  → POST /api/sub-categories
  → routes/academicSubCategoryRoutes.js (protect → requireSuperAdmin)
  → controllers/academicSubCategoryController.createSubCategory
      1. Validate subCategoryName non-empty
      2. validateCategoryForHierarchy({ centerId, programId, categoryId })
         → validateProgramCenterLink (center ACTIVE, program ACTIVE, linked)
         → AcademicCategory.findOne({ _id: categoryId, centerId, programId, status: 'ACTIVE' })
      3. generateAcademicSubCategoryId() → SUB###
      4. AcademicSubCategory.create({ subCategoryId, subCategoryName, centerId, programId, categoryId, status })
         → MongoDB collection: academicsubcategories
      5. Populate center, program, category → formatSubCategory → 201
```

**Mutations that write to MongoDB:**

| Action | Controller Method | MongoDB Operation |
|--------|-------------------|-------------------|
| Create | `createSubCategory` | `AcademicSubCategory.create()` |
| Update | `updateSubCategory` | `subCategory.save()` |
| Status | `updateSubCategoryStatus` | `findByIdAndUpdate({ status })` |
| Delete | `deleteSubCategory` | `findByIdAndDelete()` |

**Read-only:** list, detail, filter endpoints.

**Downstream reads:** `Course.countDocuments({ academicSubCategory: id })` on detail view only.

---

## Frontend Implementation Guide

### Fetch List

```typescript
const { data, isLoading } = useExamSubCategories({
  page,
  limit: 10,
  search: debouncedSearch,
  center: filterCenter,
  program: filterProgram,
  category: filterCategory,
  status: filterStatus,
  sortBy: 'createdAt',
  sortOrder: 'desc',
});
```

### Create Record

```typescript
const create = useCreateExamSubCategory();

const onSubmit = (values: FormValues) => {
  create.mutate({
    centerId: values.centerId,
    programId: values.programId,
    categoryId: values.categoryId,
    subCategoryName: values.subCategoryName.trim(),
    status: values.status ?? 'ACTIVE',
  });
};
```

### Update Record

```typescript
const update = useUpdateExamSubCategory();
update.mutate({ id, payload: { subCategoryName: trimmedName } });
```

### Delete Record

```typescript
const del = useDeleteExamSubCategory();
// Check linkedCourses from useExamSubCategory(id) first
del.mutate(id);
```

### Search

- Use `search` query param (backend also accepts `subCategoryName` as alias).
- Matches both `subCategoryName` and `subCategoryId`.

### Filter

| UI Filter | Query Param |
|-----------|-------------|
| Center | `center` |
| Program | `program` |
| Exam Category | `category` |
| Status | `status` |

Reset dependent filters when parent changes (e.g. changing center clears program and category).

### Pagination

Same pattern as Exam Category — use `data.totalPages`, `data.page`, `data.total`.

### Status Updates

`useToggleExamSubCategoryStatus` for row toggles with optimistic UI.

### Cascading Dropdowns (Create/Edit Form)

```typescript
const [centerId, setCenterId] = useState<string>();
const [programId, setProgramId] = useState<string>();

const { data: centers } = useCentersDropdown();
const { data: programs } = useProgramDropdown(centerId ?? '');
const { data: categories } = useExamCategoriesFilter(
  centerId && programId ? { centerId, programId } : undefined
);

// category dropdown options = categories?.data ?? []
// Reset programId when centerId changes
// Reset categoryId when programId changes
```

---

## Service Layer

Implemented at `src/services/examSubCategoryService.ts`.

```typescript
import { examSubCategoryService } from '@/services/examSubCategoryService';

await examSubCategoryService.getExamSubCategories({ page: 1, limit: 10 });
await examSubCategoryService.getExamSubCategoryById(id);
await examSubCategoryService.createExamSubCategory(payload);
await examSubCategoryService.updateExamSubCategory(id, payload);
await examSubCategoryService.toggleExamSubCategoryStatus(id, 'INACTIVE');
await examSubCategoryService.deleteExamSubCategory(id);
await examSubCategoryService.getExamSubCategoriesFilter({ centerId, programId, categoryId });
```

---

## React Query Hooks

Implemented at `src/hooks/useExamSubCategories.ts`.

| Hook | Type | Purpose |
|------|------|---------|
| `useExamSubCategories` | useQuery | Paginated list |
| `useExamSubCategory` | useQuery | Single detail |
| `useExamSubCategoriesFilter` | useQuery | Dropdown |
| `useCreateExamSubCategory` | useMutation | Create (+ invalidates parent categories) |
| `useUpdateExamSubCategory` | useMutation | Update |
| `useToggleExamSubCategoryStatus` | useMutation | Status (optimistic) |
| `useDeleteExamSubCategory` | useMutation | Delete (+ invalidates parent categories) |

Query keys: `examSubCategoryKeys` in `src/hooks/queryKeys.ts`.

---

## Cross-Module API Summary

| Module | Endpoint Base | Parent Dependency |
|--------|---------------|-------------------|
| Center | `/api/admin/centers` | — |
| Program | `/api/programs` | Center |
| **Exam Category** | `/api/categories` | Center + Program |
| **Exam Sub Category** | `/api/sub-categories` | Center + Program + Category |

---

## Integration Safety Check

| Check | Status | Notes |
|-------|--------|-------|
| Frontend payload matches backend schema | ✓ | `centerId`, `programId`, `categoryId`, `subCategoryName`, `status` |
| Required fields handled | ✓ | All four hierarchy IDs + name required on create |
| Optional fields handled | ✓ | `status` defaults `ACTIVE` |
| Validation rules respected | ✓ | Full hierarchy validated server-side |
| Status enums respected | ✓ | `ACTIVE` \| `INACTIVE` only |
| Search filters supported | ✓ | `search`/`subCategoryName`, `center`, `program`, `category`, `status` |
| Pagination supported | ✓ | `page`, `limit`, `total`, `totalPages` |
| Sorting supported | ✓ | `sortBy`, `sortOrder` |
| Authentication token handled | ✓ | Centralized in `api.ts` |
| MongoDB persistence confirmed | ✓ | `AcademicSubCategory.create/save/findByIdAndUpdate/findByIdAndDelete` |

---

## Frontend Integration Checklist

- [ ] Super Admin JWT configured
- [ ] List page wired to `useExamSubCategories`
- [ ] Three-level cascading dropdowns: Center → Program → Category
- [ ] Create sends all required fields with trimmed `subCategoryName`
- [ ] Edit prefills via `useExamSubCategory(id)`
- [ ] Status toggle uses `useToggleExamSubCategoryStatus`
- [ ] Delete checks `linkedCourses` from detail
- [ ] Handle 400 hierarchy error: `Invalid category selection for the selected center and program`
- [ ] Handle duplicate name: `SubCategory name already exists for this category`
- [ ] Reset child dropdowns when parent selection changes
- [ ] Invalidate `examSubCategoryKeys.all` and `examCategoryKeys.all` after create/delete

---

## Backend Source References

| File | Purpose |
|------|---------|
| `routes/academicSubCategoryRoutes.js` | Routes |
| `controllers/academicSubCategoryController.js` | Handlers |
| `models/AcademicSubCategory.js` | Schema |
| `utils/academicHierarchyHelpers.js` | `validateCategoryForHierarchy` |
| `utils/academicIdGenerator.js` | `SUB###` generation |
| `app.js` line 284 | Mount: `/api/sub-categories` |

---

## Related Documentation

- [Exam Category Integration Guide](./exam-category-integration-guide.md)
- `PROGRAM_CATEGORY_SUBCATEGORY_API_GUIDE.md`
- `PROGRAM_CATEGORY_SUBCATEGORY_POSTMAN_COLLECTION.json`
