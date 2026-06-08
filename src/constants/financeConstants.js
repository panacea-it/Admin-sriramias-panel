/** Finance Operations — shared constants (ERP workflows) */

export const FINANCE_PAYMENT_STATUSES = [
  'Paid',
  'Partially Paid',
  'Pending',
  'Overdue',
  'Failed',
  'Verification Pending',
  'Verified',
  'Rejected',
  'Refunded',
  'EMI Running',
  'EMI Completed',
]

export const FINANCE_VERIFICATION_STATUSES = [
  'Pending Verification',
  'Under Review',
  'Auto Verified',
  'Verified',
  'Approved',
  'Rejected',
  'Escalated',
]

export const FINANCE_OFFLINE_STATUSES = ['Uploaded', 'Pending Approval', 'Approved', 'Rejected']

export const FINANCE_EMI_STATUSES = ['EMI Running', 'EMI Completed', 'Overdue', 'Due']

/** @deprecated Use FINANCE_STANDARD_PAYMENT_MODES — kept for backward compatibility */
export const FINANCE_PAYMENT_MODES = ['UPI', 'Card', 'Bank Transfer', 'Cash', 'UPI Offline', 'Cheque']

/** Standardized payment modes for reports, filters, and mode management */
export const FINANCE_PAYMENT_MODE_CATEGORIES = [
  { id: 'online', label: 'Online' },
  { id: 'offline', label: 'Offline' },
  { id: 'banking', label: 'Banking' },
  { id: 'wallet', label: 'Wallet' },
  { id: 'international', label: 'International' },
  { id: 'other', label: 'Other' },
]

export const FINANCE_PAYMENT_MODE_ICON_OPTIONS = [
  { id: 'globe', label: 'Gateway' },
  { id: 'smartphone', label: 'Mobile / UPI' },
  { id: 'credit-card', label: 'Card' },
  { id: 'landmark', label: 'Banking' },
  { id: 'banknote', label: 'Cash' },
  { id: 'wallet', label: 'Wallet' },
  { id: 'file-text', label: 'Cheque / DD' },
  { id: 'repeat', label: 'EMI' },
  { id: 'plane', label: 'International' },
  { id: 'circle-dot', label: 'Other' },
]

/** Built-in modes — cannot be deleted, only disabled */
export const FINANCE_CRITICAL_PAYMENT_MODE_IDS = ['online_gateway', 'upi', 'card', 'net_banking']

export const FINANCE_STANDARD_PAYMENT_MODES = [
  { id: 'online_gateway', label: 'Online Gateway', category: 'online', icon: 'globe', description: 'Razorpay / Cashfree checkout' },
  { id: 'upi', label: 'UPI', category: 'online', icon: 'smartphone', description: 'UPI apps and collect requests' },
  { id: 'card', label: 'Card', category: 'online', icon: 'credit-card', description: 'Debit and credit cards' },
  { id: 'net_banking', label: 'Net Banking', category: 'banking', icon: 'landmark', description: 'NEFT / RTGS / IMPS transfers' },
  { id: 'emi', label: 'EMI', category: 'online', icon: 'repeat', description: 'Installment payment plans' },
  { id: 'offline_cash', label: 'Offline Cash', category: 'offline', icon: 'banknote', description: 'Counter cash collection' },
  { id: 'cheque', label: 'Cheque', category: 'banking', icon: 'file-text', description: 'Cheque deposits' },
  { id: 'dd', label: 'DD', category: 'banking', icon: 'file-text', description: 'Demand draft payments' },
]

/** Maps legacy/mock payment mode strings to standardized labels */
export const FINANCE_PAYMENT_MODE_LEGACY_MAP = {
  'Bank Transfer': 'Net Banking',
  Cash: 'Offline Cash',
  'UPI Offline': 'UPI',
  'POS Machine': 'Card',
  'Wallet + Card': 'Card',
  Wallet: 'Online Gateway',
  'Online Gateway': 'Online Gateway',
  UPI: 'UPI',
  Card: 'Card',
  'Net Banking': 'Net Banking',
  EMI: 'EMI',
  'Offline Cash': 'Offline Cash',
  Cheque: 'Cheque',
  DD: 'DD',
}

export const FINANCE_REFUND_STATUSES = [
  'Refunded',
  'Partially Refunded',
  'Refund Pending',
  'Not Refunded',
]

export const FINANCE_ACCESS_STATUSES = [
  'Active',
  'Expired',
  'Blocked due to non-payment',
]

