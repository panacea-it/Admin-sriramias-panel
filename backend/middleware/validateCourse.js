const ALLOWED_STATUS = ['Active', 'In Active', 'Draft']

export function validateCourseBody(req, res, next) {
  const { courseName, category, center, price, status } = req.body
  const errors = []

  if (!courseName || !String(courseName).trim()) {
    errors.push('Course name is required')
  }
  if (!category || !String(category).trim()) {
    errors.push('Category is required')
  }
  if (!center || !String(center).trim()) {
    errors.push('Center is required')
  }
  if (!price || !String(price).trim()) {
    errors.push('Price is required')
  }
  if (status != null && status !== '' && !ALLOWED_STATUS.includes(status)) {
    errors.push(`Status must be one of: ${ALLOWED_STATUS.join(', ')}`)
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: errors.join(', '),
      errors,
    })
  }

  next()
}
