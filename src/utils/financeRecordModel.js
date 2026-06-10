import { FINANCE_BATCHES, FINANCE_STATES } from '../constants/financeConstants'
import { branchToCenterName } from './financeCenterAggregation'
import { normalizePaymentModeLabel } from './finance/paymentModeUtils'

const batchName = (id) => FINANCE_BATCHES.find((b) => b.id === id)?.name || '—'

export function normalizePaymentStatus(status, row = {}) {
  if (status === 'Partial') return 'Partially Paid'
  if (status === 'Paid' && row.paymentType === 'EMI' && (row.pendingAmount || 0) > 0) return 'EMI Running'
  if (status === 'Paid' && row.paymentType === 'EMI' && !(row.pendingAmount || 0)) return 'EMI Completed'
  return status
}

export function deriveVerificationStatus(row) {
  if (row.verificationStatus) return row.verificationStatus
  if (row.paymentStatus === 'Pending' || row.paymentStatus === 'Partially Paid') return 'Pending Verification'
  if (row.paymentStatus === 'Paid' || row.paymentStatus === 'Verified') return 'Verified'
  if (row.paymentStatus === 'Failed' || row.paymentStatus === 'Rejected') return 'Rejected'
  return 'Under Review'
}

export function deriveEmiStatus(row) {
  if (row.emiStatus) return row.emiStatus
  if (row.paymentType !== 'EMI') return '—'
  if (row.paymentStatus === 'Paid' && !(row.pendingAmount || 0)) return 'EMI Completed'
  if ((row.pendingAmount || 0) > 0) return 'EMI Running'
  return 'EMI Running'
}

export function deriveRefundStatus(row) {
  if (row.refundStatus) return row.refundStatus
  if (row.paymentStatus === 'Refunded') return 'Refunded'
  if (row.refundAmount && row.refundAmount > 0 && row.refundAmount < (row.amountPaid || 0)) return 'Partially Refunded'
  if (row.refundPending) return 'Refund Pending'
  return 'Not Refunded'
}

export function deriveAccessStatus(row) {
  if (row.accessStatus) return row.accessStatus
  if (row.paymentStatus === 'Paid' || row.paymentStatus === 'EMI Running' || row.paymentStatus === 'Partially Paid') {
    return 'Active'
  }
  if (row.paymentStatus === 'Pending' || row.paymentStatus === 'Failed' || row.paymentStatus === 'Overdue') {
    return 'Blocked due to non-payment'
  }
  if (row.paymentStatus === 'Refunded') return 'Expired'
  return 'Active'
}

export function derivePaymentGateway(row) {
  if (row.paymentGateway) return row.paymentGateway
  const mode = normalizePaymentModeLabel(row.paymentMode)
  if (['Offline Cash', 'Cheque', 'DD'].includes(mode)) return 'Offline'
  if (row.transactionId?.includes('CF')) return 'Cashfree'
  if (row.attempts?.some((a) => a.gatewayResponse?.includes('CASHFREE'))) return 'Cashfree'
  return 'Razorpay'
}

export function buildStudentPaymentTimeline(row) {
  if (row.studentTimeline?.length) return row.studentTimeline
  const events = []
  const regDate = row.registrationDate || row.paymentDate || row.timeline?.[0]?.timestamp
  if (regDate) {
    events.push({ step: 'Registration', status: 'completed', timestamp: regDate })
  }
  const attempt = row.attempts?.[0] || row.timeline?.find((t) => /initiated|attempt|retried/i.test(t.event))
  if (attempt) {
    events.push({
      step: 'Payment Attempt',
      status: attempt.status === 'Failed' ? 'failed' : 'completed',
      timestamp: attempt.dateTime || attempt.timestamp,
    })
  } else if (row.timeline?.length) {
    events.push({
      step: 'Payment Attempt',
      status: 'completed',
      timestamp: row.timeline[0]?.timestamp,
    })
  }
  const success = row.timeline?.find((t) => /successful|approved|paid|receipt/i.test(t.event))
  if (success || row.paymentStatus === 'Paid' || row.amountPaid > 0) {
    events.push({
      step: 'Successful Payment',
      status: 'completed',
      timestamp: success?.timestamp || row.paymentDate,
    })
  }
  const access = deriveAccessStatus(row)
  events.push({
    step: 'Access Granted',
    status: access === 'Active' ? 'completed' : access === 'Blocked due to non-payment' ? 'blocked' : 'pending',
    timestamp: row.accessGrantedAt || (access === 'Active' ? row.paymentDate : null),
  })
  return events
}

export function enrichFinanceRecord(row) {
  const centerName = row.centerName || branchToCenterName(row.branch)
  const batchId = row.batchId || 'batch-morning'
  const state = row.state || FINANCE_STATES.find((s) => centerName?.includes('Delhi'))?.name || 'Delhi'
  const normalizedMode = normalizePaymentModeLabel(row.paymentMode)

  return {
    ...row,
    centerName,
    batchId,
    batchName: row.batchName || batchName(batchId),
    state,
    paymentMode: normalizedMode,
    paymentStatus: normalizePaymentStatus(row.paymentStatus, row),
    verificationStatus: deriveVerificationStatus(row),
    emiStatus: deriveEmiStatus(row),
    refundStatus: deriveRefundStatus(row),
    accessStatus: deriveAccessStatus(row),
    paymentGateway: derivePaymentGateway(row),
    enrollmentNumber: row.enrollmentNumber || row.studentId,
    studentTimeline: buildStudentPaymentTimeline(row),
    gstAmount: row.gst ?? row.gstAmount ?? 0,
    invoiceNumber: row.invoiceNumber || (row.receiptNumber ? row.receiptNumber.replace('RCP', 'INV') : ''),
    overdueAmount: row.overdueAmount ?? (row.paymentStatus === 'Overdue' ? row.pendingAmount : 0),
    utrNumber: row.utrNumber || row.transactionId || '',
    createdBy: row.createdBy || row.adminLogs?.[0]?.adminName || 'System',
    updatedBy: row.updatedBy || row.adminLogs?.slice(-1)[0]?.adminName || '—',
    approvedBy: row.approvedBy || row.adminLogs?.find((l) => l.action?.includes('Approved'))?.adminName || '—',
  }
}

export function enrichFinanceRows(rows) {
  return (rows || []).map(enrichFinanceRecord)
}
