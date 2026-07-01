/**
 * EMI Management — API ↔ UI mapping
 * Contract: docs/EMI_MANAGEMENT_FRONTEND_API_GUIDE.md
 */

import { isMongoObjectId } from './paymentVerificationHelpers'

const INSTALLMENT_STATUS_MAP = {
  PAID: 'Paid',
  OVERDUE: 'Overdue',
  DUE: 'Due',
  PARTIAL: 'Partial',
  CLOSED: 'Closed',
  CANCELLED: 'Cancelled',
}

const PLAN_STATUS_LABEL_MAP = {
  EMI_RUNNING: 'EMI Running',
  EMI_COMPLETED: 'EMI Completed',
  OVERDUE: 'Overdue',
  DUE: 'Due',
  CLOSED: 'Closed',
  SETTLEMENT_REQUESTED: 'Settlement Requested',
  PENDING_VERIFICATION: 'Pending Verification',
}

export function mapInstallmentStatus(status) {
  if (!status) return 'Due'
  if (INSTALLMENT_STATUS_MAP[status]) return INSTALLMENT_STATUS_MAP[status]
  const normalized = String(status).replace(/_/g, ' ')
  return normalized.charAt(0).toUpperCase() + normalized.slice(1).toLowerCase()
}

export function mapPlanStatusLabel(status, fallbackLabel) {
  if (fallbackLabel) return fallbackLabel
  return PLAN_STATUS_LABEL_MAP[status] || status || 'EMI Running'
}

export function toIsoDateOnly(value) {
  if (!value) return ''
  return String(value).slice(0, 10)
}

export function mapInstallmentRowToUi(row) {
  if (!row) return null
  return {
    _id: row._id || row.installmentId || row.emiInstallmentId,
    installmentNo: row.installmentNo,
    emiNo: row.installmentNo,
    emiMonth: row.emiMonth,
    dueDate: toIsoDateOnly(row.dueDate),
    emiDate: toIsoDateOnly(row.dueDate),
    emiAmount: Number(row.amount) || 0,
    paidAmount: Number(row.paidAmount) || 0,
    remainingBalance: Number(row.remainingBalance) || 0,
    status: mapInstallmentStatus(row.status),
    statusRaw: row.status,
    statusLabel: row.statusLabel,
    paymentMode: row.paymentModeName || '',
    paymentModeId: row.paymentModeId || '',
    receiptNumber: row.receiptNumber || '',
    utrNumber: row.utrNumber || '',
    referenceNumber: row.utrNumber || '',
    proofUrl: row.paymentProofUrl || '',
    hasProof: Boolean(row.hasProof),
    paidDate: toIsoDateOnly(row.paidDate),
    remarks: row.remarks || '',
    lateFee: Number(row.lateFee) || 0,
    discount: Number(row.discount) || 0,
    customCharge: Number(row.customCharge) || 0,
  }
}

export function mapEmiDetailsToPlan(details) {
  if (!details) return null

  const installments = (details.installmentSchedule || []).map(mapInstallmentRowToUi)
  const emiStatusLabel = mapPlanStatusLabel(details.emiStatus, details.emiStatusLabel)
  const isClosed = details.emiStatus === 'CLOSED' || details.emiStatus === 'EMI_COMPLETED'

  return {
    id: details.emiPlanId,
    emiPlanId: details.emiPlanId,
    emiPlanRef: details.emiPlanRef,
    studentId: details.student?.studentId || '',
    studentName: details.student?.studentName || '',
    mobile: details.student?.mobileNumber || '',
    email: details.student?.email || '',
    city: details.student?.city || '',
    totalFees: Number(details.totalFee) || 0,
    amountPaid: Number(details.amountPaid) || 0,
    installmentPaid: Number(details.installmentPaid) || Number(details.amountPaid) || 0,
    pendingAmount: Number(details.pendingAmount) || 0,
    overdueAmount: Number(details.overdueAmount) || 0,
    nextDueDate: toIsoDateOnly(details.nextDueDate),
    emiPlanSummary: details.emiPlanSummary || '',
    emiStatus: emiStatusLabel,
    emiStatusRaw: details.emiStatus,
    emiStatusLabel,
    courseName: details.courseName || '',
    batchName: details.batchName || '',
    centerName: details.centerName || '',
    counselorName: details.assignedCounselorName || '—',
    counselorId: details.assignedCounselor || '',
    assignedCounselor: details.assignedCounselor || '',
    counselorPriority: details.counselorPriority || '',
    counselorRemarks: details.counselorRemarks || '',
    emiStartDate: toIsoDateOnly(details.schedule?.emiStartDate),
    emiEndDate: toIsoDateOnly(details.schedule?.emiEndDate),
    emiDurationMonths: details.schedule?.months || installments.length,
    completionPercent: details.schedule?.completionPercent || 0,
    installments,
    paymentHistory: (details.paymentHistory || []).map((entry) => ({
      installmentNo: entry.installmentNo,
      emiInstallmentId: entry.emiInstallmentId,
      paymentType: entry.paymentType,
      paidDate: toIsoDateOnly(entry.paidDate),
      amount: Number(entry.amount) || 0,
      mode: entry.mode || '',
      receiptNumber: entry.receiptNumber || '',
      utrNumber: entry.utrNumber || '',
      paymentProofUrl: entry.paymentProofUrl || '',
    })),
    planStatus: isClosed ? 'Closed Early' : emiStatusLabel,
    downPayment: Number(details.downPayment) || 0,
  }
}

