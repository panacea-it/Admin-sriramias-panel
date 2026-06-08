import { cn } from '../../utils/cn'

const STATUS_STYLES = {
  Pending: 'bg-orange-500',
  'In Review': 'bg-amber-500',
  'Draft Saved': 'bg-blue-600',
  Published: 'bg-emerald-600',
  Rechecking: 'bg-red-600',
}

export default function EvaluationStatusBadge({ status }) {
  const label = status || 'Pending'
  return (
    <span
      className={cn(
        'inline-flex min-w-[112px] items-center justify-center rounded-md px-3 py-1.5 text-sm font-semibold text-white',
        STATUS_STYLES[label] || 'bg-slate-500',
      )}
    >
      {label}
    </span>
  )
}

