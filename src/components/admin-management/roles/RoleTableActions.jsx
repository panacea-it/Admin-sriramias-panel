import { Ban, Eye, Pencil, Trash2 } from 'lucide-react'
import { cn } from '../../../utils/cn'

const viewEditClassName =
  'inline-flex shrink-0 items-center gap-1.5 text-sm font-semibold text-slate-500 transition hover:text-[#246392]'

export default function RoleTableActions({
  row,
  onView,
  onEdit,
  onStatusToggle,
  onDelete,
  canToggle = true,
  canDelete = true,
}) {
  const isActive = row.enabled

  return (
    <div className="flex flex-nowrap items-center justify-center gap-4 whitespace-nowrap">
      <button
        type="button"
        onClick={onView}
        title="View"
        aria-label={`View ${row.label}`}
        className={viewEditClassName}
      >
        <Eye className="h-3.5 w-3.5 shrink-0" strokeWidth={2.4} />
        View
      </button>
      <button
        type="button"
        onClick={onEdit}
        title="Edit"
        aria-label={`Edit ${row.label}`}
        className={viewEditClassName}
      >
        <Pencil className="h-3.5 w-3.5 shrink-0" strokeWidth={2.4} />
        Edit
      </button>
      <button
        type="button"
        onClick={onStatusToggle}
        disabled={!canToggle}
        title={isActive ? 'Disable' : 'Enable'}
        aria-label={isActive ? `Disable ${row.label}` : `Enable ${row.label}`}
        className={cn(
          'inline-flex shrink-0 items-center gap-1.5 text-sm font-semibold text-amber-700 transition hover:text-amber-800',
          !canToggle && 'cursor-not-allowed opacity-40 hover:text-amber-700',
        )}
      >
        <Ban className="h-3.5 w-3.5 shrink-0" strokeWidth={2.4} />
        {isActive ? 'Disable' : 'Enable'}
      </button>
      <button
        type="button"
        onClick={onDelete}
        disabled={!canDelete}
        title="Delete"
        aria-label={`Delete ${row.label}`}
        className={cn(
          'inline-flex shrink-0 items-center gap-1.5 text-sm font-semibold text-rose-600 transition hover:text-rose-700',
          !canDelete && 'cursor-not-allowed opacity-40 hover:text-rose-600',
        )}
      >
        <Trash2 className="h-3.5 w-3.5 shrink-0" strokeWidth={2.4} />
        Delete
      </button>
    </div>
  )
}
