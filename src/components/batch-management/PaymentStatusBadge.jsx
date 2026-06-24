import { cn } from '../../utils/cn'

const STYLES = {
  Paid: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  Pending: 'bg-amber-50 text-amber-700 ring-amber-200',
  Partial: 'bg-sky-50 text-sky-700 ring-sky-200',
  Overdue: 'bg-rose-50 text-rose-700 ring-rose-200',
}

export default function PaymentStatusBadge({ status }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md px-2.5 py-1 text-xs font-semibold ring-1 ring-inset',
        STYLES[status] ?? 'bg-slate-50 text-slate-600 ring-slate-200',
      )}
    >
      {status}
    </span>
  )
}
