# Batch Module — Complete Frontend Documentation

**Audience:** Backend development team preparing API integration  
**Scope:** Academics → Batch Management (list, create/edit, quick view, batch details, student management)  
**Source of truth:** Current React implementation in this repository (read-only documentation; no code changes)  
**Last reviewed:** June 2026  
**Related doc:** `docs/BATCH_FRONTEND_INTEGRATION_GUIDE.md` (API-focused integration guide for frontend developers)

---

## Table of Contents

1. [Module Overview](#1-module-overview)
2. [Page Layout](#2-page-layout)
3. [Complete Table Documentation](#3-complete-table-documentation)
4. [Filters](#4-filters)
5. [Search](#5-search)
6. [Action Buttons](#6-action-buttons)
7. [Add Batch Screen](#7-add-batch-screen)
8. [Edit Batch](#8-edit-batch)
9. [View Batch](#9-view-batch)
10. [Brochure Feature](#10-brochure-feature)
11. [Demo Video Feature](#11-demo-video-feature)
12. [Fees Structure](#12-fees-structure)
13. [Status System](#13-status-system)
14. [Student Management](#14-student-management)
15. [Student Management Table](#15-student-management-table)
16. [Student Actions](#16-student-actions)
17. [Modals](#17-modals)
18. [Drawers](#18-drawers)
19. [Bulk Operations](#19-bulk-operations)
20. [Validations](#20-validations)
21. [UI Logic](#21-ui-logic)
22. [Complete User Flow](#22-complete-user-flow)
23. [Component Hierarchy](#23-component-hierarchy)
24. [State Management](#24-state-management)
25. [Expected Backend APIs](#25-expected-backend-apis)
26. [Frontend Data Flow](#26-frontend-data-flow)
27. [Edge Cases](#27-edge-cases)
28. [Complete Field Reference](#28-complete-field-reference)
29. [Notes for Backend Team](#29-notes-for-backend-team)

---

## 1. Module Overview

### What the Batch module is

The **Batch Manager** is an admin-panel module for creating and operating academic **batches** — scheduled cohorts linked to a catalog **course**, a **mentor**, **faculty subjects**, **fees**, **banner/brochure media**, and **student enrollments**.

In this codebase, batches are the operational layer on top of courses (marketing/catalog content lives under Academics → Categories → Courses). The UI label is **Batch Manager**; routes use `/academics/batch`.

### Purpose

- List and search batches with status filtering and pagination
- Create, edit, duplicate, activate/deactivate batches
- Quick-view batch details without leaving the list
- Open a **Batch Details** page for summary info and **Student Management**
- Manage enrollments: add, edit, view, enable/disable, move between batches

### Where it appears

| Route | Page | Component |
|-------|------|-----------|
| `/academics/batch` | Batch list | `BatchesPage` |
| `/academics/batch/:batchId` | Batch details + students | `BatchDetailsPage` |

**Legacy redirects** (still supported):

- `/academics/batches` → `/academics/batch`
- `/academics/batches/:batchId` → `/academics/batch/:batchId`
- `/courses` → `/academics/batch`

Navigation: **Academics → Batch** (breadcrumb on details: Academics → Batch → Batch Details).

### User journey (high level)

1. Admin opens **Batch Manager** (`/academics/batch`).
2. Table loads batches from `GET /api/batches` (server-paginated).
3. Admin searches/filters, selects rows, or clicks **Add Batch**.
4. **Add/Edit Batch** opens a full-screen modal with three steps: Batch Details, Fee Details, Subject Details.
5. Admin uses **Quick View** (eye icon) for read-only summary, or clicks **Batch ID / Name / Students** to open **Batch Details**.
6. On Batch Details, admin sees summary card and **Student Management** panel.
7. Admin enrolls/edits/moves students (when API handlers are wired — see §14 integration note).

### Main functionalities

| Area | Features |
|------|----------|
| Batch list | Search, status filter, pagination, row selection, bulk activate/deactivate |
| Batch CRUD | Add, edit, duplicate, status toggle (Active ↔ Deactivated) |
| Media | Banner image, PDF brochure (required on create) |
| Fees | Currency, discount, online/offline amounts, bullet points |
| Subjects | Multi-select faculty subjects from Academics |
| Students | Table with payment, attendance, progress, status; add/edit/view/disable/enable/move |
| Audit | Local batch activity log (client-side storage, not backend audit API) |

### Overall workflow

```
Login (JWT) → Batch List → [Filter/Search] → Table
                    ↓
        Add / Edit / Duplicate / Quick View / Details
                    ↓
        Batch Details → Student Management → Enrollment APIs
```

---

## 2. Page Layout

### 2.1 Batch List Page (`/academics/batch`)

Vertical structure:

```
PageBanner ("Batch Manager")
  └── [Add Batch] button

CourseFilterToolbar
  ├── Search input
  └── Status dropdown (All / Active / Deactivated)

CurrentAffairsBulkActionsBar (visible when rows selected)
  ├── Selection count + Clear selection
  ├── Activate All
  └── Deactivate All

[Empty state] OR BatchManagementTable
  ├── Checkbox column (bulk select)
  ├── Data columns (see §3)
  ├── Row actions
  └── TablePagination (page size, page numbers)

Modals (overlay)
  ├── AddCourseModal (Add / Edit / Duplicate batch)
  ├── ViewBatchModal (Quick View)
  └── BatchBulkConfirmDialog (bulk activate/deactivate confirm)
```

**No** statistics/summary cards on the list page. **No** drawers on the list page.

### 2.2 Batch Details Page (`/academics/batch/:batchId`)

```
CategoryBreadcrumb

PageBanner ("Batch Details")

[Back to Batch List] button

BatchDetailsInfoCard
  ├── Title (course - batch name), Batch ID, status badge
  ├── Edit Batch button
  └── Info grid (course, mentor, dates, student count, merge ref)

BatchStudentPanel (variant="page")
  ├── Section header + Add Student
  ├── Student search
  ├── Student table + pagination
  └── Student modals (add/edit/view/move/disable confirm)

AddCourseModal (Edit Batch from details page)
```

**No** tabs on the details page. **No** separate brochure/demo sections on the details page (those live in Add/Edit modal and Quick View).

### 2.3 Add/Edit Batch Modal (full-screen)

```
ModalPanelHeader (title + close)

[Duplicate info banner] (duplicate mode only)

Scrollable form body — three BatchFormCards:
  Step 1 — Batch Details (BatchDetailsSection)
  Step 2 — Fee Details (BatchFeeDetailsSection)
  Step 3 — Subject Details (BatchSubjectDetailsSection)

BatchFormStickyFooter
  ├── Reset
  └── Create / Update / Create Duplicate
```

---

## 3. Complete Table Documentation

### 3.1 Batch List Table (`BatchManagementTable`)

Server-controlled pagination. Default page size: **10**. No column sorting in UI. No per-column filters beyond global search/status.

#### Select (checkbox)

| Attribute | Value |
|-----------|-------|
| **Purpose** | Bulk row selection for activate/deactivate |
| **Data** | Row Mongo/human `id` (string) |
| **Formatting** | Checkbox in fixed 44px column |
| **Sorting** | None |
| **Filtering** | None |
| **Searchability** | N/A |
| **Visibility** | Always when selection handlers provided |
| **Example** | Checked row `507f1f77bcf86cd799439011` |

#### Batch ID

| Attribute | Value |
|-----------|-------|
| **Purpose** | Human-readable batch identifier; navigates to details |
| **Data** | String — `batchId` or `batchCode` (see `resolveBatchDisplayId`) |
| **Formatting** | Mono, bold, blue link; truncated with `title` tooltip |
| **Sorting** | None |
| **Filtering** | Via global search |
| **Searchability** | Yes — batch ID, name, course, mentor (see §5) |
| **Visibility** | Always |
| **Example** | `BAT019` |

#### Batch Name

| Attribute | Value |
|-----------|-------|
| **Purpose** | Display name; link to batch details |
| **Data** | String — `batchName` or legacy `name` |
| **Formatting** | Semibold; optional sub-line **Merged Into: {name}** if `mergedIntoName` set |
| **Sorting** | None |
| **Filtering** | Global search |
| **Searchability** | Yes |
| **Visibility** | Always |
| **Example** | `UPSC GS Foundation 2026` |

#### Mentor Name

| Attribute | Value |
|-----------|-------|
| **Purpose** | Assigned mentor display |
| **Data** | String — resolved from `mentorName`, `trainerName`, mentor employee record |
| **Formatting** | Gray medium weight; `—` if empty |
| **Sorting** | None |
| **Filtering** | Global search (`mentorName`) |
| **Searchability** | Yes |
| **Visibility** | Always |
| **Example** | `Arjun Mehta` |

#### Start Date

| Attribute | Value |
|-----------|-------|
| **Purpose** | Batch instructional start |
| **Data** | ISO date string (`batchStartFrom` / `commencement`) |
| **Formatting** | `formatBatchDate` → `DD Mon YYYY` (en-IN); `—` if empty |
| **Sorting** | None |
| **Filtering** | None |
| **Searchability** | No |
| **Visibility** | Always |
| **Example** | `15 Jan 2026` |

#### End Date

| Attribute | Value |
|-----------|-------|
| **Purpose** | Batch end date |
| **Data** | ISO date (`batchEndTo`) |
| **Formatting** | Same as Start Date |
| **Sorting** | None |
| **Filtering** | None |
| **Searchability** | No |
| **Visibility** | Always |
| **Example** | `15 Jul 2026` |

#### Students

| Attribute | Value |
|-----------|-------|
| **Purpose** | Enrolled count; shortcut to details/students |
| **Data** | Number — `totalStudents` (API count or context fallback) |
| **Formatting** | Pill button with Users icon + count |
| **Sorting** | None |
| **Filtering** | None |
| **Searchability** | No |
| **Visibility** | Always |
| **Example** | `42` |

#### Status

| Attribute | Value |
|-----------|-------|
| **Purpose** | Batch operational status |
| **Data** | `Active` or `Deactivated` (normalized from API) |
| **Formatting** | `StatusBadge` — green (Active) or amber (Deactivated) |
| **Sorting** | None |
| **Filtering** | Status dropdown |
| **Searchability** | No |
| **Visibility** | Always |
| **Example** | `Active` |

#### Actions

| Attribute | Value |
|-----------|-------|
| **Purpose** | Row-level operations |
| **Controls** | View, Edit, Duplicate, Activate/Deactivate (see §6) |
| **Visibility** | Always; disabled while status update in flight |

---

## 4. Filters

The list page uses `CourseFilterToolbar` with **two** filters only (no course/center/faculty/mode/language/date range filters on the batch list).

### Status

| Attribute | Value |
|-----------|-------|
| **Purpose** | Filter batches by operational status |
| **Type** | Single-select dropdown |
| **Options** | `all` → "All Statuses"; `Active`; `Deactivated` |
| **Default** | `all` |
| **Behavior** | Resets page to 1 and clears row selection on change |
| **API mapping** | `all` → no param; `Active` → `ACTIVE`; `Deactivated` → `INACTIVE` |
| **Table interaction** | Server-side filter via `GET /batches?status=` |

### Search

Documented in §5 (implemented as part of the filter toolbar).

**Not present on batch list:** Course, Program, Center, Faculty, Mentor (dedicated), Mode, Language, Start/End date range filters.

---

## 5. Search

### Batch list search

| Attribute | Value |
|-----------|-------|
| **Field** | Single text input in `CourseFilterToolbar` |
| **Placeholder** | `Search by batch ID, name, course, or mentor...` |
| **Debounce** | **300 ms** (`useDebouncedValue`) |
| **Case sensitivity** | **Insensitive** |
| **Reset behavior** | Changing search resets page to 1 and clears selection |

**Server request:** `GET /batches` sends duplicate query keys when search is non-empty:

- `search`, `batchId`, `batchName`, `courseName`, `mentorName` — all set to the same trimmed string

**Client-side fallback:** After API response, rows are **also** filtered with `matchesBatchSearch()` across:

- `batchId`, `batchCode`, `batchName`, `name`, `courseName`, `linkedCourseName`, display name (`course - batch`), `mentorName`, `trainerName`, resolved mentor label

### Student search (Batch Details / Student panel)

| Attribute | Value |
|-----------|-------|
| **Placeholder** | `Search students...` |
| **Debounce** | **400 ms** when server-paginated (`useBatchEnrollments`) |
| **Fields (client mode)** | `name`, `email`, `enrollmentId`, `phone` (substring, lowercase) |
| **Fields (server mode)** | `search` param on `POST /batch-enrollments/by-batch` |
| **Reset** | Resets student page to 1 on search change |

---

## 6. Action Buttons

### 6.1 Batch List — Page level

| Button | Purpose | When visible | Permission | Workflow | Expected result |
|--------|---------|--------------|------------|----------|-----------------|
| **Add Batch** | Open create modal | Always (banner + empty state) | Authenticated admin | Click → `AddCourseModal` empty form | Modal opens |
| **Add Batch** (empty CTA) | Same as above | Zero batches, no active filters | Same | Same | Same |

### 6.2 Batch List — Row actions (`BatchTableActions`)

| Button | Purpose | When visible | Workflow | Expected result |
|--------|---------|--------------|----------|-----------------|
| **View** | Quick View modal | Always | `fetchBatchQuickView` then `ViewBatchModal` | Read-only batch summary |
| **Edit** | Edit batch | Always | Opens `AddCourseModal` in edit mode; fetches `GET /batches/:id` | Modal with prefilled form |
| **Duplicate** | Clone batch | Always | Opens modal in duplicate mode; new code/name required | `POST /batches/:id/duplicate` on save |
| **Activate / Deactivate** | Toggle status | Always; label from `recordStatusActionLabel` | Optimistic UI → `PATCH /batches/status/:id` | Status flips Active ↔ Deactivated |
| **Delete** | Remove batch | **Not wired in UI** — handler exists in page but `BatchTableActions` ignores `onDelete` | N/A | N/A |

### 6.3 Batch List — Bulk actions (`CurrentAffairsBulkActionsBar`)

| Button | Purpose | When visible | Workflow | Expected result |
|--------|---------|--------------|----------|-----------------|
| **Clear selection** | Deselect all | ≥1 row selected | Clears `selectedIds` | Selection bar hides |
| **Activate All** | Bulk enable | `enableableCount > 0` (selected rows with status Deactivated) | Confirm dialog → loop `PATCH` status Active | Toast + reload list |
| **Deactivate All** | Bulk disable | `disableableCount > 0` (selected Active) | Confirm dialog → loop `PATCH` status Deactivated | Toast + reload list |
| **Delete** | Bulk delete | **Not shown** — `onDelete` prop passed but component ignores it | Code path exists for `type: 'delete'` but no UI trigger | N/A |

### 6.4 Batch Details page

| Button | Purpose | When visible | Workflow | Expected result |
|--------|---------|--------------|----------|-----------------|
| **Back to Batch List** | Return to list | Always | Navigates to `/academics/batch` preserving `listState` | List restored filters/page |
| **Edit Batch** | Edit current batch | Always on info card | Opens `AddCourseModal` | `PUT /batches/:id` on save |

### 6.5 Student panel

| Button | Purpose | When visible | Workflow | Expected result |
|--------|---------|--------------|----------|-----------------|
| **Add Student** | Enroll student | Always | `StudentFormModal` → `POST /batch-enrollments` | Student in table (when API wired) |
| **Add Student** (empty CTA) | Same | Empty student table | Same | Same |

### 6.6 Student row actions (`StudentTableActions`)

| Button | Purpose | When visible | Workflow | Expected result |
|--------|---------|--------------|----------|-----------------|
| **View** | Enrollment details | Always | `StudentViewModal`; may fetch latest enrollment | Read-only profile |
| **Edit** | Update enrollment | Always | `StudentFormModal` edit mode | `PUT /batch-enrollments/:id` |
| **Disable** | Deactivate enrollment | Student status Active; not demo mode | Confirm → `PATCH .../status` → INACTIVE | Status → Deactivated |
| **Enable** | Reactivate | Student inactive; not demo mode | Direct `PATCH` status ACTIVE | Status → Active |
| **Move** | Transfer batch | `onMoveStudent` prop provided + `canMove` | `MoveStudentModal` → `POST .../move` | Student removed from source batch |
| **Delete** | Remove enrollment | **UI not exposed** — confirm dialog exists but no button sets `deleteTarget` | N/A | N/A |

### Move student permission

Move button visibility requires `onMoveStudent` callback. Role gate (in `BatchDetailsPage`): **Super Admin**, **Operation Admin**, or **Center Admin** (`STUDENT_MOVE_ROLES`).

---

## 7. Add Batch Screen

Implemented as **`AddCourseModal`** (naming legacy from courses module). Three form cards.

### 7.1 Batch Details section fields

#### Batch Name

| Attribute | Value |
|-----------|-------|
| **Type** | Text input |
| **Required** | Yes |
| **Validation** | Non-empty; unique among existing batches (client check) |
| **Error** | `Batch name is required` / `This Batch Name already exists.` |
| **Placeholder** | `e.g. UPSC Batch 1` |
| **Example** | `UPSC GS Foundation 2026` |
| **Dependencies** | None |
| **Max length** | No explicit UI max |

#### Batch Code

| Attribute | Value |
|-----------|-------|
| **Type** | Text input |
| **Required** | Yes |
| **Validation** | Non-empty; unique (client); **read-only in edit mode** |
| **Error** | `Batch code is required` / `This Batch Code already exists.` |
| **Placeholder** | `e.g. UPSC-B01` |
| **Example** | `UPSC-B01` |
| **Edit behavior** | Disabled after creation; helper text shown |

#### Mentor

| Attribute | Value |
|-----------|-------|
| **Type** | Searchable select |
| **Required** | Yes (`mentorId` or `mentorEmail`) |
| **Source** | `GET /admin/admin-access/mentors/dropdown` via `useMentorEmployees` |
| **Stored fields** | `mentorId`, `mentorEmail`, `mentorEmployeeId`, `mentorName`, `mentorRoleId`, `mentorRoleLabel`, `trainerName` |
| **Error** | `Mentor is required` |
| **Placeholder** | `Select mentor` |

#### Course

| Attribute | Value |
|-----------|-------|
| **Type** | `CourseCatalogSelect` (searchable academic course picker) |
| **Required** | Yes |
| **Stored fields** | `academicCourseId` (Mongo), `courseId` (human code), `courseName` |
| **Error** | `Please select a course` |
| **API field** | `courseId` in multipart = `academicCourseId \|\| courseId` |

#### Date of Commencement

| Attribute | Value |
|-----------|-------|
| **Type** | Date input (`YYYY-MM-DD`) |
| **Required** | Yes |
| **API field** | `commencementDate` |
| **Error** | `Date of commencement is required` |

#### Duration

| Attribute | Value |
|-----------|-------|
| **Type** | Text input (free-form label) |
| **Required** | Yes |
| **Validation** | Non-empty; parsed to months for API (`6 Months` → 6, `1 Year` → 12) |
| **Placeholder** | `e.g. 6 Months, 1 Year` |
| **API field** | `durationInMonths` |

#### Batch Start Date

| Attribute | Value |
|-----------|-------|
| **Type** | Date input |
| **Required** | Yes |
| **API field** | `batchStartDate` |
| **Cross-validation** | End ≥ Start |

#### Batch End Date

| Attribute | Value |
|-----------|-------|
| **Type** | Date input |
| **Required** | Yes |
| **API field** | `batchEndDate` |
| **Error** | `End date cannot be before start date` |

#### Status

| Attribute | Value |
|-----------|-------|
| **Type** | Select |
| **Required** | Yes |
| **Options** | `Active`, `Deactivated` |
| **Default** | `Active` |
| **API mapping** | `ACTIVE` / `INACTIVE` |

#### Banner Image

| Attribute | Value |
|-----------|-------|
| **Type** | Image upload (drag-drop or browse) |
| **Required** | Yes (preview, file name, or new file) |
| **Accept** | JPG, PNG, WEBP |
| **Max size** | 5 MB (`IMAGE_BANNER` profile) |
| **Recommended** | 1920×600 px |
| **API field** | `bannerImage` (multipart File) |
| **Error** | `Banner image is required` |

#### Batch Brochure

| Attribute | Value |
|-----------|-------|
| **Type** | PDF upload |
| **Required** | Yes |
| **Accept** | PDF only |
| **Max size** | 10 MB (`PDF_STANDARD`) |
| **API field** | `brochure` (multipart File) |
| **Error** | `Batch brochure is required` |
| **See** | §10 |

### 7.2 Fee Details section fields

#### Currency

| Attribute | Value |
|-----------|-------|
| **Type** | Select |
| **Required** | Implicit (defaults INR) |
| **Options** | INR (₹), USD ($), EUR (€) |
| **Default** | `INR` |

#### Discount Fee

| Attribute | Value |
|-----------|-------|
| **Type** | Number (min 0) |
| **Required** | No |
| **Placeholder** | `Optional discounted amount` |
| **API** | `feesJson.discountAmount` |

#### Online Payment Amount

| Attribute | Value |
|-----------|-------|
| **Type** | Number (min 0) |
| **Required** | Yes |
| **Error** | `Online payment amount is required` |
| **API** | `feesJson.onlineAmount` |

#### Offline Payment Amount

| Attribute | Value |
|-----------|-------|
| **Type** | Number (min 0) |
| **Required** | Yes |
| **Error** | `Offline payment amount is required` |
| **API** | `feesJson.offlineAmount` |

#### Online Payment – Bullet Points

| Attribute | Value |
|-----------|-------|
| **Type** | Multi-line textarea (one bullet per line) |
| **Required** | At least one non-empty line |
| **Error** | `Online payment bullet points are required` |
| **API** | `feesJson.onlineBulletPoints` (string array) |

#### Offline Payment – Bullet Points

| Attribute | Value |
|-----------|-------|
| **Type** | Multi-line textarea |
| **Required** | At least one line |
| **Error** | `Offline payment bullet points are required` |
| **API** | `feesJson.offlineBulletPoints` |

**Not in batch fee UI:** Installments, scholarship, registration fee as separate fields. Only discount + online/offline amounts.

### 7.3 Subject Details section

#### Add Faculty Subject

| Attribute | Value |
|-----------|-------|
| **Type** | Searchable select (`FacultySubjectSearchSelect`) |
| **Required** | At least one subject |
| **Source** | `GET` faculty subjects dropdown API; fallback local academics subjects |
| **Excludes** | Subjects with status `In Active` |
| **Stored** | `linkedSubjects[]` — `{ subjectId, subjectName, facultyId, facultyName }` |
| **API** | `facultySubjects` JSON array of subject IDs |
| **Error** | `Please select at least one subject` |

Selected subjects render as removable chips.

### 7.4 Duplicate mode extras

- Banner explains: pre-filled from source; must change name and unique batch code; new batch ID auto-generated
- `batchId` and `batchCode` cleared in form; name suffixed with `(Copy)` if not already
- Submit calls `duplicateBatch(sourceId, form)` instead of `createBatch`
- Footer label: **Create Duplicate**

### 7.5 Footer actions

| Button | Behavior |
|--------|----------|
| **Reset** | Resets form to initial open state; toast "Form reset" |
| **Create / Update / Create Duplicate** | Validates → `onSubmit` → closes on success |
| **Disabled while** | `submitting`, `brochureUploading`, or `detailLoading` (edit fetch) |

---

## 8. Edit Batch

### How edit works

1. Triggered from list row **Edit**, details page **Edit Batch**, or implicitly never from duplicate.
2. `useEditModal` sets `selectedItem` to API row.
3. Modal opens; form prefilled via `batchRowToForm(row)`.
4. **Additional fetch:** `GET /batches/:mongoId` replaces form when complete (edit only).
5. User submits → `PUT /batches/:mongoId` multipart.

### Prefilled values

All fields from §7 mapped from API row + `formData` nested object.

### Editable vs read-only

| Field | Edit |
|-------|------|
| Batch Code | **Read-only** (disabled input) |
| All other Batch Details, Fees, Subjects | Editable |
| Batch ID (human) | Not shown as separate field; carried from API |

### Validation

Same as create (§20), except batch code/id uniqueness checks exclude current batch id.

### Update flow

```
Edit → validate → buildUpdateBatchFormData → PUT /batches/:id
  → toast success → loadBatches (list) / refetchBatchDetails (details)
```

### Cancel flow

Close modal (`onClose`) — no save; no dirty confirm.

### Error handling

- Validation: inline field errors + toast `Please fix the highlighted fields`
- API: toast with `err.message` or `Failed to save batch`
- Brochure in progress: toast `Please wait for the brochure upload to finish`

---

## 9. View Batch

### Quick View (`ViewBatchModal`)

Triggered from list **View** button. Fetches `GET /batches/:id/quick-view` (falls back to full batch GET).

#### Layout sections

1. **Header** — batch name, batch ID, close
2. **Batch Details** grid:
   - Batch ID, Batch Name, Mentor, Linked Course, Course ID
   - Date of Commencement, Duration, Batch Start/End Date
   - Status badge, Created On, Modified On
   - Linked Subjects (list with faculty labels)
   - Banner image preview (if URL present)
   - Brochure card with View PDF / Download PDF
3. **Fee Details** (shown only if any fee field populated):
   - Currency, Discount Fee, Online/Offline amounts (formatted with currency symbol)
   - Online/offline bullet lists
4. **Footer** — Close button

**Not shown in Quick View:** Student list, demo video, SEO, audit history, capacity, center.

### Batch Details page (`BatchDetailsInfoCard`)

| Field | Shown |
|-------|-------|
| Display name (`course - batch`) | Yes |
| Batch ID (mono) | Yes |
| Status badge | Yes |
| Course | Yes |
| Mentor Name | Yes |
| Start / End Date | Yes |
| Total Students | Yes |
| Merge Reference | Conditional (`mergedIntoName`) |

**Not on details card:** Fees, brochure, banner, subjects, demo video (use Edit or Quick View).

---

## 10. Brochure Feature

### Upload (Add/Edit form — `BrochurePdfUpload`)

| Rule | Value |
|------|-------|
| **Accepted formats** | PDF only (`.pdf`, `application/pdf`) |
| **Max size** | 10 MB |
| **Methods** | Drag-and-drop, Browse File |
| **Processing** | Client reads file as **data URL** for preview; actual File sent on save via multipart `brochure` |
| **Required** | Yes on create (URL, file name, or new file) |

### Replace

**Replace Brochure** button opens file picker; new file replaces preview state.

### Remove

**Remove Brochure** clears URL, name, size, file reference.

### Download / Preview (form + Quick View)

- **View Brochure / View PDF** — `window.open(url)` new tab
- **Download** — programmatic `<a download>` click

### UI states

- Empty: dashed drop zone
- Uploading: spinner + status text (`Reading PDF…`, `Upload ready`)
- Populated: file card with actions
- Validation error: red border + message under field

### Error messages

- Profile validation from `validateUploadFile` (wrong type/size)
- `Failed to process brochure PDF. Please try again.`
- Form-level: `Batch brochure is required`

### Edit mode note

Existing brochure URL from API satisfies required check without re-upload. New file only appended to multipart when user selects a File.

---

## 11. Demo Video Feature

### Current implementation status

**Demo video is NOT exposed in the Batch Add/Edit UI.**

The form model (`createEmptyBatchForm`, `batchRowToForm`) includes:

- `demoVideoFile`, `demoVideoUrl`, `demoVideoFileName`, `demoVideoFileSize`

These fields are populated from API/storage when present but:

- No upload component in `BatchDetailsSection` or `AddCourseModal`
- `buildCreateBatchFormData` / `buildUpdateBatchFormData` do **not** append demo video to multipart
- Quick View does **not** display demo video

Demo video upload **does** exist on **Categories → Courses** (`CourseFormModal`), not on batches.

### Backend expectation

If API returns `demoVideoUrl` on batch documents, frontend will store it in `formData` but will not display or edit it in Batch Manager today.

### Documented for completeness (planned/data model only)

| Attribute | Value |
|-----------|-------|
| **Supported platforms** | Not defined for batches |
| **Validation** | N/A in batch UI |
| **Display** | N/A in batch UI |

---

## 12. Fees Structure

### How fees are displayed

**Edit/Add:** `BatchFeeDetailsSection` form fields.

**Quick View:** Read-only block when `hasFeeDetails()` true — currency, amounts, bullet lists.

**Batch Details page:** Fees **not** shown on summary card.

### Multiple fee options

Two payment **channels**, not selectable tiers:

1. **Online** — amount + bullet points
2. **Offline** — amount + bullet points

Optional **discount fee** (single number).

### Currency

INR (default), USD, EUR — affects Quick View money formatting (`₹`, `$`, `€`).

### Installments / Scholarship / Registration fee

**Not implemented** as separate batch form fields.

### API serialization (`feesJson`)

```json
{
  "currency": "INR",
  "onlineAmount": 0,
  "offlineAmount": 0,
  "discountAmount": 0,
  "onlineBulletPoints": ["..."],
  "offlineBulletPoints": ["..."]
}
```

### Display logic

Quick View fee section hidden entirely when all amounts empty and both bullet arrays empty.

---

## 13. Status System

### Batch statuses (UI)

Only **two** values exposed in forms and filters:

| Status | Meaning | Badge (list table) | API value |
|--------|---------|-------------------|-----------|
| **Active** | Batch is operational; students can be enrolled/transferred in | Green (`StatusBadge`) | `ACTIVE` |
| **Deactivated** | Batch disabled; transfer to inactive batch blocked | Amber "Deactivated" | `INACTIVE` |

### API → UI normalization (`normalizeBatchUiStatus`)

These API/legacy values map to **Deactivated**:

`INACTIVE`, `IN_ACTIVE`, `DISABLED`, `ARCHIVED`, `CANCELLED`, `COMPLETED`

All others → **Active**.

### Demo/seed data note

`INITIAL_BATCHES` seed includes `Upcoming`, `Completed` labels, but live UI collapses them to Active/Deactivated when enriched.

### Transitions

| From | To | Mechanism |
|------|-----|-----------|
| Active | Deactivated | Row action, bulk deactivate, form status select on save |
| Deactivated | Active | Row action, bulk activate, form status select |

**Restrictions:**

- Cannot move student to **Deactivated** target batch
- Transfer blocked if target at capacity (`canTransferToBatch`)

### Student enrollment statuses

| UI label | API | Active? |
|----------|-----|---------|
| Active | `ACTIVE` | Yes |
| Deactivated | `INACTIVE` / `IN_ACTIVE` | No |

Toggle: Active → `In Active` sent to API on disable; enable sends `Active` → `ACTIVE`.

### Payment statuses (enrollment)

`Paid`, `Pending`, `Partial`, `Overdue` (+ API `FAILED` maps to Failed badge style fallback)

---

## 14. Student Management

### Purpose

Manage **batch enrollments**: student identity, payment status, attendance %, course progress %, account status, and cross-batch transfers.

### Component

`BatchStudentPanel` — used on Batch Details (`variant="page"`) and supports `variant="embedded"` for expandable row patterns (not used on list page currently).

### How students are assigned

**Intended flow** (handlers in `BatchDetailsPage`):

1. Click **Add Student**
2. Fill name, email, phone, payment status, attendance, progress
3. `POST /batch-enrollments` with `batchId` (Mongo), `studentName`, `email`, `mobileNumber`, etc.

### How students are removed

`DELETE /batch-enrollments/:enrollmentId` — handler exists; **no delete button in student row UI** (see §16).

### Move / Transfer

`MoveStudentModal` → `POST /batch-enrollments/:id/move` with target batch, reason, date, transfer flags.

**Pre-checks (client):**

- Target ≠ current batch
- Target status Active
- Target has available seats (`capacity` default 50 minus current strength)
- User has move role
- Valid Mongo enrollment id

### Enrollment status

Enable/disable via `PATCH /batch-enrollments/status/:id`.

### Attendance / Payment / Progress

Editable in Add/Edit student form; displayed in table and view modal.

### Batch mapping

- Each enrollment tied to one `batchId` (Mongo)
- Move changes `toBatchId` on API
- Course/batch shown read-only in student form from parent batch context

### Integration note (important for backend team)

As of current code on `BatchDetailsPage`:

| Feature | Status |
|---------|--------|
| `useBatchEnrollments` hook | **`enabled: false`** — does not fetch real enrollments |
| Handlers (`handleAddStudent`, etc.) | Implemented in page but **not passed** to `BatchStudentPanel` |
| Student table data | Falls back to **`DEMO_BATCH_STUDENTS`** static data when no real students |
| `onMoveStudent` | Passed as **no-op** when user **can** move; `undefined` when user **cannot** move (inverted wiring) |

Backend should still implement enrollment APIs per §25; frontend wiring on details page is incomplete.

---

## 15. Student Management Table

| Column | Purpose | Data | Formatting | Example |
|--------|---------|------|------------|---------|
| **Student ID** | Enrollment display id | `enrollmentId` | Mono blue | `ENR-2025-1001` |
| **Student Name** | Full name | `name` | Avatar initials + semibold | `Priya Sharma` |
| **Phone Number** | Contact | `phone` / `mobileNumber` | Plain text | `9876543210` |
| **Email** | Contact | `email` | Plain text | `priya@email.com` |
| **Enrollment Date** | When enrolled | `enrolledAt` | Date string or `—` | `2025-06-15` |
| **Fee Status** | Payment state | `paymentStatus` | `PaymentStatusBadge` | `Paid` |
| **Attendance %** | Attendance rate | Number 0–100 | Bold centered `%` | `92%` |
| **Progress** | Course completion | Number 0–100 | `ProgressBar` | Bar at 80% |
| **Status** | Account status | `Active` / `Deactivated` | `StudentEnrollmentStatusBadge` | `Active` |
| **Actions** | Row operations | — | Button group (§16) | View, Edit, … |

### Pagination

- **Server mode:** `page`, `pageSize` (default 10), `totalItems` from API meta
- **Client/demo mode:** `usePagination` on filtered list (page size 10 on details page)

### Row styling

Inactive students: reduced opacity, gray background. Hover: blue left accent.

---

## 16. Student Actions

| Action | UI | API | Notes |
|--------|-----|-----|-------|
| **View** | Eye button | Optional `POST /batch-enrollments/detail` | `StudentViewModal` sections: Profile, Enrollment, Batch, Payments, Attendance, Progress, Status |
| **Edit** | Pencil | `PUT /batch-enrollments/:id` | May prefetch via `getEnrollmentById` |
| **Disable** | Ban button + confirm dialog | `PATCH .../status` → INACTIVE | Only when Active |
| **Enable** | UserCheck button | `PATCH .../status` → ACTIVE | Only when inactive |
| **Move** | Move button | `POST .../move` | Requires `onMoveStudent` + permission |
| **Delete** | Not in action bar | `DELETE .../:id` | Dialog exists, never opened |
| **Attendance** | View modal only | Part of enrollment GET/PUT | Not separate screen |
| **Payment** | Form + badges | `paymentStatus` on create/update | |
| **History / Timeline** | Not implemented | — | |
| **Communication / Remarks** | Move modal only (`remarks` / notify flag) | Passed as `remarks` on move | Notify stored as text suffix in remarks |

---

## 17. Modals

| Modal | Purpose | Key fields | Buttons | Close |
|-------|---------|------------|---------|-------|
| **AddCourseModal** | Add/Edit/Duplicate batch | §7 | Reset, Create/Update | X, backdrop, successful save |
| **ViewBatchModal** | Quick View batch | Read-only §9 | Close | X, Close footer |
| **StudentFormModal** | Add/Edit student | name, email, phone, course*, batch*, payment, attendance, progress | Cancel, Add/Save | X, Cancel |
| **StudentViewModal** | View enrollment | Read-only student sections | Close | X, Close |
| **MoveStudentModal** | Transfer student | target batch, reason, date, transfer options | Cancel, Transfer Student | X, Cancel |
| **BatchConfirmDialog** | Disable student confirm | Message only | Cancel, Disable | Backdrop |
| **BatchConfirmDialog** | Delete student (unused) | Deactivate copy | Cancel, Deactivate | — |
| **BatchBulkConfirmDialog** | Bulk activate/deactivate batches | Message only | Cancel, Confirm | Escape blocked while loading |
| **ChangeBatchStatusModal** | — | **Component exists, not used in pages** | — | — |

\*Course and Batch fields read-only in student form.

### Keyboard shortcuts

No custom shortcuts documented in code. Standard Escape closes modals via `Modal` / `BatchFormModalShell` where implemented.

### Validation

See §20 per modal.

---

## 18. Drawers

**No drawers** are used in the Batch module.

All overlays are **modals** (centered or full-screen). `BatchStudentPanel` `variant="embedded"` uses animated expand/collapse, not a side drawer.

`BatchAuditHistoryPanel` exists as a component but is **not mounted** on any batch page.

---

## 19. Bulk Operations

### Batch list

| Feature | Supported | UI |
|---------|-----------|-----|
| **Bulk select** | Yes | Per-row checkbox + select page |
| **Select all (page)** | Yes | Header checkbox via `PaginatedFigmaTable` selection |
| **Bulk activate** | Yes | Bulk bar → confirm → sequential PATCH |
| **Bulk deactivate** | Yes | Same |
| **Bulk delete** | Code only | No button in bulk bar |
| **Export** | No | — |
| **Import** | No | — |
| **Move students** | No | Per-student only |

### Student table

No multi-select bulk operations.

---

## 20. Validations

### Batch form (`AddCourseModal.validateBatch`)

| Field | Rule | Error message |
|-------|------|---------------|
| batchName | Required, unique | `Batch name is required` / `This Batch Name already exists.` |
| batchCode | Required, unique | `Batch code is required` / `This Batch Code already exists.` |
| mentor | mentorId or mentorEmail | `Mentor is required` |
| course | academicCourseId or courseId | `Please select a course` |
| commencement | Required | `Date of commencement is required` |
| durationLabel | Required | `Duration is required` |
| batchStartFrom | Required | `Batch start date is required` |
| batchEndTo | Required, ≥ start | `Batch end date is required` / `End date cannot be before start date` |
| status | Required | `Status is required` |
| banner | preview or fileName or file | `Banner image is required` |
| brochure | url or fileName or file | `Batch brochure is required` |
| linkedSubjects | length ≥ 1 | `Please select at least one subject` |
| onlinePaymentAmount | Required | `Online payment amount is required` |
| offlinePaymentAmount | Required | `Offline payment amount is required` |
| onlinePaymentBullets | ≥ 1 line | `Online payment bullet points are required` |
| offlinePaymentBullets | ≥ 1 line | `Offline payment bullet points are required` |
| batchId | Unique (create only) | `This Batch ID already exists.` |

### Banner upload (`IMAGE_BANNER`)

- Types: JPG, PNG, WEBP
- Max 5 MB
- Min dimensions 800×200 recommended 1920×600

### Brochure upload (`PDF_STANDARD`)

- PDF only, max 10 MB

### Student form (`StudentFormModal`)

| Field | Rule |
|-------|------|
| name | HTML `required` |
| email | `type="email"` + `required` |
| phone | `required` |
| attendance | `min=0` `max=100` |
| progress | `min=0` `max=100` |

No custom JS validation messages beyond browser defaults.

### Move student (`MoveStudentModal`)

| Field | Rule | Error |
|-------|------|-------|
| target batch | Required, active, not same, has seats | Various `errors.batch` |
| transferReason | Required, max 500 chars | `Transfer reason is required` |
| transferDate | Required, ≤ today | `Transfer date is required` |

---

## 21. UI Logic

### Conditional rendering

| Condition | Behavior |
|-----------|----------|
| `selectedIds.length > 0` | Show bulk actions bar |
| `tableBatches.length === 0` && no filters | Empty state with Add CTA |
| `tableBatches.length === 0` && filters | Table empty message: "No batches match your filters." |
| `mergedIntoName` | Subtitle under batch name in table |
| `hasFeeDetails` | Show fee block in Quick View |
| `brochureUrl` | Show brochure section |
| `useDemoData` in student panel | Demo students; add/edit no-ops close modal |
| `isStudentEnrollmentActive` | Show Disable vs Enable action |
| `onMoveStudent` falsy | Hide Move button |
| `detailLoading \|\| listLoading` && !batch | Skeleton or redirect |

### Permission-based rendering

- Student move: `isSuperAdmin || hasRole(OPERATION_ADMIN, CENTER_ADMIN)`

### Dynamic dropdowns

- Mentors: loaded from API; fallback option if edit row mentor not in list
- Courses: `CourseCatalogSelect` from academics courses API
- Faculty subjects: API dropdown with local fallback
- Move target batches: `getBatchesDropdown({ activeOnly: true })` merged with prop list

### Button disabled states

- Row actions disabled while `statusUpdatingIds` contains row id
- Bulk confirm buttons disabled while `bulkActionLoading`
- Form submit disabled while saving/uploading/loading detail
- Bulk Activate/Deactivate disabled when respective count is 0

### Loading states

- Batch table: skeleton rows (`skeletonRowCount=8`)
- Batch details: `BatchDetailsSkeleton`
- Quick view: overlay spinner on modal body
- Student table: `StudentTableSkeleton`
- Student view: loading body in modal

### Empty / Error / Retry

- List API error: toast + empty table
- Details not found: redirect to list
- Student API 404/502/503: empty list (no error toast in hook)
- Enrollment errors: toast from page handlers

---

## 22. Complete User Flow

### Flow A — Create batch with media and subjects

1. User opens `/academics/batch`
2. Clicks **Add Batch**
3. Fills Batch Details including banner + brochure
4. Fills Fee Details (amounts + bullets)
5. Adds ≥1 faculty subject
6. Clicks **Create**
7. `POST /batches` multipart
8. List refreshes; toast "Batch Created Successfully"
9. Local audit log entry (client storage)

### Flow B — Search and filter

1. User types in search → 300ms debounce
2. `GET /batches` with search params + client filter
3. User selects status **Deactivated**
4. Page resets to 1; table updates

### Flow C — Quick View

1. User clicks **View** on row
2. Modal opens with list row data
3. `GET /batches/:id/quick-view` enriches content
4. User views fees/brochure; closes modal

### Flow D — Batch details

1. User clicks Batch ID or name
2. Navigates to `/academics/batch/:batchId` with optional `listState` + `batchRow`
3. `GET /batches/:id` loads detail
4. Info card renders; student panel shows (demo data until enrollments wired)

### Flow E — Edit batch

1. From list or details, **Edit**
2. Modal loads detail fetch
3. User changes fields (not batch code)
4. **Update** → `PUT /batches/:id`

### Flow F — Duplicate

1. User clicks **Duplicate** on row
2. Modal opens with copied fields; name `(Copy)`, empty code
3. User sets unique code/name → **Create Duplicate**
4. `POST /batches/:sourceId/duplicate`

### Flow G — Status toggle

1. User clicks Activate/Deactivate on row
2. Optimistic status in UI
3. `PATCH /batches/status/:id`
4. On failure, revert + error toast

### Flow H — Bulk deactivate

1. User selects multiple Active batches
2. **Deactivate All** → confirm
3. Sequential PATCH per target
4. Clear selection; reload list

### Flow I — Student enroll (when wired)

1. On details page, **Add Student**
2. Submit form → `POST /batch-enrollments`
3. Table refetch; batch `totalStudents` refresh

### Flow J — Move student (when wired)

1. Click **Move** on student row
2. Select destination batch, reason, date, options
3. `POST /batch-enrollments/:id/move`
4. Audit log on source + destination batches
5. Refetch students and batch list

---

## 23. Component Hierarchy

```
BatchManagementLayout (BatchManagementProvider)
├── Route: index → BatchesPage
│   ├── PageBanner
│   ├── CourseFilterToolbar
│   ├── CurrentAffairsBulkActionsBar
│   ├── BatchManagementTable
│   │   └── BatchTableActions (per row)
│   ├── AddCourseModal
│   │   ├── BatchDetailsSection
│   │   │   ├── BatchMentorSelect
│   │   │   ├── CourseCatalogSelect
│   │   │   ├── BannerImageUpload
│   │   │   └── BrochurePdfUpload
│   │   ├── BatchFeeDetailsSection
│   │   └── BatchSubjectDetailsSection
│   ├── ViewBatchModal
│   └── BatchBulkConfirmDialog
│
└── Route: :batchId → BatchDetailsPage
    ├── CategoryBreadcrumb
    ├── PageBanner
    ├── BatchDetailsInfoCard
    │   └── BatchStatusBadge
    ├── BatchStudentPanel
    │   ├── StudentTableActions (per row)
    │   ├── StudentFormModal
    │   ├── StudentViewModal
    │   ├── MoveStudentModal
    │   └── BatchConfirmDialog
    └── AddCourseModal (edit)
```

**Supporting (not in page tree):** `useBatchesData`, `useBatchEnrollments`, `useBatchAudit`, `batchesAPI`, `batchEnrollmentService`, `batchHelpers`, `batchApiHelpers`.

---

## 24. State Management

No Redux. React local state + context.

### BatchesPage state

| State | Description |
|-------|-------------|
| `search`, `statusFilter` | Filter values |
| `tablePage`, `tablePageSize` | Pagination (default page 1, size 10) |
| `optimisticStatus` | Map rowId → status during PATCH |
| `statusUpdatingIds` | Set of rows updating |
| `selectedIds` | Bulk selection (`useTableRowSelection`) |
| `modal` | Add/Edit/Duplicate (`useEditModal`) |
| `viewItem`, `viewLoading` | Quick View |
| `bulkConfirm`, `bulkActionLoading` | Bulk dialog |
| `deleteTarget`, `deleteLoading` | Delete handler (unused UI) |

### BatchDetailsPage state

| State | Description |
|-------|-------------|
| `apiRow` | Enriched batch detail |
| `detailLoading`, `detailError` | Fetch state |
| Student ops flags | `addingStudent`, `editingStudent`, etc. |
| `viewStudent`, `viewOpen`, `viewLoading` | Student view modal |
| `useBatchEnrollments` | search, page, pageSize, students, meta (disabled) |

### BatchManagementContext

| API | Purpose |
|-----|---------|
| `getStudents`, `getStudentCount` | Legacy local student store (`useBatchStudents`) |
| `addStudent`, `updateStudent`, etc. | Local-only mutations |

Used for student **count fallback** on list when API count missing.

### Persisted / restored state

- `listState` passed via router `location.state` when navigating list ↔ details (search, status, page, pageSize)
- Batch audit: `batchAuditStorage` (localStorage, client-only)

---

## 25. Expected Backend APIs

> Documentation only — describes what the frontend calls or expects. Base path: `/api` (via `axiosInstance`).

### Authentication

All requests expect `Authorization: Bearer <JWT>` unless `isFrontendOnly` mode.

---

### `GET /batches`

| | |
|--|--|
| **Purpose** | Paginated batch list |
| **Query** | `page`, `limit`, `search`, `batchId`, `batchName`, `courseName`, `mentorName` (search mirrors), `status` (`ACTIVE`/`INACTIVE`), optional `courseId` |
| **Response** | `{ data: Batch[], total, page, limit, totalPages }` (flexible unwrapping) |
| **Mapped fields** | See `mapBatchFromApi` |

---

### `POST /batches`

| | |
|--|--|
| **Purpose** | Create batch |
| **Content-Type** | `multipart/form-data` |
| **Fields** | `batchName`, `batchCode`, `mentorId`, `courseId`, `durationInMonths`, `facultySubjects` (JSON string array of IDs), `feesJson` (JSON string), `status`, `commencementDate`, `batchStartDate`, `batchEndDate`, `bannerImage` (file), `brochure` (file) |
| **Response** | Batch document with Mongo `_id` + human `batchId`/`batchCode` |
| **Validation** | 4xx with message body for form errors |

---

### `GET /batches/:batchId`

| | |
|--|--|
| **Purpose** | Full batch detail |
| **Param** | Mongo `_id` or human batch id/code |
| **Response** | Batch document + nested course, mentor, fees, facultySubjects, optional embedded students |

---

### `GET /batches/:batchId/quick-view`

| | |
|--|--|
| **Purpose** | Lighter payload for Quick View modal |
| **Fallback** | Frontend falls back to full GET on 404/500 |

---

### `PUT /batches/:batchId`

| | |
|--|--|
| **Purpose** | Update batch |
| **Content-Type** | `multipart/form-data` (same fields as create; files optional if unchanged) |
| **Note** | `batchCode` not editable in UI but may be sent on create/duplicate only |

---

### `PATCH /batches/status/:batchId`

| | |
|--|--|
| **Purpose** | Status toggle |
| **Body** | `{ "status": "ACTIVE" \| "INACTIVE" }` |
| **Response** | Updated batch document |

---

### `DELETE /batches/:batchId`

| | |
|--|--|
| **Purpose** | Delete batch |
| **Note** | Implemented in API layer; **no list UI trigger** currently |

---

### `POST /batches/:batchId/duplicate`

| | |
|--|--|
| **Purpose** | Clone batch |
| **Body** | Same multipart as create |
| **Optional** | `includeStudents` (`true`/`false`) — not exposed in UI |

---

### `GET /batches/dropdown`

| | |
|--|--|
| **Purpose** | Batch options for move modal |
| **Query** | `facultySubjectId?`, `activeOnly=true` |
| **Response** | `{ data: Batch[] }` |

---

### `POST /batches/dropdown`

| | |
|--|--|
| **Purpose** | Batches for faculty subject + center scope |
| **Body** | `{ facultySubjectId, centerId }` |

---

### `GET /admin/admin-access/mentors/dropdown`

| | |
|--|--|
| **Purpose** | Mentor picker |
| **Response** | Array of mentor employees |

---

### Faculty subjects dropdown

Used by subject section — `getFacultySubjectsDropdown` (see faculty subjects API module).

---

### `POST /batch-enrollments/by-batch`

| | |
|--|--|
| **Purpose** | List enrollments for a batch |
| **Body** | `{ batchId, page, limit, search?, paymentStatus?, status? }` |
| **Response** | `{ data: Enrollment[], total, page, pages, limit }` |
| **Requires** | `batchId` = valid Mongo ObjectId |

---

### `POST /batch-enrollments/detail`

| | |
|--|--|
| **Purpose** | Single enrollment for edit/view |
| **Body** | `{ id, enrollmentId }` |

---

### `POST /batch-enrollments`

| | |
|--|--|
| **Purpose** | Create enrollment |
| **Body** | `{ studentName, email, mobileNumber, batchId, paymentStatus, attendancePercentage, courseProgressPercentage }` |
| **Payment status API** | `PAID`, `PENDING`, `PARTIAL`, `OVERDUE`, `FAILED` |

---

### `PUT /batch-enrollments/:enrollmentId`

| | |
|--|--|
| **Purpose** | Update enrollment |
| **Body** | `studentName?`, `email?`, `mobileNumber?`, `paymentStatus`, `attendancePercentage`, `courseProgressPercentage` |

---

### `PATCH /batch-enrollments/status/:enrollmentId`

| | |
|--|--|
| **Purpose** | Enable/disable student |
| **Body** | `{ "status": "ACTIVE" \| "INACTIVE" }` |

---

### `POST /batch-enrollments/:enrollmentId/move`

| | |
|--|--|
| **Purpose** | Transfer to another batch |
| **Body** | `{ toBatchId, transferReason, effectiveTransferDate, transferAttendanceRecords, transferFeeRecords, transferTestRecords, paymentStatus?, attendancePercentage?, courseProgressPercentage? }` |
| **Note** | UI always sends `transferTests: true` from page handler |

---

### `DELETE /batch-enrollments/:enrollmentId`

| | |
|--|--|
| **Purpose** | Delete enrollment |
| **Note** | Handler exists; UI button not exposed |

---

## 26. Frontend Data Flow

### Batch create/update

```
User fills AddCourseModal
  → client validateBatch()
  → onSubmit(form, { isEdit, id, isDuplicate })
  → BatchesPage.handleSaveBatch
  → buildCreateBatchFormData / buildUpdateBatchFormData
  → POST or PUT /batches (multipart)
  → mapBatchFromApi
  → loadBatches() refresh
  → toast success
  → modal close
```

### Batch list load

```
useBatchesData({ page, limit, search, status })
  → fetchBatches (GET)
  → enrichBatchRow per row
  → optional client matchesBatchSearch filter
  → mapBatchRowToTableFormat for table
  → PaginatedFigmaTable render
```

### Quick View

```
handleQuickView(batch)
  → setViewItem(row)
  → fetchBatchQuickView(batchId)
  → merge into viewItem
  → ViewBatchModal render
```

### Enrollment create (intended)

```
StudentFormModal submit
  → handleAddStudent
  → createEnrollment({ studentName, email, mobileNumber, batchId, ... })
  → refetchStudentsAfterMutation
  → refetchBatchDetails (totalStudents)
  → toast
```

### Status toggle (optimistic)

```
handleStatusChange
  → setOptimisticStatus
  → patchBatchStatus(mongoId, nextStatus)
  → loadBatches
  → clear optimistic / revert on error
  → toast
```

---

## 27. Edge Cases

| Scenario | Frontend behavior |
|----------|-------------------|
| **No brochure** | Create blocked by validation; Quick View hides brochure section |
| **No students** | Demo data shown in panel when not loading and real list empty |
| **Empty batch table** | Empty state CTA or filtered message |
| **Invalid batch route id** | Redirect to list after load failure |
| **API 404 on detail** | Use cached list/nav row if available |
| **Duplicate batch name/code** | Client-side taken check before submit |
| **Inactive faculty subject** | Excluded from add dropdown |
| **Deleted faculty on linked subject** | Enrichment falls back to stored names on chips |
| **Broken video URL** | N/A — not displayed for batches |
| **Upload failure** | Inline validation message; brochure blocks submit while uploading |
| **Permission denied** | Standard 401/403 via axios; toast message |
| **429 / 500 on list** | User-facing toast with specific copy |
| **Move to same batch** | Toast `Cannot move to the same batch` |
| **Move to full batch** | Toast `Target batch has no available seats` |
| **Move to inactive batch** | Toast `Cannot move student to an inactive batch` |
| **Frontend-only mode** | Batch/enrollment APIs throw or return empty; no backend calls |
| **Non-Mongo batch route** | `resolveBatchMongoId` resolves from list before API calls |
| **Canceled requests** | Aborted fetches ignored (no error toast) |
| **Enrollment API soft fail** | 404/502/503 on list → empty students array |

---

## 28. Complete Field Reference

| Field Name | Location | Type | Required | Description | Validation | Example | Dependencies |
|------------|----------|------|----------|-------------|------------|---------|--------------|
| batchName | Batch form | string | Yes | Display name | Unique, non-empty | `UPSC Batch 1` | — |
| batchCode | Batch form | string | Yes | Unique human code | Unique; immutable on edit | `UPSC-B01` | — |
| batchId | API/storage | string | Auto | Human batch id | Unique on create | `BAT019` | Generated by backend |
| mentorId | Batch form | string | Yes | Mentor Mongo id | With mentor | Mongo id | Mentors API |
| mentorEmail | Batch form | string | Yes* | Mentor email | *Alternative to id | `m@institute.com` | Mentor select |
| mentorName | Batch form/API | string | No | Display | — | `Arjun Mehta` | From mentor |
| academicCourseId | Batch form | string | Yes | Course Mongo id | — | Mongo id | Course catalog |
| courseId | Batch form/API | string | Yes | Course code | — | `CRS001` | Course select |
| courseName | Batch form | string | No | Display | — | `UPSC GS` | From course |
| commencement | Batch form | date | Yes | Commencement date | — | `2026-01-15` | — |
| durationLabel | Batch form | string | Yes | Human duration | Parsed to months | `6 Months` | — |
| batchStartFrom | Batch form | date | Yes | Start date | ≤ end | `2026-02-01` | — |
| batchEndTo | Batch form | date | Yes | End date | ≥ start | `2026-08-01` | — |
| status | Batch form | enum | Yes | Active/Deactivated | — | `Active` | — |
| bannerPreview | Batch form | string/url | Yes* | Preview URL | *or file/name | blob: or https | bannerFile |
| bannerFile | Batch form | File | No | New upload | IMAGE_BANNER | File | — |
| bannerFileName | Batch form | string | No | File name | — | `banner.webp` | — |
| brochureUrl | Batch form | string | Yes* | PDF URL/data | *or file/name | data: or https | brochureFile |
| brochureFile | Batch form | File | No | PDF upload | PDF_STANDARD | File | — |
| brochureFileName | Batch form | string | No | PDF name | — | `brochure.pdf` | — |
| brochureFileSize | Batch form | number | No | Bytes | — | `1048576` | — |
| demoVideoUrl | formData only | string | No | Not in batch UI | — | — | — |
| feeDetails.currency | Batch form | enum | Yes | INR/USD/EUR | Default INR | `INR` | — |
| feeDetails.discountFee | Batch form | number | No | Discount amount | ≥0 | `5000` | — |
| feeDetails.onlinePaymentAmount | Batch form | number | Yes | Online fee | Required | `45000` | — |
| feeDetails.offlinePaymentAmount | Batch form | number | Yes | Offline fee | Required | `40000` | — |
| feeDetails.onlinePaymentBullets | Batch form | string[] | Yes | Online terms | ≥1 | `["Fee incl. GST"]` | — |
| feeDetails.offlinePaymentBullets | Batch form | string[] | Yes | Offline terms | ≥1 | `["Pay at center"]` | — |
| linkedSubjects[] | Batch form | array | Yes | Faculty subjects | ≥1 entry | `{subjectId,...}` | Faculty subjects API |
| studentName / name | Student form | string | Yes | Full name | required | `Rahul Sharma` | — |
| email | Student form | email | Yes | Student email | email type | `r@mail.com` | — |
| phone / mobileNumber | Student form | string | Yes | Phone | required | `9876543210` | — |
| paymentStatus | Student form | enum | No | Default Pending | Paid/Pending/Partial/Overdue | `Pending` | — |
| attendance | Student form | number | No | 0–100 | min/max | `85` | — |
| progress | Student form | number | No | 0–100 | min/max | `60` | — |
| enrollmentId | Student table | string | Display | Human enrollment id | — | `ENR-2025-1001` | API |
| enrollmentApiId | Internal | Mongo id | Yes for mutations | Enrollment `_id` | Mongo ObjectId | `507f...` | API |
| transferReason | Move modal | string | Yes | Why moving | max 500 | `Schedule change` | — |
| transferDate | Move modal | date | Yes | Effective date | ≤ today | `2026-06-20` | — |
| transferAttendance | Move modal | boolean | No | Carry attendance | default true | `true` | — |
| transferFee | Move modal | boolean | No | Carry payments | default true | `true` | — |
| targetBatchId | Move modal | string | Yes | Destination | active, seats | Mongo/human id | Batches dropdown |
| capacity | Batch row | number | No | Max seats | default 50 | `50` | — |
| totalStudents | Batch row | number | No | Enrolled count | — | `32` | Enrollments API |
| mergedIntoName | Batch row | string | No | Merge target label | — | `BAT020` | — |

---

## 29. Notes for Backend Team

### How the frontend expects data

1. **Two identifiers per batch:** Mongo `_id` (for mutations) and human `batchId` / `batchCode` (for routes and display). Route URLs prefer human id: `/academics/batch/BAT019`.
2. **Status binary in UI:** Map all non-active API statuses to `INACTIVE` for filtering; display as **Deactivated**.
3. **Nested shapes:** `mapBatchFromApi` accepts `linkedCourse`/`course`, `mentor` object, `fees`/`feesJson`, `facultySubjects` array, `bannerImage`/`brochure` as URL objects or strings.
4. **Dates:** ISO `YYYY-MM-DD` preferred for commencement, batch start/end.
5. **Duration:** Backend may store `durationInMonths`; UI also uses free-text `durationLabel` for display.
6. **Fees:** Send/receive consistent `feesJson` structure (§12). Support both `onlineAmount` and `onlinePaymentAmount` aliases when reading.
7. **Enrollments:** List endpoint uses **POST** body (not GET). `batchId` must be Mongo ObjectId — human batch codes will not load students until resolved.
8. **Enrollment identity:** Distinguish enrollment Mongo `_id` from display `enrollmentId` / `enrollmentNumber`. Frontend uses Mongo id for PUT/PATCH/DELETE/move.
9. **Payment status:** Use enum `PAID`, `PENDING`, `PARTIAL`, `OVERDUE` (and optionally `FAILED`).
10. **Student account status:** `ACTIVE` / `INACTIVE` for enable-disable.

### Required dropdowns / relationships

| Dropdown | Backend source |
|----------|----------------|
| Courses | Academic courses catalog (Mongo `courseId` + human code) |
| Mentors | `/admin/admin-access/mentors/dropdown` |
| Faculty subjects | Faculty-subjects dropdown (linked to academics subjects + faculty) |
| Target batches (move) | `/batches/dropdown?activeOnly=true` |

**Relationships:**

- Batch **N:1** Course (`courseId` / `academicCourseId`)
- Batch **N:1** Mentor (`mentorId`)
- Batch **N:M** Faculty subjects (`facultySubjects[]`)
- Batch **1:N** Enrollments (`batch-enrollments`)

### Pagination expectations

| Endpoint | Defaults |
|----------|----------|
| `GET /batches` | `page=1`, `limit=10` on list page; details prefetch uses `limit=500` |
| `POST /batch-enrollments/by-batch` | `page=1`, `limit=10` |

Return `total`, `page`, `limit`, `pages`/`totalPages` for student list meta.

### Search expectations

- Batch: single string matched against id, name, course name, mentor name (server-side); client may double-filter.
- Enrollments: `search` string in POST body (implementation-specific fields — align with name/email/phone/enrollment id).

### Filtering expectations

- Batch list: `status=ACTIVE|INACTIVE` only.
- Enrollment list (supported in service, not in current student UI): `paymentStatus`, `status` (account).

### Upload expectations

- **Multipart** create/update with optional file fields `bannerImage`, `brochure`.
- Return stable **HTTPS URLs** after upload for subsequent edits without re-upload.
- Max sizes: banner 5 MB; brochure 10 MB.
- Accept banner re-submit from blob preview (frontend may re-package blob as File on update).

### Student mapping expectations

- After create/update/move/delete, frontend refetches enrollment list and batch detail (`totalStudents`).
- Move payload includes `transferReason`, `effectiveTransferDate`, boolean flags for attendance/fee/test records.
- `performedBy` logged in **client audit only** — not sent in move API body from page handler (service supports extended fields via payload spread).

### Known frontend integration gaps (coordinate with frontend team)

1. **Batch Details page** does not pass enrollment handlers to `BatchStudentPanel`; enrollments hook disabled — **demo data shown**.
2. **Batch delete** API wired but **no delete button** in table or bulk bar.
3. **Student delete** dialog exists but **no UI action**.
4. **Demo video** fields in model but **not in batch form** or API payload builder.
5. **Move student** callback on details page is **inverted** (`onMoveStudent` no-op when user has permission).

Backend should implement APIs per this document regardless; frontend wiring may catch up in a separate effort.

### Error response format

Frontend uses `getApiErrorMessage(error, fallback)` — expects JSON error bodies with `message` or similar standard axios error shape. Return clear 400/409 messages for duplicate batch code/name and validation failures.

### Id and routing checklist

- [ ] Every batch list item includes Mongo `_id` and human `batchId` or `batchCode`
- [ ] `GET /batches/:id` accepts both id types
- [ ] Enrollment APIs use Mongo ids only
- [ ] Quick-view endpoint returns fees, subjects, media URLs, mentor, course names
- [ ] List meta includes accurate `total` for pagination
- [ ] `totalStudents` on batch document stays in sync with enrollment count

---

*End of Batch Module Frontend Documentation*
