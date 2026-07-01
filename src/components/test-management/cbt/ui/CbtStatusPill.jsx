import { cn } from '../../../../utils/cn'

const EVALUATION_STATUS_STYLES = {
  Completed: 'bg-emerald-500/15 text-emerald-800 ring-emerald-500/25',
  Evaluated: 'bg-emerald-500/15 text-emerald-800 ring-emerald-500/25',
  Published: 'bg-emerald-500/15 text-emerald-800 ring-emerald-500/25',
  'In Progress': 'bg-[#efb36d] text-white shadow-sm',
  Unpublished: 'bg-amber-500/15 text-amber-900 ring-amber-500/25',
  'Under Review': 'bg-amber-500/15 text-amber-900 ring-amber-500/25',
  'Not Started': 'bg-slate-500/15 text-slate-600 ring-slate-400/25',
  Overdue: 'bg-red-500/15 text-red-800 ring-red-500/25',
}

const SCORE_TIER_STYLES = {
  high: 'bg-emerald-500/15 text-emerald-800 ring-emerald-500/25',
  mid: 'bg-sky-500/15 text-sky-800 ring-sky-500/25',
  low: 'bg-amber-500/15 text-amber-900 ring-amber-500/25',
}

export function CbtEvaluationStatusPill({ status, className }) {
  const label = status || 'Not Started'
  const isInProgress = label === 'In Progress'

  return (
    <span
      className={cn(
        'inline-flex min-w-[108px] items-center justify-center whitespace-nowrap rounded-full px-3.5 py-1.5 text-xs font-semibold',
        isInProgress && 'font-medium normal-case tracking-normal',
        EVALUATION_STATUS_STYLES[label] ?? EVALUATION_STATUS_STYLES['Not Started'],
        !isInProgress && 'text-[11px] font-bold uppercase tracking-wide ring-1 ring-inset',
        className,
      )}
    >
      {label}
    </span>
  )
}

export function CbtScorePill({ pct, className }) {
  const value = Number(pct) || 0
  const tier = value >= 70 ? 'high' : value >= 50 ? 'mid' : 'low'

  return (
    <span
      className={cn(
        'inline-flex min-w-[72px] items-center justify-center rounded-full px-3 py-1 text-[11px] font-bold tabular-nums ring-1 ring-inset',
        SCORE_TIER_STYLES[tier],
        className,
      )}
    >
      {value}%
    </span>
  )
}
