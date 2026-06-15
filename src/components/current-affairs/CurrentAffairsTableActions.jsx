import { Ban, Eye, Pencil, Trash2 } from 'lucide-react'
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
  const statusLabel = isActive ? 'Disable' : 'Enable'

  return (
    <div
      role="group"
      aria-label={`Actions for ${row.name}`}
      className="grid w-full min-w-0 grid-cols-4 items-center gap-0.5"
    >
      <ActionBtn
        label="View"
        onClick={onView}
        className="text-slate-500 hover:bg-slate-100 hover:text-[#246392]"
      >
        <Eye className="h-3.5 w-3.5 shrink-0" />
      </ActionBtn>
      <ActionBtn
        label="Edit"
        onClick={onEdit}
        className="text-slate-500 hover:bg-slate-100 hover:text-[#246392]"
      >
        <Pencil className="h-3.5 w-3.5 shrink-0" />
      </ActionBtn>
      <ActionBtn
        label={statusLabel}
        onClick={onStatusToggle}
        disabled={statusLoading}
        className={cn(
          isActive
            ? 'text-amber-700 hover:bg-amber-50'
            : 'text-emerald-700 hover:bg-emerald-50',
        )}
      >
        <Ban className="h-3.5 w-3.5 shrink-0" />
      </ActionBtn>
      <ActionBtn
        label="Delete"
        onClick={onDelete}
        className="text-[#c96565] hover:bg-red-50 hover:text-[#b94b4b]"
      >
        <Trash2 className="h-3.5 w-3.5 shrink-0" />
      </ActionBtn>
    </div>
  )
}
