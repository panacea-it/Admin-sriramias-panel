const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const CONTACT_RE = /^[6-9]\d{9}$/

export function mapStatusFilterToApi(statusFilter) {
  if (statusFilter === 'active') return 'ACTIVE'
  if (statusFilter === 'disabled') return 'DISABLED'
  return 'ALL'
}

export function mapApiStatusToLocal(status) {
  return String(status || 'ACTIVE').toUpperCase() === 'DISABLED' ? 'disabled' : 'active'
}

export function mapLocalStatusToApi(status) {
  return String(status || 'active').toLowerCase() === 'disabled' ? 'DISABLED' : 'ACTIVE'
}

export function buildCenterListParams({
  page = 1,
  limit = 10,
  search = '',
  statusFilter = 'all',
  sortBy = 'createdAt',
  sortOrder = 'desc',
} = {}) {
  const params = {
    page,
    limit,
    sortBy,
    sortOrder,
  }

  const trimmedSearch = String(search || '').trim()
  if (trimmedSearch) params.search = trimmedSearch

  const apiStatus = mapStatusFilterToApi(statusFilter)
  if (apiStatus !== 'ALL') params.status = apiStatus

  return params
}

export function validateCenterForm(form, { mode = 'create' } = {}) {
  const errors = {}
  const centerName = String(form?.centerName || '').trim()
  const centerCode = String(form?.centerCode || '').trim()
  const address = String(form?.address || '').trim()
  const city = String(form?.city || '').trim()
  const state = String(form?.state || '').trim()
  const contactDigits = String(form?.contactNumber || '').replace(/\D/g, '')
  const email = String(form?.email || '').trim()

  if (mode === 'create' || centerName) {
    if (!centerName) {
      errors.centerName = 'Centre name is required'
    } else if (centerName.length < 2) {
      errors.centerName = 'Centre name must be at least 2 characters'
    } else if (centerName.length > 150) {
      errors.centerName = 'Centre name must not exceed 150 characters'
    }
  }

  if (mode === 'create' || centerCode) {
    if (!centerCode) {
      errors.centerCode = 'Centre code is required'
    } else if (centerCode.length < 2) {
      errors.centerCode = 'Centre code must be at least 2 characters'
    } else if (centerCode.length > 20) {
      errors.centerCode = 'Centre code must not exceed 20 characters'
    }
  }

  if (address.length > 500) {
    errors.address = 'Address must not exceed 500 characters'
  }

  if (mode === 'create' || city) {
    if (!city) {
      errors.city = 'City is required'
    } else if (city.length < 2) {
      errors.city = 'City must be at least 2 characters'
    } else if (city.length > 100) {
      errors.city = 'City must not exceed 100 characters'
    }
  }

  if (mode === 'create' || state) {
    if (!state) {
      errors.state = 'State is required'
    }
  }

  if (contactDigits && !CONTACT_RE.test(contactDigits)) {
    errors.contactNumber = 'Enter a valid 10-digit Indian mobile number starting with 6–9'
  }

  if (email && !EMAIL_RE.test(email)) {
    errors.email = 'Enter a valid email address'
  }

  return errors
}

/**
 * Map backend 400/422 errors to form field errors.
 * @param {unknown} error
 * @returns {Record<string, string>}
 */
export function mapCenterApiErrorsToForm(error) {
  const mapped = {}
  if (!error || typeof error !== 'object') return mapped

  const payload = error?.response?.data && typeof error.response.data === 'object'
    ? error.response.data
    : error

  if (Array.isArray(payload.errors)) {
    for (const item of payload.errors) {
      const field = item?.field
      const message = item?.message
      if (field && message) mapped[field] = String(message)
    }
  }

  if (payload.errors && typeof payload.errors === 'object' && !Array.isArray(payload.errors)) {
    for (const [field, message] of Object.entries(payload.errors)) {
      if (typeof message === 'string' && message.trim()) {
        mapped[field] = message.trim()
      }
    }
  }

  if (Array.isArray(payload.duplicates)) {
    for (const dup of payload.duplicates) {
      if (dup?.field && dup?.message) {
        mapped[dup.field] = String(dup.message)
      }
    }
  }

  return mapped
}

export function getCreatorLabel(createdBy) {
  if (!createdBy) return '—'
  if (typeof createdBy === 'object') {
    const name = String(createdBy.name || '').trim()
    const email = String(createdBy.email || '').trim()
    if (name && email) return `${name} (${email})`
    return name || email || '—'
  }
  return '—'
}
