import { isFrontendOnly } from '../config/appMode'
import api from './axiosInstance'
import {
  MOCK_PAYMENT_REPORTS,
  MOCK_PAYMENTS_ENRICHED,
  MOCK_OFFLINE_REQUESTS,
  MOCK_EMI_PLANS,
  MOCK_STUDENT_PROFILES,
  MOCK_COMMUNICATION_LOGS,
  MOCK_COMMUNICATION_TEMPLATES,
  MOCK_COMMUNICATION_AUTOMATION_RULES,
  MOCK_GST_SETTINGS,
  DEFAULT_EMI_MGMT_SETTINGS,
  buildFinanceDashboardPayload,
} from '../data/financeMockData'
import { generateLoanEmiSchedule } from '../utils/emiManagement'
import { INITIAL_VERIFICATION_QUEUE } from '../data/financeVerificationData'
import { FINANCE_DEFAULT_PAYMENT_MODE_SETTINGS } from '../constants/financeConstants'
import { enrichFinanceRows } from '../utils/financeRecordModel'
import { enrichAllStudentProfiles } from '../utils/studentFinanceProfile'
import {
  detectDuplicates,
  enrichVerificationRow,
  validateRejectionRemarks,
} from '../utils/financeVerificationWorkflow'
import {
  enrichAttemptLogsFromPayments,
  buildAbandonedCheckouts,
  buildRetryConversionRows,
  computeRecoveryAnalytics,
  computeAttemptSummary,
  buildAttemptAlerts,
} from '../utils/paymentAttemptAnalytics'
import {
  filterCompletedReceipts,
  mapReceiptCenterRow,
  ensureReceiptOnRecord,
  shouldAutoGenerateReceipt,
} from '../utils/receiptCompletion'
import {
  buildCommunicationAlerts,
} from '../utils/paymentCommunicationAnalytics'
import {
  appendOfflineAudit,
  buildDailyOfflineSummary,
  computeCashReconciliation,
  enrichOfflineApprovalRow,
  resolveBranchCode,
} from '../utils/offlinePaymentApproval'

const USE_MOCK = isFrontendOnly || import.meta.env.VITE_FINANCE_USE_MOCK !== 'false'

let mockReports = enrichFinanceRows([...MOCK_PAYMENTS_ENRICHED])
let mockVerificationQueue = JSON.parse(JSON.stringify(INITIAL_VERIFICATION_QUEUE))
let mockOffline = [...MOCK_OFFLINE_REQUESTS]
let mockEmi = JSON.parse(JSON.stringify(MOCK_EMI_PLANS))
let mockGst = { ...MOCK_GST_SETTINGS, branchGst: [...MOCK_GST_SETTINGS.branchGst] }
let mockComm = JSON.parse(JSON.stringify(MOCK_COMMUNICATION_LOGS))
let mockCommTemplates = JSON.parse(JSON.stringify(MOCK_COMMUNICATION_TEMPLATES))
let mockCommRules = JSON.parse(JSON.stringify(MOCK_COMMUNICATION_AUTOMATION_RULES))
let mockCommAlertRead = new Set()
let mockVerificationNotifications = []
let mockEmiSettings = JSON.parse(JSON.stringify(DEFAULT_EMI_MGMT_SETTINGS))
let mockEmiReminderLogs = []
let mockPaymentModeSettings = JSON.parse(JSON.stringify(FINANCE_DEFAULT_PAYMENT_MODE_SETTINGS))
let mockAttemptOverrides = {}
let mockAbandonedOverrides = {}
let mockAttemptAlertRead = new Set()
let mockOfflineNotifications = []

function buildMockAttemptLogs() {
  return enrichAttemptLogsFromPayments(MOCK_PAYMENT_REPORTS, mockAttemptOverrides)
}

function buildMockAttemptAnalytics() {
  const logs = buildMockAttemptLogs()
  const abandoned = buildAbandonedCheckouts(MOCK_PAYMENT_REPORTS, mockAbandonedOverrides)
  const retryRows = buildRetryConversionRows(logs)
  const recovery = computeRecoveryAnalytics(logs, MOCK_PAYMENT_REPORTS)
  const summary = computeAttemptSummary(logs)
  const alerts = buildAttemptAlerts(logs, abandoned).map((a) => ({
    ...a,
    read: a.read || mockAttemptAlertRead.has(a.id),
  }))
  return { logs, abandoned, retryRows, recovery, summary, alerts }
}

function getExistingPaymentsForDuplicateCheck() {
  return mockReports.map((r) => ({
    id: r.id,
    studentId: r.studentId,
    student: r.studentName,
    studentName: r.studentName,
    utrNumber: r.utrNumber || r.transactionId,
    transactionId: r.transactionId,
    amount: r.amountPaid ?? r.amount,
    paymentDate: r.paymentDate,
    submittedAt: r.paymentDate,
    verificationStatus: r.verificationStatus,
    approvalStatus: r.approvalStatus || 'Approved',
  }))
}

function enrichVerificationQueue(queue = mockVerificationQueue) {
  const existing = getExistingPaymentsForDuplicateCheck()
  return detectDuplicates(
    queue.map((row) => enrichVerificationRow(row, { existingPayments: existing })),
    existing,
  )
}

function updateQueueRow(id, updater) {
  mockVerificationQueue = mockVerificationQueue.map((r) => (r.id === id ? updater(r) : r))
  return mockVerificationQueue.find((r) => r.id === id)
}

