import { RefreshCw } from 'lucide-react'
import { cn } from '../../utils/cn'
import ViewButton from '../common/ViewButton'
import EditButton from '../common/EditButton'
import IconActionButton from '../common/IconActionButton'
import { TABLE_ACTIONS_WRAP } from '../../utils/tableColumnHelpers'
import { recordStatusActionLabel } from '../../constants/recordStatus'

export default function ProductRowActions({
  name = 'product',
  status,
  loading = false,
  onView,
  onEdit,
  onStatusToggle,
  onDelete: _onDelete,
}) {
  const statusAction = recordStatusActionLabel(status === 'active' ? 'Active' : 'In Active')

  return (
    <div
      role="group"
      aria-label={`Actions for ${name}`}
      className={TABLE_ACTIONS_WRAP}
    >
      <ViewButton onClick={onView} disabled={loading} />
      <EditButton onClick={onEdit} disabled={loading} />
      <IconActionButton
        label={statusAction}
        onClick={onStatusToggle}
        disabled={loading}
        className={cn(
          'text-[#246392] hover:border-[#cbeeff] hover:bg-[#eef2fc] hover:text-[#1a5276] hover:shadow-sm',
          loading && 'opacity-60',
        )}
      >
        <RefreshCw className="h-[18px] w-[18px]" strokeWidth={2.25} aria-hidden="true" />
      </IconActionButton>
    </div>
  )
}
