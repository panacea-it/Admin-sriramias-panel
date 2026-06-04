import { ArrowRight } from 'lucide-react'

export default function AssignmentActionBar({
  selectedCount,
  totalCount,
  onSelectAll,
  onCancel,
  onConfirm,
  saving,
  mode,
}) {
  return (
    <div className="sticky bottom-0 z-10 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 bg-white px-4 py-3 shadow-[0_-4px_20px_rgba(15,23,42,0.08)] sm:px-5">
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <span className="font-semibold text-[#1a3a5c]">
          {mode === 'all' ? totalCount : selectedCount} Student{selectedCount === 1 ? '' : 's'} Selected
        </span>
        {mode === 'partial' && totalCount > selectedCount ? (
          <button
            type="button"
            onClick={onSelectAll}
            className="text-sm font-semibold text-[#55ace7] hover:underline"
          >
            Select all {totalCount}
          </button>
        ) : null}
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="inline-flex h-10 items-center px-4 text-sm font-semibold text-slate-600 hover:text-[#1a3a5c]"
        >
          Cancel
        </button>
        <button
          type="button"
          disabled={saving || (mode === 'partial' && selectedCount === 0)}
          onClick={onConfirm}
          className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#55ace7] px-5 text-sm font-semibold text-white shadow-sm hover:bg-[#4699d4] disabled:cursor-not-allowed disabled:opacity-60"
        >
          Confirm Reassignment
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
