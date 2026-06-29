# Evaluation Oversight — Frontend Integration Guide

Step-by-step guide to integrate **Test Management → Evaluation Oversight** in the admin React app.

**Backend reference:** `EVALUATION_OVERSIGHT_API_GUIDE.md`  
**Postman:** `EVALUATION_OVERSIGHT_POSTMAN_COLLECTION.json`  
**Base path:** `/api/evaluation-oversight`  
**Auth:** Bearer JWT + permission `TEST_MANAGEMENT` → `EVALUATIONS` (Super Admin bypasses)

---

## 1. Golden rules

| Rule | Detail |
|------|--------|
| **Do not change backend** | Use only documented POST APIs |
| **No mock data** | All dropdowns, flags, and table rows come from API responses |
| **No frontend business logic** | Never infer `canAssign`, status, or permissions — use backend flags |
| **Reuse APIs** | Same filter endpoints on Dashboard and Assign Evaluators page |
| **Reload list only** | Filter/search/page changes → call `/list` only, never reload dashboard |
| **Independent loaders** | Separate loading/error state per API call |
| **Debounce search** | 500 ms before calling `/list` |
| **Export = list filters** | Pass identical body to `/export` as `/list` |

---

## 2. Module overview

Evaluation Oversight has **4 modules**:

| # | Module | Route (example) | Primary APIs |
|---|--------|-----------------|--------------|
| 1 | Dashboard + Filters + Table | `/evaluation-oversight` | `/dashboard`, `/filters/*`, `/list`, `/export` |
| 2 | Assign Evaluators | `/evaluation-oversight/assign` | `/filters/*`, `/assign/preview`, `/assign` |
| 3 | Reassign Modal | Modal on table | `/reassign/preview`, `/reassign` |
| 4 | View Paper / Evaluation | `/evaluation-oversight/paper/:submissionId` | `/submission/detail`, `/evaluation/draft`, `/evaluation/publish`, `/annotations/save` |

---

## 3. Recommended folder structure

```
src/
├── constants/
│   └── evaluationOversight.api.js       # BASE_URL, endpoint paths
├── services/
│   └── evaluationOversight.service.js   # All axios POST calls
├── hooks/
│   ├── useEvaluationDashboard.js
│   ├── useEvaluationFilters.js          # Cascade dropdown logic
│   ├── useEvaluationList.js
│   ├── useAssignPreview.js
│   └── useSubmissionDetail.js
├── components/
│   └── EvaluationOversight/
│       ├── DashboardStatsCards.jsx
│       ├── FilterBar.jsx                  # 10 filters + search + dates
│       ├── SubmissionTable.jsx
│       ├── AssignEvaluatorModal.jsx       # Single-row assign/reassign
│       ├── StatusBadge.jsx
│       ├── PriorityBadge.jsx
│       └── MentorAvatar.jsx
└── pages/
    └── EvaluationOversight/
        ├── DashboardPage.jsx              # Stats + filters + table
        ├── AssignEvaluatorsPage.jsx       # Left panel + student table
        └── ViewPaperPage.jsx              # PDF viewer + rubric sidebar
```

---

## 4. API service layer

All requests use **POST** with JSON body and `Authorization: Bearer <token>`.

```javascript
// services/evaluationOversight.service.js
import api from '@/utils/axios';

const BASE = '/api/evaluation-oversight';

export const evaluationOversightApi = {
  getDashboard: () => api.post(`${BASE}/dashboard`, {}),

  getFilterMeta: () => api.post(`${BASE}/filters/meta`, {}),
  getBatches: (body = {}) => api.post(`${BASE}/filters/batches`, body),
  getFacultySubjects: (batchId) =>
    api.post(`${BASE}/filters/faculty-subjects`, { batchId }),
  getTopics: (batchId, facultySubjectId) =>
    api.post(`${BASE}/filters/topics`, { batchId, facultySubjectId }),
  getTests: (batchId, facultySubjectId, topicId = '') =>
    api.post(`${BASE}/filters/tests`, { batchId, facultySubjectId, topicId }),

  listSubmissions: (filters) => api.post(`${BASE}/list`, filters),
  exportCsv: (filters) =>
    api.post(`${BASE}/export`, filters, { responseType: 'blob' }),

  getAssignPreview: (body) => api.post(`${BASE}/assign/preview`, body),
  assignMentor: (body) => api.post(`${BASE}/assign`, body),

  getReassignPreview: (body) => api.post(`${BASE}/reassign/preview`, body),
  reassignMentor: (body) => api.post(`${BASE}/reassign`, body),

  getSubmissionDetail: (submissionId) =>
    api.post(`${BASE}/submission/detail`, { submissionId }),
  saveDraft: (body) => api.post(`${BASE}/evaluation/draft`, body),
  publishEvaluation: (body) => api.post(`${BASE}/evaluation/publish`, body),
  saveAnnotations: (body) => api.post(`${BASE}/annotations/save`, body),
};
```

