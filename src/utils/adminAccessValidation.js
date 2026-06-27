import { INDIAN_MOBILE_RE } from './adminManagementHelpers'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function validateAdminAccessForm(form, { isEdit = false } = {}) {
  const errors = {}

  const fullName = String(form.fullName || '').trim()
  if (!fullName) {
    errors.fullName = 'Full name is required'
  } else if (fullName.length < 2) {
    errors.fullName = 'Full name must be at least 2 characters'
  } else if (fullName.length > 150) {
    errors.fullName = 'Full name must be at most 150 characters'
  }

  const email = String(form.email || '').trim()
  if (!email) {
    errors.email = 'Official email is required'
  } else if (!EMAIL_RE.test(email)) {
    errors.email = 'Enter a valid official email'
  }

  const mobileDigits = String(form.mobile || '').replace(/\D/g, '')
  if (!mobileDigits) {
    errors.mobile = 'Contact number is required'
  } else if (!INDIAN_MOBILE_RE.test(mobileDigits)) {
    errors.mobile = 'Enter a valid 10-digit Indian mobile number'
  }

  const employeeId = String(form.employeeId || '').trim()
  if (!employeeId) {
    errors.employeeId = 'Employee ID is required'
  } else if (employeeId.length < 2) {
    errors.employeeId = 'Employee ID must be at least 2 characters'
  } else if (employeeId.length > 30) {
    errors.employeeId = 'Employee ID must be at most 30 characters'
  }

  if (!String(form.roleId || '').trim()) {
    errors.roleId = 'Select a role'
  }

  if (!String(form.centerId || '').trim()) {
    errors.centerId = 'Select a center'
  }

  const shouldValidatePassword = !isEdit || Boolean(form.password || form.confirmPassword)
  if (shouldValidatePassword) {
    if (!isEdit && !form.password) {
      errors.password = 'Password is required'
    } else if (form.password && form.password.length < 6) {
      errors.password = 'Password must be at least 6 characters'
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
