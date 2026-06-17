import { Ban, CheckCircle2, CheckSquare } from 'lucide-react'
import { cn } from '../../utils/cn'

export default function ExamCategoryBulkActionsBar({
  count,
  enableCount = 0,
  disableCount = 0,
  onEnable,
  onDisable,
  className,
}) {
  if (!count) return null

  const label = count === 1 ? '1 category selected' : `${count} categories selected`

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        'flex flex-col gap-3 rounded-xl border border-[#55ace7]/25 bg-[#eef6fc] px-4 py-3 shadow-[0_4px_14px_rgba(15,23,42,0.06)]',
        'animate-[fadeInRow_0.25s_ease-out_both] sm:flex-row sm:items-center sm:justify-between',
        className,
      )}
    >
      <span className="inline-flex items-center gap-2 text-sm font-semibold text-[#246392]">
        <CheckSquare className="h-4 w-4 shrink-0" strokeWidth={2.4} aria-hidden />
        {label}
      </span>
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={onEnable}
          disabled={enableCount === 0}
          className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200/80 bg-white px-3.5 py-2 text-xs font-semibold text-emerald-800 shadow-sm transition hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-50 sm:text-sm"
        >
          <CheckCircle2 className="h-3.5 w-3.5" strokeWidth={2.4} />
          Enable Selected
        </button>
        <button
          type="button"
          onClick={onDisable}
          disabled={disableCount === 0}
          className="inline-flex items-center gap-1.5 rounded-lg border border-amber-200/80 bg-white px-3.5 py-2 text-xs font-semibold text-amber-800 shadow-sm transition hover:bg-amber-50 disabled:cursor-not-allowed disabled:opacity-50 sm:text-sm"
        >
          <Ban className="h-3.5 w-3.5" strokeWidth={2.4} />
          Disable Selected
        </button>
      </div>
    </div>
  )
}
