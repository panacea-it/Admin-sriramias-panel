/** Offline payment + EMI workflow constants */

export const OFFLINE_PAYMENT_MODES = [
  'Cash',
  'UPI',
  'Bank Transfer',
  'Cheque',
  'DD',
  'POS Machine',
  'Card',
]

export const EMI_FREQUENCIES = [
  { id: 'monthly', label: 'Monthly', monthsStep: 1 },
  { id: 'quarterly', label: 'Quarterly', monthsStep: 3 },
  { id: 'custom', label: 'Custom', monthsStep: 1 },
]

export const EMI_INSTALLMENT_STATUSES = [
  'Pending',
  'Scheduled',
  'Paid',
  'Overdue',
  'Partial',
  'Cancelled',
]

/** Preset counseling durations shown as selectable cards */
export const EMI_DURATION_PRESETS = [
  { id: '3', months: 3, label: '3 Months' },
  { id: '6', months: 6, label: '6 Months' },
  { id: '9', months: 9, label: '9 Months' },
  { id: '12', months: 12, label: '12 Months' },
  { id: '18', months: 18, label: '18 Months' },
  { id: '24', months: 24, label: '24 Months' },
  { id: 'custom', months: null, label: 'Custom' },
]

export const OFFLINE_SUBMIT_ACTIONS = {
  APPROVE: 'approve',
  DRAFT: 'draft',
  EMI_PLAN: 'emi_plan',
  RECEIPT: 'receipt',
}
