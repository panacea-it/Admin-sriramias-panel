/**
 * Receipt Management — API ↔ UI mapping
 * Contract: docs/RECEIPT_MANAGEMENT_FRONTEND_API_GUIDE.md
 */

export const API_RECEIPT_STATUS_TO_UI = {
  GENERATED: 'Generated',
  SENT: 'Sent',
  DOWNLOADED: 'Downloaded',
  FAILED: 'Failed',
  CANCELLED: 'Cancelled',
}

export const UI_RECEIPT_STATUS_TO_API = Object.fromEntries(
  Object.entries(API_RECEIPT_STATUS_TO_UI).map(([api, ui]) => [ui, api]),
)

export const API_PAYMENT_TYPE_TO_UI = {
  FULL_PAYMENT: 'Full Payment',
  DOWN_PAYMENT: 'Down Payment',
  EMI: 'EMI',
  EMI_CLOSURE: 'EMI Completed',
}

export const UI_PAYMENT_TYPE_FILTER_TO_API = {
  'Full Payment': 'FULL_PAYMENT',
  'Partial Payment': 'DOWN_PAYMENT',
  'EMI Completed': 'EMI_CLOSURE',
}

const SORT_KEY_TO_API = {
  receiptNumber: 'receiptNumber',
  invoiceNumber: 'invoiceNumber',
  studentName: 'studentName',
  branchCode: 'branch',
  gstAmount: 'gst',
  totalAmount: 'total',
  receiptLifecycleStatus: 'receiptStatus',
  receiptGeneratedAt: 'generatedAt',
}

export function mapApiReceiptStatusToUi(status) {
  if (!status) return 'Generated'
  const key = String(status).toUpperCase()
  return API_RECEIPT_STATUS_TO_UI[key] || status
}

export function mapUiReceiptStatusToApi(status) {
  if (!status) return ''
  return UI_RECEIPT_STATUS_TO_API[status] || String(status).toUpperCase()
}

export function mapApiPaymentTypeToUi(paymentType) {
  if (!paymentType) return ''
  const key = String(paymentType).toUpperCase()
  return API_PAYMENT_TYPE_TO_UI[key] || paymentType
}

export function mapUiPaymentTypeFilterToApi(paymentType) {
  if (!paymentType || paymentType === 'all') return ''
  return UI_PAYMENT_TYPE_FILTER_TO_API[paymentType] || paymentType
}

export function mapSortKeyToApi(sortKey) {
  return SORT_KEY_TO_API[sortKey] || 'generatedAt'
}

export function mapCommunicationsToUi(communication = {}) {
  const channels = ['whatsapp', 'sms', 'email']
  const out = {}
  channels.forEach((ch) => {
    const entry = communication[ch] || {}
    if (entry.enabled === false) {
      out[ch] = {
        status: 'Not Sent',
        sent: false,
        enabled: false,
        message: entry.message || 'Coming Soon',
        sentAt: null,
        sentBy: null,
        deliveredAt: null,
      }
      return
    }
    const sent = entry.sent === true
    out[ch] = {
      status: sent ? 'Delivered' : 'Not Sent',
      sent,
      enabled: entry.enabled !== false,
      sentAt: entry.sentAt || null,
      sentBy: entry.sentBy || null,
      deliveredAt: entry.deliveredAt || null,
    }
  })
  return out
}

