const PLACEHOLDER_IMAGE_LABEL = '312×214 Kb'

export function hasRankerImageValue(image = '') {
  const trimmed = String(image).trim()
  if (!trimmed) return false
  if (trimmed === PLACEHOLDER_IMAGE_LABEL) return false
  return true
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

export function validateRankerForm(form, { isTop10 = false, editingId = null, rankers = [] } = {}) {
  const errors = {}

  if (!form.program?.trim()) {
    errors.program = 'Program is required.'
  }

  if (!form.course?.trim()) {
    errors.course = 'Course is required.'
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
    errors.image = 'Image is required.'
  }

  if (!form.status) {
    errors.status = 'Status is required.'
  }

  if (isTop10 && form.status === 'Active') {
    const order = Number(form.displayOrder)
    if (form.displayOrder === '' || form.displayOrder == null) {
      errors.displayOrder = 'Display order is required for Top 10 rankers.'
    } else if (!Number.isInteger(order) || order < 1 || order > 10) {
      errors.displayOrder = 'Enter a display order between 1 and 10.'
    } else {
      const duplicate = rankers.some(
        (row) =>
          String(row.id) !== String(editingId) &&
          row.status === 'Active' &&
          row.isTop10 &&
          Number(row.displayOrder) === order,
      )
      if (duplicate) {
        errors.displayOrder = 'This display order is already assigned.'
      }
    }
  }

  return errors
}
