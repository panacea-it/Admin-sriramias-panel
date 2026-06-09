import axiosInstance, { resolveApiBaseUrl } from './axiosInstance'
import { getApiErrorMessage, throwApiError } from '../utils/apiError'
import { isFrontendOnly } from '../config/appMode'
import {
  buildCreateBatchFormData,
  buildUpdateBatchJsonPayload,
  logBatchApiDev,
  mapBatchFromApi,
  mapBatchListStatusParam,
  mapBatchStatusToApi,
  unwrapBatchesListMeta,
  unwrapBatchesListResponse,
} from '../utils/batchApiHelpers'
import { isMongoObjectId } from '../utils/facultySubjectHelpers'

function logFormDataKeys(formData, label) {
  if (!import.meta.env.DEV || !(formData instanceof FormData)) return
  logBatchApiDev(label, [...formData.keys()])
}

function buildBatchListQuery(params = {}) {
  const query = {}
  if (params.page != null) query.page = params.page
  if (params.limit != null) query.limit = params.limit
  if (params.search?.trim()) query.search = params.search.trim()
  const apiStatus = mapBatchListStatusParam(params.status)
  if (apiStatus) query.status = apiStatus
  if (params.courseId?.trim()) query.courseId = params.courseId.trim()
  return query
}

function unwrapBatchDoc(body) {
  return body?.data ?? body?.batch ?? body
}

function mapBatchApiError(error, fallback) {
  const status = error?.response?.status
  const message = getApiErrorMessage(error, fallback)
  const err = new Error(message, { cause: error })
  err.status = status
  return err
}

/** GET /api/batches/dropdown — all batches, or linked only when facultySubjectId is set. */
export async function getBatchesDropdown({ facultySubjectId, signal } = {}) {
  try {
    const params = {}
    if (facultySubjectId && isMongoObjectId(facultySubjectId)) {
      params.facultySubjectId = facultySubjectId
    }
    const response = await axiosInstance.get('/batches/dropdown', { params, signal })
    return response.data
  } catch (error) {
    if (error?.name === 'CanceledError' || error?.code === 'ERR_CANCELED') throw error
    throwApiError(error)
  }
}

/** GET /api/batches — batch list for Batch Manager */
export async function fetchBatches(params = {}, { signal } = {}) {
  if (isFrontendOnly) {
    return { rows: [], meta: unwrapBatchesListMeta(null) }
  }

  const query = buildBatchListQuery({
    page: params.page ?? 1,
    limit: params.limit ?? 500,
    search: params.search,
    status: params.status,
  })

  const url = `${resolveApiBaseUrl()}/batches`
  logBatchApiDev('fetchBatches request', { url, query, headers: { Authorization: '[redacted]' } })

  try {
    const response = await axiosInstance.get('/batches', {
      params: query,
      signal,
      skipAuthRedirect: true,
    })

    logBatchApiDev('fetchBatches response', response.data)

    const list = unwrapBatchesListResponse(response.data)
    const meta = unwrapBatchesListMeta(response.data)
    const rows = list.map(mapBatchFromApi).filter(Boolean)
    return { rows, meta }
  } catch (error) {
    logBatchApiDev('fetchBatches error', {
      status: error?.response?.status,
      data: error?.response?.data,
      message: error?.message,
    })
    throw mapBatchApiError(error, 'Failed to load batches')
  }
}

/** POST /api/batches — create batch (multipart/form-data) */
export async function createBatch(form) {
  if (isFrontendOnly) {
    throw new Error('Batch API is disabled in frontend-only mode')
  }

  const formData = await buildCreateBatchFormData(form)
  const url = `${resolveApiBaseUrl()}/batches`

  logBatchApiDev('createBatch request', {
    url,
    headers: { Authorization: '[redacted]', 'Content-Type': 'multipart/form-data' },
  })
  logFormDataKeys(formData, 'createBatch payload keys')

  try {
    const response = await axiosInstance.post('/batches', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      skipAuthRedirect: true,
    })

    logBatchApiDev('createBatch response', response.data)

    const doc = response.data?.data ?? response.data?.batch ?? response.data
    const mapped = mapBatchFromApi(doc)
    if (!mapped) {
      throw new Error('Invalid batch response from server')
    }
    return mapped
  } catch (error) {
    logBatchApiDev('createBatch error', {
      status: error?.response?.status,
      data: error?.response?.data,
      message: error?.message,
    })
    throw mapBatchApiError(error, 'Failed to create batch')
  }
}

