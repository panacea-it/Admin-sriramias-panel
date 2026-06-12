import axiosInstance, { resolveApiBaseUrl } from './axiosInstance'
import { getApiErrorMessage, throwApiError } from '../utils/apiError'
import { isFrontendOnly } from '../config/appMode'
import {
  buildCreateBatchFormData,
  buildUpdateBatchFormData,
  logBatchApiDev,
  mapBatchFromApi,
  mapBatchListStatusParam,
  mapBatchStatusToApi,
  resolveBatchDocumentId,
  unwrapBatchesListMeta,
  unwrapBatchesListResponse,
  unwrapCreateBatchDoc,
} from '../utils/batchApiHelpers'
import { findBatchRow, resolveBatchMongoId } from '../utils/batchHelpers'
import { isMongoObjectId } from '../utils/facultySubjectHelpers'

function logFormDataKeys(formData, label) {
  if (!import.meta.env.DEV || !(formData instanceof FormData)) return
  logBatchApiDev(label, [...formData.keys()])
}

function buildBatchListQuery(params = {}) {
  const query = {}
  if (params.page != null) query.page = params.page
  if (params.limit != null) query.limit = params.limit

  const trimmed = params.search?.trim()
  if (trimmed) {
    query.search = trimmed
    query.batchId = trimmed
    query.batchName = trimmed
    query.courseName = trimmed
    query.mentorName = trimmed
  }

  const apiStatus = mapBatchListStatusParam(params.status)
  if (apiStatus) query.status = apiStatus
  if (params.courseId?.trim()) query.courseId = params.courseId.trim()
  return query
}

function unwrapBatchDoc(body) {
  return body?.data ?? body?.batch ?? body
}

function mapBatchApiError(error, fallback, { notFoundMessage } = {}) {
  const status = error?.response?.status
  let message = getApiErrorMessage(error, fallback)
  if (status === 404 && notFoundMessage) message = notFoundMessage
  else if (status === 429) message = 'Too many requests. Please wait and try again.'
  else if (status === 500) message = 'Server error. Please try again later.'
  const err = new Error(message, { cause: error })
  err.status = status
  if (import.meta.env.DEV && error?.response?.data) {
    err.debugDetail = error.response.data
  }
  return err
}

/** After create, ensure row has a Mongo _id for subsequent API calls. */
async function resolveCreatedBatchRow(mapped, form, { signal } = {}) {
  if (!mapped) return null

  const mongoId = resolveBatchDocumentId(mapped) || (isMongoObjectId(mapped.id) ? mapped.id : '')
  if (mongoId) return { ...mapped, id: mongoId }

  const lookupKey = String(
    form?.batchCode || mapped.batchCode || mapped.batchId || form?.batchName || mapped.batchName || '',
  ).trim()
  if (!lookupKey) return mapped

  try {
    const { rows } = await fetchBatches({ search: lookupKey, page: 1, limit: 10 }, { signal })
    const match =
      rows.find(
        (row) =>
          (form?.batchCode && row.batchCode === form.batchCode) ||
          (form?.batchName && row.batchName === form.batchName) ||
          (mapped.batchId && row.batchId === mapped.batchId),
      ) || rows[0]

    const resolvedMongo = resolveBatchDocumentId(match) || (isMongoObjectId(match?.id) ? match.id : '')
    if (resolvedMongo) {
      return { ...mapped, ...match, id: resolvedMongo }
    }
  } catch (lookupErr) {
    logBatchApiDev('resolveCreatedBatchRow lookup failed', lookupErr?.message)
  }

  return mapped
}

