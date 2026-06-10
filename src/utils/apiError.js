function extractValidationDetail(error) {
  if (!error || typeof error !== 'object') return ''

  if (Array.isArray(error.errors) && error.errors.length > 0) {
    const first = error.errors[0]
    if (typeof first === 'string' && first.trim()) return first.trim()
    if (typeof first?.message === 'string' && first.message.trim()) return first.message.trim()
    if (typeof first?.msg === 'string' && first.msg.trim()) return first.msg.trim()
  }

  if (error.errors && typeof error.errors === 'object' && !Array.isArray(error.errors)) {
    for (const value of Object.values(error.errors)) {
      if (typeof value === 'string' && value.trim()) return value.trim()
      if (typeof value?.message === 'string' && value.message.trim()) return value.message.trim()
    }
  }

  if (Array.isArray(error.details) && error.details.length > 0) {
    const first = error.details[0]
    if (typeof first === 'string' && first.trim()) return first.trim()
    if (typeof first?.message === 'string' && first.message.trim()) return first.message.trim()
  }

  if (error.data && typeof error.data === 'object') {
    return extractValidationDetail(error.data)
  }

  return ''
}

export function getApiErrorMessage(error, fallback = 'Something went wrong') {
  if (!error) return fallback
  if (error.response?.status === 429) {
    return 'Too many requests. Please wait a moment and try again.'
  }
  if (error.response?.data) {
    return getApiErrorMessage(error.response.data, fallback)
  }
  if (typeof error === 'string') return error
  const detail = extractValidationDetail(error)
  if (detail) {
    const summary = typeof error.message === 'string' ? error.message.trim() : ''
    if (!summary || /^validation failed$/i.test(summary)) return detail
    return `${summary}: ${detail}`
  }
  if (typeof error.message === 'string' && error.message) return error.message
  if (typeof error.msg === 'string' && error.msg) return error.msg
  if (typeof error.error === 'string' && error.error) return error.error
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
