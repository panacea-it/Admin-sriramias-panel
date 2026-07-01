/**
 * GST & Invoice Settings API.
 * Contract: docs/GST_INVOICE_SETTINGS_API_GUIDE.md
 */

import api from './axiosInstance'
import { isFrontendOnly } from '../config/appMode'
import { getApiErrorMessage } from '../utils/apiError'
import { MOCK_GST_SETTINGS } from '../data/financeMockData'
import {
  buildMockPreview,
  mapDetailsToForm,
  mapFormToPayload,
  normalizeDetailsResponse,
} from '../utils/finance/gstSettingsMapper'

/** @typedef {import('../types/gstSettings.types').GstSettingsDetails} GstSettingsDetails */
/** @typedef {import('../types/gstSettings.types').GstSettingsPayload} GstSettingsPayload */
/** @typedef {import('../types/gstSettings.types').GstSettingsForm} GstSettingsForm */
/** @typedef {import('../types/gstSettings.types').GstPreview} GstPreview */

const GST_SETTINGS_BASE = '/finance/gst-settings'
const SESSION_MOCK_KEY = 'gstSettings:useMock'
const USE_MOCK_ONLY = isFrontendOnly || import.meta.env.VITE_FINANCE_USE_MOCK === 'true'

/** @type {{ globalSettings: object, branchSettings: object[], branding: object, automation: object, preview: GstPreview, updatedAt?: string }} */
let mockStore = null

let mockFallbackWarned = false
let apiMode = USE_MOCK_ONLY ? 'mock' : 'live'
/** @type {Promise<{ mode: 'live' | 'mock', probeData?: GstSettingsDetails }> | null} */
let availabilityPromise = null

function readSessionMockFlag() {
  try {
    return sessionStorage.getItem(SESSION_MOCK_KEY) === '1'
  } catch {
    return false
  }
}

function persistSessionMockFlag() {
  try {
    sessionStorage.setItem(SESSION_MOCK_KEY, '1')
  } catch {
    // ignore
  }
}

function shouldUseMock() {
  return USE_MOCK_ONLY || apiMode === 'mock' || readSessionMockFlag()
}

function warnMockFallback() {
  if (mockFallbackWarned || !import.meta.env.DEV) return
  mockFallbackWarned = true
  console.info(
    '[gst-settings] Backend routes are not available — using local mock data for this session. ' +
      'Deploy /api/finance/gst-settings on the backend, then hard-refresh to retry live API.',
  )
}

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

function shouldUseMockFallback(error) {
  const status = error?.status ?? error?.response?.status
  if (status === 404) return true
  if (status === 502 || status === 503) return true
  if (error?.code === 'ERR_NETWORK' || error?.code === 'ECONNREFUSED') return true
  if (error?.code === 'ERR_FRONTEND_ONLY') return true
  const message = String(error?.message || error?.response?.data?.message || '')
  return /route not found/i.test(message)
}

function activateMockFallback() {
  apiMode = 'mock'
  persistSessionMockFlag()
  warnMockFallback()
}

function getMockStore() {
  if (!mockStore) {
    const form = {
      ...MOCK_GST_SETTINGS,
      branchGst: [...(MOCK_GST_SETTINGS.branchGst || [])],
    }
    const payload = mapFormToPayload(form)
    mockStore = {
      ...payload,
      preview: buildMockPreview(payload),
      updatedAt: new Date().toISOString(),
    }
  }
  return mockStore
}

async function post(path, body = {}, config = {}) {
  const response = await api.post(`${GST_SETTINGS_BASE}${path}`, body, config)
  const bodyData = response?.data ?? {}
  assertSuccess(bodyData, 'Request failed')
  return /** @type {GstSettingsDetails|GstPreview} */ (unwrap(bodyData))
}

async function put(path, body = {}, config = {}) {
  const response = await api.put(`${GST_SETTINGS_BASE}${path}`, body, config)
  const bodyData = response?.data ?? {}
  assertSuccess(bodyData, 'Request failed')
  return /** @type {GstSettingsDetails} */ (unwrap(bodyData))
}

async function ensureApiAvailability(config = {}) {
  if (shouldUseMock()) return { mode: /** @type {'mock'} */ ('mock') }

  if (!availabilityPromise) {
    availabilityPromise = post('/details', {}, config)
      .then((probeData) => ({ mode: /** @type {'live'} */ ('live'), probeData: /** @type {GstSettingsDetails} */ (probeData) }))
      .catch((error) => {
        if (shouldUseMockFallback(error)) {
          activateMockFallback()
          return { mode: /** @type {'mock'} */ ('mock') }
        }
        availabilityPromise = null
        throw toApiError(error, 'Failed to reach GST settings API')
      })
  }

  return availabilityPromise
}

/**
 * @template T
 * @param {string} method
 * @param {string} path
 * @param {object} body
 * @param {{ mock: () => T, fallbackMessage: string, config?: object }} options
 */
async function tryRequest(method, path, body, { mock, fallbackMessage, config } = {}) {
  const availability = await ensureApiAvailability(config)
  if (availability.mode === 'mock') {
    return mock()
  }

  if (method === 'POST' && path === '/details' && availability.probeData !== undefined) {
    return availability.probeData
  }

  try {
    if (method === 'PUT') return await put(path, body, config)
    return await post(path, body, config)
  } catch (error) {
    if (shouldUseMockFallback(error)) {
      activateMockFallback()
      return mock()
    }
    throw toApiError(error, fallbackMessage)
  }
}

/** @returns {Promise<GstSettingsDetails>} */
export async function fetchGstSettingsDetails(config = {}) {
  const data = await tryRequest('POST', '/details', {}, {
    mock: () => normalizeDetailsResponse(getMockStore()),
    fallbackMessage: 'Failed to load GST settings',
    config,
  })
  return normalizeDetailsResponse(/** @type {GstSettingsDetails} */ (data))
}

/** @param {GstSettingsPayload} payload */
export async function previewGstSettings(payload, config = {}) {
  const data = await tryRequest('POST', '/preview', payload, {
    mock: () => buildMockPreview(payload),
    fallbackMessage: 'Failed to generate GST preview',
    config,
  })
  return /** @type {GstPreview} */ (data)
}

/** @param {GstSettingsPayload} payload */
export async function saveGstSettings(payload, config = {}) {
  const data = await tryRequest('PUT', '/save', payload, {
    mock: () => {
      const preview = buildMockPreview(payload)
      mockStore = {
        ...payload,
        preview: longPreview,
        updatedAt: new Date().toISOString(),
      }
      return mockStore
    },
    fallbackMessage: 'Failed to save GST settings',
    config,
  })
  return normalizeDetailsResponse(/** @type {GstSettingsDetails} */ (data))
}

/**
 * Legacy flat settings shape for receipt helpers and other finance modules.
 * @returns {Promise<GstSettingsForm>}
 */
export async function fetchGstSettings(config = {}) {
  const details = await fetchGstSettingsDetails(config)
  return mapDetailsToForm(details)
}

/**
 * Legacy save — accepts flat UI form and maps to API payload.
 * @param {GstSettingsForm} form
 * @returns {Promise<GstSettingsForm>}
 */
export async function updateGstSettings(form, config = {}) {
  const payload = mapFormToPayload(form)
  const saved = await saveGstSettings(payload, config)
  return mapDetailsToForm(saved)
}

export {
  mapDetailsToForm,
  mapFormToPayload,
  buildMockPreview,
  serializeFormPayload,
} from '../utils/finance/gstSettingsMapper'