function appendVerificationNotification(row, { channel, statusUpdate, message, adminName }) {
  const entry = {
    id: `VNOTIF-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    paymentId: row.id,
    studentName: row.student,
    channel,
    statusUpdate,
    message,
    read: false,
    timestamp: new Date().toISOString(),
    triggeredBy: adminName || 'System',
  }
  mockVerificationNotifications = [entry, ...mockVerificationNotifications]
  if (channel === 'Email' || channel === 'SMS') {
    mockComm.unshift({
      id: entry.id,
      recipient: row.student,
      type: 'Verification Update',
      channel,
      status: channel === 'Email' ? 'Email trigger placeholder' : 'SMS trigger placeholder',
      timestamp: entry.timestamp,
    })
  }
  return entry
}

function pushNotificationLog(row, entries) {
  return {
    ...row,
    notificationLog: [...(row.notificationLog || []), ...entries],
  }
}

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

export async function fetchFinanceDashboard(params = {}) {
  return tryApi(
    () => api.get('/finance/dashboard', { params }),
    () => buildFinanceDashboardPayload(params),
  )
}

export async function fetchOverallFinanceDashboard(params = {}) {
  return tryApi(
    () => api.get('/finance/payments/overall-dashboard', { params: { ...params, scope: 'overall' } }),
    () => buildFinanceDashboardPayload({ ...params, scope: 'overall' }),
  )
}

export async function fetchCenterFinanceDashboard(centerId, params = {}) {
  return tryApi(
    () => api.get(`/finance/payments/center/${centerId}`, { params }),
    () =>
      buildFinanceDashboardPayload({
        ...params,
        scope: 'center',
        centerIds: centerId,
      }),
  )
}

export async function fetchCompareCentersFinance(params = {}) {
  return tryApi(
    () => api.get('/finance/payments/compare-centers', { params }),
    () =>
      buildFinanceDashboardPayload({
        ...params,
        scope: 'compare',
      }),
  )
}

export async function fetchCenterPerformance() {
  return tryApi(
    () => api.get('/finance/payments/center-performance'),
    () => {
      const d = buildFinanceDashboardPayload({ scope: 'overall' })
      return { summaries: d.centerSummaries, performance: d.performance }
    },
  )
}

export async function fetchCenterRanking() {
  return tryApi(
    () => api.get('/finance/payments/center-ranking'),
    () => buildFinanceDashboardPayload({ scope: 'overall' }).centerRanking,
  )
}

/** Unified loader for Payment Dashboard — respects center filter from navbar */
export async function fetchPaymentDashboardByScope(params = {}) {
  const {
    scope = 'overall',
    centerIds,
    centerNames,
    course,
    month,
    batch,
    courseType,
    paymentType,
    studentType,
  } = params
  const filterParams = { course, month, batch, courseType, paymentType, studentType }

  if (scope === 'compare' && centerNames) {
    return tryApi(
      () => api.get('/finance/payments/compare-centers', { params: { centerIds, centerNames, ...filterParams } }),
      () => buildFinanceDashboardPayload({ scope: 'compare', centerIds, centerNames, ...filterParams }),
    )
  }

  if (scope === 'center' && centerNames) {
    return tryApi(
      () =>
        api.get(`/finance/payments/center/${String(centerIds).split(',')[0]}`, {
          params: { centerNames, ...filterParams },
        }),
      () => buildFinanceDashboardPayload({ scope: 'center', centerIds, centerNames, ...filterParams }),
    )
  }

  if (scope === 'multi' && centerNames) {
    return tryApi(
      () => api.get('/finance/payments/overall-dashboard', { params: { centerIds, centerNames, scope: 'multi', ...filterParams } }),
      () => buildFinanceDashboardPayload({ scope: 'multi', centerIds, centerNames, ...filterParams }),
    )
  }

  return tryApi(
    () => api.get('/finance/payments/overall-dashboard', { params: { scope: 'overall', ...filterParams } }),
    () => buildFinanceDashboardPayload({ scope: 'overall', ...filterParams }),
  )
}

export async function fetchPaymentReports(params = {}) {
  return tryApi(
    () => api.get('/finance/reports', { params }),
    () => enrichFinanceRows([...mockReports]),
  )
}

export async function fetchPaymentReportById(id) {
  return tryApi(
    () => api.get(`/finance/reports/${id}`),
    () => mockReports.find((r) => r.id === id) || null,
  )
}

export async function updatePaymentStatus(id, payload) {
  return tryApi(
    () => api.patch(`/finance/reports/${id}/status`, payload),
    () => {
      mockReports = mockReports.map((r) =>
        r.id === id
          ? {
              ...r,
              paymentStatus: payload.newStatus || r.paymentStatus,
              amountPaid: payload.amountAdjustment != null ? Number(payload.amountAdjustment) : r.amountPaid,
              paymentMode: payload.paymentMode || r.paymentMode,
              transactionId: payload.transactionId || r.transactionId,
              paymentDate: payload.paymentDate || r.paymentDate,
              adminLogs: [
                ...(r.adminLogs || []),
                {
                  adminName: payload.adminName || 'Admin',
                  action: `Status → ${payload.newStatus}`,
                  comment: payload.comment,
                  timestamp: new Date().toISOString(),
                },
              ],
            }
          : r,
      )
      return mockReports.find((r) => r.id === id)
    },
  )
}

export async function fetchOfflineApprovals(params = {}) {
  return tryApi(
    () => api.get('/finance/offline-approvals', { params }),
    () => enrichOfflineList(mockOffline, params),
  )
}

function enrichOfflineList(rows, params = {}) {
  const existing = getExistingPaymentsForDuplicateCheck()
  let list = rows.map((r) => enrichOfflineApprovalRow(r, { existingPayments: existing }))

  if (params.branch && params.branch !== 'all') {
    list = list.filter((r) => resolveBranchCode(r) === params.branch)
  }
  if (params.paymentMode && params.paymentMode !== 'all') {
    list = list.filter((r) => r.paymentMode === params.paymentMode)
  }
  if (params.status && params.status !== 'all') {
    list = list.filter((r) => r.status === params.status || r.workflowStatus === params.status)
  }
  if (params.dateFrom) {
    const from = new Date(params.dateFrom)
    list = list.filter((r) => new Date(r.requestedDate) >= from)
  }
  if (params.dateTo) {
    const to = new Date(params.dateTo)
    to.setHours(23, 59, 59, 999)
    list = list.filter((r) => new Date(r.requestedDate) <= to)
  }
  return list
}

export async function fetchOfflineDailySummary(params = {}) {
  return tryApi(
    () => api.get('/finance/offline-approvals/summary', { params }),
    () => {
      const rows = enrichOfflineList(mockOffline, params)
      const summary = buildDailyOfflineSummary(rows, params)
      const recon = rows.reduce(
        (acc, r) => {
          const st = r.reconciliationStatus
          if (st === 'Matched') acc.matchedCount += 1
          if (st === 'Pending Verification') acc.pendingReconciliation += 1
          if (st === 'Mismatch Detected') acc.mismatchCount += 1
          if (st === 'Reconciled') acc.reconciledCount += 1
          if (/cash/i.test(r.paymentMode)) {
            acc.totalDifference += (Number(r.reconciliationVerifiedAmount) || 0) - (Number(r.amount) || 0)
          }
          return acc
        },
        { matchedCount: 0, pendingReconciliation: 0, mismatchCount: 0, reconciledCount: 0, totalDifference: 0 },
      )
      return { ...summary, ...recon }
    },
  )
}

export async function fetchOfflineNotifications() {
  return tryApi(
    () => api.get('/finance/offline-approvals/notifications'),
    () => mockOfflineNotifications,
  )
}

export async function markOfflineNotificationRead(id) {
  return tryApi(
    () => api.patch(`/finance/offline-approvals/notifications/${id}/read`),
    () => {
      mockOfflineNotifications = mockOfflineNotifications.map((n) =>
        n.id === id ? { ...n, read: true } : n,
      )
      return mockOfflineNotifications.find((n) => n.id === id)
    },
  )
}

function appendOfflineNotification(row, { type, message, channel = 'In-app' }) {
  const entry = {
    id: `OFF-NOTIF-${Date.now()}`,
    paymentId: row.id,
    studentName: row.studentName,
    type,
    channel,
    message,
    read: false,
    timestamp: new Date().toISOString(),
  }
  mockOfflineNotifications = [entry, ...mockOfflineNotifications]
  if (channel === 'Email' || channel === 'SMS') {
    mockComm.unshift({
      id: entry.id,
      recipient: row.studentName,
      type: 'Offline Payment',
      channel,
      status: channel === 'Email' ? 'Email trigger placeholder' : 'SMS trigger placeholder',
      timestamp: entry.timestamp,
    })
  }
  return entry
}

export async function uploadOfflineProof(id, files = [], meta = {}) {
  return tryApi(
    () => api.post(`/finance/offline-approvals/${id}/proof`, { files: meta, adminName: meta.adminName }),
    () => {
      const proofFiles = files.map((f, i) => ({
        id: f.id || `upload-${i}`,
        name: f.name,
        type: f.type || (f.name?.endsWith('.pdf') ? 'pdf' : 'image'),
        url: f.preview || f.url || null,
        size: f.size,
      }))
      mockOffline = mockOffline.map((o) => {
        if (o.id !== id) return o
        const next = appendOfflineAudit(
          {
            ...o,
            proofFiles,
            paymentProof: proofFiles.map((p) => p.name).join(', '),
            hasProof: proofFiles.length > 0,
          },
          {
            by: meta.adminName || 'Admin',
            action: 'Re-upload',
            remark: `${proofFiles.length} file(s) uploaded`,
            branch: o.branchCode,
          },
        )
        appendOfflineNotification(next, {
          type: 'offline_submitted',
          message: 'Offline receipt re-uploaded',
        })
        return next
      })
      return mockOffline.find((o) => o.id === id)
    },
  )
}

export async function overrideOfflineDuplicate(id, payload = {}) {
  return tryApi(
    () => api.post(`/finance/offline-approvals/${id}/duplicate-override`, payload),
    () => {
      mockOffline = mockOffline.map((o) => {
        if (o.id !== id) return o
        return appendOfflineAudit(
          {
            ...o,
            duplicateOverride: true,
            duplicateStatus: 'Override Approved',
            isDuplicate: false,
          },
          {
            by: payload.adminName || 'Finance Head',
            action: 'Duplicate override',
            remark: payload.comment || 'Marked as valid duplicate override',
            branch: o.branchCode,
          },
        )
      })
      return mockOffline.find((o) => o.id === id)
    },
  )
}

export async function updateOfflineReconciliation(id, payload = {}) {
  return tryApi(
    () => api.patch(`/finance/offline-approvals/${id}/reconciliation`, payload),
    () => {
      mockOffline = mockOffline.map((o) => {
        if (o.id !== id) return o
        const recon = computeCashReconciliation({
          ...o,
          cashCollectedAmount: payload.collectedAmount ?? o.cashCollectedAmount,
          reconciliationVerifiedAmount: payload.verifiedAmount ?? o.reconciliationVerifiedAmount,
          reconciliationNotes: payload.notes ?? o.reconciliationNotes,
        })
        const updated = {
          ...o,
          cashCollectedAmount: recon.collectedAmount,
          reconciliationVerifiedAmount: recon.verifiedAmount,
          reconciliationStatus: payload.status || recon.reconciliationStatus,
          reconciliationNotes: payload.notes ?? o.reconciliationNotes,
        }
        if (recon.reconciliationStatus === 'Mismatch Detected') {
          appendOfflineNotification(updated, {
            type: 'reconciliation_mismatch',
            message: 'Cash reconciliation mismatch detected',
          })
        }
        return appendOfflineAudit(updated, {
          by: payload.adminName || 'Admin',
          action: 'Reconciliation update',
          remark: payload.notes || `Status → ${updated.reconciliationStatus}`,
          branch: o.branchCode,
        })
      })
      return mockOffline.find((o) => o.id === id)
    },
  )
}

export async function approveOfflinePayment(id, payload) {
  return tryApi(
    () => api.post(`/finance/offline-approvals/${id}/decision`, payload),
    () => {
      const row = mockOffline.find((o) => o.id === id)
      if (!row) throw new Error('Request not found')

      if (payload.branchRestricted) {
        mockOffline = mockOffline.map((o) =>
          o.id === id
            ? appendOfflineAudit(o, {
                by: payload.adminName || 'Admin',
                action: 'Unauthorized attempt',
                remark: payload.reason || 'Cross-branch approval blocked',
                branch: row.branchCode,
                ip: payload.ip,
              })
            : o,
        )
        throw new Error(payload.reason || 'Branch restriction')
      }

      const approved = payload.newStatus === 'Approved'
      const status = approved ? 'Approved' : 'Rejected'
      const now = new Date().toISOString()

      mockOffline = mockOffline.map((o) => {
        if (o.id !== id) return o
        let next = {
          ...o,
          status,
          workflowStatus: approved ? 'Approved' : 'Rejected',
          updatedAt: now,
          approvedBy: approved ? payload.adminName || 'Admin' : o.approvedBy,
          approvedAt: approved ? now : o.approvedAt,
          rejectedBy: approved ? o.rejectedBy : payload.adminName || 'Admin',
          rejectedAt: approved ? o.rejectedAt : now,
          rejectionReason: approved ? o.rejectionReason : payload.reason || payload.comment,
          approvalRemarks: approved ? payload.comment : o.approvalRemarks,
        }
        if (approved && /cash/i.test(o.paymentMode)) {
          next.reconciliationStatus = 'Reconciled'
        }
        next = appendOfflineAudit(next, {
          by: payload.adminName || 'Admin',
          action: approved ? 'Approval' : 'Rejection',
          remark: approved ? payload.comment || 'Proof verified' : payload.reason || payload.comment,
          branch: o.branchCode,
          ip: payload.ip,
        })
        appendOfflineNotification(next, {
          type: approved ? 'approval_completed' : 'rejection_completed',
          message: approved ? 'Offline payment approved' : 'Offline payment rejected',
          channel: 'In-app',
        })
        appendOfflineNotification(next, { type: status.toLowerCase(), message: status, channel: 'Email' })
        appendOfflineNotification(next, { type: status.toLowerCase(), message: status, channel: 'SMS' })
        return next
      })
      return enrichOfflineApprovalRow(mockOffline.find((o) => o.id === id), {
        existingPayments: getExistingPaymentsForDuplicateCheck(),
      })
    },
  )
}

export async function fetchEmiPlans(params = {}) {
  return tryApi(
    () => api.get('/finance/emi', { params }),
    () => JSON.parse(JSON.stringify(mockEmi)),
  )
}

export async function updateEmiPlan(planId, installments, planPatch = {}) {
  return tryApi(
    () => api.put(`/finance/emi/${planId}`, { installments, ...planPatch }),
    () => {
      mockEmi = mockEmi.map((p) => {
        if (p.id !== planId) return p
        const paid = (installments || [])
          .reduce((s, i) => s + (Number(i.paidAmount) || (i.status === 'Paid' ? Number(i.emiAmount) : 0)), 0)
        const pending = Math.max(0, (p.totalFees || 0) - paid)
        return {
          ...p,
          ...planPatch,
          installments,
          totalPaid: paid,
          pendingAmount: pending,
          completionPercent: p.totalFees
            ? Math.min(100, Math.round((paid / p.totalFees) * 100))
            : 0,
        }
      })
      return mockEmi.find((p) => p.id === planId)
    },
  )
}

export async function createEmiPlan(payload) {
  return tryApi(
    () => api.post('/finance/emi', payload),
    () => {
      const paid = (payload.installments || [])
        .filter((i) => i.status === 'Paid')
        .reduce((s, i) => s + (Number(i.emiAmount) || 0), 0)
      const down = Number(payload.downPayment) || 0
      const totalPaid = (payload.existingPaid || 0) + down + paid
      const pending = Math.max(0, (payload.totalFees || 0) - totalPaid)
      const plan = {
        id: `EMI-${Date.now().toString().slice(-6)}`,
        studentId: payload.studentId,
        studentName: payload.studentName,
        courseId: payload.courseId,
        courseName: payload.courseName,
        totalFees: payload.totalFees || payload.finalPayable || 0,
        totalPaid,
        pendingAmount: pending,
        completionPercent: payload.totalFees
          ? Math.min(100, Math.round((totalPaid / payload.totalFees) * 100))
          : 0,
        installments: (payload.installments || []).map((i) => ({
          emiNo: i.installmentNo ?? i.emiNo,
          emiDate: i.dueDate,
          emiAmount: i.emiAmount,
          status: i.status === 'Scheduled' ? 'Due' : i.status,
          dueDate: i.dueDate,
          paidDate: i.paidDate || '',
          paymentMode: i.paymentMode || '',
          receipt: i.receipt || null,
          referenceNumber: i.referenceNumber || i.utrNumber || '',
          remarks: i.remarks || '',
        })),
        audit: payload.audit || [],
        createdAt: new Date().toISOString(),
      }
      mockEmi = [...mockEmi, plan]
      return plan
    },
  )
}

function getMockEnrichedProfiles() {
  return enrichAllStudentProfiles(MOCK_STUDENT_PROFILES, MOCK_PAYMENT_REPORTS, mockEmi)
}

export async function fetchStudentFinanceProfiles() {
  return tryApi(
    () => api.get('/finance/profiles'),
    () => getMockEnrichedProfiles(),
  )
}

export async function fetchStudentFinanceProfileDetail(studentId) {
  return tryApi(
    () => api.get(`/finance/profiles/${studentId}`),
    () => {
      const profile = getMockEnrichedProfiles().find((p) => p.id === studentId)
      return profile || null
    },
  )
}

export async function creditStudentWallet(studentId, payload) {
  return tryApi(
    () => api.post(`/finance/profiles/${studentId}/wallet/credit`, payload),
    () => ({
      id: `WLT-${Date.now()}`,
      type: 'Credit',
      amount: Number(payload.amount) || 0,
      remarks: payload.remarks || 'Wallet top-up',
      at: new Date().toISOString(),
      by: 'Finance Admin',
      balanceAfter: Number(payload.amount) || 0,
    }),
  )
}

export async function uploadStudentFinanceDocument(studentId, payload) {
  return tryApi(
    () => api.post(`/finance/profiles/${studentId}/documents`, payload),
    () => ({
      id: `DOC-${Date.now()}`,
      type: payload.type,
      fileName: payload.fileName,
      label: String(payload.type || '').replace(/_/g, ' '),
      uploadedAt: new Date().toISOString(),
      status: 'uploaded',
    }),
  )
}

export async function fetchPaymentAttemptLogs(params = {}) {
  return tryApi(
    () => api.get('/finance/attempts', { params }),
    () => buildMockAttemptLogs(),
  )
}

export async function fetchPaymentAttemptAnalytics() {
  return tryApi(
    () => api.get('/finance/attempts/analytics'),
    () => buildMockAttemptAnalytics(),
  )
}

export async function assignPaymentAttemptCounselor(payload) {
  return tryApi(
    () => api.post('/finance/attempts/assign-counselor', payload),
    () => {
      ;(payload.ids || []).forEach((id) => {
        mockAttemptOverrides[id] = {
          ...(mockAttemptOverrides[id] || {}),
          counselorId: payload.counselorId,
          counselorName: payload.counselorName,
          leadStatus: payload.leadStatus || 'Assigned',
          priority: payload.priority,
        }
      })
      return { success: true, data: buildMockAttemptLogs() }
    },
  )
}

export async function blockPaymentAttemptDevice(payload) {
  return tryApi(
    () => api.post('/finance/attempts/block', payload),
    () => {
      const id = payload.attemptId
      const adminName = payload.adminName || 'Admin'
      const prev = mockAttemptOverrides[id] || {}
      mockAttemptOverrides[id] = {
        ...prev,
        fraudStatus: 'Blocked',
        isBlocked: true,
        fraudAudit: [
          ...(prev.fraudAudit || []),
          { id: `AUD-${Date.now()}`, action: 'Blocked device/IP', by: adminName, at: new Date().toISOString() },
        ],
      }
      return { success: true }
    },
  )
}

export async function unblockPaymentAttemptDevice(payload) {
  return tryApi(
    () => api.post('/finance/attempts/unblock', payload),
    () => {
      const id = payload.attemptId
      const adminName = payload.adminName || 'Admin'
      const prev = mockAttemptOverrides[id] || {}
      mockAttemptOverrides[id] = {
        ...prev,
        fraudStatus: 'Safe',
        isBlocked: false,
        fraudAudit: [
          ...(prev.fraudAudit || []),
          { id: `AUD-${Date.now()}`, action: 'Unblocked device/IP', by: adminName, at: new Date().toISOString() },
        ],
      }
      return { success: true }
    },
  )
}

export async function sendPaymentAttemptRecoveryMessage(payload) {
  return tryApi(
    () => api.post('/finance/attempts/recovery-message', payload),
    () => {
      const id = payload.attemptId
      const prev = mockAttemptOverrides[id] || {}
      const entry = {
        id: `COM-ATT-${Date.now()}`,
        channel: payload.channel,
        type: payload.template,
        status: `${payload.channel} trigger placeholder`,
        message: 'Recovery message queued',
        timestamp: new Date().toISOString(),
      }
      mockAttemptOverrides[id] = {
        ...prev,
        communications: [...(prev.communications || []), entry],
      }
      mockComm.unshift({
        id: entry.id,
        recipient: payload.mobile || payload.email || 'Student',
        type: 'Payment Recovery',
        channel: payload.channel,
        status: entry.status,
        timestamp: entry.timestamp,
      })
      return { success: true, data: entry }
    },
  )
}

export async function markPaymentAttemptAlertRead(alertId) {
  return tryApi(
    () => api.post('/finance/attempts/alerts/read', { alertId }),
    () => {
      mockAttemptAlertRead.add(alertId)
      return { success: true }
    },
  )
}

export async function fetchCommunicationLogs(params = {}) {
  return tryApi(
    () => api.get('/finance/communication-logs/enriched', { params }),
    () => {
      if (params.studentId) return mockComm.filter((l) => l.studentId === params.studentId)
      return [...mockComm]
    },
  )
}

export async function fetchCommunicationAnalytics() {
  return tryApi(
    () => api.get('/finance/communication/analytics'),
    () => ({
      logs: [...mockComm],
      templates: [...mockCommTemplates],
      rules: [...mockCommRules],
      alerts: buildCommunicationAlerts(mockComm, mockCommRules).map((a) => ({
        ...a,
        read: mockCommAlertRead.has(a.id),
      })),
    }),
  )
}

export async function tagCommunicationCounselor(commId, payload) {
  return tryApi(
    () => api.post(`/finance/communication/${commId}/counselor`, payload),
    () => {
      const idx = mockComm.findIndex((l) => l.id === commId)
      if (idx === -1) throw new Error('Not found')
      mockComm[idx] = {
        ...mockComm[idx],
        ...payload,
        followUpTag: payload.followUpTag || 'Follow-up assigned',
        auditTrail: [
          ...(mockComm[idx].auditTrail || []),
          { action: 'counselor_tagged', by: payload.adminName || 'Finance Admin', at: new Date().toISOString() },
        ],
      }
      return { success: true, data: mockComm[idx] }
    },
  )
}

export async function bulkCommunicationAction({ ids, action, adminName }) {
  return tryApi(
    () => api.post('/finance/communication/bulk', { ids, action, adminName }),
    () => {
      const results = []
      ids.forEach((id) => {
        const idx = mockComm.findIndex((l) => l.id === id)
        if (idx === -1) return
        if (action === 'resend') {
          mockComm[idx] = {
            ...mockComm[idx],
            status: 'Queued',
            deliveryStatus: 'Pending',
            tracking: {
              ...(mockComm[idx].tracking || {}),
              retryCount: (mockComm[idx].tracking?.retryCount || 0) + 1,
            },
            auditTrail: [
              ...(mockComm[idx].auditTrail || []),
              { action: 'resent', by: adminName || 'Finance Admin', at: new Date().toISOString() },
            ],
          }
        } else if (action === 'mark_delivered') {
          mockComm[idx] = {
            ...mockComm[idx],
            deliveryStatus: 'Delivered',
            tracking: { ...(mockComm[idx].tracking || {}), deliveredAt: new Date().toISOString() },
          }
        }
        results.push(mockComm[idx])
      })
      return { success: true, count: results.length, data: results }
    },
  )
}

export async function fetchCommunicationTemplates() {
  return tryApi(
    () => api.get('/finance/communication/templates'),
    () => [...mockCommTemplates],
  )
}

export async function saveCommunicationTemplate(payload, id) {
  const path = id ? `/finance/communication/templates/${id}` : '/finance/communication/templates'
  const method = id ? 'put' : 'post'
  return tryApi(
    () => api[method](path, payload),
    () => {
      if (id) {
        const idx = mockCommTemplates.findIndex((t) => t.id === id)
        if (idx >= 0) {
          mockCommTemplates[idx] = {
            ...mockCommTemplates[idx],
            ...payload,
            lastModified: new Date().toISOString(),
            auditTrail: [
              ...(mockCommTemplates[idx].auditTrail || []),
              { action: 'updated', by: payload.adminName || 'Finance Admin', at: new Date().toISOString() },
            ],
          }
          return { success: true, data: mockCommTemplates[idx] }
        }
      }
      const entry = {
        id: `TPL-${Date.now()}`,
        ...payload,
        lastModified: new Date().toISOString(),
        createdBy: payload.adminName || 'Finance Admin',
        auditTrail: [{ action: 'created', by: payload.adminName || 'Finance Admin', at: new Date().toISOString() }],
      }
      mockCommTemplates.unshift(entry)
      return { success: true, data: entry }
    },
  )
}

export async function deleteCommunicationTemplate(id) {
  return tryApi(
    () => api.delete(`/finance/communication/templates/${id}`),
    () => {
      mockCommTemplates = mockCommTemplates.filter((t) => t.id !== id)
      return { success: true }
    },
  )
}

export async function testSendCommunicationTemplate(payload) {
  return tryApi(
    () => api.post('/finance/communication/templates/test-send', payload),
    () => {
      const entry = {
        id: `COM-${Date.now()}`,
        studentName: payload.studentName || 'Test Student',
        recipient: payload.recipient || payload.email || payload.mobile,
        type: payload.type || 'Manual Follow-up',
        channel: payload.channel || 'Email',
        status: 'Queued',
        deliveryStatus: 'Pending',
        sentBy: payload.adminName || 'Finance Admin',
        timestamp: new Date().toISOString(),
        templateId: payload.templateId,
        tracking: { sentAt: new Date().toISOString(), retryCount: 0 },
        auditTrail: [{ action: 'test_send', by: payload.adminName || 'Finance Admin', at: new Date().toISOString() }],
      }
      mockComm.unshift(entry)
      return { success: true, data: entry }
    },
  )
}

export async function fetchCommunicationAutomationRules() {
  return tryApi(
    () => api.get('/finance/communication/automation'),
    () => [...mockCommRules],
  )
}

export async function saveCommunicationAutomationRule(payload, id) {
  const path = id ? `/finance/communication/automation/${id}` : '/finance/communication/automation'
  const method = id ? 'put' : 'post'
  return tryApi(
    () => api[method](path, payload),
    () => {
      if (id) {
        const idx = mockCommRules.findIndex((r) => r.id === id)
        if (idx >= 0) {
          mockCommRules[idx] = {
            ...mockCommRules[idx],
            ...payload,
            auditTrail: [
              ...(mockCommRules[idx].auditTrail || []),
              { action: 'updated', by: payload.adminName || 'Finance Admin', at: new Date().toISOString() },
            ],
          }
          return { success: true, data: mockCommRules[idx] }
        }
      }
      const entry = {
        id: `RULE-${Date.now()}`,
        active: true,
        priority: mockCommRules.length + 1,
        executionLogs: [],
        ...payload,
        auditTrail: [{ action: 'created', by: payload.adminName || 'Finance Admin', at: new Date().toISOString() }],
      }
      mockCommRules.push(entry)
      return { success: true, data: entry }
    },
  )
}

export async function deleteCommunicationAutomationRule(id) {
  return tryApi(
    () => api.delete(`/finance/communication/automation/${id}`),
    () => {
      mockCommRules = mockCommRules.filter((r) => r.id !== id)
      return { success: true }
    },
  )
}

export async function toggleCommunicationAutomationRule(id, adminName) {
  return tryApi(
    () => api.post(`/finance/communication/automation/${id}/toggle`, { adminName }),
    () => {
      const idx = mockCommRules.findIndex((r) => r.id === id)
      if (idx === -1) throw new Error('Not found')
      mockCommRules[idx] = {
        ...mockCommRules[idx],
        active: !mockCommRules[idx].active,
        auditTrail: [
          ...(mockCommRules[idx].auditTrail || []),
          {
            action: mockCommRules[idx].active ? 'enabled' : 'disabled',
            by: adminName || 'Finance Admin',
            at: new Date().toISOString(),
          },
        ],
      }
      return { success: true, data: mockCommRules[idx] }
    },
  )
}

export async function markCommunicationAlertRead(alertId) {
  return tryApi(
    () => api.post('/finance/communication/alerts/read', { alertId }),
    () => {
      mockCommAlertRead.add(alertId)
      return { success: true }
    },
  )
}

export async function sendPaymentReminder(payload) {
  return tryApi(
    () => api.post('/finance/reminders', payload),
    () => {
      const entry = {
        id: `COM-${Date.now()}`,
        studentId: payload.studentId,
        studentName: payload.studentName || payload.mobile || payload.email,
        paymentReference: payload.paymentReference,
        recipient: payload.mobile || payload.email,
        type: 'Due Reminder',
        channel: payload.channel || 'WhatsApp',
        status: 'Queued',
        deliveryStatus: 'Pending',
        sentBy: payload.adminName || 'Finance Admin',
        timestamp: new Date().toISOString(),
        tracking: { sentAt: new Date().toISOString(), retryCount: 0 },
        auditTrail: [{ action: 'manual_send', by: payload.adminName || 'Finance Admin', at: new Date().toISOString() }],
      }
      mockComm.unshift(entry)
      return { success: true, data: entry }
    },
  )
}

function queueItemToReport(item, overrides = {}) {
  const now = new Date().toISOString()
  const amount = Number(item.amount) || 0
  return {
    id: item.id,
    studentId: item.studentId,
    studentName: item.student,
    mobile: item.mobile || '',
    email: item.email || '',
    courseId: item.courseId,
    courseName: item.course,
    courseType: item.courseType || 'Offline',
    centerId: item.centerId,
    centerName: item.centerName,
    batchId: item.batchId || 'batch-morning',
    batchName: item.batchName,
    paymentStatus: 'Paid',
    verificationStatus: 'Approved',
    paymentType: item.paymentType || 'Full',
    paymentMode: item.paymentMode,
    amountPaid: amount,
    pendingAmount: 0,
    totalFees: amount,
    gst: Math.round(amount * 0.18),
    transactionId: item.utrNumber,
    utrNumber: item.utrNumber,
    paymentDate: item.submittedAt || item.paymentDate || now,
    paymentProof: item.paymentProof,
    branch: item.centerName,
    receiptNumber: item.receiptNumber || `RCP-${item.id}`,
    adminLogs: [
      ...(item.auditTrail || []).map((a) => ({
        adminName: a.by,
        action: a.action,
        comment: '',
        timestamp: a.at,
      })),
      {
        adminName: overrides.adminName || 'Verifier',
        action: overrides.action || 'Verification approved',
        comment: overrides.comment || item.remarks || '',
        timestamp: now,
      },
    ],
    timeline: [
      { event: 'Payment verified', timestamp: now },
      { event: 'Moved to payment reports', timestamp: now },
    ],
    ...overrides,
  }
}

function upsertPaymentReport(report) {
  const enriched = enrichFinanceRows([report])[0]
  const idx = mockReports.findIndex((r) => r.id === enriched.id)
  if (idx >= 0) {
    mockReports = mockReports.map((r, i) => (i === idx ? { ...r, ...enriched } : r))
  } else {
    mockReports = [...mockReports, enriched]
  }
  return mockReports.find((r) => r.id === enriched.id)
}

export async function fetchVerificationQueue() {
  return tryApi(
    () => api.get('/finance/verification'),
    () => enrichVerificationQueue(JSON.parse(JSON.stringify(mockVerificationQueue))),
  )
}

export async function fetchVerificationNotifications() {
  return tryApi(
    () => api.get('/finance/verification/notifications'),
    () => JSON.parse(JSON.stringify(mockVerificationNotifications)),
  )
}

export async function markVerificationNotificationRead(id) {
  return tryApi(
    () => api.patch(`/finance/verification/notifications/${id}/read`),
    () => {
      mockVerificationNotifications = mockVerificationNotifications.map((n) =>
        n.id === id ? { ...n, read: true } : n,
      )
      return mockVerificationNotifications.find((n) => n.id === id)
    },
  )
}

/** Verification officer: verify payment and route to Finance Head */
export async function verifyPayment(id, payload = {}) {
  return tryApi(
    () => api.post(`/finance/verification/${id}/verify`, payload),
    () => {
      const item = mockVerificationQueue.find((r) => r.id === id)
      if (!item) throw new Error('Not found')
      if (item.isDuplicate && !item.duplicateOverride) {
        throw new Error('Duplicate payment must be reviewed before verification')
      }
      const now = new Date().toISOString()
      const adminName = payload.adminName || 'Verifier'
      let updated = updateQueueRow(id, (r) =>
        pushNotificationLog(
          {
            ...r,
            verificationStatus: 'Verified',
            approvalStatus: 'Sent to Finance Head',
            verifiedBy: adminName,
            verifiedAt: now,
            sentToFinanceHeadAt: now,
            currentApprover: 'Finance Head',
            updatedAt: now,
            remarks: payload.comment || r.remarks,
            auditTrail: [
              ...(r.auditTrail || []),
              { by: adminName, action: 'Verified', at: now },
              { by: adminName, action: 'Sent to Finance Head', at: now },
            ],
          },
          [
            appendVerificationNotification(
              { ...r, student: r.student },
              {
                channel: 'In-app',
                statusUpdate: 'Sent to Finance Head',
                message: `Payment ${r.id} verified and sent to Finance Head`,
                adminName,
              },
            ),
            appendVerificationNotification(
              { ...r, student: r.student },
              { channel: 'Email', statusUpdate: 'Email trigger placeholder', message: '', adminName },
            ),
            appendVerificationNotification(
              { ...r, student: r.student },
              { channel: 'SMS', statusUpdate: 'SMS trigger placeholder', message: '', adminName },
            ),
          ],
        ),
      )
      return enrichVerificationRow(updated, { existingPayments: getExistingPaymentsForDuplicateCheck() })
    },
  )
}

/** Finance Head: final approve — moves to payment reports */
export async function financeHeadApproveVerification(id, payload = {}) {
  return tryApi(
    () => api.post(`/finance/verification/${id}/head-approve`, payload),
    () => {
      const item = mockVerificationQueue.find((r) => r.id === id)
      if (!item) throw new Error('Not found')
      if (item.isDuplicate && !item.duplicateOverride) {
        throw new Error('Duplicate payment must be marked valid before approval')
      }
      const now = new Date().toISOString()
      const adminName = payload.adminName || 'Finance Head'
      mockVerificationQueue = mockVerificationQueue.filter((r) => r.id !== id)
      const report = queueItemToReport(
        {
          ...item,
          approvalStatus: 'Approved',
          approvedBy: adminName,
          approvedAt: now,
        },
        {
          adminName,
          action: 'Finance Head approved',
          comment: payload.comment || 'Final approval granted',
        },
      )
      appendVerificationNotification(
        { ...item, student: item.student },
        {
          channel: 'In-app',
          statusUpdate: 'Approved',
          message: `Payment ${item.id} approved by Finance Head`,
          adminName,
        },
      )
      return upsertPaymentReport(report)
    },
  )
}

/** Finance Head or verifier: reject with mandatory remarks */
export async function rejectVerification(id, payload = {}) {
  const remarkText = payload.rejectionRemarks || payload.comment || ''
  const validationError = validateRejectionRemarks(remarkText)
  if (validationError) throw new Error(validationError)

  return tryApi(
    () => api.post(`/finance/verification/${id}/reject`, payload),
    () => {
      const now = new Date().toISOString()
      const adminName = payload.adminName || 'Verifier'
      const rejectionRemarks = [payload.reason, remarkText].filter(Boolean).join(' — ')
      let updated = updateQueueRow(id, (r) =>
        pushNotificationLog(
          {
            ...r,
            verificationStatus: 'Rejected',
            approvalStatus: 'Rejected',
            rejectionRemarks: remarkText.trim(),
            remarks: rejectionRemarks || r.remarks,
            verifiedBy: adminName,
            rejectedBy: adminName,
            rejectedAt: now,
            currentApprover: '—',
            updatedAt: now,
            auditTrail: [
              ...(r.auditTrail || []),
              {
                by: adminName,
                action: 'Rejected',
                remark: remarkText.trim(),
                at: now,
              },
            ],
          },
          [
            appendVerificationNotification(
              { ...r, student: r.student },
              {
                channel: 'In-app',
                statusUpdate: 'Rejected',
                message: `Payment ${r.id} rejected — ${remarkText.trim()}`,
                adminName,
              },
            ),
            appendVerificationNotification(
              { ...r, student: r.student },
              { channel: 'Email', statusUpdate: 'Email trigger placeholder', message: remarkText.trim(), adminName },
            ),
            appendVerificationNotification(
              { ...r, student: r.student },
              { channel: 'SMS', statusUpdate: 'SMS trigger placeholder', message: '', adminName },
            ),
          ],
        ),
      )
      return enrichVerificationRow(updated, { existingPayments: getExistingPaymentsForDuplicateCheck() })
    },
  )
}

/** Finance Head: request clarification — returns to verification officer */
export async function requestVerificationClarification(id, payload = {}) {
  return tryApi(
    () => api.post(`/finance/verification/${id}/clarification`, payload),
    () => {
      const now = new Date().toISOString()
      const adminName = payload.adminName || 'Finance Head'
      const note = payload.remark || payload.comment || 'Clarification requested'
      let updated = updateQueueRow(id, (r) =>
        pushNotificationLog(
          {
            ...r,
            verificationStatus: 'Under Review',
            approvalStatus: 'Pending Verification',
            currentApprover: 'Verification Officer',
            remarks: note,
            updatedAt: now,
            auditTrail: [
              ...(r.auditTrail || []),
              { by: adminName, action: 'Clarification requested', remark: note, at: now },
            ],
          },
          [
            appendVerificationNotification(
              { ...r, student: r.student },
              {
                channel: 'In-app',
                statusUpdate: 'Clarification requested',
                message: note,
                adminName,
              },
            ),
          ],
        ),
      )
      return enrichVerificationRow(updated, { existingPayments: getExistingPaymentsForDuplicateCheck() })
    },
  )
}

/** Finance Head: override duplicate warning */
export async function markDuplicatePaymentValid(id, payload = {}) {
  return tryApi(
    () => api.post(`/finance/verification/${id}/mark-valid`, payload),
    () => {
      const now = new Date().toISOString()
      const adminName = payload.adminName || 'Finance Head'
      let updated = updateQueueRow(id, (r) => ({
        ...r,
        duplicateOverride: true,
        isDuplicate: false,
        updatedAt: now,
        remarks: payload.remark || r.remarks,
        auditTrail: [
          ...(r.auditTrail || []),
          { by: adminName, action: 'Marked duplicate as valid', at: now },
        ],
      }))
      return enrichVerificationRow(updated, { existingPayments: getExistingPaymentsForDuplicateCheck() })
    },
  )
}

/** @deprecated Use verifyPayment + financeHeadApproveVerification for two-step workflow */
export async function approveVerification(id, payload = {}) {
  return tryApi(
    () => api.post(`/finance/verification/${id}/approve`, payload),
    async () => {
      const item = mockVerificationQueue.find((r) => r.id === id)
      if (!item) throw new Error('Not found')
      if (item.approvalStatus === 'Sent to Finance Head' || item.autoVerified) {
        return financeHeadApproveVerification(id, payload)
      }
      await verifyPayment(id, payload)
      return financeHeadApproveVerification(id, payload)
    },
  )
}

export async function escalateVerification(id, payload = {}) {
  return tryApi(
    () => api.post(`/finance/verification/${id}/escalate`, payload),
    () => {
      const now = new Date().toISOString()
      let updated = updateQueueRow(id, (r) => ({
        ...r,
        verificationStatus: 'Escalated',
        approvalStatus: 'Sent to Finance Head',
        sentToFinanceHeadAt: now,
        currentApprover: 'Finance Head',
        updatedAt: now,
        remarks: payload.remark || r.remarks,
        auditTrail: [
          ...(r.auditTrail || []),
          {
            by: payload.adminName || 'Finance Admin',
            action: 'Escalated',
            at: now,
          },
          {
            by: payload.adminName || 'Finance Admin',
            action: 'Sent to Finance Head',
            at: now,
          },
        ],
      }))
      return enrichVerificationRow(updated, { existingPayments: getExistingPaymentsForDuplicateCheck() })
    },
  )
}

export async function requestVerificationReupload(id, payload = {}) {
  return tryApi(
    () => api.post(`/finance/verification/${id}/reupload`, payload),
    () => {
      const now = new Date().toISOString()
      let updated = updateQueueRow(id, (r) => ({
        ...r,
        verificationStatus: 'Under Review',
        approvalStatus: 'Pending Verification',
        currentApprover: 'Verification Officer',
        updatedAt: now,
        remarks: payload.note || payload.comment || 'Re-upload requested — awaiting new proof',
        auditTrail: [
          ...(r.auditTrail || []),
          {
            by: payload.adminName || 'Finance Admin',
            action: 'Re-upload requested',
            at: now,
          },
        ],
      }))
      return enrichVerificationRow(updated, { existingPayments: getExistingPaymentsForDuplicateCheck() })
    },
  )
}

export async function submitOfflinePaymentReport(form) {
  return tryApi(
    () => api.post('/finance/verification/offline', form),
    async () => {
      if (form.isDraft) {
        return { draft: true, paymentId: form.paymentId }
      }

      let emiPlanRecord = null
      if (form.emiPlan && (form.submitAction === 'emi_plan' || form.submitAction === 'approve')) {
        emiPlanRecord = await createEmiPlan({
          studentId: form.studentId,
          studentName: form.studentName,
          courseId: form.courseId,
          courseName: form.courseName,
          totalFees: form.emiPlan.totalFees || form.financials?.finalPayable,
          finalPayable: form.financials?.finalPayable,
          existingPaid: form.financials?.amountPaid || 0,
          downPayment: form.emiPlan.downPayment,
          installments: form.emiPlan.installments,
          frequency: form.emiPlan.frequency,
          startDate: form.emiPlan.startDate,
          audit: form.audit?.logs || [],
        })
      }

      if (form.submitAction === 'emi_plan') {
        return { emiPlan: emiPlanRecord }
      }

      const now = new Date().toISOString()
      const paymentDate = form.paymentDate ? new Date(form.paymentDate).toISOString() : now
      const utr =
        form.utrNumber ||
        form.modeFields?.receiptNumber ||
        form.modeFields?.chequeNumber ||
        form.modeFields?.ddNumber ||
        ''

      const item = {
        id: form.paymentId.trim(),
        studentId: form.studentId,
        student: form.studentName,
        centerName: form.centerName,
        course: form.courseName,
        courseId: form.courseId,
        courseType: form.courseType,
        amount: form.amount,
        paymentMode: form.paymentMode,
        utrNumber: utr,
        paymentProof: form.proofFileName,
        submittedAt: paymentDate,
        paymentDate,
        remarks: form.remarks || (form.emiEnabled ? 'Offline EMI down payment' : 'Offline payment added by admin'),
      }
      const report = queueItemToReport(item, {
        adminName: form.audit?.createdBy || 'Finance Admin',
        action: form.emiEnabled ? 'Offline EMI payment approved' : 'Offline payment added & approved',
        comment: form.remarks || '',
      })
      if (form.emiEnabled && emiPlanRecord) {
        report.paymentType = 'EMI'
        report.emiStatus = 'EMI Running'
        report.paymentStatus = report.pendingAmount > 0 ? 'Partial' : 'Paid'
      }
      const saved = upsertPaymentReport(report)
      return { report: saved, emiPlan: emiPlanRecord, receiptId: saved?.id }
    },
  )
}

export async function resetVerificationQueue() {
  return tryApi(
    () => api.post('/finance/verification/reset'),
    () => {
      mockVerificationQueue = JSON.parse(JSON.stringify(INITIAL_VERIFICATION_QUEUE))
      mockVerificationNotifications = []
      return enrichVerificationQueue(mockVerificationQueue)
    },
  )
}

export async function fetchGstSettings() {
  return tryApi(
    () => api.get('/finance/gst-settings'),
    () => ({ ...mockGst }),
  )
}

export async function updateGstSettings(payload) {
  return tryApi(
    () => api.put('/finance/gst-settings', payload),
    () => {
      mockGst = { ...mockGst, ...payload }
      return mockGst
    },
  )
}

export async function fetchCompletedReceipts(params = {}) {
  return tryApi(
    () => api.get('/finance/receipts/completed', { params }),
    async () => {
      const list = filterCompletedReceipts(mockReports)
      const mapped = []
      for (const r of list) {
        const withReceipt = await ensureReceiptOnRecord(r, mockGst)
        mockReports = mockReports.map((row) => (row.id === withReceipt.id ? withReceipt : row))
        mapped.push(mapReceiptCenterRow(withReceipt, mockGst))
      }
      return mapped
    },
  )
}

export async function bulkResendReceipts(paymentIds, { channel = 'Email' } = {}) {
  return tryApi(
    () => api.post('/finance/receipts/bulk-resend', { paymentIds, channel }),
    async () => {
      const results = []
      for (const id of paymentIds) {
        try {
          await sendReceiptCommunication(id, { channel, message: '' })
          results.push({ id, success: true, status: 'Delivered' })
        } catch {
          results.push({ id, success: false, status: 'Failed' })
        }
      }
      return {
        results,
        total: results.length,
        succeeded: results.filter((r) => r.success).length,
        failed: results.filter((r) => !r.success).length,
      }
    },
  )
}

export async function previewReceiptNumber(params = {}) {
  return tryApi(
    () => api.get('/finance/receipts/preview-number', { params }),
    () => {
      const branchCode = params.branchCode || 'DEL'
      const seq = Number(params.sequence) || 1
      const fy = params.financialYear || mockGst.financialYear || new Date().getFullYear()
      return {
        invoiceNumber: `${branchCode}-INV-${fy}-${String(seq).padStart(5, '0')}`,
        branchCode,
        sequence: seq,
        financialYear: fy,
      }
    },
  )
}

export async function autoGenerateReceiptIfEligible(paymentId, options = {}) {
  const row = mockReports.find((r) => r.id === paymentId)
  if (!row || !shouldAutoGenerateReceipt(row)) return row
  const generated = await ensureReceiptOnRecord(row, mockGst, options)
  mockReports = mockReports.map((r) => (r.id === paymentId ? generated : r))
  if (mockGst.autoSendReceipt) {
    await sendReceiptCommunication(paymentId, { channel: 'Email', message: '' })
  }
  return generated
}

export async function sendReceiptCommunication(paymentId, { channel, mobile, email, message }) {
  const channelKey = String(channel || 'Email').toLowerCase()
  return tryApi(
    () =>
      api.post(`/finance/receipts/${paymentId}/send`, {
        channel,
        mobile,
        email,
        message,
      }),
    () => {
      const now = new Date().toISOString()
      mockReports = mockReports.map((r) => {
        if (r.id !== paymentId) return r
        const base = mapReceiptCenterRow(r, mockGst)
        const receiptCommunications = { ...(base.receiptCommunications || {}) }
        receiptCommunications[channelKey] = {
          status: 'Delivered',
          sentAt: now,
          sentBy: 'Finance Admin',
          deliveredAt: now,
        }
        mockComm = [
          {
            id: `COM-RCP-${Date.now()}`,
            recipient: channelKey === 'email' ? email || base.email : mobile || base.mobile,
            type: 'Payment Receipt',
            channel: channel.charAt(0).toUpperCase() + channel.slice(1).toLowerCase(),
            status: 'Delivered',
            timestamp: now,
            message,
          },
          ...mockComm,
        ]
        const updated = mapReceiptCenterRow(
          {
            ...base,
            receiptCommunications,
            receiptSentBy: 'Finance Admin',
            receiptSentAt: now,
            receiptLifecycleStatus: 'Sent',
            receiptResendHistory: [
              ...(base.receiptResendHistory || []),
              { channel, status: 'Delivered', sentAt: now, sentBy: 'Finance Admin' },
            ],
          },
          mockGst,
        )
        return updated
      })
      const updated = mockReports.find((r) => r.id === paymentId)
      return mapReceiptCenterRow(updated, mockGst)
    },
  )
}

export async function generateReceipt(paymentId) {
  return tryApi(
    () => api.post(`/finance/receipts/${paymentId}/generate`),
    async () => {
      const row = mockReports.find((r) => r.id === paymentId)
      if (!row) return null
      const updated = await ensureReceiptOnRecord(row, mockGst)
      mockReports = mockReports.map((r) => (r.id === paymentId ? updated : r))
      return updated
    },
  )
}

export async function resendReceipt(paymentId, channel) {
  return sendReceiptCommunication(paymentId, { channel, message: '' })
}

export async function fetchPaymentModeSettings() {
  return tryApi(
    () => api.get('/finance/payment-mode-settings'),
    () => JSON.parse(JSON.stringify(mockPaymentModeSettings)),
  )
}

export async function updatePaymentModeSettings(settings) {
  return tryApi(
    () => api.put('/finance/payment-mode-settings', { settings }),
    () => {
      const now = new Date().toISOString()
      mockPaymentModeSettings = settings.map((s) => ({
        ...s,
        lastUpdated: now,
      }))
      return JSON.parse(JSON.stringify(mockPaymentModeSettings))
    },
  )
}

function findMockEmiPlan(planId) {
  return mockEmi.find((p) => p.id === planId)
}

function patchMockEmiPlan(planId, patcher) {
  mockEmi = mockEmi.map((p) => (p.id === planId ? patcher({ ...p }) : p))
  return findMockEmiPlan(planId)
}

export async function fetchEmiAutomationSettings() {
  return tryApi(
    () => api.get('/finance/emi/settings'),
    () => JSON.parse(JSON.stringify(mockEmiSettings)),
  )
}

export async function updateEmiAutomationSettings(settings) {
  return tryApi(
    () => api.put('/finance/emi/settings', settings),
    () => {
      mockEmiSettings = { ...mockEmiSettings, ...settings }
      return JSON.parse(JSON.stringify(mockEmiSettings))
    },
  )
}

export async function previewEmiSchedule(payload) {
  return tryApi(
    () => api.post('/finance/emi/schedule/preview', payload),
    () => generateLoanEmiSchedule(payload),
  )
}

export async function regenerateEmiSchedule(planId, payload) {
  return tryApi(
    () => api.post(`/finance/emi/${planId}/schedule/regenerate`, payload),
    () => {
      const schedule = generateLoanEmiSchedule(payload)
      return patchMockEmiPlan(planId, (p) => ({
        ...p,
        installments: schedule.installments.map((i) => ({
          ...i,
          status: i.status === 'Scheduled' ? 'Due' : i.status,
        })),
        emiStartDate: schedule.startDate,
        emiEndDate: schedule.endDate,
        planHistory: [
          ...(p.planHistory || []),
          { action: 'EMI schedule regenerated', by: 'Finance Admin', at: new Date().toISOString() },
        ],
      }))
    },
  )
}

export async function fetchEmiReminderLogs(params = {}) {
  return tryApi(
    () => api.get('/finance/emi/reminder-logs', { params }),
    () => {
      const all = mockEmi.flatMap((p) =>
        (p.reminderLogs || []).map((l) => ({ ...l, planId: p.id, studentName: p.studentName })),
      )
      return [...mockEmiReminderLogs, ...all].sort((a, b) =>
        String(b.timestamp).localeCompare(String(a.timestamp)),
      )
    },
  )
}

export async function sendEmiReminder(payload) {
  return tryApi(
    () => api.post('/finance/emi/reminders', payload),
    () => {
      const now = new Date().toISOString()
      const entry = {
        id: `RL-${Date.now()}`,
        channel: payload.channel || 'WhatsApp',
        status: Math.random() > 0.15 ? 'Sent' : 'Failed',
        trigger: payload.trigger || 'before_due',
        timestamp: now,
        deliveryStatus: Math.random() > 0.15 ? 'Delivered' : 'Failed',
        retryStatus: '',
        message: payload.message,
      }
      if (payload.planId) {
        patchMockEmiPlan(payload.planId, (p) => ({
          ...p,
          reminderLogs: [entry, ...(p.reminderLogs || [])],
          planHistory: [
            ...(p.planHistory || []),
            { action: `Reminder sent via ${entry.channel}`, by: payload.adminName || 'System', at: now },
          ],
        }))
      }
      mockEmiReminderLogs.unshift({ ...entry, planId: payload.planId, studentName: payload.studentName })
      mockComm.unshift({
        id: entry.id,
        recipient: payload.mobile || payload.email,
        type: 'EMI Reminder',
        channel: entry.channel,
        status: entry.status === 'Sent' ? 'Queued (provider placeholder)' : 'Failed',
        timestamp: now,
      })
      return { success: true, log: entry }
    },
  )
}

export async function assignEmiCounselor(planId, { counselorId, counselorName, adminName }) {
  return tryApi(
    () => api.post(`/finance/emi/${planId}/assign-counselor`, { counselorId, counselorName }),
    () =>
      patchMockEmiPlan(planId, (p) => ({
        ...p,
        counselorId,
        counselorName,
        counselorAssignedAt: new Date().toISOString(),
        followUpStatus: 'Contacted',
        planHistory: [
          ...(p.planHistory || []),
          { action: `Assigned to ${counselorName}`, by: adminName || 'Finance Admin', at: new Date().toISOString() },
        ],
      })),
  )
}

export async function scheduleEmiCall(planId, payload) {
  return tryApi(
    () => api.post(`/finance/emi/${planId}/arrange-call`, payload),
    () =>
      patchMockEmiPlan(planId, (p) => {
        const call = {
          id: `CALL-${Date.now()}`,
          status: payload.status || 'Pending',
          scheduledAt: payload.scheduledAt || new Date().toISOString(),
          remarks: payload.remarks || '',
          counselorId: payload.counselorId || p.counselorId,
          createdAt: new Date().toISOString(),
        }
        return {
          ...p,
          callLogs: [call, ...(p.callLogs || [])],
          planHistory: [
            ...(p.planHistory || []),
            { action: 'Call arranged', by: payload.adminName || 'Finance Admin', at: call.createdAt },
          ],
        }
      }),
  )
}

export async function applyEmiSuspension(planId, payload) {
  return tryApi(
    () => api.post(`/finance/emi/${planId}/suspend`, payload),
    () =>
      patchMockEmiPlan(planId, (p) => ({
        ...p,
        suspensionStatus: payload.status || 'Suspended',
        suspendedAt: new Date().toISOString(),
        suspensionReason: payload.reason || 'Manual suspension',
        planHistory: [
          ...(p.planHistory || []),
          { action: `Suspension: ${payload.status || 'Suspended'}`, by: payload.adminName || 'System', at: new Date().toISOString() },
        ],
      })),
  )
}

export async function submitEmiSettlement(planId, payload) {
  return tryApi(
    () => api.post(`/finance/emi/${planId}/settlement`, payload),
    () =>
      patchMockEmiPlan(planId, (p) => ({
        ...p,
        settlementStatus: payload.type === 'foreclosure' ? 'Foreclosed' : 'Settlement Approved',
        settlementAmount: payload.amount,
        settlementRemarks: payload.remarks,
        settlementDate: new Date().toISOString(),
        pendingAmount: payload.type === 'foreclosure' ? 0 : Math.max(0, (p.pendingAmount || 0) - (payload.amount || 0)),
        planHistory: [
          ...(p.planHistory || []),
          { action: payload.type === 'foreclosure' ? 'Foreclosure completed' : 'Settlement approved', by: payload.adminName || 'Finance Admin', at: new Date().toISOString() },
        ],
      })),
  )
}

export async function uploadEmiAgreement(planId, docPayload) {
  return tryApi(
    () => api.post(`/finance/emi/${planId}/agreements`, docPayload),
    () =>
      patchMockEmiPlan(planId, (p) => {
        const doc = {
          id: `DOC-${Date.now()}`,
          type: docPayload.type,
          label: docPayload.label,
          fileName: docPayload.fileName,
          uploadedAt: new Date().toISOString(),
          version: (p.agreements?.filter((a) => a.type === docPayload.type).length || 0) + 1,
        }
        return {
          ...p,
          agreements: [doc, ...(p.agreements || [])],
          planHistory: [
            ...(p.planHistory || []),
            { action: `Document uploaded: ${doc.label}`, by: docPayload.adminName || 'Finance Admin', at: doc.uploadedAt },
          ],
        }
      }),
  )
}

export async function bulkAssignEmiCounselor(planIds, counselorPayload) {
  return tryApi(
    () => api.post('/finance/emi/bulk-assign', { planIds, ...counselorPayload }),
    () => {
      const results = []
      for (const id of planIds) {
        results.push(
          patchMockEmiPlan(id, (p) => ({
            ...p,
            counselorId: counselorPayload.counselorId,
            counselorName: counselorPayload.counselorName,
            counselorAssignedAt: new Date().toISOString(),
          })),
        )
      }
      return results
    },
  )
}
