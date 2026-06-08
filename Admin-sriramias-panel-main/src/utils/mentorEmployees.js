/** Mentor employees for batch assignment — sourced from Admin Management (role access). */

export const EMPLOYEES_UPDATED_EVENT = 'employees-updated'

/**
 * Mentor-related roles for batch assignment (excludes admin-only titles like "Mentor Admin").
 * @param {{ id?: string, label?: string } | string} roleOrLabel
 */
export function isBatchMentorRole(roleOrLabel) {
  const label =
    typeof roleOrLabel === 'string'
      ? roleOrLabel
      : roleOrLabel?.label || roleOrLabel?.id || ''
  const id = typeof roleOrLabel === 'object' ? roleOrLabel?.id || '' : ''
  const haystack = `${label} ${id}`.toLowerCase()
  if (!haystack.includes('mentor')) return false
  if (/mentor\s*admin/i.test(label) || id === 'mentor_admin') return false
  return true
}

export function formatMentorOptionLabel(employee, roleLabel) {
  const name = employee.name || employee.fullName || '—'
  const empId = employee.employeeId || employee.id || '—'
  const role = roleLabel || '—'
  return `${name} (${empId}) – ${role}`
}

/**
 * @param {object[]} employees
 * @param {object[]} roles — from AdminRolesContext
 * @returns {Array<{ value: string, label: string, employee: object, roleId: string, roleLabel: string }>}
 */
export function buildMentorSelectOptions(employees, roles) {
  const roleLabels = Object.fromEntries((roles || []).map((r) => [r.id, r.label]))
  const seen = new Set()
  const options = []

  for (const emp of employees || []) {
    if (emp.status === 'inactive') continue
    const roleId = emp.role || ''
    const roleLabel = roleLabels[roleId] || roleId
    if (!isBatchMentorRole({ id: roleId, label: roleLabel })) continue

    const value = emp.email?.toLowerCase()
    if (!value || seen.has(value)) continue
    seen.add(value)

    options.push({
      value,
      label: formatMentorOptionLabel(emp, roleLabel),
      employee: emp,
      roleId,
      roleLabel,
    })
  }

  return options.sort((a, b) => a.label.localeCompare(b.label))
}

export function mentorFieldsFromOption(option) {
  if (!option) {
    return {
      mentorEmail: '',
      mentorEmployeeId: '',
      mentorName: '',
      mentorRoleId: '',
      mentorRoleLabel: '',
      trainerName: '',
    }
  }
  const emp = option.employee
  const name = emp.name || emp.fullName || ''
  return {
    mentorEmail: emp.email || '',
    mentorEmployeeId: emp.employeeId || emp.id || '',
    mentorName: name,
    mentorRoleId: option.roleId || '',
    mentorRoleLabel: option.roleLabel || '',
    trainerName: name,
  }
}

export function resolveMentorDisplayName(row = {}) {
  const fd = row.formData || {}
  if (fd.mentorName) {
    const role = fd.mentorRoleLabel ? ` – ${fd.mentorRoleLabel}` : ''
    const id = fd.mentorEmployeeId ? ` (${fd.mentorEmployeeId})` : ''
    return `${fd.mentorName}${id}${role}`
  }
  return fd.trainerName || row.trainerName || '—'
}
