import { cn } from '../../utils/cn'

const STATUS_STYLES = {
  Published: 'bg-emerald-500/15 text-emerald-800 ring-emerald-500/25',
  Live: 'bg-orange-500/15 text-orange-900 ring-orange-500/25',
  Pending: 'bg-amber-500/15 text-amber-900 ring-amber-500/25',
  Scheduled: 'bg-sky-500/15 text-sky-900 ring-sky-500/25',
  Draft: 'bg-slate-500/15 text-slate-700 ring-slate-500/25',
}

export default function TestActivityStatusBadge({ status, className }) {
  const label = status || '—'

  return (
    <span
      className={cn(
        'inline-flex min-w-[92px] items-center justify-center rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wide ring-1 ring-inset',
        STATUS_STYLES[status] ?? 'bg-slate-500/15 text-slate-700 ring-slate-500/25',
        className,
      )}
    >
      {label}
    </span>
  )
}
