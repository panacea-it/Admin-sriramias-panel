import { Eye, Pencil, RefreshCw, ToggleLeft, ToggleRight, Trash2 } from 'lucide-react'
import { cn } from '../../utils/cn'
import { isStudentEnrollmentActive } from './studentStatusDisplay'

const actionButtonClass =
  'inline-flex h-8 shrink-0 items-center justify-center gap-0.5 rounded-lg px-1.5 py-1.5 text-[11px] font-semibold transition whitespace-nowrap sm:gap-1 sm:px-2 sm:text-xs'

function ActionBtn({ label, onClick, disabled, className, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={label}
      aria-label={label}
      className={cn(
        actionButtonClass,
        'disabled:cursor-not-allowed disabled:opacity-60',
        className,
      )}
    >
      {children}
      <span>{label}</span>
    </button>
  )
}

export default function StudentTableActions({
  studentName = 'student',
  status,
  onView,
  onEdit,
  onDelete,
  onMove,
  onToggleStatus,
  canMove = true,
  disabled = false,
}) {
  const isActive = isStudentEnrollmentActive(status)

  return (
    <div
      role="group"
      aria-label={`Actions for ${studentName}`}
      className="flex w-max max-w-full flex-nowrap items-center justify-center gap-0.5 sm:gap-1"
    >
      <ActionBtn
        label="View"
        onClick={onView}
        disabled={disabled}
        className="text-slate-500 hover:bg-slate-100 hover:text-[#246392]"
      >
        <Eye className="h-3.5 w-3.5 shrink-0" />
      </ActionBtn>
      <ActionBtn
        label="Edit"
        onClick={onEdit}
        disabled={disabled}
        className="text-slate-500 hover:bg-slate-100 hover:text-[#246392]"
      >
        <Pencil className="h-3.5 w-3.5 shrink-0" />
      </ActionBtn>
      <ActionBtn
        label="Delete"
        onClick={onDelete}
        disabled={disabled}
        className="text-[#c96565] hover:bg-red-50 hover:text-[#b94b4b]"
      >
        <Trash2 className="h-3.5 w-3.5 shrink-0" />
      </ActionBtn>
      {canMove && onMove && (
        <ActionBtn
          label="Move"
          onClick={onMove}
          disabled={disabled}
          className="text-slate-500 hover:bg-slate-100 hover:text-[#246392]"
        >
          <RefreshCw className="h-3.5 w-3.5 shrink-0" />
        </ActionBtn>
      )}
      {onToggleStatus && (
        <ActionBtn
          label={isActive ? 'Disable' : 'Enable'}
          onClick={onToggleStatus}
          disabled={disabled}
          className="text-slate-500 hover:bg-slate-100 hover:text-[#246392]"
        >
          {isActive ? (
            <ToggleRight className="h-3.5 w-3.5 shrink-0" />
          ) : (
            <ToggleLeft className="h-3.5 w-3.5 shrink-0" />
          )}
        </ActionBtn>
      )}
    </div>
  )
}
