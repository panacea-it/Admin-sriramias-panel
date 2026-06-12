import { Ban, CheckSquare, Trash2 } from 'lucide-react'
import { cn } from '../../../utils/cn'

export default function FreeResourcesBulkActionsBar({
  count,
  disableCount = 0,
  onClearSelection,
  onDisable,
  onDelete,
  className,
}) {
  if (!count) return null

  const label = count === 1 ? '1 selected' : `${count} selected`

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        'flex flex-col gap-3 rounded-xl border border-[#55ace7]/20 bg-white px-4 py-3',
        'shadow-[0_2px_8px_rgba(15,23,42,0.06)] sm:flex-row sm:items-center sm:justify-between',
        className,
      )}
    >
      <div className="flex flex-wrap items-center gap-3">
        <span className="inline-flex items-center gap-2 text-sm font-semibold text-[#246392]">
          <CheckSquare className="h-4 w-4 shrink-0" strokeWidth={2.4} aria-hidden />
          {label}
        </span>
        <button
          type="button"
          onClick={onClearSelection}
          className="text-sm font-medium text-[#686868] underline-offset-2 hover:underline"
        >
          Clear selection
        </button>
      </div>
      <div className="flex flex-wrap items-center gap-2 sm:ml-auto">
        <button
          type="button"
          onClick={onDisable}
          disabled={disableCount === 0}
          className="inline-flex items-center gap-1.5 rounded-lg border border-amber-200/80 bg-white px-3.5 py-2 text-xs font-semibold text-amber-800 shadow-sm transition hover:bg-amber-50 disabled:cursor-not-allowed disabled:opacity-50 sm:text-sm"
        >
          <Ban className="h-3.5 w-3.5" strokeWidth={2.4} />
          Disable Selected
        </button>
        <button
          type="button"
          onClick={onDelete}
          className="inline-flex items-center gap-1.5 rounded-lg bg-[#dc2626] px-3.5 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-[#b91c1c] sm:text-sm"
        >
          <Trash2 className="h-3.5 w-3.5" strokeWidth={2.4} />
          Delete Selected
        </button>
      </div>
    </div>
  )
}
