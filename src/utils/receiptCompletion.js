import { enrichFinanceRecord } from './financeRecordModel'
import { calcReceiptGst } from './finance/receiptGst'
import {
  buildBranchReceiptNumber,
  buildInvoiceNumber,
  resolveBranchCode,
  sequenceKey,
} from './finance/receiptNumbering'
import { generateReceiptVerificationHash } from './finance/receiptSignature'

const EXCLUDED_STATUSES = new Set([
  'Partially Paid',
  'Partial',
  'Pending',
  'Overdue',
  'Failed',
  'Verification Pending',
  'EMI Running',
  'Pending Payment',
])

/** Payment states that trigger auto receipt generation */
export const AUTO_RECEIPT_TRIGGER_STATUSES = new Set([
  'Paid',
  'Verified',
  'Success',
  'EMI Completed',
])

let mockSequenceCounters = {
  'DEL:2026': 125,
  'HYD:2026': 456,
  'PUN:2026': 89,
}

export function getMockSequenceCounters() {
  return { ...mockSequenceCounters }
}

export function setMockSequenceCounters(counters) {
  mockSequenceCounters = { ...counters }
}

export function nextSequenceNumber(branchCode, financialYear) {
  const key = sequenceKey(branchCode, financialYear)
  const next = (mockSequenceCounters[key] || 0) + 1
  mockSequenceCounters[key] = next
  return next
}

/** Only fully paid or EMI-completed students belong in Receipt Management */
export function isCompletedPaymentReceipt(row) {
  const r = enrichFinanceRecord(row)
  const pending = Number(r.pendingAmount) || 0

  if (EXCLUDED_STATUSES.has(r.paymentStatus)) return false
  if (r.emiStatus === 'EMI Running') return false
  if (pending > 0) return false

  if (r.paymentStatus === 'EMI Completed' || r.emiStatus === 'EMI Completed') return true

  if (r.paymentStatus === 'Paid' || r.paymentStatus === 'Verified' || r.paymentStatus === 'Success') {
    if (r.paymentType === 'EMI') {
      return pending <= 0 && (r.emiStatus === 'EMI Completed' || !r.emiStatus || r.emiStatus === '—')
    }
    return true
  }

  if (r.offlineStatus === 'Approved' && (r.paymentStatus === 'Paid' || r.verificationStatus === 'Approved')) {
    return pending <= 0
  }

  return false
}

/** Whether payment qualifies for automatic receipt generation */
export function shouldAutoGenerateReceipt(row) {
  if (row.receiptNumber && row.receiptLifecycleStatus !== 'Cancelled') return false
  const r = enrichFinanceRecord(row)
  if (!AUTO_RECEIPT_TRIGGER_STATUSES.has(r.paymentStatus) && r.emiStatus !== 'EMI Completed') {
    if (!(r.offlineStatus === 'Approved' || r.verificationStatus === 'Approved')) return false
  }
  return isCompletedPaymentReceipt(r) || isPartialReceiptEligible(r)
}

function isPartialReceiptEligible(row) {
  const paid = Number(row.amountPaid) || 0
  return paid > 0 && row.paymentType === 'Partial' && row.paymentStatus !== 'Failed'
}

export function deriveReceiptLifecycleStatus(row) {
  if (row.receiptLifecycleStatus) return row.receiptLifecycleStatus
  if (row.receiptStatus === 'Cancelled') return 'Cancelled'
  const comms = row.communications || row.receiptCommunications || {}
  const hasSent = ['whatsapp', 'sms', 'email'].some((ch) => {
    const s = comms[ch]?.status
    return s && s !== 'Not Sent' && s !== 'Pending'
  })
  const hasFailed = ['whatsapp', 'sms', 'email'].some((ch) => comms[ch]?.status === 'Failed')
  if (hasFailed && !hasSent) return 'Failed'
  if (row.receiptDownloadedAt) return 'Downloaded'
  if (hasSent || row.receiptSentAt) return 'Sent'
  if (row.receiptNumber || row.receiptGeneratedAt) return 'Generated'
  return 'Generated'
}

export function filterCompletedReceipts(rows = []) {
  return (rows || []).filter(isCompletedPaymentReceipt).map(mapReceiptCenterRow)
}

