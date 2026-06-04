export function getApiErrorMessage(error, fallback = 'Something went wrong') {
  if (!error) return fallback
  if (error.response?.status === 429) {
    return 'Too many requests. Please wait a moment and try again.'
  }
  if (error.response?.data) {
    return getApiErrorMessage(error.response.data, fallback)
  }
  if (typeof error === 'string') return error
  if (error.message && typeof error.message === 'string') return error.message
  if (error.error && typeof error.error === 'string') return error.error
  if (Array.isArray(error.errors) && error.errors.length > 0) {
    const first = error.errors[0]
    return typeof first === 'string' ? first : first?.message || fallback
  }
  return fallback
}

export function throwApiError(error) {
  throw error?.response?.data || error?.message || 'Something went wrong'
}