export function mapEmiStudentRowToUi(row) {
  if (!row) return null
  const emiStatusLabel = mapPlanStatusLabel(row.emiStatus, row.emiStatusLabel)

  return {
    id: row.emiPlanId,
    emiPlanId: row.emiPlanId,
    emiPlanRef: row.emiPlanRef,
    studentId: row.studentId,
    studentName: row.studentName,
    mobile: row.mobileNumber || '',
    email: row.email || '',
    city: row.city || '',
    centerCity: row.city || '—',
    courseId: row.courseId || '',
    courseName: row.courseName || '',
    batchId: row.batchId || '',
    emiPlanLabel: row.emiPlanSummary || '',
    emiPlanSummary: row.emiPlanSummary || '',
    emiAmount: Number(row.emiAmount) || 0,
    installmentsPaid: Number(row.installmentsPaid) || 0,
    remainingInstallments: Number(row.remainingInstallments) || 0,
    nextDueDate: toIsoDateOnly(row.nextDueDate),
    pendingAmount: Number(row.pendingAmount) || 0,
    emiStatus: emiStatusLabel,
    emiStatusRaw: row.emiStatus,
    emiStatusLabel,
    counselorName: row.assignedCounselorName || '—',
    counselorId: row.assignedCounselor || '',
    counselorPriority: row.counselorPriority || '',
  }
}

export function mapReminderRowToUi(row) {
  if (!row) return null
  return {
    id: `${row.emiPlanId}-${row.installmentId}`,
    emiPlanId: row.emiPlanId,
    installmentId: row.installmentId,
    planId: row.emiPlanId,
    studentName: row.studentName,
    studentId: row.studentId || '',
    courseName: row.courseName || '',
    centerName: row.city || '—',
    dueDate: toIsoDateOnly(row.dueDate),
    emiAmount: Number(row.emiAmount) || 0,
    pendingAmount: Number(row.pendingAmount) || 0,
    daysRemaining: Number(row.daysRemaining) || 0,
    reminderStatus: row.reminderStatus || 'Not sent',
    canResend: row.canResend === true,
    mobile: '',
    email: '',
  }
}

export function mapDashboardCardsToMetrics(cards = {}) {
  return {
    totalStudents: Number(cards.totalEmiStudents) || 0,
    activePlans: Number(cards.activeEmiPlans) || 0,
    pendingCollection: Number(cards.pendingEmiCollection) || 0,
    overdueCount: Number(cards.overdueEmi) || 0,
    collectedThisMonth: Number(cards.emiCollectedThisMonth) || 0,
    totalRevenue: Number(cards.totalEmiRevenue) || 0,
  }
}

export function buildDashboardBody(params = {}) {
  const {
    centerId = null,
    courseId = null,
    emiStatus = 'ALL',
    counselorId = null,
    month = null,
    search = '',
    page = 1,
    limit = 10,
    sortBy = 'updatedAt',
    sortOrder = 'desc',
    nextDays = 30,
    reminderPage = 1,
    reminderLimit = 10,
  } = params

  return {
    centerId: centerId || null,
    courseId: courseId && courseId !== 'all' ? courseId : null,
    emiStatus: emiStatus && emiStatus !== 'all' ? emiStatus : 'ALL',
    counselorId: counselorId && counselorId !== 'all' ? counselorId : null,
    month: month && month !== 'all' ? month : null,
    search: search?.trim() || '',
    page: Number(page) || 1,
    limit: Number(limit) || 10,
    sortBy,
    sortOrder,
    nextDays: Number(nextDays) || 30,
    reminderPage: Number(reminderPage) || 1,
    reminderLimit: Number(reminderLimit) || 10,
  }
}

