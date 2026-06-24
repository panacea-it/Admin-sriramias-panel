import { branchToCenterName, filterByFinanceCenters } from './financeCenterAggregation'
import { categorizePaymentFailure, parseGatewayResponse } from './paymentAttemptFailureMapping'
import { getStudentCourseFinancials } from '../data/studentCourseFeeProfiles'

function hashStr(s) {
  let h = 0
  for (let i = 0; i < s.length; i += 1) h = (h << 5) - h + s.charCodeAt(i)
  return Math.abs(h)
}

function resolveAttemptAmount(payment) {
  if (payment.totalFees != null) return payment.totalFees
  const financials = getStudentCourseFinancials(payment.studentId, payment.courseId)
  return financials?.totalCourseFee ?? 0
}

function computeRecoveryStatus(payment, attempt) {
  const attempts = payment.attempts || []
  const hadFailure = attempts.some((a) => a.status === 'Failed')
  const hasSuccess = attempts.some((a) => a.status === 'Success')
  if (attempt.status === 'Success' && hadFailure && attempt.attemptNo > 1) return 'Recovered'
  if (attempt.status === 'Failed' && hasSuccess) return 'In Progress'
  if (attempt.status === 'Failed' && !hasSuccess) return 'Not Recovered'
  if (attempt.status === 'Success' && attempt.attemptNo === 1) return 'Recovered'
  return 'Not Recovered'
}

function deriveLeadStatus(payment, recoveryStatus) {
  if (recoveryStatus === 'Recovered') return 'Recovered'
  if (payment.paymentStatus === 'Failed') {
    const seed = hashStr(payment.studentId)
    const statuses = ['Assigned', 'Contacted', 'Payment Promised', 'Follow-up Pending', 'Lost']
    return statuses[seed % statuses.length]
  }
  return 'Assigned'
}

/**
 * Enrich raw attempt log rows from payment reports with full intelligence fields.
 */
export function enrichAttemptLogsFromPayments(payments = [], overrides = {}) {
  return payments.flatMap((p) =>
    (p.attempts || []).map((a) => {
      const rowId = `${p.id}-${a.attemptNo}`
      const override = overrides[rowId] || {}
      const gatewayResponse = parseGatewayResponse(a.gatewayResponseRaw || a.gatewayResponse)
      const failure = categorizePaymentFailure({
        failureReason: a.failureReason,
        gatewayMessage: a.failureReason,
        gatewayResponse,
        errorCode: a.errorCode || gatewayResponse?.error_code,
        status: a.status,
      })
      const recoveryStatus = override.recoveryStatus || computeRecoveryStatus(p, a)
      const retryCount = Math.max(0, (a.attemptNo || 1) - 1)

      return {
        id: override.id || rowId,
        attemptId: override.attemptId || rowId,
        paymentId: p.id,
        student: p.studentName,
        studentId: p.studentId,
        mobile: p.mobile,
        email: p.email,
        course: p.courseName,
        courseId: p.courseId,
        branch: p.branch,
        centerName: p.centerName || branchToCenterName(p.branch),
        transactionId: a.transactionId,
        attemptNo: a.attemptNo,
        gatewayProvider: p.paymentGateway || 'Razorpay',
        gatewayMessage: a.failureReason || (a.status === 'Success' ? 'Payment captured' : 'Payment failed'),
        failureCategory: failure.category,
        failureReason: failure.label,
        amount: resolveAttemptAmount(p),
        dateTime: a.dateTime,
        lastAttemptDate: a.dateTime,
        retryCount,
        paymentMode: a.paymentMode,
        status: a.status,
        recoveryStatus: override.recoveryStatus || recoveryStatus,
        counselorId: override.counselorId ?? null,
        counselorName: override.counselorName ?? null,
        leadStatus: override.leadStatus || deriveLeadStatus(p, recoveryStatus),
        ...override,
      }
    }),
  )
}

