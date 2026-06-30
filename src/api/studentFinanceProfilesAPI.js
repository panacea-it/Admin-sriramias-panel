/**
 * Student Finance Profiles API — POST backend integration.
 * Contract: docs/STUDENT_FINANCE_PROFILES_API_GUIDE.md
 */

import api from './axiosInstance'
import { isFrontendOnly } from '../config/appMode'
import { getApiErrorMessage } from '../utils/apiError'
import {
  buildDashboardBody,
  normalizeDashboardResponse,
  normalizeFilterOptions,
  mapProfileDetail,
} from '../utils/studentFinanceProfilesHelpers'
import {
  mockStudentFinanceFilterOptions,
  mockStudentFinanceDashboard,
  mockStudentFinanceProfile,
} from '../utils/studentFinanceProfilesMock'

const FINANCE_BASE = '/finance/student-finance'
const SESSION_MOCK_KEY = 'studentFinance:useMock'
const USE_MOCK_ONLY = isFrontendOnly || import.meta.env.VITE_FINANCE_USE_MOCK === 'true'

let mockFallbackWarned = false
let apiMode = USE_MOCK_ONLY ? 'mock' : 'live'
/** @type {Promise<{ mode: 'live' | 'mock', probeData?: unknown }> | null} */
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
    '[student-finance] Backend routes are not available — using local mock data for this session. ' +
      'Deploy /api/finance/student-finance on the backend, then hard-refresh to retry live API.',
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
    const err = toApiError(body, body.message || fallback)
    if (body.statusCode === 11003 || /route not found/i.test(body.message || '')) {
      err.status = 404
    }
    throw err
  }
}

function shouldUseMockFallback(error) {
  const status = error?.status ?? error?.response?.status
  if (status === 404) return true
  if (status === 502 || status === 503) return true
  if (error?.code === 'ERR_NETWORK' || error?.code === 'ECONNREFUSED') return true
  const message = String(error?.message || error?.response?.data?.message || '')
  return /route not found/i.test(message)
}

function activateMockFallback() {
  apiMode = 'mock'
  persistSessionMockFlag()
  warnMockFallback()
}

async function post(path, body = {}, config = {}) {
  const response = await api.post(`${FINANCE_BASE}${path}`, body, config)
  const bodyData = response?.data ?? {}
  assertSuccess(bodyData, 'Request failed')
  return unwrap(bodyData)
}

/**
 * One shared probe per session — avoids repeated 404s when backend routes are missing.
 */
async function ensureApiAvailability(config = {}) {
  if (shouldUseMock()) return { mode: 'mock' }

  if (!availabilityPromise) {
    availabilityPromise = post('/filter-options', {}, config)
      .then((probeData) => ({ mode: 'live', probeData }))
      .catch((error) => {
        if (shouldUseMockFallback(error)) {
          activateMockFallback()
          return { mode: 'mock' }
        }
        availabilityPromise = null
        throw toApiError(error, 'Failed to reach student finance API')
      })
  }

  return availabilityPromise
}

async function tryPost(path, body, { mock, fallbackMessage, config } = {}) {
  const availability = await ensureApiAvailability(config)
  if (availability.mode === 'mock') {
    return mock()
  }

  if (path === '/filter-options' && availability.probeData !== undefined) {
    return availability.probeData
  }

  try {
    return await post(path, body, config)
  } catch (error) {
    if (shouldUseMockFallback(error)) {
      activateMockFallback()
      return mock()
    }
    throw toApiError(error, fallbackMessage)
  }
}

export async function fetchStudentFinanceFilterOptions(config = {}) {
  const data = await tryPost('/filter-options', {}, {
    mock: mockStudentFinanceFilterOptions,
    fallbackMessage: 'Failed to load filter options',
    config,
  })
  return normalizeFilterOptions(data)
}

export async function fetchStudentFinanceDashboard(params = {}, config = {}) {
  const body = buildDashboardBody(params)
  const data = await tryPost('/dashboard', body, {
    mock: () => mockStudentFinanceDashboard(params),
    fallbackMessage: 'Failed to load student finance profiles',
    config,
  })
  return normalizeDashboardResponse(data)
}

export async function fetchStudentFinanceProfile(studentId, config = {}) {
  const data = await tryPost('/profile', { studentId }, {
    mock: () => mockStudentFinanceProfile(studentId),
    fallbackMessage: 'Failed to load finance profile',
    config,
  })
  if (!data) {
    const err = new Error('Finance profile not found for this student')
    err.status = 404
    throw err
  }
  return mapProfileDetail(data)
}

/** Clears cached mock fallback (e.g. after backend deploy + page refresh). */
export function resetStudentFinanceApiAvailability() {
  apiMode = USE_MOCK_ONLY ? 'mock' : 'live'
  availabilityPromise = null
  try {
    sessionStorage.removeItem(SESSION_MOCK_KEY)
  } catch {
    // ignore
  }
}
