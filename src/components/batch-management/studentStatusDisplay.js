/** Normalize enrollment status strings from API/UI into display values. */
export function resolveStudentEnrollmentStatus(status) {
  const normalized = String(status ?? 'ACTIVE')
    .trim()
    .toUpperCase()
    .replace(/\s+/g, '_')

  if (normalized === 'ACTIVE') {
    return { label: 'Active', isActive: true }
  }

  if (normalized === 'INACTIVE' || normalized === 'IN_ACTIVE') {
    return { label: 'Inactive', isActive: false }
  }

  const raw = String(status ?? '').trim()
  const label = raw
    ? raw
        .toLowerCase()
        .replace(/_/g, ' ')
        .replace(/\b\w/g, (char) => char.toUpperCase())
    : 'Unknown'

  return { label, isActive: false }
}

export function isStudentEnrollmentActive(status) {
  return resolveStudentEnrollmentStatus(status).isActive
}
