# Finance Operations Module — Detailed Flow Documentation

**Application:** SRIRAM's IAS Admin Panel  
**Module:** Finance Operations (Frontend)  
**Document version:** 1.0  
**Date:** May 2026  

---

## 1. Purpose of This Document

This document explains how the **Finance Operations** area of the admin panel works from a user and system perspective. It is written for product owners, QA engineers, developers, and finance teams who need to understand **what happens on each screen**, **how modules connect**, and **what to test before APIs are fully integrated**.

The design matches the rest of the admin panel: same sidebar, colors, tables, filters, modals, and page banners. Navigation between finance sub-pages is done through the **left sidebar** under **Finance Operations** (not through extra tabs on the page).

---

## 2. High-Level Architecture

### 2.1 Entry and routing

| Step | What happens |
|------|----------------|
| 1 | User opens URL `/finance` or clicks **Finance Operations** in the sidebar. |
| 2 | The app redirects to `/finance/dashboard` (Payment Dashboard). |
| 3 | All finance pages load inside **DashboardLayout** (header + sidebar) wrapped by **FinanceLayout**. |
| 4 | **FinanceOperationsProvider** wraps all finance routes so actions can open a **linked student finance profile drawer** and jump between finance areas. |

### 2.2 Ten finance sub-modules (routes)

| # | Sidebar label | URL path | Main purpose |
|---|---------------|----------|--------------|
| 1 | Payment Dashboard | `/finance/dashboard` | Overview KPIs, charts, recent payments |
| 2 | Student Payment Reports | `/finance/reports` | Full payment ledger and actions |
| 3 | Payment Verification Center | `/finance/verification` | Approve/reject pending online payments |
| 4 | EMI Management | `/finance/emi` | EMI plans and installments |
| 5 | Receipt Management | `/finance/receipts` | Generate, preview, resend receipts |
| 6 | Student Finance Profiles | `/finance/profiles` | List of students with finance summary |
| 7 | Payment Attempt Logs | `/finance/attempts` | Failed/successful gateway attempts |
| 8 | Offline Payment Approval | `/finance/offline-approval` | Approve cash/UPI screenshot proofs |
| 9 | Payment Communication Logs | `/finance/communication` | Reminders and delivery logs |
| 10 | GST & Invoice Settings | `/finance/gst-settings` | Center-wise tax and invoice config |

### 2.3 How modules are linked (enterprise ERP idea)

All finance screens share the same **mock/API payment records**. A single student payment can appear in:

- Reports (ledger row)  
- Verification queue (if status is pending)  
- Receipts (after paid)  
- EMI (if payment type is EMI)  
- Attempt logs (gateway retries)  
- Communication logs (receipt/reminder messages)  
- Student finance profile drawer (aggregated view)

**Center scope:** Super Admin and Operation Admin can filter by center using the **header center selector** and dashboard center chips. Data is scoped through **FinanceCenterFilterContext**, which talks to the finance API layer with `scope`, `centerIds`, and `centerNames`.

### 2.4 Role-based access (frontend)

| Role | Typical finance abilities |
|------|---------------------------|
| Super Admin | Full access including GST settings |
| Operation Admin | View, edit payments, approve, export, EMI, receipts (no GST edit) |
| Center Admin | View, approve, export, receipts (center-scoped in UI) |
| Counseling Admin | View and export mainly; limited edit/approve |

Permissions are enforced in the UI via **useFinancePermissions** and constants in **financePermissions.js**. Server-side RBAC must mirror this when APIs go live.

### 2.5 Export on every major table

From page banners (where permitted), users can export filtered data as:

- **CSV**  
- **Excel** (.xls-compatible)  
- **Print**  
- **PDF** (via print dialog)

Exports use **standard columns**: Student ID, Name, Center, Course, Batch, payment/verification/EMI status, amounts, GST, receipt/invoice numbers, UTR, audit fields (created/updated/approved by), and dates.

---

## 3. Global User Journey

