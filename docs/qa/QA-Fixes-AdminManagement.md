# QA Fixes — Admin Management (Centre Management, Role Access, Admin Access)

This document records the changes made in response to the QA error report
(`New Project (1).docx`) covering the Admin Management screens:

- **Centre Management** — `/users/centers`
- **Role Access** — `/users/admin-access-types`
- **Admin Access** (permission matrix) — `/users/role-matrix`

All changes are frontend-only (no backend/API changes were required). Each item
below references the QA issue, the fix, and the file(s) touched.

---

## Centre Management

### 1. Center Name allowed numbers and special characters
**Issue:** The "Center Name" field accepted values like `5667@@@@`.
**Fix:** The input now strips anything other than letters and spaces as you
type, and submit validation rejects names that contain numbers/special
characters with the message _"Center name can only contain letters and spaces"_.
**File:** `src/components/center-management/CenterFormDrawer.jsx`

### 2. Status helper text reworded
**Issue:** Helper text under Status was unclear.
**Fix:** Changed to _"Disabled centers are excluded from operational dropdown
menus until they are re-enabled."_
**File:** `src/components/center-management/CenterFormDrawer.jsx`

### 3. "Please fix the highlighted fields" popup on empty submit
**Issue:** A toast popup appeared on invalid submit even though inline field
errors are already shown.
**Fix:** Removed the redundant toast. Validation now relies solely on the inline
per-field messages (which clearly indicate exactly which fields are wrong — also
addresses the "validation popup should show which fields are wrong" item).
**File:** `src/components/center-management/CenterFormDrawer.jsx`

### 4. Address field had no min/max length
**Fix:** Address now requires 5–200 characters (validated on submit, with
`minLength`/`maxLength` on the textarea).
**File:** `src/components/center-management/CenterFormDrawer.jsx`

### 5. Scrollbar missing on the create/edit screen
**Issue:** The modal body scrolled but the scrollbar was effectively invisible.
**Root cause:** The shared `.custom-scrollbar` style used a near-transparent
**white** thumb (meant for the dark sidebar) on **light** modal backgrounds.
**Fix:** Reworked `.custom-scrollbar` to a clearly visible slate thumb/track
(also enables the Firefox `scrollbar-width`/`scrollbar-color`). This makes
scrollbars visible across all modals and scroll areas that use this class.
**File:** `src/index.css`

### 6. State dropdown — keyboard arrows
**Issue:** Arrow keys reportedly did not work on the State dropdown.
**Fix:** The searchable dropdown already supported Arrow Up/Down + Enter once
open; the trigger now also opens on **ArrowUp** (in addition to ArrowDown /
Enter / Space) for native-select parity.
**File:** `src/components/categories/SearchableSelect.jsx`

### 7. Error popups appeared off to the right / outside the screen
**Fix:** Toast notifications now appear **top-center**, keeping them within the
viewport.
**File:** `src/components/ui/AppToaster.jsx`

### 9. Assigned admins accepted invalid values
**Issue:** Any value was accepted in "Assigned admins" and it did not round-trip
on edit. QA suggested removing the field.
**Fix:** Removed the "Assigned admins" input from the Center edit form as
suggested. Existing assignments are preserved on save (admins are managed via
Admin Management rather than free-text entry here).
**File:** `src/components/center-management/CenterFormDrawer.jsx`

### 10 & 11. Enable/Disable action — clickability & colour
**Issue:** Enable and Disable used the same amber colour and the same `Ban`
icon, making the state ambiguous.
**Fix:** The action is now colour- and icon-coded by state:
- **Disable** (active centre): red, `Ban` icon
- **Enable** (disabled centre): green, `CheckCircle2` icon
**File:** `src/pages/users/CenterManagementPage.jsx`

### 12. Delete confirmation wording
**Issue:** "This action cannot be undone." copy and generic buttons.
**Fix:** Reworded to a friendly confirmation — _"Are you sure you want to
delete …?"_ — with **"Yes, delete"** / **"No, cancel"** buttons.
**File:** `src/components/center-management/ConfirmCenterDeleteModal.jsx`

