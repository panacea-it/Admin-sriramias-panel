import { Plus, RefreshCw } from 'lucide-react'
import { cn } from '../../utils/cn'
import ViewButton from '../common/ViewButton'
import EditButton from '../common/EditButton'
import IconActionButton from '../common/IconActionButton'
import { recordStatusActionLabel } from '../../constants/recordStatus'
import { TABLE_ACTIONS_WRAP } from '../../utils/tableColumnHelpers'

export default function FacultySubjectTableActions({
  row,
  onView,
  onEdit,
  onManageContent,
  onStatusToggle,
  onDelete: _onDelete,
  statusLoading = false,
  canMutate = true,
}) {
  const statusAction = recordStatusActionLabel(row.status)
  const rowLabel = row.subjectName || row.name || 'subject'

  return (
    <div
      role="group"
      aria-label={`Actions for ${rowLabel}`}
      className={TABLE_ACTIONS_WRAP}
    >
      <ViewButton onClick={onView} />
      {canMutate && onEdit && <EditButton onClick={onEdit} />}
      <IconActionButton
        label="Manage Content"
        onClick={onManageContent}
        className="text-[#555] hover:border-slate-200 hover:bg-slate-100 hover:text-[#246392] hover:shadow-sm"
      >
        <Plus className="h-[18px] w-[18px]" strokeWidth={2.25} aria-hidden="true" />
      </IconActionButton>
      {canMutate && onStatusToggle && (
        <IconActionButton
          label={statusAction}
          onClick={onStatusToggle}
          disabled={statusLoading}
          className="text-[#246392] hover:border-[#cbeeff] hover:bg-[#eef2fc] hover:text-[#1a5276] hover:shadow-sm"
        >
          <RefreshCw className="h-[18px] w-[18px]" strokeWidth={2.25} aria-hidden="true" />
        </IconActionButton>
      )}
    </div>
  )
}
