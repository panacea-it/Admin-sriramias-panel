const phoneRe = /^[6-9]\d{9}$/
const gmailRe = /^[^\s@]+@gmail\.com$/i

export function isGmailAddress(email) {
  return gmailRe.test(String(email || '').trim())
}

export function validateCreateStudent(form) {
  const errors = {}
  const fullName = String(form.fullName || '').trim()
  const email = String(form.email || '').trim()
  const mobile = String(form.mobile || form.phone || '').trim()
  const centerId = String(form.centerId || form.assignedCenter || '').trim()
  const parentName = String(form.parentName || '').trim()
  const parentMobile = String(form.parentMobile || form.parentPhone || '').trim()

  if (!fullName) errors.fullName = 'Full name is required'
  else if (fullName.length < 2) errors.fullName = 'Full name must be at least 2 characters'
  else if (fullName.length > 100) errors.fullName = 'Full name must be at most 100 characters'

  if (!email) errors.email = 'Email is required'
  else if (!isGmailAddress(email)) {
    errors.email = 'Student email must be a Gmail address (e.g. name@gmail.com)'
  }

  if (!mobile) errors.mobile = 'Mobile number is required'
  else if (!phoneRe.test(mobile)) errors.mobile = 'Invalid Indian mobile number'

  if (!centerId) errors.centerId = 'Center is required'

  if (parentName && parentName.length < 2) {
    errors.parentName = 'Parent name must be at least 2 characters'
  }
  if (parentMobile && !phoneRe.test(parentMobile)) {
    errors.parentMobile = 'Invalid Indian mobile number'
  }

  return errors
}

export function validateUpdateStudent(form) {
  const errors = {}
  const fullName = String(form.fullName || '').trim()
  const email = String(form.email || '').trim()
  const mobile = String(form.mobile || form.phone || '').trim()
  const parentMobile = String(form.parentMobile || form.parentPhone || '').trim()

  if (fullName && fullName.length < 2) {
    errors.fullName = 'Full name must be at least 2 characters'
  }
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.email = 'Enter a valid email'
  }
  if (mobile && !phoneRe.test(mobile)) {
    errors.mobile = 'Invalid Indian mobile number'
  }
  if (parentMobile && !phoneRe.test(parentMobile)) {
    errors.parentMobile = 'Invalid Indian mobile number'
  }

  return errors
}

export { phoneRe, gmailRe }