---

## 5. API call order (exact sequence)

| Step | Screen | API | When |
|------|--------|-----|------|
| 1 | Dashboard | `POST /dashboard` | Page mount |
| 2 | Filters | `POST /filters/meta` | Page mount (parallel with step 3) |
| 3 | Filters | `POST /filters/batches` | Page mount (parallel with step 2) |
| 4 | Filters | `POST /filters/faculty-subjects` | User selects Batch |
| 5 | Filters | `POST /filters/topics` | User selects Faculty Subject |
| 6 | Filters | `POST /filters/tests` | User selects Topic (or subject-only) |
| 7 | Table | `POST /list` | After meta + batches load; on every filter change |
| 8 | Export | `POST /export` | User clicks Export CSV |
| 9 | Assign page | `POST /assign/preview` | Test selected on Assign page |
| 10 | Assign | `POST /assign` | Confirm Assignment |
| 11 | Reassign modal | `POST /reassign/preview` | Reassign icon click |
| 12 | Reassign | `POST /reassign` | Confirm Reassign |
| 13 | View Paper | `POST /submission/detail` | Evaluate or View icon click |
| 14 | Draft | `POST /evaluation/draft` | Save Draft click |
| 15 | Publish | `POST /evaluation/publish` | Publish Results click |
| 16 | Annotations | `POST /annotations/save` | PDF markup save |

---

# PAGE 1 — Evaluation Oversight Dashboard

## 6. Dashboard stats cards

**UI:** Four cards — Total Papers, Pending Evaluation, Evaluated Today, Avg. Evaluation Time.

**API:**

```http
POST /api/evaluation-oversight/dashboard
{}
```

**Response mapping:**

| Card | Field |
|------|-------|
| Total Papers | `data.totalPapers` |
| Pending Evaluation | `data.pendingEvaluation` |
| Evaluated Today | `data.evaluatedToday` |
| Avg. Evaluation Time | `data.avgEvaluationTimeMinutes` (append `m`) |

**Behaviour:**

- Load cards independently on page mount.
- On failure → show `0` for that card (do not block the page).
- **Never reload dashboard** when filters or table change.

---

## 7. Filter bar (10 filters + dates + search)

### 7.1 Initial load (parallel)

Call these two APIs when the page mounts (after auth):

```http
POST /api/evaluation-oversight/filters/meta
{}
```

Populate:

| Dropdown | Source field |
|----------|--------------|
| Program | `data.programs[]` → `_id`, `label` |
| Mentor | `data.mentors[]` → `mentorId`, `mentorName` |
| Center | `data.centers[]` → `_id`, `label` |
| Evaluation Status | `data.statuses[]` → `key`, `label` |
| Priority | `data.priorities[]` → `key`, `label` |
| Exam Type | `data.examTypes[]` → `key`, `label` |

```http
POST /api/evaluation-oversight/filters/batches
{}
```

Populate:

| Dropdown | Source field |
|----------|--------------|
| Batch | `data.batches[]` → `_id`, `label`, `batchId` |

Then call **List API** (section 8) with defaults.

---

### 7.2 Cascading dropdowns (dependent)

```
Batch selected
    ↓ POST /filters/faculty-subjects { batchId }
Faculty Subject selected
    ↓ POST /filters/topics { batchId, facultySubjectId }
Topic selected (optional)
    ↓ POST /filters/tests { batchId, facultySubjectId, topicId }
```

**Batch selected:**

