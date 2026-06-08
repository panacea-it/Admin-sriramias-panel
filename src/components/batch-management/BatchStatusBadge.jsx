import { cn } from '../../utils/cn'

export const BATCH_STATUS_STYLES = {
  Active: 'bg-emerald-500 text-white shadow-[0_2px_8px_rgba(16,185,129,0.35)] hover:bg-emerald-600',
  Upcoming: 'bg-blue-500 text-white shadow-[0_2px_8px_rgba(59,130,246,0.35)] hover:bg-blue-600',
  Inactive: 'bg-amber-500 text-white shadow-[0_2px_8px_rgba(245,158,11,0.35)] hover:bg-amber-600',
  Completed:
    'bg-purple-500 text-white shadow-[0_2px_8px_rgba(168,85,247,0.35)] hover:bg-purple-600',
  Archived: 'bg-slate-500 text-white shadow-[0_2px_8px_rgba(100,116,139,0.35)] hover:bg-slate-600',
  Cancelled: 'bg-red-500 text-white shadow-[0_2px_8px_rgba(239,68,68,0.35)] hover:bg-red-600',
}

export default function BatchStatusBadge({
  status,
  className,
  interactive = false,
  onClick,
}) {
  const Tag = interactive ? 'button' : 'span'

  return (
    <Tag
      type={interactive ? 'button' : undefined}
      onClick={interactive ? onClick : undefined}
      className={cn(
        'inline-flex min-w-[96px] items-center justify-center rounded-lg px-3 py-1.5 text-xs font-bold uppercase tracking-wide transition-all duration-200 sm:text-sm',
        BATCH_STATUS_STYLES[status] ?? 'bg-slate-400 text-white',
        interactive && 'cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#55ace7]/60',
        className,
      )}
    >
      {status}
    </Tag>
  )
}
