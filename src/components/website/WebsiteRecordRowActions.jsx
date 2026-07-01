import { RefreshCw } from 'lucide-react'
import EditButton from '../common/EditButton'
import ViewButton from '../common/ViewButton'
import IconActionButton from '../common/IconActionButton'
import { recordStatusActionLabel } from '../../constants/recordStatus'
import { TABLE_ACTIONS_WRAP } from '../../utils/tableColumnHelpers'

export default function WebsiteRecordRowActions({
  rowName = 'record',
  status,
  onView,
  onEdit,
  onStatusToggle,
  statusLoading = false,
}) {
  const statusAction = recordStatusActionLabel(status)

  return (
    <div
      role="group"
      aria-label={`Actions for ${rowName}`}
      className={TABLE_ACTIONS_WRAP}
    >
      <ViewButton onClick={onView} label={`View ${rowName}`} />
      <EditButton onClick={onEdit} label={`Edit ${rowName}`} />
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
