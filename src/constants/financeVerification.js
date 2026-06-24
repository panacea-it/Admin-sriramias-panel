/** Payment Verification Center — status metadata & export */

export const FINANCE_APPROVAL_STATUSES = [
  'Pending Verification',
  'Verified',
  'Sent to Finance Head',
  'Approved',
  'Rejected',
]

export const FINANCE_GATEWAY_AUTO_VERIFY_MODES = [
  'Online Gateway',
  'UPI',
  'Card',
  'Net Banking',
]

export const FINANCE_PROOF_ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf']
export const FINANCE_PROOF_ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.pdf']
export const FINANCE_PROOF_MAX_SIZE_MB = 5

export const FINANCE_VERIFICATION_STATUS_META = {
  'Pending Verification': {
    description: 'Payment submitted but not checked yet',
    sample: 'Student uploaded UPI screenshot; awaiting finance review',
  },
  'Under Review': {
    description: 'Finance or admin is currently reviewing proof',
    sample: 'Proof re-uploaded; verifier checking amount and UTR match',
  },
  'Auto Verified': {
    description: 'Verified automatically via payment gateway',
    sample: 'Gateway response success — sent to Finance Head for final approval',
  },
  Verified: {
    description: 'Payment verified by verification officer',
    sample: 'Proof and UTR matched — awaiting Finance Head approval',
  },
  Approved: {
    description: 'Payment verified successfully (moves to Student Payment Reports)',
    sample: 'Approved payments no longer appear in this queue',
  },
  Rejected: {
    description: 'Invalid proof or payment mismatch',
    sample: 'UTR does not match bank statement or amount differs',
  },
  Escalated: {
    description: 'Sent to senior finance or admin for manual verification',
    sample: 'High-value offline transfer flagged for manager sign-off',
  },
}

export const FINANCE_APPROVAL_STATUS_META = {
  'Pending Verification': { description: 'Awaiting verification officer review' },
  Verified: { description: 'Verified by officer — pending Finance Head routing' },
  'Sent to Finance Head': { description: 'Awaiting final approval from Finance Head' },
  Approved: { description: 'Final approval granted' },
  Rejected: { description: 'Payment rejected with remarks' },
}

export const VERIFICATION_QUEUE_EXPORT_COLUMNS = [
  { key: 'id', label: 'Payment ID' },
  { key: 'student', label: 'Student Name' },
  { key: 'studentId', label: 'Student ID' },
  { key: 'centerName', label: 'Center' },
  { key: 'course', label: 'Course' },
  { key: 'paymentMode', label: 'Payment Mode' },
  { key: 'verificationStatus', label: 'Verification Status' },
  { key: 'approvalStatus', label: 'Approval Status' },
  {
    key: 'amount',
    label: 'Amount',
    export: (row) =>
      new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(
        row.amount ?? 0,
      ),
  },
  { key: 'utrNumber', label: 'Transaction ID' },
  { key: 'verifiedBy', label: 'Verified By' },
  { key: 'approvedBy', label: 'Finance Head Status' },
  {
    key: 'updatedAt',
    label: 'Updated On',
    export: (row) => {
      const raw = row.updatedAt || row.submittedAt
      if (!raw) return ''
      const d = new Date(raw)
      if (Number.isNaN(d.getTime())) return ''
      const time = d.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true })
      const date = d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
      return `${time}, ${date}`
    },
  },
  { key: 'remarks', label: 'Verification Remarks' },
  { key: 'rejectionRemarks', label: 'Rejection Remarks' },
  {
    key: 'isDuplicate',
    label: 'Duplicate Warning',
    export: (row) => (row.isDuplicate ? 'Possible Duplicate' : ''),
  },
]