export function mapReceiptListRowToUi(item) {
  if (!item) return null
  return {
    id: item.receiptId,
    receiptId: item.receiptId,
    receiptNumber: item.receiptNumber,
    invoiceNumber: item.invoiceNumber,
    studentName: item.studentName,
    mobile: item.mobile,
    email: item.email,
    branchCode: item.branchCode || item.branch,
    branch: item.branch,
    courseName: item.course,
    courseId: item.courseId,
    paymentMode: item.paymentMode,
    paymentType: item.paymentType,
    paymentTypeLabel: mapApiPaymentTypeToUi(item.paymentType),
    gstAmount: item.gst ?? 0,
    totalAmount: item.total ?? item.amountPaid ?? 0,
    amountPaid: item.amountPaid ?? item.total ?? 0,
    receiptLifecycleStatus: mapApiReceiptStatusToUi(item.receiptStatus || item.status),
    receiptGeneratedAt: item.generatedAt,
    generatedLabel: item.generatedLabel,
    communications: mapCommunicationsToUi(item.communication),
    centerId: item.centerId,
    batchId: item.batchId,
    batchName: item.batchName,
    transactionId: item.transactionReference,
    utrNumber: item.transactionReference,
    paymentDate: item.paymentDate,
    updatedAt: item.updatedAt,
    remarks: item.remarks,
  }
}

export function mapReceiptViewToUi(data) {
  if (!data) return null
  const student = data.student || {}
  const institute = data.institute || {}
  const course = data.course || {}
  const branch = data.branch || {}
  const payment = data.payment || {}
  const tax = data.tax || {}

  return {
    id: data.receiptId,
    receiptId: data.receiptId,
    receiptNumber: data.receiptNumber,
    invoiceNumber: data.invoiceNumber,
    studentName: student.studentName,
    studentId: student.studentCode || student.studentId,
    mobile: student.mobile,
    email: student.email,
    courseName: course.courseName,
    courseId: course.courseId,
    courseType: course.deliveryMode,
    batchId: course.batchId,
    batchName: course.batchName,
    branchCode: branch.branchCode,
    branch: branch.centerName,
    centerId: branch.centerId || branch.branchId,
    centerName: branch.centerName,
    paymentMode: payment.paymentMode,
    paymentType: payment.paymentType,
    paymentTypeLabel: mapApiPaymentTypeToUi(payment.paymentType),
    transactionId: payment.transactionReference,
    utrNumber: payment.transactionReference,
    amountPaid: payment.amountPaid,
    totalAmount: tax.totalAmount ?? payment.amountPaid,
    totalFees: tax.totalAmount ?? payment.amountPaid,
    paymentDate: payment.paymentDate,
    receiptGeneratedAt: data.generatedAt,
    receiptLifecycleStatus: mapApiReceiptStatusToUi(data.receiptStatus),
    gstAmount: tax.gstAmount ?? 0,
    gstBreakup: {
      baseAmount: tax.baseAmount,
      cgst: tax.cgst,
      sgst: tax.sgst,
      igst: tax.igst,
      gstAmount: tax.gstAmount,
      gstPercent: tax.gstPercentage,
      gstRateLabel: tax.gstRateLabel,
      showTaxRows: tax.showTaxRows,
      cumulativePaidAmount: tax.cumulativePaidAmount,
    },
    remarks: data.remarks,
    pdfUrl: data.pdfUrl,
    html: data.html,
    htmlPrint: data.htmlPrint,
    institute,
    branding: data.branding,
    signature: data.signature,
    emiCompletionNote: payment.paymentType === 'EMI' ? data.remarks : null,
  }
}

export function buildReceiptListBody({
  search = '',
  courseId = 'all',
  branchId = 'all',
  centerId = 'all',
  paymentType = 'all',
  paymentMode = '',
  receiptStatus = 'all',
  dateFrom = '',
  dateTo = '',
  page = 1,
  limit = 20,
  sortKey = 'receiptGeneratedAt',
  sortDir = 'desc',
  syncMissing = false,
  syncLimit = 100,
} = {}) {
  return {
    search: search?.trim() || '',
    courseId: courseId && courseId !== 'all' ? courseId : '',
    branchId: branchId && branchId !== 'all' ? branchId : '',
    centerId: centerId && centerId !== 'all' ? centerId : '',
    paymentType: mapUiPaymentTypeFilterToApi(paymentType),
    paymentMode: paymentMode && paymentMode !== 'all' ? paymentMode : '',
    receiptStatus:
      receiptStatus && receiptStatus !== 'all' ? mapUiReceiptStatusToApi(receiptStatus) : '',
    dateFrom: dateFrom || '',
    dateTo: dateTo || '',
    page,
    limit,
    sortBy: mapSortKeyToApi(sortKey),
    sortOrder: sortDir === 'asc' ? 'asc' : 'desc',
    syncMissing: Boolean(syncMissing),
    syncLimit,
  }
}