---

## Role Access

### 13. "Create Role Access" behaviour
**Status:** Verified — the button opens a centered modal
(`AdminRoleFormModal`), consistent with Centre Management's create flow.

### 14. Status filter button label
**Issue:** The status filter showed "Status".
**Fix:** Renamed the default option to **"All status"** (both on the Role Access
page and the shared filter toolbar default).
**Files:** `src/pages/users/RoleAccessPage.jsx`,
`src/components/courses/CourseFilterToolbar.jsx`

---

## Admin Access (Permission Matrix)

### 15. Blocker — could not scroll down inside the module configuration modal
**Issue:** Remaining feature rows were unreachable; no scrollbar.
**Fix:** Gave the modal body an explicit `max-h-[65vh]` so it reliably scrolls,
combined with the now-visible `.custom-scrollbar` styling (see item 5).
**File:** `src/components/admin-management/PermissionDrawer.jsx` (+ `src/index.css`)

### 16. "Feature / Module" header overlapped the rows
**Fix:** Made the sticky "Feature / Module" header fully opaque and raised its
stacking order so it no longer bleeds over the list while scrolling.
**File:** `src/components/admin-management/PermissionGroup.jsx`

### 17. Footer/horizontal scrollbar missing on the matrix
**Fix:** Resolved by the visible `.custom-scrollbar` rework (item 5), which also
styles the horizontal scrollbar (`height`) used by the matrix.
**File:** `src/index.css`

### 19. (HIGH) Developer wording shown to users
**Issue:** User-facing text exposed internal/dev terms such as _"Unsaved API
draft"_, _"sync the API payload"_, _"stored locally"_, _"server sync"_, and
_"export payload — role catalog missing"_.
**Fix:** Reworded all of these to plain, user-friendly language, e.g.:
- "Unsaved API draft" → **"You have unsaved changes"**
- "Local permissions are saved. Use Save permissions when you are ready to sync
  the API payload." → **"Click Save permissions to apply your changes."**
- "Saves to this browser until server sync is available." → **"Click Save
  permissions to apply your changes."**
- "Changes are stored locally and reflected in the matrix." → **"Your changes
  have been applied to the permission matrix."**
- "Invalid export payload — role catalog missing" → **"Unable to save
  permissions. Please refresh and try again."**
- "Role permissions are stored locally and applied across the admin panel." →
  **"Role permissions have been applied across the admin panel."**
**Files:** `src/components/admin-management/RoleAccessMatrix.jsx`,
`src/pages/users/RoleAccessMatrixPage.jsx`

---

## Notes on remaining cosmetic items

- **#18 (Test Management feature-count text touching column borders in the
  matrix header):** The matrix header counts are centered within fixed-width
  cells; the visible-scrollbar and opaque-header changes reduce visual crowding.
  This is a minor cosmetic item and can be tuned further if needed (the column
  width is constrained because the matrix shows many modules at once).

## Files changed (summary)

| File | Purpose |
|------|---------|
| `src/components/center-management/CenterFormDrawer.jsx` | Name/address validation, helper text, removed popup + assigned-admins field |
| `src/components/center-management/ConfirmCenterDeleteModal.jsx` | Delete confirmation copy + buttons |
| `src/pages/users/CenterManagementPage.jsx` | Enable/Disable colour + icon |
| `src/components/categories/SearchableSelect.jsx` | Keyboard arrow open parity |
| `src/pages/users/RoleAccessPage.jsx` | "All status" filter label |
| `src/components/courses/CourseFilterToolbar.jsx` | "All status" default label |
| `src/components/admin-management/RoleAccessMatrix.jsx` | Remove developer jargon |
| `src/pages/users/RoleAccessMatrixPage.jsx` | Remove developer jargon |
| `src/components/admin-management/PermissionDrawer.jsx` | Scrollable modal body |
| `src/components/admin-management/PermissionGroup.jsx` | Opaque sticky header |
| `src/components/ui/AppToaster.jsx` | Toast position top-center |
| `src/index.css` | Visible scrollbar styling |
