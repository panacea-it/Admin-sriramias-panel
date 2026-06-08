import { ArrowRightLeft, Eye, Pencil, Trash2, ToggleLeft, ToggleRight } from 'lucide-react'
import { cn } from '../../utils/cn'

function ActionBtn({ label, onClick, className, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      className={cn(
        'inline-flex h-8 w-8 items-center justify-center rounded-lg transition',
        className,
      )}
    >
      {children}
    </button>
  )
}

export default function StudentTableActions({
  status,
  onView,
  onEdit,
  onMove,
  onDelete,
  onToggleStatus,
}) {
  const isActive = status === 'Active'

  return (
    <div className="flex items-center justify-end gap-1">
      <ActionBtn
        label="View details"
        onClick={onView}
        className="text-[#246392] hover:bg-[#eef6fc]"
      >
        <Eye className="h-4 w-4" strokeWidth={2.2} />
      </ActionBtn>
      <ActionBtn
        label="Edit student"
        onClick={onEdit}
        className="text-amber-600 hover:bg-amber-50"
      >
        <Pencil className="h-4 w-4" strokeWidth={2.2} />
      </ActionBtn>
      {onMove && (
        <ActionBtn
          label="Move student"
          onClick={onMove}
          className="text-[#246392] hover:bg-[#eef6fc]"
        >
          <ArrowRightLeft className="h-4 w-4" strokeWidth={2.2} />
        </ActionBtn>
      )}
      <ActionBtn
        label={isActive ? 'Disable' : 'Enable'}
        onClick={onToggleStatus}
        className="text-[#246392] hover:bg-[#eef2fc]"
      >
        {isActive ? (
          <ToggleRight className="h-4 w-4" strokeWidth={2.2} />
        ) : (
          <ToggleLeft className="h-4 w-4" strokeWidth={2.2} />
        )}
      </ActionBtn>
      <ActionBtn
        label="Delete student"
        onClick={onDelete}
        className="text-rose-600 hover:bg-rose-50"
      >
        <Trash2 className="h-4 w-4" strokeWidth={2.1} />
      </ActionBtn>
    </div>
  )
}
