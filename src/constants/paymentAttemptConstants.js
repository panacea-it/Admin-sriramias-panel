/** Payment Attempt Logs — failure categories, fraud, counselor & recovery statuses */

export const PAYMENT_FAILURE_CATEGORIES = [
  'Insufficient Balance',
  'OTP Failure',
  'Gateway Timeout',
  'Bank Declined',
  'Session Expired',
  'Unknown Error',
  'Network Failure',
  'User Cancelled',
  'Duplicate Attempt',
  'Fraud Suspected',
]

export const PAYMENT_FAILURE_CATEGORY_STYLES = {
  'Insufficient Balance': 'bg-amber-100 text-amber-900 ring-amber-200',
  'OTP Failure': 'bg-orange-100 text-orange-900 ring-orange-200',
  'Gateway Timeout': 'bg-slate-100 text-slate-700 ring-slate-200',
  'Bank Declined': 'bg-red-100 text-red-900 ring-red-200',
  'Session Expired': 'bg-violet-100 text-violet-900 ring-violet-200',
  'Unknown Error': 'bg-slate-100 text-slate-600 ring-slate-200',
  'Network Failure': 'bg-sky-100 text-sky-900 ring-sky-200',
  'User Cancelled': 'bg-slate-100 text-slate-600 ring-slate-200',
  'Duplicate Attempt': 'bg-amber-100 text-amber-800 ring-amber-200',
  'Fraud Suspected': 'bg-red-100 text-red-900 ring-red-300',
}

export const FRAUD_RISK_STATUSES = ['Safe', 'Suspicious', 'Blocked', 'Under Review']

export const FRAUD_RISK_STYLES = {
  Safe: 'bg-[#69df66]/15 text-[#1a5c2e] ring-[#69df66]/30',
  Suspicious: 'bg-amber-100 text-amber-900 ring-amber-200',
  Blocked: 'bg-red-100 text-red-900 ring-red-200',
  'Under Review': 'bg-[#55ace7]/15 text-[#246392] ring-[#55ace7]/30',
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

export const ABANDONED_CHECKOUT_STAGES = [
  'Payment Initiated',
  'OTP Pending',
  'Gateway Redirect',
  'Confirmation Page',
  'Session Timeout',
]

export const RECOVERY_STATUSES = ['Not Recovered', 'Recovered', 'In Progress', 'Abandoned']

export const RECOVERY_STATUS_STYLES = {
  'Not Recovered': 'bg-slate-100 text-slate-600 ring-slate-200',
  Recovered: 'bg-[#69df66]/15 text-[#1a5c2e] ring-[#69df66]/30',
  'In Progress': 'bg-[#55ace7]/15 text-[#246392] ring-[#55ace7]/30',
  Abandoned: 'bg-amber-100 text-amber-900 ring-amber-200',
}

export const RETRY_SOURCES = ['Auto Retry', 'Manual Retry', 'Counselor Link', 'Reminder Link', 'Student Self']

export const RECOVERY_CHANNELS = ['WhatsApp', 'SMS', 'Email', 'In-app', 'Counselor Call']

export const PAYMENT_ATTEMPT_TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'attempts', label: 'Attempt Logs' },
  { id: 'retry', label: 'Retry Analytics' },
  { id: 'abandoned', label: 'Abandoned' },
  { id: 'recovery', label: 'Recovery' },
  { id: 'alerts', label: 'Alerts' },
]

export const PAYMENT_ATTEMPT_EXPORT_COLUMNS = [
  { key: 'id', label: 'Attempt ID' },
  { key: 'student', label: 'Student Name' },
  { key: 'mobile', label: 'Phone' },
  { key: 'email', label: 'Email' },
  { key: 'course', label: 'Course' },
  { key: 'amount', label: 'Amount' },
  { key: 'failureCategory', label: 'Failure Reason' },
  { key: 'retryCount', label: 'Retry Count' },
  { key: 'recoveryStatus', label: 'Recovery Status' },
  { key: 'counselorName', label: 'Counselor' },
  { key: 'fraudStatus', label: 'Device/IP Status' },
  { key: 'dateTime', label: 'Last Attempt' },
]

export const RECOVERY_MESSAGE_TEMPLATES = [
  { id: 'failed_payment', label: 'Failed payment notice' },
  { id: 'abandoned_checkout', label: 'Abandoned checkout reminder' },
  { id: 'retry_reminder', label: 'Retry payment reminder' },
  { id: 'recovery_success', label: 'Payment recovery success' },
]
