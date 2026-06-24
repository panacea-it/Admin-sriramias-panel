import { Ban, CheckSquare, Trash2 } from 'lucide-react'
import { cn } from '../../utils/cn'

export default function ManageUsersBulkActionsBar({
  count,
  disableCount = 0,
  onDisable,
  onDelete,
  className,
}) {
  if (!count) return null

  const label = count === 1 ? '1 user selected' : `${count} users selected`

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        'flex flex-col gap-3 rounded-xl border border-[#E7ECF5] bg-[#EEF5FF] px-4 py-3 shadow-[0_4px_14px_rgba(7,19,63,0.05)]',
        'animate-[fadeInRow_0.25s_ease-out_both] sm:flex-row sm:items-center sm:justify-between',
        className,
      )}
    >
      <span className="inline-flex items-center gap-2 text-sm font-semibold text-[#1D72B8]">
        <CheckSquare className="h-4 w-4 shrink-0" strokeWidth={2.4} aria-hidden />
        {label}
      </span>
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={onDisable}
          disabled={disableCount === 0}
          className="inline-flex items-center gap-1.5 rounded-lg border border-orange-200 bg-white px-3.5 py-2 text-xs font-semibold text-orange-700 shadow-sm transition hover:bg-orange-50 disabled:cursor-not-allowed disabled:opacity-50 sm:text-sm"
        >
          <Ban className="h-3.5 w-3.5" strokeWidth={2.4} />
          Disable Selected
        </button>
        <button
          type="button"
          onClick={onDelete}
          className="inline-flex items-center gap-1.5 rounded-lg bg-[#D64B5F] px-3.5 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-[#c43d51] sm:text-sm"
        >
          <Trash2 className="h-3.5 w-3.5" strokeWidth={2.4} />
          Delete Selected
        </button>
      </div>
    </div>
  )
}