export const FINANCE_PAYMENT_GATEWAYS = [
  { value: 'all', label: 'All gateways' },
  { value: 'Razorpay', label: 'Razorpay' },
  { value: 'Cashfree', label: 'Cashfree' },
  { value: 'Offline', label: 'Offline' },
]

export const FINANCE_DEFAULT_PAYMENT_MODE_SETTINGS = FINANCE_STANDARD_PAYMENT_MODES.map((m) => ({
  ...m,
  enabled: ['upi', 'card', 'online_gateway', 'net_banking', 'emi', 'offline_cash'].includes(m.id),
  isCustom: false,
  lastUpdated: new Date().toISOString(),
}))

export const FINANCE_COMMUNICATION_CHANNELS = ['Email', 'WhatsApp', 'SMS']

export const FINANCE_BATCHES = [
  { id: 'batch-morning', name: 'Morning Batch 2026' },
  { id: 'batch-evening', name: 'Evening Batch 2026' },
  { id: 'batch-weekend', name: 'Weekend Batch 2026' },
]

/** Payment Dashboard — course category filter */
export const FINANCE_COURSE_TYPE_OPTIONS = [
  { value: 'all', label: 'All course types' },
  { value: 'Foundation', label: 'Foundation' },
  { value: 'Optional', label: 'Optional' },
  { value: 'Test Series', label: 'Test Series' },
  { value: 'Mentorship', label: 'Mentorship' },
  { value: 'Books', label: 'Books' },
]

export const FINANCE_PAYMENT_TYPE_OPTIONS = [
  { value: 'all', label: 'All payment types' },
  { value: 'Full', label: 'Full' },
  { value: 'EMI', label: 'EMI' },
  { value: 'Scholarship', label: 'Scholarship' },
  { value: 'Offline', label: 'Offline' },
  { value: 'Loan', label: 'Loan' },
]

export const FINANCE_STUDENT_TYPE_OPTIONS = [
  { value: 'all', label: 'All student types' },
  { value: 'Online', label: 'Online' },
  { value: 'Offline', label: 'Offline' },
  { value: 'Hybrid', label: 'Hybrid' },
]

export const FINANCE_MOCK_COUNSELORS = [
  { id: 'c1', name: 'Priya Sharma' },
  { id: 'c2', name: 'Rajesh Kumar' },
  { id: 'c3', name: 'Anita Desai' },
  { id: 'c4', name: 'Vikram Singh' },
]

export const FINANCE_STATES = [
  { code: 'DL', name: 'Delhi' },
  { code: 'MH', name: 'Maharashtra' },
  { code: 'KA', name: 'Karnataka' },
  { code: 'TN', name: 'Tamil Nadu' },
  { code: 'TS', name: 'Telangana' },
]

/** Standard export columns for all finance tables */
export const FINANCE_STANDARD_EXPORT_COLUMNS = [
  { key: 'studentId', label: 'Student ID' },
  { key: 'studentName', label: 'Student Name' },
  { key: 'centerName', label: 'Center' },
  { key: 'branch', label: 'Branch' },
  { key: 'state', label: 'State' },
  { key: 'courseName', label: 'Course' },
  { key: 'batchName', label: 'Batch' },
  { key: 'paymentMode', label: 'Payment Mode' },
  { key: 'paymentGateway', label: 'Payment Gateway' },
  { key: 'refundStatus', label: 'Refund Status' },
  { key: 'accessStatus', label: 'Access Status' },
  { key: 'paymentStatus', label: 'Payment Status' },
  { key: 'verificationStatus', label: 'Verification Status' },
  { key: 'emiStatus', label: 'EMI Status' },
  { key: 'receiptNumber', label: 'Receipt Number' },
  { key: 'invoiceNumber', label: 'Invoice Number' },
  { key: 'gstAmount', label: 'GST Amount' },
  { key: 'totalFees', label: 'Total Fees' },
  { key: 'amountPaid', label: 'Collected Amount' },
  { key: 'pendingAmount', label: 'Pending Amount' },
  { key: 'overdueAmount', label: 'Overdue Amount' },
  { key: 'transactionId', label: 'Transaction ID' },
  { key: 'utrNumber', label: 'UTR Number' },
  { key: 'createdBy', label: 'Created By' },
  { key: 'updatedBy', label: 'Updated By' },
  { key: 'approvedBy', label: 'Approved By' },
  { key: 'paymentDate', label: 'Payment Date & Time' },
]

/** Role mapping for finance ERP (uses existing admin roles) */
export const FINANCE_ROLE_MAP = {
  super_admin: 'Super Admin',
  operation_admin: 'Finance Admin',
  center_admin: 'Center Finance Manager',
  counseling_admin: 'Accountant (View)',
}
