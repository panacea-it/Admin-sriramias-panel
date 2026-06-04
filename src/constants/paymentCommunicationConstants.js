/** Payment Communication Logs — types, channels, statuses, tabs & export */

export const COMMUNICATION_TYPES = [
  'Due Reminder',
  'Payment Success',
  'Failed Payment',
  'Refund Update',
  'EMI Reminder',
  'Escalation Notice',
  'Manual Follow-up',
  'Payment Receipt',
  'Payment Recovery',
]

export const COMMUNICATION_CHANNELS = [
  'Email',
  'SMS',
  'WhatsApp',
  'Push Notification',
  'In-App Notification',
]

export const COMMUNICATION_STATUSES = ['Sent', 'Pending', 'Failed', 'Delivered', 'Read', 'Opened', 'Queued']

export const COMMUNICATION_STATUS_STYLES = {
  Sent: 'bg-[#55ace7]/15 text-[#246392] ring-[#55ace7]/30',
  Pending: 'bg-amber-100 text-amber-900 ring-amber-200',
  Failed: 'bg-red-100 text-red-900 ring-red-200',
  Delivered: 'bg-[#69df66]/15 text-[#1a5c2e] ring-[#69df66]/30',
  Read: 'bg-violet-100 text-violet-900 ring-violet-200',
  Opened: 'bg-sky-100 text-sky-900 ring-sky-200',
  Queued: 'bg-slate-100 text-slate-600 ring-slate-200',
}

export const FOLLOW_UP_PRIORITIES = ['High', 'Medium', 'Low']

export const FOLLOW_UP_PRIORITY_STYLES = {
  High: 'bg-red-100 text-red-900 ring-red-200',
  Medium: 'bg-amber-100 text-amber-900 ring-amber-200',
  Low: 'bg-slate-100 text-slate-600 ring-slate-200',
}

export const AUTOMATION_TRIGGER_EVENTS = [
  'EMI reminder before due date',
  'Pending fee escalation',
  'Failed payment retry reminder',
  'Refund status updates',
  'Payment success acknowledgment',
]

export const AUTOMATION_TRIGGER_TIMINGS = [
  '7 days before due date',
  '3 days before due date',
  'On due date',
  '1 day after failure',
  'Weekly until payment complete',
]

export const TEMPLATE_DYNAMIC_VARIABLES = [
  '{{student_name}}',
  '{{amount_due}}',
  '{{due_date}}',
  '{{payment_link}}',
  '{{transaction_id}}',
  '{{refund_amount}}',
  '{{emi_due_date}}',
]

export const PAYMENT_COMMUNICATION_TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'activity', label: 'Activity Logs' },
  { id: 'templates', label: 'Templates' },
  { id: 'automation', label: 'Automation Rules' },
  { id: 'alerts', label: 'Alerts' },
]

export const COMMUNICATION_EXPORT_COLUMNS = [
  { key: 'id', label: 'Communication ID' },
  { key: 'studentName', label: 'Student Name' },
  { key: 'studentId', label: 'Student ID' },
  { key: 'paymentReference', label: 'Payment Reference' },
  { key: 'type', label: 'Communication Type' },
  { key: 'channel', label: 'Channel' },
  { key: 'status', label: 'Status' },
  { key: 'sentBy', label: 'Sent By' },
  { key: 'timestamp', label: 'Sent Date & Time' },
  { key: 'deliveryStatus', label: 'Delivery Status' },
  { key: 'openStatus', label: 'Open Status' },
  { key: 'readStatus', label: 'Read Status' },
  { key: 'followUpTag', label: 'Follow-up Tag' },
  { key: 'counselorName', label: 'Counselor' },
]

export const VERIFICATION_CENTER_SECTIONS = [
  { id: 'verification', label: 'Verification Queue', path: 'verification' },
  { id: 'communication', label: 'Communication Logs', path: 'communication' },
]
