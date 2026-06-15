import { cn } from '../../utils/cn'

const REFUND_SOFT_STYLES = {
  'Not Refunded': 'bg-slate-100 text-slate-600 border border-slate-200/80',
  'Partially Refunded': 'bg-orange-50 text-orange-800 border border-orange-200/70',
  'Refund Pending': 'bg-blue-50 text-[#246392] border border-blue-200/70',
  Refunded: 'bg-slate-200/80 text-slate-700 border border-slate-300/60',
}

export default function FinanceRefundBadge({ status, className, truncate = true }) {
  const label = status || '—'

  return (
    <span
      title={label}
      className={cn(
        'inline-flex items-center justify-center whitespace-nowrap',
        'rounded-full px-3 py-1.5 text-xs font-medium leading-snug min-h-[28px] sm:text-sm',
        truncate ? 'max-w-full min-w-0 overflow-hidden' : 'w-fit min-w-fit shrink-0',
        REFUND_SOFT_STYLES[label] || 'bg-slate-100 text-slate-600 border border-slate-200/80',
        className,
      )}
    >
      <span className={cn(truncate && 'truncate')}>{label}</span>
    </span>
  )
}
