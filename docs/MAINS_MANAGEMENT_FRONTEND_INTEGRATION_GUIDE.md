# Mains Management — Frontend Integration Guide

Step-by-step guide to integrate **Test Management → Mains Management** (Levels 1–4) in the admin React app.

**Backend reference:** `MAINS_MANAGEMENT_API_GUIDE.md`  
**Postman:** `MAINS_MANAGEMENT_POSTMAN_COLLECTION.json`  
**Base path:** `/api/mains-management`  
**Auth:** Super Admin JWT — `Authorization: Bearer <token>`

---

## 1. Golden rules

| Rule | Detail |
|------|--------|
| One screen → one API | Never prefetch Level 3/4 data on Level 1 |
| IDs from navigation | `facultySubjectId`, `topicId`, `testId` come from router state + sessionStorage |
| No hardcoded IDs | Every drill-down uses the ID from the previous click |
| Do not change UI/CSS/routes | Only wire data, loading, errors, search, pagination |
| Independent loaders | Separate loading flag per API call |

---

## 2. Navigation hierarchy (matches UI)

```
Level 1  Mains Management Dashboard
           ├─ GET /dashboard
           └─ GET /faculty-subjects
                │
                ▼ (Eye → save facultySubjectId)
Level 2  Faculty Subject Details  (e.g. "Economy by Suresh")
           └─ GET /faculty-subjects/:facultySubjectId
                │
                ▼ (Eye → save topicId)
Level 3  Topic Tests  (e.g. "Macroeconomics")
           └─ GET /topics/:topicId/tests
                │
                ▼ (Eye → save testId)
Level 4  Test Results  (e.g. "Indian Economy Grand Test")
           └─ GET /tests/:testId/results
```

---

## 3. Recommended folder structure

```
src/
├── constants/
│   └── api.js                          # BASE_URL, endpoints
├── utils/
│   └── sessionStorage.js               # save / get / remove helpers
├── services/
│   └── mainsManagement.service.js      # all axios calls
├── hooks/
│   └── useMainsManagement.js           # React Query hooks (or useEffect wrappers)
└── pages/
    └── MainsManagement/
        ├── Dashboard/                  # Level 1 — existing UI component
        ├── FacultySubject/             # Level 2
        ├── Topic/                      # Level 3
        └── Test/                       # Level 4
```

---

## 4. Session storage keys

| Key | Set when | Used on |
|-----|----------|---------|
| `facultySubjectId` | Level 1 → Eye click | Level 2 (+ refresh fallback) |
| `facultySubjectName` | Level 1 → Eye click | Breadcrumb / header |
| `subjectName` | Level 1 → Eye click | Optional breadcrumb |
| `topicId` | Level 2 → Eye click | Level 3 |
| `topicName` | Level 2 → Eye click | Level 3 header |
| `testId` | Level 3 → Eye click | Level 4 |
| `testName` | Level 3 → Eye click | Level 4 header |

### `utils/sessionStorage.js`

```javascript
const KEYS = {
  facultySubjectId: 'mm_facultySubjectId',
  facultySubjectName: 'mm_facultySubjectName',
  subjectName: 'mm_subjectName',
  topicId: 'mm_topicId',
  topicName: 'mm_topicName',
  testId: 'mm_testId',
  testName: 'mm_testName',
};

export const mmSession = {
  save: (key, value) => sessionStorage.setItem(KEYS[key], value ?? ''),
  get: (key) => sessionStorage.getItem(KEYS[key]) || null,
  remove: (key) => sessionStorage.removeItem(KEYS[key]),
  clearAll: () => Object.values(KEYS).forEach((k) => sessionStorage.removeItem(k)),
};
```

### Navigation pattern (every Eye button)

```javascript
import { useNavigate } from 'react-router-dom';
import { mmSession } from '@/utils/sessionStorage';

const navigate = useNavigate();

// Level 1 → Level 2
navigate('/your-existing-faculty-subject-route', {
  state: {
    facultySubjectId: row.facultySubjectId,
    facultySubjectName: row.facultySubject,
    subjectName: row.subjectName,
  },
});
mmSession.save('facultySubjectId', row.facultySubjectId);
mmSession.save('facultySubjectName', row.facultySubject);
mmSession.save('subjectName', row.subjectName);
```

### Reading ID on mount (every Level 2+ page)

```javascript
const { state } = useLocation();
const facultySubjectId =
  state?.facultySubjectId || mmSession.get('facultySubjectId');

useEffect(() => {
  if (!facultySubjectId) {
    toast.error('Faculty Subject not found');
    navigate(-1); // or your Mains Management route
  }
}, [facultySubjectId]);
```

