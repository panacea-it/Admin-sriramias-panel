import { FINANCE_GATEWAY_AUTO_VERIFY_MODES } from '../constants/financeVerification'

const DUPLICATE_KEYS = ['studentId', 'utrNumber', 'amount', 'paymentDate', 'referenceNumber']

export function normalizePaymentMode(mode = '') {
  const m = String(mode).toLowerCase()
  if (m.includes('gateway') || m === 'online gateway') return 'Online Gateway'
  if (m === 'upi' || m.includes('upi')) return 'UPI'
  if (m === 'card') return 'Card'
  if (m.includes('net banking') || m.includes('bank transfer')) return 'Net Banking'
  return mode
}

export function isGatewayAutoVerifyMode(paymentMode) {
  const normalized = normalizePaymentMode(paymentMode)
  return FINANCE_GATEWAY_AUTO_VERIFY_MODES.includes(normalized)
}

export function buildDuplicateSignature(row) {
  return DUPLICATE_KEYS.map((k) => {
    const val = k === 'referenceNumber' ? row.utrNumber || row.transactionId : row[k]
    if (k === 'amount') return Number(val) || 0
    if (k === 'paymentDate') {
      const d = row.paymentDate || row.submittedAt
      return d ? new Date(d).toISOString().slice(0, 10) : ''
    }
    return String(val || '').trim().toLowerCase()
  }).join('|')
}

export function detectDuplicates(rows = [], existingPayments = []) {
  const seen = new Map()
  const pool = [...existingPayments, ...rows]

  pool.forEach((row) => {
    if (!row?.id) return
    const sig = buildDuplicateSignature(row)
    if (!sig.replace(/\|/g, '')) return
    if (!seen.has(sig)) seen.set(sig, [])
    seen.get(sig).push(row)
  })

  const duplicateMap = new Map()
  seen.forEach((matches, sig) => {
    if (matches.length < 2) return
    matches.forEach((row) => {
      const others = matches.filter((m) => m.id !== row.id)
      if (others.length) duplicateMap.set(row.id, others)
    })
  })

  return rows.map((row) => {
    const matches = duplicateMap.get(row.id) || []
    const isDuplicate = matches.length > 0 && !row.duplicateOverride
    return {
      ...row,
      isDuplicate,
      duplicateMatches: matches.map((m) => ({
        id: m.id,
        student: m.student || m.studentName,
        verificationStatus: m.verificationStatus,
        approvalStatus: m.approvalStatus,
        paymentDate: m.paymentDate || m.submittedAt,
        utrNumber: m.utrNumber || m.transactionId,
        amount: m.amount ?? m.amountPaid,
        status: m.approvalStatus || m.verificationStatus,
      })),
    }
  })
}

export function enrichVerificationRow(row, { existingPayments = [] } = {}) {
  const paymentMode = normalizePaymentMode(row.paymentMode)
  const gatewaySuccess = row.gatewayResponse?.status === 'success'
  const autoVerified =
    row.autoVerified ||
    (isGatewayAutoVerifyMode(paymentMode) && gatewaySuccess && row.approvalStatus !== 'Approved')

  let approvalStatus = row.approvalStatus || 'Pending Verification'
  let verificationStatus = row.verificationStatus || 'Pending Verification'

  if (autoVerified && !row.manuallyVerified) {
    verificationStatus = 'Auto Verified'
    if (approvalStatus === 'Pending Verification') approvalStatus = 'Sent to Finance Head'
  }

  const enriched = {
    ...row,
    paymentMode,
    verificationStatus,
    approvalStatus,
    autoVerified,
    currentApprover: resolveCurrentApprover({ ...row, approvalStatus, verificationStatus }),
    updatedAt: row.updatedAt || row.submittedAt,
    paymentDate: row.paymentDate || row.submittedAt,
    referenceNumber: row.referenceNumber || row.utrNumber,
    transactionId: row.transactionId || row.utrNumber,
    proofFiles: normalizeProofFiles(row),
  }

  const [withDup] = detectDuplicates([enriched], existingPayments)
  return withDup
}

