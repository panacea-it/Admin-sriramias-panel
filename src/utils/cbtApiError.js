import { getApiErrorMessage } from './apiError'

/**
 * @param {unknown} err
 * @returns {string}
 */
export function handleCbtApiError(err) {
  if (!err) return 'Network error — please try again'

  const data = err?.response?.data ?? err
  if (!data || typeof data !== 'object') {
    return getApiErrorMessage(err, 'An unexpected error occurred')
  }

  if (Array.isArray(data.suggestions) && data.suggestions.length) {
    return `${data.message}\n${data.suggestions.join('\n')}`
  }

  if (data.valid === false && Array.isArray(data.errors) && data.errors.length) {
    const preview = data.errors
      .slice(0, 3)
      .map((e) => `Row ${e.row}: ${e.message}`)
      .join('; ')
    return data.message ? `${data.message} — ${preview}` : preview
  }

  return getApiErrorMessage(data, getApiErrorMessage(err, 'An unexpected error occurred'))
}

/**
 * @param {unknown} err
 * @returns {{ fieldErrors: Record<string, string>, message: string, sheetErrors: Array<{ row: number, message: string }> }}
 */
export function parseCbtApiError(err) {
  const data = err?.response?.data ?? err
  const message = handleCbtApiError(err)
  const fieldErrors = {}

  if (data?.field && typeof data.field === 'string') {
    fieldErrors[data.field] = data.message || message
  }

  if (data?.errorCode === 'VALIDATION_REQUIRED_FIELDS' && Array.isArray(data?.details?.missingFields)) {
    data.details.missingFields.forEach((field) => {
      fieldErrors[field] = 'This field is required'
    })
  }

  const sheetErrors =
    data?.valid === false && Array.isArray(data.errors)
      ? data.errors.map((e) => ({ row: e.row, message: e.message }))
      : []

  return { fieldErrors, message, sheetErrors }
}
