# Exam Sub Category — Frontend Handoff

**Module:** Academics → Categories → Exam Sub Category  
**API base:** `/api/sub-categories`  
**Auth:** Super Admin only · `Authorization: Bearer <JWT>`

---

## 1. Quick Reference

| UI Action | Endpoint | Method |
|-----------|----------|--------|
| List (paginated) | `/api/sub-categories` | GET |
| Detail | `/api/sub-categories/:id` | GET |
| Create | `/api/sub-categories` | POST |
| Update | `/api/sub-categories/:id` | PUT |
| Toggle status | `/api/sub-categories/status/:id` | PATCH |
| Delete | `/api/sub-categories/:id` | DELETE |
| Dropdown (ACTIVE only) | `/api/sub-categories/filter` | GET |

**Hierarchy for forms:** Center → Program → Exam Category → Sub Category

---

## 2. Parent Dropdown APIs (required for create/edit)

| Step | Endpoint | When to call |
|------|----------|--------------|
| Center | `GET /api/admin/centers/dropdown` | Always |
| Program | `GET /api/programs/by-center/:centerId` | After center selected |
| Exam Category | `GET /api/categories/filter?centerId=&programId=` | After program selected |

Reset child dropdowns when parent changes.

---

## 3. TypeScript Types

```typescript
type ExamSubCategoryStatus = 'ACTIVE' | 'INACTIVE';

interface ExamSubCategory {
  _id: string;
  subCategoryId: string;        // auto: SUB001, SUB002…
  subCategoryName: string;
  centerId: string;
  centerName?: string;
  programId: string;
  programName?: string;
  categoryId: string;
  categoryName?: string;
  status: ExamSubCategoryStatus;
  linkedCourses: number;        // 0 on list; real count on detail
  createdAt?: string;
  updatedAt?: string;
}

interface CreateExamSubCategoryPayload {
  centerId: string;
  programId: string;
  categoryId: string;
  subCategoryName: string;
  status?: ExamSubCategoryStatus;  // default ACTIVE
}

interface UpdateExamSubCategoryPayload {
  centerId?: string;
  programId?: string;
  categoryId?: string;
  subCategoryName?: string;
  status?: ExamSubCategoryStatus;
}

interface ExamSubCategoryListParams {
  search?: string;
  subCategoryName?: string;  // alias for search
  center?: string;
  program?: string;
  category?: string;
  status?: ExamSubCategoryStatus;
  page?: number;
  limit?: number;            // max 100
  sortBy?: 'createdAt' | 'subCategoryName' | 'subCategoryId' | 'status';
  sortOrder?: 'asc' | 'desc';
}
```

---

## 4. API Details

### GET `/api/sub-categories` — List

**Query params:** `search`, `center`, `program`, `category`, `status`, `page`, `limit`, `sortBy`, `sortOrder`

**Response:**
```json
{
  "success": true,
  "total": 15,
  "page": 1,
  "limit": 10,
  "totalPages": 2,
  "count": 10,
  "data": [/* ExamSubCategory[] */]
}
```

---

### GET `/api/sub-categories/:id` — Detail

Use before delete to check `linkedCourses`.

**Response:**
```json
{ "success": true, "data": { /* ExamSubCategory with linkedCourses */ } }
```

**404:** `{ "success": false, "message": "SubCategory not found" }`

---

### POST `/api/sub-categories` — Create

**Body:**
```json
{
  "centerId": "ObjectId",
  "programId": "ObjectId",
  "categoryId": "ObjectId",
  "subCategoryName": "Foundation",
  "status": "ACTIVE"
}
```

**201:** `{ "success": true, "message": "SubCategory created successfully", "data": {} }`

**400 errors:**
- `SubCategory name is required`
- `Invalid category selection for the selected center and program`
- `Invalid or inactive center`
- `Invalid or inactive program`
- `Selected program is not available for the selected center`
- `SubCategory name already exists for this category`

Do **not** send `subCategoryId` — server generates it.

---

### PUT `/api/sub-categories/:id` — Update

**Body (all optional):** `centerId`, `programId`, `categoryId`, `subCategoryName`, `status`

**200:** `{ "success": true, "message": "SubCategory updated successfully", "data": {} }`

---

### PATCH `/api/sub-categories/status/:id` — Status

**Body:** `{ "status": "ACTIVE" | "INACTIVE" }`