Repeat the same pattern for `topicId` (Level 3) and `testId` (Level 4).

---

## 5. Service layer

**File:** `services/mainsManagement.service.js`

Never call axios inside page components.

```javascript
import api from '@/services/api'; // your configured axios instance

const BASE = '/api/mains-management';

export const mainsManagementService = {
  getDashboard: (progressLimit = 5) =>
    api.get(`${BASE}/dashboard`, { params: { progressLimit } }),

  getFacultySubjects: (params) =>
    api.get(`${BASE}/faculty-subjects`, { params }),

  getFacultySubjectDetails: (facultySubjectId) =>
    api.get(`${BASE}/faculty-subjects/${facultySubjectId}`),

  getTopicTests: (topicId, params) =>
    api.get(`${BASE}/topics/${topicId}/tests`, { params }),

  getTestResults: (testId, params) =>
    api.get(`${BASE}/tests/${testId}/results`, { params }),
};
```

---

## 6. Level 1 — Mains Management Dashboard

**UI sections:** Progress cards (top) + Faculty subjects table (bottom)

### 6.1 On page load — two parallel calls

```javascript
// Call A — progress cards
GET /api/mains-management/dashboard?progressLimit=5

// Call B — faculty subjects table (independent pagination)
GET /api/mains-management/faculty-subjects?search=&page=1&limit=10&sort=lastUpdated
```

Use **separate loading states:** `dashboardLoading`, `facultySubjectsLoading`.

### 6.2 Progress cards mapping

**Response:** `response.data.data.evaluationProgress[]`

| UI field | API field |
|----------|-----------|
| Test name | `testName` |
| Faculty subtitle ("Economy by Suresh") | `facultyName` |
| Students Assigned | `studentsAssigned` |
| Uploaded Answer Sheets | `uploadedAnswerSheets` |
| Evaluated | `evaluatedCount` |
| Pending | `pendingCount` |
| Progress bar % | `evaluationPercentage` |

Cards are **read-only** — no navigation on card click unless product asks later.

> `evaluationPercentage = evaluatedCount / uploadedAnswerSheets * 100` (backend already computes; 0 if no uploads).

### 6.3 Faculty subjects table mapping

**Response shape:**

```json
{
  "success": true,
  "total": 5,
  "page": 1,
  "limit": 10,
  "totalPages": 1,
  "count": 5,
  "data": [
    {
      "facultySubjectId": "64abc...",
      "facultySubject": "Economy by Suresh",
      "subjectName": "Economy",
      "teacherName": "Suresh",
      "topicsCount": 1,
      "testsPdfCount": 1,
      "lastUpdated": "2026-05-27T16:00:00.000Z"
    }
  ]
}
```

| UI column | API field | Notes |
|-----------|-----------|-------|
| Faculty Subject | `facultySubject` | Full label with teacher |
| Topics | `topicsCount` | Number |
| Tests/PDFs | `testsPdfCount` | Number |
| Last Updated | `lastUpdated` | Format in UI: `9:30 pm, 27 May 2026` |
| Eye action | `facultySubjectId` | Pass to Level 2 |

### 6.4 Search (server-side)

- Debounce **500 ms**
- Reset `page = 1` when search text changes
- Query param: `search`

### 6.5 Pagination (server-side)

Always send: `page`, `limit`  
Read from response: `total`, `page`, `limit`, `totalPages`

### 6.6 Sorting (server-side)

Query param `sort`:

| UI sort | API value |
|---------|-----------|
| Last updated (default) | `lastUpdated` |
| Subject name | `subjectName` |
| Topics count | `topicsCount` |

---

## 7. Level 2 — Faculty Subject Details

**UI:** Header "Economy by Suresh" · 3 summary cards · Topics table

### 7.1 Resolve ID

```javascript
facultySubjectId = location.state.facultySubjectId || mmSession.get('facultySubjectId')
```

If missing → toast + navigate back.

### 7.2 API call

```javascript
GET /api/mains-management/faculty-subjects/:facultySubjectId
```

**Response:** `response.data.data`

```json
{
  "facultySubjectId": "...",
  "facultySubjectName": "Economy by Suresh",
  "subjectName": "Economy",
  "cards": { "topics": 1, "testsPdfs": 1, "subject": "Economy" },
  "topics": [
    {
      "topicId": "...",
      "topicName": "Macroeconomics",
      "testsPdfCount": 1,
      "tests": [{ "testId": "...", "testName": "...", "uploadedDate": "..." }]
    }
  ]
}
```

