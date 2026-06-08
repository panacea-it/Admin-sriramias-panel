const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const MOBILE_RE = /^[6-9]\d{9}$/

export function validatePasswordStrength(password) {
  const value = String(password || '')
  if (value.length < 8) {
    return 'Minimum 8 characters required'
  }
  if (!/[a-z]/.test(value)) {
    return 'Include at least one lowercase letter'
  }
  if (!/[A-Z]/.test(value)) {
    return 'Include at least one uppercase letter'
  }
  if (!/\d/.test(value)) {
    return 'Include at least one number'
  }
  return null
}

export function validateAdminAccessForm(form, { isEdit = false } = {}) {
  const errors = {}

  if (!String(form.fullName || '').trim()) {
    errors.fullName = 'Full name is required'
  }

  const email = String(form.email || '').trim()
  if (!email) {
    errors.email = 'Official email is required'
  } else if (!EMAIL_RE.test(email)) {
    errors.email = 'Enter a valid official email'
  }

  const mobileDigits = String(form.mobile || '').replace(/\D/g, '')
  if (!mobileDigits) {
    errors.mobile = 'Mobile number is required'
  } else if (!MOBILE_RE.test(mobileDigits)) {
    errors.mobile = 'Enter a valid 10-digit mobile number'
  }

  if (!String(form.employeeId || '').trim()) {
    errors.employeeId = 'Employee / Admin ID is required'
  }

  if (!String(form.roleId || '').trim()) {
    errors.roleId = 'Select an admin access role'
  }

  if (!String(form.centerId || '').trim()) {
    errors.centerId = 'Select an assigned center'
  }

  const shouldValidatePassword = !isEdit || Boolean(form.password || form.confirmPassword)
  if (shouldValidatePassword) {
    if (!isEdit && !form.password) {
      errors.password = 'Password is required'
    } else if (form.password) {
      const strengthError = validatePasswordStrength(form.password)
      if (strengthError) {
        errors.password = strengthError
      }
    }

    if (!isEdit && !form.confirmPassword) {
      errors.confirmPassword = 'Confirm password is required'
    } else if (form.password !== form.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match'
    }
  }

  return {
    errors,
    isValid: Object.keys(errors).length === 0,
  }
}
