import { Ban, CheckSquare, Trash2 } from 'lucide-react'
import { cn } from '../../utils/cn'

export default function CenterBulkActionsBar({
  count,
  disableCount = 0,
  selectedDisabledCount = 0,
  onDisable,
  onEnable,
  onDelete,
  className,
}) {
  if (!count) return null

  const label = count === 1 ? '1 Center Selected' : `${count} Centers Selected`

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
        <span className="text-[11px] font-semibold text-slate-500 sm:text-xs">
          {disableCount > 0
            ? `Deactivate applies to ${disableCount} active center${disableCount === 1 ? '' : 's'}.`
            : selectedDisabledCount > 0
              ? 'No active center is selected for deactivation.'
              : 'Choose an action below.'}
        </span>
        {selectedDisabledCount > 0 && (
          <button
            type="button"
            onClick={onEnable}
            title="Activate"
            className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200/80 bg-white px-3.5 py-2 text-xs font-semibold text-emerald-800 shadow-sm transition hover:bg-emerald-50 sm:text-sm"
          >
            <CheckSquare className="h-3.5 w-3.5" strokeWidth={2.4} />
            Activate Selected
          </button>
        )}
        <button
          type="button"
          onClick={onDisable}
          disabled={disableCount === 0}
          title="Deactivate"
          className="inline-flex items-center gap-1.5 rounded-lg border border-amber-200/80 bg-white px-3.5 py-2 text-xs font-semibold text-amber-800 shadow-sm transition hover:bg-amber-50 disabled:cursor-not-allowed disabled:opacity-50 sm:text-sm"
        >
          <Ban className="h-3.5 w-3.5" strokeWidth={2.4} />
          Deactivate Selected
        </button>
        <button
          type="button"
          onClick={onDelete}
          title="Delete"
          className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200/80 bg-white px-3.5 py-2 text-xs font-semibold text-rose-800 shadow-sm transition hover:bg-rose-50 sm:text-sm"
        >
          <Trash2 className="h-3.5 w-3.5" strokeWidth={2.4} />
          Delete Selected
        </button>
      </div>
    </div>
  )
}
