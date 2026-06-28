import { getApiErrorMessage } from './apiError'

/**
 * Maps CMS child-module structured 400/404 errors to form field errors.
 * @param {unknown} error
 * @param {(field: string, opts: { message: string }) => void=} setError
 */
export function mapChildModuleFormErrors(error, setError) {
  const data = error?.response?.data
  const field = data?.field
  const message = data?.message || getApiErrorMessage(error, 'Validation failed')

  if (field && typeof setError === 'function') {
    setError(field, { message })
  }

  return {
    errorCode: data?.errorCode,
    field,
    message,
    reason: data?.reason,
    suggestions: Array.isArray(data?.suggestions) ? data.suggestions : [],
    sheetErrors: Array.isArray(data?.errors) ? data.errors : [],
    valid: data?.valid !== false,
  }
}

export function unwrapApiData(response) {
  if (response?.data && typeof response.data === 'object' && !Array.isArray(response.data)) {
    return response.data
  }
  return response
}

export function normalizePaginatedResponse(data, { page = 1, limit = 10 } = {}) {
  const rows = Array.isArray(data?.data) ? data.data : []
  return {
    rows,
    total: Number(data?.total ?? rows.length),
    page: Number(data?.page ?? page),
    limit: Number(data?.limit ?? limit),
    totalPages: Number(data?.totalPages ?? 1),
    count: Number(data?.count ?? rows.length),
  }
}

export function formatPublishStatusLabel(status) {
  const value = String(status || '').toUpperCase()
  if (value === 'PUBLISHED') return 'Published'
  if (value === 'UNPUBLISHED') return 'Unpublished'
  return 'Draft'
}

export function formatVisibilityLabel(visibility) {
  const value = String(visibility || '').toUpperCase()
  if (value === 'PUBLISHED') return 'Published'
  if (value === 'PRIVATE') return 'Private'
  if (value === 'VISIBILITY') return 'Visibility'
  return 'Draft'
}

export function appendJsonField(formData, key, value) {
  if (value == null) return
  if (typeof value === 'object') {
    formData.append(key, JSON.stringify(value))
    return
  }
  formData.append(key, String(value))
}

export function appendBatchIds(formData, batchIds) {
  const ids = Array.isArray(batchIds) ? batchIds.filter(Boolean) : []
  appendJsonField(formData, 'batchIds', ids)
}

export function resolveRowId(row) {
  return String(row?._id ?? row?.id ?? '').trim()
}
