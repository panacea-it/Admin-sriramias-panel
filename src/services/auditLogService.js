import api from '../config/api'
import { throwApiError } from '../utils/apiError'

function unwrapPayload(response) {
  const body = response?.data
  if (!body?.success) {
    throwApiError(body, 'Failed to fetch audit logs')
  }
  return body.data ?? body
}

export async function fetchAuditLogs(params = {}, signal) {
  const response = await api.get('/api/operations/audit-logs', {
    params,
    signal,
  })
  const payload = unwrapPayload(response)
  return {
    rows: payload.data || [],
    pagination: payload.pagination || {
      page: 1,
      limit: 20,
      total: 0,
      totalPages: 1,
    },
  }
}

export async function fetchAuditLogFilterOptions(signal) {
  const response = await api.get('/api/operations/audit-logs/filter-options', {
    signal,
  })
  const payload = unwrapPayload(response)
  return {
    modules: payload.modules || [],
    actions: payload.actions || [],
    users: payload.users || [],
  }
}