/** Build abandoned checkout records from incomplete payment sessions */
export function buildAbandonedCheckouts(payments = [], overrides = {}) {
  const abandoned = []
  payments.forEach((p) => {
    if (p.paymentStatus === 'Paid') return
    const seed = hashStr(p.id)
    const stage = ['Payment Initiated', 'OTP Pending', 'Gateway Redirect', 'Confirmation Page', 'Session Timeout'][seed % 5]
    const timeSpentSec = 30 + (seed % 600)
    const id = `ABN-${p.id}`
    if (overrides[id]) {
      abandoned.push({ ...overrides[id] })
      return
    }
    abandoned.push({
      id,
      paymentId: p.id,
      student: p.studentName,
      studentId: p.studentId,
      mobile: p.mobile,
      email: p.email,
      course: p.courseName,
      amount: p.totalFees,
      stage,
      timeSpentSec,
      timeSpentLabel: timeSpentSec >= 60 ? `${Math.floor(timeSpentSec / 60)}m ${timeSpentSec % 60}s` : `${timeSpentSec}s`,
      abandonedAt: p.attempts?.[0]?.dateTime || p.paymentDate,
      recoveryStatus: seed % 3 === 0 ? 'Reminder Sent' : seed % 5 === 0 ? 'Recovered' : 'Pending',
      campaignTag: seed % 2 === 0 ? 'Recovery Q2' : 'Checkout Win-back',
      resumePaymentLink: `https://pay.sriramias.com/resume/${p.id}`,
      reminderTriggered: seed % 4 !== 0,
    })
  })
  return abandoned.filter((a) => a.stage)
}

/** Per-student retry conversion analytics */
export function buildRetryConversionRows(logs = []) {
  const byStudent = new Map()
  logs.forEach((log) => {
    const key = log.studentId || log.student
    if (!byStudent.has(key)) {
      byStudent.set(key, {
        studentId: log.studentId,
        studentName: log.student,
        mobile: log.mobile,
        email: log.email,
        failedAttempts: 0,
        successfulRetry: false,
        retryCount: 0,
        lastRetryDate: null,
        counselorAssigned: log.counselorName,
        counselorId: log.counselorId,
        retrySources: [],
        conversionTimeline: [],
        course: log.course,
      })
    }
    const row = byStudent.get(key)
    if (log.status === 'Failed') row.failedAttempts += 1
    if (log.retryCount > row.retryCount) row.retryCount = log.retryCount
    if (log.status === 'Success' && log.attemptNo > 1) row.successfulRetry = true
    if (log.dateTime && (!row.lastRetryDate || new Date(log.dateTime) > new Date(row.lastRetryDate))) {
      row.lastRetryDate = log.dateTime
    }
    if (log.retrySource) row.retrySources.push(log.retrySource)
    row.conversionTimeline.push({ date: log.dateTime, status: log.status, attemptNo: log.attemptNo })
    if (log.counselorName) row.counselorAssigned = log.counselorName
  })

  return [...byStudent.values()].map((r) => ({
    ...r,
    retrySuccessPct: r.failedAttempts
      ? Math.round((r.successfulRetry ? 1 : 0) / Math.max(r.failedAttempts, 1) * 100)
      : r.successfulRetry
        ? 100
        : 0,
    retryConversionRate: r.failedAttempts ? (r.successfulRetry ? 100 : 0) : null,
    primaryRetrySource: r.retrySources[r.retrySources.length - 1] || '—',
  }))
}

