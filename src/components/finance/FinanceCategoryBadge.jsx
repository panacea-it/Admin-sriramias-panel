import { cn } from '../../utils/cn'
import { getCategoryLabel } from '../../utils/finance/paymentModeUtils'

const STYLES = {
  online: 'bg-[#eef6fc] text-[#246392] ring-[#55ace7]/30',
  offline: 'bg-slate-100 text-slate-700 ring-slate-200',
  banking: 'bg-[#eef6fc] text-[#1a3a5c] ring-[#246392]/20',
  wallet: 'bg-[#eef6fc] text-[#246392] ring-[#55ace7]/25',
  international: 'bg-[#eef6fc] text-[#1a3a5c] ring-[#246392]/20',
  other: 'bg-slate-100 text-slate-600 ring-slate-200',
}

export default function FinanceCategoryBadge({ category, className }) {
  const label = getCategoryLabel(category)
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ring-1 ring-inset',
        STYLES[category] || STYLES.other,
        className,
      )}
    >
      {label}
    </span>
  )
}
