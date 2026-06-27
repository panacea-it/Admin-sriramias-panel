import { cn } from '../../utils/cn'

export default function ProductStatusPill({ status }) {
  const label = status || '—'
  const active = String(status || '').toUpperCase() === 'ACTIVE'

  return (
    <span
      className={cn(
        'inline-flex min-w-[92px] items-center justify-center rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wide ring-1 ring-inset',
        active
          ? 'bg-emerald-500/15 text-emerald-800 ring-emerald-500/25'
          : 'bg-amber-500/15 text-amber-900 ring-amber-500/25',
      )}
    >
      {label}
    </span>
  )
}
