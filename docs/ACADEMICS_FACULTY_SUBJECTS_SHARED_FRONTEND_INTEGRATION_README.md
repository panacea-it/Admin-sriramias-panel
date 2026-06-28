# Academics → Faculty Subjects — Shared Frontend Integration

**Audience:** React + Vite developers working on Faculty Subjects and Subject Content Folders.

**Related docs:**

- [Index](./ACADEMICS_FACULTY_SUBJECTS_FRONTEND_INTEGRATION_README.md)
- [Faculty Subjects CRUD](./ACADEMICS_FACULTY_SUBJECTS_CRUD_FRONTEND_INTEGRATION_README.md)
- [Subject Content Folders](./ACADEMICS_SUBJECT_CONTENT_FOLDERS_FRONTEND_INTEGRATION_README.md)

---

## 1. Authentication

### Login

```http
POST {VITE_API_BASE_URL}/api/auth/login-super-admin
Content-Type: application/json

{
  "email": "<SUPER_ADMIN_EMAIL>",
  "password": "<SUPER_ADMIN_PASSWORD>"
}
```

Store JWT from response (`token` or `data.token` — verify in your environment).

### Authorization header

```http
Authorization: Bearer <jwt>
```

Required on every `/api/faculty-subjects/*` and `/api/folders/*` request.

### Token expiry

- Backend uses `jwt.verify` with `JWT_SECRET`
- **No refresh-token endpoint** — on `401`: clear token, redirect to login

### Accepted auth identities

- Legacy `User` with `role === 'super_admin'`
- `AdminAccess` with `roleId.roleCode === 'SUPER_ADMIN'`

---

## 2. Role-based access

```javascript
// app.js
app.use('/api/faculty-subjects', ...superAdminAuth, facultySubjectRoutes);
app.use('/api/folders', ...superAdminAuth, subjectContentFolderRoutes);
```

| Role | Access |
|------|--------|
| **SUPER_ADMIN** | Full CRUD + folders |
| All other roles | `403` |

**403 response:**

```json
{
  "success": false,
  "message": "Access denied. Super Admin only."
}
```

Guard routes in the frontend — do not rely on hiding buttons alone.

---

## 3. Environment variables

```env
VITE_API_BASE_URL=http://localhost:5000
```

Only `VITE_API_BASE_URL` is required. Upload URLs come back in content item responses (Cloudinary, etc.).

```typescript
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 30_000,
});
```

Never hardcode localhost in components.

---

## 4. Axios integration

```typescript
// src/services/api.ts
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 30_000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (error) => {
    const status = error.response?.status;
    if (status === 401) {
      // clear session → redirect login
    }
    if (status === 403) {
      // access denied
    }
    return Promise.reject(error);
  }
);

export default api;

export function getApiErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    return error.response?.data?.message ?? error.message ?? 'Request failed';
  }
  return 'Request failed';
}
```

| Concern | Recommendation |
|---------|----------------|
| Base URL | `VITE_API_BASE_URL` |
| Timeout | 30s; extend for multipart uploads |
| 401 | Clear token → re-login |
| 403 | Full-page access denied |
| 409 | Show `message` + `details` (folder content counts, batch links) |
| Retry | GET on network error (max 2); never auto-retry POST/DELETE |
| Multipart | Omit `Content-Type` so browser sets boundary |

---

## 5. Error handling

| HTTP | When | Frontend action |
|------|------|-----------------|
| **400** | Validation / scope mismatch | Inline errors; show `field`, `suggestions` if present |
| **401** | Invalid/missing JWT | Redirect to login |
| **403** | Non–Super Admin | Access denied page |
| **404** | Not found | Toast + refresh / navigate back |
| **409** | Batch-linked delete; duplicate folder; folder has content | Show exact message; display `details` counts |
| **422** | Not used here | Generic handler |
| **500** | Server error | Toast; show `error` in dev |
| **Network** | Offline / timeout | Retry; preserve filters |

### Structured CMS errors

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
```

Common `errorCode` values: `FOLDER_HAS_CONTENT`, `VALIDATION_ERROR`.

---

## 6. Frontend architecture

```text
src/
├── services/
│   ├── api.ts
│   ├── facultySubjectService.ts
│   ├── facultySubjectCmsService.ts      ← optional split
│   └── subjectContentFolderService.ts
├── hooks/
│   ├── queryKeys.ts
│   ├── useFacultySubjects.ts            ← CRUD doc
│   ├── useFacultySubjectManagement.ts
│   ├── useContentTree.ts                ← Folders doc
│   ├── useSubjectContentFolders.ts
│   └── useFolderContent.ts
├── modules/academics/facultySubjects/
│   ├── pages/
│   │   ├── FacultySubjectsPage.tsx
│   │   └── FacultySubjectContentPage.tsx
│   ├── components/
│   │   ├── FacultySubjectsTable.tsx
│   │   ├── FacultySubjectForm.tsx
│   │   ├── ContentCategoryTabs.tsx
│   │   ├── FolderSidebar.tsx
│   │   ├── FolderContentTable.tsx
│   │   ├── FolderFormModal.tsx
│   │   └── FolderDeleteDialog.tsx
│   ├── types/
│   │   ├── facultySubject.types.ts
│   │   └── subjectContentFolder.types.ts
│   └── utils/
│       └── facultySubjectHelpers.ts
└── routes/
    └── academicsRoutes.tsx
