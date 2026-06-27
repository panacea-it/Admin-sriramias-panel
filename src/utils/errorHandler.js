import { getApiErrorMessage, isRateLimitError } from './apiError'
import { toast } from './toast'

const STATUS_MESSAGES = {
  400: 'Invalid request. Please check your input.',
  401: 'Your session has expired. Please log in again.',
  403: 'You do not have permission to perform this action.',
  404: 'The requested resource was not found.',
  409: 'This action conflicts with existing data.',
  422: 'Validation failed. Please check your input.',
  500: 'Server error. Please try again later.',
}

/**
 * @param {unknown} error
 * @returns {{ status?: number, message: string, code?: string }}
 */
export function parseApiError(error) {
  if (!error) {
    return { message: 'Something went wrong' }
  }

  const status = error?.response?.status ?? error?.status
  let message = getApiErrorMessage(error, STATUS_MESSAGES[status] || 'Something went wrong')

  if (error?.code === 'ECONNABORTED' || /timeout/i.test(String(error?.message || ''))) {
    return {
      status,
      message: 'Request timed out. Please check your connection and try again.',
      code: 'TIMEOUT',
    }
  }

  if (!error?.response && error?.request) {
    return {
      status,
      message: 'Unable to connect to server',
      code: 'NETWORK_ERROR',
    }
  }

  if (isRateLimitError(error)) {
    return { status: 429, message, code: 'RATE_LIMIT' }
  }

  return { status, message }
}

/**
 * @param {unknown} error
 * @param {{ silent?: boolean, fallback?: string }} [options]
 */
export function handleApiError(error, { silent = false, fallback } = {}) {
  const parsed = parseApiError(error)
  if (fallback && parsed.message === 'Something went wrong') {
    parsed.message = fallback
  }
  if (!silent) {
    toast.error(parsed.message)
  }
  return parsed
}

export default handleApiError