export function resolveCurrentApprover(row) {
  const st = row.approvalStatus
  if (st === 'Approved' || st === 'Rejected') return '—'
  if (st === 'Sent to Finance Head') return 'Finance Head'
  if (['Verified', 'Pending Verification'].includes(st) || row.verificationStatus === 'Under Review') {
    return 'Verification Officer'
  }
  return row.currentApprover || 'Verification Officer'
}

export function normalizeProofFiles(row) {
  if (Array.isArray(row.proofFiles) && row.proofFiles.length) return row.proofFiles
  if (row.paymentProof) {
    return [
      {
        id: `${row.id}-proof-1`,
        name: row.paymentProof,
        type: inferProofType(row.paymentProof),
        url: row.proofUrl || null,
      },
    ]
  }
  return []
}

export function inferProofType(name = '') {
  const lower = name.toLowerCase()
  if (lower.endsWith('.pdf')) return 'pdf'
  if (/\.(png|jpe?g|webp|gif)$/.test(lower)) return 'image'
  if (lower.includes('cheque')) return 'cheque'
  if (lower.includes('slip') || lower.includes('receipt') || lower.includes('transfer')) return 'bank_slip'
  if (lower.includes('screenshot') || lower.includes('upi')) return 'screenshot'
  return 'image'
}

export function buildVerificationTimeline(row) {
  const events = []
  const push = (step, detail, timestamp, status = 'completed') => {
    if (!timestamp && !detail) return
    events.push({ step, detail, timestamp, status })
  }

  push('Payment created', row.student ? `Submitted by ${row.student}` : '', row.submittedAt || row.createdAt)

  ;(row.auditTrail || []).forEach((a) => {
    push(a.action, a.remark || a.note ? `By ${a.by} — ${a.remark || a.note}` : `By ${a.by}`, a.at)
  })

  if (row.autoVerified) {
    push(
      'Auto verified',
      'Verified automatically via payment gateway',
      row.autoVerifiedAt || row.verifiedAt,
      'completed',
    )
  } else if (row.verifiedAt || row.verifiedBy !== '—') {
    push('Verified', row.verifiedBy ? `By ${row.verifiedBy}` : '', row.verifiedAt)
  }

  if (row.sentToFinanceHeadAt) {
    push('Sent to Finance Head', row.currentApprover === 'Finance Head' ? 'Awaiting final approval' : '', row.sentToFinanceHeadAt)
  }

  if (row.approvalStatus === 'Approved') {
    push('Approved', row.approvedBy ? `By ${row.approvedBy}` : '', row.approvedAt)
  }
  if (row.approvalStatus === 'Rejected') {
    push(
      'Rejected',
      row.rejectedBy
        ? `By ${row.rejectedBy}${row.rejectionRemarks ? ` — ${row.rejectionRemarks}` : ''}`
        : row.rejectionRemarks || '',
      row.rejectedAt,
      'failed',
    )
  }

  ;(row.notificationLog || []).forEach((n) => {
    push(
      'Notification sent',
      `${n.channel}: ${n.message || n.statusUpdate || ''}`,
      n.timestamp,
      n.status === 'failed' ? 'failed' : 'completed',
    )
  })

  return events
}

export function canVerifierAct(row) {
  if (row.isDuplicate && !row.duplicateOverride) return false
  return ['Pending Verification', 'Under Review'].includes(row.verificationStatus)
}

export function canFinanceHeadAct(row) {
  if (row.isDuplicate && !row.duplicateOverride) return false
  return row.approvalStatus === 'Sent to Finance Head'
}

export function canFinalApprove(row) {
  return canFinanceHeadAct(row)
}

export const REJECTION_REMARK_MIN_LENGTH = 10

export function validateRejectionRemarks(text = '') {
  const trimmed = text.trim()
  if (!trimmed) return 'Rejection remarks are required'
  if (trimmed.length < REJECTION_REMARK_MIN_LENGTH) {
    return `Remarks must be at least ${REJECTION_REMARK_MIN_LENGTH} characters`
  }
  return null
}
