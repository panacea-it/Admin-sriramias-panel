import { enrichFinanceRecord } from './financeRecordModel'
import { normalizePaymentModeLabel } from './finance/paymentModeUtils'

function matchesSearch(row, filters) {
  const q = filters.search?.trim().toLowerCase()
  if (q) {
    const hay = [
      row.studentName,
      row.studentId,
      row.enrollmentNumber,
      row.courseName,
      row.transactionId,
      row.receiptNumber,
      row.mobile,
      row.email,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()
    if (!hay.includes(q)) return false
  }

  const fieldChecks = [
    ['mobile', filters.mobile],
    ['email', filters.email],
    ['enrollmentNumber', filters.enrollmentNumber],
    ['receiptNumber', filters.receiptNumber],
    ['transactionId', filters.transactionId],
  ]

  for (const [key, val] of fieldChecks) {
    const needle = val?.trim()
    if (!needle) continue
    const haystack = String(row[key] ?? '').toLowerCase()
    if (!haystack.includes(needle.toLowerCase())) return false
  }

  return true
}

export function filterPaymentReports(rows, filters = {}) {
  if (!Array.isArray(rows)) return []
  return rows.filter((row) => {
    if (!row) return false
    const r = enrichFinanceRecord(row)
    if (filters.paymentStatus && filters.paymentStatus !== 'all') {
      const status = r.paymentStatus
      if (filters.paymentStatus === 'Partial' && status !== 'Partially Paid' && status !== 'Partial') return false
      if (filters.paymentStatus !== 'Partial' && status !== filters.paymentStatus) return false
    }
    if (filters.refundStatus && filters.refundStatus !== 'all' && r.refundStatus !== filters.refundStatus) {
      return false
    }
    if (filters.accessStatus && filters.accessStatus !== 'all' && r.accessStatus !== filters.accessStatus) {
      return false
    }
    if (filters.paymentGateway && filters.paymentGateway !== 'all' && r.paymentGateway !== filters.paymentGateway) {
      return false
    }
    if (filters.verificationStatus && filters.verificationStatus !== 'all' && r.verificationStatus !== filters.verificationStatus) {
      return false
    }
    if (filters.emiStatus && filters.emiStatus !== 'all' && r.emiStatus !== filters.emiStatus) {
      return false
    }
    if (filters.centerName && filters.centerName !== 'all' && r.centerName !== filters.centerName) {
      return false
    }
    if (filters.batchId && filters.batchId !== 'all' && r.batchId !== filters.batchId) {
      return false
    }
    if (filters.state && filters.state !== 'all' && r.state !== filters.state) {
      return false
    }
    if (filters.paymentType && filters.paymentType !== 'all' && row.paymentType !== filters.paymentType) {
      return false
    }
    if (filters.paymentMode && filters.paymentMode !== 'all') {
      const rowMode = normalizePaymentModeLabel(row.paymentMode)
      const filterMode = normalizePaymentModeLabel(filters.paymentMode)
      if (rowMode !== filterMode) return false
    }
    if (filters.courseType && filters.courseType !== 'all' && row.courseType !== filters.courseType) {
      return false
    }
    if (filters.courseId && filters.courseId !== 'all' && row.courseId !== filters.courseId) {
      return false
    }
    if (filters.branch && filters.branch !== 'all') {
      const branches = Array.isArray(filters.branch) ? filters.branch : [filters.branch]
      if (!branches.includes(r.branch)) return false
    }
    if (filters.studentId?.trim() && !row.studentId.toLowerCase().includes(filters.studentId.trim().toLowerCase())) {
      return false
    }
    if (filters.studentName?.trim() && !row.studentName.toLowerCase().includes(filters.studentName.trim().toLowerCase())) {
      return false
    }
    if (!matchesSearch(r, filters)) return false
    if (filters.dateFrom && row.paymentDate) {
      if (new Date(row.paymentDate) < new Date(filters.dateFrom)) return false
    }
    if (filters.dateTo && row.paymentDate) {
      if (new Date(row.paymentDate) > new Date(`${filters.dateTo}T23:59:59`)) return false
    }
    return true
  })
}

export function sortRows(rows, sortKey, direction = 'asc') {
  if (!sortKey) return rows
  const mult = direction === 'desc' ? -1 : 1
  return [...rows].sort((a, b) => {
    const av = a[sortKey] ?? ''
    const bv = b[sortKey] ?? ''
    if (typeof av === 'number' && typeof bv === 'number') return (av - bv) * mult
    return String(av).localeCompare(String(bv)) * mult
  })
}

export function formatINR(amount) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount ?? 0)
}

export const DEFAULT_PAYMENT_REPORT_FILTERS = {
  paymentStatus: 'all',
  paymentType: 'all',
  paymentMode: 'all',
  courseId: 'all',
  centerName: 'all',
  batchId: 'all',
  branch: 'all',
  verificationStatus: 'all',
  refundStatus: 'all',
  accessStatus: 'all',
  paymentGateway: 'all',
  dateFrom: '',
  dateTo: '',
  studentId: '',
  mobile: '',
  email: '',
  enrollmentNumber: '',
  receiptNumber: '',
  transactionId: '',
}
