import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '../../utils/cn'

export default function Pagination({
  page,
  totalPages,
  onPageChange,
  className,
}) {
  if (totalPages <= 1) return null

  const pages = Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
    if (totalPages <= 5) return i + 1
    if (page <= 3) return i + 1
    if (page >= totalPages - 2) return totalPages - 4 + i
    return page - 2 + i
  })

  return (
    <div
      className={cn(
        'flex flex-wrap items-center justify-between gap-3 border-t border-[var(--color-border)] px-4 py-3 sm:px-5',
        className,
      )}
    >
      <p className="text-xs text-[var(--color-text-muted)] sm:text-sm">
        Page {page} of {totalPages}
      </p>
      <div className="flex items-center gap-1">
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--color-border)] disabled:opacity-40 hover:bg-slate-50"
          aria-label="Previous page"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        {pages.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => onPageChange(p)}
            className={cn(
              'flex h-8 min-w-8 items-center justify-center rounded-lg px-2 text-sm font-medium transition',
              p === page
                ? 'bg-[var(--color-primary)] text-white'
                : 'border border-[var(--color-border)] hover:bg-slate-50',
            )}
          >
            {p}
          </button>
        ))}
        <button
          type="button"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--color-border)] disabled:opacity-40 hover:bg-slate-50"
          aria-label="Next page"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
