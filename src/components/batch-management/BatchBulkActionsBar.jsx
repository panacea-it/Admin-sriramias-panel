import { Archive, GitMerge, RefreshCw, Trash2, X } from 'lucide-react'
import { cn } from '../../utils/cn'

export default function BatchBulkActionsBar({
  selectedCount,
  onClearSelection,
  onChangeStatus,
  onArchive,
  onDelete,
  onMerge,
}) {
  if (selectedCount === 0) return null

  return (
    <div
      className={cn(
        'flex flex-wrap items-center justify-between gap-3 rounded-xl px-4 py-3',
        'bg-gradient-to-r from-[#1a3a5c] to-[#246392] text-white shadow-lg',
        'transition-all duration-200',
      )}
    >
      <div className="flex items-center gap-3">
        <span className="text-sm font-bold">
          {selectedCount} batch{selectedCount !== 1 ? 'es' : ''} selected
        </span>
        <button
          type="button"
          onClick={onClearSelection}
          className="inline-flex items-center gap-1 rounded-lg bg-white/15 px-2.5 py-1 text-xs font-semibold transition hover:bg-white/25"
        >
          <X className="h-3.5 w-3.5" />
          Clear
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        <BulkBtn icon={RefreshCw} label="Change Status" onClick={onChangeStatus} />
        <BulkBtn icon={Archive} label="Archive" onClick={onArchive} />
        <BulkBtn icon={GitMerge} label="Merge Batches" onClick={onMerge} />
        <BulkBtn icon={Trash2} label="Delete" onClick={onDelete} danger />
      </div>
    </div>
  )
}

function BulkBtn({ icon: Icon, label, onClick, danger }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'inline-flex h-9 items-center gap-2 rounded-lg px-3 text-xs font-bold transition sm:text-sm',
        danger
          ? 'bg-red-500/90 hover:bg-red-500'
          : 'bg-white/15 hover:bg-white/25',
      )}
    >
      <Icon className="h-4 w-4" />
      {label}
    </button>
  )
}
