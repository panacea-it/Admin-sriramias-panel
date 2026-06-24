/** Student Finance Profiles — enrollment, loan, wallet, documents, risk */

export const ENROLLMENT_SOURCES = [
  { id: 'website', label: 'Website', color: 'bg-[#eef6fc] text-[#246392]' },
  { id: 'counselor', label: 'Counselor', color: 'bg-[#eef8eb] text-[#1a5c3a]' },
  { id: 'referral', label: 'Referral', color: 'bg-[#fff8eb] text-[#b8887a]' },
  { id: 'offline_center', label: 'Offline Center', color: 'bg-[#f3eefc] text-[#5c3a7a]' },
]

export const LOAN_STATUSES = [
  'Not Applied',
  'Applied',
  'Under Review',
  'Approved',
  'Rejected',
  'Disbursed',
  'EMI Active',
  'Closed',
]

export const LOAN_PROVIDERS = ['Bajaj', 'Liquiloans', 'Propelld', 'Eduvanz', 'Institute EMI', 'Other']

export const WALLET_TXN_TYPES = ['Credit', 'Debit', 'Refund', 'Adjustment', 'Cashback']

export const FINANCE_DOCUMENT_TYPES = [
  { id: 'aadhaar', label: 'Aadhaar', required: true },
  { id: 'fee_agreement', label: 'Fee Agreement', required: true },
  { id: 'loan_agreement', label: 'Loan Agreement', required: false },
  { id: 'pan', label: 'PAN Card', required: false },
  { id: 'payment_proof', label: 'Payment Proofs', required: false },
  { id: 'scholarship', label: 'Scholarship Documents', required: false },
]

export const REFUND_STATUSES = ['Requested', 'Approved', 'Rejected', 'Processed']

export const PAYMENT_BEHAVIOR_CATEGORIES = [
  { id: 'excellent', label: 'Excellent', color: 'text-[#1a5c3a] bg-[#eef8eb]' },
  { id: 'good', label: 'Good', color: 'text-[#246392] bg-[#eef6fc]' },
  { id: 'moderate', label: 'Moderate Risk', color: 'text-[#b8887a] bg-[#fff8eb]' },
  { id: 'high', label: 'High Risk', color: 'text-[#df8284] bg-red-50' },
]

export const FINANCE_HEALTH_LEVELS = {
  paid: { id: 'paid', label: 'Fully paid', color: 'from-[#69df66] to-[#1a5c3a]', ring: 'ring-[#69df66]/30' },
  partial: { id: 'partial', label: 'Partial pending', color: 'from-[#efb36d] to-[#b8887a]', ring: 'ring-amber-200' },
  high: { id: 'high', label: 'High pending dues', color: 'from-[#df8284] to-[#b85c5e]', ring: 'ring-red-200' },
}

export const PROFILE_NOTIFICATION_CHANNELS = ['In-app', 'Email', 'SMS', 'WhatsApp']

export const PROFILE_FINANCE_ACTIONS = [
  { id: 'add_payment', label: 'Add payment', perm: 'edit' },
  { id: 'receipt', label: 'Generate receipt', perm: 'receipts' },
  { id: 'scholarship', label: 'Apply scholarship', perm: 'edit' },
  { id: 'discount', label: 'Add discount', perm: 'edit' },
  { id: 'refund', label: 'Process refund', perm: 'approve' },
  { id: 'suspend', label: 'Suspend access', perm: 'approve' },
  { id: 'reminder', label: 'Send reminder', perm: 'view' },
  { id: 'download', label: 'Download finance summary', perm: 'export' },
]

export const PROFILE_EXPORT_COLUMNS = [
  { key: 'id', label: 'Student ID' },
  { key: 'studentName', label: 'Student Name' },
  { key: 'primaryCourse', label: 'Course' },
  { key: 'enrollmentSourceLabel', label: 'Enrollment Source' },
  { key: 'totalFees', label: 'Total Fees' },
  { key: 'totalPaid', label: 'Paid Amount' },
  { key: 'totalPending', label: 'Pending Amount' },
  { key: 'emiStatus', label: 'EMI Status' },
  { key: 'loanStatus', label: 'Loan Status' },
  { key: 'walletBalance', label: 'Wallet Balance' },
  { key: 'riskScore', label: 'Risk Score' },
  { key: 'updatedAt', label: 'Updated On' },
]