/** Resolve Mongo _id then fetch — avoids 500s when route uses human batch codes (e.g. BAT019). */
export async function fetchBatchByIdResolved(batchIdOrCode, { rows = [], signal } = {}) {
  if (isFrontendOnly) return null

  const param = String(batchIdOrCode || '').trim()
  if (!param) return null

  const mongoId = resolveBatchMongoId(param, rows) || (isMongoObjectId(param) ? param : '')

  if (mongoId) {
    try {
      return await fetchBatchById(mongoId, { signal })
    } catch (error) {
      if (error?.name === 'CanceledError' || error?.code === 'ERR_CANCELED') throw error
      const cached = findBatchRow(rows, param)
      if (cached && (error.status === 404 || error.status === 500)) {
        return cached
      }
      if (error.status !== 404 && error.status !== 500) throw error
    }
  }

  try {
    const { rows: searchRows } = await fetchBatches(
      { search: param, page: 1, limit: 20 },
      { signal },
    )
    const match = findBatchRow(searchRows, param)
    if (!match) return null
    if (match.id && isMongoObjectId(match.id)) {
      try {
        return await fetchBatchById(match.id, { signal })
      } catch (error) {
        if (error?.name === 'CanceledError' || error?.code === 'ERR_CANCELED') throw error
        if (error.status === 404 || error.status === 500) return match
        throw error
      }
    }
    return match
  } catch (error) {
    if (error?.name === 'CanceledError' || error?.code === 'ERR_CANCELED') throw error
    const cached = findBatchRow(rows, param)
    if (cached) return cached
    return null
  }
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

/** POST /api/batches/dropdown — batches for a faculty subject scoped to a center. */
export async function postBatchesDropdown({ facultySubjectId, centerId, signal } = {}) {
  try {
    const response = await axiosInstance.post(
      '/batches/dropdown',
      {
        facultySubjectId: String(facultySubjectId || '').trim(),
        centerId: String(centerId || '').trim(),
      },
      { signal },
    )
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

    const doc = unwrapCreateBatchDoc(response.data)
    let mapped = mapBatchFromApi(doc)
    if (!mapped) {
      throw new Error('Invalid batch response from server — missing batch identifiers')
    }

    mapped = await resolveCreatedBatchRow(mapped, form)

    const hasMongoId = resolveBatchDocumentId(mapped) || isMongoObjectId(mapped.id)
    const hasHumanId = Boolean(mapped.batchId || mapped.batchCode)
    if (!hasMongoId && !hasHumanId) {
      throw new Error('Invalid batch response from server — missing batch identifiers')
    }

    if (hasMongoId) {
      mapped = { ...mapped, id: resolveBatchDocumentId(mapped) || mapped.id }
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

/** GET /api/batches/:batchId — accepts Mongo _id or human-readable batch id/code */
export async function fetchBatchById(batchId, { signal } = {}) {
  if (isFrontendOnly) return null

  const id = encodeURIComponent(String(batchId || '').trim())
  if (!id) return null

  try {
    const response = await axiosInstance.get(`/batches/${id}`, { signal, skipAuthRedirect: true })
    logBatchApiDev('fetchBatchById response', response.data)
    return mapBatchFromApi(unwrapBatchDoc(response.data))
  } catch (error) {
    if (error?.name === 'CanceledError' || error?.code === 'ERR_CANCELED') throw error
    throw mapBatchApiError(error, 'Failed to load batch', {
      notFoundMessage: 'Unable to load batch details',
    })
  }
}

/** GET /api/batches/:batchId/quick-view */
export async function fetchBatchQuickView(batchId, { rows = [], signal } = {}) {
  if (isFrontendOnly) return null

  const mongoId =
    resolveBatchMongoId(batchId, rows) ||
    (isMongoObjectId(String(batchId || '')) ? String(batchId) : '')

  if (!mongoId) {
    return fetchBatchByIdResolved(batchId, { rows, signal })
  }

  try {
    const response = await axiosInstance.get(
      `/batches/${encodeURIComponent(mongoId)}/quick-view`,
      { signal, skipAuthRedirect: true },
    )
    logBatchApiDev('fetchBatchQuickView response', response.data)
    return mapBatchFromApi(unwrapBatchDoc(response.data))
  } catch (error) {
    if (error?.name === 'CanceledError' || error?.code === 'ERR_CANCELED') throw error
    if (error?.response?.status === 404 || error?.response?.status === 500) {
      return fetchBatchByIdResolved(batchId, { rows, signal })
    }
    throw mapBatchApiError(error, 'Failed to load batch')
  }
}

/** PUT /api/batches/:batchId — multipart/form-data */
export async function updateBatch(batchId, form) {
  if (isFrontendOnly) {
    throw new Error('Batch API is disabled in frontend-only mode')
  }

  const formData = await buildUpdateBatchFormData(form)
  logBatchApiDev('updateBatch request', { batchId })
  logFormDataKeys(formData, 'updateBatch payload keys')

  try {
    const response = await axiosInstance.put(`/batches/${batchId}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      skipAuthRedirect: true,
    })
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

/** POST /api/batches/:batchId/duplicate — multipart/form-data */
export async function duplicateBatch(batchId, form, { includeStudents } = {}) {
  if (isFrontendOnly) {
    throw new Error('Batch API is disabled in frontend-only mode')
  }

  const formData = await buildCreateBatchFormData(form)
  if (includeStudents === true) {
    formData.append('includeStudents', 'true')
  } else if (includeStudents === false) {
    formData.append('includeStudents', 'false')
  }

  logBatchApiDev('duplicateBatch request', { batchId })
  logFormDataKeys(formData, 'duplicateBatch payload keys')

  try {
    const response = await axiosInstance.post(`/batches/${batchId}/duplicate`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
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

/** GET /api/admin/admin-access/mentors/dropdown */
export async function fetchMentorsDropdown({ signal } = {}) {
  if (isFrontendOnly) return []

  try {
    const response = await axiosInstance.get('/admin/admin-access/mentors/dropdown', {
      signal,
      skipAuthRedirect: true,
    })
    const body = response.data
    return Array.isArray(body?.data) ? body.data : Array.isArray(body) ? body : []
  } catch (error) {
    if (error?.name === 'CanceledError' || error?.code === 'ERR_CANCELED') throw error
    throw mapBatchApiError(error, 'Failed to load mentors')
  }
}

