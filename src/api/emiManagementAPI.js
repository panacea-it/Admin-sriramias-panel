/**
 * EMI Management API
 * Contract: docs/EMI_MANAGEMENT_FRONTEND_API_GUIDE.md
 */

import api from './axiosInstance'
import { getApiErrorMessage } from '../utils/apiError'
import {
  buildDashboardBody,
  mapEmiDetailsToPlan,
  normalizeDashboardResponse,
} from '../utils/emiManagementHelpers'

const BASE = '/finance/emi-management'

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

async function postMultipart(path, formData, config = {}) {
  const response = await api.post(`${BASE}${path}`, formData, config)
  const bodyData = response?.data ?? {}
  assertSuccess(bodyData, 'Request failed')
  return unwrap(bodyData)
}

export async function fetchEmiFilterOptions(config = {}) {
  try {
    return (await post('/filter-options', {}, config)) || {}
  } catch (error) {
    throw toApiError(error, 'Failed to load EMI filter options')
  }
}

export async function fetchEmiDashboard(params = {}, config = {}) {
  try {
    const data = await post('/dashboard', buildDashboardBody(params), config)
    return normalizeDashboardResponse(data)
  } catch (error) {
    throw toApiError(error, 'Failed to load EMI dashboard')
  }
}

export async function fetchEmiDetails(emiPlanId, config = {}) {
  try {
    const data = await post('/details', { emiPlanId }, config)
    return mapEmiDetailsToPlan(data)
  } catch (error) {
    throw toApiError(error, 'Failed to load EMI details')
  }
}

export async function customizeEmiInstallment(body, config = {}) {
  try {
    const data = await put('/customize-installment', body, config)
    return mapEmiDetailsToPlan(data)
  } catch (error) {
    throw toApiError(error, 'Failed to customize installment')
  }
}

export async function payEmiInstallment(formData, config = {}) {
  try {
    return await postMultipart('/pay-installment', formData, config)
  } catch (error) {
    throw toApiError(error, 'Failed to record installment payment')
  }
}

export async function closeEmiPlan(formData, config = {}) {
  try {
    return await postMultipart('/close-emi', formData, config)
  } catch (error) {
    throw toApiError(error, 'Failed to close EMI plan')
  }
}

export async function closeEmiPlanLegacy(formData, config = {}) {
  try {
    const response = await api.put(`${BASE}/close`, formData, config)
    const bodyData = response?.data ?? {}
    assertSuccess(bodyData, 'Request failed')
    return unwrap(bodyData)
  } catch (error) {
    throw toApiError(error, 'Failed to close EMI plan')
  }
}

export async function addEmiInstallment(emiPlanId, config = {}) {
  try {
    const data = await put('/add-installment', { emiPlanId }, config)
    return mapEmiDetailsToPlan(data)
  } catch (error) {
    throw toApiError(error, 'Failed to add installment')
  }
}

export async function removeEmiInstallment(emiPlanId, installmentId, config = {}) {
  try {
    const data = await del('/remove-installment', { emiPlanId, installmentId }, config)
    return mapEmiDetailsToPlan(data)
  } catch (error) {
    throw toApiError(error, 'Failed to remove installment')
  }
}

export async function assignEmiCounselor(body, config = {}) {
  try {
    return await post('/assign-counsellor', body, config)
  } catch (error) {
    throw toApiError(error, 'Failed to assign counselor')
  }
}

export async function sendEmiReminder(emiPlanId, installmentId, config = {}) {
  try {
    return await post('/send-reminder', { emiPlanId, installmentId }, config)
  } catch (error) {
    throw toApiError(error, 'Failed to send reminder')
  }
}

export async function settleEmiPlan(formData, config = {}) {
  try {
    return await postMultipart('/settle', formData, config)
  } catch (error) {
    throw toApiError(error, 'Failed to settle EMI plan')
  }
}

export async function saveEmiPlanLegacy(body, config = {}) {
  try {
    const data = await put('/save', body, config)
    return mapEmiDetailsToPlan(data) || data
  } catch (error) {
    throw toApiError(error, 'Failed to save EMI plan')
  }
}

export async function uploadEmiProof(formData, config = {}) {
  try {
    return await postMultipart('/upload-proof', formData, config)
  } catch (error) {
    throw toApiError(error, 'Failed to upload payment proof')
  }
}

export { buildDashboardBody, mapEmiDetailsToPlan, normalizeDashboardResponse }
