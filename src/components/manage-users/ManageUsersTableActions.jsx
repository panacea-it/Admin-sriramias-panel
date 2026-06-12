import { Ban, Circle, Eye, Pencil, Trash2 } from 'lucide-react'
import { cn } from '../../utils/cn'

function ActionButton({ title, ariaLabel, onClick, disabled, className, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      aria-label={ariaLabel}
      className={cn(
        'inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition',
        'disabled:cursor-not-allowed disabled:opacity-40',
        className,
      )}
    >
      {children}
    </button>
  )
}

export default function ManageUsersTableActions({
  row,
  onView,
  onEdit,
  onStatusToggle,
  onDelete,
  disabled = false,
}) {
  const isActive = row.status === 'Active'

  return (
    <div className="flex items-center justify-center gap-1.5">
      <ActionButton
        title="View"
        ariaLabel={`View ${row.fullName}`}
        onClick={onView}
        disabled={disabled}
        className="bg-[#EEF5FF] text-[#1D72B8] hover:bg-[#4CA6E8]/20 hover:text-[#07133F]"
      >
        <Eye className="h-4 w-4" strokeWidth={2} aria-hidden />
      </ActionButton>
      <ActionButton
        title="Edit"
        ariaLabel={`Edit ${row.fullName}`}
        onClick={onEdit}
        disabled={disabled}
        className="bg-[#1D72B8]/10 text-[#1D72B8] hover:bg-[#1D72B8] hover:text-white"
      >
        <Pencil className="h-4 w-4" strokeWidth={2} aria-hidden />
      </ActionButton>
      <ActionButton
        title={isActive ? 'Disable' : 'Enable'}
        ariaLabel={isActive ? `Disable ${row.fullName}` : `Enable ${row.fullName}`}
        onClick={onStatusToggle}
        disabled={disabled}
        className="bg-orange-50 text-orange-600 hover:bg-orange-100 hover:text-orange-700"
      >
        {isActive ? (
          <Ban className="h-4 w-4" strokeWidth={2} aria-hidden />
        ) : (
          <Circle className="h-4 w-4" strokeWidth={2} aria-hidden />
        )}
      </ActionButton>
      <ActionButton
        title="Delete"
        ariaLabel={`Delete ${row.fullName}`}
        onClick={onDelete}
        disabled={disabled}
        className="bg-[#D64B5F]/10 text-[#D64B5F] hover:bg-[#D64B5F] hover:text-white"
      >
        <Trash2 className="h-4 w-4" strokeWidth={2} aria-hidden />
      </ActionButton>
    </div>
  )
}
