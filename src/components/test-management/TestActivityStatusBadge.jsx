import { cn } from '../../utils/cn'
import { normalizeActivityStatus } from '../../utils/testManagementDashboardHelpers'

const STATUS_STYLES = {
  published: 'bg-emerald-500/15 text-emerald-800 ring-emerald-500/25',
  live: 'bg-orange-500/15 text-orange-900 ring-orange-500/25',
  pending: 'bg-amber-500/15 text-amber-900 ring-amber-500/25',
  scheduled: 'bg-sky-500/15 text-sky-900 ring-sky-500/25',
  draft: 'bg-slate-500/15 text-slate-700 ring-slate-500/25',
}

export default function TestActivityStatusBadge({ status, className }) {
  const label = status || '—'
  const normalizedStatus = normalizeActivityStatus(status)

  return (
    <span
      className={cn(
        'inline-flex min-w-[92px] items-center justify-center rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wide ring-1 ring-inset',
        STATUS_STYLES[normalizedStatus] ?? 'bg-slate-500/15 text-slate-700 ring-slate-500/25',
        className,
      )}
    >
      {label}
    </span>
  )
}
