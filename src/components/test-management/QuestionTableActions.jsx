import { Ban, Copy, Eye, Pencil, Trash2 } from 'lucide-react'
import { cn } from '../../utils/cn'

const actionButtonClass =
  'inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[12px] font-semibold transition'

export default function QuestionTableActions({
  row,
  onView,
  onEdit,
  onDuplicate,
  onToggleStatus,
  onDelete,
}) {
  const isActive = row.status === 'Active'
  const rowLabel = row.id || 'question'

  return (
    <div className="flex flex-nowrap items-center justify-center gap-1 sm:gap-1.5">
      <button
        type="button"
        onClick={onView}
        title="View"
        aria-label={`View ${rowLabel}`}
        className={cn(actionButtonClass, 'text-slate-500 hover:bg-slate-100 hover:text-[#246392]')}
      >
        <Eye className="h-3.5 w-3.5 shrink-0" />
      </button>
      <button
        type="button"
        onClick={onEdit}
        title="Edit"
        aria-label={`Edit ${rowLabel}`}
        className={cn(actionButtonClass, 'text-slate-500 hover:bg-slate-100 hover:text-[#246392]')}
      >
        <Pencil className="h-3.5 w-3.5 shrink-0" />
      </button>
      <button
        type="button"
        onClick={onDuplicate}
        title="Duplicate"
        aria-label={`Duplicate ${rowLabel}`}
        className={cn(actionButtonClass, 'text-slate-500 hover:bg-slate-100 hover:text-[#246392]')}
      >
        <Copy className="h-3.5 w-3.5 shrink-0" />
      </button>
      <button
        type="button"
        onClick={onToggleStatus}
        title={isActive ? 'Disable' : 'Enable'}
        aria-label={isActive ? `Disable ${rowLabel}` : `Enable ${rowLabel}`}
        className={cn(actionButtonClass, 'text-amber-700 hover:bg-amber-50')}
      >
        <Ban className="h-3.5 w-3.5 shrink-0" />
      </button>
      <button
        type="button"
        onClick={onDelete}
        title="Delete"
        aria-label={`Delete ${rowLabel}`}
        className={cn(actionButtonClass, 'text-rose-600 hover:bg-rose-50 hover:text-rose-700')}
      >
        <Trash2 className="h-3.5 w-3.5 shrink-0" />
      </button>
    </div>
  )
}
