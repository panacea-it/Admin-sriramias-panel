import { cn } from '../../utils/cn'

const STATUS_STYLES = {
  active: 'bg-emerald-500/15 text-emerald-800 ring-emerald-500/25',
  inactive: 'bg-slate-500/10 text-slate-700 ring-slate-500/20',
  disabled: 'bg-slate-500/10 text-slate-600 ring-slate-500/20',
  draft: 'bg-amber-500/15 text-amber-900 ring-amber-500/25',
  Pending: 'bg-amber-500/15 text-amber-900 ring-amber-500/25',
  Confirmed: 'bg-blue-500/15 text-blue-800 ring-blue-500/25',
  Packed: 'bg-indigo-500/15 text-indigo-800 ring-indigo-500/25',
  Shipped: 'bg-violet-500/15 text-violet-800 ring-violet-500/25',
  Delivered: 'bg-emerald-500/15 text-emerald-800 ring-emerald-500/25',
  Cancelled: 'bg-red-500/15 text-red-800 ring-red-500/25',
  Paid: 'bg-emerald-500/15 text-emerald-800 ring-emerald-500/25',
  Success: 'bg-emerald-500/15 text-emerald-800 ring-emerald-500/25',
  Failed: 'bg-red-500/15 text-red-800 ring-red-500/25',
  REFUND_INITIATED: 'bg-amber-500/15 text-amber-900 ring-amber-500/25',
  REFUNDED: 'bg-slate-500/15 text-slate-700 ring-slate-500/25',
  Generated: 'bg-blue-500/15 text-blue-800 ring-blue-500/25',
  'Low stock': 'bg-amber-500/15 text-amber-900 ring-amber-500/25',
  'Out of stock': 'bg-red-500/15 text-red-800 ring-red-500/25',
  OK: 'bg-emerald-500/15 text-emerald-800 ring-emerald-500/25',
}

export default function BookstoreStatusBadge({ status }) {
  const key = status || 'inactive'
  return (
    <span
      className={cn(
        'inline-flex min-w-[92px] items-center justify-center rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wide ring-1 ring-inset',
        STATUS_STYLES[key] || 'bg-slate-500/10 text-slate-700 ring-slate-500/20',
      )}
    >
      {status}
    </span>
  )
}
