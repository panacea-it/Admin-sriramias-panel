# Frontend QA exports

## Download test cases (CSV / Excel)

**File:** [`frontend-test-cases.csv`](./frontend-test-cases.csv)

**Full path on your machine:**

```
c:\Users\kgree\Desktop\admin-panel-upgraded-sriramias-main\docs\qa\frontend-test-cases.csv
```

### Open in Excel (Windows)

1. Open Excel → **File** → **Open** → browse to `docs\qa\frontend-test-cases.csv`
2. If characters look wrong: **Data** → **Get Data** → **From File** → **From Text/CSV** → select the file → encoding **UTF-8** → Load

### Columns

| Column | Description |
|--------|-------------|
| Module Name | Feature area |
| Test Case ID | Unique ID (e.g. AUTH-LOGIN-001) |
| Test Scenario | Short title |
| Steps to Test | Manual steps |
| Expected Result | Pass criteria |
| Priority | P0–P3 |
| Severity | Critical / High / Medium / Low |
| Status | Not Run / Fail (Static) / Pass |
| Possible Bug | Risk note |
| Suggested Fix | Remediation |

**Total test cases:** 120+

Generated from the frontend-only QA audit (APIs not integrated).

---

## Finance Operations only (Excel)

**File:** [`finance-operations-test-cases.csv`](./finance-operations-test-cases.csv)

**Full path:**

```
c:\Users\kgree\Desktop\admin-panel-upgraded-sriramias-main\docs\qa\finance-operations-test-cases.csv
```

Covers all 10 finance routes under `/finance/*`:

| Route | Page |
|-------|------|
| `/finance/dashboard` | Payment Dashboard |
| `/finance/reports` | Student Payment Reports |
| `/finance/verification` | Payment Verification Center |
| `/finance/emi` | EMI Management |
| `/finance/receipts` | Receipt Management |
| `/finance/profiles` | Student Finance Profiles |
| `/finance/attempts` | Payment Attempt Logs |
| `/finance/offline-approval` | Offline Payment Approval |
| `/finance/communication` | Payment Communication Logs |
| `/finance/gst-settings` | GST & Invoice Settings |

Plus global RBAC, center filter, modals, UI/UX, accessibility, performance, and pre-API readiness cases.
