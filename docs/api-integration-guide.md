# API Integration Guide — LMS Admin Panel

Complete reference for frontend developers integrating with the Sriram IAS backend.

**Base URL:** `https://sriramias-backend.onrender.com`

All paths below are appended to the base URL. Authenticated routes require:

```http
Authorization: Bearer <JWT>
```

---

## Authentication APIs

### Super Admin login


|              |                                                                 |
| ------------ | --------------------------------------------------------------- |
| **Method**   | POST                                                            |
| **Path**     | `/api/auth/login-super-admin`                                   |
| **Auth**     | None                                                            |
| **Body**     | `{ "email": string, "password": string }`                       |
| **Response** | `{ success, data: { token, user: { id, name, email, role } } }` |


### Unified admin login


|            |                                                                    |
| ---------- | ------------------------------------------------------------------ |
| **Method** | POST                                                               |
| **Path**   | `/api/auth/login-admin`                                            |
| **Body**   | `{ "email", "password" }` or `{ "email", "password", "roleCode" }` |
| **Notes**  | Supports AdminAccess roles via `roleCode`                          |


**Frontend:** `authService.loginSuperAdmin()` / `authService.persistSession()`

---

## Program APIs (`/api/programs`)

**Auth:** Super Admin only (`protect` + `requireSuperAdmin` on entire router — `routes/programRoutes.js`)

| Method | Path | Service method |
| ------ | ---- | -------------- |
| POST | `/api/programs` | `programService.createProgram(payload)` |
| GET | `/api/programs` | `programService.getPrograms(params)` |
| GET | `/api/programs/by-center/:centerId` | `programService.getProgramDropdown(centerId)` |
| PATCH | `/api/programs/status/:id` | `programService.updateProgramStatus(id, status)` |
| GET | `/api/programs/:id` | `programService.getProgramById(id)` |
| PUT | `/api/programs/:id` | `programService.updateProgram(id, payload)` |
| DELETE | `/api/programs/:id` | `programService.deleteProgram(id)` |

### List query parameters

```
GET /api/programs?search=&center=&status=&page=1&limit=10&sortBy=createdAt&sortOrder=desc
```

| Param | Type | Default | Notes |
| ----- | ---- | ------- | ----- |
| `search` | string | `""` | Program name contains; center fields prefix-match |
| `center` | ObjectId | — | Programs linked to this center |
| `status` | string | — | `ACTIVE` or `INACTIVE` |
| `page` | number | `1` | |
| `limit` | number | `10` | Max `100` |
| `sortBy` | string | `createdAt` | `createdAt`, `programName`, `programId`, `status` |
| `sortOrder` | string | `desc` | `asc` or `desc` |

### Create payload

```json
{
  "programName": "UPSC Complete Program",
  "centers": ["CENTER_OBJECT_ID_1", "CENTER_OBJECT_ID_2"],
  "status": "ACTIVE"
}
```

| Field | Required | Notes |
| ----- | -------- | ----- |
| `programName` | Yes | Non-empty string |
| `centers` | Yes | Array of active center ObjectIds |
| `status` | No | `ACTIVE` (default) or `INACTIVE` |

### Update payload (partial)

```json
{
  "programName": "UPSC Complete Program 2026",
  "centers": ["CENTER_ID_1"],
  "status": "ACTIVE"
}
```

### Status patch

```json
{ "status": "INACTIVE" }
```

