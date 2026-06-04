import { cn } from '../../utils/cn'

const STATUS_STYLES = {
  active: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  inactive: 'bg-slate-100 text-slate-600 ring-slate-200',
  disabled: 'bg-slate-100 text-slate-500 ring-slate-200',
  draft: 'bg-amber-50 text-amber-800 ring-amber-200',
  Pending: 'bg-amber-50 text-amber-800 ring-amber-200',
  Confirmed: 'bg-blue-50 text-blue-700 ring-blue-200',
  Packed: 'bg-indigo-50 text-indigo-700 ring-indigo-200',
  Shipped: 'bg-violet-50 text-violet-700 ring-violet-200',
  Delivered: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  Cancelled: 'bg-red-50 text-red-700 ring-red-200',
  Paid: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  Success: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  Failed: 'bg-red-50 text-red-700 ring-red-200',
  Generated: 'bg-blue-50 text-blue-700 ring-blue-200',
  'Low stock': 'bg-amber-50 text-amber-800 ring-amber-200',
  'Out of stock': 'bg-red-50 text-red-700 ring-red-200',
}

export default function BookstoreStatusBadge({ status }) {
  const key = status || 'inactive'
  return (
    <span
      className={cn(
        'inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset',
        STATUS_STYLES[key] || 'bg-slate-100 text-slate-600 ring-slate-200',
      )}
    >
      {status}
    </span>
  )
}