```

| Layer | Rule |
|-------|------|
| `services/` | Pure HTTP — one function per endpoint |
| `hooks/` | TanStack Query wrappers |
| `components/` | No direct HTTP |
| `pages/` | Orchestrate hooks + modals |

---

## 7. React Query — cross-cutting rules

1. **Query key stability** — serialize filter objects consistently.
2. **List invalidation** — after any faculty subject mutation: `facultySubjectKeys.lists()`.
3. **Folder invalidation** — after folder mutation: `contentTree`, `folderKeys.lists`, relevant `folderKeys.content`.
4. **Categories** — `staleTime: Infinity`.
5. **Loading UX** — `isLoading` for skeleton; `isFetching` for background refresh.
6. **Debounced search** — 300ms; reset `page` to 1 on filter change.
7. **No infinite query** — backend uses offset pagination.

---

## 8. Cross-module APIs

These consume Faculty Subjects or folders but use different auth:

| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| `GET` | `/api/mains-management/faculty-subjects` | Super Admin | Mains dashboard (`MAINS_ANSWER_WRITING`) |
| `GET` | `/api/mains-management/faculty-subjects/:facultySubjectId` | Super Admin | Mains detail |
| `GET` | `/api/mentor/mains-answer-writing/faculty-subjects-dropdown` | `MENTOR_ADMIN` | Mentor dropdown |
| `POST` | `/api/cbt-management/list` | `CBT_MANAGEMENT` permission | CBT faculty subject list |
| `POST` | `/api/cbt-management/topics` | Same | `PRELIMS_TEST` folders as "topics" |

Supporting masters (Super Admin):

| Module | Path |
|--------|------|
| Subjects | `/api/subjects` |
| Teachers | `/api/teachers` |
| Batches | `/api/batches/dropdown` |

Content modules (folder-scoped uploads — separate integration specs):

| Category | Path |
|----------|------|
| Live Class | `/api/live-classes` |
| Recording | `/api/recordings` |
| PDF | `/api/subject-pdfs` |
| Prelims Test | `/api/prelims-tests` |
| Mains AW | `/api/mains-answer-writing` |

---

## 9. Best practices

### Do

- Use Mongo `_id` in API paths; display `FSU###` / `FLD###` in UI only.
- Pass `facultySubjectId`, `category`, and `folderId` together to folder content APIs.
- Handle `409 FOLDER_HAS_CONTENT` with per-type counts from `details`.
- Invalidate content tree after folder mutations.
- Cache `/categories` aggressively.

### Don't

- Assume nested folders — flat model only.
- Create folders on `/api/folders` — use `POST /api/faculty-subjects/content/folders`.
- Use `FSU001` code for `GET /api/faculty-subjects/:id`.
- Auto-retry delete on `409`.
- Confuse **Teacher** with center **Faculty** marketing profiles.

### Performance

- Prefetch content-tree on "Manage Content" hover (optional).
- Virtualize folder sidebar only if hundreds of folders.
- Scope folder content queries per selected category.

---

## 10. Loading states

| Context | UX |
|---------|-----|
| Page initial load | Table skeleton |
| Refetch | Keep rows + subtle indicator |
| Form dropdowns | Disabled selects + spinner |
| Submit / delete | Button loading + disable form |
| Folder delete 409 | Show counts in dialog |

---

## Integration checklist

### Infrastructure

- [ ] `VITE_API_BASE_URL` per environment
- [ ] Axios Bearer interceptor
- [ ] Super Admin login stores JWT
- [ ] 401 → login redirect
- [ ] 403 → access denied
- [ ] `getApiErrorMessage()` helper
- [ ] Super Admin route guard
- [ ] React Query provider configured

### Cross-cutting

- [ ] Structured CMS error display (`errorCode`, `details`, `suggestions`)
- [ ] Multipart upload pattern for content modules
- [ ] Shared query key module

---

## Backend reference (all modules)

| File | Role |
|------|------|
| `app.js` | Route mounts |
| `middleware/superAdminAuth.js` | Auth chain |
| `routes/facultySubjectRoutes.js` | Faculty + CMS routes |
| `routes/subjectContentFolderRoutes.js` | Folder routes |
| `controllers/facultySubjectController.js` | Faculty handlers |
| `controllers/subjectContentFolderController.js` | Folder handlers |
| `models/FacultySubject.js` | Faculty schema |
| `models/SubjectContentFolder.js` | Folder schema |
| `utils/cmsApiErrors.js` | Structured errors |
| `utils/contentMastersHelpers.js` | Pagination/sort |

---

## Postman / specs

| Asset | Purpose |
|-------|---------|
| `BATCH_FACULTY_SUBJECT_POSTMAN_COLLECTION.json` | CRUD smoke tests |
| `FACULTY_SUBJECT_CMS_POSTMAN_COLLECTION.json` | Folder + CMS |
| `FACULTY_SUBJECT_COMPLETE.md` | Full backend reference |
| `FACULTY_SUBJECT_CMS_API_SPEC.json` | CMS API spec |

---

*Shared doc for auth, Axios, architecture, and cross-module context across Faculty Subjects and Subject Content Folders.*
