import { RefreshCw } from 'lucide-react'
import { cn } from '../../../utils/cn'
import ViewButton from '../../common/ViewButton'
import EditButton from '../../common/EditButton'
import IconActionButton from '../../common/IconActionButton'
import { recordStatusActionLabel } from '../../../constants/recordStatus'

export default function RecommendationRowActions({
  label = 'rule',
  status,
  onView,
  onEdit,
  onStatusToggle,
  onDelete: _onDelete,
}) {
  const statusAction = recordStatusActionLabel(status === 'active' ? 'Active' : 'In Active')

  return (
    <div
      role="group"
      aria-label={`Actions for ${label}`}
      className="flex flex-nowrap items-center justify-end gap-1 sm:gap-1.5"
    >
      <ViewButton onClick={onView} />
      <EditButton onClick={onEdit} />
      <IconActionButton
        label={statusAction}
        onClick={onStatusToggle}
        className="text-[#246392] hover:border-[#cbeeff] hover:bg-[#eef2fc] hover:text-[#1a5276] hover:shadow-sm"
      >
        <RefreshCw className="h-[18px] w-[18px]" strokeWidth={2.25} aria-hidden="true" />
      </IconActionButton>
    </div>
  )
}
