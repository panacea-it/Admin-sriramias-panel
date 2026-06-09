export function getApiErrorMessage(error, fallback = 'Something went wrong') {
  if (!error) return fallback
  if (error.response?.status === 429) {
    return 'Too many requests. Please wait a moment and try again.'
  }
  if (error.response?.data) {
    return getApiErrorMessage(error.response.data, fallback)
  }
  if (typeof error === 'string') return error
  if (typeof error.message === 'string' && error.message) return error.message
  if (typeof error.msg === 'string' && error.msg) return error.msg
  if (typeof error.error === 'string' && error.error) return error.error
  if (Array.isArray(error.errors) && error.errors.length > 0) {
    const first = error.errors[0]
    return typeof first === 'string' ? first : first?.message || fallback
  }
  return fallback
}

export function isRateLimitError(error) {
  if (!error) return false
  if (error.response?.status === 429 || error.status === 429) return true
  const msg = getApiErrorMessage(error, '').toLowerCase()
  return (
    msg.includes('too many requests') ||
    msg.includes('rate limit') ||
    msg.includes('429')
  )
}

export function throwApiError(error) {
  throw error?.response?.data || error?.message || 'Something went wrong'
}
