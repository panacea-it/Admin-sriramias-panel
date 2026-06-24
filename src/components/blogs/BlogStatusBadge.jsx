import { Loader2 } from 'lucide-react'
import { cn } from '../../utils/cn'
import { blogStatusLabel, isBlogActive } from '../../constants/blogManagementConstants'

export default function BlogStatusBadge({ status, loading, disabled, onClick }) {
  const active = isBlogActive(status)
  const label = blogStatusLabel(status)
  const interactive = Boolean(onClick) && !disabled && !loading

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || loading || !onClick}
      title={interactive ? 'Click to change status' : undefined}
      className={cn(
        'inline-flex min-w-[92px] items-center justify-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wide ring-1 ring-inset',
        active
          ? 'bg-emerald-500/15 text-emerald-800 ring-emerald-500/25'
          : 'bg-amber-500/15 text-amber-900 ring-amber-500/25',
        interactive && 'transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#55ace7]/50',
        (disabled || loading) && onClick && 'cursor-wait opacity-80',
        !onClick && 'cursor-default',
      )}
    >
      {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden /> : null}
      {label}
    </button>
  )
}