```json
POST /filters/faculty-subjects
{ "batchId": "<mongoId or BAT001>" }
```

- Populate **Faculty Subject** from `data.facultySubjects[]`.
- Clear **Topic** and **Test Name** selections.
- Reload **List** only.

**Faculty Subject selected:**

```json
POST /filters/topics
{
  "batchId": "...",
  "facultySubjectId": "..."
}
```

- Populate **Topic** from `data.topics[]` only.
- Clear **Test Name**.
- Reload **List** only.

**Topic selected OR empty (All Sub-topics):**

```json
POST /filters/tests
{
  "batchId": "...",
  "facultySubjectId": "...",
  "topicId": "..." 
}
```

- If topic is empty / "All Sub-topics" → pass `topicId: ""`.
- Populate **Test Name** from `data.tests[]` only.
- Reload **List** only.

**Independent filters** (no cascade API — only reload list):

- Program → `programId`
- Mentor → `mentorId`
- Evaluation Status → `status`
- Priority → `priority`
- Exam Type → `examType`
- Center → `centerId`
- Submitted From → `submittedFrom` (ISO date)
- Submitted To → `submittedTo` (ISO date)

---

## 8. Student paper evaluation table

**UI:** Table with Export CSV + Assign Evaluators buttons.

**API:**

```http
POST /api/evaluation-oversight/list
```

**Default request body:**

```json
{
  "page": 1,
  "limit": 20,
  "search": "",
  "status": "ALL",
  "priority": "ALL",
  "examType": "ALL",
  "batchId": "",
  "programId": "",
  "facultySubjectId": "",
  "topicId": "",
  "testId": "",
  "mentorId": "",
  "centerId": "",
  "submittedFrom": "",
  "submittedTo": ""
}
```

**Response:** Pagination at root + `data[]` array.

| Column | Field |
|--------|-------|
| Student Name | `studentName` |
| Roll Number | `rollNumber` |
| Test Name | `testName` |
| Subject | `subject` |
| Type | `type` |
| Priority | `priority` → badge (NORMAL / HIGH / URGENT) |
| Center | `center` |
| Mentor Assigned | `mentorAssigned` (avatar + name) or "Unassigned" |
| Status | `statusLabel` → colored pill |
| Score | `score` (`"88/100"`, `"Pending"`, etc.) |
| Actions | See section 9 |

**Pagination:** Use `page`, `limit`, `total`, `totalPages` from response. Changing page → reload `/list` only.

**Search:** Debounce 500 ms. Searches student name, roll number, mentor name (backend handles).

**Empty state:** Show when `data.length === 0`.

**Loading:** Table skeleton while `/list` is in flight.

---

## 9. Table action buttons

Backend returns flags on each row — **never compute visibility in frontend**.

| Icon | Flag | Action |
|------|------|--------|
| Assign (person+) | `canAssign === true` | Open assign modal OR navigate to assign flow |
| Reassign (person+) | `canReassign === true` | Open reassign modal |
| Evaluate (play) | `canEvaluate === true` | Navigate to View Paper (edit mode) |
| View (eye) | `canView === true` | Navigate to View Paper (read-only if published) |

Pass `submissionId`, `batchId`, `testId`, `facultySubjectId` from row to downstream screens.

---

## 10. Export CSV

**UI:** Export CSV button above table.

**API:**

```http
POST /api/evaluation-oversight/export
```

**Body:** Identical to current `/list` filters (omit or include `page`/`limit` — backend exports up to 10,000 rows).

```javascript
const blob = await evaluationOversightApi.exportCsv(currentFilters);
const url = window.URL.createObjectURL(blob);
const a = document.createElement('a');
a.href = url;
a.download = 'evaluation-oversight-export.csv';
a.click();
```

---

# PAGE 2 — Assign Evaluators

**UI:** Left sidebar (Source Selection + Primary Assignment + Assign To) + Right panel (Student Paper Selection table).

**Navigate:** From "Assign Evaluators" button on dashboard (carry no required state — user selects batch on this page).

---

## 11. Left panel — cascading dropdowns

Same cascade as dashboard filters:

