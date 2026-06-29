import axiosInstance from '../api/axiosInstance'
import { getApiErrorMessage } from '../utils/apiError'

const BASE = '/test-management'

function hasActiveFilters(filters = {}) {
  return Object.values(filters).some(
    (value) => value !== null && value !== undefined && value !== '',
  )
}

function unwrapDashboardPayload(payload) {
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

/**
 * POST /api/test-management/dashboard
 * POST /api/test-management/dashboard/filter
 * @param {Record<string, unknown>} [filters]
 * @param {{ signal?: AbortSignal }} [config]
 */
export async function fetchTestManagementDashboard(filters = {}, config = {}) {
  const url = hasActiveFilters(filters)
    ? `${BASE}/dashboard/filter`
    : `${BASE}/dashboard`

  try {
    const { data } = await axiosInstance.post(url, filters, config)
    return unwrapDashboardPayload(data)
  } catch (error) {
    if (error?.name === 'CanceledError' || error?.code === 'ERR_CANCELED') {
      throw error
    }
    const message = getApiErrorMessage(error, 'Unable to load dashboard.')
    const err = new Error(message)
    if (error?.response?.status) err.status = error.response.status
    throw err
  }
}
