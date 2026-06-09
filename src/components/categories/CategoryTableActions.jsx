import { Eye, Pencil, Trash2, ToggleLeft, ToggleRight } from 'lucide-react'
import { cn } from '../../utils/cn'

function ActionBtn({ label, onClick, className, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      className={cn(
        'inline-flex min-w-0 flex-1 items-center justify-center gap-1 rounded-md px-1 py-1 text-xs font-medium transition-all duration-150 hover:scale-105 active:scale-95 sm:gap-1.5 sm:px-1.5 sm:text-sm',
        className,
      )}
    >
      {children}
      <span className="truncate">{label}</span>
    </button>
  )
}

function IconActionBtn({ label, onClick, className, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      className={cn(
        'inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-transparent',
        'transition-all duration-150 active:scale-95',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#55ace7]/50 focus-visible:ring-offset-1',
        className,
      )}
    >
      {children}
    </button>
  )
}

export default function CategoryTableActions({
  status,
  onView,
  onEdit,
  onDelete,
  onToggleStatus,
  compact = false,
  /** Override status action tooltip/aria label in `icons` variant (default: Activate/Deactivate) */
  statusLabel: statusLabelOverride,
  /** `icons` = icon-only toolbar; default keeps labelled buttons for other modules */
  variant = 'default',
}) {
  const isActive = status === 'Active'

  if (variant === 'icons') {
    const statusLabel = statusLabelOverride ?? (isActive ? 'Deactivate' : 'Activate')

    return (
      <div
        role="group"
        aria-label="Row actions"
        className="inline-flex items-center justify-end gap-1 sm:gap-1.5"
      >
        <IconActionBtn
          label="View"
          onClick={onView}
          className="text-[#555] hover:border-slate-200 hover:bg-slate-100 hover:text-[#246392] hover:shadow-sm"
        >
          <Eye className="h-[18px] w-[18px]" strokeWidth={2.25} aria-hidden="true" />
        </IconActionBtn>
        <IconActionBtn
          label="Edit"
          onClick={onEdit}
          className="text-[#555] hover:border-slate-200 hover:bg-slate-100 hover:text-[#246392] hover:shadow-sm"
        >
          <Pencil className="h-[18px] w-[18px]" strokeWidth={2.25} aria-hidden="true" />
        </IconActionBtn>
        <IconActionBtn
          label={statusLabel}
          onClick={onToggleStatus}
          className="text-[#246392] hover:border-[#cbeeff] hover:bg-[#eef2fc] hover:text-[#1a5276] hover:shadow-sm"
        >
          {isActive ? (
            <ToggleRight className="h-[18px] w-[18px]" strokeWidth={2.25} aria-hidden="true" />
          ) : (
            <ToggleLeft className="h-[18px] w-[18px]" strokeWidth={2.25} aria-hidden="true" />
          )}
        </IconActionBtn>
        <IconActionBtn
          label="Delete"
          onClick={onDelete}
          className="text-[#c96565] hover:border-red-100 hover:bg-red-50 hover:text-[#b94b4b] hover:shadow-sm"
        >
          <Trash2 className="h-[18px] w-[18px]" strokeWidth={2.2} aria-hidden="true" />
        </IconActionBtn>
      </div>
    )
  }

  return (
    <div
      className={cn(
        'grid w-full min-w-[min(100%,17.5rem)] max-w-[22rem] grid-cols-4 items-center gap-0.5 sm:gap-1',
        compact && 'min-w-[min(100%,15.5rem)] max-w-[19rem]',
      )}
    >
      <ActionBtn
        label="View"
        onClick={onView}
        className="text-[#686868] hover:bg-slate-100 hover:text-[#246392]"
      >
        <Eye className="h-4 w-4 shrink-0" strokeWidth={2.2} />
      </ActionBtn>
      <ActionBtn
        label="Edit"
        onClick={onEdit}
        className="text-[#686868] hover:bg-slate-100 hover:text-[#246392]"
      >
        <Pencil className="h-4 w-4 shrink-0" strokeWidth={2.2} />
      </ActionBtn>
      <ActionBtn
        label={isActive ? 'Disable' : 'Enable'}
        onClick={onToggleStatus}
        className="text-[#246392] hover:bg-[#eef2fc]"
      >
        {isActive ? (
          <ToggleRight className="h-4 w-4 shrink-0" strokeWidth={2.2} />
        ) : (
          <ToggleLeft className="h-4 w-4 shrink-0" strokeWidth={2.2} />
        )}
      </ActionBtn>
      <ActionBtn
        label="Delete"
        onClick={onDelete}
        className="text-[#c96565] hover:bg-red-50 hover:text-[#b94b4b]"
      >
        <Trash2 className="h-4 w-4 shrink-0" strokeWidth={2.1} />
      </ActionBtn>
    </div>
  )
}
