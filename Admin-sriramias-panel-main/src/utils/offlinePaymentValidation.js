const MOBILE_RE = /^[6-9]\d{9}$/
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function validateMobile(mobile) {
  const v = String(mobile || '').replace(/\D/g, '')
  if (!v) return 'Mobile number is required.'
  if (v.length !== 10 || !MOBILE_RE.test(v)) {
    return 'Enter a valid 10-digit Indian mobile number.'
  }
  return null
}

export function validateEmail(email, required = false) {
  const v = String(email || '').trim()
  if (!v) return required ? 'Email is required.' : null
  if (!EMAIL_RE.test(v)) return 'Enter a valid email address.'
  return null
}

export function validateStudentProfile({ studentName, mobile, email }) {
  const errors = []
  if (!studentName?.trim()) errors.push('Student name is required.')
  const mobileErr = validateMobile(mobile)
  if (mobileErr) errors.push(mobileErr)
  const emailErr = validateEmail(email, false)
  if (emailErr) errors.push(emailErr)
  return errors
}
