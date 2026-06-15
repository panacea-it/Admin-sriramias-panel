import { Eye, Pencil, RefreshCw, ToggleLeft, ToggleRight, Trash2 } from 'lucide-react'
import { cn } from '../../utils/cn'
import { isStudentEnrollmentActive } from './studentStatusDisplay'

const actionButtonClass =
  'inline-flex h-8 shrink-0 items-center justify-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-semibold whitespace-nowrap transition'

function ActionBtn({ label, onClick, className, children, disabled = false }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={label}
      aria-label={label}
      className={cn(
        actionButtonClass,
        disabled && 'cursor-not-allowed opacity-50',
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
  demoOnly = false,
  canMove = true,
}) {
  const isActive = isStudentEnrollmentActive(status)

  if (demoOnly) {
    return (
      <div className="flex min-w-max flex-nowrap items-center justify-start gap-5 whitespace-nowrap">
        <ActionBtn
          label="View"
          onClick={onView}
          className="text-[#246392] hover:bg-[#eef6fc]"
        >
          <Eye className="h-3.5 w-3.5 shrink-0" />
          <span>View</span>
        </ActionBtn>
        <ActionBtn
          label="Edit"
          onClick={onEdit}
          className="text-slate-500 hover:bg-slate-100 hover:text-[#246392]"
        >
          <Pencil className="h-3.5 w-3.5 shrink-0" />
          <span>Edit</span>
        </ActionBtn>
        {canMove && onMove && (
          <ActionBtn
            label="Move"
            onClick={onMove}
            className="text-[#246392] hover:bg-[#eef6fc]"
          >
            <RefreshCw className="h-3.5 w-3.5 shrink-0" />
            <span>Move</span>
          </ActionBtn>
        )}
      </div>
    )
  }

  return (
    <div className="flex min-w-max flex-nowrap items-center justify-start gap-5 whitespace-nowrap">
      <ActionBtn
        label="View"
        onClick={onView}
        className="text-[#246392] hover:bg-[#eef6fc]"
      >
        <Eye className="h-3.5 w-3.5 shrink-0" />
        <span>View</span>
      </ActionBtn>
      <ActionBtn
        label="Edit"
        onClick={onEdit}
        className="text-slate-500 hover:bg-slate-100 hover:text-[#246392]"
      >
        <Pencil className="h-3.5 w-3.5 shrink-0" />
        <span>Edit</span>
      </ActionBtn>
      {canMove && onMove && (
        <ActionBtn
          label="Move"
          onClick={onMove}
          className="text-[#246392] hover:bg-[#eef6fc]"
        >
          <RefreshCw className="h-3.5 w-3.5 shrink-0" />
          <span>Move</span>
        </ActionBtn>
      )}
      <ActionBtn
        label={isActive ? 'Disable' : 'Enable'}
        onClick={onToggleStatus}
        className="text-slate-500 hover:bg-slate-100 hover:text-[#246392]"
      >
        {isActive ? (
          <ToggleRight className="h-3.5 w-3.5 shrink-0" />
        ) : (
          <ToggleLeft className="h-3.5 w-3.5 shrink-0" />
        )}
        <span>{isActive ? 'Disable' : 'Enable'}</span>
      </ActionBtn>
      <ActionBtn
        label="Delete"
        onClick={onDelete}
        className="text-rose-600 hover:bg-rose-50"
      >
        <Trash2 className="h-3.5 w-3.5 shrink-0" />
        <span>Delete</span>
      </ActionBtn>
    </div>
  )
}
