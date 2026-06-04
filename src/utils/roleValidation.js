const ROLE_CODE_PATTERN = /^[A-Z][A-Z0-9_]*$/

export function normalizeRoleCodeInput(value) {
  return String(value || '')
    .trim()
    .replace(/\s+/g, '_')
    .replace(/[^a-zA-Z0-9_]/g, '')
    .toUpperCase()
}

export function validateRoleForm({ roleTitle, roleCode, isEdit = false }) {
  const errors = {}
  const title = String(roleTitle || '').trim()
  const code = String(roleCode || '').trim()

  if (!title) {
    errors.roleTitle = 'Role title is required'
  }

  if (!isEdit) {
    if (!code) {
      errors.roleCode = 'Role code is required'
    } else if (!ROLE_CODE_PATTERN.test(code)) {
      errors.roleCode = 'Role code must be uppercase letters, numbers, and underscores'
    }
  }

  return {
    errors,
    isValid: Object.keys(errors).length === 0,
    payload: {
      roleTitle: title,
      roleCode: code,
    },
  }
}
