import { RefreshCw } from 'lucide-react'
import { cn } from '../../../utils/cn'
import ViewButton from '../../common/ViewButton'
import EditButton from '../../common/EditButton'
import IconActionButton from '../../common/IconActionButton'
import { recordStatusActionLabel } from '../../../constants/recordStatus'

export default function RoleTableActions({
  row,
  onView,
  onEdit,
  onStatusToggle,
  onDelete: _onDelete,
  canToggle = true,
  canDelete: _canDelete = true,
}) {
  const statusAction = recordStatusActionLabel(row.status)

  return (
    <div className="flex flex-nowrap items-center justify-center gap-1.5">
      <ViewButton onClick={onView} />
      <EditButton onClick={onEdit} />
      <IconActionButton
        label={statusAction}
        onClick={onStatusToggle}
        disabled={!canToggle}
        className={cn(
          'text-[#246392] hover:border-[#cbeeff] hover:bg-[#eef2fc] hover:text-[#1a5276] hover:shadow-sm',
          !canToggle && 'cursor-not-allowed opacity-40',
        )}
      >
        <RefreshCw className="h-[18px] w-[18px]" strokeWidth={2.25} aria-hidden="true" />
      </IconActionButton>
    </div>
  )
}
