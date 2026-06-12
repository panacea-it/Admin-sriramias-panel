import { FINANCE_MOCK_COUNSELORS } from '../constants/financeConstants'
import { branchToCenterName, filterByFinanceCenters } from './financeCenterAggregation'
import { categorizePaymentFailure, parseGatewayResponse } from './paymentAttemptFailureMapping'

const BROWSERS = ['Chrome', 'Safari', 'Firefox', 'Edge']
const OS_LIST = ['Android 14', 'iOS 17', 'Windows 11', 'macOS Sonoma']
const CITIES = ['Delhi', 'Mumbai', 'Bangalore', 'Hyderabad', 'Chennai', 'Pune']

function hashStr(s) {
  let h = 0
  for (let i = 0; i < s.length; i += 1) h = (h << 5) - h + s.charCodeAt(i)
  return Math.abs(h)
}

function pick(arr, seed) {
  return arr[seed % arr.length]
}

function deriveDeviceInfo(studentId, attemptNo) {
  const seed = hashStr(`${studentId}-${attemptNo}`)
  const ip = `103.${(seed % 200) + 10}.${(seed % 250) + 1}.${(seed % 200) + 10}`
  return {
    deviceId: `DEV-${hashStr(studentId).toString(36).slice(0, 8).toUpperCase()}`,
    browser: pick(BROWSERS, seed),
    os: pick(OS_LIST, seed + 1),
    ipAddress: ip,
    geolocation: pick(CITIES, seed + 2),
    userAgent: `${pick(BROWSERS, seed)}/${pick(OS_LIST, seed + 1)}`,
  }
}

function deriveFraudStatus(device, studentId, retryCount, failureCategory) {
  const seed = hashStr(`${device.ipAddress}-${studentId}`)
  if (failureCategory === 'Fraud Suspected') return { status: 'Blocked', riskScore: 92 }
  if (seed % 17 === 0) return { status: 'Blocked', riskScore: 88 }
  if (seed % 11 === 0 || retryCount >= 4) return { status: 'Suspicious', riskScore: 65 + (seed % 20) }
  if (seed % 23 === 0) return { status: 'Under Review', riskScore: 55 }
  return { status: 'Safe', riskScore: 10 + (seed % 15) }
}

function counselorForPayment(payment, attemptIdx) {
  const cid = payment.counselorId || `c${(hashStr(payment.studentId) % 4) + 1}`
  const meta = FINANCE_MOCK_COUNSELORS.find((c) => c.id === cid)
  return { counselorId: cid, counselorName: meta?.name || 'Unassigned' }
}

