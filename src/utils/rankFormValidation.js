import { isResolvableRankerImageUrl } from './rankerImageUtils'

export function hasRankerImageValue(image = '') {
  return isResolvableRankerImageUrl(image)
}

export function isValidRankValue(value = '') {
  const trimmed = String(value).trim()
  if (!trimmed) return false

  const airMatch = trimmed.match(/^AIR\s*#?\s*(\d+)$/i)
  if (airMatch) {
    return Number(airMatch[1]) >= 1
  }

  if (/^\d+$/.test(trimmed)) {
    return Number(trimmed) >= 1
  }

  return false
}

export function validateRankerForm(form, { editingId = null, rankers = [] } = {}) {
  const errors = {}
  const isEditing = Boolean(editingId)

  if (!form.course?.trim()) {
    errors.course = 'Program is required.'
  }

  if (!form.year?.trim()) {
    errors.year = 'Year is required.'
  }

  if (!form.studentId?.trim()) {
    errors.studentId = 'Student ID is required.'
  }

  if (!form.studentName?.trim()) {
    errors.studentName = 'Student Name is required.'
  }

  const rank = form.rank?.trim() ?? ''
  if (!rank) {
    errors.rank = 'Rank is required.'
  } else if (!isValidRankValue(rank)) {
    errors.rank = 'Enter a valid rank.'
  }

  if (!hasRankerImageValue(form.image)) {
    errors.image = isEditing
      ? 'Image is required. Upload a new image or keep the existing one.'
      : 'Image is required.'
  }

  if (!form.status) {
    errors.status = 'Display status is required.'
  }

  const homepageOrder = Number(form.homepageOrder)
  if (form.showOnHomepage) {
    if (!String(form.homepageOrder || '').trim()) {
      errors.homepageOrder = 'Homepage order is required.'
    } else if (!Number.isInteger(homepageOrder) || homepageOrder < 1) {
      errors.homepageOrder = 'Homepage order must be a positive integer.'
    }
  }

  if (form.status === 'Active') {
    const toppersPageOrder = Number(form.toppersPageOrder)
    if (!String(form.toppersPageOrder || '').trim()) {
      errors.toppersPageOrder = 'Toppers page order is required.'
    } else if (!Number.isInteger(toppersPageOrder) || toppersPageOrder < 1) {
      errors.toppersPageOrder = 'Toppers page order must be a positive integer.'
    }
  }

  return errors
}
