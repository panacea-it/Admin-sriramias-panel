import { RefreshCw } from 'lucide-react'
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
  onDelete: _onDelete,
}) {
  const statusAction = recordStatusActionLabel(status)

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
    </div>
  )
}
