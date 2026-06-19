import { Ban, Eye, Pencil } from 'lucide-react'
import { cn } from '../../utils/cn'

function ActionBtn({ label, onClick, disabled, className, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={label}
      aria-label={label}
      className={cn(
        'inline-flex min-w-0 flex-1 items-center justify-center gap-0.5 rounded-md px-0.5 py-1 text-[11px] font-semibold transition sm:gap-1 sm:px-1 sm:text-xs',
        'disabled:cursor-not-allowed disabled:opacity-60',
        className,
      )}
    >
      {children}
      <span className="truncate">{label}</span>
    </button>
  )
}

export default function CurrentAffairsTableActions({
  row,
  onView,
  onEdit,
  onStatusToggle,
  onDelete,
  statusLoading = false,
}) {
  const isActive = row.status === 'Active'
  const statusLabel = isActive ? 'Deactivate' : 'Activate'

  return (
    <div
      role="group"
      aria-label={`Actions for ${row.name}`}
      className="grid w-full min-w-0 grid-cols-4 items-center gap-0.5"
    >
      </div>
  )
}
