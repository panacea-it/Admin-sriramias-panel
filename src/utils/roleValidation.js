const ROLE_CODE_PATTERN = /^[A-Z][A-Z0-9_]*$/

export function normalizeRoleCodeInput(value) {
  return String(value || '')
    .trim()
    .replace(/\s+/g, '_')
    .replace(/[^a-zA-Z0-9_]/g, '')
    .toUpperCase()
}

export function validateRoleForm({ roleTitle, roleCode, status, isEdit = false }) {
  const errors = {}
  const title = String(roleTitle || '').trim()
  const code = String(roleCode || '').trim()
  const normalizedStatus = String(status || 'ACTIVE').toUpperCase()

  if (!title) {
    errors.roleTitle = 'Role title is required'
  } else if (title.length < 2) {
    errors.roleTitle = 'Role title must be at least 2 characters'
  } else if (title.length > 100) {
    errors.roleTitle = 'Role title must not exceed 100 characters'
  }

  if (!code) {
    errors.roleCode = 'Role code is required'
  } else if (code.length < 2) {
    errors.roleCode = 'Role code must be at least 2 characters'
  } else if (code.length > 50) {
    errors.roleCode = 'Role code must not exceed 50 characters'
  } else if (!ROLE_CODE_PATTERN.test(code)) {
    errors.roleCode = 'Role code must be uppercase letters, numbers, and underscores'
  }

  if (normalizedStatus && normalizedStatus !== 'ACTIVE' && normalizedStatus !== 'INACTIVE') {
    errors.status = 'Status must be Active or Inactive'
  }

  const payload = {
    roleTitle: title,
    roleCode: code,
  }

  if (normalizedStatus === 'ACTIVE' || normalizedStatus === 'INACTIVE') {
    payload.status = normalizedStatus
  } else if (!isEdit) {
    payload.status = 'ACTIVE'
  }

  return {
    errors,
    isValid: Object.keys(errors).length === 0,
    payload,
  }
}