/** Recovery analytics aggregate */
export function computeRecoveryAnalytics(logs = [], payments = []) {
  const failed = logs.filter((l) => l.status === 'Failed')
  const recovered = logs.filter((l) => l.recoveryStatus === 'Recovered')
  const recoveredPayments = payments.filter((p) => {
    const attempts = p.attempts || []
    return attempts.some((a) => a.status === 'Failed') && attempts.some((a) => a.status === 'Success')
  })

  const revenueRecovered = recoveredPayments.reduce((s, p) => s + (p.amountPaid || p.totalFees || 0), 0)
  const recoveryPct = failed.length ? Math.round((recovered.length / (failed.length + recovered.length)) * 100) : 0

  const counselorPerf = {}
  recovered.forEach((l) => {
    const name = l.counselorName || 'Unassigned'
    counselorPerf[name] = (counselorPerf[name] || 0) + 1
  })
  const bestCounselor = Object.entries(counselorPerf).sort((a, b) => b[1] - a[1])[0]

  const channelPerf = { WhatsApp: 0, SMS: 0, Email: 0, 'In-app': 0, 'Counselor Call': 0 }
  recovered.forEach((l) => {
    if (l.reminderInfluence) channelPerf.WhatsApp += 1
    if (l.counselorInfluence) channelPerf['Counselor Call'] += 1
    else channelPerf.Email += 1
  })
  const bestChannel = Object.entries(channelPerf).sort((a, b) => b[1] - a[1])[0]

  const retryWindows = {}
  recovered.forEach((l) => {
    if (!l.retryCount) return
    const bucket = l.retryCount <= 1 ? '< 1 hour' : l.retryCount <= 2 ? '1–24 hours' : l.retryCount <= 3 ? '1–3 days' : '3+ days'
    retryWindows[bucket] = (retryWindows[bucket] || 0) + 1
  })
  const bestRetryWindow = Object.entries(retryWindows).sort((a, b) => b[1] - a[1])[0]

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May']
  const trend = months.map((month, i) => ({
    month,
    failed: Math.max(1, Math.round(failed.length * (0.12 + i * 0.04))),
    recovered: Math.max(0, Math.round(recovered.length * (0.08 + i * 0.06))),
    revenue: Math.round(revenueRecovered * (0.1 + i * 0.05)),
  }))

  const funnel = [
    { label: 'Failed Attempts', count: failed.length, color: '#df8284' },
    { label: 'Retry Initiated', count: logs.filter((l) => l.retryCount > 0).length, color: '#efb36d' },
    { label: 'Counselor Contact', count: logs.filter((l) => ['Contacted', 'Payment Promised'].includes(l.leadStatus)).length, color: '#55ace7' },
    { label: 'Recovered', count: recovered.length, color: '#69df66' },
  ]

  return {
    failed: failed.length,
    recovered: recovered.length,
    recoveryPct,
    revenueRecovered,
    bestCounselor: bestCounselor ? { name: bestCounselor[0], count: bestCounselor[1] } : null,
    bestChannel: bestChannel ? { name: bestChannel[0], count: bestChannel[1] } : null,
    bestRetryWindow: bestRetryWindow ? { window: bestRetryWindow[0], count: bestRetryWindow[1] } : null,
    trend,
    funnel,
    recoveredRows: recovered.map((l) => ({
      id: l.id,
      student: l.student,
      amount: l.amount,
      recoverySource: l.recoverySource || l.retrySource || 'Manual Retry',
      recoveryTime: l.retryCount <= 1 ? '< 1 hour' : l.retryCount <= 2 ? '1–24 hours' : '1–3 days',
      counselorInfluence: l.counselorInfluence,
      reminderInfluence: l.reminderInfluence,
      retryCount: l.retryCount,
      counselorName: l.counselorName,
      dateTime: l.dateTime,
    })),
  }
}

export function computeAttemptSummary(logs = []) {
  const failed = logs.filter((l) => l.status === 'Failed').length
  const success = logs.filter((l) => l.status === 'Success').length
  const recovered = logs.filter((l) => l.recoveryStatus === 'Recovered').length
  const suspicious = 0
  const abandoned = logs.filter((l) => l.status === 'Failed' && l.recoveryStatus === 'Not Recovered').length
  return { total: logs.length, failed, success, recovered, suspicious, abandoned }
}

