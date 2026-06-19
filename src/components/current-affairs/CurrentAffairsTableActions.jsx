import { RefreshCw } from 'lucide-react'
import { TABLE_ACTIONS_WRAP } from '../../utils/tableColumnHelpers'
import ViewButton from '../common/ViewButton'
import EditButton from '../common/EditButton'
import IconActionButton from '../common/IconActionButton'
import { recordStatusActionLabel } from '../../constants/recordStatus'

export default function CurrentAffairsTableActions({
  row,
  onView,
  onEdit,
  onStatusToggle,
  onDelete: _onDelete,
  statusLoading = false,
}) {
  const statusAction = recordStatusActionLabel(row.status)

  return (
    <div
      role="group"
      aria-label={`Actions for ${row.name}`}
      className={TABLE_ACTIONS_WRAP}
    >
      <ViewButton onClick={onView} />
      <EditButton onClick={onEdit} />
      <IconActionButton
        label={statusAction}
        onClick={onStatusToggle}
        disabled={statusLoading}
        className="text-[#246392] hover:border-[#cbeeff] hover:bg-[#eef2fc] hover:text-[#1a5276] hover:shadow-sm"
      >
        <RefreshCw className="h-[18px] w-[18px]" strokeWidth={2.25} aria-hidden="true" />
      </IconActionButton>
    </div>
  )
}
