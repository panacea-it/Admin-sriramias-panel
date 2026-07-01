/**
 * Payment Verification Center API
 * Contract: docs/PAYMENT_VERIFICATION_CENTER_FRONTEND_API_GUIDE.md
 */

import api from './axiosInstance'
import { getCentersDropdown, normalizeCentersDropdown } from '../services/centerService'
import { getApiErrorMessage } from '../utils/apiError'
import {
  buildVerificationListBody,
  normalizeVerificationListResponse,
  mapVerificationDetailToUi,
} from '../utils/paymentVerificationHelpers'

const BASE = '/finance/payment-verification'

function toApiError(error, fallback = 'Request failed') {
  const message = getApiErrorMessage(error, fallback)
  const err = new Error(message)
  if (error?.response?.status) err.status = error.response.status
  if (error?.response?.data) err.data = error.response.data
  if (error?.data) err.data = error.data
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

async function get(path, config = {}) {
  const response = await api.get(`${BASE}${path}`, config)
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

async function postMultipart(path, formData, config = {}) {
  const response = await api.post(`${BASE}${path}`, formData, config)
  const bodyData = response?.data ?? {}
  assertSuccess(bodyData, 'Request failed')
  return unwrap(bodyData)
}

export async function fetchVerificationFilterOptions(config = {}) {
  try {
    return (await post('/records/filter-options', {}, config)) || {}
  } catch (error) {
    throw toApiError(error, 'Failed to load filter options')
  }
}

export async function fetchVerificationPaymentModes(config = {}) {
  try {
    const data = await post('/payment-modes', {}, config)
    return data?.items || []
  } catch (error) {
    throw toApiError(error, 'Failed to load payment modes')
  }
}

export async function fetchVerificationCentersDropdown(config = {}) {
  try {
    const data = await getCentersDropdown()
    return normalizeCentersDropdown(data)
  } catch (error) {
    throw toApiError(error, 'Failed to load centers')
  }
}

export async function fetchVerificationList(params = {}, config = {}) {
  try {
    const data = await post('/records/list', buildVerificationListBody(params), config)
    return normalizeVerificationListResponse(data)
  } catch (error) {
    throw toApiError(error, 'Failed to load verification records')
  }
}

export async function fetchAllVerificationRecords(params = {}, config = {}) {
  const allRows = []
  let page = 1
  const limit = 100
  let totalPages = 1

  while (page <= totalPages) {
    const result = await fetchVerificationList({ ...params, page, limit }, config)
    allRows.push(...(result.items || []))
    totalPages = result.totalPages || 1
    if (page >= totalPages) break
    page += 1
  }

  return allRows
}

export async function fetchVerificationDetail(recordId, config = {}) {
  try {
    const data = await get(`/records/${encodeURIComponent(recordId)}`, config)
    return mapVerificationDetailToUi(data)
  } catch (error) {
    throw toApiError(error, 'Failed to load verification details')
  }
}

export async function approveVerificationRecord(recordId, config = {}) {
  try {
    return await put(`/records/${encodeURIComponent(recordId)}/approve`, {}, config)
  } catch (error) {
    throw toApiError(error, 'Failed to approve payment')
  }
}

export async function rejectVerificationRecord(recordId, body, config = {}) {
  try {
    return await put(
      `/records/${encodeURIComponent(recordId)}/reject`,
      {
        reason: body.reason,
        comment: body.comment,
      },
      config,
    )
  } catch (error) {
    throw toApiError(error, 'Failed to reject payment')
  }
}

export async function escalateVerificationRecord(recordId, body, config = {}) {
  try {
    return await put(
      `/records/${encodeURIComponent(recordId)}/escalate`,
      {
        reason: body.reason,
        comment: body.comment,
      },
      config,
    )
  } catch (error) {
    throw toApiError(error, 'Failed to escalate payment')
  }
}

export async function searchEligibleStudents(body = {}, config = {}) {
  try {
    const data = await post('/eligible-students', body, config)
    return data?.items || []
  } catch (error) {
    throw toApiError(error, 'Failed to search students')
  }
}

export async function fetchCoursesByCenter(centerId, config = {}) {
  try {
    const data = await post('/courses-by-center', { centerId }, config)
    return data?.items || []
  } catch (error) {
    throw toApiError(error, 'Failed to load courses')
  }
}

export async function fetchBatchesByCourse(courseId, config = {}) {
  try {
    const data = await post('/batches-by-course', { courseId }, config)
    return data?.items || []
  } catch (error) {
    throw toApiError(error, 'Failed to load batches')
  }
}

export async function fetchBatchAmounts(body = {}, config = {}) {
  try {
    return await post('/batch-amounts', body, config)
  } catch (error) {
    throw toApiError(error, 'Failed to load batch amounts')
  }
}

export async function calculateEmiPlan(body = {}, config = {}) {
  try {
    return await post('/calculate-emi', body, config)
  } catch (error) {
    throw toApiError(error, 'Failed to calculate EMI plan')
  }
}

export async function validateEmiSchedule(body = {}, config = {}) {
  try {
    return await post('/validate-schedule', body, config)
  } catch (error) {
    throw toApiError(error, 'Failed to validate EMI schedule')
  }
}

export async function submitFullPayment(formData, config = {}) {
  try {
    return await postMultipart('/submit-full-payment', formData, config)
  } catch (error) {
    throw toApiError(error, 'Failed to submit full payment')
  }
}

export async function saveEmiPlan(formData, config = {}) {
  try {
    return await postMultipart('/save-emi-plan', formData, config)
  } catch (error) {
    throw toApiError(error, 'Failed to submit EMI plan')
  }
}