export function normalizeDashboardResponse(data) {
  const payload = data || {}
  const emiStudents = payload.emiStudents || {}
  const automationReminders = payload.automationReminders || {}

  return {
    selectedCenterId: payload.selectedCenterId ?? null,
    centers: payload.centers || [],
    cards: mapDashboardCardsToMetrics(payload.cards),
    metrics: mapDashboardCardsToMetrics(payload.cards),
    reminders: (automationReminders.items || []).map(mapReminderRowToUi),
    reminderPagination: {
      page: automationReminders.page || 1,
      limit: automationReminders.limit || 10,
      total: automationReminders.total || 0,
      totalPages: automationReminders.totalPages || 1,
    },
    students: (emiStudents.items || []).map(mapEmiStudentRowToUi),
    studentPagination: {
      page: emiStudents.page || 1,
      limit: emiStudents.limit || 10,
      total: emiStudents.total || 0,
      totalPages: emiStudents.totalPages || 1,
    },
  }
}

export function mapFilterOptionsToUi(data = {}) {
  return {
    courses: (data.courses || []).map((c) => ({
      value: c._id,
      label: c.courseName,
      courseName: c.courseName,
    })),
    emiStatuses: (data.emiStatuses || []).map((s) => ({
      value: s.value,
      label: s.label,
    })),
    counselors: (data.counselors || []).map((c) => ({
      value: c._id,
      label: c.fullName || c.name,
      name: c.fullName || c.name,
      employeeId: c.employeeId,
      officialEmail: c.officialEmail,
    })),
    months: (data.months || []).map((m) => ({
      value: m.value,
      label: m.label,
    })),
    paymentModes: (data.paymentModes || []).map((m) => ({
      _id: m._id,
      paymentModeId: m.paymentModeId,
      paymentModeName: m.paymentModeName,
    })),
  }
}

export function resolveDashboardCenterId(financeCenterFilter) {
  if (!financeCenterFilter || financeCenterFilter.isOverallView) return null
  const ids = financeCenterFilter.selectedIds || []
  if (ids.length === 1) return ids[0]
  if (ids.length > 1) return ids[0]
  return null
}

export function buildCustomizeInstallmentBody({ emiPlanId, installmentId, row, reason = '' }) {
  if (!isMongoObjectId(emiPlanId)) {
    throw new Error('Invalid EMI plan ID. Reload the EMI details and try again.')
  }
  if (!isMongoObjectId(installmentId)) {
    throw new Error('Invalid installment ID. Reload the EMI details and try again.')
  }

  return {
    emiPlanId: String(emiPlanId).trim(),
    installmentId: String(installmentId).trim(),
    emiAmount: Number(row.emiAmount) || 0,
    dueDate: row.dueDate || undefined,
    lateFee: Number(row.lateFee) || 0,
    discount: Number(row.discount) || 0,
    customCharge: Number(row.customCharge) || 0,
    autoRebalance: row.rebalanceRemaining !== false,
    reason: reason || undefined,
  }
}

export function buildPayInstallmentFormData({
  emiPlanId,
  installmentId,
  paymentModeId,
  paymentMode,
  paymentModes = [],
  paymentDate,
  receiptNumber,
  referenceNumber,
  remarks,
  proofFile,
}) {
  if (!isMongoObjectId(emiPlanId)) {
    throw new Error('Invalid EMI plan ID. Reload the EMI details and try again.')
  }
  if (!isMongoObjectId(installmentId)) {
    throw new Error('Invalid installment ID. Reload the EMI details and try again.')
  }

  const resolvedPaymentModeId =
    paymentModeId || resolvePaymentModeId(paymentModes, paymentMode || paymentModeId)
  if (!resolvedPaymentModeId) {
    throw new Error('Select a valid payment mode.')
  }

  const formData = new FormData()
  formData.append('emiPlanId', String(emiPlanId).trim())
  formData.append('installmentId', String(installmentId).trim())
  formData.append('paymentModeId', resolvedPaymentModeId)
  if (paymentDate) formData.append('paymentDate', paymentDate)
  if (receiptNumber) formData.append('receiptNumber', receiptNumber)
  if (referenceNumber) {
    formData.append('referenceNumber', referenceNumber)
    formData.append('utrNumber', referenceNumber)
  }
  if (remarks) formData.append('remarks', remarks)
  if (proofFile instanceof File) {
    formData.append('paymentProof', proofFile)
    formData.append('proofFile', proofFile)
  }
  return formData
}

