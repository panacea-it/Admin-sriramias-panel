# Batch Module — Frontend Integration Guide

**Version:** 1.0  
**Backend (production):** `https://sriramias-backend.onrender.com`  
**Integration code:** `src/` in this repository  
**Audience:** Frontend developers integrating Academics → Batch Management

---

## Table of Contents

1. [Quick Start (5 minutes)](#1-quick-start-5-minutes)
2. [Architecture](#2-architecture)
3. [Environment & Dependencies](#3-environment--dependencies)
4. [Authentication](#4-authentication)
5. [Integration Rules](#5-integration-rules)
6. [Batch API Reference](#6-batch-api-reference)
7. [Dropdown APIs (Batch Form)](#7-dropdown-apis-batch-form)
8. [Service Layer](#8-service-layer)
9. [React Query Hooks](#9-react-query-hooks)
10. [Complete Page Examples](#10-complete-page-examples)
11. [Error Handling](#11-error-handling)
12. [Route Protection](#12-route-protection)
13. [Multipart / File Upload](#13-multipart--file-upload)
14. [Testing Checklist](#14-testing-checklist)
15. [Troubleshooting](#15-troubleshooting)

---

## 1. Quick Start (5 minutes)

### Step 1 — Environment

Create `.env.local` in your Vite project root:

```env
VITE_API_BASE_URL=https://sriramias-backend.onrender.com
```

### Step 2 — Copy integration layer

Copy these folders from this repo into your admin panel:

```text
src/services/
src/hooks/
src/providers/
src/utils/
src/types/
src/components/common/
src/routes/
```

### Step 3 — Install packages

```bash
npm install axios @tanstack/react-query react-router-dom
npm install -D @tanstack/react-query-devtools
```

### Step 4 — Wrap your app

```tsx
// main.tsx
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryProvider } from './providers/QueryProvider';
import { registerToastNotifier } from './utils/errorHandler';
import App from './App';

registerToastNotifier((message) => {
  // Replace with your toast library
  console.error(message);
});

createRoot(document.getElementById('root')!).render(
  <QueryProvider>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </QueryProvider>
);
```

### Step 5 — Login & fetch batches

```tsx
import { authService } from './services/authService';
import { useBatches } from './hooks/useBatches';

// Login once
const session = await authService.loginSuperAdmin({ email, password });
authService.persistSession(session);

// In any component
function BatchListPage() {
  const { data, isLoading } = useBatches({ page: 1, limit: 10 });
  return isLoading ? <p>Loading…</p> : <pre>{JSON.stringify(data?.data, null, 2)}</pre>;
}
```

**Done.** All requests now go through the centralized Axios client with JWT auto-injection.

---

## 2. Architecture

### Data flow (mandatory pattern)

```text
┌─────────────────┐
│  React Component │  ← Never calls axios/fetch directly
└────────┬────────┘
         │ uses
┌────────▼────────┐
│  Custom Hook     │  ← useBatches, useCreateBatch, etc.
│  (React Query)   │
└────────┬────────┘
         │ calls
┌────────▼────────┐
│  Service Layer   │  ← batchService, courseService, etc.
└────────┬────────┘
         │ uses
┌────────▼────────┐
│  api.ts (Axios)  │  ← baseURL from VITE_API_BASE_URL
└────────┬────────┘
         │
┌────────▼────────────────────────────────────┐
│  https://sriramias-backend.onrender.com     │
└─────────────────────────────────────────────┘
```

### Domain model (backend)

```text
Course
  └── Batch (course + mentor + facultySubjects[] + fees + dates)
        └── BatchEnrollment → Student (separate API)
```

### Auth requirement

| Module | Who can access |
|--------|----------------|
| `/api/batches/*` | **Super Admin only** |
| `/api/courses/dropdown` | Super Admin |
| `/api/faculty-subjects/dropdown` | Super Admin |
| `/api/admin/admin-access/mentors/dropdown` | Super Admin |
| `/api/admin/centers/dropdown` | Staff Admin+ (Super Admin JWT works) |

---

## 3. Environment & Dependencies

### Required env variables

| Variable | Required | Example | Description |
|----------|----------|---------|-------------|
| `VITE_API_BASE_URL` | **Yes** | `https://sriramias-backend.onrender.com` | No trailing slash |
| `VITE_AUTH_TOKEN_KEY` | No | `authToken` | localStorage key (default: `authToken`) |

### Never do this

```ts
// ❌ WRONG — hardcoded URL in component
axios.get('https://sriramias-backend.onrender.com/api/batches');

// ❌ WRONG — localhost in source code
const API = 'http://localhost:5000';

// ✅ CORRECT — env via api.ts
import api from './services/api';
// api.defaults.baseURL === import.meta.env.VITE_API_BASE_URL
```

---

## 4. Authentication

### Login endpoint

```http
POST https://sriramias-backend.onrender.com/api/auth/login-super-admin
Content-Type: application/json

{
  "email": "your-super-admin@email.com",
  "password": "your-password"
}
```

### Success response

```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "id": "679abc123...",
      "name": "Super Admin",
      "email": "admin@example.com",
      "role": "super_admin"
    }
  }
}
```

### Frontend implementation

```ts
import { authService } from '@/services/authService';

async function handleLogin(email: string, password: string) {
  const session = await authService.loginSuperAdmin({ email, password });
  authService.persistSession(session);
  // Token stored in localStorage → api.ts injects Authorization header
}
```

### Every authenticated request

```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

Handled automatically by `src/services/api.ts` request interceptor.

---

## 5. Integration Rules

### DO

| Rule | Why |
|------|-----|
| Use hooks in components | Caching, loading, error states handled |
| Use services for all HTTP | Single place for URLs and payloads |
| Use `VITE_API_BASE_URL` | Environment-safe deployments |
| Use `PageLoader` / `ErrorState` / `EmptyState` | Consistent UX |
| Invalidate cache after mutations | List stays in sync |

### DO NOT

| Rule | Why |
|------|-----|
| Call `axios` or `fetch` in components | Breaks architecture, duplicates logic |
| Hardcode API URLs | Breaks staging/production |
| Change request payloads | Backend validation will fail |
| Change expected response shapes | Type mismatches, UI bugs |
| Modify backend code | Out of scope for frontend team |

---

## 6. Batch API Reference

**Base path:** `https://sriramias-backend.onrender.com/api/batches`  
**Auth:** `Authorization: Bearer <token>` (Super Admin)

---

### 6.1 List batches

| | |
|---|---|
| **Method** | `GET` |
| **URL** | `/api/batches` |
| **Hook** | `useBatches(params)` |
| **Service** | `batchService.getBatches(params)` |

**Query parameters:**

| Param | Type | Description |
|-------|------|-------------|
| `search` or `q` | string | Filter by batch name (contains, case-insensitive) |
| `status` | string | `UPCOMING`, `ACTIVE`, `INACTIVE`, `COMPLETED`, `ARCHIVED`, `CANCELLED` |
| `courseId` | string | MongoDB ObjectId of course |
| `page` | number | Page number (default: 1) |
| `limit` | number | Items per page |
| `sortBy` | string | e.g. `createdAt`, `batchName`, `status` |
| `sortOrder` | string | `asc` or `desc` |

**Example request:**

```http
GET https://sriramias-backend.onrender.com/api/batches?page=1&limit=10&status=ACTIVE&search=GS
Authorization: Bearer <token>
```

**Example response:**

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
      "_id": "679abc...",
      "batchId": "BAT001",
      "batchName": "Mains GS Batch 1",
      "course": {
        "_id": "679...",
        "courseId": "CRS001",
        "courseName": "Mains GS Foundation"
      },
      "mentor": {
        "_id": "679...",
        "fullName": "Raj Mentor",
        "officialEmail": "mentor@example.com"
      },
      "facultySubjects": [
        {
          "_id": "679...",
          "facultySubjectId": "FSU001",
          "subjectName": "Indian Polity"
        }
      ],
      "commencementDate": "2026-06-01T00:00:00.000Z",
      "durationInMonths": 12,
      "batchStartDate": "2026-06-10T00:00:00.000Z",
      "batchEndDate": "2027-05-31T00:00:00.000Z",
      "fees": {
        "currency": "INR",
        "onlineAmount": 19999,
        "offlineAmount": 24999,
        "discountAmount": 2000
      },
      "status": "ACTIVE",
      "totalStudents": 45,
      "createdAt": "2026-01-15T10:00:00.000Z",
      "updatedAt": "2026-03-01T08:30:00.000Z"
    }
  ]
}
```

---

### 6.2 Get batch by ID (full detail)

| | |
|---|---|
| **Method** | `GET` |
| **URL** | `/api/batches/:id` |
| **Hook** | `useBatch(id)` |
| **Service** | `batchService.getBatchById(id)` |

Includes `students` array (active enrollments) and `studentCount`.

```tsx
const { data, isLoading, isError, error, refetch } = useBatch(batchId);
const batch = data?.data;
const enrollments = batch?.students ?? [];
```

---

### 6.3 Quick view (drawer / modal)

| | |
|---|---|
| **Method** | `GET` |
| **URL** | `/api/batches/:id/quick-view` |
| **Hook** | `useBatchQuickView(id)` |
| **Service** | `batchService.getBatchQuickView(id)` |

Lightweight snapshot — fees, subjects, dates, banner. No student list.

**Response fields:** `batchId`, `batchName`, `linkedCourse`, `dateOfCommencement`, `durationInMonths`, `batchStartDate`, `batchEndDate`, `status`, `linkedSubjects`, `currency`, `onlinePaymentAmount`, `offlinePaymentAmount`, `discountAmount`, `onlineBulletPoints`, `offlineBulletPoints`, `bannerImage`, `brochure`, `totalStudents`

---

### 6.4 Create batch

| | |
|---|---|
| **Method** | `POST` |
| **URL** | `/api/batches` |
| **Hook** | `useCreateBatch()` |
| **Service** | `batchService.createBatch(payload)` |
| **Content-Type** | `application/json` OR `multipart/form-data` |

**Required fields:**

| Field | Type | Notes |
|-------|------|-------|
| `batchName` | string | Non-empty |
| `courseId` | string | Active course ObjectId |
| `mentorId` | string | Active `MENTOR_ADMIN` ObjectId |
| `facultySubjects` | string[] | FacultySubject `_id` array |

**Optional fields:**

| Field | Type | Notes |
|-------|------|-------|
| `commencementDate` | string | `YYYY-MM-DD` |
| `durationInMonths` | number | e.g. `12`, `24` |
| `batchStartDate` | string | Must be ≥ `commencementDate` |
| `batchEndDate` | string | Must be > `batchStartDate` |
| `fees` | object | See fees schema below |
| `feesJson` | string | JSON string (for multipart) |
| `status` | string | Default: `UPCOMING` |
| `bannerImage` | File or `{url, publicId}` | Image upload |
| `brochure` | File or `{url, publicId}` | PDF upload |

**Fees schema:**

```json
{
  "currency": "INR",
  "onlineAmount": 19999,
  "offlineAmount": 24999,
  "discountAmount": 2000,
  "onlineBulletPoints": ["Daily mentorship", "Live lectures"],
  "offlineBulletPoints": ["Classroom", "Printed notes"]
}
```

Currencies: `INR`, `USD`, `EUR`

**Example JSON request:**

```http
POST https://sriramias-backend.onrender.com/api/batches
Authorization: Bearer <token>
Content-Type: application/json

{
  "batchName": "Mains GS Batch 1",
  "courseId": "679158b16614cacb1bd978e52",
  "mentorId": "679abc123def456789012345",
  "commencementDate": "2026-06-01",
  "durationInMonths": 12,
  "batchStartDate": "2026-06-10",
  "batchEndDate": "2027-05-31",
  "fees": {
    "currency": "INR",
    "onlineAmount": 19999,
    "offlineAmount": 24999,
    "discountAmount": 2000,
    "onlineBulletPoints": ["Daily mentorship"],
    "offlineBulletPoints": ["Classroom"]
  },
  "facultySubjects": ["679faculty001", "679faculty002"],
  "status": "UPCOMING"
}
```

**Success response (201):**

```json
{
  "success": true,
  "message": "Batch created successfully",
  "data": { "_id": "...", "batchId": "BAT002", "batchName": "Mains GS Batch 1", "...": "..." }
}
```

---

### 6.5 Update batch

| | |
|---|---|
| **Method** | `PUT` |
| **URL** | `/api/batches/:id` |
| **Hook** | `useUpdateBatch()` |
| **Service** | `batchService.updateBatch(id, payload)` |

Partial updates supported — send only changed fields.

```tsx
const updateBatch = useUpdateBatch();

updateBatch.mutate({
  id: batchId,
  payload: {
    batchName: 'Updated Batch Name',
    mentorId: newMentorId,
    facultySubjects: newSubjectIds,
    fees: updatedFees,
  },
});
```

---

### 6.6 Update status

| | |
|---|---|
| **Method** | `PATCH` |
| **URL** | `/api/batches/status/:id` |
| **Service** | `batchService.updateBatchStatus(id, status)` |

**Body:**

```json
{ "status": "ACTIVE" }
```

**Valid statuses:** `UPCOMING`, `ACTIVE`, `INACTIVE`, `COMPLETED`, `ARCHIVED`, `CANCELLED`

```ts
await batchService.updateBatchStatus(batchId, 'ACTIVE');
```

---

### 6.7 Duplicate batch

| | |
|---|---|
| **Method** | `POST` |
| **URL** | `/api/batches/:id/duplicate` |
| **Service** | `batchService.duplicateBatch(id, payload)` |

**Body (all optional):**

```json
{
  "batchName": "Mains GS Batch 2",
  "courseId": "679...",
  "status": "UPCOMING",
  "includeStudents": false
}
```

> **Default:** `includeStudents` is `true` unless explicitly set to `false`.

---

### 6.8 Delete batch (soft delete)

| | |
|---|---|
| **Method** | `DELETE` |
| **URL** | `/api/batches/:id` |
| **Hook** | `useDeleteBatch()` |
| **Service** | `batchService.deleteBatch(id)` |

Sets `isDeleted: true` and `status: INACTIVE` on the server.

```tsx
const deleteBatch = useDeleteBatch();
deleteBatch.mutate(batchId, { onSuccess: () => navigate('/academics/batches') });
```

---

### 6.9 Batch dropdown (move student / filters)

| | |
|---|---|
| **Method** | `POST` |
| **URL** | `/api/batches/dropdown` |
| **Service** | `batchService.getBatchesDropdown(body)` |

**Body:**

```json
{
  "courseId": "679...",
  "centerId": "679...",
  "facultySubjectId": "679...",
  "excludeBatchId": "679...",
  "status": "ACTIVE"
}
```

Default status filter: `ACTIVE` + `UPCOMING` (when `status` omitted).

**Response:**

```json
{
  "success": true,
  "data": [
    { "_id": "679...", "batchId": "BAT001", "batchName": "Mains GS Batch 1" }
  ]
}
```

---

## 7. Dropdown APIs (Batch Form)

Load these **before** rendering the create/edit form.

### 7.1 Courses

```http
GET https://sriramias-backend.onrender.com/api/courses/dropdown?status=ACTIVE&page=1&limit=100
Authorization: Bearer <token>
```

| Query | Description |
|-------|-------------|
| `search` | Filter by course name or courseId |
| `status` | Default `ACTIVE` |
| `centerId` | Filter by center |
| `programId` | Filter by program |
| `excludeCourseId` | Exclude one course (move-student flows) |
| `page`, `limit` | Pagination (max limit 200) |

```tsx
const { data } = useCoursesDropdown({ status: 'ACTIVE', limit: 100 });
const courseOptions = data?.data ?? [];
// Use option._id as courseId in batch payload
```

---

### 7.2 Centers (optional — filter mentors/courses)

```http
GET https://sriramias-backend.onrender.com/api/admin/centers/dropdown
Authorization: Bearer <token>
```

```tsx
const { data } = useCentersDropdown();
const centerOptions = data?.data ?? [];
```

---

### 7.3 Mentors

```http
GET https://sriramias-backend.onrender.com/api/admin/admin-access/mentors/dropdown?centerId=679...&search=
Authorization: Bearer <token>
```

```tsx
const centerId = watch('centerId'); // optional filter
const { data } = useMentorsDropdown({ centerId });
const mentorOptions = data?.data ?? [];
// Use option._id as mentorId in batch payload
```

---

### 7.4 Faculty subjects

```http
GET https://sriramias-backend.onrender.com/api/faculty-subjects/dropdown?status=ACTIVE&category=LIVE_CLASS
Authorization: Bearer <token>
```

| Query | Description |
|-------|-------------|
| `search` | Filter by subject name |
| `status` | Default `ACTIVE` |
| `category` | `LIVE_CLASS`, `RECORDING`, `TEST`, `PDF` |
| `page`, `limit` | Pagination |

```tsx
const { data } = useFacultySubjectsDropdown({ status: 'ACTIVE' });
const subjectOptions = data?.data ?? [];
// Multi-select: collect option._id values → facultySubjects[]
```

---

### 7.5 Recommended form load order

```text
1. useCoursesDropdown()        → Course select
2. useCentersDropdown()        → Center filter (optional)
3. useMentorsDropdown({ centerId })  → Mentor select (re-fetch when center changes)
4. useFacultySubjectsDropdown() → Multi-select subjects
5. User fills dates, fees, banner
6. useCreateBatch().mutate(payload)
```

---

## 8. Service Layer

### File map

| File | Responsibility |
|------|----------------|
| `api.ts` | Axios instance, JWT, interceptors, 401 event |
| `authService.ts` | Login, logout, session persistence |
| `batchService.ts` | All `/api/batches` operations |
| `courseService.ts` | Course dropdown |
| `centerService.ts` | Center dropdown |
| `mentorService.ts` | Mentor dropdown |
| `facultyService.ts` | Faculty subject dropdown |

### batchService methods

```ts
import { batchService } from '@/services/batchService';

batchService.getBatches({ page: 1, limit: 10, search: 'GS' });
batchService.getBatchById('679...');
batchService.getBatchQuickView('679...');
batchService.createBatch({ batchName, courseId, mentorId, facultySubjects, status: 'UPCOMING' });
batchService.updateBatch('679...', { batchName: 'New Name' });
batchService.updateBatchStatus('679...', 'ACTIVE');
batchService.duplicateBatch('679...', { batchName: 'Copy', includeStudents: false });
batchService.deleteBatch('679...');
batchService.getBatchesDropdown({ courseId, excludeBatchId });

// Convenience delegates for batch forms:
batchService.getCoursesDropdown({ status: 'ACTIVE' });
batchService.getCentersDropdown();
batchService.getMentorsDropdown({ centerId });
```

---

## 9. React Query Hooks

### Hook reference

| Hook | Type | API | Cache key |
|------|------|-----|-----------|
| `useBatches(params)` | Query | GET `/api/batches` | `batchKeys.list(params)` |
| `useBatch(id)` | Query | GET `/api/batches/:id` | `batchKeys.detail(id)` |
| `useBatchQuickView(id)` | Query | GET `.../quick-view` | `batchKeys.quickView(id)` |
| `useCreateBatch()` | Mutation | POST `/api/batches` | Invalidates lists |
| `useUpdateBatch()` | Mutation | PUT `/api/batches/:id` | Invalidates list + detail |
| `useDeleteBatch()` | Mutation | DELETE `/api/batches/:id` | Invalidates list |
| `useCoursesDropdown(params)` | Query | GET `/api/courses/dropdown` | `courseKeys.dropdown` |
| `useCentersDropdown()` | Query | GET centers dropdown | `centerKeys.dropdown` |
| `useMentorsDropdown(params)` | Query | GET mentors dropdown | `mentorKeys.dropdown` |
| `useFacultySubjectsDropdown(params)` | Query | GET faculty dropdown | `facultyKeys.dropdown` |

### Manual cache invalidation

```ts
import { useQueryClient } from '@tanstack/react-query';
import { batchKeys } from '@/hooks/queryKeys';

const queryClient = useQueryClient();
queryClient.invalidateQueries({ queryKey: batchKeys.lists() });
```

---

## 10. Complete Page Examples

### 10.1 Batch list page

```tsx
import { useState } from 'react';
import { useBatches } from '@/hooks/useBatches';
import { useBatchQuickView } from '@/hooks/useBatchQuickView';
import { PageLoader, ErrorState, EmptyState } from '@/components/common';
import { parseApiError } from '@/utils/errorHandler';

export function BatchListPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [quickViewId, setQuickViewId] = useState<string | null>(null);

  const { data, isLoading, isError, error, refetch } = useBatches({
    page,
    limit: 10,
    search,
  });

  const quickView = useBatchQuickView(quickViewId ?? undefined);

  if (isLoading) return <PageLoader message="Loading batches…" />;
  if (isError) {
    return (
      <ErrorState
        message={parseApiError(error).message}
        onRetry={() => refetch()}
      />
    );
  }

  const batches = data?.data ?? [];
  if (!batches.length) {
    return <EmptyState title="No batches found" message="Create your first batch to get started." />;
  }

  return (
    <div>
      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search by batch name"
      />

      <table>
        <thead>
          <tr>
            <th>Batch ID</th>
            <th>Name</th>
            <th>Course</th>
            <th>Status</th>
            <th>Students</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {batches.map((batch) => (
            <tr key={batch._id}>
              <td>{batch.batchId}</td>
              <td>{batch.batchName}</td>
              <td>{typeof batch.course === 'object' ? batch.course?.courseName : '—'}</td>
              <td>{batch.status}</td>
              <td>{batch.totalStudents ?? 0}</td>
              <td>
                <button type="button" onClick={() => setQuickViewId(batch._id)}>
                  Quick view
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <button type="button" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
        Previous
      </button>
      <span>Page {data?.page} of {data?.totalPages}</span>
      <button
        type="button"
        disabled={page >= (data?.totalPages ?? 1)}
        onClick={() => setPage((p) => p + 1)}
      >
        Next
      </button>

      {quickViewId && quickView.data?.data && (
        <aside>
          <h3>{quickView.data.data.batchName}</h3>
          <p>Status: {quickView.data.data.status}</p>
          <p>Students: {quickView.data.data.totalStudents}</p>
          <button type="button" onClick={() => setQuickViewId(null)}>Close</button>
        </aside>
      )}
    </div>
  );
}
```

---

### 10.2 Batch create page

```tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCreateBatch } from '@/hooks/useCreateBatch';
import { useCoursesDropdown } from '@/hooks/useCoursesDropdown';
import { useMentorsDropdown } from '@/hooks/useMentorsDropdown';
import { useFacultySubjectsDropdown } from '@/hooks/useFacultySubjectsDropdown';
import { PageLoader } from '@/components/common';

export function BatchCreatePage() {
  const navigate = useNavigate();
  const createBatch = useCreateBatch();

  const courses = useCoursesDropdown({ status: 'ACTIVE', limit: 100 });
  const mentors = useMentorsDropdown();
  const subjects = useFacultySubjectsDropdown({ status: 'ACTIVE' });

  const [form, setForm] = useState({
    batchName: '',
    courseId: '',
    mentorId: '',
    facultySubjectIds: [] as string[],
    commencementDate: '',
    batchStartDate: '',
    batchEndDate: '',
    durationInMonths: 12,
    status: 'UPCOMING' as const,
  });

  const dropdownsLoading = courses.isLoading || mentors.isLoading || subjects.isLoading;
  if (dropdownsLoading) return <PageLoader message="Loading form data…" />;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createBatch.mutate(
      {
        ...form,
        facultySubjects: form.facultySubjectIds,
        fees: {
          currency: 'INR',
          onlineAmount: 19999,
          offlineAmount: 24999,
          discountAmount: 0,
          onlineBulletPoints: [],
          offlineBulletPoints: [],
        },
      },
      {
        onSuccess: (res) => navigate(`/academics/batches/${res.data?._id}`),
      }
    );
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        required
        placeholder="Batch name"
        value={form.batchName}
        onChange={(e) => setForm({ ...form, batchName: e.target.value })}
      />

      <select
        required
        value={form.courseId}
        onChange={(e) => setForm({ ...form, courseId: e.target.value })}
      >
        <option value="">Select course</option>
        {(courses.data?.data ?? []).map((c) => (
          <option key={c._id} value={c._id}>{c.courseName}</option>
        ))}
      </select>

      <select
        required
        value={form.mentorId}
        onChange={(e) => setForm({ ...form, mentorId: e.target.value })}
      >
        <option value="">Select mentor</option>
        {(mentors.data?.data ?? []).map((m) => (
          <option key={m._id} value={m._id}>{m.fullName}</option>
        ))}
      </select>

      <select
        multiple
        required
        value={form.facultySubjectIds}
        onChange={(e) =>
          setForm({
            ...form,
            facultySubjectIds: Array.from(e.target.selectedOptions, (o) => o.value),
          })
        }
      >
        {(subjects.data?.data ?? []).map((s) => (
          <option key={s._id} value={s._id}>{s.subjectName}</option>
        ))}
      </select>

      <input
        type="date"
        value={form.commencementDate}
        onChange={(e) => setForm({ ...form, commencementDate: e.target.value })}
      />
      <input
        type="date"
        value={form.batchStartDate}
        onChange={(e) => setForm({ ...form, batchStartDate: e.target.value })}
      />
      <input
        type="date"
        value={form.batchEndDate}
        onChange={(e) => setForm({ ...form, batchEndDate: e.target.value })}
      />
      <input
        type="number"
        value={form.durationInMonths}
        onChange={(e) => setForm({ ...form, durationInMonths: Number(e.target.value) })}
      />

      <button type="submit" disabled={createBatch.isPending}>
        {createBatch.isPending ? 'Creating…' : 'Create batch'}
      </button>
    </form>
  );
}
```

---

## 11. Error Handling

### Standard error format (frontend)

```json
{
  "success": false,
  "message": "Unable to connect to server"
}
```

### HTTP status handling

| Status | Meaning | Frontend action |
|--------|---------|-----------------|
| `400` | Validation error | Show `response.data.message` |
| `401` | Missing/expired token | Clear session → redirect `/login` |
| `403` | Wrong role | Show forbidden message |
| `404` | Batch not found | Show `ErrorState` |
| `500` | Server error | Show retry option |
| Network | No connection | `"Unable to connect to server"` |
| Timeout | > 30s | `"Request timed out…"` |

### Usage in components

```tsx
import { parseApiError, handleApiError } from '@/utils/errorHandler';

// In query error UI
const message = parseApiError(error).message;

// In mutation onError
onError: (err) => handleApiError(err, { showToast: true })
```

### 401 global listener

```tsx
// App.tsx or AuthLayout
useEffect(() => {
  const handler = () => {
    authService.logout();
    navigate('/login');
  };
  window.addEventListener('auth:unauthorized', handler);
  return () => window.removeEventListener('auth:unauthorized', handler);
}, []);
```

---

## 12. Route Protection

```tsx
import { Routes, Route } from 'react-router-dom';
import { ProtectedRoute } from '@/routes/ProtectedRoute';
import { RoleGuard } from '@/routes/RoleGuard';
import { BatchListPage } from '@/pages/BatchListPage';
import { BatchCreatePage } from '@/pages/BatchCreatePage';
import { BatchDetailPage } from '@/pages/BatchDetailPage';

<Routes>
  <Route path="/login" element={<LoginPage />} />

  <Route element={<ProtectedRoute />}>
    <Route
      path="/academics/batches"
      element={
        <RoleGuard allowedRoles={['Admin']}>
          <BatchListPage />
        </RoleGuard>
      }
    />
    <Route
      path="/academics/batches/create"
      element={
        <RoleGuard allowedRoles={['Admin']}>
          <BatchCreatePage />
        </RoleGuard>
      }
    />
    <Route
      path="/academics/batches/:id"
      element={
        <RoleGuard allowedRoles={['Admin']}>
          <BatchDetailPage />
        </RoleGuard>
      }
    />
  </Route>
</Routes>
```

**Role aliases** (`src/routes/roleConfig.ts`):

| UI label | Backend roles |
|----------|---------------|
| `Admin` | `super_admin`, `SUPER_ADMIN`, `center_admin` |
| `Mentor` | `MENTOR_ADMIN` |
| `Counselor` | `COUNSELING_ADMIN` |
| `Student` | `student` |

> Batch APIs require **Super Admin** on the server. Use `Admin` guard with `super_admin` login.

---

## 13. Multipart / File Upload

When `bannerImage` or `brochure` is a `File`, `batchService` auto-switches to `multipart/form-data`.

```tsx
const createBatch = useCreateBatch();

createBatch.mutate({
  batchName: 'Mains GS Batch 1',
  courseId: selectedCourseId,
  mentorId: selectedMentorId,
  facultySubjects: selectedSubjectIds,
  durationInMonths: 12,
  feesJson: JSON.stringify({
    currency: 'INR',
    onlineAmount: 19999,
    offlineAmount: 24999,
    discountAmount: 2000,
    onlineBulletPoints: ['Daily mentorship'],
    offlineBulletPoints: ['Classroom'],
  }),
  bannerImage: bannerFile,  // File from <input type="file" accept="image/*" />
  status: 'UPCOMING',
});
```

**Multipart field reference:**

| Form field | Type | Example |
|------------|------|---------|
| `batchName` | text | `Mains GS Batch 1` |
| `courseId` | text | MongoDB ObjectId |
| `mentorId` | text | MongoDB ObjectId |
| `commencementDate` | text | `2026-06-01` |
| `durationInMonths` | text | `12` |
| `batchStartDate` | text | `2026-06-10` |
| `batchEndDate` | text | `2027-05-31` |
| `feesJson` | text | JSON string |
| `facultySubjects` | text | `["id1","id2"]` |
| `status` | text | `UPCOMING` |
| `bannerImage` | file | JPEG/PNG/WEBP (max 5 MB) |
| `brochure` | file | PDF |

---

## 14. Testing Checklist

- [ ] Set `VITE_API_BASE_URL=https://sriramias-backend.onrender.com`
- [ ] Login via `login-super-admin` — token stored
- [ ] List batches with pagination + search
- [ ] Filter by `status` and `courseId`
- [ ] Open quick view drawer
- [ ] Load all dropdowns (courses, mentors, faculty subjects)
- [ ] Create batch (JSON payload)
- [ ] Create batch with banner upload (multipart)
- [ ] Edit batch name and fees
- [ ] Change status via PATCH
- [ ] Duplicate batch with `includeStudents: false`
- [ ] Delete batch — removed from list
- [ ] Expired token → 401 → redirect login
- [ ] Network offline → "Unable to connect to server"

---

## 15. Troubleshooting

| Problem | Cause | Fix |
|---------|-------|-----|
| `401 Not authorized` | Missing/expired JWT | Re-login; check `authToken` in localStorage |
| `403 Super Admin only` | Wrong role logged in | Use `login-super-admin` endpoint |
| `400 Valid mentorId is required` | Mentor not selected or invalid | Pick from mentors dropdown `_id` |
| `400 batchName is required` | Empty name | Validate form before submit |
| Date validation errors | `batchStartDate` < `commencementDate` | Fix date order client-side |
| CORS error | Admin origin not allowed | Ask backend team to whitelist your domain |
| Slow first request | Render cold start | Show `PageLoader`; retry once |
| Dropdown empty | Wrong auth or filters | Check token; try `status=ACTIVE` |

---

## File locations in this repo

| Resource | Path |
|----------|------|
| Integration scaffold | `src/` |
| Env template | `.env.example` |
| This guide | `docs/BATCH_FRONTEND_INTEGRATION_GUIDE.md` |
| Architecture | `docs/frontend-architecture.md` |
| API catalog | `docs/api-integration-guide.md` |
| UX flows | `docs/batch-module-flow.md` |
| Backend spec | `BATCH_FACULTY_SUBJECT_API_GUIDE.md` |

---

**End of guide.** Copy `src/` into your Vite admin panel, set `.env.local`, login as Super Admin, and use hooks — no direct HTTP calls in components.