| Step | API | Populates |
|------|-----|-----------|
| Load | `POST /filters/batches` | Batch |
| Batch | `POST /filters/faculty-subjects` | Faculty Subject |
| Subject | `POST /filters/topics` | Topic |
| Topic / All | `POST /filters/tests` | Test Name |

When **Test Name** changes → call Assign Preview (section 12).

Optional: add **search** and **status** filter inputs that re-trigger preview only (not list).

---

## 12. Assign preview

**API:**

```http
POST /api/evaluation-oversight/assign/preview
```

**Request:**

```json
{
  "batchId": "...",
  "facultySubjectId": "...",
  "topicId": "...",
  "testId": "...",
  "search": "",
  "status": "ALL"
}
```

**Response mapping:**

### Primary Assignment card (left panel)

| UI | Field |
|----|-------|
| Mentor name | `primaryAssignment.mentorName` |
| Pending papers | `primaryAssignment.pending` or `pendingPapers` |
| Workload | `primaryAssignment.workload` |
| Assigned date | `primaryAssignment.assignedDate` |
| Due date | `primaryAssignment.dueDate` |

If `primaryAssignment === null`:

> Show: **"No primary evaluator assigned for this test yet."**

### Assign To section

Use `data.availableMentors[]`:

| UI | Field |
|----|-------|
| Name | `mentorName` |
| Pending | `pending` / `pendingCount` |
| Workload | `currentWorkload` |
| Availability | `availability` (`AVAILABLE` / `BUSY`) |
| Primary badge | `isPrimary === true` |
| Eligible | `isEligible` |

**Selection:** Radio — only **one** mentor selectable at a time.

### Right table — Student Paper Selection

Use `data.students[]`:

| Column | Field |
|--------|-------|
| Checkbox | local state + `submissionId` |
| Student Name | `studentName` |
| Roll Number | `rollNumber` |
| Current Status | `statusLabel` → badge |
| Last Updated | `lastUpdated` |

**Select all:** Select only visible rows on current page.

**Bulk Action:** UI-only selection helper — **no API call**.

**Counts:** Use `data.counts` for header subtitle (e.g. "Showing X pending papers for …").

---

## 13. Confirm assignment

**API:**

```http
POST /api/evaluation-oversight/assign
```

**Request:**

```json
{
  "submissionIds": ["...", "..."],
  "mentorId": "...",
  "reason": "Initial assignment"
}
```

**On success:**

1. Toast success.
2. Reload `POST /assign/preview` (same batch/subject/topic/test).
3. Clear student checkboxes.

**Validation before submit:**

- At least one `submissionId` checked.
- One `mentorId` selected.

---

# PAGE 3 — Reassign flow (modal)

**Trigger:** Reassign icon on table row (`canReassign === true`).

---

## 14. Reassign preview

**API:**

```http
POST /api/evaluation-oversight/reassign/preview
```

**Single row modal:**

```json
{ "submissionId": "..." }
```

**Modal UI mapping:**

| UI | Field |
|----|-------|
| Student | From row or preview context |
| Subject | From row `subject` |
| Current Mentor | `currentMentor.mentorName` or `currentAssignment` |
| Available mentors dropdown | `availableMentors[]` or `eligibleMentors[]` |
| Pending / workload per mentor | `pending`, `currentWorkload` |

Show mentor options as: `"Dr. Sarah Chen · 2 pending"`.

---

## 15. Confirm reassign

**API:**

```http
POST /api/evaluation-oversight/reassign
```

**Request:**

```json
{
  "submissionId": "...",
  "mentorId": "...",
  "reason": "Mentor on leave — reassigned"
}
```

**On success:**

1. Close modal.
2. Toast success.
3. Reload **List API only** (dashboard table).

---

# PAGE 4 — View Paper / Evaluation

**Trigger:** Evaluate icon (`canEvaluate`) or View icon (`canView`).

**Navigate with:** `submissionId` in route or state.

---

## 16. Submission detail

**API:**

```http
POST /api/evaluation-oversight/submission/detail
{ "submissionId": "..." }
```

### Left panel

| UI | Field |
|----|-------|
| Test title | `test.testName` + `test.subject` |
| Question | `test.questionsText` |
| Download | `answer.pdfUrl` or `answer.file.url` |
| Answer viewer | See below |

**Answer display:**