### List response shape

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
      "status": "ACTIVE"
    }
  ]
}
```

### Dropdown response (`GET /by-center/:centerId`)

Returns **ACTIVE** programs only. `404` if center not found/inactive.

```json
{
  "success": true,
  "count": 2,
  "data": [
    { "_id": "...", "programId": "PRG001", "programName": "UPSC Complete Program" }
  ]
}
```

**Hook:** `useProgramDropdown(centerId)` — enabled when `centerId` is set.

**Statuses:** `ACTIVE`, `INACTIVE`

---

## Batch APIs (`/api/batches`)

**Auth:** Super Admin only (middleware on entire mount in `app.js`)


| Method | Path                          | Service method                               |
| ------ | ----------------------------- | -------------------------------------------- |
| GET    | `/api/batches`                | `batchService.getBatches(params)`            |
| GET    | `/api/batches/:id`            | `batchService.getBatchById(id)`              |
| GET    | `/api/batches/:id/quick-view` | `batchService.getBatchQuickView(id)`         |
| POST   | `/api/batches`                | `batchService.createBatch(payload)`          |
| PUT    | `/api/batches/:id`            | `batchService.updateBatch(id, payload)`      |
| PATCH  | `/api/batches/status/:id`     | `batchService.updateBatchStatus(id, status)` |
| POST   | `/api/batches/:id/duplicate`  | `batchService.duplicateBatch(id, payload)`   |
| DELETE | `/api/batches/:id`            | `batchService.deleteBatch(id)`               |
| POST   | `/api/batches/dropdown`       | `batchService.getBatchesDropdown(body)`      |


### List query parameters

```
GET /api/batches?search=&status=&courseId=&page=1&limit=10&sortBy=createdAt&sortOrder=desc
```

### Create / update payload fields


| Field               | Required (create) | Notes                                                |
| ------------------- | ----------------- | ---------------------------------------------------- |
| `batchName`         | Yes               | string                                               |
| `courseId`          | Yes               | Active course ObjectId                               |
| `mentorId`          | Yes*              | MENTOR_ADMIN AdminAccess id (*validated server-side) |
| `commencementDate`  | No                | ISO date `YYYY-MM-DD`                                |
| `durationInMonths`  | No                | number                                               |
| `batchStartDate`    | No                | ≥ commencementDate                                   |
| `batchEndDate`      | No                | > batchStartDate                                     |
| `fees` / `feesJson` | No                | See fees object below                                |
| `facultySubjects`   | Yes               | Array of FacultySubject `_id`                        |
| `status`            | No                | Default `UPCOMING`                                   |
| `bannerImage`       | No                | File (multipart) or `{ url, publicId }`              |
| `brochure`          | No                | File (multipart) or `{ url, publicId }`              |


**Fees object:**

```json
{
  "currency": "INR",
  "onlineAmount": 19999,
  "offlineAmount": 24999,
  "discountAmount": 2000,
  "onlineBulletPoints": ["..."],
  "offlineBulletPoints": ["..."]
}
```

**Statuses:** `UPCOMING`, `ACTIVE`, `INACTIVE`, `COMPLETED`, `ARCHIVED`, `CANCELLED`

### Multipart form fields (create/update/duplicate)

When uploading files, send `multipart/form-data`:


| Field                                    | Type                     |
| ---------------------------------------- | ------------------------ |
| `batchName`, `courseId`, dates, `status` | text                     |
| `feesJson`                               | text (JSON string)       |
| `facultySubjects`                        | text (JSON array string) |
| `bannerImage`, `brochure`                | file                     |


---

## Course APIs

### Dropdown (batch form)


|            |                                                                                                  |
| ---------- | ------------------------------------------------------------------------------------------------ |
| **Method** | GET                                                                                              |
| **Path**   | `/api/courses/dropdown`                                                                          |
| **Auth**   | Super Admin                                                                                      |
| **Query**  | `search`, `status` (default ACTIVE), `centerId`, `programId`, `excludeCourseId`, `page`, `limit` |


**Response data item:**

```json
{ "_id": "...", "courseId": "CRS001", "courseName": "Mains GS Programme" }
```

**Hook:** `useCoursesDropdown({ status: 'ACTIVE', limit: 100 })`

### Full course list (public)


|            |                               |
| ---------- | ----------------------------- |
| **Method** | GET                           |
| **Path**   | `/api/courses`                |
| **Auth**   | None (for website/admin list) |


---

## Center APIs

### Dropdown


|            |                                   |
| ---------- | --------------------------------- |
| **Method** | GET                               |
| **Path**   | `/api/admin/centers/dropdown`     |
| **Auth**   | Staff Admin (`requireStaffAdmin`) |


**Response data item:**

```json
{
  "_id": "...",
  "centerName": "Delhi Center",
  "centerCode": "DEL",
  "city": "New Delhi",
  "state": "Delhi"
}
```

**Hook:** `useCentersDropdown()`

**Note:** Requires authenticated admin user (not necessarily Super Admin). Super Admin batch screens typically already have Super Admin JWT which satisfies `protect`.

---

## Mentor APIs

### Mentor admins dropdown


|            |                                            |
| ---------- | ------------------------------------------ |
| **Method** | GET                                        |
| **Path**   | `/api/admin/admin-access/mentors/dropdown` |
| **Auth**   | Super Admin                                |
| **Query**  | `search`, `centerId`                       |


**Response data item:**

```json
{
  "_id": "...",
  "fullName": "Raj Mentor",
  "officialEmail": "mentor@example.com",
  "employeeId": "EMP001",
  "centerId": "...",
  "centerName": "Delhi Center",
  "roleCode": "MENTOR_ADMIN"
}
```

**Hook:** `useMentorsDropdown({ centerId })`

**Batch create:** send selected `_id` as `mentorId` in batch payload.

---

## Faculty Subject APIs

### Dropdown (batch subject picker)


|            |                                                                  |
| ---------- | ---------------------------------------------------------------- |
| **Method** | GET or POST                                                      |
| **Path**   | `/api/faculty-subjects/dropdown`                                 |
| **Auth**   | Super Admin                                                      |
| **Query**  | `search`, `status` (default ACTIVE), `category`, `page`, `limit` |


**Categories filter:** `LIVE_CLASS`, `RECORDING`, `TEST`, `PDF`

**Response data item:**

```json
{
  "_id": "...",
  "facultySubjectId": "FSU001",
  "subjectName": "Indian Polity – Live & Test",
  "teacherName": "Dr Rajesh Kumar"
}
```

**Hook:** `useFacultySubjectsDropdown({ status: 'ACTIVE' })`

**Batch create:** pass array of `_id` values as `facultySubjects`.

---

## HTTP Status Codes


| Code    | Meaning               | Frontend action               |
| ------- | --------------------- | ----------------------------- |
| 200/201 | Success               | Parse `data`                  |
| 400     | Validation error      | Show `message` from response  |
| 401     | Missing/invalid token | Clear session, redirect login |
| 403     | Wrong role            | Show forbidden state          |
| 404     | Not found             | Show `ErrorState`             |
| 500     | Server error          | Retry + generic message       |


Standard error body:

```json
{ "success": false, "message": "Human-readable message" }
```

---

## Integration Patterns

### Pattern A — Read list

```tsx
const { data, isLoading, isError, error, refetch } = useBatches({ page, limit, search });

