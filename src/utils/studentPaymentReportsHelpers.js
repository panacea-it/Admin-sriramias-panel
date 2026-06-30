/** Student Payment Reports — API ↔ UI mapping (integration guide §5–§6) */

export const API_STATUS_TO_DISPLAY = {
  PAID: 'Paid',
  PARTIAL: 'Partially Paid',
  PENDING: 'Pending',
  FAILED: 'Failed',
  REFUNDED: 'Refunded',
  EMI_RUNNING: 'EMI Completed',
}

export const DISPLAY_STATUS_TO_API = {
  Paid: 'PAID',
  'Partially Paid': 'PARTIAL',
  Partial: 'PARTIAL',
  Pending: 'PENDING',
  Failed: 'FAILED',
  Refunded: 'REFUNDED',
  'EMI Completed': 'EMI_RUNNING',
  'EMI Running': 'EMI_RUNNING',
}

export const GATEWAY_LABELS = {
  RAZORPAY: 'Razorpay',
  CASHFREE: 'Cashfree',
  OFFLINE: 'Offline',
  MANUAL: 'Offline',
  OTHER: 'Other',
}

const API_CATEGORY_TO_UI = {
  ONLINE: 'online',
  OFFLINE: 'offline',
  BANKING: 'banking',
  WALLET: 'wallet',
  INTERNATIONAL: 'other',
  OTHER: 'other',
}

const UI_CATEGORY_TO_API = {
  online: 'ONLINE',
  offline: 'OFFLINE',
  banking: 'BANKING',
  wallet: 'WALLET',
  other: 'OTHER',
}

const API_ICON_TO_UI = {
  MOBILE_UPI: 'smartphone',
  CARD: 'credit-card',
  BANKING: 'landmark',
  CASH: 'banknote',
  WALLET: 'wallet',
  CHEQUE_DD: 'file-text',
  EMI: 'repeat',
  GATEWAY: 'globe',
  INTERNATIONAL: 'plane',
  OTHER: 'circle-dot',
}

const UI_ICON_TO_API = Object.fromEntries(
  Object.entries(API_ICON_TO_UI).map(([api, ui]) => [ui, api]),
)

export function mapApiStatusToDisplay(status) {
  if (!status) return 'Pending'
  const key = String(status).toUpperCase()
  return API_STATUS_TO_DISPLAY[key] || status
}

export function mapDisplayStatusToApi(status) {
  if (!status) return 'PENDING'
  return DISPLAY_STATUS_TO_API[status] || String(status).toUpperCase()
}

export function mapGatewayLabel(gateway) {
  if (!gateway) return '—'
  const key = String(gateway).toUpperCase()
  return GATEWAY_LABELS[key] || gateway
}

export function mapApiCategoryToUi(category) {
  if (!category) return 'other'
  const key = String(category).toUpperCase()
  return API_CATEGORY_TO_UI[key] || String(category).toLowerCase()
}

export function mapUiCategoryToApi(category) {
  if (!category) return 'OTHER'
  return UI_CATEGORY_TO_API[String(category).toLowerCase()] || String(category).toUpperCase()
}

export function mapApiIconToUi(icon) {
  if (!icon) return 'circle-dot'
  const key = String(icon).toUpperCase()
  return API_ICON_TO_UI[key] || 'circle-dot'
}

export function mapUiIconToApi(icon) {
  if (!icon) return 'OTHER'
  return UI_ICON_TO_API[icon] || String(icon).toUpperCase()
}

export function mapPaymentReportRow(item) {
  if (!item) return null
  return {
    ...item,
    id: item._id,
    studentId: item.studentCode,
    amountPaid: item.paidAmount,
    pendingAmount: item.pendingAmount ?? 0,
    paymentStatus: mapApiStatusToDisplay(item.status),
    status: item.status,
    paymentMode: item.paymentModeName || item.paymentMethod || '—',
    paymentGateway: mapGatewayLabel(item.gateway),
    paymentDate: item.transactionDate,
    editReason: item.reason?.label || '',
    editComment: item.comment || '',
    totalAmount: item.totalAmount,
    transactionId: item.transactionId,
    enrollment: item.enrollment,
  }
}

