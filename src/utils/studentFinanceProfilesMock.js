/**
 * Dev fallback when /finance/student-finance routes are not deployed yet.
 * Shapes match STUDENT_FINANCE_PROFILES_API_GUIDE.md for normalize* helpers.
 */

import {
  MOCK_PAYMENT_REPORTS,
  MOCK_STUDENT_PROFILES,
  MOCK_EMI_PLANS,
  FINANCE_COURSES,
} from '../data/financeMockData'
import { ENROLLMENT_SOURCES, LOAN_STATUSES } from '../constants/studentFinanceProfiles'
import { enrichAllStudentProfiles } from './studentFinanceProfile'
import { buildDashboardBody } from './studentFinanceProfilesHelpers'

const MOCK_CENTRES = [
  { centreId: '', centreName: 'All Centres' },
  { centreId: 'ctr-delhi', centreName: 'Delhi' },
  { centreId: 'ctr-hyderabad', centreName: 'Hyderabad' },
  { centreId: 'ctr-pune', centreName: 'Pune' },
]

const CENTRE_BRANCH_HINTS = {
  'ctr-delhi': ['delhi'],
  'ctr-hyderabad': ['hyderabad'],
  'ctr-pune': ['pune'],
}

let cachedProfiles = null

function getEnrichedProfiles() {
  if (!cachedProfiles) {
    cachedProfiles = enrichAllStudentProfiles(MOCK_STUDENT_PROFILES, MOCK_PAYMENT_REPORTS, MOCK_EMI_PLANS)
  }
  return cachedProfiles
}

function mapHealthToApi(health) {
  const label = health?.label || ''
  if (label.toLowerCase().includes('fully')) return 'Fully Paid'
  if (label.toLowerCase().includes('partial')) return 'Partially Paid'
  if (label.toLowerCase().includes('high')) return 'Pending'
  return 'Partially Paid'
}

function mapProfileToApiRow(p) {
  return {
    studentId: p.id,
    studentName: p.studentName,
    profileImage: '',
    course: p.primaryCourse,
    source: p.enrollmentSourceLabel,
    totalFees: p.totalFees ?? 0,
    paidAmount: p.totalPaid ?? 0,
    pendingAmount: p.totalPending ?? 0,
    emiStatus: p.emiStatus ?? '—',
    loanStatus: p.loanStatus ?? 'Not Applied',
    wallet: p.walletBalance ?? 0,
    riskScore: p.riskScore ?? 0,
    updatedAt: p.updatedAt,
  }
}

function mapProfileToApiDetail(p) {
  return {
    studentName: p.studentName,
    studentId: p.id,
    profileImage: '',
    branch: p.branchMapped || p.branch || '—',
    counselor: p.counselorName || '—',
    financialHealth: mapHealthToApi(p.health),
    progress: p.paymentProgress ?? 0,
    cards: {
      totalFees: p.totalFees ?? 0,
      totalPaid: p.totalPaid ?? 0,
      pending: p.totalPending ?? 0,
      scholarship: { enabled: false, message: 'Coming Soon' },
      discount: p.discountAmount ?? 0,
      refund: p.refundAmount ?? 0,
      wallet: { enabled: false, message: 'Coming Soon' },
    },
    enrollmentSource: p.enrollmentSourceLabel,
    enrollmentDate: p.enrollmentDate,
  }
}

function matchesPaymentStatus(profile, status) {
  if (status === 'Paid') return (profile.totalPending ?? 0) <= 0
  if (status === 'Partial') return (profile.totalPaid ?? 0) > 0 && (profile.totalPending ?? 0) > 0
  if (status === 'Pending') return (profile.totalPaid ?? 0) <= 0 && (profile.totalPending ?? 0) > 0
  if (status === 'EMI Running') return profile.emiStatus === 'EMI Running'
  return true
}

function matchesCentre(profile, centreId) {
  if (!centreId) return true
  const hints = CENTRE_BRANCH_HINTS[centreId]
  if (!hints) return true
  const branch = String(profile.branchMapped || profile.branch || '').toLowerCase()
  return hints.some((hint) => branch.includes(hint))
}

