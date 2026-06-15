import { cn } from '../../../utils/cn'

const STATUS_STYLES = {
  Evaluated: 'bg-emerald-500/15 text-emerald-800 ring-emerald-500/25',
  Pending: 'bg-amber-500/15 text-amber-900 ring-amber-500/25',
  'In Progress': 'bg-sky-500/15 text-sky-800 ring-sky-500/25',
  'Not Started': 'bg-slate-500/15 text-slate-600 ring-slate-400/25',
  Overdue: 'bg-red-500/15 text-red-800 ring-red-500/25',
}

export default function PaperEvaluationStatusBadge({ status }) {
  const label = status || 'Not Started'

  return (
    <span
      className={cn(
        'inline-flex min-w-[92px] items-center justify-center rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wide ring-1 ring-inset',
        STATUS_STYLES[label] ?? STATUS_STYLES['Not Started'],
      )}
    >
      {label}
    </span>
  )
}
