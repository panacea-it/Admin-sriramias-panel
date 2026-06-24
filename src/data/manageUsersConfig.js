/** Manage Users — roles, statuses, and display helpers */

export const USER_ROLES = [
  { value: "student", label: "Student" },
  { value: "faculty", label: "Faculty" },
  { value: "employee", label: "Employee" },
  { value: "admin", label: "Admin" },
  { value: "mentor_admin", label: "Mentor Admin" },
  { value: "counselor", label: "Counselor" },
  { value: "support_staff", label: "Support Staff" },
];

export const USER_TYPE_OPTIONS = [
  { value: "STUDENT", label: "Student" },
  { value: "FACULTY", label: "Faculty" },
  { value: "EMPLOYEE", label: "Employee" },
  { value: "ADMIN", label: "Admin" },
  { value: "MENTOR_ADMIN", label: "Mentor Admin" },
  { value: "COUNSELOR", label: "Counselor" },
  { value: "SUPPORT_STAFF", label: "Support Staff" },
];

export const USER_STATUS_OPTIONS = [
  { value: "Active", label: "Active" },
  { value: "In Active", label: "Deactivated" },
];

/** Fallback center names when CentersContext has no data yet */
export const DEFAULT_CENTER_NAMES = [
  "New Delhi",
  "Hyderabad",
  "Pune",
  "Chennai",
  "Bangalore",
];

export function roleLabel(role) {
  return USER_ROLES.find((r) => r.value === role)?.label || role || "—";
}