function applyDashboardFilters(profiles, params) {
  const body = buildDashboardBody(params)
  let list = [...profiles]

  if (body.search) {
    const q = body.search.toLowerCase()
    list = list.filter(
      (p) =>
        p.studentName?.toLowerCase().includes(q) ||
        p.id?.toLowerCase().includes(q) ||
        p.primaryCourse?.toLowerCase().includes(q) ||
        p.mobile?.includes(q) ||
        p.email?.toLowerCase().includes(q),
    )
  }

  if (body.centreId) {
    list = list.filter((p) => matchesCentre(p, body.centreId))
  }

  if (body.courseId) {
    const course = FINANCE_COURSES.find((c) => c.id === body.courseId)
    const courseName = course?.name?.toLowerCase()
    list = list.filter(
      (p) =>
        p.courses?.some((c) => c.courseId === body.courseId) ||
        (courseName && p.primaryCourse?.toLowerCase().includes(courseName)),
    )
  }

  if (body.source) {
    list = list.filter((p) => p.enrollmentSourceLabel === body.source)
  }

  if (body.loanStatus) {
    list = list.filter((p) => p.loanStatus === body.loanStatus)
  }

  if (body.paymentStatus) {
    list = list.filter((p) => matchesPaymentStatus(p, body.paymentStatus))
  }

  if (body.fromDate) {
    const from = new Date(body.fromDate)
    list = list.filter((p) => p.updatedAt && new Date(p.updatedAt) >= from)
  }

  if (body.toDate) {
    const to = new Date(body.toDate)
    to.setHours(23, 59, 59, 999)
    list = list.filter((p) => p.updatedAt && new Date(p.updatedAt) <= to)
  }

  const sortKey = body.sortBy || 'lastUpdated'
  const dir = String(body.sortOrder || 'desc').toLowerCase() === 'asc' ? 1 : -1
  list.sort((a, b) => {
    if (sortKey === 'studentName') return dir * String(a.studentName).localeCompare(String(b.studentName))
    if (sortKey === 'pendingAmount') return dir * ((a.totalPending ?? 0) - (b.totalPending ?? 0))
    if (sortKey === 'riskScore') return dir * ((a.riskScore ?? 0) - (b.riskScore ?? 0))
    return dir * (new Date(a.updatedAt || 0) - new Date(b.updatedAt || 0))
  })

  return list
}

export function mockStudentFinanceFilterOptions() {
  return {
    courses: FINANCE_COURSES.map((c) => ({ courseId: c.id, courseName: c.name })),
    sources: ENROLLMENT_SOURCES.map((s) => ({ label: s.label, value: s.label })),
    loanStatuses: LOAN_STATUSES.map((s) => ({ label: s, value: s })),
    paymentStatuses: [
      { label: 'Paid', value: 'Paid' },
      { label: 'Partial', value: 'Partial' },
      { label: 'Pending', value: 'Pending' },
      { label: 'EMI Running', value: 'EMI Running' },
    ],
    centres: MOCK_CENTRES.filter((c) => c.centreId),
  }
}

export function mockStudentFinanceDashboard(params = {}) {
  const body = buildDashboardBody(params)
  const filtered = applyDashboardFilters(getEnrichedProfiles(), params)
  const page = body.page
  const limit = body.limit
  const totalCount = filtered.length
  const totalPages = Math.max(1, Math.ceil(totalCount / limit))
  const start = (page - 1) * limit
  const items = filtered.slice(start, start + limit).map(mapProfileToApiRow)

  return {
    statistics: {
      totalProfiles: totalCount,
      totalCollected: filtered.reduce((s, p) => s + (p.totalPaid ?? 0), 0),
      totalPending: filtered.reduce((s, p) => s + (p.totalPending ?? 0), 0),
      averageRiskScore: totalCount
        ? Math.round(filtered.reduce((s, p) => s + (p.riskScore ?? 0), 0) / totalCount)
        : 0,
    },
    centres: MOCK_CENTRES,
    table: {
      page,
      limit,
      totalCount,
      totalPages,
      items,
    },
  }
}

export function mockStudentFinanceProfile(studentId) {
  const profile = getEnrichedProfiles().find(
    (p) => p.id === studentId || p.id?.toLowerCase() === String(studentId).toLowerCase(),
  )
  if (!profile) return null
  return mapProfileToApiDetail(profile)
}
