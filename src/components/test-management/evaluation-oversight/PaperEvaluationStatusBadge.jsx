import { cn } from '../../../utils/cn'

const STYLES = {
  Evaluated: { wrap: 'bg-emerald-50 text-emerald-800', dot: 'bg-emerald-500' },
  'In Progress': { wrap: 'bg-blue-50 text-blue-800', dot: 'bg-blue-500' },
  'Not Started': { wrap: 'bg-slate-100 text-slate-600', dot: 'bg-slate-400' },
  Overdue: { wrap: 'bg-red-50 text-red-700', dot: 'bg-red-500' },
}

export default function PaperEvaluationStatusBadge({ status }) {
  const label = status || 'Not Started'
  const style = STYLES[label] || STYLES['Not Started']
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold',
        style.wrap,
      )}
    >
      <span className={cn('h-1.5 w-1.5 shrink-0 rounded-full', style.dot)} aria-hidden />
      {label}
    </span>
  )
}
