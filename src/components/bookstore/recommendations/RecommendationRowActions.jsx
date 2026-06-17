import { Ban, Eye, Pencil, Trash2 } from 'lucide-react'
import { cn } from '../../../utils/cn'

const actionButtonClass =
  'inline-flex h-8 min-w-[2rem] shrink-0 items-center justify-center gap-1 rounded-lg px-2 py-1.5 text-[12px] font-semibold transition sm:min-w-0 sm:px-2.5'

export default function RecommendationRowActions({
  label = 'rule',
  status,
  onView,
  onEdit,
  onStatusToggle,
  onDelete,
}) {
  const isActive = status === 'active'

  return (
    <div
      role="group"
      aria-label={`Actions for ${label}`}
      className="flex flex-nowrap items-center justify-end gap-1 sm:gap-1.5"
    >
      <button
        type="button"
        onClick={onView}
        title="View"
        aria-label={`View ${label}`}
        className={cn(
          actionButtonClass,
          'text-slate-500 hover:bg-slate-100 hover:text-[#246392]',
        )}
      >
        <Eye className="h-3.5 w-3.5 shrink-0" />
        <span className="hidden sm:inline">View</span>
      </button>

      <button
        type="button"
        onClick={onEdit}
        title="Edit"
        aria-label={`Edit ${label}`}
        className={cn(
          actionButtonClass,
          'text-slate-500 hover:bg-slate-100 hover:text-[#246392]',
        )}
      >
        <Pencil className="h-3.5 w-3.5 shrink-0" />
        <span className="hidden sm:inline">Edit</span>
      </button>

      <button
        type="button"
        onClick={onStatusToggle}
        title={isActive ? 'Disable' : 'Enable'}
        aria-label={isActive ? `Disable ${label}` : `Enable ${label}`}
        className={cn(actionButtonClass, 'text-amber-700 hover:bg-amber-50')}
      >
        <Ban className="h-3.5 w-3.5 shrink-0" />
        <span className="hidden sm:inline">{isActive ? 'Disable' : 'Enable'}</span>
      </button>

      <button
        type="button"
        onClick={onDelete}
        title="Delete"
        aria-label={`Delete ${label}`}
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