export function buildCloseEmiFormData({
  emiPlanId,
  amountCollected,
  paymentModeId,
  paymentDate,
  receiptNumber,
  referenceNumber,
  remarks,
  proofFile,
}) {
  const formData = new FormData()
  formData.append('emiPlanId', emiPlanId)
  formData.append('amountCollected', String(amountCollected))
  formData.append('remainingAmount', String(amountCollected))
  if (paymentModeId) formData.append('paymentModeId', paymentModeId)
  if (paymentDate) formData.append('paymentDate', paymentDate)
  if (receiptNumber) formData.append('receiptNumber', receiptNumber)
  if (referenceNumber) {
    formData.append('referenceNumber', referenceNumber)
    formData.append('utrNumber', referenceNumber)
  }
  if (remarks) {
    formData.append('remarks', remarks)
    formData.append('closureRemarks', remarks)
  }
  if (proofFile) {
    formData.append('paymentProof', proofFile)
    formData.append('proofFile', proofFile)
  }
  return formData
}

export function buildSettleFormData(payload = {}) {
  const formData = new FormData()
  Object.entries(payload).forEach(([key, value]) => {
    if (value == null || value === '') return
    if (value instanceof File || value instanceof Blob) {
      formData.append(key, value)
      return
    }
    formData.append(key, String(value))
  })
  return formData
}

export function buildAssignCounselorBody({ emiPlanId, counselorId, priority, remarks }) {
  const normalizedPriority = String(priority || 'MEDIUM').toUpperCase()
  return {
    emiPlanId,
    counsellorId: counselorId,
    counselorId,
    priority: normalizedPriority,
    remarks: remarks?.trim() || undefined,
  }
}

export function canEditEmiPlan(row) {
  const status = row?.emiStatusRaw || row?.emiStatus
  return ['EMI_RUNNING', 'DUE', 'OVERDUE', 'EMI Running', 'Due', 'Overdue'].includes(status)
}

export function canAssignCounselor(row) {
  const status = row?.emiStatusRaw || row?.emiStatus
  return status !== 'CLOSED' && status !== 'Closed' && status !== 'PENDING_VERIFICATION' && status !== 'Pending Verification'
}

export function canCustomizeInstallment(row) {
  const status = row?.statusRaw || row?.status
  return !['PAID', 'CLOSED', 'Paid', 'Closed'].includes(status)
}

export function canPayInstallment(row) {
  const remaining = Number(row?.remainingBalance ?? row?.remaining ?? 0)
  const status = row?.statusRaw || row?.status
  return remaining > 0 && !['PAID', 'CLOSED', 'Paid', 'Closed'].includes(status)
}

export function buildStudentPaginationControl({ page, pageSize, total, totalPages }) {
  const safeTotal = Number(total) || 0
  const safePage = Number(page) || 1
  const safePageSize = Number(pageSize) || 10
  const safeTotalPages = Math.max(1, Number(totalPages) || 1)
  const startIndex = safeTotal === 0 ? 0 : (safePage - 1) * safePageSize
  const endIndex = Math.min(startIndex + safePageSize, safeTotal)

  return {
    page: safePage,
    pageSize: safePageSize,
    totalItems: safeTotal,
    totalPages: safeTotalPages,
    startIndex,
    endIndex,
    hasNextPage: safePage < safeTotalPages,
    hasPrevPage: safePage > 1,
  }
}

export function mapPaymentModesToSelectOptions(paymentModes = []) {
  return paymentModes.map((mode) => ({
    value: mode.paymentModeId,
    label: mode.paymentModeName,
  }))
}

export function resolvePaymentModeId(paymentModes, selectedValue) {
  if (!selectedValue) return ''
  const byId = paymentModes.find((m) => m.paymentModeId === selectedValue)
  if (byId) return byId.paymentModeId
  const byName = paymentModes.find((m) => m.paymentModeName === selectedValue)
  return byName?.paymentModeId || selectedValue
}
