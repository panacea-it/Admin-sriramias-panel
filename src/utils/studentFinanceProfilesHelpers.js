/** Student Finance Profiles — API ↔ UI mapping (integration guide §5–§12) */

import { ENROLLMENT_SOURCES, FINANCE_HEALTH_LEVELS } from '../constants/studentFinanceProfiles'
import { getEnrollmentSourceMeta } from './studentFinanceProfile'

const API_SOURCE_TO_ID = {
  Website: 'website',
  Counselor: 'counselor',
  Referral: 'referral',
  'Offline Center': 'offline_center',
}

const FINANCIAL_HEALTH_MAP = {
  'Fully Paid': FINANCE_HEALTH_LEVELS.paid,
  'Partially Paid': FINANCE_HEALTH_LEVELS.partial,
  Pending: {
    id: 'pending',
    label: 'Pending',
    color: 'from-[#df8284] to-[#b85c5e]',
    ring: 'ring-red-200',
  },
  'EMI Running': {
    id: 'emi_running',
    label: 'EMI Running',
    color: 'from-[#55ace7] to-[#246392]',
    ring: 'ring-[#55ace7]/30',
  },
}

export function mapSourceToId(source) {
  if (!source) return 'website'
  const direct = API_SOURCE_TO_ID[source]
  if (direct) return direct
  const normalized = String(source).toLowerCase().replace(/\s+/g, '_')
  if (ENROLLMENT_SOURCES.some((s) => s.id === normalized)) return normalized
  return 'website'
}

export function mapFinancialHealth(financialHealth) {
  if (!financialHealth) return FINANCE_HEALTH_LEVELS.partial
  return FINANCIAL_HEALTH_MAP[financialHealth] || {
    id: 'unknown',
    label: financialHealth,
    color: 'from-[#55ace7] to-[#246392]',
    ring: 'ring-slate-100',
  }
}

export function mapDashboardRow(item) {
  if (!item) return null
  const sourceMeta = getEnrollmentSourceMeta(mapSourceToId(item.source))
  return {
    id: item.studentId,
    studentId: item.studentId,
    studentName: item.studentName,
    profileImage: item.profileImage || '',
    primaryCourse: item.course || '—',
    enrollmentSource: sourceMeta.id,
    enrollmentSourceLabel: item.source || sourceMeta.label,
    enrollmentSourceColor: sourceMeta.color,
    totalFees: item.totalFees ?? 0,
    totalPaid: item.paidAmount ?? 0,
    totalPending: item.pendingAmount ?? 0,
    emiStatus: item.emiStatus ?? '—',
    loanStatus: item.loanStatus ?? 'Not Applied',
    walletBalance: item.wallet ?? 0,
    riskScore: item.riskScore ?? 0,
    updatedAt: item.updatedAt,
  }
}

export function mapProfileDetail(data) {
  if (!data) return null
  const sourceMeta = getEnrollmentSourceMeta(mapSourceToId(data.enrollmentSource))
  const cards = data.cards || {}
  const scholarship = cards.scholarship
  const wallet = cards.wallet

  return {
    id: data.studentId,
    studentId: data.studentId,
    studentName: data.studentName,
    profileImage: data.profileImage || '',
    branch: data.branch || '—',
    branchMapped: data.branch || '—',
    counselorName: data.counselor || '—',
    enrollmentSource: sourceMeta.id,
    enrollmentSourceLabel: data.enrollmentSource || sourceMeta.label,
    enrollmentSourceColor: sourceMeta.color,
    totalFees: cards.totalFees ?? 0,
    totalPaid: cards.totalPaid ?? 0,
    totalPending: cards.pending ?? 0,
    scholarshipAmount: scholarship?.enabled ? (cards.scholarshipAmount ?? 0) : 0,
    discountAmount: cards.discount ?? 0,
    refundAmount: cards.refund ?? 0,
    walletBalance: wallet?.enabled ? (cards.walletBalance ?? 0) : 0,
    scholarshipComingSoon: scholarship && scholarship.enabled === false,
    scholarshipMessage: scholarship?.message || 'Coming Soon',
    walletComingSoon: wallet && wallet.enabled === false,
    walletMessage: wallet?.message || 'Coming Soon',
    enrollmentDate: data.enrollmentDate,
    health: mapFinancialHealth(data.financialHealth),
    paymentProgress: data.progress ?? 0,
  }
}

export function buildDashboardBody(params = {}) {
  return {
    page: Number(params.page) || 1,
    limit: Math.min(Math.max(Number(params.limit) || 10, 1), 100),
    search: params.search ?? '',
    centreId: params.centreId ?? '',
    courseId: params.courseId ?? '',
    source: params.source ?? '',
    loanStatus: params.loanStatus ?? '',
    paymentStatus: params.paymentStatus ?? '',
    fromDate: params.fromDate ?? '',
    toDate: params.toDate ?? '',
    sortBy: params.sortBy ?? 'lastUpdated',
    sortOrder: params.sortOrder ?? 'desc',
  }
}

export function normalizeDashboardResponse(data) {
  const payload = data || {}
  const table = payload.table || {}
  const items = Array.isArray(table.items) ? table.items.map(mapDashboardRow).filter(Boolean) : []
  return {
    statistics: payload.statistics || {
      totalProfiles: 0,
      totalCollected: 0,
      totalPending: 0,
      averageRiskScore: 0,
    },
    centres: payload.centres || [],
    items,
    page: table.page ?? 1,
    limit: table.limit ?? 10,
    totalCount: table.totalCount ?? 0,
    totalPages: table.totalPages ?? 1,
  }
}

export function normalizeFilterOptions(data) {
  const payload = data || {}
  return {
    courses: payload.courses || [],
    sources: payload.sources || [],
    loanStatuses: payload.loanStatuses || [],
    paymentStatuses: payload.paymentStatuses || [],
    centres: payload.centres || [],
  }
}