export function normalizeReceiptListResponse(data) {
  const payload = data || {}
  const items = Array.isArray(payload.data) ? payload.data : []
  return {
    rows: items.map(mapReceiptListRowToUi).filter(Boolean),
    pagination: {
      total: payload.total ?? items.length,
      page: payload.page ?? 1,
      limit: payload.limit ?? items.length,
      totalPages: payload.totalPages ?? 1,
      count: payload.count ?? items.length,
    },
  }
}

export function buildUpdateReceiptPayload(form, receiptId) {
  return {
    receiptId,
    editReason: form.editReason?.trim(),
    studentName: form.studentName?.trim(),
    courseId: form.courseId || undefined,
    batchId: form.batchId || undefined,
    paymentDate: form.paymentDate || undefined,
    paymentMode: form.paymentMode || undefined,
    amountPaid: form.amountPaid != null ? Number(form.amountPaid) : undefined,
    transactionReference: form.transactionId?.trim() || undefined,
    receiptStatus: form.receiptLifecycleStatus
      ? mapUiReceiptStatusToApi(form.receiptLifecycleStatus)
      : undefined,
    remarks: form.remarks?.trim() || undefined,
  }
}

export function openReceiptDownloadUrl(downloadUrl, fileName) {
  if (!downloadUrl) return
  const anchor = document.createElement('a')
  anchor.href = downloadUrl
  if (fileName) anchor.download = fileName
  anchor.target = '_blank'
  anchor.rel = 'noopener noreferrer'
  document.body.appendChild(anchor)
  anchor.click()
  document.body.removeChild(anchor)
}

export function printReceiptHtml(html, htmlPrint) {
  const content = htmlPrint || html
  if (!content) return false
  const iframe = document.createElement('iframe')
  iframe.style.position = 'fixed'
  iframe.style.right = '0'
  iframe.style.bottom = '0'
  iframe.style.width = '0'
  iframe.style.height = '0'
  iframe.style.border = 'none'
  document.body.appendChild(iframe)
  const doc = iframe.contentDocument || iframe.contentWindow?.document
  if (!doc) {
    document.body.removeChild(iframe)
    return false
  }
  doc.open()
  doc.write(content)
  doc.close()
  iframe.onload = () => {
    iframe.contentWindow?.focus()
    iframe.contentWindow?.print()
    setTimeout(() => document.body.removeChild(iframe), 1000)
  }
  if (doc.readyState === 'complete') {
    iframe.contentWindow?.focus()
    iframe.contentWindow?.print()
    setTimeout(() => document.body.removeChild(iframe), 1000)
  }
  return true
}

export function handleReceiptPrintResponse(data) {
  if (!data) return false
  if (data.printUrl) {
    window.open(data.printUrl, '_blank', 'noopener,noreferrer')
    return true
  }
  return printReceiptHtml(data.html, data.htmlPrint)
}

export function buildPaymentTypeFilterOptions(paymentTypes = []) {
  const labels = {
    FULL_PAYMENT: 'Full Payment',
    DOWN_PAYMENT: 'Partial Payment',
    EMI: 'EMI',
    EMI_CLOSURE: 'EMI Completed',
  }
  return paymentTypes.map((type) => ({
    value: labels[type] || mapApiPaymentTypeToUi(type),
    label: labels[type] || mapApiPaymentTypeToUi(type),
    apiValue: type,
  }))
}

export function buildReceiptStatusFilterOptions(statuses = []) {
  return statuses.map((status) => ({
    value: mapApiReceiptStatusToUi(status),
    label: mapApiReceiptStatusToUi(status),
    apiValue: status,
  }))
}
