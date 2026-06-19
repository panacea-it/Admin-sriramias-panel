import { Ban, Eye, Pencil, Star } from 'lucide-react'
import { cn } from '../../utils/cn'

const actionButtonClass =
  'inline-flex h-9 w-9 shrink-0 items-center justify-center gap-1.5 rounded-lg border border-transparent p-0 text-xs font-semibold leading-none whitespace-nowrap transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#55ace7]/40 sm:h-9 sm:w-auto sm:min-w-[4.75rem] sm:px-2.5'

function RankerActionButton({
  label,
  title,
  ariaLabel,
  onClick,
  disabled = false,
  className,
  icon: Icon,
  iconClassName,
  labelClassName,
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={(e) => {
        e.stopPropagation()
        if (!disabled) onClick?.()
      }}
      title={title ?? label}
      aria-label={ariaLabel ?? label}
      className={cn(actionButtonClass, disabled && 'cursor-not-allowed opacity-40', className)}
    >
      <Icon className={cn('h-3.5 w-3.5 shrink-0', iconClassName)} strokeWidth={2.25} aria-hidden />
      <span className={cn('hidden sm:inline', labelClassName)}>{label}</span>
    </button>
  )
}

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
  const statusLabel = isActive ? 'Deactivated' : 'Active'

  return (
    <div
      role="group"
      aria-label={`Actions for ${rowName}`}
      className="ml-auto inline-flex w-max max-w-full flex-nowrap items-center justify-end gap-1.5 sm:gap-2"
    >
      <RankerActionButton
        label="View"
        ariaLabel={`View ${rowName}`}
        onClick={onView}
        icon={Eye}
        className="text-slate-500 hover:bg-slate-100 hover:text-[#246392]"
      />

      <RankerActionButton
        label="Edit"
        ariaLabel={`Edit ${rowName}`}
        onClick={onEdit}
        icon={Pencil}
        className="text-slate-500 hover:bg-slate-100 hover:text-[#246392]"
      />

      <RankerActionButton
        label={statusLabel}
        title={isActive ? 'Set Inactive' : 'Set Active'}
        ariaLabel={isActive ? `Set ${rowName} inactive` : `Set ${rowName} active`}
        onClick={() => onStatusChange?.(isActive ? 'Deactivated' : 'Active')}
        icon={Ban}
        labelClassName="min-w-[3.25rem] text-center"
        className="text-amber-700 hover:bg-amber-50 sm:min-w-[5.25rem]"
      />

      {isActive && (
        <RankerActionButton
          label="Top 10"
          title={
            cannotAddTop10
              ? 'Maximum 10 Top Rankers allowed'
              : isTop10
                ? 'Remove Top 10 tag'
                : 'Mark as Top 10 Ranker'
          }
          ariaLabel={
            cannotAddTop10
              ? 'Maximum 10 Top Rankers allowed'
              : isTop10
                ? `Remove Top 10 tag from ${rowName}`
                : `Mark ${rowName} as Top 10`
          }
          onClick={onToggleTop10}
          disabled={cannotAddTop10}
          icon={Star}
          iconClassName={isTop10 ? 'fill-amber-500 text-amber-500' : undefined}
          className={cn(
            'sm:min-w-[5.25rem]',
            isTop10
              ? 'bg-amber-50 text-amber-700 ring-1 ring-amber-200/80 hover:bg-amber-100'
              : 'text-[#686868] hover:bg-slate-100 hover:text-amber-600',
            cannotAddTop10 && 'hover:bg-transparent hover:text-[#686868]',
          )}
        />
      )}

    </div>
  )
}
