import { ChevronDown, ChevronUp } from 'lucide-react'
import { cn } from '../../../utils/cn'

export default function OmrSortableHeader({ label, sortKey, activeKey, direction, onSort }) {
  const active = activeKey === sortKey
  return (
    <button
      type="button"
      onClick={() => onSort(sortKey)}
      className="inline-flex items-center gap-1 font-semibold text-inherit transition hover:text-[#246392]"
    >
      {label}
      {active ? (
        direction === 'asc' ? (
          <ChevronUp className="h-4 w-4 shrink-0" />
        ) : (
          <ChevronDown className="h-4 w-4 shrink-0" />
        )
      ) : (
        <ChevronDown className="h-4 w-4 shrink-0 opacity-30" />
      )}
    </button>
  )
}

export function OmrYesNoBadge({ value }) {
  return (
    <span
      className={cn(
        'inline-flex min-w-[44px] items-center justify-center rounded-full px-2.5 py-0.5 text-xs font-bold uppercase',
        value ? 'bg-emerald-500/15 text-emerald-800' : 'bg-slate-100 text-slate-600',
      )}
    >
      {value ? 'Yes' : 'No'}
    </span>
  )
}