export function buildAttemptAlerts(logs = [], abandoned = []) {
  const alerts = []

  logs.filter((l) => l.retryCount >= 3 && l.status === 'Failed').forEach((l) => {
    alerts.push({
      id: `ALT-MFA-${l.id}`,
      type: 'multiple_failed',
      severity: 'high',
      title: 'Multiple failed attempts',
      message: `${l.student} — ${l.retryCount + 1} attempts on ${l.course}`,
      timestamp: l.dateTime,
      read: false,
      rowId: l.id,
    })
  })

  logs.filter((l) => l.amount >= 50000 && l.status === 'Failed').forEach((l) => {
    alerts.push({
      id: `ALT-HV-${l.id}`,
      type: 'high_value_failed',
      severity: 'medium',
      title: 'High-value failed payment',
      message: `${l.student} — failed attempt for large amount`,
      timestamp: l.dateTime,
      read: false,
      rowId: l.id,
    })
  })

  abandoned.slice(0, 3).forEach((a) => {
    alerts.push({
      id: `ALT-ABN-${a.id}`,
      type: 'abandoned_checkout',
      severity: 'medium',
      title: 'Abandoned checkout',
      message: `${a.student} left at ${a.stage}`,
      timestamp: a.abandonedAt,
      read: false,
      rowId: a.id,
    })
  })

  logs.filter((l) => l.recoveryStatus === 'Recovered').slice(0, 2).forEach((l) => {
    alerts.push({
      id: `ALT-REC-${l.id}`,
      type: 'recovery_success',
      severity: 'low',
      title: 'Successful recovery',
      message: `${l.student} payment recovered after ${l.retryCount} retries`,
      timestamp: l.dateTime,
      read: true,
    })
  })

  return alerts.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
}

export function filterAttemptsByFinanceCenters(logs = [], centerFilter) {
  return filterByFinanceCenters(
    logs,
    centerFilter,
    (row) => row.centerName || branchToCenterName(row.branch),
  )
}

export function filterAttemptLogs(logs, filters = {}) {
  const q = (filters.search || '').trim().toLowerCase()
  return logs.filter((row) => {
    if (filters.gatewayFilter && filters.gatewayFilter !== 'all' && row.gatewayProvider !== filters.gatewayFilter) {
      return false
    }
    if (filters.failureFilter && filters.failureFilter !== 'all' && row.failureCategory !== filters.failureFilter) {
      return false
    }
    if (filters.counselorAssignmentFilter === 'assigned' && !row.counselorName) return false
    if (filters.counselorAssignmentFilter === 'unassigned' && row.counselorName) return false

    const lastAttempt = row.lastAttemptDate || row.dateTime
    if (filters.dateFrom && lastAttempt && new Date(lastAttempt) < new Date(filters.dateFrom)) return false
    if (filters.dateTo && lastAttempt && new Date(lastAttempt) > new Date(`${filters.dateTo}T23:59:59`)) {
      return false
    }

    if (!q) return true
    const attemptId = (row.attemptId || row.id || '').toLowerCase()
    const student = (row.student || '').toLowerCase()
    const mobile = (row.mobile || '').toLowerCase()
    const email = (row.email || '').toLowerCase()
    return attemptId.includes(q) || student.includes(q) || mobile.includes(q) || email.includes(q)
  })
}

export function sortAttemptLogs(logs, sortKey = 'lastAttempt', sortDir = 'desc') {
  const dir = sortDir === 'asc' ? 1 : -1
  return [...logs].sort((a, b) => {
    let av
    let bv
    switch (sortKey) {
      case 'attemptId':
        av = a.attemptId || a.id || ''
        bv = b.attemptId || b.id || ''
        break
      case 'student':
        av = a.student || ''
        bv = b.student || ''
        break
      case 'amount':
        av = a.amount ?? 0
        bv = b.amount ?? 0
        break
      case 'retryCount':
        av = a.retryCount ?? 0
        bv = b.retryCount ?? 0
        break
      case 'lastAttempt':
        av = new Date(a.lastAttemptDate || a.dateTime || 0).getTime()
        bv = new Date(b.lastAttemptDate || b.dateTime || 0).getTime()
        break
      default:
        return 0
    }
    if (typeof av === 'number' && typeof bv === 'number') return (av - bv) * dir
    return String(av).localeCompare(String(bv), undefined, { sensitivity: 'base' }) * dir
  })
}
