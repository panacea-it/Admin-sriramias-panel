import { RefreshCw } from 'lucide-react'
import ViewButton from '../common/ViewButton'
import EditButton from '../common/EditButton'
import IconActionButton from '../common/IconActionButton'
import { isStudentRow } from '../../services/manageUsersService'
import { recordStatusActionLabel } from '../../constants/recordStatus'
import { cn } from '../../utils/cn'
import { TABLE_ACTIONS_WRAP } from '../../utils/tableColumnHelpers'

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
    <div className={TABLE_ACTIONS_WRAP}>
      {showView ? (
        <ViewButton onClick={onView} label="View" disabled={disabled} />
      ) : null}
      {showEdit ? (
        <EditButton onClick={onEdit} label={editTitle} disabled={disabled} />
      ) : (
        <EditButton onClick={() => {}} label={editTitle} disabled />
      )}
      {showStatusToggle ? (
        <IconActionButton
          label={statusAction}
          onClick={onStatusToggle}
          disabled={disabled}
          className={cn(
            'text-orange-600 hover:border-orange-100 hover:bg-orange-50 hover:text-orange-700',
          )}
        >
          <RefreshCw className="h-[18px] w-[18px]" strokeWidth={2.25} aria-hidden />
        </IconActionButton>
      ) : null}
    </div>
  )
}