export function mapReceiptCenterRow(row, gstSettings = null) {
  const r = enrichFinanceRecord(row)
  const isEmiCompleted =
    r.paymentStatus === 'EMI Completed' ||
    r.emiStatus === 'EMI Completed' ||
    (r.paymentType === 'EMI' && (r.pendingAmount || 0) <= 0)

  const receiptStatus = isEmiCompleted ? 'EMI Completed' : 'Paid'
  const paymentTypeLabel = isEmiCompleted ? 'EMI Completed' : r.paymentType === 'Partial' ? 'Partial Payment' : 'Full Payment'

  const branchCode = r.branchCode || resolveBranchCode(r, gstSettings || {})
  const gstBreakup = calcReceiptGst({ ...r, branchCode }, gstSettings || {})
  const totalAmount = r.totalFees ?? r.amountPaid ?? 0

  const mapped = {
    ...r,
    receiptStatus,
    paymentTypeLabel,
    branchCode,
    amountPaid: r.amountPaid ?? r.totalFees ?? 0,
    totalAmount,
    gstAmount: gstBreakup.gstAmount,
    gstBreakup,
    receiptNumber: r.receiptNumber || null,
    invoiceNumber: r.invoiceNumber || null,
    communications: normalizeCommunications(r.receiptCommunications),
    receiptLifecycleStatus: deriveReceiptLifecycleStatus(r),
    receiptAudit: {
      generatedBy: r.receiptGeneratedBy || r.approvedBy || r.createdBy || 'Finance Admin',
      generatedAt: r.receiptGeneratedAt || r.paymentDate || new Date().toISOString(),
      sentBy: r.receiptSentBy || null,
      sentAt: r.receiptSentAt || null,
      downloadedAt: r.receiptDownloadedAt || null,
      resendHistory: r.receiptResendHistory || [],
    },
    emiCompletionNote: isEmiCompleted
      ? r.emiCompletionNote || 'All EMI installments have been successfully completed.'
      : null,
  }

  if (!mapped.invoiceNumber && mapped.receiptNumber) {
    mapped.invoiceNumber = mapped.receiptNumber.replace('-RCP-', '-INV-').replace(/^RCP/, 'INV')
  }

  return mapped
}

function normalizeCommunications(comms = {}) {
  const channels = ['whatsapp', 'sms', 'email']
  const out = {}
  channels.forEach((ch) => {
    const entry = comms[ch] || comms[ch.charAt(0).toUpperCase() + ch.slice(1)] || null
    out[ch] = entry
      ? {
          status: entry.status || 'Not Sent',
          sentAt: entry.sentAt || null,
          sentBy: entry.sentBy || null,
          deliveredAt: entry.deliveredAt || null,
        }
      : { status: 'Not Sent', sentAt: null, sentBy: null, deliveredAt: null }
  })
  return out
}

export function buildReceiptNumbers(row, gstSettings = {}, sequenceOverride) {
  const branchCode = resolveBranchCode(row, gstSettings)
  const fy = gstSettings.financialYear ?? new Date().getFullYear()
  const seq = sequenceOverride ?? nextSequenceNumber(branchCode, fy)
  return {
    branchCode,
    sequence: seq,
    receiptNumber: buildBranchReceiptNumber(branchCode, seq, { financialYear: fy }),
    invoiceNumber: buildInvoiceNumber(branchCode, seq, { financialYear: fy }),
  }
}

export async function ensureReceiptOnRecord(row, gstSettings = {}, options = {}) {
  if (row.receiptNumber && row.receiptLifecycleStatus !== 'Cancelled') {
    return mapReceiptCenterRow(row, gstSettings)
  }

  const numbers = buildReceiptNumbers(row, gstSettings)
  const gstBreakup = calcReceiptGst({ ...row, branchCode: numbers.branchCode }, gstSettings)
  const now = new Date().toISOString()
  const verificationHash = await generateReceiptVerificationHash({
    receiptNumber: numbers.receiptNumber,
    invoiceNumber: numbers.invoiceNumber,
    studentId: row.studentId,
    amount: row.amountPaid ?? row.totalFees,
    timestamp: now,
  })

  return mapReceiptCenterRow(
    {
      ...row,
      ...numbers,
      gst: gstBreakup.gstAmount,
      gstBreakup,
      receiptGeneratedAt: now,
      receiptGeneratedBy: options.generatedBy || 'Finance Admin',
      receiptLifecycleStatus: 'Generated',
      verificationHash,
      signatureSignedAt: now,
      timeline: [
        ...(row.timeline || []),
        { event: 'Receipt Auto-Generated', timestamp: now },
      ],
    },
    gstSettings,
  )
}

export function buildReceiptMessage(row, channel = 'WhatsApp') {
  const name = row.studentName?.split(' ')[0] || 'Student'
  const course = row.courseName || 'your course'
  const amount = row.amountPaid ?? row.totalFees
  const receipt = row.receiptNumber || '—'
  const invoice = row.invoiceNumber || receipt

  if (channel === 'SMS') {
    return `Dear ${name}, payment of Rs.${amount} for ${course} is complete. Receipt ${receipt}. Thank you — Sriram IAS.`
  }
  if (channel === 'Email') {
    return `Dear ${row.studentName},\n\nYour payment for ${course} has been successfully completed.\nReceipt Number: ${receipt}\nInvoice Number: ${invoice}\nAmount Paid: ₹${amount?.toLocaleString('en-IN')}\n\n${row.emiCompletionNote ? `${row.emiCompletionNote}\n\n` : ''}Thank you for choosing Sriram IAS.\n\nRegards,\nFinance Team`
  }
  return `Dear ${name}, your payment for ${course} has been successfully completed. Receipt ${receipt} is attached. Thank you — Sriram IAS.`
}

