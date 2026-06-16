/** Payment Attempt Logs — failure categories */

/**
 * TEMPORARY dummy counselors for Assign Counselor.
 * Replace `getPaymentAttemptCounselorOptions()` with Counselor Management API.
 */
export const DUMMY_PAYMENT_ATTEMPT_COUNSELORS = [
  'Anita Desai',
  'Vikram Singh',
  'Priya Sharma',
  'Rahul Gupta',
  'Sneha Reddy',
  'Kiran Kumar',
  'Pooja Verma',
  'Amit Joshi',
]

export function getPaymentAttemptCounselorOptions() {
  return DUMMY_PAYMENT_ATTEMPT_COUNSELORS.map((name, index) => ({
    value: `dummy-counselor-${index + 1}`,
    label: name,
  }))
}

export const PAYMENT_FAILURE_CATEGORIES = [
  'Insufficient Balance',
  'OTP Failure',
  'Gateway Timeout',
  'Bank Declined',
  'Payment Declined',
  'Bank Server Error',
  'Session Expired',
  'Unknown Error',
  'Network Failure',
  'User Cancelled',
  'Duplicate Attempt',
]

export const PAYMENT_FAILURE_CATEGORY_STYLES = {
  'Insufficient Balance': 'bg-amber-100 text-amber-900 ring-amber-200',
  'OTP Failure': 'bg-orange-100 text-orange-900 ring-orange-200',
  'Gateway Timeout': 'bg-slate-100 text-slate-700 ring-slate-200',
  'Bank Declined': 'bg-red-100 text-red-900 ring-red-200',
  'Payment Declined': 'bg-red-100 text-red-900 ring-red-200',
  'Bank Server Error': 'bg-red-100 text-red-800 ring-red-200',
  'Session Expired': 'bg-violet-100 text-violet-900 ring-violet-200',
  'Unknown Error': 'bg-slate-100 text-slate-600 ring-slate-200',
  'Network Failure': 'bg-sky-100 text-sky-900 ring-sky-200',
  'User Cancelled': 'bg-slate-100 text-slate-600 ring-slate-200',
  'Duplicate Attempt': 'bg-amber-100 text-amber-800 ring-amber-200',
}

export const COUNSELOR_LEAD_STATUSES = [
  'Assigned',
  'Contacted',
  'Payment Promised',
  'Follow-up Pending',
  'Recovered',
  'Lost',
]

export const COUNSELOR_LEAD_STYLES = {
  Assigned: 'bg-[#55ace7]/15 text-[#246392] ring-[#55ace7]/30',
  Contacted: 'bg-violet-100 text-violet-900 ring-violet-200',
  'Payment Promised': 'bg-[#efb36d]/20 text-[#8a5a20] ring-[#efb36d]/40',
  'Follow-up Pending': 'bg-amber-100 text-amber-900 ring-amber-200',
  Recovered: 'bg-[#69df66]/15 text-[#1a5c2e] ring-[#69df66]/30',
  Lost: 'bg-slate-100 text-slate-600 ring-slate-200',
}

export const PAYMENT_ATTEMPT_EXPORT_COLUMNS = [
  { key: 'attemptId', label: 'Attempt ID' },
  { key: 'student', label: 'Student Name' },
  { key: 'mobile', label: 'Phone' },
  { key: 'email', label: 'Email' },
  { key: 'course', label: 'Course' },
  { key: 'amount', label: 'Amount' },
  { key: 'failureCategory', label: 'Failure Reason' },
  { key: 'retryCount', label: 'Retry Count' },
  { key: 'lastAttemptDate', label: 'Last Attempt' },
]
