# Payment Verification Center — Frontend Integration Guide (Step-by-Step)

Use this document as the **single source of truth** for integrating the **Payment Verification Center** and **Add Offline Payment** screens in the admin panel.

**Base path:** `/api/finance/payment-verification`  
**Auth:** Bearer token  
**Postman:** Import `OFFLINE_PAYMENT_POSTMAN_COLLECTION.json` from the repo root.

**Related guides:**
- EMI installment pay / close / customize → `EMI_MANAGEMENT_API_GUIDE.md` (`/api/finance/emi-management`)
- Receipts after approval → `RECEIPT_MANAGEMENT_FRONTEND_API_GUIDE.md`
- Deep API reference (all payloads) → `PAYMENT_VERIFICATION_CENTER_API_GUIDE.md`

---

## Table of contents

1. [Module overview](#1-module-overview)
2. [Authentication & roles](#2-authentication--roles)
3. [Standard response format](#3-standard-response-format)
4. [API summary](#4-api-summary)
5. [Page layout → API mapping](#5-page-layout--api-mapping)
6. [Step 1 — Payment Verification Center page load](#6-step-1--payment-verification-center-page-load)
7. [Step 2 — Filter & search changes](#7-step-2--filter--search-changes)
8. [Step 3 — CSV export](#8-step-3--csv-export)
9. [Step 4 — Verification table & row actions](#9-step-4--verification-table--row-actions)
10. [Step 5 — Payment verification details modal (eye icon)](#10-step-5--payment-verification-details-modal-eye-icon)
11. [Step 6 — Verify payment confirmation (tick icon)](#11-step-6--verify-payment-confirmation-tick-icon)
12. [Step 7 — Reject payment modal (X icon)](#12-step-7--reject-payment-modal-x-icon)
13. [Step 8 — Add Offline Payment modal open](#13-step-8--add-offline-payment-modal-open)
14. [Step 9 — Registered student search](#14-step-9--registered-student-search)
15. [Step 10 — Walk-in student mode](#15-step-10--walk-in-student-mode)
16. [Step 11 — Center → Course → Batch cascade](#16-step-11--center--course--batch-cascade)
17. [Step 12 — Full Payment tab submit](#17-step-12--full-payment-tab-submit)
18. [Step 13 — EMI Payment tab — plan selection](#18-step-13--emi-payment-tab--plan-selection)
19. [Step 14 — EMI Payment tab — custom schedule edit](#19-step-14--emi-payment-tab--custom-schedule-edit)
20. [Step 15 — EMI Payment tab submit](#20-step-15--emi-payment-tab-submit)
21. [Step 16 — After approval (downstream)](#21-step-16--after-approval-downstream)
22. [Status badges & action visibility](#22-status-badges--action-visibility)
23. [TypeScript interfaces & service layer](#23-typescript-interfaces--service-layer)
24. [Error handling](#24-error-handling)
25. [Testing checklist](#25-testing-checklist)

---

## 1. Module overview

Two UI areas share the same API base:

| UI screen | Purpose |
|-----------|---------|
| **Payment Verification Center** | List, filter, view, verify (approve), reject, export CSV |
| **Add Offline Payment** | Admin creates offline full payment or EMI plan for registered or walk-in student |

```mermaid
flowchart TB
  subgraph AddOfflinePayment
    A1[Search student OR walk-in form] --> A2[Center / Course / Batch]
    A2 --> A3{Tab}
    A3 -->|Full Payment| A4[POST submit-full-payment]
    A3 -->|EMI Payment| A5[POST calculate-emi → save-emi-plan]
  end
  subgraph VerificationCenter
    B1[POST records/filter-options] --> B2[POST records/list]
    B2 --> B3{Row action}
    B3 -->|Eye| B4[GET records/:id]
    B3 -->|Tick| B5[PUT records/:id/approve]
    B3 -->|X| B6[PUT records/:id/reject]
    B3 -->|CSV| B7[Client export from list]
  end
  Abackground A4 --> B2
  A5 --> B2
  B5 --> C[Enrollment ACTIVE + Payment Report + Receipt]
  B5 -->|EMI_PLAN type| D[EMI Management for installments]
```

**Important workflow rules:**

1. Submitting offline payment creates a **PaymentVerification** record in `PENDING_VERIFICATION`.
2. Enrollment stays **INACTIVE** until a verifier **approves** the record.
3. Opening a pending record via `GET /records/:id` auto-moves it to **UNDER_REVIEW**.
4. **Installment collection** (pay installment, close EMI) is **not** in this module — use **EMI Management** after EMI plan is approved.
5. `POST /submit-emi` returns **410 Gone** — always use `POST /save-emi-plan`.

---

## 2. Authentication & roles

```http
Authorization: Bearer <token>
Content-Type: application/json
```

For file uploads use `multipart/form-data` (proof images/PDF).

### Login

```http
POST /api/auth/login-super-admin
Content-Type: application/json

{
  "email": "admin@sriramias.com",
  "password": "your-password"
}
```

### Permissions

| Action | Any authenticated user | Super Admin / Finance Admin |
|--------|:---------------------:|:---------------------------:|
| Setup & lookup APIs | ✅ | ✅ |
| List / view verification records | ✅ | ✅ |
| Submit offline payment | ❌ | ✅ |
| Approve / reject / escalate | ❌ | ✅ |

Only **Finance Admin / Super Admin** should see **Add Offline Payment**, **tick (verify)**, and **X (reject)** buttons.

---

## 3. Standard response format

### Success

```json
{
  "success": true,
  "statusCode": 10000,
  "message": "Verification records fetched successfully",
  "data": { },
  "error": null
}
```

### Validation error (400)

```json
{
  "success": false,
  "statusCode": 11000,
  "message": "Validation failed",
  "data": null,
  "error": {
    "errors": [
      { "field": "comment", "message": "comment length must be at least 3 characters long" }
    ]
  }
}
```

---

## 4. API summary

### Setup & lookup (Add Offline Payment form)

| # | Method | Endpoint | When |
|---|--------|----------|------|
| 1 | POST | `/eligible-students` | Search registered student |
| 2 | POST | `/courses-by-center` | Course dropdown after center |
| 3 | POST | `/batches-by-course` | Batch dropdown after course |
| 4 | POST | `/batch-amounts` | Fee summary bar (Payable / Paid / Pending) |
| 5 | POST | `/payment-modes` | Payment mode dropdown |

### EMI helpers

| # | Method | Endpoint | When |
|---|--------|----------|------|
| 6 | POST | `/calculate-emi` | EMI plan cards (3/6/9/12/18/24/custom) |
| 7 | POST | `/validate-schedule` | User edits custom installment amounts |

### Submit (creates verification record)

| # | Method | Endpoint | Content-Type |
|---|--------|----------|--------------|
| 8 | POST | `/submit-full-payment` | `multipart/form-data` |
| 9 | POST | `/save-emi-plan` | `multipart/form-data` |

### Verification center

| # | Method | Endpoint | When |
|---|--------|----------|------|
| 10 | POST | `/records/filter-options` | Status & rejection-reason dropdowns |
| 11 | POST | `/records/list` | Main table + KPI counts |
| 12 | GET | `/records/:id` | Detail modal (Mongo `_id` or business ID e.g. `PAY-C1-1`) |
| 13 | PUT | `/records/:id/approve` | Tick / Verify & route |
| 14 | PUT | `/records/:id/reject` | X / Confirm rejection |
| 15 | PUT | `/records/:id/escalate` | Optional escalate to finance head |

### Shared dropdowns (Verification Center filters)

| UI filter | API (outside this module) |
|-----------|---------------------------|
| All centers | `GET /api/centers/dropdown` |
| All courses | `POST /courses-by-center` with selected `centerId` |
| All modes | `POST /payment-modes` |

---

## 5. Page layout → API mapping

### Payment Verification Center (list page)

| UI element | API / field |
|------------|-------------|
| Search bar | `POST /records/list` → body `search` |
| Date range (dd-mm-yyyy) | `dateFrom`, `dateTo` on list body |
| All verification dropdown | `verificationStatus` — options from `/records/filter-options` |
| All approval dropdown | `financeHeadStatus` or `approvalStatus` |
| All modes dropdown | `paymentModeId` — options from `/payment-modes` |
| All centers dropdown | `centerId` — options from `/api/centers/dropdown` |
| All courses dropdown | `courseId` — options from `/courses-by-center` |
| "8 verification records" header | `data.totalCount` from list |
| CSV button | Client-side export (§8) |
| + Add Offline Payment | Opens modal — §13+ |

### Verification table columns

| Column | API field | Notes |
|--------|-----------|-------|
| Payment ID | `verificationId` | e.g. `PAY-C0-3`, `VER-UR-001` |
| Student Name | `studentName` + `studentCode` | Show name on line 1, code below |
| Payment Mode | `paymentModeName` | UPI, Net Banking, Cheque, Online Gateway |
| Verification Status | `verificationStatusLabel` | Colored pill — see §22 |
| Duplicate | `duplicateLabel` or `isDuplicate` | Show "Possible Duplicate" badge when true |
| Uploaded Proof | `paymentProofUrl` | Document icon → open URL in new tab |
| Verified By | `verifiedByName` | Show `—` when empty; after approval shows verifier name |
| Finance Head Status | Compose in UI — see §9 | Uses `financeHeadStatusLabel`, timestamps, rejection info |
| Amount | `amount` | Format as `₹70,000` |
| Updated On | `updatedAt` | Format e.g. `11:46 pm, 28 Jun 2026` |
| Actions | See §9 | Eye, Tick, X, duplicate warning |

### Add Offline Payment modal

| UI element | API |
|------------|-----|
| Full Payment / EMI Payment tabs | Switches submit endpoint |
| Search registered student | `POST /eligible-students` |
| + Walk-in student | Sets `studentType: WALK_IN`, clears `studentId` |
| Student name, mobile, email | Form fields |
| Center / Course / Batch | Cascade APIs §16 |
| Payable / Paid / Pending bar | `POST /batch-amounts` |
| Full payment fields | §17 |
| EMI plan cards + schedule | §18–20 |

---

## 6. Step 1 — Payment Verification Center page load

**Trigger:** User navigates to Finance → Payment Verification Center.

**Parallel API calls on mount:**

```typescript
await Promise.all([
  api.post('/api/finance/payment-verification/records/filter-options', {}),
  api.post('/api/finance/payment-verification/payment-modes', {}),
  api.get('/api/centers/dropdown'),
  api.post('/api/finance/payment-verification/records/list', defaultListBody)
]);
```

### 6.1 Filter options

```http
POST /api/finance/payment-verification/records/filter-options
Authorization: Bearer <token>
Content-Type: application/json

{}
```

**Response:**

```json
{
  "success": true,
  "statusCode": 10000,
  "message": "Verification filter options fetched successfully",
  "data": {
    "verificationStatuses": [
      { "value": "PENDING_VERIFICATION", "label": "Pending Verification" },
      { "value": "UNDER_REVIEW", "label": "Under Review" },
      { "value": "VERIFIED", "label": "Verified" },
      { "value": "REJECTED", "label": "Rejected" },
      { "value": "ESCALATED", "label": "Escalated" },
      { "value": "AUTO_VERIFIED", "label": "Auto Verified" }
    ],
    "financeHeadStatuses": [
      { "value": "PENDING", "label": "Pending" },
      { "value": "APPROVED", "label": "Approved" },
      { "value": "REJECTED", "label": "Rejected" },
      { "value": "REVIEWING", "label": "Finance Head Review" }
    ],
    "rejectionReasons": [
      { "value": "FAKE_SCREENSHOT", "label": "Fake Screenshot" },
      { "value": "UTR_NOT_FOUND", "label": "UTR Not Found" },
      { "value": "AMOUNT_MISMATCH", "label": "Amount Mismatch" },
      { "value": "CHEQUE_BOUNCED", "label": "Cheque Bounced" },
      { "value": "DUPLICATE_PAYMENT", "label": "Duplicate Payment" },
      { "value": "INVALID_PROOF", "label": "Invalid Proof" },
      { "value": "OTHER", "label": "Other" }
    ]
  },
  "error": null
}
```

Bind:
- **All verification** → `verificationStatuses` (+ prepend `{ value: "ALL", label: "All verification" }`)
- **All approval** → `financeHeadStatuses` (+ prepend All)
- **Reject modal reason dropdown** → `rejectionReasons`

### 6.2 Payment modes (filter + offline form)

```http
POST /api/finance/payment-verification/payment-modes
Content-Type: application/json

{}
```

**Response:**

```json
{
  "success": true,
  "statusCode": 10000,
  "message": "Payment modes fetched successfully",
  "data": {
    "count": 4,
    "items": [
      { "paymentModeId": "PM004", "paymentModeName": "UPI", "category": "DIGITAL", "icon": "upi" },
      { "paymentModeId": "PM002", "paymentModeName": "Net Banking", "category": "DIGITAL", "icon": "netbanking" },
      { "paymentModeId": "PM003", "paymentModeName": "Cheque", "category": "OFFLINE", "icon": "cheque" },
      { "paymentModeId": "PM001", "paymentModeName": "Cash", "category": "OFFLINE", "icon": "cash" }
    ]
  },
  "error": null
}
```

Bind **All modes** filter → send `paymentModeId: "PM004"` or omit/`ALL` for no filter.

### 6.3 Centers dropdown

```http
GET /api/centers/dropdown
Authorization: Bearer <token>
```

Use returned `_id` as `centerId` in list filters and offline payment form.

### 6.4 Initial list

```http
POST /api/finance/payment-verification/records/list
Content-Type: application/json

{
  "search": "",
  "verificationStatus": "ALL",
  "financeHeadStatus": "",
  "approvalStatus": "",
  "paymentModeId": "",
  "centerId": "",
  "courseId": "",
  "batchId": "",
  "dateFrom": "",
  "dateTo": "",
  "page": 1,
  "limit": 25,
  "sortBy": "updatedAt",
  "sortOrder": "desc"
}
```

**Response:**

```json
{
  "success": true,
  "statusCode": 10000,
  "message": "Verification records fetched successfully",
  "data": {
    "summary": {
      "totalCount": 8,
      "pendingCount": 3,
      "underReviewCount": 1,
      "verifiedCount": 2,
      "rejectedCount": 1,
      "escalatedCount": 1
    },
    "count": 8,
    "totalCount": 8,
    "page": 1,
    "limit": 25,
    "totalPages": 1,
    "items": [
      {
        "_id": "674verif1234567890abcdef",
        "verificationId": "PAY-C1-1",
        "submissionRef": "OFF-113408",
        "type": "FULL_PAYMENT",
        "student": "674student1234567890abcdef",
        "studentName": "Student MUM-2",
        "studentCode": "STU-C11",
        "center": "674center1234567890abcdef",
        "centerName": "Mumbai Center",
        "course": "674course1234567890abcdef",
        "courseName": "GS Mains Comprehensive",
        "batch": "674batch1234567890abcdef",
        "batchName": "July 2026 Batch",
        "enrollment": "674enroll1234567890abcdef",
        "emiPlan": null,
        "emiInstallment": null,
        "paymentModeId": "PM004",
        "paymentModeName": "UPI",
        "gateway": "OFFLINE",
        "paymentType": "FULL",
        "amount": 60000,
        "paymentDate": "2026-06-29T00:00:00.000Z",
        "utrNumber": "TXN-PAY-C1-1",
        "receiptNumber": "",
        "remarks": "Second pending sample for filter demo",
        "paymentProofUrl": "https://res.cloudinary.com/.../proof.jpg",
        "isDuplicate": false,
        "duplicateStatus": "NONE",
        "duplicateLabel": null,
        "verificationStatus": "PENDING_VERIFICATION",
        "verificationStatusLabel": "Pending Verification",
        "financeHeadStatus": "PENDING",
        "financeHeadStatusLabel": "Pending",
        "verifiedBy": null,
        "verifiedByName": "",
        "reviewedBy": null,
        "reviewStartedAt": null,
        "verifiedAt": null,
        "approvedAt": null,
        "rejectedAt": null,
        "rejectionReason": null,
        "rejectionReasonLabel": null,
        "rejectionComment": null,
        "escalatedAt": null,
        "escalationReason": null,
        "createdAt": "2026-06-29T18:16:00.000Z",
        "updatedAt": "2026-06-29T18:16:00.000Z"
      }
    ]
  },
  "error": null
}
```

Bind table to `data.items`. Optional KPI chips from `data.summary`.

---

## 7. Step 2 — Filter & search changes

**Trigger:** Any filter, search, date, or pagination change.

**Rule:** Reset `page` to `1` when filters change (not when only changing page).

**Debounce search:** 400–500 ms.

### Center → Course cascade (filter bar)

When user picks a center:

```http
POST /api/finance/payment-verification/courses-by-center
Content-Type: application/json

{ "centerId": "674center1234567890abcdef" }
```

**Response:**

```json
{
  "success": true,
  "statusCode": 10000,
  "message": "Courses fetched successfully",
  "data": {
    "count": 2,
    "items": [
      {
        "_id": "674course1234567890abcdef",
        "courseId": "CRS001",
        "courseName": "GS Mains Comprehensive",
        "centerId": "674center1234567890abcdef"
      }
    ]
  },
  "error": null
}
```

Clear `courseId` when center changes. Then call list:

```http
POST /api/finance/payment-verification/records/list
```

Example filtered body:

```json
{
  "search": "Kavya",
  "verificationStatus": "UNDER_REVIEW",
  "financeHeadStatus": "PENDING",
  "paymentModeId": "PM004",
  "centerId": "674center1234567890abcdef",
  "courseId": "674course1234567890abcdef",
  "dateFrom": "2026-06-01",
  "dateTo": "2026-06-30",
  "page": 1,
  "limit": 25,
  "sortBy": "updatedAt",
  "sortOrder": "desc"
}
```

| Filter key | Send when "All" selected |
|------------|--------------------------|
| `verificationStatus` | `"ALL"` or omit |
| `financeHeadStatus` | omit or empty string |
| `paymentModeId` | omit or empty string |
| `centerId` / `courseId` | omit |

**Do NOT** re-call `/records/filter-options` on every filter change — only on page mount.

---

## 8. Step 3 — CSV export

**Trigger:** User clicks **CSV** button in the blue header bar.

There is **no dedicated backend CSV endpoint** for Payment Verification. Export client-side using the **same filter body** as the current list.

### Recommended approach

```typescript
const exportCsv = async (filters: ListFilters) => {
  const allRows: VerificationRecord[] = [];
  let page = 1;
  const limit = 100; // API max per page

  while (true) {
    const { data } = await api.post(`${BASE}/records/list`, { ...filters, page, limit });
    allRows.push(...data.items);
    if (page >= data.totalPages) break;
    page += 1;
  }

  const headers = [
    'Payment ID', 'Student Name', 'Student Code', 'Payment Mode',
    'Verification Status', 'Duplicate', 'Verified By', 'Finance Head Status',
    'Amount', 'Payment Date', 'Updated On', 'Center', 'Course', 'UTR'
  ];

  const rows = allRows.map((r) => [
    r.verificationId,
    r.studentName,
    r.studentCode,
    r.paymentModeName,
    r.verificationStatusLabel,
    r.duplicateLabel || '',
    r.verifiedByName || '',
    r.financeHeadStatusLabel,
    r.amount,
    r.paymentDate,
    r.updatedAt,
    r.centerName,
    r.courseName,
    r.utrNumber
  ]);

  downloadCsv('payment-verification-export.csv', headers, rows);
};
```

Filename suggestion: `payment-verification-export.csv`.

---

## 9. Step 4 — Verification table & row actions

### Action icon visibility

Only show **tick** and **X** for users with **Finance Admin / Super Admin** write role.

```typescript
const isTerminal = ['VERIFIED', 'REJECTED', 'AUTO_VERIFIED'].includes(row.verificationStatus);
const isApproved = row.financeHeadStatus === 'APPROVED';

const canVerify = !isTerminal && !isApproved;   // Tick icon
const canReject = !['REJECTED'].includes(row.verificationStatus) && !isApproved; // X icon
const showDuplicateWarning = row.isDuplicate === true; // Triangle on row
```

| Icon | Show when | Click action |
|------|-----------|--------------|
| Eye | Always | Open detail modal → §10 |
| Tick (✓) | `canVerify` | Open "Verify payment?" modal → §11 |
| X | `canReject` | Open "Reject payment verification" modal → §12 |
| Warning triangle | `showDuplicateWarning` | Optional: open detail or highlight duplicate |

### Verified By column

| Condition | Display |
|-----------|---------|
| `verifiedByName` non-empty | Show name (e.g. "Priya Accounts", "Payment Gateway") |
| Empty | `—` |

After another admin approved, refresh list — `verifiedByName` updates from backend.

### Finance Head Status column (compose in frontend)

```typescript
function formatFinanceHeadStatus(row: VerificationRecord): string {
  if (row.verificationStatus === 'REJECTED') {
    return `Rejected by ${row.verifiedByName || 'Verifier'}`;
  }
  if (row.financeHeadStatus === 'APPROVED') {
    return `Finance Head Since ${formatDateTime(row.approvedAt || row.verifiedAt)}`;
  }
  if (row.financeHeadStatus === 'REVIEWING') {
    return `Finance Head Since ${formatDateTime(row.escalatedAt)}`;
  }
  if (row.verificationStatus === 'UNDER_REVIEW') {
    return `Verification Officer Since ${formatDateTime(row.reviewStartedAt || row.updatedAt)}`;
  }
  return row.financeHeadStatusLabel || 'Pending';
}
```

### Uploaded proof icon

If `paymentProofUrl` is set, open in new tab on click. Use same URL in detail modal **View proof** button.

---

## 10. Step 5 — Payment verification details modal (eye icon)

**Trigger:** User clicks eye icon on a row.

```http
GET /api/finance/payment-verification/records/PAY-C1-1
Authorization: Bearer <token>
```

Accepts Mongo `_id` or business ID (`verificationId`).

**Side effect:** If status was `PENDING_VERIFICATION`, backend sets it to `UNDER_REVIEW` and writes audit entry. **Refresh list row** after modal opens if you show live status in table.

**Response:**

```json
{
  "success": true,
  "statusCode": 10000,
  "message": "Verification record fetched successfully",
  "data": {
    "record": {
      "_id": "674verif1234567890abcdef",
      "verificationId": "PAY-C1-1",
      "submissionRef": "OFF-113408",
      "type": "FULL_PAYMENT",
      "studentName": "Student MUM-2",
      "studentCode": "STU-C11",
      "centerName": "Mumbai Center",
      "courseName": "GS Mains Comprehensive",
      "batchName": "July 2026 Batch",
      "paymentModeName": "UPI",
      "amount": 60000,
      "paymentDate": "2026-06-29T00:00:00.000Z",
      "utrNumber": "TXN-PAY-C1-1",
      "receiptNumber": "",
      "paymentProofUrl": "https://res.cloudinary.com/.../proof.jpg",
      "verificationStatus": "UNDER_REVIEW",
      "verificationStatusLabel": "Under Review",
      "financeHeadStatus": "PENDING",
      "financeHeadStatusLabel": "Pending",
      "verifiedByName": "",
      "remarks": "Second pending sample for filter demo",
      "isDuplicate": false,
      "duplicateLabel": null,
      "createdAt": "2026-06-29T18:16:00.000Z",
      "updatedAt": "2026-06-29T18:16:00.000Z"
    },
    "student": {
      "_id": "674student1234567890abcdef",
      "studentId": "STU-C11",
      "studentName": "Student MUM-2",
      "email": "student@example.com",
      "mobileNumber": "9876543210",
      "centerId": "674center1234567890abcdef"
    },
    "enrollment": {
      "_id": "674enroll1234567890abcdef",
      "enrollmentId": "ENR-2026-001",
      "paymentStatus": "PENDING",
      "status": "INACTIVE",
      "baseAmount": 50847,
      "gstAmount": 9153,
      "totalPaid": 0
    },
    "auditTrail": [
      {
        "action": "SUBMITTED",
        "oldVerificationStatus": null,
        "newVerificationStatus": "PENDING_VERIFICATION",
        "oldFinanceHeadStatus": null,
        "newFinanceHeadStatus": "PENDING",
        "userName": "",
        "remarks": "Offline payment submitted for verification",
        "createdAt": "2026-06-29T18:16:00.000Z"
      },
      {
        "action": "UNDER_REVIEW",
        "oldVerificationStatus": "PENDING_VERIFICATION",
        "newVerificationStatus": "UNDER_REVIEW",
        "oldFinanceHeadStatus": "PENDING",
        "newFinanceHeadStatus": "PENDING",
        "userName": "Verifier Admin",
        "remarks": "Verification review started",
        "createdAt": "2026-06-29T18:20:00.000Z"
      }
    ]
  },
  "error": null
}
```

### Modal field mapping

| Modal label | Field |
|-------------|-------|
| Title subtitle | `{verificationId} · {studentName}` |
| Payment ID | `record.verificationId` |
| Student | `record.studentName` |
| Student ID | `record.studentCode` |
| Course | `record.courseName` |
| Center | `record.centerName` |
| Payment mode | `record.paymentModeName` |
| Amount | `record.amount` |
| UTR / Reference | `record.utrNumber` |
| Verification status pill | `record.verificationStatusLabel` |
| Finance head | `record.financeHeadStatusLabel` |
| Verified by | `record.verifiedByName` or `—` |
| Submitted | `record.createdAt` |
| Updated | `record.updatedAt` |
| Remarks | `record.remarks` |
| View proof | `record.paymentProofUrl` |

Footer actions in detail modal (if shown): same tick/X rules as table → §11 / §12.

---

## 11. Step 6 — Verify payment confirmation (tick icon)

**Trigger:** User clicks tick → modal **"Verify payment?"** → **Verify & route**.

```http
PUT /api/finance/payment-verification/records/PAY-C1-1/approve
Authorization: Bearer <token>
Content-Type: application/json

{}
```

**Response:**

```json
{
  "success": true,
  "statusCode": 10000,
  "message": "Payment approved successfully",
  "data": {
    "verification": {
      "_id": "674verif1234567890abcdef",
      "verificationId": "PAY-C1-1",
      "verificationStatus": "VERIFIED",
      "verificationStatusLabel": "Verified",
      "financeHeadStatus": "APPROVED",
      "financeHeadStatusLabel": "Approved",
      "verifiedByName": "Verifier Admin",
      "verifiedAt": "2026-06-29T19:00:00.000Z",
      "approvedAt": "2026-06-29T19:00:00.000Z"
    },
    "studentPaymentReport": {
      "_id": "674report1234567890abcdef",
      "transactionId": "SPT-2026-001",
      "status": "PAID",
      "paidAmount": 60000,
      "pendingAmount": 0,
      "accessStatus": "ACTIVE"
    }
  },
  "error": null
}
```

For **EMI_PLAN** type, response may also include `enrollment` block with `status: "ACTIVE"`.

### After success

1. Close confirmation + detail modals.
2. Toast: "Payment verified successfully."
3. `POST /records/list` with current filters — row shows **Verified** badge and **verifiedByName**.
4. Receipt auto-created (see Receipt Management guide).

**Note:** Backend approve is **final** (sets both `VERIFIED` + finance `APPROVED`). UI copy "route to Finance Head" can remain; single API handles completion.

---

## 12. Step 7 — Reject payment modal (X icon)

**Trigger:** User clicks X → **Reject payment verification** modal.

Populate rejection reason dropdown from Step 1 `rejectionReasons`.

### Validation (frontend)

| Field | Rule |
|-------|------|
| Rejection reason | Required — select from dropdown |
| Rejection remarks | Required — **min 3 chars** (backend); UI may show "min 10 characters" but API accepts 3+ |

Disable **Confirm rejection** until remarks valid.

```http
PUT /api/finance/payment-verification/records/VER-UR-001/reject
Authorization: Bearer <token>
Content-Type: application/json

{
  "reason": "INVALID_PROOF",
  "comment": "Payment screenshot is blurred and UTR is not readable."
}
```

| `reason` value | Label (dropdown) |
|----------------|------------------|
| `FAKE_SCREENSHOT` | Fake Screenshot |
| `UTR_NOT_FOUND` | UTR Not Found |
| `AMOUNT_MISMATCH` | Amount Mismatch |
| `CHEQUE_BOUNCED` | Cheque Bounced |
| `DUPLICATE_PAYMENT` | Duplicate Payment |
| `INVALID_PROOF` | Invalid or unclear payment proof |
| `OTHER` | Other |

**Response:**

```json
{
  "success": true,
  "statusCode": 10000,
  "message": "Payment rejected successfully",
  "data": {
    "verification": {
      "_id": "674verif2234567890abcdef",
      "verificationId": "VER-UR-001",
      "verificationStatus": "REJECTED",
      "verificationStatusLabel": "Rejected",
      "financeHeadStatus": "REJECTED",
      "financeHeadStatusLabel": "Rejected",
      "rejectionReason": "INVALID_PROOF",
      "rejectionReasonLabel": "Invalid Proof",
      "rejectionComment": "Payment screenshot is blurred and UTR is not readable.",
      "rejectedAt": "2026-06-29T19:30:00.000Z",
      "verifiedByName": "Verifier Admin"
    }
  },
  "error": null
}
```

After success: refresh list. Row shows red **Rejected** badge; Finance Head column → "Rejected by {name}".

---

## 13. Step 8 — Add Offline Payment modal open

**Trigger:** User clicks **+ Add Offline Payment** on Verification Center.

On modal open, load shared data (if not cached):

```typescript
await Promise.all([
  api.get('/api/centers/dropdown'),
  api.post(`${BASE}/payment-modes`, {})
]);
```

Generate display reference client-side (e.g. `OFF-113408`) or show `submissionRef` after submit.

**Tabs:**
- **Full Payment** → flow §17
- **EMI Payment** → flow §18–20

Reset form state when switching tabs or closing modal.

---

## 14. Step 9 — Registered student search

**Trigger:** User types in **Search registered student** (not walk-in mode).

```http
POST /api/finance/payment-verification/eligible-students
Content-Type: application/json

{
  "search": "Kavya",
  "centerId": "674center1234567890abcdef",
  "limit": 25
}
```

`centerId` optional — narrows results.

**Response:**

```json
{
  "success": true,
  "statusCode": 10000,
  "message": "Eligible registered students fetched successfully",
  "data": {
    "count": 1,
    "items": [
      {
        "_id": "674student1234567890abcdef",
        "studentId": "STU-24020",
        "fullName": "Kavya Nair",
        "mobileNumber": "9876543210",
        "email": "kavya@example.com",
        "center": {
          "_id": "674center1234567890abcdef",
          "centerName": "Mumbai Center",
          "centerCode": "MUM"
        }
      }
    ]
  },
  "error": null
}
```

On select:
- Set `studentType: "REGISTERED"`
- Set `studentId`, `studentName`, `mobileNumber`, `email`, `centerId` from item
- Trigger §16 cascade (courses → batches → amounts)

**Empty results:** Only registered students **without** existing enrollment/payment report/EMI for that course path are returned.

---

## 15. Step 10 — Walk-in student mode

**Trigger:** User clicks **+ Walk-in student**.

1. Set `studentType: "WALK_IN"`.
2. Clear `studentId` and search selection.
3. Enable manual fields: `fullName`, `mobileNumber`, `email`, `centerId`, `courseId`, `batchId`.
4. Show info banner: *"Enter walk-in student details below"*.

Do **not** call `/eligible-students` in walk-in mode.

Required for submit:
- `fullName` (not `studentName` alone for walk-in — send `fullName`)
- `mobileNumber` (10 digits)
- `centerId`, `courseId`, `batchId`

---

## 16. Step 11 — Center → Course → Batch cascade

### 16.1 Courses by center

**Trigger:** Center selected (registered auto-fill or manual walk-in).

```http
POST /api/finance/payment-verification/courses-by-center
Content-Type: application/json

{ "centerId": "674center1234567890abcdef" }
```

Clear course + batch when center changes.

### 16.2 Batches by course

**Trigger:** Course selected.

```http
POST /api/finance/payment-verification/batches-by-course
Content-Type: application/json

{ "courseId": "674course1234567890abcdef" }
```

**Response:**

```json
{
  "success": true,
  "statusCode": 10000,
  "message": "Batches fetched successfully",
  "data": {
    "count": 1,
    "items": [
      {
        "_id": "674batch1234567890abcdef",
        "batchId": "BAT001",
        "batchName": "July 2026 Batch",
        "courseId": "674course1234567890abcdef",
        "status": "ACTIVE"
      }
    ]
  },
  "error": null
}
```

Show loading spinner on batch dropdown while fetching.

### 16.3 Batch amounts (Payable / Paid / Pending bar)

**Trigger:** Batch selected.

```http
POST /api/finance/payment-verification/batch-amounts
Content-Type: application/json

{
  "batchId": "674batch1234567890abcdef",
  "studentId": "674student1234567890abcdef",
  "centerId": "674center1234567890abcdef",
  "deliveryMode": "OFFLINE"
}
```

`studentId` optional for walk-in (omit if not yet created).

**Response:**

```json
{
  "success": true,
  "statusCode": 10000,
  "message": "Batch amount summary fetched successfully",
  "data": {
    "batchId": "674batch1234567890abcdef",
    "deliveryMode": "OFFLINE",
    "baseAmount": 80000,
    "discountAmount": 0,
    "gstAmount": 14400,
    "payableAmount": 94400,
    "paidAmount": 0,
    "pendingAmount": 94400,
    "totalFee": 94400
  },
  "error": null
}
```

Bind blue summary bar:
- **Payable** → `payableAmount`
- **Paid** → `paidAmount`
- **Pending** → `pendingAmount`

---

## 17. Step 12 — Full Payment tab submit

**Trigger:** User fills payment mode, amount, date, UTR, proof → **Approve payment**.

### Form fields → multipart

| Form field | Required | Notes |
|------------|----------|-------|
| `studentType` | Yes | `REGISTERED` or `WALK_IN` |
| `studentId` | If REGISTERED | Mongo `_id` |
| `studentName` | If REGISTERED | |
| `fullName` | If WALK_IN | |
| `mobileNumber` | Yes | |
| `email` | No | |
| `centerId` | Yes | |
| `courseId` | Yes | |
| `batchId` | Yes | |
| `deliveryMode` | No | Default `OFFLINE` |
| `paymentModeId` | Yes | e.g. `PM004` |
| `amountPaid` | Yes | Integer rupees — should match `payableAmount` for full pay |
| `paymentDate` | Yes | ISO date `2026-06-30` |
| `utrNumber` | No | Required in UI for UPI |
| `remarks` | No | |
| `fullPaymentProof` | Yes | File — JPG, PNG, PDF max 5 MB |

```http
POST /api/finance/payment-verification/submit-full-payment
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

Example FormData keys: all scalar fields above + file field **`fullPaymentProof`**.

**Response (201):**

```json
{
  "success": true,
  "statusCode": 10000,
  "message": "Full payment submitted for verification",
  "data": {
    "submissionRef": "OFF-20260630-001",
    "student": {
      "_id": "674student1234567890abcdef",
      "studentId": "STU24001",
      "studentName": "Aarav Kapoor",
      "email": "aarav@example.com",
      "mobileNumber": "9876543210"
    },
    "enrollment": {
      "_id": "674enroll1234567890abcdef",
      "enrollmentId": "ENR-2026-001",
      "paymentStatus": "PENDING",
      "status": "INACTIVE",
      "paymentType": "FULL"
    },
    "emiPlan": null,
    "installments": [],
    "paymentEntries": [
      {
        "_id": "674entry1234567890abcdef",
        "paymentEntryId": "FPE-2026-001",
        "type": "FULL_PAYMENT",
        "amount": 94400,
        "verificationStatus": "PENDING_VERIFICATION",
        "financeHeadStatus": "PENDING"
      }
    ],
    "verifications": [
      {
        "_id": "674verif1234567890abcdef",
        "verificationId": "PV-2026-001",
        "type": "FULL_PAYMENT",
        "amount": 94400,
        "verificationStatus": "PENDING_VERIFICATION",
        "financeHeadStatus": "PENDING",
        "isDuplicate": false
      }
    ],
    "message": "Payment submitted for verification. Student payment report will be created after approval."
  },
  "error": null
}
```

### After success

1. Close modal.
2. Toast with `verificationId` from `data.verifications[0]`.
3. Refresh verification list — new row appears as **Pending Verification**.
4. Optionally navigate/filter to pending items.

---

## 18. Step 13 — EMI Payment tab — plan selection

**Prerequisite:** Student + batch selected; §16.3 amounts loaded.

### 18.1 Load all plan cards (3 / 6 / 9 / 12 / 18 / 24 / Custom)

```http
POST /api/finance/payment-verification/calculate-emi
Content-Type: application/json

{
  "batchId": "674batch1234567890abcdef",
  "studentId": "674student1234567890abcdef",
  "deliveryMode": "OFFLINE",
  "downPayment": 0,
  "emiStartDate": "2026-06-30",
  "includeAllPlans": true
}
```

For walk-in, omit `studentId`.

**Response:**

```json
{
  "success": true,
  "statusCode": 10000,
  "message": "EMI calculation completed successfully",
  "data": {
    "batchId": "674batch1234567890abcdef",
    "deliveryMode": "OFFLINE",
    "payableAmount": 102660,
    "paidAmount": 0,
    "pendingAmount": 102660,
    "totalFee": 102660,
    "downPayment": 0,
    "remainingAmount": 102660,
    "emiStartDate": "2026-06-30T00:00:00.000Z",
    "planOptions": [
      { "months": 3, "monthlyAmount": 34220, "endDate": "2026-08-30T00:00:00.000Z" },
      { "months": 6, "monthlyAmount": 17110, "endDate": "2026-11-30T00:00:00.000Z" },
      { "months": 9, "monthlyAmount": 11407, "endDate": "2027-03-02T00:00:00.000Z" },
      { "months": 12, "monthlyAmount": 8555, "endDate": "2027-05-30T00:00:00.000Z" },
      { "months": 18, "monthlyAmount": 5704, "endDate": "2027-11-30T00:00:00.000Z" },
      { "months": 24, "monthlyAmount": 4278, "endDate": "2028-05-30T00:00:00.000Z" }
    ]
  },
  "error": null
}
```

Render each card:
- Title: `{months} Months`
- Amount: `₹{monthlyAmount}/mo`
- End date: format `endDate`

### 18.2 Load installment schedule for selected plan

When user selects e.g. **3 Months**:

```http
POST /api/finance/payment-verification/calculate-emi
Content-Type: application/json

{
  "batchId": "674batch1234567890abcdef",
  "studentId": "674student1234567890abcdef",
  "deliveryMode": "OFFLINE",
  "downPayment": 0,
  "months": 3,
  "emiStartDate": "2026-06-30",
  "isCustom": false
}
```

**Response:**

```json
{
  "success": true,
  "statusCode": 10000,
  "message": "EMI calculation completed successfully",
  "data": {
    "payableAmount": 102660,
    "downPayment": 0,
    "remainingAmount": 102660,
    "monthlyAmount": 34220,
    "months": 3,
    "emiStartDate": "2026-06-30T00:00:00.000Z",
    "emiEndDate": "2026-08-30T00:00:00.000Z",
    "installments": [
      {
        "installmentNo": 1,
        "amount": 34220,
        "dueDate": "2026-06-30T05:30:00.000Z",
        "remainingBalance": 68440,
        "status": "SCHEDULED"
      },
      {
        "installmentNo": 2,
        "amount": 34220,
        "dueDate": "2026-07-30T05:30:00.000Z",
        "remainingBalance": 34220,
        "status": "SCHEDULED"
      },
      {
        "installmentNo": 3,
        "amount": 34220,
        "dueDate": "2026-08-30T05:30:00.000Z",
        "remainingBalance": 0,
        "status": "SCHEDULED"
      }
    ]
  },
  "error": null
}
```

Bind **Installment schedule** table:
| # | `installmentNo` |
| DUE DATE | `dueDate` |
| MONTHLY AMOUNT | editable `amount` (custom flow §19) |
| REMAINING BALANCE | `remainingBalance` |

Recalculate remaining balance client-side when user edits amounts, then validate with §19 before submit.

### Down payment section (if downPayment > 0)

Additional fields:
- `downPayment` amount
- `receivedByEmployeeId`
- `downPaymentProof` file upload
- `paymentModeId`, `paymentDate`, `utrNumber` for down payment

---

## 19. Step 14 — EMI Payment tab — custom schedule edit

**Trigger:** User selects **Custom** card OR edits monthly amount cells.

Before submit, validate totals:

```http
POST /api/finance/payment-verification/validate-schedule
Content-Type: application/json

{
  "batchId": "674batch1234567890abcdef",
  "studentId": "674student1234567890abcdef",
  "deliveryMode": "OFFLINE",
  "downPayment": 0,
  "installments": [
    { "amount": 34220 },
    { "amount": 34220 },
    { "amount": 34220 }
  ]
}
```

**Response (valid):**

```json
{
  "success": true,
  "statusCode": 10000,
  "message": "Installment schedule is valid",
  "data": {
    "payableAmount": 102660,
    "paidAmount": 0,
    "pendingAmount": 102660,
    "remainingAmount": 102660,
    "totalScheduled": 102660,
    "balance": 0,
    "valid": true
  },
  "error": null
}
```

If `valid: false`, show error and block **Approve & activate EMI**.

For custom month count (non-standard), set `isCustom: true` and use `customInstallmentCount` on submit.

---

## 20. Step 15 — EMI Payment tab submit

**Trigger:** User clicks **Approve & activate EMI**.

```http
POST /api/finance/payment-verification/save-emi-plan
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

| Form field | Required | Notes |
|------------|----------|-------|
| `studentType` | Yes | |
| `studentId` | If REGISTERED | |
| `studentName` / `fullName` | Yes | Per student type |
| `mobileNumber`, `email` | Yes / No | |
| `centerId`, `courseId`, `batchId` | Yes | |
| `downPayment` | Yes | Can be `0` |
| `selectedMonths` | Yes* | e.g. `3` — or `customInstallmentCount` |
| `isCustom` | No | `true` for custom plans |
| `emiStartDate` | Yes | |
| `installments` or `installmentAmounts` | If custom/edited | JSON string or array |
| `paymentModeId` | If downPayment > 0 | |
| `paymentDate` / `downPaymentDate` | If downPayment > 0 | |
| `utrNumber`, `remarks` | No | |
| `receivedByEmployeeId` | If downPayment > 0 | |
| `downPaymentProof` | If downPayment > 0 | File field name |

**Response (201):**

```json
{
  "success": true,
  "statusCode": 10000,
  "message": "EMI Plan submitted for verification",
  "data": {
    "submissionRef": "OFF-20260630-002",
    "student": {
      "_id": "674student1234567890abcdef",
      "studentId": "STU24001",
      "studentName": "Aarav Kapoor",
      "mobileNumber": "9876543210",
      "email": "aarav@example.com",
      "studentType": "REGISTERED"
    },
    "payableAmount": 102660,
    "downPayment": 0,
    "remainingAmount": 102660,
    "months": 3,
    "emiStartDate": "2026-06-30T00:00:00.000Z",
    "emiEndDate": "2026-08-30T00:00:00.000Z",
    "emiPlanId": "EMI-2026-001",
    "emiPlanObjectId": "674emiplan1234567890abcdef",
    "verificationId": "PV-2026-002",
    "verificationObjectId": "674verif2234567890abcdef",
    "status": "PENDING_VERIFICATION",
    "message": "EMI Plan submitted for verification. Enrollment and course access will be created after finance approval. Installment collection happens in EMI Management after approval."
  },
  "error": null
}
```

### After success

1. Close modal; refresh verification list.
2. New row type `EMI_PLAN` appears — must be **approved** in Verification Center before student appears in EMI Management.
3. **Do not** call pay-installment here — use EMI Management module.

---

## 21. Step 16 — After approval (downstream)

| Outcome | What happens | Frontend |
|---------|--------------|----------|
| Full payment approved | Enrollment ACTIVE, payment report PAID, receipt created | Optional link to Receipt Management |
| EMI plan approved | Enrollment ACTIVE, EMI plan active, installments scheduled | Navigate to EMI Management |
| Rejected | Enrollment stays inactive; EMI plan rejected if applicable | Show rejection reason in detail |
| Installment payment | Created from **EMI Management** → appears in verification list as `INSTALLMENT_PAYMENT` | Same verify/reject flow |

---

## 22. Status badges & action visibility

### Verification status → pill color

| `verificationStatus` | Label | Suggested color |
|---------------------|-------|-----------------|
| `PENDING_VERIFICATION` | Pending Verification | Light blue |
| `UNDER_REVIEW` | Under Review | Purple / grey |
| `VERIFIED` | Verified | Green |
| `AUTO_VERIFIED` | Auto Verified | Green |
| `REJECTED` | Rejected | Red |
| `ESCALATED` | Escalated | Dark red |

Use `verificationStatusLabel` from API for display text.

### Duplicate badge

Show yellow **Possible Duplicate** when `isDuplicate === true` or `duplicateLabel === "Possible Duplicate"`.

### Record types (`type` field)

| Value | Meaning |
|-------|---------|
| `FULL_PAYMENT` | One-time offline payment |
| `EMI_PLAN` | EMI plan + optional down payment |
| `DOWN_PAYMENT` | Down payment only |
| `INSTALLMENT_PAYMENT` | EMI installment (from EMI Management) |
| `EMI_CLOSURE_PAYMENT` | Early EMI closure |

---

## 23. TypeScript interfaces & service layer

```typescript
const BASE = '/api/finance/payment-verification';

export interface VerificationRecord {
  _id: string;
  verificationId: string;
  submissionRef: string;
  type: 'FULL_PAYMENT' | 'EMI_PLAN' | 'DOWN_PAYMENT' | 'INSTALLMENT_PAYMENT' | 'EMI_CLOSURE_PAYMENT';
  studentName: string;
  studentCode: string;
  centerName: string;
  courseName: string;
  batchName: string;
  paymentModeId: string;
  paymentModeName: string;
  amount: number;
  paymentDate: string;
  utrNumber: string;
  paymentProofUrl: string;
  isDuplicate: boolean;
  duplicateLabel: string | null;
  verificationStatus: string;
  verificationStatusLabel: string;
  financeHeadStatus: string;
  financeHeadStatusLabel: string;
  verifiedByName: string;
  verifiedAt: string | null;
  approvedAt: string | null;
  rejectedAt: string | null;
  rejectionReason: string | null;
  rejectionComment: string | null;
  reviewStartedAt: string | null;
  escalatedAt: string | null;
  remarks: string;
  createdAt: string;
  updatedAt: string;
}

export interface VerificationListResponse {
  summary: {
    totalCount: number;
    pendingCount: number;
    underReviewCount: number;
    verifiedCount: number;
    rejectedCount: number;
    escalatedCount: number;
  };
  count: number;
  totalCount: number;
  page: number;
  limit: number;
  totalPages: number;
  items: VerificationRecord[];
}

export const paymentVerificationApi = {
  filterOptions: () => api.post(`${BASE}/records/filter-options`, {}),
  list: (body: Record<string, unknown>) => api.post(`${BASE}/records/list`, body),
  detail: (id: string) => api.get(`${BASE}/records/${id}`),
  approve: (id: string) => api.put(`${BASE}/records/${id}/approve`, {}),
  reject: (id: string, body: { reason: string; comment: string }) =>
    api.put(`${BASE}/records/${id}/reject`, body),
  escalate: (id: string, body: { reason: string; comment?: string }) =>
    api.put(`${BASE}/records/${id}/escalate`, body),

  eligibleStudents: (body: { search: string; centerId?: string; limit?: number }) =>
    api.post(`${BASE}/eligible-students`, body),
  coursesByCenter: (centerId: string) =>
    api.post(`${BASE}/courses-by-center`, { centerId }),
  batchesByCourse: (courseId: string) =>
    api.post(`${BASE}/batches-by-course`, { courseId }),
  batchAmounts: (body: Record<string, unknown>) =>
    api.post(`${BASE}/batch-amounts`, body),
  paymentModes: () => api.post(`${BASE}/payment-modes`, {}),
  calculateEmi: (body: Record<string, unknown>) =>
    api.post(`${BASE}/calculate-emi`, body),
  validateSchedule: (body: Record<string, unknown>) =>
    api.post(`${BASE}/validate-schedule`, body),

  submitFullPayment: (formData: FormData) =>
    api.post(`${BASE}/submit-full-payment`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),
  saveEmiPlan: (formData: FormData) =>
    api.post(`${BASE}/save-emi-plan`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
};
```

### Recommended file structure

```
services/paymentVerification.service.ts
hooks/useVerificationList.ts
hooks/useVerificationDetail.ts
hooks/useOfflinePaymentForm.ts
components/finance/verification/VerificationTable.tsx
components/finance/verification/VerificationDetailModal.tsx
components/finance/verification/VerifyConfirmModal.tsx
components/finance/verification/RejectModal.tsx
components/finance/offline-payment/OfflinePaymentModal.tsx
components/finance/offline-payment/EmiPlanSelector.tsx
types/paymentVerification.types.ts
```

---

## 24. Error handling

| Scenario | HTTP | Frontend action |
|----------|------|-----------------|
| Not authenticated | 401 | Redirect to login |
| Write without admin role | 403 | Hide Add / tick / reject |
| Validation error | 400 | Show field errors from `error.errors` |
| Record not found | 404 | Toast + close modal |
| Already approved/rejected | 400 | Toast + refresh list |
| Missing proof file | 400 | Highlight upload area |
| `/submit-emi` deprecated | 410 | Use `/save-emi-plan` only |
| EMI pay before plan approved | 409 | Direct user to approve EMI plan first |

---

## 25. Testing checklist

- [ ] Page load: filter-options + payment-modes + centers + list in parallel
- [ ] Search debounce triggers list with `search` param
- [ ] Each filter dropdown updates list; page resets to 1
- [ ] Center filter loads courses; course filter sends `courseId`
- [ ] CSV downloads all rows matching current filters
- [ ] Eye opens detail; pending row becomes UNDER_REVIEW after GET
- [ ] Tick approves; verifiedByName and Verified badge appear
- [ ] X rejects with reason + comment; rejection shows in list
- [ ] Proof icon opens `paymentProofUrl`
- [ ] Duplicate rows show warning badge
- [ ] Registered student search auto-fills form
- [ ] Walk-in mode sends `fullName`, no `studentId`
- [ ] Full payment multipart submit creates pending verification row
- [ ] EMI plan cards from calculate-emi; schedule table updates on select
- [ ] Custom schedule validates before save-emi-plan
- [ ] After EMI plan approval, student visible in EMI Management
- [ ] Finance Admin only sees write actions

---

*Last updated: June 2026 — aligns with Payment Verification routes (pay-installment / force-close moved to EMI Management).*
