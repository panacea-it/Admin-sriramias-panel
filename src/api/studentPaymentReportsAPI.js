/**
 * Student Payment Reports API — POST/PUT backend integration.
 * Contract: docs/STUDENT_PAYMENT_REPORTS_FRONTEND_INTEGRATION.md
 */

import api from './axiosInstance'
import { getApiErrorMessage } from '../utils/apiError'
import {
  buildPaymentReportsListBody,
  normalizePaymentReportsListResponse,
  mapPaymentDetailToView,
  mapPaymentReportRow,
} from '../utils/studentPaymentReportsHelpers'

const REPORTS_BASE = '/finance/student-payment-reports'

function toApiError(error, fallback = 'Request failed') {
  const message = getApiErrorMessage(error, fallback)
  const err = new Error(message)
  if (error?.response?.status) err.status = error.response.status
  if (error?.response?.data) err.data = error.response.data
  return err
}

function unwrap(payload) {
  if (payload == null) return payload
  if (typeof payload === 'object' && payload.data !== undefined && ('success' in payload || 'statusCode' in payload)) {
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
  const response = await api.post(`${REPORTS_BASE}${path}`, body, config)
  const bodyData = response?.data ?? {}
  assertSuccess(bodyData, 'Request failed')
  return unwrap(bodyData)
}

async function put(path, body = {}, config = {}) {
  const response = await api.put(`${REPORTS_BASE}${path}`, body, config)
  const bodyData = response?.data ?? {}
  assertSuccess(bodyData, 'Request failed')
  return unwrap(bodyData)
}

export async function fetchStudentPaymentReportFilterOptions(config = {}) {
  try {
    const data = await post('/filter-options', {}, config)
    return data || {}
  } catch (error) {
    throw toApiError(error, 'Failed to load filter options')
  }
}

export async function fetchStudentPaymentReportsList(params = {}, config = {}) {
  try {
    const data = await post('/list', buildPaymentReportsListBody(params), config)
    return normalizePaymentReportsListResponse(data)
  } catch (error) {
    throw toApiError(error, 'Failed to load payment reports')
  }
}

export async function fetchStudentPaymentReportDetail(id, config = {}) {
  try {
    const data = await post('/detail', { id }, config)
    return mapPaymentDetailToView(data)
  } catch (error) {
    throw toApiError(error, 'Failed to load payment details')
  }
}

export async function fetchStudentPaymentCommentDetails(paymentId, config = {}) {
  try {
    return await post('/comment-details', { paymentId }, config)
  } catch (error) {
    throw toApiError(error, 'Failed to load comment details')
  }
}

export async function updateStudentPayment(paymentId, payload, config = {}) {
  try {
    const data = await put(
      '/update-payment',
      {
        paymentId,
        status: payload.status,
        paidAmount: Number(payload.paidAmount),
        reason: payload.reason,
        comment: payload.comment || '',
      },
      config,
    )
    return mapPaymentReportRow(data)
  } catch (error) {
    throw toApiError(error, 'Failed to update payment')
  }
}
