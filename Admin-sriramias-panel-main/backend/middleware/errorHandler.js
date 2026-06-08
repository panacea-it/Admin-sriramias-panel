export function notFound(req, res, next) {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  })
}

export function errorHandler(err, req, res, next) {
  if (res.headersSent) {
    return next(err)
  }

  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((e) => e.message)
    return res.status(400).json({
      success: false,
      message: messages.join(', '),
      errors: messages,
    })
  }

  if (err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      message: 'Invalid course id',
    })
  }

  const status = err.statusCode || 500
  res.status(status).json({
    success: false,
    message: err.message || 'Internal server error',
  })
}
