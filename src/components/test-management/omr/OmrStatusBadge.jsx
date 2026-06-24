import { cn } from '../../../utils/cn'

export default function OmrStatusBadge({ status }) {
  const active = status === 'Active'
  return (
    <span
      className={cn(
        'inline-flex min-w-[88px] items-center justify-center rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wide ring-1 ring-inset',
        active
          ? 'bg-emerald-500/15 text-emerald-800 ring-emerald-500/25'
          : 'bg-slate-200/80 text-slate-700 ring-slate-300/50',
      )}
    >
      {active ? 'Active' : 'Deactivated'}
    </span>
  )
}
