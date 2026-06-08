import { Loader2 } from 'lucide-react'
import { cn } from '../../utils/cn'

export default function BannerStatusBadge({ status, loading, disabled, onClick }) {
  const active = status === 'Active'

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || loading}
      title={onClick ? 'Click to toggle status' : undefined}
      className={cn(
        'inline-flex min-w-[88px] items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-semibold text-white transition',
        active ? 'bg-[#69df66]' : 'bg-[#9ca3af]',
        onClick && !disabled && 'hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#55ace7]/50',
        (disabled || loading) && 'cursor-wait opacity-80',
      )}
    >
      {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden /> : null}
      {status}
    </button>
  )
}
