import { CheckSquare, UserPlus } from 'lucide-react'
import { cn } from '../../../utils/cn'

export default function EvaluationOversightBulkActionsBar({
  count,
  onBulkAssign,
  onClearSelection,
  className,
}) {
  if (!count) return null

  const label = count === 1 ? '1 Paper Selected' : `${count} Papers Selected`

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
          onClick={onClearSelection}
          className="inline-flex items-center rounded-lg border border-slate-200/80 bg-white px-3.5 py-2 text-xs font-semibold text-[#686868] shadow-sm transition hover:bg-slate-50 sm:text-sm"
        >
          Clear Selection
        </button>
        <button
          type="button"
          onClick={onBulkAssign}
          className="inline-flex items-center gap-1.5 rounded-lg bg-[#55ace7] px-3.5 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-[#4699d4] sm:text-sm"
        >
          <UserPlus className="h-3.5 w-3.5" strokeWidth={2.4} />
          Bulk Assign Evaluators
        </button>
      </div>
    </div>
  )
}
