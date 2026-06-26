import { RefreshCw, Trash2 } from 'lucide-react'
import ViewButton from '../common/ViewButton'
import EditButton from '../common/EditButton'
import IconActionButton from '../common/IconActionButton'
import { recordStatusActionLabel } from '../../constants/recordStatus'

export default function CourseTableActions({
  row,
  status,
  onView,
  onEdit,
  onToggleStatus,
  onDelete,
}) {
  const statusAction = recordStatusActionLabel(status ?? row?.status)

  return (
    <div className="flex flex-nowrap items-center justify-end gap-1 sm:gap-1.5">
      <ViewButton onClick={onView} />
      <EditButton onClick={onEdit} />
      <IconActionButton
        label={statusAction}
        onClick={onToggleStatus}
        className="text-[#246392] hover:border-[#cbeeff] hover:bg-[#eef2fc] hover:text-[#1a5276] hover:shadow-sm"
      >
        <RefreshCw className="h-[18px] w-[18px]" strokeWidth={2.25} aria-hidden="true" />
      </IconActionButton>
      {onDelete ? (
        <IconActionButton
          label={`Delete ${row?.name || 'course'}`}
          onClick={onDelete}
          className="text-rose-600 hover:border-rose-100 hover:bg-rose-50 hover:text-rose-700"
        >
          <Trash2 className="h-[18px] w-[18px]" strokeWidth={2.25} aria-hidden="true" />
        </IconActionButton>
      ) : null}
    </div>
  )
}