```
Login → Sidebar: Finance Operations → Choose sub-page
                ↓
        Page loads (mock or API data)
                ↓
        Filter / Search / Paginate table
                ↓
        Row action (view, edit, approve, receipt, profile)
                ↓
        Optional: Student Finance Profile drawer (tabs)
                ↓
        Optional: Jump to another finance route via linked icons
```

---

## 4. Module-by-Module Flows

---

### 4.1 Payment Dashboard (`/finance/dashboard`)

**Purpose:** Executive view of collections, pending amounts, EMI/offline workload, and recent activity.

#### User flow

1. User lands here after opening Finance (default redirect).  
2. **Page banner** shows title “Payment Dashboard” with:  
   - View badge (Overall / Center name / N centers)  
   - **Refresh** — reloads dashboard data  
   - **Export** — downloads recent payment rows (if role allows export)  
3. **Sticky filter bar:**  
   - Center chips: All Centers + quick select per center (synced with header center filter)  
   - Course dropdown  
   - Month dropdown  
   - Batch dropdown  
4. **While loading:** skeleton cards and charts.  
5. **After load:**  
   - Center performance cards (overall view only)  
   - Center revenue ranking (click row → drill-down modal)  
   - Stat cards: total revenue, today’s collections, pending revenue, total due, overdue, failed payments, EMI active, offline approvals pending, monthly collections, success rate  
   - Charts: monthly revenue, payment status breakdown, course-wise revenue  
   - Tables: recent successful payments; recent failed/pending  
   - **Recent finance activity** feed (synthesized from recent rows)  
6. **Quick actions** (buttons below filters): Verify Payment, Receipts, Send Reminder, Reports, Add Payment — each navigates to the matching finance route.

#### Data flow (technical)

- Hook: **useFinanceDashboard**  
- API: **fetchPaymentDashboardByScope** with center/course/month from filters  
- Mock builder: **buildFinanceDashboardPayload** in financeMockData.js  

#### Links to other modules

- Quick actions → verification, receipts, communication, reports  
- Ranking click → center drill-down (modal only)  
- Row data same IDs as reports/verification  

---

### 4.2 Student Payment Reports (`/finance/reports`)

**Purpose:** Master ledger — search, filter, edit payments, reminders, receipts, exports.

#### User flow

1. Open from sidebar **Student Payment Reports**.  
2. Banner actions: **CSV, Excel, Print, PDF** on current filtered set.  
3. **Filter grid:** search, payment status, payment type, mode, course, branch, **center**, **batch**, **state**, date range, student ID, mobile.  
4. **Column picker** — show/hide columns (student, center, batch, verification, EMI, amounts, receipt, date, etc.).  
5. **Table** — paginated; sticky header on scroll.  
6. **Per-row actions:**  
   - **Eye** — Payment View Drawer (read-only detail)  
   - **Pencil** — Payment Edit Modal (status, amount adjustment, reason, comment) if `canEdit`  
   - **Receipt** — generate receipt if `canReceipts`  
   - **Bell** — queue payment reminder (WhatsApp mock)  
   - **Profile** — open **Student Finance Profile** drawer  
   - **Linked icons** — jump to verification, receipts, attempts, communication  

#### Edit payment flow

1. Click edit → modal opens with current status and amount.  
2. User changes status (e.g. to Paid), reason, comment.  
3. Save → **updatePaymentStatus** API/mock → toast success → table reloads.  
4. Admin log entry appended on mock record.

#### Data flow

- **fetchPaymentReports** → enriched rows via **enrichFinanceRecord**  
- Filter: **filterPaymentReports** (client-side)  

#### Links

- Central hub for finance; most other modules reference same `payment id` / `studentId`.

---

### 4.3 Payment Verification Center (`/finance/verification`)

**Purpose:** Operations team reviews payments that are not yet verified (pending/partial).

#### Intended business flow

```
Student pays online → Status: Pending Verification
        ↓
Finance opens Verification Center
        ↓
Reviewer checks amount, UTR, proof screenshot
        ↓
Approve → Status Paid + Receipt generated (if permitted)
   OR
Reject → Status Rejected
   OR
Request Reupload → Escalated / student asked for new proof
```

