import axiosInstance, { resolveApiBaseUrl } from '../api/axiosInstance'
import { getApiErrorMessage } from '../utils/apiError'
import { isFrontendOnly } from '../config/appMode'
import {
  logBatchApiDev,
  mapAccountFilterToApi,
  mapAccountStatusToApi,
  mapApiEnrollmentStudents,
  mapPaymentFilterToApi,
  mapPaymentStatusToApi,
  unwrapBatchEnrollmentsList,
  unwrapBatchEnrollmentsMeta,
} from '../utils/batchApiHelpers'
import { isMongoObjectId } from '../utils/facultySubjectHelpers'

const ADD_STUDENT_FALLBACK = 'Unable to add student. Please try again.'
const ENROLLMENT_FALLBACK = 'Unable to complete request. Please try again.'
const HANDLED_STATUSES = new Set([400, 401, 403, 404, 409, 422, 500])

function unwrapEnrollmentDoc(body) {
  return body?.data ?? body?.enrollment ?? body
}

function mapEnrollmentApiError(error, fallback = ENROLLMENT_FALLBACK) {
  if (error?.name === 'CanceledError' || error?.code === 'ERR_CANCELED') throw error
  const status = error?.response?.status
  const message = getApiErrorMessage(error, fallback)
  const err = new Error(
    status && HANDLED_STATUSES.has(status) ? message : fallback,
    { cause: error },
  )
  err.status = status
  return err
}

function assertMongoBatchId(batchId) {
  const id = String(batchId || '').trim()
  if (!id || !isMongoObjectId(id)) {
    throw new Error('Invalid batch id')
  }
  return id
}

function assertEnrollmentMongoId(enrollmentId) {
  const id = String(enrollmentId || '').trim()
  if (!id || !isMongoObjectId(id)) {
    throw new Error('Invalid enrollment id')
  }
  return id
}

function buildPath(...segments) {
  return `/${['batch-enrollments', ...segments]
    .map((part) => String(part || '').trim().replace(/^\/+|\/+$/g, ''))
    .filter(Boolean)
    .join('/')}`
}

function buildEnrollmentListQuery({
  search = '',
  paymentFilter = 'all',
  accountFilter = 'all',
  page = 1,
  limit = 10,
} = {}) {
  const query = { page, limit }
  const trimmedSearch = String(search || '').trim()
  if (trimmedSearch) query.search = trimmedSearch
  const paymentStatus = mapPaymentFilterToApi(paymentFilter)
  if (paymentStatus) query.paymentStatus = paymentStatus
  const status = mapAccountFilterToApi(accountFilter)
  if (status) query.status = status
  return query
}

/** GET /api/batch-enrollments/by-batch/:batchId */
export async function getBatchStudents(batchId, params = {}, { signal } = {}) {
  if (isFrontendOnly) {
    return { students: [], meta: { total: 0, page: 1, pages: 1, limit: params.limit ?? 10 } }
  }

  const resolvedBatchId = assertMongoBatchId(batchId)
  const query = buildEnrollmentListQuery(params)
  const path = buildPath('by-batch', resolvedBatchId)
  const url = `${resolveApiBaseUrl()}${path}`
  logBatchApiDev('getBatchStudents request', { batchId: resolvedBatchId, url, query })

  try {
    const response = await axiosInstance.get(path, {
      params: query,
      signal,
      skipAuthRedirect: true,
    })
    logBatchApiDev('getBatchStudents response', response.data)
    const list = unwrapBatchEnrollmentsList(response.data)
    const meta = unwrapBatchEnrollmentsMeta(response.data, {
      total: list.length,
      page: query.page,
      limit: query.limit,
    })
    return { students: mapApiEnrollmentStudents(list), meta }
  } catch (error) {
    logBatchApiDev('getBatchStudents error', {
      status: error?.response?.status,
      data: error?.response?.data,
      message: error?.message,
    })
    const status = error?.response?.status
    if (status === 404 || status === 502 || status === 503) {
      return {
        students: [],
        meta: {
          total: 0,
          page: query.page,
          pages: 1,
          limit: query.limit,
        },
      }
    }
    throw mapEnrollmentApiError(error, 'Failed to load students')
  }
}

/** GET /api/batch-enrollments/:enrollmentId */
export async function getEnrollmentById(enrollmentId, { signal } = {}) {
  if (isFrontendOnly) {
    throw new Error('Batch enrollment API is disabled in frontend-only mode')
  }

  const resolvedEnrollmentId = assertEnrollmentMongoId(enrollmentId)
  const path = buildPath(resolvedEnrollmentId)
  logBatchApiDev('getEnrollmentById request', { enrollmentId: resolvedEnrollmentId })

  try {
    const response = await axiosInstance.get(path, {
      signal,
      skipAuthRedirect: true,
    })
    logBatchApiDev('getEnrollmentById response', response.data)
    const doc = unwrapEnrollmentDoc(response.data)
    return mapApiEnrollmentStudents([doc])[0] || doc
  } catch (error) {
    logBatchApiDev('getEnrollmentById error', {
      status: error?.response?.status,
      data: error?.response?.data,
      message: error?.message,
    })
    throw mapEnrollmentApiError(error, 'Failed to load enrollment details')
  }
}

