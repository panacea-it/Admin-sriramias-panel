/** Mentor employees for batch assignment — sourced from Admin Management API. */

export const EMPLOYEES_UPDATED_EVENT = 'employees-updated'

/** Unwrap GET /api/admin/admin-access/mentors/dropdown list payloads. */
export function unwrapMentorsDropdownList(body) {
  if (!body) return []
  if (Array.isArray(body)) return body

  if (Array.isArray(body.data)) return body.data

  const nested = body.data
  if (nested && typeof nested === 'object') {
    if (Array.isArray(nested.data)) return nested.data
    if (Array.isArray(nested.items)) return nested.items
    if (Array.isArray(nested.mentors)) return nested.mentors
    if (Array.isArray(nested.results)) return nested.results
  }

  if (Array.isArray(body.mentors)) return body.mentors
  if (Array.isArray(body.items)) return body.items
  if (Array.isArray(body.results)) return body.results

  return []
}

export function resolveMentorDropdownId(mentor = {}) {
  const candidates = [
    mentor._id,
    mentor.id,
    mentor.mentorId,
    mentor.adminId,
    mentor.userId,
  ]
  for (const raw of candidates) {
    const id = String(raw ?? '').trim()
    if (id) return id
  }
  return ''
}

/** Match Mentor Admin role from GET /api/admin/roles/dropdown options. */
export function isMentorAdminRole(role = {}) {
  const code = String(role.roleCode || role.code || '').trim().toUpperCase()
  if (code === 'MENTOR_ADMIN') return true

  const label = String(role.label || role.roleTitle || '').trim().toLowerCase()
  if (!label.includes('mentor')) return false
  if (label.includes('counsel')) return false
  return true
}

export function mapMentorDropdownRow(mentor = {}) {
  const value = resolveMentorDropdownId(mentor)
  if (!value) return null

  const mentorName = String(mentor.mentorName ?? '').trim()
  const name = String(
    mentorName || mentor.fullName || mentor.name || mentor.employeeName || '',
  ).trim()
  const businessMentorId = String(mentor.mentorId ?? mentor.employeeId ?? mentor.employeeCode ?? '').trim()
  const displayName = name || businessMentorId || 'Mentor'

  return {
    value,
    label: mentorName || formatMentorOptionLabel(
      { name: displayName, fullName: displayName, employeeId: businessMentorId },
      'Mentor',
    ),
    searchText: `${displayName} ${businessMentorId}`.trim().toLowerCase(),
  }
}

export function formatMentorOptionLabel(employee, roleLabel = 'Mentor') {
  const name = String(employee.name || employee.fullName || '').trim() || '—'
  const empId = String(employee.employeeId || '').trim()
  const role = String(roleLabel || 'Mentor').trim() || 'Mentor'
  if (empId) return `${name} (${empId}) – ${role}`
  return `${name} – ${role}`
}

export function resolveMentorDisplayName(row = {}) {
  const fd = row.formData || {}
  const name = fd.mentorName || row.mentorName || fd.trainerName || row.trainerName
  if (name) {
    const role = (fd.mentorRoleLabel || row.mentorRoleLabel)
      ? ` – ${fd.mentorRoleLabel || row.mentorRoleLabel}`
      : ''
    const id = (fd.mentorEmployeeId || row.mentorEmployeeId)
      ? ` (${fd.mentorEmployeeId || row.mentorEmployeeId})`
      : ''
    return `${name}${id}${role}`
  }
  return '—'
}
