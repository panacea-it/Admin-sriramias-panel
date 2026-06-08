/** Offline payment approval — branch RBAC, audit, reconciliation */

const BRANCH_CODES = ['DEL', 'HYD', 'PUN']

const CENTER_TO_BRANCH = {
  'Delhi Center': 'DEL',
  'Delhi HQ': 'DEL',
  'Hyderabad Center': 'HYD',
  'Mumbai Center': 'PUN',
  'Pune Center': 'PUN',
}

export function resolveBranchCode(row = {}) {
  if (row.branchCode) return row.branchCode
  return CENTER_TO_BRANCH[row.centerName] || row.branch || 'DEL'
}

export function evaluateBranchAccess(row, user = {}) {
  const role = String(user.role || '').toLowerCase()
  const branchCode = resolveBranchCode(row)
  const isSuper = role.includes('super')
  const isFinanceHead = role.includes('operation') || user.canFinanceHeadApprove

  if (isSuper) return { branchCode, allowed: true, override: false }
  if (isFinanceHead) return { branchCode, allowed: true, override: true }

  const userBranches = (user.branches || user.centers || [])
    .map((c) => CENTER_TO_BRANCH[c] || (BRANCH_CODES.includes(c) ? c : null))
    .filter(Boolean)

  if (!userBranches.length || userBranches.includes(branchCode)) {
    return { branchCode, allowed: true, override: false }
  }
  return { branchCode, allowed: false, override: false, message: `Restricted to branch ${branchCode}` }
}

export function mapOfflineFull(doc) {
  const p = doc.toObject ? doc.toObject() : { ...doc }
  const branchCode = resolveBranchCode(p)
  return {
    id: p.paymentId || String(p._id),
    studentName: p.studentName,
    studentId: p.studentId,
    centerName: p.centerName,
    branchCode,
    course: p.courseName,
    courseId: p.courseId,
    amount: p.amountPaid || p.totalFees,
    status: normalizeStatus(p.offlineStatus),
    workflowStatus: p.offlineWorkflowStatus || normalizeWorkflow(p.offlineStatus),
    requestedDate: p.requestedDate,
    updatedAt: p.updatedAt,
    paymentProof: p.paymentProof,
    proofFiles: p.proofFiles || [],
    paymentMode: p.paymentMode,
    utrNumber: p.transactionId || p.utrNumber || '',
    receiptNumber: p.receiptNumber || p.transactionId || '',
    verificationNotes: p.verificationNotes || '',
    reconciliationStatus: p.reconciliationStatus || 'Pending Verification',
    reconciliationNotes: p.reconciliationNotes || '',
    cashCollectedAmount: p.cashCollectedAmount,
    reconciliationVerifiedAmount: p.reconciliationVerifiedAmount,
    duplicateStatus: p.duplicateStatus || 'Unique',
    duplicateOverride: p.duplicateOverride || false,
    approvedBy: p.approvedBy || '—',
    approvedAt: p.approvedAt,
    rejectedBy: p.rejectedBy,
    rejectionReason: p.rejectionReason,
    auditTrail: (p.offlineAuditTrail || p.adminLogs || []).map((a) => ({
      by: a.by || a.adminName,
      action: a.action,
      remark: a.remark || a.comment,
      at: a.at || a.timestamp,
      branch: a.branch || branchCode,
      ip: a.ip,
    })),
    notificationLog: p.notificationLog || [],
  }
}

function normalizeStatus(st) {
  if (st === 'Pending') return 'Pending Approval'
  return st || 'Pending Approval'
}

function normalizeWorkflow(st) {
  if (st === 'Approved') return 'Approved'
  if (st === 'Rejected') return 'Rejected'
  return 'Pending'
}

export function appendAudit(doc, entry) {
  if (!doc.offlineAuditTrail) doc.offlineAuditTrail = []
  doc.offlineAuditTrail.push({
    ...entry,
    at: entry.at || new Date(),
    timestamp: entry.at || new Date(),
  })
  doc.adminLogs.push({
    adminName: entry.by || 'Admin',
    action: entry.action,
    comment: entry.remark || entry.comment,
    timestamp: new Date(),
  })
}

export function validateApproval(doc, payload = {}) {
  const hasProof = Boolean(doc.paymentProof) || (doc.proofFiles && doc.proofFiles.length > 0)
  if (payload.newStatus === 'Approved' && !hasProof) {
    return { ok: false, message: 'Receipt upload is mandatory before approval' }
  }
  if (doc.duplicateStatus === 'Possible Duplicate' && !doc.duplicateOverride && !payload.overrideDuplicate) {
    return { ok: false, message: 'Duplicate detected — Finance Head override required' }
  }
  if (doc.reconciliationStatus === 'Mismatch Detected' && !payload.financeHeadOverride) {
    return { ok: false, message: 'Cash reconciliation mismatch requires Finance Head review' }
  }
  return { ok: true }
}

export function applyOfflineDecision(doc, payload = {}) {
  const approved = payload.newStatus === 'Approved'
  const now = new Date()

  doc.offlineStatus = approved ? 'Approved' : 'Rejected'
  doc.offlineWorkflowStatus = approved ? 'Approved' : 'Rejected'
  doc.paymentStatus = approved ? 'Paid' : doc.paymentStatus
  doc.approvedBy = approved ? payload.adminName || 'Admin' : doc.approvedBy
  doc.approvedAt = approved ? now : doc.approvedAt
  doc.rejectedBy = approved ? doc.rejectedBy : payload.adminName || 'Admin'
  doc.rejectionReason = approved ? doc.rejectionReason : payload.reason || payload.comment
  doc.approvalRemarks = approved ? payload.comment : doc.approvalRemarks

  if (approved && /cash/i.test(doc.paymentMode || '')) {
    doc.reconciliationStatus = 'Reconciled'
  }

  appendAudit(doc, {
    by: payload.adminName || 'Admin',
    action: approved ? 'Approval' : 'Rejection',
    remark: approved ? payload.comment || 'Proof verified' : payload.reason || payload.comment,
    branch: resolveBranchCode(doc),
    ip: payload.ip,
  })

  return doc
}

export function buildSummary(rows = []) {
  const sum = (list) => list.reduce((s, r) => s + (Number(r.amount) || 0), 0)
  const isCash = (m) => /cash/i.test(m || '')
  const isBank = (m) => /bank|transfer|neft/i.test(m || '')
  const isCheque = (m) => /cheque|dd/i.test(m || '')
  const isPending = (r) => ['Pending', 'Pending Approval', 'Under Verification'].includes(r.status || r.workflowStatus)
  const isRejected = (r) => r.status === 'Rejected' || r.workflowStatus === 'Rejected'
  const isApproved = (r) => r.status === 'Approved' || r.workflowStatus === 'Approved'

  return {
    totalOffline: sum(rows),
    totalCollections: sum(rows.filter(isApproved)),
    cashCollections: sum(rows.filter((r) => isCash(r.paymentMode))),
    bankCollections: sum(rows.filter((r) => isBank(r.paymentMode))),
    chequeCollections: sum(rows.filter((r) => isCheque(r.paymentMode))),
    pendingApprovals: rows.filter(isPending).length,
    rejectedPayments: rows.filter(isRejected).length,
    approvedCount: rows.filter(isApproved).length,
  }
}
