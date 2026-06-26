import { Ban, Eye, Pencil, RefreshCw, UserCheck } from 'lucide-react'
import { cn } from '../../utils/cn'
import { isStudentEnrollmentActive } from './studentStatusDisplay'

const actionBase =
  'inline-flex h-[34px] min-w-[72px] shrink-0 items-center justify-center gap-1.5 rounded-[10px] px-2.5 text-[11px] font-semibold transition-all duration-200 hover:-translate-y-px hover:shadow-md active:translate-y-0 active:shadow-sm disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-none sm:min-w-[76px] sm:px-3 sm:text-xs'

const ACTION_STYLES = {
  view: 'bg-[#eef6fc] text-[#246392] hover:bg-[#dbeef9] ring-1 ring-[#55ace7]/12',
  edit: 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100 ring-1 ring-indigo-200/60',
  disable: 'bg-orange-50 text-orange-700 hover:bg-orange-100 ring-1 ring-orange-200/60',
  enable: 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 ring-1 ring-emerald-200/60',
  move: 'bg-sky-50 text-[#1a5276] hover:bg-sky-100 ring-1 ring-sky-200/60',
}

function ActionBtn({ label, onClick, disabled, tone, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={label}
      aria-label={label}
      className={cn(actionBase, ACTION_STYLES[tone])}
    >
      {children}
      <span className="whitespace-nowrap">{label}</span>
    </button>
  )
}

export default function StudentTableActions({
  studentName = 'student',
  status,
  onView,
  onEdit,
  onDisable,
  onEnable,
  onMove,
  canMove = true,
  disabled = false,
}) {
  const isActive = isStudentEnrollmentActive(status)

  return (
    <div
      role="group"
      aria-label={`Actions for ${studentName}`}
      className="inline-flex max-w-full flex-nowrap items-center justify-end gap-1.5"
    >
      {onView && (
        <ActionBtn label="View" onClick={onView} disabled={disabled} tone="view">
          <Eye className="h-3.5 w-3.5 shrink-0" strokeWidth={2.25} />
        </ActionBtn>
      )}
      {onEdit && (
        <ActionBtn label="Edit" onClick={onEdit} disabled={disabled} tone="edit">
          <Pencil className="h-3.5 w-3.5 shrink-0" strokeWidth={2.25} />
        </ActionBtn>
      )}
      {isActive && onDisable ? (
        <ActionBtn label="Disable" onClick={onDisable} disabled={disabled} tone="disable">
          <Ban className="h-3.5 w-3.5 shrink-0" strokeWidth={2.25} />
        </ActionBtn>
      ) : !isActive && onEnable ? (
        <ActionBtn label="Enable" onClick={onEnable} disabled={disabled} tone="enable">
          <UserCheck className="h-3.5 w-3.5 shrink-0" strokeWidth={2.25} />
        </ActionBtn>
      ) : null}
      {canMove && onMove && (
        <ActionBtn label="Move" onClick={onMove} disabled={disabled} tone="move">
          <RefreshCw className="h-3.5 w-3.5 shrink-0" strokeWidth={2.25} />
        </ActionBtn>
      )}
    </div>
  )
}