/** GET /api/batches/:batchId */
export async function fetchBatchById(batchId, { signal } = {}) {
  if (isFrontendOnly) return null

  try {
    const response = await axiosInstance.get(`/batches/${batchId}`, { signal, skipAuthRedirect: true })
    logBatchApiDev('fetchBatchById response', response.data)
    return mapBatchFromApi(unwrapBatchDoc(response.data))
  } catch (error) {
    throw mapBatchApiError(error, 'Failed to load batch')
  }
}

/** GET /api/batches/:batchId/quick-view */
export async function fetchBatchQuickView(batchId, { signal } = {}) {
  if (isFrontendOnly) return null

  try {
    const response = await axiosInstance.get(`/batches/${batchId}/quick-view`, {
      signal,
      skipAuthRedirect: true,
    })
    logBatchApiDev('fetchBatchQuickView response', response.data)
    return mapBatchFromApi(unwrapBatchDoc(response.data))
  } catch (error) {
    throw mapBatchApiError(error, 'Failed to load batch')
  }
}

/** PUT /api/batches/:batchId */
export async function updateBatch(batchId, form) {
  if (isFrontendOnly) {
    throw new Error('Batch API is disabled in frontend-only mode')
  }

  const payload = buildUpdateBatchJsonPayload(form)
  logBatchApiDev('updateBatch request', { batchId, payload })

  try {
    const response = await axiosInstance.put(`/batches/${batchId}`, payload, { skipAuthRedirect: true })
    logBatchApiDev('updateBatch response', response.data)
    const mapped = mapBatchFromApi(unwrapBatchDoc(response.data))
    if (!mapped) throw new Error('Invalid batch response from server')
    return mapped
  } catch (error) {
    throw mapBatchApiError(error, 'Failed to update batch')
  }
}

/** PATCH /api/batches/status/:batchId */
export async function updateBatchStatus(batchId, status) {
  if (isFrontendOnly) {
    throw new Error('Batch API is disabled in frontend-only mode')
  }

  const payload = { status: mapBatchStatusToApi(status) }
  logBatchApiDev('updateBatchStatus request', { batchId, payload })

  try {
    const response = await axiosInstance.patch(`/batches/status/${batchId}`, payload, {
      skipAuthRedirect: true,
    })
    logBatchApiDev('updateBatchStatus response', response.data)
    return mapBatchFromApi(unwrapBatchDoc(response.data))
  } catch (error) {
    throw mapBatchApiError(error, 'Failed to update batch status')
  }
}

/** POST /api/batches/:batchId/duplicate */
export async function duplicateBatch(batchId, { batchName, status, includeStudents } = {}) {
  if (isFrontendOnly) {
    throw new Error('Batch API is disabled in frontend-only mode')
  }

  const payload = {
    batchName: String(batchName || '').trim(),
  }
  if (status) payload.status = mapBatchStatusToApi(status)
  if (includeStudents === false) payload.includeStudents = false

  logBatchApiDev('duplicateBatch request', { batchId, payload })

  try {
    const response = await axiosInstance.post(`/batches/${batchId}/duplicate`, payload, {
      skipAuthRedirect: true,
    })
    logBatchApiDev('duplicateBatch response', response.data)
    const mapped = mapBatchFromApi(unwrapBatchDoc(response.data))
    if (!mapped) throw new Error('Invalid batch response from server')
    return mapped
  } catch (error) {
    throw mapBatchApiError(error, 'Failed to duplicate batch')
  }
}

/** DELETE /api/batches/:batchId */
export async function deleteBatch(batchId) {
  if (isFrontendOnly) {
    throw new Error('Batch API is disabled in frontend-only mode')
  }

  logBatchApiDev('deleteBatch request', { batchId })

  try {
    await axiosInstance.delete(`/batches/${batchId}`, { skipAuthRedirect: true })
  } catch (error) {
    throw mapBatchApiError(error, 'Failed to delete batch')
  }
}
