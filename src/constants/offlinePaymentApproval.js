/** Offline Payment Approval — workflow, branch, reconciliation constants */

export const OFFLINE_BRANCH_CODES = ['DEL', 'HYD', 'PUN']

export const OFFLINE_BRANCH_LABELS = {
  DEL: 'Delhi',
  HYD: 'Hyderabad',
  PUN: 'Pune / Mumbai',
}

export const CENTER_TO_BRANCH = {
  'Delhi Center': 'DEL',
  'Delhi HQ': 'DEL',
  'Hyderabad Center': 'HYD',
  'Mumbai Center': 'PUN',
  'Pune Center': 'PUN',
}

export const OFFLINE_WORKFLOW_STATUSES = [
  'Pending',
  'Under Verification',
  'Approved',
  'Rejected',
  'Reconciliation Pending',
]

export const OFFLINE_RECONCILIATION_STATUSES = [
  'Matched',
  'Pending Verification',
  'Mismatch Detected',
  'Reconciled',
]

export const OFFLINE_DUPLICATE_STATUSES = [
  'Unique',
  'Possible Duplicate',
  'Duplicate Confirmed',
  'Override Approved',
]

export const OFFLINE_BRANCH_ACCESS = {
  ALLOWED: 'Allowed',
  RESTRICTED: 'Restricted',
  OVERRIDE: 'Override Approved',
}

export const OFFLINE_AUDIT_ACTIONS = [
  'Approval',
  'Rejection',
  'Edit',
  'Re-upload',
  'Reconciliation update',
  'Override approval',
  'Duplicate override',
  'Unauthorized attempt',
]

export const OFFLINE_NOTIFICATION_TYPES = [
  'offline_submitted',
  'approval_completed',
  'rejection_completed',
  'duplicate_detected',
  'reconciliation_mismatch',
]

export const OFFLINE_SUMMARY_EXPORT_COLUMNS = [
  { key: 'id', label: 'Payment ID' },
  { key: 'studentName', label: 'Student' },
  { key: 'branchCode', label: 'Branch' },
  { key: 'paymentMode', label: 'Mode' },
  { key: 'amount', label: 'Amount' },
  { key: 'status', label: 'Status' },
  { key: 'reconciliationStatus', label: 'Reconciliation' },
  { key: 'requestedDate', label: 'Requested' },
]

export const OFFLINE_TABLE_EXPORT_COLUMNS = [
  { key: 'id', label: 'Payment ID' },
  { key: 'studentName', label: 'Student Name' },
  { key: 'branchCode', label: 'Branch' },
  { key: 'paymentMode', label: 'Payment Mode' },
  { key: 'receiptNumber', label: 'Receipt Number' },
  { key: 'paymentProof', label: 'Uploaded Proof' },
  { key: 'status', label: 'Approval Status' },
  { key: 'reconciliationStatus', label: 'Reconciliation Status' },
  { key: 'duplicateStatus', label: 'Duplicate Warning' },
  { key: 'approvedBy', label: 'Approved By' },
  { key: 'updatedAt', label: 'Updated On' },
  { key: 'amount', label: 'Amount' },
]
