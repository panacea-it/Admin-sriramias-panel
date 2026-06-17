import { Ban, Eye, Pencil, Star, Trash2 } from 'lucide-react'
import { cn } from '../../utils/cn'

const actionButtonClass =
  'inline-flex h-8 min-w-[2rem] shrink-0 items-center justify-center gap-1 rounded-lg px-2 py-1.5 text-[12px] font-semibold transition sm:min-w-0 sm:px-2.5'

export default function RankerRowActions({
  rowName = 'ranker',
  status,
  isTop10 = false,
  top10Disabled = false,
  onView,
  onEdit,
  onStatusChange,
  onToggleTop10,
  onDelete,
}) {
  const isActive = status === 'Active'
  const cannotAddTop10 = top10Disabled && !isTop10

  return (
    <div
      role="group"
      aria-label={`Actions for ${rowName}`}
      className="flex flex-nowrap items-center justify-end gap-1 sm:gap-1.5"
    >
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          onView?.()
        }}
        title="View"
        aria-label={`View ${rowName}`}
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
        onClick={(e) => {
          e.stopPropagation()
          onEdit?.()
        }}
        title="Edit"
        aria-label={`Edit ${rowName}`}
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
        onClick={(e) => {
          e.stopPropagation()
          onStatusChange?.(isActive ? 'Inactive' : 'Active')
        }}
        title={isActive ? 'Set Inactive' : 'Set Active'}
        aria-label={isActive ? `Set ${rowName} inactive` : `Set ${rowName} active`}
        className={cn(actionButtonClass, 'text-amber-700 hover:bg-amber-50')}
      >
        <Ban className="h-3.5 w-3.5 shrink-0" />
        <span className="hidden sm:inline">{isActive ? 'Inactive' : 'Active'}</span>
      </button>

      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          if (cannotAddTop10) return
          onToggleTop10?.()
        }}
        disabled={cannotAddTop10}
        title={
          cannotAddTop10
            ? 'Maximum 10 Top Rankers allowed'
            : isTop10
              ? 'Remove Top 10 tag'
              : 'Mark as Top 10 Ranker'
        }
        aria-label={
          cannotAddTop10
            ? 'Maximum 10 Top Rankers allowed'
            : isTop10
              ? `Remove Top 10 tag from ${rowName}`
              : `Mark ${rowName} as Top 10`
        }
        className={cn(
          actionButtonClass,
          isTop10
            ? 'bg-amber-50 text-amber-700 hover:bg-amber-100'
            : 'text-[#686868] hover:bg-slate-100 hover:text-amber-600',
          cannotAddTop10 && 'cursor-not-allowed opacity-40 hover:bg-transparent hover:text-[#686868]',
        )}
      >
        <Star className={cn('h-3.5 w-3.5 shrink-0', isTop10 && 'fill-amber-500 text-amber-500')} />
        <span className="hidden lg:inline">Top 10</span>
      </button>

      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          onDelete?.()
        }}
        title="Delete"
        aria-label={`Delete ${rowName}`}
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