export function mapPaymentDetailToView(detail) {
  if (!detail) return null
  const report = detail.paymentReport || {}
  const student = detail.student || {}
  const badges = detail.badges || {}

  return {
    id: report._id,
    _id: report._id,
    studentName: detail.header?.studentName || report.studentName || student.studentName,
    studentId: student.studentCode || report.studentCode,
    courseName: detail.header?.courseName || report.courseName,
    batchName: report.batchName,
    centerName: report.centerName,
    mobile: student.mobileNumber,
    email: student.email,
    paymentStatus: badges.statusLabel || mapApiStatusToDisplay(report.status || badges.status),
    paymentMode: report.paymentModeName || report.paymentMethod,
    amountPaid: report.paidAmount,
    receiptNumber: report.receiptNumber,
    transactionId: report.transactionId || detail.header?.paymentReference,
    paymentDate: report.transactionDate,
    paymentGateway: mapGatewayLabel(report.gateway),
    verificationStatus: badges.verificationStatusLabel || report.verificationStatus,
    reason: report.reason?.label || '',
    comment: report.comment || '',
    raw: detail,
  }
}

export function buildPaymentReportsListBody(params = {}) {
  const body = {
    page: Number(params.page) || 1,
    limit: Math.min(Math.max(Number(params.limit) || 25, 1), 100),
    sortBy: params.sortBy || 'updatedAt',
    sortOrder: params.sortOrder || 'desc',
    search: params.search || '',
    status: 'ALL',
    gateway: 'ALL',
    paymentMode: 'ALL',
    paymentType: 'ALL',
    refundStatus: 'ALL',
    accessStatus: 'ALL',
    verificationStatus: 'ALL',
  }

  if (params.centerId) body.centerId = params.centerId
  if (params.fromDate) body.fromDate = params.fromDate
  if (params.toDate) body.toDate = params.toDate
  if (params.studentId) body.studentId = params.studentId

  return body
}

export function normalizePaymentReportsListResponse(data) {
  const payload = data || {}
  const items = Array.isArray(payload.items) ? payload.items.map(mapPaymentReportRow).filter(Boolean) : []
  return {
    items,
    summary: payload.summary || { paidCount: 0, partialCount: 0, pendingCount: 0, totalCount: 0 },
    totalCount: payload.totalCount ?? payload.count ?? items.length,
    page: payload.page ?? 1,
    limit: payload.limit ?? 25,
    totalPages: payload.totalPages ?? 1,
  }
}

export function mapApiModeToCard(item) {
  if (!item) return null
  return {
    id: item.paymentModeId,
    paymentModeId: item.paymentModeId,
    label: item.paymentModeName,
    category: mapApiCategoryToUi(item.category),
    description: item.description || '',
    icon: mapApiIconToUi(item.icon),
    enabled: item.isActive !== false,
    isCustom: true,
    lastUpdated: item.updatedAt,
    _id: item._id,
  }
}

export function mapApiModeGroupsToCards(groups = []) {
  return groups.flatMap((group) =>
    (group.items || []).map(mapApiModeToCard).filter(Boolean),
  )
}

export function mapCardModeToApiForm(form, existing = null) {
  return {
    paymentModeId: existing?.paymentModeId || existing?.id,
    paymentModeName: form.label?.trim(),
    category: mapUiCategoryToApi(form.category),
    description: form.description?.trim() || '',
    icon: mapUiIconToApi(form.icon),
    isActive: form.enabled !== false,
  }
}

export function validateEditPaymentForm(form, totalAmount) {
  if (!form.paymentId || !form.status || !form.reason) return 'Required fields missing'
  const status = mapDisplayStatusToApi(form.newStatus || form.status)
  const paidAmount = Number(form.paidAmount ?? form.amountAdjustment)
  if (status === 'PARTIAL') {
    if (!Number.isFinite(paidAmount) || paidAmount <= 0) {
      return 'Partial amount must be greater than 0'
    }
    if (Number(totalAmount) > 0 && paidAmount >= Number(totalAmount)) {
      return 'Partial amount must be less than total fees'
    }
  }
  if (form.comment && form.comment.length > 500) return 'Comment max 500 characters'
  return null
}