### 7.3 Summary cards mapping

| UI card | API path |
|---------|----------|
| Topics | `data.cards.topics` |
| Tests / PDFs | `data.cards.testsPdfs` |
| Subject | `data.cards.subject` |

### 7.4 Topics table mapping

| UI column | API field |
|-----------|-----------|
| Topic | `topicName` |
| Tests / PDFs | `testsPdfCount` |
| Eye action | `topicId` |

### 7.5 Topic search

Backend **does not** expose a search param on this endpoint.  
Filter `data.topics` **client-side** on the search input (debounce optional).

### 7.6 Eye → Level 3

```javascript
navigate('/your-existing-topic-tests-route', {
  state: { topicId: row.topicId, topicName: row.topicName, facultySubjectName: data.facultySubjectName },
});
mmSession.save('topicId', row.topicId);
mmSession.save('topicName', row.topicName);
```

> Do **not** navigate using nested `tests[]` from Level 2 — Level 3 has its own paginated tests API.

---

## 8. Level 3 — Topic Tests

**UI:** Header "Macroeconomics" · tests table · evaluation status badges

### 8.1 Resolve ID

```javascript
topicId = location.state.topicId || mmSession.get('topicId')
```

### 8.2 API call

```javascript
GET /api/mains-management/topics/:topicId/tests?search=&page=1&limit=10
```

**Response:**

```json
{
  "success": true,
  "topic": { "topicName": "Macroeconomics", "facultySubjectName": "Economy by Suresh" },
  "total": 1,
  "page": 1,
  "limit": 10,
  "totalPages": 1,
  "data": [
    {
      "testId": "...",
      "testName": "Indian Economy Grand Test",
      "uploadedDate": "2026-05-27T...",
      "studentsAssigned": 226,
      "pdfDownloads": 218,
      "answerSheetsUploaded": 200,
      "evaluationStatus": "In Progress"
    }
  ]
}
```

### 8.3 Table mapping

| UI column | API field |
|-----------|-----------|
| Test Name | `testName` |
| Uploaded Date | `uploadedDate` → format `YYYY-MM-DD` |
| Students Assigned | `studentsAssigned` |
| PDF Downloads | `pdfDownloads` |
| Answer Sheets Uploaded | `answerSheetsUploaded` |
| Evaluation Status | `evaluationStatus` |

### 8.4 Evaluation status badges

| API value | Badge style (existing UI) |
|-----------|---------------------------|
| `Not Started` | Neutral / grey |
| `In Progress` | Blue |
| `Completed` | Green |

### 8.5 Search & pagination

Both **server-side**. Debounce search 500 ms, reset page to 1.

### 8.6 Eye → Level 4

```javascript
navigate('/your-existing-test-results-route', {
  state: { testId: row.testId, testName: row.testName },
});
mmSession.save('testId', row.testId);
mmSession.save('testName', row.testName);
```

---

## 9. Level 4 — Test Results

**UI:** Evaluation summary · progress bars · stat cards · analytics · students table · status filter

### 9.1 Resolve ID

```javascript
testId = location.state.testId || mmSession.get('testId')
```

### 9.2 API call

```javascript
GET /api/mains-management/tests/:testId/results?search=&status=all&page=1&limit=20
```

Refetch when any of these change: `testId`, `search`, `status`, `page`, `limit`.

### 9.3 Response structure

```json
{
  "success": true,
  "data": {
    "test": { "testId": "...", "testName": "Indian Economy Grand Test", "facultySubjectName": "..." },
    "evaluationSummary": {
      "assigned": 48,
      "downloads": 40,
      "uploaded": 38,
      "evaluated": 29,
      "pending": 9
    },
    "resultCards": {
      "totalStudents": 48,
      "evaluated": 29,
      "passed": 22,
      "failed": 7
    },
    "analytics": {
      "highestMarks": 99,
      "lowestMarks": 46,
      "averageMarks": 73.8,
      "topRanker": { "studentName": "Karthik Sharma", "marks": 99, "totalMarks": 100 }
    },
    "passMarks": 40,
    "totalMarks": 100,
    "students": {
      "total": 48,
      "page": 1,
      "limit": 20,
      "totalPages": 3,
      "data": [
        {
          "studentName": "Rohan Gupta",
          "registerNumber": "REG-2026-1000",
          "uploadedStatus": "Uploaded",
          "marks": "91/100",
          "rank": 7,
          "evaluatedBy": "Darshana",
          "evaluationDate": "2026-05-28"
        }
      ]
    }
  }
}
```

