/** Manage Users — roles, statuses, and display helpers */

export const USER_ROLES = [
  { value: 'student', label: 'Student' },
  { value: 'faculty', label: 'Faculty' },
  { value: 'employee', label: 'Employee' },
  { value: 'admin', label: 'Admin' },
  { value: 'counselor', label: 'Counselor' },
  { value: 'support_staff', label: 'Support Staff' },
]

export const USER_STATUS_OPTIONS = [
  { value: 'Active', label: 'Active' },
  { value: 'In Active', label: 'In Active' },
]

/** Fallback center names when CentersContext has no data yet */
export const DEFAULT_CENTER_NAMES = [
  'New Delhi',
  'Hyderabad',
  'Pune',
  'Chennai',
  'Bangalore',
]

export function roleLabel(role) {
  return USER_ROLES.find((r) => r.value === role)?.label || role || '—'
}