**200:** `{ "success": true, "message": "SubCategory status updated", "data": {} }`

---

### DELETE `/api/sub-categories/:id` — Delete

Hard delete. Warn user if `linkedCourses > 0`.

**200:** `{ "success": true, "message": "SubCategory deleted successfully", "data": { "_id": "..." } }`

---

### GET `/api/sub-categories/filter` — Dropdown

**Required query:** `centerId`, `programId`, `categoryId`

**Response:**
```json
{
  "success": true,
  "count": 2,
  "data": [
    { "_id": "...", "subCategoryId": "SUB001", "subCategoryName": "Foundation" }
  ]
}
```

**400:** `centerId, programId, and categoryId query parameters are required`

---

## 5. Ready-Made Frontend Code (in repo)

| File | Purpose |
|------|---------|
| `src/services/api.ts` | Axios instance + Bearer token |
| `src/services/examSubCategoryService.ts` | All 7 API methods |
| `src/types/examSubCategory.ts` | TypeScript interfaces |
| `src/hooks/useExamSubCategories.ts` | React Query hooks |
| `src/hooks/queryKeys.ts` | `examSubCategoryKeys` |

### Service usage

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

### React Query hooks

| Hook | Use case |
|------|----------|
| `useExamSubCategories(params)` | List page |
| `useExamSubCategory(id)` | Edit / delete confirm |
| `useExamSubCategoriesFilter(params)` | Dropdown |
| `useCreateExamSubCategory()` | Create form |
| `useUpdateExamSubCategory()` | Edit form |
| `useToggleExamSubCategoryStatus()` | Row status toggle (optimistic) |
| `useDeleteExamSubCategory()` | Delete action |

```typescript
import {
  useExamSubCategories,
  useExamSubCategory,
  useCreateExamSubCategory,
  useUpdateExamSubCategory,
  useToggleExamSubCategoryStatus,
  useDeleteExamSubCategory,
  useExamSubCategoriesFilter,
} from '@/hooks';
```

---

## 6. Implementation Examples

### List page

```typescript
const [page, setPage] = useState(1);
const [search, setSearch] = useState('');

const { data, isLoading, isError } = useExamSubCategories({
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

const rows = data?.data ?? [];
const totalPages = data?.totalPages ?? 0;
```

### Create form (cascading dropdowns)

```typescript
const { data: centers } = useCentersDropdown();
const { data: programs } = useProgramDropdown(centerId ?? '');
const { data: categories } = useExamCategoriesFilter(
  centerId && programId ? { centerId, programId } : undefined
);

const create = useCreateExamSubCategory();

const onSubmit = (values) => {
  create.mutate({
    centerId: values.centerId,
    programId: values.programId,
    categoryId: values.categoryId,
    subCategoryName: values.subCategoryName.trim(),
    status: values.status ?? 'ACTIVE',
  });
};
```

### Status toggle

```typescript
const toggle = useToggleExamSubCategoryStatus();
toggle.mutate({
  id: row._id,
  status: row.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE',
});
```

### Delete with safety check

```typescript
const { data: detail } = useExamSubCategory(id);
const del = useDeleteExamSubCategory();

if ((detail?.data?.linkedCourses ?? 0) > 0) {
  // show warning before delete
}
del.mutate(id);
```

---

## 7. Integration Checklist

- [ ] `VITE_API_BASE_URL` set in `.env`
- [ ] Login as Super Admin; token stored via `setAuthToken`
- [ ] List wired to `useExamSubCategories`
- [ ] Cascading dropdowns: Center → Program → Category
- [ ] Trim `subCategoryName` before submit
- [ ] Reset child dropdowns when parent changes
- [ ] Status toggle via `useToggleExamSubCategoryStatus`
- [ ] Delete checks `linkedCourses` from detail API
- [ ] Handle 400 duplicate: `SubCategory name already exists for this category`
- [ ] Handle 400 hierarchy: `Invalid category selection for the selected center and program`
- [ ] Handle 401 → redirect to login

---

## 8. Env & Auth

```env
VITE_API_BASE_URL=http://localhost:5000
VITE_AUTH_TOKEN_KEY=authToken
```

Login endpoints:
- `POST /api/auth/login-super-admin`
- `POST /api/auth/login-admin` (with `SUPER_ADMIN` role)

Token is attached automatically by `src/services/api.ts`.