| `answer.type` | UI |
|---------------|-----|
| `text` | Render `answer.text` |
| `file` | PDF viewer with `answer.pdfUrl` |

**Annotations toolbar:** Load existing from `annotations[]`. On save → section 19.

### Right panel

| UI | Field |
|----|-------|
| Student name | `student.name` |
| Roll no | `student.rollNumber` |
| Batch | `student.batchName` |
| Status badge | `statusLabel` |
| Conceptual Clarity | `evaluation.conceptualScore` / max 10, `evaluation.conceptualRemarks` |
| Language & Tone | `evaluation.languageScore` / max 5, `evaluation.languageRemarks` |
| Structure | `evaluation.structureScore` / max 5, `evaluation.structureRemarks` |
| Total Score | `evaluation.totalScore` / `evaluation.maxScore` |

### Backend flags (controls editability)

| Flag | Behaviour |
|------|-----------|
| `canEdit === true` | Enable sliders, textareas, Save Draft, Publish |
| `canPublish === true` | Enable Publish button |
| `published === true` OR `evaluationLocked === true` | Disable all inputs — read-only view |
| `draft === true` | Show draft indicator |

**Never infer** edit state from `status` alone — use flags.

---

## 17. Save draft

**API:**

```http
POST /api/evaluation-oversight/evaluation/draft
```

**Request:**

```json
{
  "submissionId": "...",
  "conceptualScore": 7.5,
  "conceptualRemarks": "...",
  "languageScore": 4,
  "languageRemarks": "...",
  "structureScore": 3.5,
  "structureRemarks": "..."
}
```

**On success:** Toast + optionally reload submission detail.

---

## 18. Publish evaluation

**API:**

```http
POST /api/evaluation-oversight/evaluation/publish
```

**Request:** Same rubric fields as draft.

**On success:**

1. Toast success.
2. Reload `POST /submission/detail`.
3. UI becomes read-only (`published === true`).

---

## 19. PDF annotations

**API:**

```http
POST /api/evaluation-oversight/annotations/save
```

**Request:**

```json
{
  "submissionId": "...",
  "annotations": [
    {
      "pageNo": 1,
      "annotationType": "HIGHLIGHT",
      "content": "Key point",
      "coordinates": { "x": 100, "y": 200, "width": 300, "height": 20 },
      "color": "#FFEB3B"
    }
  ]
}
```

**Types:** `HIGHLIGHT` | `UNDERLINE` | `COMMENT` | `MARK`

Replacing all annotations on each save. Pass `annotations: []` to clear.

---

## 20. Error handling

| State | UX |
|-------|-----|
| Loading | Skeleton / spinner per section |
| Error | Toast + retry button where appropriate |
| Empty dropdown | "No options" placeholder, disable dependent dropdowns |
| Empty table | Illustrated empty state |
| 404 batch | Toast "Batch not found" |
| Published locked | Disable form, show message |

---

## 21. Reusable hook example — filter cascade

