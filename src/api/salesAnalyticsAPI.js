import { isFrontendOnly } from '../config/appMode'
import api from './axiosInstance'
import {
  MOCK_LEADS,
  MOCK_DASHBOARD,
  MOCK_JOURNEY_EVENTS,
  MOCK_FUNNEL_ANALYTICS,
  MOCK_SOURCE_ANALYTICS,
  MOCK_COUNSELOR_PERFORMANCE,
  MOCK_FOLLOW_UPS,
  MOCK_PAYMENT_FAILURES,
  MOCK_TRACKING_CONFIG,
  MOCK_REPORT_TYPES,
} from '../data/salesAnalyticsMockData'

const USE_MOCK = isFrontendOnly || import.meta.env.VITE_SALES_ANALYTICS_USE_MOCK !== 'false'

let mockLeads = [...MOCK_LEADS]
let mockConfig = { ...MOCK_TRACKING_CONFIG, autoLeadRules: { ...MOCK_TRACKING_CONFIG.autoLeadRules } }

async function tryApi(fn, fallback) {
  if (USE_MOCK) return fallback()
  try {
    const res = await fn()
    const body = res.data
    return body?.data ?? body
  } catch {
    return fallback()
  }
}

export async function fetchSalesDashboard(params = {}) {
  return tryApi(
    () => api.get('/sales-analytics/dashboard', { params }),
    () => ({ ...MOCK_DASHBOARD }),
  )
}

export async function fetchSalesLeads(params = {}) {
  return tryApi(
    () => api.get('/sales-analytics/leads', { params }),
    () => {
      let list = [...mockLeads]
      if (params.counselorId) list = list.filter((l) => l.counselorId === params.counselorId)
      if (params.status) list = list.filter((l) => l.status === params.status)
      if (params.source) list = list.filter((l) => l.source === params.source)
      return { leads: list, total: list.length }
    },
  )
}

export async function fetchSalesLeadById(id) {
  return tryApi(
    () => api.get(`/sales-analytics/leads/${id}`),
    () => mockLeads.find((l) => l.id === id) || null,
  )
}

export async function updateSalesLead(id, payload) {
  return tryApi(
    () => api.patch(`/sales-analytics/leads/${id}`, payload),
    () => {
      mockLeads = mockLeads.map((l) => (l.id === id ? { ...l, ...payload } : l))
      return mockLeads.find((l) => l.id === id)
    },
  )
}

export async function fetchUserJourney(leadId) {
  return tryApi(
    () => api.get(`/sales-analytics/journey/${leadId}`),
    () => ({ events: MOCK_JOURNEY_EVENTS, leadId }),
  )
}

export async function fetchFunnelAnalytics(params = {}) {
  return tryApi(
    () => api.get('/sales-analytics/funnel', { params }),
    () => ({ ...MOCK_FUNNEL_ANALYTICS }),
  )
}

export async function fetchSourceAnalytics(params = {}) {
  return tryApi(
    () => api.get('/sales-analytics/sources', { params }),
    () => ({ sources: MOCK_SOURCE_ANALYTICS }),
  )
}

export async function fetchCounselorPerformance(params = {}) {
  return tryApi(
    () => api.get('/sales-analytics/counselors', { params }),
    () => ({ counselors: MOCK_COUNSELOR_PERFORMANCE }),
  )
}

export async function fetchFollowUps(params = {}) {
  return tryApi(
    () => api.get('/sales-analytics/follow-ups', { params }),
    () => ({ followUps: MOCK_FOLLOW_UPS }),
  )
}

export async function createFollowUp(payload) {
  return tryApi(
    () => api.post('/sales-analytics/follow-ups', payload),
    () => ({ success: true, id: `FU-${Date.now()}` }),
  )
}

export async function fetchPaymentFailures(params = {}) {
  return tryApi(
    () => api.get('/sales-analytics/payment-failures', { params }),
    () => ({ failures: MOCK_PAYMENT_FAILURES }),
  )
}

export async function fetchTrackingConfig() {
  return tryApi(
    () => api.get('/sales-analytics/tracking-config'),
    () => ({ ...mockConfig }),
  )
}

export async function updateTrackingConfig(payload) {
  return tryApi(
    () => api.put('/sales-analytics/tracking-config', payload),
    () => {
      mockConfig = { ...mockConfig, ...payload, autoLeadRules: { ...mockConfig.autoLeadRules, ...payload.autoLeadRules } }
      return mockConfig
    },
  )
}

export async function fetchReportTypes() {
  return tryApi(
    () => api.get('/sales-analytics/reports/types'),
    () => ({ types: MOCK_REPORT_TYPES }),
  )
}

export async function trackEvent(payload) {
  return tryApi(
    () => api.post('/sales-analytics/events', payload),
    () => ({ success: true, eventId: `EVT-${Date.now()}` }),
  )
}

export async function createLead(payload) {
  return tryApi(
    () => api.post('/sales-analytics/leads', payload),
    () => {
      const lead = {
        id: `LD-${1000 + mockLeads.length + 1}`,
        status: 'New Lead',
        paymentStatus: 'Pending',
        locked: false,
        createdAt: new Date().toISOString().slice(0, 10),
        lastActivity: 'Just now',
        ...payload,
      }
      mockLeads = [lead, ...mockLeads]
      return lead
    },
  )
}

export async function exportSalesReport(type, params = {}) {
  return tryApi(
    () => api.post('/sales-analytics/reports/export', { type, ...params }, { responseType: 'blob' }),
    () => ({ success: true, message: `Export queued for ${type}` }),
  )
}
