/**
 * Payment Attempt Logs API — POST/PUT/DELETE backend integration.
 * Contract: docs/PAYMENT_ATTEMPT_LOGS_API_GUIDE.md
 */

import api from './axiosInstance'
import { getApiErrorMessage } from '../utils/apiError'
import {
  buildPaymentAttemptDashboardBody,
  normalizePaymentAttemptDashboardResponse,
  mapPaymentAttemptRow,
  mapCounselorRemarkRow,
  mapAttemptDetailsToView,
  mapRemarkDetailsToView,
} from '../utils/paymentAttemptLogsHelpers'

const BASE = '/finance/payment-attempt'

function toApiError(error, fallback = 'Request failed') {
  const message = getApiErrorMessage(error, fallback)
  const err = new Error(message)
  if (error?.response?.status) err.status = error.response.status
  if (error?.response?.data) err.data = error.response.data
  return err
}

function unwrap(payload) {
  if (payload == null) return payload
  if (
    typeof payload === 'object' &&
    payload.data !== undefined &&
    ('success' in payload || 'statusCode' in payload)
  ) {
    return payload.data
  }
  return payload
}

function assertSuccess(body, fallback) {
  if (body && body.success === false) {
    throw toApiError(body, body.message || fallback)
  }
}

async function post(path, body = {}, config = {}) {
  const response = await api.post(`${BASE}${path}`, body, config)
  const bodyData = response?.data ?? {}
  assertSuccess(bodyData, 'Request failed')
  return unwrap(bodyData)
}

async function put(path, body = {}, config = {}) {
  const response = await api.put(`${BASE}${path}`, body, config)
  const bodyData = response?.data ?? {}
  assertSuccess(bodyData, 'Request failed')
  return unwrap(bodyData)
}

async function del(path, body = {}, config = {}) {
  const response = await api.delete(`${BASE}${path}`, { ...config, data: body })
  const bodyData = response?.data ?? {}
  assertSuccess(bodyData, 'Request failed')
  return unwrap(bodyData)
}

/** API 1 — Filter options (page load once) */
export async function fetchPaymentAttemptFilterOptions(config = {}) {
  try {
    const data = await post('/filter-options', {}, config)
    return data || {}
  } catch (error) {
    throw toApiError(error, 'Failed to load filter options')
  }
}

/** API 2 — Dashboard (main page data) */
export async function fetchPaymentAttemptDashboard(params = {}, config = {}) {
  try {
    const data = await post('/dashboard', buildPaymentAttemptDashboardBody(params), config)
    return normalizePaymentAttemptDashboardResponse(data)
  } catch (error) {
    throw toApiError(error, 'Failed to load payment attempt logs')
  }
}

/** API 3 — Attempt details (view modal) */
export async function fetchPaymentAttemptDetails(attemptId, config = {}) {
  try {
    const data = await post('/details', { attemptId }, config)
    return mapAttemptDetailsToView(data)
  } catch (error) {
    throw toApiError(error, 'Failed to load payment attempt details')
  }
}

/** API 4 — Available counselors (assign modal) */
export async function fetchPaymentAttemptAvailableCounselors(centerId, config = {}) {
  try {
    const data = await post('/available-counselors', { centerId }, config)
    return Array.isArray(data?.counselors) ? data.counselors : []
  } catch (error) {
    throw toApiError(error, 'Failed to load counselors')
  }
}

/** API 5 — Assign counselor */
export async function assignPaymentAttemptCounselor(payload, config = {}) {
  try {
    return await put(
      '/assign-counselor',
      {
        attemptId: payload.attemptId,
        counselorId: payload.counselorId,
      },
      config,
    )
  } catch (error) {
    if (error?.response?.status === 409) {
      throw toApiError(error, 'Counselor must belong to same center')
    }
    throw toApiError(error, 'Failed to assign counselor')
  }
}

/** API 6 — Add remark */
export async function addPaymentAttemptRemark(payload, config = {}) {
  try {
    return await put(
      '/add-remark',
      {
        attemptId: payload.attemptId,
        remarkSubject: payload.remarkSubject,
        failureAnalysis: payload.failureAnalysis || '',
        counselorRemark: payload.counselorRemark,
      },
      config,
    )
  } catch (error) {
    throw toApiError(error, 'Failed to save remark')
  }
}

/** API 7 — List remarks for attempt (optional) */
export async function fetchPaymentAttemptRemarks(attemptId, config = {}) {
  try {
    const data = await post('/remarks', { attemptId }, config)
    return Array.isArray(data?.items) ? data.items : []
  } catch (error) {
    throw toApiError(error, 'Failed to load remarks')
  }
}

/** API 8 — Remark details (remarks table view) */
export async function fetchPaymentAttemptRemarkDetails(remarkId, config = {}) {
  try {
    const data = await post('/remark-details', { remarkId }, config)
    return mapRemarkDetailsToView(data)
  } catch (error) {
    throw toApiError(error, 'Failed to load remark details')
  }
}

/** API 9 — Assigned dashboard (optional) */
export async function fetchPaymentAttemptAssignedDashboard(params = {}, config = {}) {
  try {
    const data = await post('/assigned-dashboard', buildPaymentAttemptDashboardBody(params), config)
    return normalizePaymentAttemptDashboardResponse(data)
  } catch (error) {
    throw toApiError(error, 'Failed to load assigned payment attempts')
  }
}

/** API 10 — Delete remark (Super Admin only) */
export async function deletePaymentAttemptRemark(remarkId, config = {}) {
  try {
    return await del('/delete-remark', { remarkId }, config)
  } catch (error) {
    throw toApiError(error, 'Failed to delete remark')
  }
}

export { mapPaymentAttemptRow, mapCounselorRemarkRow }
