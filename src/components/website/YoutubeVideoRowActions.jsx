import { Ban } from 'lucide-react'
import EditButton from '../common/EditButton'
import IconActionButton from '../common/IconActionButton'
import ViewButton from '../common/ViewButton'
import { TABLE_ACTIONS_WRAP } from '../../utils/tableColumnHelpers'

export default function YoutubeVideoRowActions({
  rowName = 'video',
  status,
  onView,
  onEdit,
  onStatusChange,
}) {
  const isActive = status === 'Active'

  return (
    <div
      role="group"
      aria-label={`Actions for ${rowName}`}
      className={TABLE_ACTIONS_WRAP}
    >
      <ViewButton onClick={onView} label={`View ${rowName}`} />
      <EditButton onClick={onEdit} label={`Edit ${rowName}`} />

      <IconActionButton
        label={isActive ? `Deactivate ${rowName}` : `Activate ${rowName}`}
        onClick={() => onStatusChange?.(isActive ? 'Deactivated' : 'Active')}
        className="text-amber-700 hover:border-amber-100 hover:bg-amber-50 hover:text-amber-800"
      >
        <Ban className="h-[18px] w-[18px]" strokeWidth={2.25} aria-hidden />
      </IconActionButton>
    </div>
  )
}