function buildTimeline(payment, attempt, failureCategory) {
  const events = [
    { step: 'Payment initiated', status: 'completed', timestamp: attempt.dateTime, detail: `${payment.courseName} · ${attempt.paymentMode}`, source: 'Student' },
  ]
  if (attempt.attemptNo > 1) {
    events.unshift({
      step: 'Retry attempted',
      status: 'pending',
      timestamp: attempt.dateTime,
      detail: `Attempt #${attempt.attemptNo}`,
      source: attempt.retrySource || 'Auto Retry',
    })
  }
  if (failureCategory === 'OTP Failure') {
    events.push({ step: 'OTP entered', status: 'failed', timestamp: attempt.dateTime, detail: 'OTP verification failed', source: 'Gateway' })
  }
  events.push({
    step: attempt.status === 'Success' ? 'Payment successful' : 'Failure occurred',
    status: attempt.status === 'Success' ? 'completed' : 'failed',
    timestamp: attempt.dateTime,
    detail: failureCategory || attempt.failureReason || attempt.gatewayResponse,
    source: 'Gateway',
  })
  if (payment.counselorId) {
    events.push({
      step: 'Counselor assigned',
      status: 'completed',
      timestamp: attempt.dateTime,
      detail: counselorForPayment(payment).counselorName,
      source: 'System',
    })
  }
  return events
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
      const override = overrides[`${p.id}-${a.attemptNo}`] || {}
      const device = { ...deriveDeviceInfo(p.studentId, a.attemptNo), ...(override.device || {}) }
      const gatewayResponse = parseGatewayResponse(a.gatewayResponseRaw || a.gatewayResponse)
      const failure = categorizePaymentFailure({
        failureReason: a.failureReason,
        gatewayMessage: a.failureReason,
        gatewayResponse,
        errorCode: a.errorCode || gatewayResponse?.error_code,
        status: a.status,
      })
      const fraud = deriveFraudStatus(device, p.studentId, Math.max(0, (a.attemptNo || 1) - 1), failure.category)
      const counselor = counselorForPayment(p, a.attemptNo)
      const recoveryStatus = override.recoveryStatus || computeRecoveryStatus(p, a)
      const retryCount = Math.max(0, (a.attemptNo || 1) - 1)

      return {
        id: override.id || `${p.id}-${a.attemptNo}`,
        attemptId: override.id || `${p.id}-${a.attemptNo}`,
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
        gatewayStatus: a.gatewayResponse,
        gatewayProvider: p.paymentGateway || 'Razorpay',
        gatewayMessage: a.failureReason || (a.status === 'Success' ? 'Payment captured' : 'Payment failed'),
        gatewayResponse,
        gatewayResponseRaw: typeof a.gatewayResponse === 'string' ? a.gatewayResponse : JSON.stringify(gatewayResponse),
        errorCode: a.errorCode || gatewayResponse?.error_code || null,
        failureCategory: failure.category,
        failureReason: failure.label,
        amount: p.totalFees,
        dateTime: a.dateTime,
        lastAttemptDate: a.dateTime,
        retryCount,
        retrySource: a.retrySource || (retryCount > 0 ? ['Auto Retry', 'Manual Retry', 'Reminder Link', 'Counselor Link'][retryCount % 4] : null),
        paymentMode: a.paymentMode,
        status: a.status,
        recoveryStatus: override.recoveryStatus || recoveryStatus,
        counselorId: override.counselorId || counselor.counselorId,
        counselorName: override.counselorName || counselor.counselorName,
        leadStatus: override.leadStatus || deriveLeadStatus(p, recoveryStatus),
        recoveryProbability: recoveryStatus === 'Recovered' ? 100 : Math.max(15, 85 - retryCount * 12 - (fraud.riskScore > 60 ? 20 : 0)),
        device,
        fraudStatus: override.fraudStatus || fraud.status,
        ipRiskScore: override.ipRiskScore ?? fraud.riskScore,
        isBlocked: override.isBlocked ?? fraud.status === 'Blocked',
        timeline: buildTimeline(p, a, failure.category),
        communications: override.communications || [],
        recoverySource: recoveryStatus === 'Recovered' ? (a.retrySource || 'Manual Retry') : null,
        reminderInfluence: recoveryStatus === 'Recovered' && retryCount > 0,
        counselorInfluence: recoveryStatus === 'Recovered' && !!p.counselorId,
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
    const device = deriveDeviceInfo(p.studentId, 0)
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
      device,
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
  const suspicious = logs.filter((l) => l.fraudStatus === 'Suspicious' || l.fraudStatus === 'Blocked').length
  const abandoned = logs.filter((l) => l.status === 'Failed' && l.recoveryStatus === 'Not Recovered').length
  return { total: logs.length, failed, success, recovered, suspicious, abandoned }
}

export function buildAttemptAlerts(logs = [], abandoned = []) {
  const alerts = []
  const byIp = {}
  logs.forEach((l) => {
    const ip = l.device?.ipAddress
    if (!ip) return
    byIp[ip] = (byIp[ip] || 0) + 1
  })

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

  Object.entries(byIp).filter(([, count]) => count >= 4).forEach(([ip]) => {
    alerts.push({
      id: `ALT-IP-${ip}`,
      type: 'suspicious_ip',
      severity: 'high',
      title: 'Suspicious IP activity',
      message: `IP ${ip} used in ${byIp[ip]} payment attempts`,
      timestamp: new Date().toISOString(),
      read: false,
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
    if (filters.statusFilter && filters.statusFilter !== 'all' && row.status !== filters.statusFilter) return false
    if (filters.modeFilter && filters.modeFilter !== 'all' && row.paymentMode !== filters.modeFilter) return false
    if (filters.gatewayFilter && filters.gatewayFilter !== 'all' && row.gatewayProvider !== filters.gatewayFilter && row.gatewayStatus !== filters.gatewayFilter) return false
    if (filters.failureFilter && filters.failureFilter !== 'all' && row.failureCategory !== filters.failureFilter) return false
    if (filters.recoveryFilter && filters.recoveryFilter !== 'all' && row.recoveryStatus !== filters.recoveryFilter) return false
    if (filters.fraudFilter && filters.fraudFilter !== 'all' && row.fraudStatus !== filters.fraudFilter) return false
    if (filters.fraudOnly && row.fraudStatus === 'Safe') return false
    if (filters.dateFrom && row.dateTime && new Date(row.dateTime) < new Date(filters.dateFrom)) return false
    if (filters.dateTo && row.dateTime && new Date(row.dateTime) > new Date(`${filters.dateTo}T23:59:59`)) return false
    if (!q) return true
    return `${row.student} ${row.mobile} ${row.email} ${row.transactionId} ${row.course} ${row.id}`.toLowerCase().includes(q)
  })
}
