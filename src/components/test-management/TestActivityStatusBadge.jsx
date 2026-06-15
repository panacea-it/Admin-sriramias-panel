import { cn } from '../../utils/cn'

const STATUS_STYLES = {
  Published: 'bg-emerald-500 text-white',
  Live: 'bg-orange-500 text-white',
  Pending: 'bg-amber-400 text-white',
  Scheduled: 'bg-[#55ace7] text-white',
  Draft: 'bg-slate-400 text-white',
}

const BADGE_WIDTH = 'w-[7.75rem]'

export default function TestActivityStatusBadge({ status, className }) {
  const label = status || '—'
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center justify-center whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold leading-none sm:text-sm',
        BADGE_WIDTH,
        STATUS_STYLES[status] ?? 'bg-slate-300 text-white',
        className,
      )}
    >
      {label}
    </span>
  )
}