#### User flow

1. Open **Payment Verification Center** from sidebar.  
2. Banner: export toolbar.  
3. **FinanceFilterPanel:** search; status filter (Pending Verification, Under Review, Approved, Rejected, Escalated).  
4. Table columns: Payment ID, Student, Center, Course, Mode, Amount, UTR, **View proof**, Status, Verified by, Submitted date.  
5. **View proof** → **ProofViewerModal** (image/PDF placeholder, UTR, notes).  
6. For pending rows and `canApprove`:  
   - **Approve** — updates payment to Paid, triggers receipt generation, refreshes list  
   - **Reject** — Rejected status  
   - **Reupload** — **requestVerificationReupload**  
7. **Linked actions** on row for profile and other modules.

#### Data flow

- **fetchVerificationQueue** → **buildVerificationQueue** from enriched payments  

---

### 4.4 EMI Management (`/finance/emi`)

**Purpose:** Track installment plans per student/course; edit schedules.

#### User flow

1. Open **EMI Management**.  
2. Search box filters plans by student name, course, or student ID.  
3. Summary cards: active plans, total pending amount, due installment count.  
4. **EMI plans table** — progress bar, paid/pending totals; pencil icon if `canManageEmi`.  
5. **All installments table** — flattened list of every installment row.  
6. Click **pencil** → **EmiEditModal:**  
   - Edit dates, amounts, status per installment  
   - Add/remove installment rows  
   - Save → **updateEmiPlan** → toast → reload  

#### Intended flow when EMI is paid (future API)

```
Installment marked Paid → Auto receipt → Email/WhatsApp/SMS (communication log)
```

#### Links

- Student profile drawer **EMI** tab lists plans; link to full EMI page.  
- Reports show `paymentType: EMI` and **EMI Running** / **EMI Completed** badges.

---

### 4.5 Receipt Management (`/finance/receipts`)

**Purpose:** Manage receipt numbers, preview, generate missing receipts, resend.

#### User flow

1. Open **Receipt Management**.  
2. Export toolbar on banner.  
3. Search by receipt number, student name, or payment ID.  
4. Table: receipt #, student, course, amount, status, date.  
5. **Eye** — **ReceiptPreview** (print-friendly layout).  
6. If no receipt number and `canReceipts`: **Generate** receipt.  
7. If receipt exists: **Resend** (Email) from row or preview.  

#### Data flow

- Loads from **fetchPaymentReports** filtered to rows with payment or receipt  

#### Links

- Verification **Approve** can call **generateReceipt**  
- Reports row action also generates receipt  
- GST settings define **receipt prefix** per center  

---

### 4.6 Student Finance Profiles (`/finance/profiles`)

**Purpose:** Directory of students with aggregate paid/pending and course history.

#### User flow

1. Open **Student Finance Profiles**.  
2. Search by name, ID, or mobile.  
3. **Student profiles table** — branch, total paid, pending; pencil opens **FinanceSlideDrawer** with notes (mock save).  
4. **Course finance history table** — all course rows across filtered students.  

#### Linked drawer (available from any finance page)

When user clicks **Profile** or linked **User** icon on any row:

1. **StudentFinanceProfilePanel** slides in (drawer).  
2. Tabs:  
   - **Overview** — total fees, paid, pending, EMI status, last payment  
   - **Payment History** — list of payments for that student  
   - **EMI** — plans + link to EMI Management  
   - **Receipts** — receipt numbers and amounts  
   - **Communication** — messages to that student  
   - **Verification** — verification status per payment  
   - **Failed Attempts** — link to full attempt logs filtered by student  

Data loaded via parallel calls: **fetchPaymentReports**, **fetchEmiPlans**, **fetchCommunicationLogs**.

---

### 4.7 Payment Attempt Logs (`/finance/attempts`)

**Purpose:** Audit trail for gateway success/failure (retries, timeouts).

