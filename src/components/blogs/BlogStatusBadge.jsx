import { Loader2 } from 'lucide-react'
import { cn } from '../../utils/cn'

export default function BlogStatusBadge({ status, loading, disabled, onClick }) {
  const published = status === 'published'

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || loading || !onClick}
      title={onClick ? 'Click to change status' : undefined}
      className={cn(
        'inline-flex min-w-[88px] items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-semibold capitalize text-white transition',
        published ? 'bg-[#69df66]' : 'bg-[#efb36d]',
        onClick &&
          !disabled &&
          !loading &&
          'hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#55ace7]/50',
        (disabled || loading) && onClick && 'cursor-wait opacity-80',
        !onClick && 'cursor-default',
      )}
    >
      {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden /> : null}
      {published ? 'Published' : 'Draft'}
    </button>
  )
}
