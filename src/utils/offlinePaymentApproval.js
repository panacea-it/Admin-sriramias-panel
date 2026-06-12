import { ROLES } from '../constants/roles'
import { roleHasFullAccess } from '../config/rbacAccess'
import { roleHasFinancePerm, FINANCE_PERMS } from '../constants/financePermissions'
import {
  CENTER_TO_BRANCH,
  OFFLINE_BRANCH_ACCESS,
  OFFLINE_BRANCH_CODES,
  OFFLINE_DUPLICATE_STATUSES,
} from '../constants/offlinePaymentApproval'
import {
  buildDuplicateSignature,
  detectDuplicates,
  inferProofType,
  normalizeProofFiles,
} from './financeVerificationWorkflow'

export function resolveBranchCode(row = {}) {
  if (row.branchCode) return row.branchCode
  if (row.branch && OFFLINE_BRANCH_CODES.includes(row.branch)) return row.branch
  return CENTER_TO_BRANCH[row.centerName] || CENTER_TO_BRANCH[row.branch] || 'DEL'
}

export function resolveUserBranchCodes(user, role) {
  if (roleHasFullAccess(role) || roleHasFinancePerm(role, FINANCE_PERMS.HEAD_APPROVE)) {
    return OFFLINE_BRANCH_CODES
  }
  const centers = user?.centers || []
  if (centers.includes('All Centers') || !centers.length) {
    if (role === ROLES.OPERATION_ADMIN) return OFFLINE_BRANCH_CODES
    return OFFLINE_BRANCH_CODES
  }
  const codes = new Set()
  centers.forEach((c) => {
    const code = CENTER_TO_BRANCH[c] || (OFFLINE_BRANCH_CODES.includes(c) ? c : null)
    if (code) codes.add(code)
  })
  return codes.size ? [...codes] : OFFLINE_BRANCH_CODES
}

export function evaluateBranchAccess(row, { user, role, canFinanceHeadApprove }) {
  const branchCode = resolveBranchCode(row)
  const userBranches = resolveUserBranchCodes(user, role)

  if (roleHasFullAccess(role)) {
    return { branchCode, status: OFFLINE_BRANCH_ACCESS.ALLOWED, canAct: true, message: null }
  }
  if (canFinanceHeadApprove) {
    const allowed = userBranches.includes(branchCode)
    if (allowed) {
      return { branchCode, status: OFFLINE_BRANCH_ACCESS.ALLOWED, canAct: true, message: null }
    }
    return {
      branchCode,
      status: OFFLINE_BRANCH_ACCESS.OVERRIDE,
      canAct: true,
      message: 'Finance Head override — cross-branch approval permitted',
    }
  }
  if (userBranches.includes(branchCode)) {
    return { branchCode, status: OFFLINE_BRANCH_ACCESS.ALLOWED, canAct: true, message: null }
  }
  return {
    branchCode,
    status: OFFLINE_BRANCH_ACCESS.RESTRICTED,
    canAct: false,
    message: `You can only approve payments for your assigned branch. This payment belongs to ${branchCode}.`,
  }
}

export function hasRequiredProof(row) {
  const files = normalizeProofFiles(row)
  return files.length > 0 || Boolean(row.paymentProof)
}