### 9.4 Evaluation summary (top row)

| UI label | API field |
|----------|-----------|
| Assigned | `evaluationSummary.assigned` |
| Downloads | `evaluationSummary.downloads` |
| Uploaded | `evaluationSummary.uploaded` |
| Evaluated | `evaluationSummary.evaluated` |
| Pending | `evaluationSummary.pending` |

### 9.5 Progress bars (compute in frontend)

Backend returns **counts only**. Compute in the component:

```javascript
const uploadPct = assigned
  ? Math.round((uploaded / assigned) * 100)
  : 0;

const evalPct = uploaded
  ? Math.round((evaluated / uploaded) * 100)
  : 0;
```

| UI bar | Formula |
|--------|---------|
| Answer sheets uploaded | `uploaded / assigned * 100` |
| Evaluations completed | `evaluated / uploaded * 100` |

### 9.6 Result cards

| UI card | API field |
|---------|-----------|
| Total Students | `resultCards.totalStudents` |
| Evaluated | `resultCards.evaluated` |
| Passed | `resultCards.passed` |
| Failed | `resultCards.failed` |

### 9.7 Analytics row

| UI | API field |
|----|-----------|
| Highest Marks | `analytics.highestMarks` |
| Lowest Marks | `analytics.lowestMarks` |
| Average Marks | `analytics.averageMarks` |
| Top Ranker name | `analytics.topRanker?.studentName` |

### 9.8 Students table

| UI column | API field |
|-----------|-----------|
| Student Name | `studentName` |
| Register Number | `registerNumber` |
| Uploaded Status | `uploadedStatus` → badge (`Uploaded` / `Not Uploaded`) |
| Marks | `marks` (already formatted `"91/100"` or `"—"`) |
| Rank | `rank` |
| Evaluated By | `evaluatedBy` |
| Evaluation Date | `evaluationDate` |

Pagination: use `data.students.total`, `page`, `limit`, `totalPages`, `data`.

### 9.9 Status filter dropdown

| UI option | Query `status` |
|-----------|----------------|
| All statuses | `all` |
| Evaluated (passed + failed) | use `all` + client filter, **or** call twice — prefer mapping below |
| Pending Evaluation | `pending` or `pending_evaluation` |
| Uploaded | `uploaded` |
| Not Uploaded | `not_uploaded` |
| Passed | `passed` |
| Failed | `failed` |

If your UI dropdown only shows **All / Evaluated / Pending** (as in the screenshot):

| UI | API `status` |
|----|--------------|
| All statuses | `all` |
| Evaluated | Filter client-side where `uploadedStatus === 'Uploaded'` AND marks ≠ `—` **or** add backend filter later |
| Pending | `pending_evaluation` |

Recommended mapping for full UI spec:

```javascript
const STATUS_MAP = {
  all: 'all',
  uploaded: 'uploaded',
  not_uploaded: 'not_uploaded',
  passed: 'passed',
  failed: 'failed',
  pending: 'pending_evaluation',
};
```

### 9.10 Search

Server-side — `search` matches student name or register number. Debounce 500 ms.

---

## 10. React Query hooks (recommended)

**File:** `hooks/useMainsManagement.js`

```javascript
import { useQuery } from '@tanstack/react-query';
import { mainsManagementService } from '@/services/mainsManagement.service';

export const useMainsDashboard = (progressLimit = 5) =>
  useQuery({
    queryKey: ['mains', 'dashboard', progressLimit],
    queryFn: () => mainsManagementService.getDashboard(progressLimit).then((r) => r.data),
    staleTime: 60_000,
  });

export const useMainsFacultySubjects = (params) =>
  useQuery({
    queryKey: ['mains', 'faculty-subjects', params],
    queryFn: () => mainsManagementService.getFacultySubjects(params).then((r) => r.data),
    keepPreviousData: true,
  });

export const useMainsFacultySubject = (facultySubjectId) =>
  useQuery({
    queryKey: ['mains', 'faculty-subject', facultySubjectId],
    queryFn: () =>
      mainsManagementService.getFacultySubjectDetails(facultySubjectId).then((r) => r.data.data),
    enabled: Boolean(facultySubjectId),
  });

export const useMainsTopicTests = (topicId, params) =>
  useQuery({
    queryKey: ['mains', 'topic-tests', topicId, params],
    queryFn: () => mainsManagementService.getTopicTests(topicId, params).then((r) => r.data),
    enabled: Boolean(topicId),
    keepPreviousData: true,
  });

export const useMainsTestResults = (testId, params) =>
  useQuery({
    queryKey: ['mains', 'test-results', testId, params],
    queryFn: () => mainsManagementService.getTestResults(testId, params).then((r) => r.data.data),
    enabled: Boolean(testId),
    keepPreviousData: true,
  });
```