if (isLoading) return <PageLoader />;
if (isError) return <ErrorState message={parseApiError(error).message} onRetry={refetch} />;
return <BatchTable rows={data?.data ?? []} total={data?.total ?? 0} />;
```

### Pattern B — Program form with center multi-select

```tsx
const { data: centers } = useCentersDropdown();
const createProgram = useCreateProgram();

const onSubmit = (values) => {
  createProgram.mutate({
    programName: values.name,
    centers: values.centerIds,
    status: 'ACTIVE',
  });
};
```

### Pattern C — Category form with program dropdown

```tsx
const [centerId, setCenterId] = useState<string>();
const { data: programs } = useProgramDropdown(centerId);

// After center + program selected:
// POST /api/categories { centerId, programId, categoryName, status: 'ACTIVE' }
```

### Pattern D — Form with batch dropdowns

```tsx
const { data: courses } = useCoursesDropdown({ status: 'ACTIVE' });
const { data: mentors } = useMentorsDropdown({ centerId });
const { data: subjects } = useFacultySubjectsDropdown({ status: 'ACTIVE' });
const createBatch = useCreateBatch();

const onSubmit = (values) => {
  createBatch.mutate({
    batchName: values.name,
    courseId: values.courseId,
    mentorId: values.mentorId,
    facultySubjects: values.subjectIds,
    fees: values.fees,
    status: 'UPCOMING',
  });
};
```

### Pattern E — Imperative service (non-React context)

```ts
import { batchService } from '@/services/batchService';

export async function exportBatchSnapshot(id: string) {
  const res = await batchService.getBatchQuickView(id);
  return res.data;
}
```

---

## CORS & Production Notes

- Production backend: `https://sriramias-backend.onrender.com`
- Ensure your admin panel origin is allowed by backend CORS config
- Render free tier may cold-start — show `PageLoader` on first request
- Store JWT in `localStorage` (key: `authToken`) — matches `api.ts` default

---

## Related Batch Enrollment APIs

Not covered by batch hooks but referenced from batch detail:


| Method | Path                              | Purpose          |
| ------ | --------------------------------- | ---------------- |
| POST   | `/api/batch-enrollments/by-batch` | List enrollments |
| POST   | `/api/batch-enrollments`          | Enroll student   |
| POST   | `/api/batch-enrollments/:id/move` | Move student     |


See `BATCH_FACULTY_SUBJECT_API_GUIDE.md` for enrollment integration.

---

## Quick Reference — Hook → Endpoint


| Hook | HTTP |
| ---- | ---- |
| `usePrograms` | GET `/api/programs` |
| `useProgram` | GET `/api/programs/:id` |
| `useCreateProgram` | POST `/api/programs` |
| `useUpdateProgram` | PUT `/api/programs/:id` |
| `useDeleteProgram` | DELETE `/api/programs/:id` |
| `useProgramDropdown` | GET `/api/programs/by-center/:centerId` |
| `useBatches` | GET `/api/batches` |
| `useBatch`                   | GET `/api/batches/:id`                         |
| `useBatchQuickView`          | GET `/api/batches/:id/quick-view`              |
| `useCreateBatch`             | POST `/api/batches`                            |
| `useUpdateBatch`             | PUT `/api/batches/:id`                         |
| `useDeleteBatch`             | DELETE `/api/batches/:id`                      |
| `useCoursesDropdown`         | GET `/api/courses/dropdown`                    |
| `useCentersDropdown`         | GET `/api/admin/centers/dropdown`              |
| `useMentorsDropdown`         | GET `/api/admin/admin-access/mentors/dropdown` |
| `useFacultySubjectsDropdown` | GET `/api/faculty-subjects/dropdown`           |


