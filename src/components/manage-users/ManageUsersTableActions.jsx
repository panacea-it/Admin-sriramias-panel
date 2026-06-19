import { Eye, Pencil, RefreshCw } from 'lucide-react'
import AdminTooltip from '../subjects/AdminTooltip'
import { isStudentRow } from '../../services/manageUsersService'
import { recordStatusActionLabel } from '../../constants/recordStatus'
import { cn } from '../../utils/cn'

function ActionButton({ title, onClick, disabled, className, children }) {
  return (
    <AdminTooltip label={title}>
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        aria-label={title}
        className={cn(
          'inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition',
          'disabled:cursor-not-allowed disabled:opacity-40',
          className,
        )}
      >
        {children}
      </button>
    </AdminTooltip>
  )
}

export default function ManageUsersTableActions({
  row,
  onView,
  onEdit,
  onStatusToggle,
  disabled = false,
}) {
  const isStudent = isStudentRow(row)
  const statusAction = recordStatusActionLabel(row.status)

  const showView = row.permissions?.canView !== false
  const showEdit = isStudent ? row.permissions?.canEdit : true
  const showStatusToggle = true

  const editTitle = showEdit ? 'Edit' : row.editDisabledReason || 'Edit not allowed'

  return (
    <div className="flex items-center justify-center gap-1.5">
      {showView ? (
        <ActionButton
          title="View"
          onClick={onView}
          disabled={disabled}
          className="bg-[#EEF5FF] text-[#1D72B8] hover:bg-[#4CA6E8]/20 hover:text-[#07133F]"
        >
          <Eye className="h-4 w-4" strokeWidth={2} aria-hidden />
        </ActionButton>
      ) : null}
      {showEdit ? (
        <ActionButton
          title={editTitle}
          onClick={onEdit}
          disabled={disabled}
          className="bg-[#1D72B8]/10 text-[#1D72B8] hover:bg-[#1D72B8] hover:text-white"
        >
          <Pencil className="h-4 w-4" strokeWidth={2} aria-hidden />
        </ActionButton>
      ) : (
        <ActionButton
          title={editTitle}
          onClick={() => {}}
          disabled
          className="bg-[#1D72B8]/10 text-[#1D72B8]"
        >
          <Pencil className="h-4 w-4" strokeWidth={2} aria-hidden />
        </ActionButton>
      )}
      {showStatusToggle ? (
        <ActionButton
          title={statusAction}
          onClick={onStatusToggle}
          disabled={disabled}
          className="bg-orange-50 text-orange-600 hover:bg-orange-100 hover:text-orange-700"
        >
          <RefreshCw className="h-4 w-4" strokeWidth={2} aria-hidden />
        </ActionButton>
      ) : null}
    </div>
  )
}
