import { cn } from '../../../utils/cn'

const STATUS_STYLES = {
  Generated: 'bg-slate-100 text-[#444] ring-slate-200',
  Sent: 'bg-[#eef6fc] text-[#246392] ring-[#55ace7]/30',
  Downloaded: 'bg-[#eef2fc] text-[#1a4d73] ring-[#246392]/30',
  Failed: 'bg-[#fdf0f0] text-[#c0392b] ring-[#df8284]/40',
  Cancelled: 'bg-slate-100 text-[#888] ring-slate-200 line-through',
  Paid: 'bg-[#eef6fc] text-[#246392] ring-[#55ace7]/30',
  'EMI Completed': 'bg-[#eef2fc] text-[#1a4d73] ring-[#246392]/30',
}

export default function ReceiptStatusBadge({ status, className }) {
  const label = status || 'Generated'
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ring-1',
        STATUS_STYLES[label] || STATUS_STYLES.Generated,
        className,
      )}
    >
      {label}
    </span>
  )
}