/** POST /api/batch-enrollments */
export async function createEnrollment(payload, { signal } = {}) {
  if (isFrontendOnly) {
    throw new Error('Batch enrollment API is disabled in frontend-only mode')
  }

  const batchId = assertMongoBatchId(payload?.batchId)
  const body = {
    studentName: String(payload.studentName || '').trim(),
    email: String(payload.email || '').trim(),
    mobileNumber: String(payload.mobileNumber || '').trim(),
    batchId,
    paymentStatus: mapPaymentStatusToApi(payload.paymentStatus || 'PENDING'),
    attendancePercentage: Number(payload.attendancePercentage ?? 0) || 0,
    courseProgressPercentage: Number(payload.courseProgressPercentage ?? 0) || 0,
  }

  const path = buildPath()
  const url = `${resolveApiBaseUrl()}${path}`
  logBatchApiDev('createEnrollment request', { url, body })

  try {
    const response = await axiosInstance.post(path, body, {
      signal,
      skipAuthRedirect: true,
    })
    logBatchApiDev('createEnrollment response', response.data)
    const doc = unwrapEnrollmentDoc(response.data)
    const mapped = mapApiEnrollmentStudents([doc])[0]
    return mapped || doc
  } catch (error) {
    logBatchApiDev('createEnrollment error', {
      status: error?.response?.status,
      data: error?.response?.data,
      message: error?.message,
    })
    throw mapEnrollmentApiError(error, ADD_STUDENT_FALLBACK)
  }
}

/** PUT /api/batch-enrollments/:enrollmentId */
export async function updateEnrollment(enrollmentId, payload, { signal } = {}) {
  if (isFrontendOnly) {
    throw new Error('Batch enrollment API is disabled in frontend-only mode')
  }

  const resolvedEnrollmentId = assertEnrollmentMongoId(enrollmentId)
  const body = {
    paymentStatus: mapPaymentStatusToApi(payload.paymentStatus),
    attendancePercentage: Number(payload.attendancePercentage ?? payload.attendance ?? 0) || 0,
    courseProgressPercentage:
      Number(payload.courseProgressPercentage ?? payload.progress ?? 0) || 0,
  }

  const studentName = String(payload.studentName ?? payload.name ?? '').trim()
  const email = String(payload.email ?? '').trim()
  const mobileNumber = String(payload.mobileNumber ?? payload.phone ?? '').trim()
  if (studentName) body.studentName = studentName
  if (email) body.email = email
  if (mobileNumber) body.mobileNumber = mobileNumber

  const path = buildPath(resolvedEnrollmentId)
  logBatchApiDev('updateEnrollment request', { enrollmentId: resolvedEnrollmentId, body })

  try {
    const response = await axiosInstance.put(path, body, {
      signal,
      skipAuthRedirect: true,
    })
    logBatchApiDev('updateEnrollment response', response.data)
    const doc = unwrapEnrollmentDoc(response.data)
    return mapApiEnrollmentStudents([doc])[0] || doc
  } catch (error) {
    throw mapEnrollmentApiError(error, 'Failed to update student')
  }
}

/** PATCH /api/batch-enrollments/status/:enrollmentId */
export async function updateEnrollmentStatus(enrollmentId, status, { signal } = {}) {
  if (isFrontendOnly) {
    throw new Error('Batch enrollment API is disabled in frontend-only mode')
  }

  const resolvedEnrollmentId = assertEnrollmentMongoId(enrollmentId)
  const body = { status: mapAccountStatusToApi(status) }
  const path = buildPath('status', resolvedEnrollmentId)
  logBatchApiDev('updateEnrollmentStatus request', { enrollmentId: resolvedEnrollmentId, body })

  try {
    const response = await axiosInstance.patch(path, body, {
      signal,
      skipAuthRedirect: true,
    })
    logBatchApiDev('updateEnrollmentStatus response', response.data)
    const doc = unwrapEnrollmentDoc(response.data)
    return mapApiEnrollmentStudents([doc])[0] || doc
  } catch (error) {
    throw mapEnrollmentApiError(error, 'Failed to update student status')
  }
}

/** PATCH /api/batch-enrollments/move/:enrollmentId */
export async function moveEnrollment(enrollmentId, payload, { signal } = {}) {
  if (isFrontendOnly) {
    throw new Error('Batch enrollment API is disabled in frontend-only mode')
  }

  const resolvedEnrollmentId = assertEnrollmentMongoId(enrollmentId)
  const targetBatchId = assertMongoBatchId(payload.batchId || payload.targetBatchId)
  const body = {
    batchId: targetBatchId,
    transferDate: payload.transferDate,
    reason: String(payload.reason || '').trim(),
    transferAttendance: payload.transferAttendance !== false,
    transferFee: payload.transferFee !== false,
    transferTests: payload.transferTests !== false,
  }

  const path = buildPath('move', resolvedEnrollmentId)
  logBatchApiDev('moveEnrollment request', { enrollmentId: resolvedEnrollmentId, body })

  try {
    const response = await axiosInstance.patch(path, body, {
      signal,
      skipAuthRedirect: true,
    })
    logBatchApiDev('moveEnrollment response', response.data)
    const doc = unwrapEnrollmentDoc(response.data)
    return mapApiEnrollmentStudents([doc])[0] || doc
  } catch (error) {
    throw mapEnrollmentApiError(error, 'Failed to move student')
  }
}

/** DELETE /api/batch-enrollments/:enrollmentId */
export async function deleteEnrollment(enrollmentId, { signal } = {}) {
  if (isFrontendOnly) {
    throw new Error('Batch enrollment API is disabled in frontend-only mode')
  }

  const resolvedEnrollmentId = assertEnrollmentMongoId(enrollmentId)
  const path = buildPath(resolvedEnrollmentId)
  logBatchApiDev('deleteEnrollment request', { enrollmentId: resolvedEnrollmentId })

  try {
    await axiosInstance.delete(path, {
      signal,
      skipAuthRedirect: true,
    })
  } catch (error) {
    throw mapEnrollmentApiError(error, 'Failed to delete student')
  }
}

export { getBatchStudents as searchStudents, updateEnrollmentStatus as updateStatus }
