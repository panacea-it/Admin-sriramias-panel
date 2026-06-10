/** EMI Management module — loan providers, reminders, suspension, workflows */

export const EMI_LOAN_PROVIDERS = [
  'Bajaj',
  'Liquiloans',
  'Propelld',
  'Eduvanz',
  'Institute EMI',
  'Other',
]

export const EMI_LOAN_PROVIDER_STATUSES = [
  'Applied',
  'Under Review',
  'Approved',
  'Rejected',
  'Disbursed',
  'EMI Active',
  'Closed',
]

export const EMI_OVERDUE_SEVERITY = {
  mild: { id: 'mild', label: 'Mild', minDays: 1, maxDays: 7, className: 'bg-amber-100 text-amber-800 ring-amber-200' },
  moderate: { id: 'moderate', label: 'Moderate', minDays: 8, maxDays: 21, className: 'bg-orange-100 text-orange-800 ring-orange-200' },
  critical: { id: 'critical', label: 'Critical', minDays: 22, maxDays: 9999, className: 'bg-red-100 text-red-800 ring-red-200' },
}

export const EMI_SUSPENSION_STATUSES = ['Active', 'Warning Issued', 'Suspended', 'Reactivated']

export const EMI_FOLLOW_UP_STATUSES = [
  'Contacted',
  'Payment Promised',
  'Escalated',
  'No Response',
  'Settled',
]

export const EMI_CALL_STATUSES = ['Pending', 'Completed', 'No response', 'Callback requested']

export const EMI_REMINDER_CHANNELS = ['WhatsApp', 'SMS', 'Email']

export const EMI_REMINDER_TRIGGERS = [
  { id: 'before_due', label: 'Before due date' },
  { id: 'on_due', label: 'On due date' },
  { id: 'after_overdue', label: 'After overdue' },
  { id: 'final_warning', label: 'Final warning' },
]

export const EMI_REMINDER_DELIVERY_STATUSES = ['Sent', 'Failed', 'Retry', 'Queued']

export const EMI_SETTLEMENT_STATUSES = [
  'Settlement Requested',
  'Settlement Approved',
  'Foreclosed',
  'Closed',
]

export const EMI_AGREEMENT_DOC_TYPES = [
  { id: 'loan_agreement', label: 'Loan Agreement' },
  { id: 'sanction_letter', label: 'EMI Sanction Letter' },
  { id: 'kyc', label: 'KYC Documents' },
  { id: 'signed_agreement', label: 'Signed Agreement' },
]

export const EMI_SCHEDULE_FREQUENCIES = [
  { id: 'monthly', label: 'Monthly EMI', monthsStep: 1 },
  { id: 'quarterly', label: 'Quarterly EMI', monthsStep: 3 },
  { id: 'custom', label: 'Custom interval', monthsStep: 1 },
]

export const DEFAULT_EMI_AUTOMATION_SETTINGS = {
  suspensionDays: 15,
  gracePeriodDays: 3,
  warningDaysBeforeSuspend: 5,
  reminderDaysBeforeDue: 3,
  reminderFrequencyDays: 2,
  autoReactivateOnPayment: true,
  channels: { whatsapp: true, sms: true, email: true },
  templates: {
    before_due: 'Dear {studentName}, your EMI of {amount} is due on {dueDate}. Please pay on time.',
    on_due: 'Reminder: EMI of {amount} is due today for {courseName}.',
    after_overdue: 'Your EMI is overdue by {overdueDays} days. Pending: {pendingAmount}.',
    final_warning: 'Final notice: Course access may be suspended if payment is not received.',
  },
}

export const EMI_ACTIVITY_TYPES = [
  'EMI Created',
  'Reminder Sent',
  'Payment Received',
  'Overdue Triggered',
  'Counselor Assigned',
  'Suspension Applied',
  'Settlement Completed',
  'Call Scheduled',
  'Bounce Recorded',
  'Document Uploaded',
]
