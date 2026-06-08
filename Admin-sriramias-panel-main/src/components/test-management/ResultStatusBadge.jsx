import { cn } from '../../utils/cn'

const STATUS_STYLES = {
  Processing: 'bg-orange-50 text-orange-700 ring-orange-200',
  Evaluated: 'bg-blue-50 text-blue-700 ring-blue-200',
  Published: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
}

export default function ResultStatusBadge({ status }) {
  const s = status || 'Processing'
  return (
    <span
      className={cn(
        'inline-flex items-center justify-center rounded-md px-3 py-1.5 text-sm font-bold ring-1',
        STATUS_STYLES[s] || 'bg-slate-50 text-slate-700 ring-slate-200',
      )}
    >
      {s}
    </span>
  )
}

