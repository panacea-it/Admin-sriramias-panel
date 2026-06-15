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
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-b-2xl border-t border-slate-200/70 bg-white px-4 py-3 sm:px-5">
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <span className="font-semibold text-[#1a3a5c]">
          {mode === 'all' ? totalCount : selectedCount} Student
          {(mode === 'all' ? totalCount : selectedCount) === 1 ? '' : 's'} Selected
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
      <div className="flex flex-wrap items-center justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="inline-flex h-10 items-center rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-[#1a3a5c] shadow-sm transition hover:bg-slate-50"
        >
          Cancel
        </button>
        <button
          type="button"
          disabled={saving || (mode === 'partial' && selectedCount === 0)}
          onClick={onConfirm}
          className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#55ace7] px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#4699d4] disabled:cursor-not-allowed disabled:opacity-60"
        >
          Confirm Reassignment
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