#### User flow

1. Open **Payment Attempt Logs**.  
2. Export toolbar.  
3. Search student, transaction ID, course.  
4. Filters: status (Success/Failed), mode (UPI/Card).  
5. Paginated table: attempt #, txn ID, gateway status/message, amount, date.  

#### Links

- Built from `attempts` array on each payment in mock data  
- Linked action from reports opens this route with student hint in query  

---

### 4.8 Offline Payment Approval (`/finance/offline-approval`)

**Purpose:** Students upload cash slip or bank/UPI screenshot; finance approves manually.

#### Business flow

```
Student uploads proof offline
        ↓
Status: Pending Approval (Uploaded)
        ↓
Finance reviews proof + UTR in Offline Approval
        ↓
Approve → Approved (payment recorded)
   OR
Reject → Rejected
```

#### User flow

1. Open **Offline Payment Approval**.  
2. Stat cards: pending, total, approved count.  
3. Export toolbar.  
4. Filter: status (Uploaded, Pending Approval, Approved, Rejected).  
5. Table: request ID, student, center, course, amount, mode, UTR, **Preview proof**, status, date.  
6. **Preview** → ProofViewerModal.  
7. **Approve / Reject** if `canApprove` and status pending.  
8. Linked actions for student profile.

#### Data

- **fetchOfflineApprovals** / **approveOfflinePayment**  

---

### 4.9 Payment Communication Logs (`/finance/communication`)

**Purpose:** Track and send payment-related messages.

#### User flow

1. Open **Payment Communication Logs**.  
2. Export toolbar.  
3. **Send payment reminder** form: mobile, email, channel (WhatsApp / Email / SMS) → submit → **sendPaymentReminder** → toast → log list refreshes.  
4. Search logs; filter by channel.  
5. Table: log ID, type, recipient, channel, status, sent time.  

#### Links

- Reports **Bell** icon queues reminder (same API)  
- Receipt resend creates communication entries in mock  
- Student profile **Communication** tab  

---

### 4.10 GST & Invoice Settings (`/finance/gst-settings`)

**Purpose:** Per-center GST %, invoice/receipt prefixes, tax toggles (enterprise: logo, signature, address per center in mock).

#### User flow

1. Open **GST & Invoice Settings**.  
2. Only **Super Admin** (`canManageGst`) can edit; others see read-only fields.  
3. **Global section:** GST %, invoice prefix, receipt prefix, tax enabled checkbox.  
4. **Per-center rows:** center name, GST number, state code, invoice/receipt prefix, finance manager, address, footer (mock structure).  
5. **Save settings** → **updateGstSettings** → toast.  

#### Links

- Receipt generation uses receipt prefix from settings  
- Exports include GST amount and invoice number derived from receipt  

---

## 5. Supporting UI Components (Shared Behavior)

| Component | Role |
|-----------|------|
| FinancePageShell | Standard page banner + title + optional action buttons |
| FinanceStatusBadge | Color chip for Paid, Pending, Verification Pending, EMI Running, etc. |
| FinanceExportToolbar | CSV / Excel / Print / PDF |
| FinanceFilterPanel | Search + date + dropdown filters (verification, offline) |
| FinanceLinkedActions | Icons to profile, verification, receipts, attempts, communication |
| ProofViewerModal | Proof + UTR + notes |
| PaymentViewDrawer | Read-only payment detail from reports |
| PaymentEditModal | Edit status and amounts |
| EmiEditModal | Edit installment schedule |
| FinanceSlideDrawer | Side panel (profiles notes, etc.) |
| PaginatedFigmaTable | Standard admin table with pagination |
| CenterDrillDownModal | Dashboard center detail popup |

---

## 6. Data and API Layer (Frontend)

### 6.1 Mock mode

When backend is unavailable or `VITE_FINANCE_USE_MOCK` is not `false`:

- Data lives in **financeMockData.js** and in-memory copies in **financeAPI.js**.  
- Changes (approve, edit, EMI save, GST save) update mock arrays until page refresh.  