export function enrichOfflineApprovalRow(row, { existingPayments = [] } = {}) {
  const branchCode = resolveBranchCode(row)
  const proofFiles = normalizeProofFiles(row)
  const paymentDate = row.paymentDate || row.requestedDate
  const enriched = {
    ...row,
    branchCode,
    student: row.studentName,
    paymentDate,
    receiptNumber: row.receiptNumber || row.utrNumber || '',
    referenceNumber: row.utrNumber || row.transactionId || row.receiptNumber,
    proofFiles,
    proofRequired: true,
    hasProof: proofFiles.length > 0 || Boolean(row.paymentProof),
    workflowStatus: row.workflowStatus || mapLegacyStatus(row.status),
    reconciliationStatus:
      row.reconciliationStatus ||
      (row.paymentMode === 'Cash' ? 'Pending Verification' : 'Matched'),
    updatedAt: row.updatedAt || row.requestedDate,
    approvedBy: row.approvedBy || '—',
  }

  const [withDup] = detectDuplicates([enriched], existingPayments)
  let duplicateStatus = row.duplicateStatus || OFFLINE_DUPLICATE_STATUSES[0]
  if (withDup.isDuplicate && !withDup.duplicateOverride) {
    duplicateStatus = OFFLINE_DUPLICATE_STATUSES[1]
  } else if (withDup.duplicateOverride) {
    duplicateStatus = OFFLINE_DUPLICATE_STATUSES[3]
  } else if (row.duplicateConfirmed) {
    duplicateStatus = OFFLINE_DUPLICATE_STATUSES[2]
  }

  return {
    ...withDup,
    duplicateStatus,
    uploadHash: row.uploadHash || buildDuplicateSignature(enriched),
  }
}

function mapLegacyStatus(status) {
  if (status === 'Pending Approval' || status === 'Pending' || status === 'Uploaded') {
    return 'Pending'
  }
  if (status === 'Approved') return 'Approved'
  if (status === 'Rejected') return 'Rejected'
  return status || 'Pending'
}

export function filterOfflineByFinanceCenters(rows = [], centerFilter) {
  if (!centerFilter || centerFilter.isOverallView) return rows
  const centerNames = new Set((centerFilter.selectedCenters || []).map((c) => c.centerName).filter(Boolean))
  if (!centerNames.size) return rows
  return rows.filter((row) => centerNames.has(row.centerName))
}

export function canApproveOfflineRow(row, access, { canApprove, canFinanceHeadApprove }) {
  if (!canApprove) return { ok: false, reason: 'Not permitted' }
  if (!access.canAct) return { ok: false, reason: access.message }
  const pending = ['Pending', 'Under Verification', 'Pending Approval', 'Uploaded'].includes(
    row.workflowStatus || row.status,
  )
  if (!pending) return { ok: false, reason: 'Payment is not pending approval' }
  if (!hasRequiredProof(row)) return { ok: false, reason: 'Receipt upload is mandatory before approval' }
  if (row.isDuplicate && !row.duplicateOverride && !canFinanceHeadApprove) {
    return { ok: false, reason: 'Duplicate detected — Finance Head override required' }
  }
  if (row.reconciliationStatus === 'Mismatch Detected' && !canFinanceHeadApprove) {
    return { ok: false, reason: 'Cash reconciliation mismatch — Finance Head review required' }
  }
  return { ok: true, reason: null }
}

export function buildOfflineWorkflowTimeline(row) {
  const events = []
  const push = (step, detail, timestamp, status = 'completed') => {
    events.push({ step, detail, timestamp, status })
  }

  push('Student submission', `${row.studentName} submitted offline payment`, row.requestedDate)
  push('Branch verification', row.centerName ? `Assigned to ${row.centerName}` : '', row.requestedDate, 'pending')

  if (row.workflowStatus === 'Under Verification' || row.auditTrail?.length) {
    push('Under verification', 'Branch team reviewing proof', row.updatedAt, 'pending')
  }

  ;(row.auditTrail || []).forEach((a) => {
    const failed = /reject|unauthorized/i.test(a.action)
    push(a.action, [a.by, a.remark || a.note].filter(Boolean).join(' — '), a.at, failed ? 'failed' : 'completed')
  })

  if (row.workflowStatus === 'Approved' || row.status === 'Approved') {
    push('Finance approval', row.approvedBy ? `Approved by ${row.approvedBy}` : 'Approved', row.approvedAt || row.updatedAt)
    push('Final confirmation', 'Payment recorded in finance ledger', row.approvedAt || row.updatedAt)
  }
  if (row.workflowStatus === 'Rejected' || row.status === 'Rejected') {
    push('Rejected', row.rejectionReason || row.rejectedBy || 'Request rejected', row.rejectedAt || row.updatedAt, 'failed')
  }
  if (row.workflowStatus === 'Reconciliation Pending') {
    push('Reconciliation pending', row.reconciliationNotes || 'Cash handover verification in progress', row.updatedAt, 'pending')
  }

  return events
}

