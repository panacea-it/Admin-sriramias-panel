/**
 * Payment Mode Management API.
 * Contract: docs/STUDENT_PAYMENT_REPORTS_FRONTEND_INTEGRATION.md §7
 */

import api from './axiosInstance'
import { getApiErrorMessage } from '../utils/apiError'
import {
  mapApiModeGroupsToCards,
  mapApiModeToCard,
  mapCardModeToApiForm,
} from '../utils/studentPaymentReportsHelpers'

const PAYMENT_MODES_BASE = '/finance/payment-modes'

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

function extractListPayload(response) {
  const root = response?.data ?? {}
  const summary = root.summary ?? root.data?.summary ?? { activeCount: 0, inactiveCount: 0, totalCount: 0 }
  const groups = root.groups ?? root.data?.groups ?? []
  const items = root.items ?? root.data?.items ?? []
  return { summary, groups, items, message: root.message }
}

function mapModalFilters({ search = '', category = 'all', status = 'all', sort = 'name' } = {}) {
  const categoryMap = {
    all: 'ALL',
    online: 'ONLINE',
    offline: 'OFFLINE',
    banking: 'BANKING',
    wallet: 'WALLET',
    other: 'OTHER',
  }
  const statusMap = {
    all: 'ALL',
    active: 'ACTIVE',
    inactive: 'INACTIVE',
  }
  const sortMap = {
    name: 'NAME_ASC',
    updated: 'RECENTLY_UPDATED',
  }

  return {
    search: search || '',
    category: categoryMap[category] || 'ALL',
    status: statusMap[status] || 'ALL',
    sort: sortMap[sort] || 'NAME_ASC',
  }
}

export async function fetchPaymentModesMeta(config = {}) {
  try {
    const response = await api.get(`${PAYMENT_MODES_BASE}/meta`, config)
    const body = response?.data ?? {}
    if (body.success === false) throw toApiError(body, 'Failed to load payment mode metadata')
    return unwrap(body) || {}
  } catch (error) {
    throw toApiError(error, 'Failed to load payment mode metadata')
  }
}

export async function fetchPaymentModesList(params = {}, config = {}) {
  try {
    const response = await api.post(`${PAYMENT_MODES_BASE}/list`, mapModalFilters(params), config)
    const root = response?.data ?? {}
    if (root.success === false) throw toApiError(root, 'Failed to load payment modes')
    const { summary, groups, items, message } = extractListPayload(response)
    const flatItems = groups?.length
      ? mapApiModeGroupsToCards(groups)
      : (items || []).map(mapApiModeToCard).filter(Boolean)

    return {
      summary: {
        activeCount: summary.activeCount ?? 0,
        inactiveCount: summary.inactiveCount ?? 0,
        totalCount: summary.totalCount ?? flatItems.length,
      },
      groups: groups || [],
      items: flatItems,
      message,
    }
  } catch (error) {
    throw toApiError(error, 'Failed to load payment modes')
  }
}

export async function createPaymentMode(form, config = {}) {
  try {
    const payload = mapCardModeToApiForm(form)
    const response = await api.post(`${PAYMENT_MODES_BASE}/create`, payload, config)
    const body = response?.data ?? {}
    if (body.success === false) throw toApiError(body, 'Failed to create payment mode')
    return mapApiModeToCard(unwrap(body))
  } catch (error) {
    throw toApiError(error, 'Failed to create payment mode')
  }
}

export async function updatePaymentMode(form, existing, config = {}) {
  try {
    const payload = mapCardModeToApiForm(form, existing)
    const response = await api.put(`${PAYMENT_MODES_BASE}/update`, payload, config)
    const body = response?.data ?? {}
    if (body.success === false) throw toApiError(body, 'Failed to update payment mode')
    return mapApiModeToCard(unwrap(body))
  } catch (error) {
    throw toApiError(error, 'Failed to update payment mode')
  }
}

export async function changePaymentModeStatus(paymentModeId, isActive, config = {}) {
  try {
    const response = await api.patch(
      `${PAYMENT_MODES_BASE}/change-status`,
      { paymentModeId, isActive },
      config,
    )
    const body = response?.data ?? {}
    if (body.success === false) throw toApiError(body, 'Failed to update payment mode status')
    return unwrap(body)
  } catch (error) {
    throw toApiError(error, 'Failed to update payment mode status')
  }
}

export async function savePaymentModeSettings(updates = [], config = {}) {
  try {
    const response = await api.post(
      `${PAYMENT_MODES_BASE}/save-settings`,
      { updates },
      config,
    )
    const body = response?.data ?? {}
    if (body.success === false) throw toApiError(body, 'Failed to save payment mode settings')
    return unwrap(body)
  } catch (error) {
    throw toApiError(error, 'Failed to save payment mode settings')
  }
}

export async function deletePaymentMode(paymentModeId, config = {}) {
  try {
    const response = await api.delete(`${PAYMENT_MODES_BASE}/delete`, {
      ...config,
      data: { paymentModeId },
    })
    const body = response?.data ?? {}
    if (body.success === false) throw toApiError(body, 'Failed to delete payment mode')
    return unwrap(body)
  } catch (error) {
    throw toApiError(error, 'Failed to delete payment mode')
  }
}