### 6.2 Live API mode

**financeAPI.js** uses `tryApi`: call REST endpoint; on failure fall back to mock.

Key endpoints (expected):

- `GET /finance/dashboard`  
- `GET /finance/reports`, `PATCH /finance/reports/:id/status`  
- `GET /finance/verification`, `POST /finance/verification/:id/reupload`  
- `GET /finance/emi`, `PUT /finance/emi/:id`  
- `GET /finance/offline-approvals`, `POST .../decision`  
- `GET /finance/communication-logs`, `POST /finance/reminders`  
- `GET/PUT /finance/gst-settings`  
- Receipt generate/resend endpoints  

### 6.3 Record enrichment

**enrichFinanceRecord** adds for every row:

- centerName, batchName, state  
- Normalized payment status (e.g. Partial → Partially Paid)  
- verificationStatus, emiStatus  
- invoiceNumber, gstAmount, UTR, audit fields  

This keeps exports and tables consistent across modules.

---

## 7. Center-Wise Finance Flow

1. User selects center(s) in **header center dropdown** OR dashboard **All Centers / center chips**.  
2. **FinanceCenterFilterContext** sets `apiParams` (scope: overall | center | multi | compare).  
3. Dashboard and (when API wired) list endpoints receive `centerIds` / `centerNames`.  
4. GST settings store **per-center** prefix and GST number.  
5. Offline and verification rows display **centerName** column.  

Center Admin role: UI locks selection to their center where implemented in context.

---

## 8. Status Lifecycle Reference

| Status | Typical meaning |
|--------|-----------------|
| Paid | Payment complete |
| Partially Paid | Part of fees received |
| Pending | Awaiting payment or verification |
| Overdue | Past due date |
| Failed | Gateway or verification failed |
| Verification Pending | Awaiting finance review |
| Verified | Approved by finance |
| Rejected | Not accepted |
| Refunded | Money returned |
| EMI Running | Installment plan active |
| EMI Completed | All EMIs paid |

---

## 9. What Was Removed from UI (Per Your Request)

Previously shown **above** each finance page:

- Blue demo-data information banner  
- Horizontal row of finance tab buttons  

These were removed to reduce clutter. **Navigation is only via the left sidebar** under Finance Operations. All functionality remains on the individual routes.

---

## 10. QA and Testing Hints

- Test each sidebar link loads the correct page title.  
- Test Super Admin vs Counseling Admin button visibility.  
- Test export on reports with filters applied (export = filtered rows only).  
- Test verification approve → check receipts module for new receipt number.  
- Test profile drawer from reports row.  
- Test offline proof preview and approve.  
- Test responsive tables at 320px width (horizontal scroll inside table).  

Detailed test cases: see `docs/qa/finance-operations-test-cases.csv` (or `finance-operations-test-cases-v2.csv`).

---

## 11. File Reference (Development)

| Area | Path |
|------|------|
| Layout & routes | `src/layouts/FinanceLayout.jsx` |
| Pages | `src/pages/finance/*.jsx` |
| Shared components | `src/components/finance/` |
| API | `src/api/financeAPI.js` |
| Mock data | `src/data/financeMockData.js` |
| Permissions | `src/constants/financePermissions.js` |
| Navigation items | `src/constants/financeNav.js` |
| Export | `src/utils/financeExport.js` |
| Record model | `src/utils/financeRecordModel.js` |
| Center filter | `src/contexts/FinanceCenterFilterContext.jsx` |
| Operations context | `src/contexts/FinanceOperationsContext.jsx` |

---

## 12. Summary

The Finance Operations module behaves like a small **finance ERP inside the admin panel**: a dashboard for insight, reports as the system of record, verification and offline approval for controls, EMI and receipts for collections operations, communication for outreach, and GST settings for compliance — all tied together through shared student/payment IDs, center scope, role permissions, and a unified export format. The frontend is **production-ready for UI/UX testing**; connecting live APIs will replace mock data without changing the user flows described above.

---

*End of document*
