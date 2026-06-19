import { Ban, Star } from 'lucide-react'
import EditButton from '../common/EditButton'
import IconActionButton from '../common/IconActionButton'
import ViewButton from '../common/ViewButton'
import { cn } from '../../utils/cn'
import { TABLE_ACTIONS_WRAP } from '../../utils/tableColumnHelpers'

export default function RankerRowActions({
  rowName = 'ranker',
  status,
  isTop10 = false,
  top10Disabled = false,
  onView,
  onEdit,
  onStatusChange,
  onToggleTop10,
}) {
  const isActive = status === 'Active'
  const cannotAddTop10 = top10Disabled && !isTop10

  return (
    <div
      role="group"
      aria-label={`Actions for ${rowName}`}
      className={TABLE_ACTIONS_WRAP}
    >
      <ViewButton onClick={onView} label={`View ${rowName}`} />

      <EditButton onClick={onEdit} label={`Edit ${rowName}`} />

      <IconActionButton
        label={isActive ? `Set ${rowName} inactive` : `Set ${rowName} active`}
        onClick={() => onStatusChange?.(isActive ? 'Deactivated' : 'Active')}
        className="text-amber-700 hover:border-amber-100 hover:bg-amber-50 hover:text-amber-800"
      >
        <Ban className="h-[18px] w-[18px]" strokeWidth={2.25} aria-hidden />
      </IconActionButton>

      {isActive && (
        <IconActionButton
          label={
            cannotAddTop10
              ? 'Maximum 10 Top Rankers allowed'
              : isTop10
                ? `Remove Top 10 tag from ${rowName}`
                : `Mark ${rowName} as Top 10`
          }
          onClick={onToggleTop10}
          disabled={cannotAddTop10}
          className={cn(
            isTop10
              ? 'bg-amber-50 text-amber-700 ring-1 ring-amber-200/80 hover:bg-amber-100'
              : 'text-[#686868] hover:border-slate-200 hover:bg-slate-100 hover:text-amber-600',
            cannotAddTop10 && 'hover:bg-transparent hover:text-[#686868]',
          )}
        >
          <Star
            className={cn(
              'h-[18px] w-[18px]',
              isTop10 && 'fill-amber-500 text-amber-500',
            )}
            strokeWidth={2.25}
            aria-hidden
          />
        </IconActionButton>
      )}
    </div>
  )
}