### Refetch rules

| Hook | Refetch when |
|------|--------------|
| `useMainsDashboard` | Page mount only |
| `useMainsFacultySubjects` | `search`, `page`, `limit`, `sort` change |
| `useMainsFacultySubject` | `facultySubjectId` changes |
| `useMainsTopicTests` | `topicId` or query params change |
| `useMainsTestResults` | `testId`, `search`, `status`, `page`, `limit` change |

---

## 11. Error handling

Every API call:

```javascript
try {
  // or React Query onError
} catch (err) {
  console.error('[MainsManagement]', err);
  toast.error(err.response?.data?.message || 'Something went wrong');
  // optional: show retry button → refetch()
}
```

| HTTP | Action |
|------|--------|
| 401 | Redirect to login |
| 404 | Toast + navigate back one level |
| 500 | Toast + retry |

Never let a failed API crash the whole page — show empty state in the affected section only.

---

## 12. Integration checklist (track progress)

Copy into your sprint board:

### Phase 0 — Setup
- [ ] Add `mainsManagement.service.js`
- [ ] Add `sessionStorage.js` helpers
- [ ] Add React Query keys / hooks (or useEffect equivalents)
- [ ] Confirm Super Admin token attached on axios interceptor

### Phase 1 — Dashboard (Level 1)
- [ ] Wire progress cards ← `GET /dashboard`
- [ ] Wire faculty subjects table ← `GET /faculty-subjects`
- [ ] Server search (500 ms debounce)
- [ ] Server pagination + sort
- [ ] Eye click → save IDs + navigate to Level 2
- [ ] Separate loaders for cards vs table

### Phase 2 — Faculty Subject (Level 2)
- [ ] Read `facultySubjectId` from state / sessionStorage
- [ ] Wire summary cards + topics table ← `GET /faculty-subjects/:id`
- [ ] Client-side topic search
- [ ] Eye click → save `topicId` + navigate to Level 3
- [ ] Back button → existing route (no API)

### Phase 3 — Topic Tests (Level 3)
- [ ] Read `topicId` from state / sessionStorage
- [ ] Wire tests table ← `GET /topics/:topicId/tests`
- [ ] Evaluation status badges
- [ ] Server search + pagination
- [ ] Eye click → save `testId` + navigate to Level 4

### Phase 4 — Test Results (Level 4)
- [ ] Read `testId` from state / sessionStorage
- [ ] Wire summary, cards, analytics, table ← `GET /tests/:testId/results`
- [ ] Compute progress bar percentages client-side
- [ ] Status filter dropdown → `status` query param
- [ ] Server search + pagination on students table

### Phase 5 — QA
- [ ] Full drill-down: Dashboard → Faculty → Topic → Test → Results
- [ ] Browser refresh on each level still works (sessionStorage)
- [ ] Empty states (no topics, no tests, no students)
- [ ] Run Postman collection against same backend env

---

## 13. Local demo data

If lists are empty, seed backend demo data:

```bash
node scripts/seedMainsManagementDemo.js
# or
node scripts/seedMainsManagementDemo.js --force
```

Then login Super Admin and walk through Postman steps 1–6 in `MAINS_MANAGEMENT_API_GUIDE.md`.

---

## 14. What NOT to integrate on each page

| Page | Do NOT call |
|------|-------------|
| Level 1 | `/topics/.../tests`, `/tests/.../results` |
| Level 2 | `/dashboard`, `/topics/.../tests` (use topics from detail response only for table) |
| Level 3 | `/faculty-subjects`, `/tests/.../results` |
| Level 4 | Any Level 1–3 list APIs |

---

## 15. Quick API ↔ UI screen map

| Screen (your UI) | API | Primary ID in |
|------------------|-----|---------------|
| Mains Management | `GET /dashboard` + `GET /faculty-subjects` | — |
| Economy by Suresh | `GET /faculty-subjects/:facultySubjectId` | router + session |
| Macroeconomics | `GET /topics/:topicId/tests` | router + session |
| Indian Economy Grand Test | `GET /tests/:testId/results` | router + session |

---

*Last updated to match backend `mainsManagementService.js` and Postman collection in this repository.*
