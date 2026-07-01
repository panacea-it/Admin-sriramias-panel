/**
 * Payment Verification Center — API ↔ UI mapping
 * Contract: docs/PAYMENT_VERIFICATION_CENTER_FRONTEND_API_GUIDE.md
 */

import { formatCategoryDateTime } from './formatDateTime'
import { inferProofType } from './financeVerificationWorkflow'

const TERMINAL_VERIFICATION_STATUSES = new Set(['VERIFIED', 'REJECTED', 'AUTO_VERIFIED'])

const MONGO_OBJECT_ID_RE = /^[a-f0-9]{24}$/i

export function isMongoObjectId(value) {
  return MONGO_OBJECT_ID_RE.test(String(value || '').trim())
}

export function mapCenterDropdownToOption(center) {
  if (!center) return null
  const id = String(center.value || center._id || center.id || '').trim()
  const name = String(
    center.centerName || center.name || center.label || getCentreDropdownDisplayName(center),
  ).trim()
  if (!id || !name) return null
  return { id, name, centerCode: center.centerCode || '' }
}

function getCentreDropdownDisplayName(opt) {
  const centerName = String(opt?.centerName || opt?.name || '').trim()
  const label = String(opt?.label || '').trim()
  const raw = centerName || label
  if (!raw) return ''
  let name = raw.split(/[(•]/)[0].trim()
  const dashIdx = name.indexOf(' - ')
  if (dashIdx > 0) name = name.slice(0, dashIdx).trim()
  const commaIdx = name.indexOf(',')
  if (commaIdx > 0) name = name.slice(0, commaIdx).trim()
  return name
}

export function mapCentersDropdownToOptions(centers = []) {
  const seen = new Set()
  return centers
    .map(mapCenterDropdownToOption)
    .filter((opt) => {
      if (!opt || !isMongoObjectId(opt.id)) return false
      if (seen.has(opt.id)) return false
      seen.add(opt.id)
      return true
    })
}

export function extractProofFilename(url = '') {
  if (!url) return 'payment-proof'
  try {
    const pathname = new URL(url).pathname
    const segment = pathname.split('/').pop() || ''
    return decodeURIComponent(segment) || 'payment-proof'
  } catch {
    const parts = String(url).split('/')
    return parts[parts.length - 1] || 'payment-proof'
  }
}

export function mapVerificationRecordToUi(record) {
  if (!record) return null

  const verificationStatusLabel =
    record.verificationStatusLabel || record.verificationStatus || 'Pending Verification'

  const proofUrl = record.paymentProofUrl || ''
  const proofName = proofUrl ? extractProofFilename(proofUrl) : ''

  return {
    _id: record._id,
    id: record.verificationId,
    verificationId: record.verificationId,
    submissionRef: record.submissionRef,
    type: record.type,
    student: record.studentName,
    studentName: record.studentName,
    studentId: record.studentCode,
    studentCode: record.studentCode,
    centerName: record.centerName,
    centerId: record.center,
    course: record.courseName,
    courseName: record.courseName,
    courseId: record.course,
    batchId: record.batch,
    batchName: record.batchName,
    paymentMode: record.paymentModeName,
    paymentModeId: record.paymentModeId,
    amount: record.amount,
    utrNumber: record.utrNumber,
    transactionId: record.utrNumber,
    verificationStatus: verificationStatusLabel,
    verificationStatusRaw: record.verificationStatus,
    financeHeadStatusRaw: record.financeHeadStatus,
    financeHeadStatusLabel: record.financeHeadStatusLabel,
    approvalStatus: mapFinanceHeadStatusToApprovalLabel(record),
    currentApprover: formatFinanceHeadStatus(record),
    verifiedBy: record.verifiedByName || '',
    verifiedByName: record.verifiedByName || '',
    approvedBy: record.financeHeadStatus === 'APPROVED' ? record.verifiedByName : undefined,
    approvedAt: record.approvedAt || record.verifiedAt,
    rejectedBy: record.verificationStatus === 'REJECTED' ? record.verifiedByName : undefined,
    rejectedAt: record.rejectedAt,
    rejectionRemarks: record.rejectionComment,
    rejectionReason: record.rejectionReason,
    rejectionReasonLabel: record.rejectionReasonLabel,
    remarks: record.remarks,
    isDuplicate: record.isDuplicate === true,
    duplicateLabel: record.duplicateLabel,
    duplicateOverride: false,
    duplicateMatches: [],
    paymentProof: proofName,
    paymentProofUrl: proofUrl,
    proofUrl: proofUrl,
    proofFiles: proofUrl
      ? [
          {
            id: `${record.verificationId}-proof`,
            name: proofName,
            url: proofUrl,
            type: inferProofType(proofName),
          },
        ]
      : [],
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
    submittedAt: record.createdAt,
    paymentDate: record.paymentDate,
    reviewStartedAt: record.reviewStartedAt,
    escalatedAt: record.escalatedAt,
    sentToFinanceHeadAt: record.escalatedAt,
    receiptNumber: record.receiptNumber,
    auditTrail: [],
  }
}

export function mapFinanceHeadStatusToApprovalLabel(record) {
  if (!record) return 'Pending Verification'
  if (record.verificationStatus === 'REJECTED' || record.financeHeadStatus === 'REJECTED') {
    return 'Rejected'
  }
  if (record.financeHeadStatus === 'APPROVED') return 'Approved'
  if (record.financeHeadStatus === 'REVIEWING') return 'Sent to Finance Head'
  if (record.verificationStatus === 'VERIFIED') return 'Verified'
  if (record.verificationStatus === 'UNDER_REVIEW') return 'Under Review'
  return record.financeHeadStatusLabel || 'Pending Verification'
}

export function formatFinanceHeadStatus(row) {
  if (!row) return 'Pending'
  if (row.verificationStatus === 'REJECTED') {
    return `Rejected by ${row.verifiedByName || 'Verifier'}`
  }
  if (row.financeHeadStatus === 'APPROVED') {
    return `Finance Head Since ${formatCategoryDateTime(row.approvedAt || row.verifiedAt)}`
  }
  if (row.financeHeadStatus === 'REVIEWING') {
    return `Finance Head Since ${formatCategoryDateTime(row.escalatedAt)}`
  }
  if (row.verificationStatus === 'UNDER_REVIEW') {
    return `Verification Officer Since ${formatCategoryDateTime(row.reviewStartedAt || row.updatedAt)}`
  }
  return row.financeHeadStatusLabel || 'Pending'
}

export function normalizeVerificationListResponse(data) {
  const items = (data?.items || []).map(mapVerificationRecordToUi).filter(Boolean)
  return {
    summary: data?.summary || null,
    count: data?.count ?? items.length,
    totalCount: data?.totalCount ?? items.length,
    page: data?.page ?? 1,
    limit: data?.limit ?? 25,
    totalPages: data?.totalPages ?? 1,
    items,
  }
}

export function buildVerificationListBody(params = {}) {
  const body = {
    search: String(params.search || '').trim(),
    verificationStatus:
      !params.verificationStatus || params.verificationStatus === 'all'
        ? 'ALL'
        : params.verificationStatus,
    page: Math.max(1, Number(params.page) || 1),
    limit: Math.min(Math.max(Number(params.limit) || 25, 1), 100),
    sortBy: params.sortBy || 'updatedAt',
    sortOrder: params.sortOrder === 'asc' ? 'asc' : 'desc',
  }

  const financeHeadStatus =
    params.financeHeadStatus && params.financeHeadStatus !== 'all'
      ? params.financeHeadStatus
      : ''
  if (financeHeadStatus) body.financeHeadStatus = financeHeadStatus

  const paymentModeId =
    params.paymentModeId && params.paymentModeId !== 'all' ? params.paymentModeId : ''
  if (paymentModeId) body.paymentModeId = paymentModeId

  const centerId = params.centerId && params.centerId !== 'all' ? params.centerId : ''
  if (centerId) body.centerId = centerId

  const courseId = params.courseId && params.courseId !== 'all' ? params.courseId : ''
  if (courseId) body.courseId = courseId

  if (params.batchId) body.batchId = params.batchId
  if (params.dateFrom) body.dateFrom = params.dateFrom
  if (params.dateTo) body.dateTo = params.dateTo

  return body
}

export function mapVerificationDetailToUi(data) {
  if (!data?.record) return null
  const row = mapVerificationRecordToUi(data.record)
  if (!row) return null

  return {
    ...row,
    studentDetail: data.student || null,
    enrollment: data.enrollment || null,
    auditTrail: (data.auditTrail || []).map((entry) => ({
      action: entry.action,
      by: entry.userName || '',
      remark: entry.remarks || '',
      at: entry.createdAt,
      oldVerificationStatus: entry.oldVerificationStatus,
      newVerificationStatus: entry.newVerificationStatus,
      oldFinanceHeadStatus: entry.oldFinanceHeadStatus,
      newFinanceHeadStatus: entry.newFinanceHeadStatus,
    })),
  }
}

export function canVerifyRecord(row) {
  if (!row) return false
  const status = row.verificationStatusRaw || row.verificationStatus
  const isTerminal =
    TERMINAL_VERIFICATION_STATUSES.has(status) ||
    ['Verified', 'Rejected', 'Auto Verified'].includes(row.verificationStatus)
  const isApproved =
    row.financeHeadStatusRaw === 'APPROVED' || row.approvalStatus === 'Approved'
  if (row.isDuplicate && !row.duplicateOverride) return false
  return !isTerminal && !isApproved
}

export function canRejectRecord(row) {
  if (!row) return false
  const status = row.verificationStatusRaw || row.verificationStatus
  const rejected = status === 'REJECTED' || row.verificationStatus === 'Rejected'
  const isApproved =
    row.financeHeadStatusRaw === 'APPROVED' || row.approvalStatus === 'Approved'
  return !rejected && !isApproved
}

export function canFinanceHeadApproveRecord(row) {
  if (!row) return false
  if (row.isDuplicate && !row.duplicateOverride) return false
  return (
    row.financeHeadStatusRaw === 'REVIEWING' ||
    row.approvalStatus === 'Sent to Finance Head'
  )
}

export function mapPaymentModesToOptions(items = []) {
  return items.map((item) => ({
    paymentModeId: item.paymentModeId,
    label: item.paymentModeName,
    value: item.paymentModeId,
    name: item.paymentModeName,
    category: item.category,
    icon: item.icon,
  }))
}

export function mapCoursesToOptions(items = []) {
  return items
    .filter((item) => isMongoObjectId(item._id))
    .map((item) => ({
      id: item._id,
      courseId: item.courseId,
      name: item.courseName,
      label: item.courseName,
      value: item._id,
      centerId: item.centerId,
    }))
}

export function mapBatchesToOptions(items = []) {
  return items
    .filter((item) => isMongoObjectId(item._id))
    .map((item) => ({
      value: item._id,
      batchId: item.batchId,
      batchName: item.batchName,
      label: item.batchName,
      courseId: item.courseId,
      status: item.status,
    }))
}

export function mapEligibleStudentToProfile(item) {
  if (!item) return null
  const centerId = String(item.center?._id || item.centerId || '').trim()
  return {
    studentObjectId: item._id,
    studentId: item.studentId,
    studentName: item.fullName,
    mobile: item.mobileNumber || '',
    email: item.email || '',
    centerId: isMongoObjectId(centerId) ? centerId : '',
    centerName: item.center?.centerName || '',
    isWalkIn: false,
  }
}

export function mapBatchAmountsToFinancials(data, profile = {}) {
  if (!data) return null
  return {
    studentId: profile.studentId || '',
    studentName: profile.studentName || '',
    centerName: profile.centerName || '',
    mobile: profile.mobile || '',
    email: profile.email || '',
    courseId: profile.courseId || '',
    courseName: profile.courseName || '',
    batchId: profile.batchId || '',
    batchName: profile.batchName || '',
    finalPayable: data.payableAmount ?? data.totalFee ?? 0,
    amountPaid: data.paidAmount ?? 0,
    pendingAmount: data.pendingAmount ?? 0,
    baseAmount: data.baseAmount,
    gstAmount: data.gstAmount,
    discountAmount: data.discountAmount,
    deliveryMode: data.deliveryMode,
  }
}

export function mapEmiInstallmentsToUi(installments = []) {
  return installments.map((row) => ({
    installmentNo: row.installmentNo,
    dueDate: row.dueDate,
    emiAmount: row.amount,
    remainingBalance: row.remainingBalance,
    status: row.status || 'Scheduled',
    emiMonth: row.dueDate,
  }))
}

export function buildEligibleStudentsBody({ search = '', centerId, limit = 25 } = {}) {
  const body = {
    search: String(search || '').trim(),
    limit: Math.min(Math.max(Number(limit) || 25, 1), 100),
  }
  if (isMongoObjectId(centerId)) body.centerId = String(centerId).trim()
  return body
}

export function buildBatchAmountsBody({
  batchId,
  studentId,
  centerId,
  deliveryMode = 'OFFLINE',
} = {}) {
  const body = {
    batchId: String(batchId).trim(),
    deliveryMode,
  }
  if (isMongoObjectId(studentId)) body.studentId = String(studentId).trim()
  if (isMongoObjectId(centerId)) body.centerId = String(centerId).trim()
  return body
}

export function buildCalculateEmiBody({
  batchId,
  studentId,
  deliveryMode = 'OFFLINE',
  downPayment = 0,
  emiStartDate,
  months,
  isCustom = false,
  includeAllPlans = false,
} = {}) {
  const body = {
    batchId: String(batchId).trim(),
    deliveryMode,
    downPayment: Math.round(Number(downPayment) || 0),
    emiStartDate: emiStartDate || '',
  }
  if (isMongoObjectId(studentId)) body.studentId = String(studentId).trim()
  if (includeAllPlans) {
    body.includeAllPlans = true
    return body
  }
  if (months) body.months = Number(months)
  body.isCustom = Boolean(isCustom)
  return body
}

export function buildValidateScheduleBody({
  batchId,
  studentId,
  deliveryMode = 'OFFLINE',
  downPayment = 0,
  installments = [],
} = {}) {
  const body = {
    batchId: String(batchId).trim(),
    deliveryMode,
    downPayment: Math.round(Number(downPayment) || 0),
    installments: installments.map((row) => ({
      amount: Math.round(Number(row.amount ?? row.emiAmount) || 0),
    })),
  }
  if (isMongoObjectId(studentId)) body.studentId = String(studentId).trim()
  return body
}

export function mapEmiPlanOptionsToPreviews(planOptions = []) {
  return planOptions.map((plan) => ({
    months: plan.months,
    monthlyAmount: plan.monthlyAmount,
    endDate: plan.endDate,
  }))
}

export function resolvePaymentModeId(paymentModeName, modes = []) {
  if (!paymentModeName) return ''
  const match = modes.find(
    (m) =>
      m.paymentModeId === paymentModeName ||
      m.paymentModeName === paymentModeName ||
      m.name === paymentModeName ||
      m.label === paymentModeName,
  )
  return match?.paymentModeId || match?.value || ''
}

export function resolveOfflineStudentType(form = {}) {
  if (form.isWalkIn) return 'WALK_IN'
  return isMongoObjectId(form.studentObjectId) ? 'REGISTERED' : 'WALK_IN'
}

export function isBatchFeesConfigured(data) {
  if (!data) return false
  const payable = Number(
    data.payableAmount ?? data.totalFee ?? data.finalPayable ?? data.pendingAmount,
  )
  if (!Number.isFinite(payable) || payable <= 0) return false
  const mode = String(data.deliveryMode || 'OFFLINE').toUpperCase()
  return mode === 'OFFLINE' || mode === 'ONLINE'
}

export function extractOfflineProofFile(form = {}) {
  if (form.proofFile instanceof File) return form.proofFile
  const first = form.proofFiles?.[0]
  if (first instanceof File) return first
  if (first?.file instanceof File) return first.file
  return null
}

function appendMongoFormField(formData, key, value) {
  if (isMongoObjectId(value)) {
    formData.append(key, String(value).trim())
  }
}

export function buildFullPaymentFormData(form, modes = []) {
  const fd = new FormData()
  const studentType = resolveOfflineStudentType(form)
  const isWalkIn = studentType === 'WALK_IN'
  const paymentModeId =
    form.paymentModeId || resolvePaymentModeId(form.paymentMode, modes)

  if (!paymentModeId) {
    throw new Error('Select a valid payment mode.')
  }

  fd.append('studentType', studentType)
  if (!isWalkIn && isMongoObjectId(form.studentObjectId)) {
    fd.append('studentId', String(form.studentObjectId).trim())
    fd.append('studentName', form.studentName || '')
  }
  if (isWalkIn) {
    fd.append('fullName', form.studentName || '')
  }
  fd.append('mobileNumber', form.mobile || '')
  if (form.email) fd.append('email', form.email)
  appendMongoFormField(fd, 'centerId', form.centerId)
  appendMongoFormField(fd, 'courseId', form.courseId)
  appendMongoFormField(fd, 'batchId', form.batchId)
  fd.append('deliveryMode', 'OFFLINE')
  fd.append('paymentModeId', paymentModeId)
  fd.append('amountPaid', String(Math.round(Number(form.amount) || 0)))
  fd.append('paymentDate', form.paymentDate || '')
  if (form.utrNumber) fd.append('utrNumber', form.utrNumber)
  if (form.remarks) fd.append('remarks', form.remarks)

  const proofFile = extractOfflineProofFile(form)
  if (proofFile instanceof File) {
    fd.append('fullPaymentProof', proofFile)
  }

  return fd
}

export function buildEmiPlanFormData(form, modes = []) {
  const fd = new FormData()
  const studentType = resolveOfflineStudentType(form)
  const isWalkIn = studentType === 'WALK_IN'
  const downPayment = Number(form.emiPlan?.downPayment) || 0
  const isCustom = form.emiPlan?.durationPreset === 'custom'
  const selectedMonths = Number(form.emiPlan?.installmentCount) || 0
  const paymentModeId =
    form.paymentModeId || resolvePaymentModeId(form.paymentMode, modes)

  fd.append('studentType', studentType)
  if (!isWalkIn && isMongoObjectId(form.studentObjectId)) {
    fd.append('studentId', String(form.studentObjectId).trim())
    fd.append('studentName', form.studentName || '')
  }
  if (isWalkIn) fd.append('fullName', form.studentName || '')
  fd.append('mobileNumber', form.mobile || '')
  if (form.email) fd.append('email', form.email)
  appendMongoFormField(fd, 'centerId', form.centerId)
  appendMongoFormField(fd, 'courseId', form.courseId)
  appendMongoFormField(fd, 'batchId', form.batchId)
  fd.append('deliveryMode', 'OFFLINE')
  fd.append('downPayment', String(Math.round(downPayment)))
  fd.append('emiStartDate', form.emiPlan?.startDate || form.paymentDate || '')
  fd.append('isCustom', isCustom ? 'true' : 'false')

  if (isCustom) {
    fd.append('customInstallmentCount', String(selectedMonths))
  } else {
    fd.append('selectedMonths', String(selectedMonths))
  }

  const installmentAmounts = (form.emiPlan?.installments || []).map((row) => ({
    amount: Math.round(Number(row.emiAmount) || 0),
  }))
  if (installmentAmounts.length) {
    fd.append('installments', JSON.stringify(installmentAmounts))
    fd.append('installmentAmounts', JSON.stringify(installmentAmounts))
  }

  if (downPayment > 0) {
    fd.append('paymentModeId', paymentModeId)
    if (form.paymentDate) fd.append('paymentDate', form.paymentDate)
    if (form.paymentDate) fd.append('downPaymentDate', form.paymentDate)
    if (form.utrNumber) fd.append('utrNumber', form.utrNumber)
    if (form.emiPlan?.receivedBy) fd.append('receivedByEmployeeId', form.emiPlan.receivedBy)
    const dpProof = form.downPaymentProofFiles?.[0]?.file
    if (dpProof instanceof File) fd.append('downPaymentProof', dpProof)
  }

  if (form.remarks) fd.append('remarks', form.remarks)

  return fd
}

export const VERIFICATION_EXPORT_COLUMNS = [
  { key: 'id', label: 'Payment ID' },
  { key: 'student', label: 'Student Name' },
  { key: 'studentId', label: 'Student Code' },
  { key: 'paymentMode', label: 'Payment Mode' },
  { key: 'verificationStatus', label: 'Verification Status' },
  {
    key: 'duplicateLabel',
    label: 'Duplicate',
    export: (row) => row.duplicateLabel || (row.isDuplicate ? 'Possible Duplicate' : ''),
  },
  { key: 'verifiedBy', label: 'Verified By' },
  { key: 'financeHeadStatusLabel', label: 'Finance Head Status' },
  {
    key: 'amount',
    label: 'Amount',
    export: (row) => row.amount ?? '',
  },
  { key: 'paymentDate', label: 'Payment Date' },
  { key: 'updatedAt', label: 'Updated On' },
  { key: 'centerName', label: 'Center' },
  { key: 'course', label: 'Course' },
  { key: 'utrNumber', label: 'UTR' },
]