export function buildDailyOfflineSummary(rows = [], { dateFrom, dateTo, branchCode, paymentMode, status } = {}) {
  const filtered = rows.filter((r) => {
    const d = new Date(r.requestedDate || r.paymentDate)
    if (dateFrom && d < new Date(dateFrom)) return false
    if (dateTo) {
      const end = new Date(dateTo)
      end.setHours(23, 59, 59, 999)
      if (d > end) return false
    }
    if (branchCode && branchCode !== 'all' && resolveBranchCode(r) !== branchCode) return false
    if (paymentMode && paymentMode !== 'all' && r.paymentMode !== paymentMode) return false
    if (status && status !== 'all') {
      const ws = r.workflowStatus || r.status
      if (ws !== status && r.status !== status) return false
    }
    return true
  })

  const sum = (list) => list.reduce((s, r) => s + (Number(r.amount) || 0), 0)
  const isCash = (m) => /cash/i.test(m || '')
  const isBank = (m) => /bank|transfer|neft|rtgs/i.test(m || '')
  const isCheque = (m) => /cheque|dd/i.test(m || '')
  const isPending = (r) => ['Pending', 'Under Verification', 'Pending Approval', 'Uploaded'].includes(r.workflowStatus || r.status)
  const isRejected = (r) => r.workflowStatus === 'Rejected' || r.status === 'Rejected'
  const isApproved = (r) => r.workflowStatus === 'Approved' || r.status === 'Approved'

  const branchTotals = {}
  filtered.forEach((r) => {
    const bc = resolveBranchCode(r)
    if (!branchTotals[bc]) branchTotals[bc] = { branchCode: bc, count: 0, amount: 0 }
    branchTotals[bc].count += 1
    branchTotals[bc].amount += Number(r.amount) || 0
  })

  return {
    totalCollections: sum(filtered.filter(isApproved)),
    totalOffline: sum(filtered),
    cashCollections: sum(filtered.filter((r) => isCash(r.paymentMode))),
    bankCollections: sum(filtered.filter((r) => isBank(r.paymentMode))),
    chequeCollections: sum(filtered.filter((r) => isCheque(r.paymentMode))),
    pendingApprovals: filtered.filter(isPending).length,
    rejectedPayments: filtered.filter(isRejected).length,
    approvedCount: filtered.filter(isApproved).length,
    branchBreakdown: Object.values(branchTotals),
    rows: filtered,
  }
}

export function computeCashReconciliation(row) {
  const expected = Number(row.amount) || 0
  const collected = Number(row.cashCollectedAmount ?? row.amount) || 0
  const verified = Number(row.reconciliationVerifiedAmount ?? collected) || 0
  let reconciliationStatus = row.reconciliationStatus || OFFLINE_RECONCILIATION_STATUSES[1]

  if (/cash/i.test(row.paymentMode || '')) {
    if (verified === expected && collected === expected) reconciliationStatus = 'Matched'
    else if (verified > 0 && verified !== expected) reconciliationStatus = 'Mismatch Detected'
    else reconciliationStatus = 'Pending Verification'
  } else {
    reconciliationStatus = 'Matched'
  }

  return {
    expectedAmount: expected,
    collectedAmount: collected,
    verifiedAmount: verified,
    difference: verified - expected,
    reconciliationStatus,
  }
}

export function appendOfflineAudit(row, entry) {
  const audit = [...(row.auditTrail || []), { ...entry, at: entry.at || new Date().toISOString() }]
  return { ...row, auditTrail: audit, updatedAt: new Date().toISOString() }
}

export function inferProofFilesFromNames(names = []) {
  return names.map((name, i) => ({
    id: `proof-${i}`,
    name,
    type: inferProofType(name),
    url: null,
  }))
}
