import { Ban, Eye, Pencil, Trash2 } from 'lucide-react'
import { cn } from '../../utils/cn'

const actionButtonClass =
  'inline-flex h-8 min-w-[2rem] shrink-0 items-center justify-center gap-1 rounded-lg px-2 py-1.5 text-[12px] font-semibold transition sm:min-w-0 sm:px-2.5'

export default function CurrentAffairsTableActions({
  row,
  onView,
  onEdit,
  onStatusToggle,
  onDelete,
  statusLoading = false,
}) {
  const isActive = row.status === 'Active'

  return (
    <div className="flex flex-nowrap items-center justify-end gap-1 sm:gap-1.5">
      <button
        type="button"
        onClick={onView}
        title="View"
        aria-label={`View ${row.name}`}
        className={cn(actionButtonClass, 'text-slate-500 hover:bg-slate-100 hover:text-[#246392]')}
      >
        <Eye className="h-3.5 w-3.5 shrink-0" />
        <span className="hidden sm:inline">View</span>
      </button>
      <button
        type="button"
        onClick={onEdit}
        title="Edit"
        aria-label={`Edit ${row.name}`}
        className={cn(actionButtonClass, 'text-slate-500 hover:bg-slate-100 hover:text-[#246392]')}
      >
        <Pencil className="h-3.5 w-3.5 shrink-0" />
        <span className="hidden sm:inline">Edit</span>
      </button>
      <button
        type="button"
        onClick={onStatusToggle}
        disabled={statusLoading}
        title={isActive ? 'Deactivate' : 'Activate'}
        aria-label={
          isActive ? `Deactivate ${row.name}` : `Activate ${row.name}`
        }
        className={cn(
          actionButtonClass,
          isActive
            ? 'text-amber-700 hover:bg-amber-50 disabled:opacity-60'
            : 'text-emerald-700 hover:bg-emerald-50 disabled:opacity-60',
        )}
      >
        <Ban className="h-3.5 w-3.5 shrink-0" />
        <span className="hidden sm:inline">{isActive ? 'Deactivate' : 'Activate'}</span>
      </button>
      <button
        type="button"
        onClick={onDelete}
        title="Delete"
        aria-label={`Delete ${row.name}`}
        className={cn(
          actionButtonClass,
          'text-[#c96565] hover:bg-red-50 hover:text-[#b94b4b]',
        )}
      >
        <Trash2 className="h-3.5 w-3.5 shrink-0" />
        <span className="hidden sm:inline">Delete</span>
      </button>
    </div>
  )
}
