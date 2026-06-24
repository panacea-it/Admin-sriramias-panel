import { cn } from '../../../utils/cn'

const STATUS_STYLES = {
  DRAFT: 'bg-slate-500/15 text-slate-800 ring-slate-500/25',
  PUBLISHED: 'bg-emerald-500/15 text-emerald-800 ring-emerald-500/25',
  UNPUBLISHED: 'bg-amber-500/15 text-amber-900 ring-amber-500/25',
}

export default function CbtTestStatusBadge({ status }) {
  const key = String(status || 'DRAFT').toUpperCase()
  const label = key.charAt(0) + key.slice(1).toLowerCase()

  return (
    <span
      className={cn(
        'inline-flex min-w-[92px] items-center justify-center rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wide ring-1 ring-inset',
        STATUS_STYLES[key] || STATUS_STYLES.DRAFT,
      )}
    >
      {label}
    </span>
  )
}
