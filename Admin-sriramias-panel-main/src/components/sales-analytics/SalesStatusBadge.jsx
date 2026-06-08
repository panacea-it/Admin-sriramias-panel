import { cn } from '../../utils/cn'

const STATUS_STYLES = {
  'New Lead': 'bg-[#e0f2fe] text-[#0369a1]',
  Assigned: 'bg-[#fef3c7] text-[#b45309]',
  Contacted: 'bg-[#dbeafe] text-[#1d4ed8]',
  'Follow-up': 'bg-[#ede9fe] text-[#6d28d9]',
  'Payment Page': 'bg-[#ffedd5] text-[#c2410c]',
  'Payment Success': 'bg-[#dcfce7] text-[#15803d]',
  'Payment Failed': 'bg-[#fee2e2] text-[#b91c1c]',
  Converted: 'bg-[#69df66] text-white',
  'Not Interested': 'bg-[#f3f4f6] text-[#6b7280]',
  Paid: 'bg-[#69df66] text-white',
  Failed: 'bg-[#fee2e2] text-[#b91c1c]',
  Pending: 'bg-[#fef3c7] text-[#b45309]',
  High: 'bg-[#fee2e2] text-[#b91c1c]',
  Normal: 'bg-[#f3f4f6] text-[#374151]',
  Overdue: 'bg-[#fee2e2] text-[#b91c1c]',
  Today: 'bg-[#dbeafe] text-[#1d4ed8]',
  Upcoming: 'bg-[#dcfce7] text-[#15803d]',
}

export default function SalesStatusBadge({ status, className }) {
  return (
    <span
      className={cn(
        'inline-flex min-w-[72px] items-center justify-center rounded-full px-3 py-1 text-xs font-semibold sm:text-sm',
        STATUS_STYLES[status] || 'bg-[#f3f4f6] text-[#374151]',
        className,
      )}
    >
      {status}
    </span>
  )
}