```javascript
// hooks/useEvaluationFilters.js
import { useState, useCallback } from 'react';
import { evaluationOversightApi } from '@/services/evaluationOversight.service';

export function useEvaluationFilters() {
  const [meta, setMeta] = useState(null);
  const [batches, setBatches] = useState([]);
  const [facultySubjects, setFacultySubjects] = useState([]);
  const [topics, setTopics] = useState([]);
  const [tests, setTests] = useState([]);

  const [selected, setSelected] = useState({
    batchId: '',
    programId: '',
    facultySubjectId: '',
    topicId: '',
    testId: '',
    mentorId: '',
    centerId: '',
    status: 'ALL',
    priority: 'ALL',
    examType: 'ALL',
    submittedFrom: '',
    submittedTo: '',
    search: '',
    page: 1,
    limit: 20,
  });

  const loadInitial = useCallback(async () => {
    const [metaRes, batchRes] = await Promise.all([
      evaluationOversightApi.getFilterMeta(),
      evaluationOversightApi.getBatches({}),
    ]);
    setMeta(metaRes.data.data);
    setBatches(batchRes.data.data.batches);
  }, []);

  const onBatchChange = async (batchId) => {
    setSelected((s) => ({
      ...s,
      batchId,
      facultySubjectId: '',
      topicId: '',
      testId: '',
      page: 1,
    }));
    setFacultySubjects([]);
    setTopics([]);
    setTests([]);
    if (!batchId) return;
    const res = await evaluationOversightApi.getFacultySubjects(batchId);
    setFacultySubjects(res.data.data.facultySubjects);
  };

  const onFacultySubjectChange = async (facultySubjectId) => {
    setSelected((s) => ({ ...s, facultySubjectId, topicId: '', testId: '', page: 1 }));
    setTopics([]);
    setTests([]);
    if (!facultySubjectId || !selected.batchId) return;
    const res = await evaluationOversightApi.getTopics(selected.batchId, facultySubjectId);
    setTopics(res.data.data.topics);
  };

  const onTopicChange = async (topicId) => {
    setSelected((s) => ({ ...s, topicId, testId: '', page: 1 }));
    setTests([]);
    if (!selected.batchId || !selected.facultySubjectId) return;
    const res = await evaluationOversightApi.getTests(
      selected.batchId,
      selected.facultySubjectId,
      topicId
    );
    setTests(res.data.data.tests);
  };

  return {
    meta,
    batches,
    facultySubjects,
    topics,
    tests,
    selected,
    setSelected,
    loadInitial,
    onBatchChange,
    onFacultySubjectChange,
    onTopicChange,
  };
}
```

---

## 22. Screen → API map (quick reference)

```
┌─────────────────────────────────────────────────────────────┐
│  DASHBOARD PAGE                                              │
├─────────────────────────────────────────────────────────────┤
│  Stats Cards          →  POST /dashboard                     │
│  Program/Mentor/...   →  POST /filters/meta                  │
│  Batch dropdown       →  POST /filters/batches             │
│  Faculty Subject      →  POST /filters/faculty-subjects      │
│  Topic                →  POST /filters/topics              │
│  Test Name            →  POST /filters/tests               │
│  Table                →  POST /list                          │
│  Export CSV           →  POST /export                         │
│  Assign Evaluators btn→  navigate to Assign page             │
│  Row Reassign icon    →  POST /reassign/preview → /reassign  │
│  Row Evaluate/View    →  navigate to View Paper              │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  ASSIGN EVALUATORS PAGE                                      │
├─────────────────────────────────────────────────────────────┤
│  Left dropdowns       →  same /filters/* cascade             │
│  Primary + Mentors    →  POST /assign/preview                │
│  Student table        →  assign/preview → students[]         │
│  Confirm              →  POST /assign                        │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  VIEW PAPER PAGE                                             │
├─────────────────────────────────────────────────────────────┤
│  Load                 →  POST /submission/detail              │
│  Save Draft           →  POST /evaluation/draft              │
│  Publish              →  POST /evaluation/publish            │
│  PDF markup           →  POST /annotations/save              │
└─────────────────────────────────────────────────────────────┘
```

---

## 23. Do NOT (checklist)

- [ ] Do not hardcode dropdown options
- [ ] Do not compute `canAssign` / `canReassign` / `canEvaluate` / `canView` in frontend
- [ ] Do not infer evaluation edit permissions from status string
- [ ] Do not reload dashboard when filters change
- [ ] Do not call `/advanced-filter` for new screens (use `/filters/*` routes)
- [ ] Do not use mock data
- [ ] Do not modify backend APIs

---

## 24. Related files

| File | Purpose |
|------|---------|
| `EVALUATION_OVERSIGHT_API_GUIDE.md` | Full request/response reference |
| `EVALUATION_OVERSIGHT_POSTMAN_COLLECTION.json` | Postman test sequence |
| `EVALUATION_OVERSIGHT_TESTING_GUIDE.md` | QA / seed data notes |

---

## 25. Evaluation lifecycle (frontend states)

```
Student submits MAW
    → Table shows NOT_STARTED
Assign mentor (Assign or Reassign)
    → ASSIGNED
Mentor opens Evaluate → Save Draft
    → IN_PROGRESS
Publish Results
    → EVALUATED (read-only, canView only)
```

Status badges and score display always come from **list** or **submission/detail** API — never hardcode colors per assumed status in isolation without backend `status` / `statusLabel`.