export function filterReceiptCenterRows(rows, filters = {}) {
  let list = [...rows]

  if (filters.search?.trim()) {
    const q = filters.search.trim().toLowerCase()
    list = list.filter(
      (r) =>
        (r.receiptNumber || '').toLowerCase().includes(q) ||
        (r.invoiceNumber || '').toLowerCase().includes(q) ||
        r.studentName.toLowerCase().includes(q) ||
        (r.mobile || '').includes(q) ||
        r.courseName.toLowerCase().includes(q),
    )
  }
  if (filters.courseId && filters.courseId !== 'all') {
    list = list.filter((r) => r.courseId === filters.courseId)
  }
  if (filters.paymentType && filters.paymentType !== 'all') {
    list = list.filter((r) => r.paymentTypeLabel === filters.paymentType)
  }
  if (filters.centerName && filters.centerName !== 'all') {
    list = list.filter((r) => r.centerName === filters.centerName)
  }
  if (filters.branchCode && filters.branchCode !== 'all') {
    list = list.filter((r) => r.branchCode === filters.branchCode)
  }
  if (filters.receiptStatus && filters.receiptStatus !== 'all') {
    list = list.filter((r) => r.receiptLifecycleStatus === filters.receiptStatus)
  }
  if (filters.dateFrom) {
    list = list.filter(
      (r) =>
        (r.receiptGeneratedAt || r.paymentDate) &&
        new Date(r.receiptGeneratedAt || r.paymentDate) >= new Date(filters.dateFrom),
    )
  }
  if (filters.dateTo) {
    list = list.filter(
      (r) =>
        (r.receiptGeneratedAt || r.paymentDate) &&
        new Date(r.receiptGeneratedAt || r.paymentDate) <= new Date(`${filters.dateTo}T23:59:59`),
    )
  }

  return list
}

/** Validate receipt edit form — preserves receipt number; requires audit reason */
export function validateReceiptEdit(form) {
  const errors = []
  if (!form.studentName?.trim()) errors.push('Student name is required.')
  if (!form.courseName?.trim()) errors.push('Course is required.')
  if (!form.paymentDate) errors.push('Payment date is required.')
  if (!form.paymentMode?.trim()) errors.push('Payment mode is required.')
  const amount = Number(form.amountPaid)
  if (!Number.isFinite(amount) || amount <= 0) errors.push('Amount paid must be greater than zero.')
  if (!form.editReason?.trim()) errors.push('Edit reason is required for the audit trail.')
  return errors
}

export function buildReceiptEditAuditEntry(payload, previous = {}) {
  const changes = []
  if (payload.studentName && payload.studentName !== previous.studentName) {
    changes.push(`Student: ${previous.studentName} → ${payload.studentName}`)
  }
  if (payload.courseName && payload.courseName !== previous.courseName) {
    changes.push(`Course: ${previous.courseName} → ${payload.courseName}`)
  }
  if (payload.batchName && payload.batchName !== previous.batchName) {
    changes.push(`Batch: ${previous.batchName || '—'} → ${payload.batchName}`)
  }
  if (payload.paymentMode && payload.paymentMode !== previous.paymentMode) {
    changes.push(`Mode: ${previous.paymentMode} → ${payload.paymentMode}`)
  }
  if (payload.amountPaid != null && Number(payload.amountPaid) !== Number(previous.amountPaid)) {
    changes.push(`Amount: ${previous.amountPaid} → ${payload.amountPaid}`)
  }
  if (payload.transactionId && payload.transactionId !== previous.transactionId) {
    changes.push(`Reference updated`)
  }
  if (payload.receiptLifecycleStatus && payload.receiptLifecycleStatus !== previous.receiptLifecycleStatus) {
    changes.push(`Status: ${previous.receiptLifecycleStatus} → ${payload.receiptLifecycleStatus}`)
  }
  return {
    adminName: payload.adminName || 'Finance Admin',
    action: 'Receipt Edited',
    comment: [payload.editReason?.trim(), changes.length ? changes.join('; ') : null]
      .filter(Boolean)
      .join(' — '),
    timestamp: new Date().toISOString(),
  }
}

export function sortReceiptRows(rows, sortKey = 'receiptGeneratedAt', sortDir = 'desc') {
  const dir = sortDir === 'asc' ? 1 : -1
  return [...rows].sort((a, b) => {
    const av = a[sortKey] ?? ''
    const bv = b[sortKey] ?? ''
    if (typeof av === 'number' && typeof bv === 'number') return (av - bv) * dir
    return String(av).localeCompare(String(bv)) * dir
  })
}

export function buildStudentReceiptHistory(payments = [], studentId) {
  return payments
    .filter((p) => p.studentId === studentId && (p.receiptNumber || isCompletedPaymentReceipt(p)))
    .map((p) => mapReceiptCenterRow(p))
    .sort((a, b) => new Date(b.receiptGeneratedAt || b.paymentDate) - new Date(a.receiptGeneratedAt || a.paymentDate))
}

export {
  printReceiptDocument,
  buildReceiptDocumentHtml as buildReceiptHtml,
  downloadReceiptHtml,
} from './finance/receiptPdf'
