import { cn } from '../../utils/cn'

const STYLES = {
  Paid: 'bg-[#69df66] text-white',
  Success: 'bg-[#69df66] text-white',
  Active: 'bg-[#69df66] text-white',
  Approved: 'bg-[#69df66] text-white',
  Verified: 'bg-[#69df66] text-white',
  Delivered: 'bg-[#69df66] text-white',
  'Partially Paid': 'bg-[#efb36d] text-[#111]',
  Partial: 'bg-[#efb36d] text-[#111]',
  Due: 'bg-[#efb36d] text-[#111]',
  Pending: 'bg-[#55ace7] text-white',
  'Pending Verification': 'bg-[#55ace7] text-white',
  'Verification Pending': 'bg-[#55ace7] text-white',
  'Auto Verified': 'bg-[#69df66] text-white',
  Verified: 'bg-[#69df66] text-white',
  'Sent to Finance Head': 'bg-[#246392] text-white',
  'Under Review': 'bg-[#8b98bb] text-white',
  'Pending Approval': 'bg-[#55ace7] text-white',
  Uploaded: 'bg-[#55ace7] text-white',
  Failed: 'bg-[#df8284] text-white',
  Rejected: 'bg-[#df8284] text-white',
  Overdue: 'bg-[#dc2626] text-white',
  Escalated: 'bg-[#dc2626] text-white',
  Cancelled: 'bg-slate-400 text-white',
  Refunded: 'bg-slate-500 text-white',
  'Partially Refunded': 'bg-[#efb36d] text-[#111]',
  'Refund Pending': 'bg-[#55ace7] text-white',
  'Not Refunded': 'bg-slate-200 text-slate-700',
  'Blocked due to non-payment': 'bg-[#dc2626] text-white',
  'EMI Running': 'bg-[#246392] text-white',
  'EMI Completed': 'bg-[#1a4d73] text-white',
  'Pending Payment': 'bg-[#55ace7] text-white',
  Completed: 'bg-[#246392] text-white',
  Scheduled: 'bg-[#8b98bb] text-white',
  Closed: 'bg-slate-500 text-white',
  'Closed Early': 'bg-[#1a4d73] text-white',
  Queued: 'bg-[#efb36d] text-[#111]',
  Credit: 'bg-emerald-500 text-white',
  Debit: 'bg-rose-500 text-white',
  Expired: 'bg-slate-400 text-white',
  'Access Extended': 'bg-[#8b98bb] text-white',
}

export default function FinanceStatusBadge({ status, className, title }) {
  const label = status || '—'
  return (
    <span
      title={title}
      className={cn(
        'inline-flex w-fit min-w-fit shrink-0 items-center justify-center whitespace-nowrap rounded-md px-2.5 py-1 text-xs font-semibold leading-none sm:text-sm',
        STYLES[label] || 'bg-slate-200 text-slate-700',
        className,
      )}
    >
      {label}
    </span>
  )
}
