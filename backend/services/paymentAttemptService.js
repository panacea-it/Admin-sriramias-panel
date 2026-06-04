/** Payment attempt enrichment — failure mapping & analytics (backend) */

const FAILURE_KEYWORDS = [
  { pattern: /insufficient|low balance/i, category: 'Insufficient Balance' },
  { pattern: /otp|authentication failed/i, category: 'OTP Failure' },
  { pattern: /timeout|timed out/i, category: 'Gateway Timeout' },
  { pattern: /declined|rejected by bank/i, category: 'Bank Declined' },
  { pattern: /session expired/i, category: 'Session Expired' },
  { pattern: /network|connection/i, category: 'Network Failure' },
  { pattern: /cancelled|canceled/i, category: 'User Cancelled' },
  { pattern: /duplicate/i, category: 'Duplicate Attempt' },
  { pattern: /fraud|risk|suspicious/i, category: 'Fraud Suspected' },
]

function hashStr(s) {
  let h = 0
  for (let i = 0; i < String(s).length; i += 1) h = (h << 5) - h + String(s).charCodeAt(i)
  return Math.abs(h)
}

export function categorizeFailure(attempt) {
  if (attempt.status === 'Success') return { category: null, label: 'Success' }
  const text = [attempt.failureReason, attempt.gatewayResponse].filter(Boolean).join(' ')
  for (const { pattern, category } of FAILURE_KEYWORDS) {
    if (pattern.test(text)) return { category, label: category }
  }
  return { category: 'Unknown Error', label: 'Unknown Error' }
}

function deriveDevice(studentId, attemptNo) {
  const seed = hashStr(`${studentId}-${attemptNo}`)
  return {
    deviceId: `DEV-${hashStr(studentId).toString(36).slice(0, 8).toUpperCase()}`,
    browser: ['Chrome', 'Safari', 'Firefox', 'Edge'][seed % 4],
    os: ['Android 14', 'iOS 17', 'Windows 11', 'macOS Sonoma'][seed % 4],
    ipAddress: `103.${(seed % 200) + 10}.${(seed % 250) + 1}.${(seed % 200) + 10}`,
    geolocation: ['Delhi', 'Mumbai', 'Bangalore', 'Hyderabad'][seed % 4],
  }
}

function deriveFraud(device, studentId, retryCount, failureCategory) {
  const seed = hashStr(`${device.ipAddress}-${studentId}`)
  if (failureCategory === 'Fraud Suspected') return { status: 'Blocked', riskScore: 92 }
  if (seed % 17 === 0) return { status: 'Blocked', riskScore: 88 }
  if (seed % 11 === 0 || retryCount >= 4) return { status: 'Suspicious', riskScore: 70 }
  if (seed % 23 === 0) return { status: 'Under Review', riskScore: 55 }
  return { status: 'Safe', riskScore: 15 }
}

export function enrichAttemptLogs(payments, overrides = {}) {
  return payments.flatMap((p) =>
    (p.attempts || []).map((a) => {
      const key = `${p.id}-${a.attemptNo}`
      const override = overrides[key] || {}
      const failure = categorizeFailure(a)
      const device = { ...deriveDevice(p.studentId, a.attemptNo), ...(override.device || {}) }
      const retryCount = Math.max(0, (a.attemptNo || 1) - 1)
      const fraud = deriveFraud(device, p.studentId, retryCount, failure.category)
      const attempts = p.attempts || []
      const hadFailure = attempts.some((x) => x.status === 'Failed')
      const hasSuccess = attempts.some((x) => x.status === 'Success')
      let recoveryStatus = 'Not Recovered'
      if (a.status === 'Success' && hadFailure && a.attemptNo > 1) recoveryStatus = 'Recovered'
      else if (a.status === 'Failed' && hasSuccess) recoveryStatus = 'In Progress'

      return {
        id: key,
        attemptId: key,
        paymentId: p.id,
        student: p.studentName,
        studentId: p.studentId,
        mobile: p.mobile,
        email: p.email,
        course: p.courseName,
        transactionId: a.transactionId,
        attemptNo: a.attemptNo,
        gatewayStatus: a.gatewayResponse,
        gatewayProvider: p.paymentGateway || 'Razorpay',
        gatewayMessage: a.failureReason || (a.status === 'Success' ? 'Payment captured' : 'Payment failed'),
        gatewayResponse: a.gatewayResponse,
        failureCategory: failure.category,
        failureReason: failure.label,
        amount: p.totalFees,
        dateTime: a.dateTime,
        lastAttemptDate: a.dateTime,
        retryCount,
        paymentMode: a.paymentMode,
        status: a.status,
        recoveryStatus: override.recoveryStatus || recoveryStatus,
        counselorId: override.counselorId || p.counselorId,
        counselorName: override.counselorName,
        leadStatus: override.leadStatus || 'Assigned',
        device,
        fraudStatus: override.fraudStatus || fraud.status,
        ipRiskScore: override.ipRiskScore ?? fraud.riskScore,
        isBlocked: override.isBlocked ?? fraud.status === 'Blocked',
        ...override,
      }
    }),
  )
}

export function buildAttemptAnalytics(payments, overrides = {}) {
  const logs = enrichAttemptLogs(payments, overrides)
  const failed = logs.filter((l) => l.status === 'Failed')
  const recovered = logs.filter((l) => l.recoveryStatus === 'Recovered')
  const recoveryPct = failed.length ? Math.round((recovered.length / (failed.length + recovered.length)) * 100) : 0

  const byStudent = new Map()
  logs.forEach((log) => {
    const key = log.studentId
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
        course: log.course,
      })
    }
    const row = byStudent.get(key)
    if (log.status === 'Failed') row.failedAttempts += 1
    if (log.retryCount > row.retryCount) row.retryCount = log.retryCount
    if (log.status === 'Success' && log.attemptNo > 1) row.successfulRetry = true
    if (log.dateTime) row.lastRetryDate = log.dateTime
    if (log.counselorName) row.counselorAssigned = log.counselorName
  })

  const abandoned = payments
    .filter((p) => p.paymentStatus !== 'Paid')
    .map((p) => ({
      id: `ABN-${p.id}`,
      paymentId: p.id,
      student: p.studentName,
      studentId: p.studentId,
      mobile: p.mobile,
      email: p.email,
      course: p.courseName,
      amount: p.totalFees,
      stage: 'Session Timeout',
      abandonedAt: p.attempts?.[0]?.dateTime || p.paymentDate,
      recoveryStatus: 'Pending',
    }))

  return {
    logs,
    abandoned,
    retryRows: [...byStudent.values()],
    recovery: { failed: failed.length, recovered: recovered.length, recoveryPct },
    summary: {
      total: logs.length,
      failed: failed.length,
      success: logs.filter((l) => l.status === 'Success').length,
      recovered: recovered.length,
    },
  }
}

/** In-memory overrides when DB lacks extended attempt fields */
const runtimeOverrides = new Map()

export function setAttemptOverride(id, patch) {
  runtimeOverrides.set(id, { ...(runtimeOverrides.get(id) || {}), ...patch })
}

export function getAttemptOverrides() {
  return Object.fromEntries(runtimeOverrides)
}

export function clearAttemptOverride(id) {
  runtimeOverrides.delete(id)
}
