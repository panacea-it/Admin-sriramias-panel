import { Loader2, RefreshCw, Trash2 } from 'lucide-react'
import { cn } from '../../utils/cn'
import ViewButton from '../common/ViewButton'
import EditButton from '../common/EditButton'
import IconActionButton from '../common/IconActionButton'
import { TABLE_ACTIONS_WRAP } from '../../utils/tableColumnHelpers'
import { recordStatusActionLabel } from '../../constants/recordStatus'

export default function ProductRowActions({
  name = 'product',
  status,
  apiStatus,
  loading = false,
  statusToggleLoading = false,
  onView,
  onEdit,
  onStatusToggle,
  onDelete,
}) {
  const isActive =
    status === 'active' || String(apiStatus || '').toUpperCase() === 'ACTIVE'
  const statusAction = recordStatusActionLabel(isActive ? 'Active' : 'In Active')

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
        disabled={loading || statusToggleLoading}
        className={cn(
          'text-[#246392] hover:border-[#cbeeff] hover:bg-[#eef2fc] hover:text-[#1a5276] hover:shadow-sm',
          (loading || statusToggleLoading) && 'opacity-60',
        )}
      >
        {statusToggleLoading ? (
          <Loader2 className="h-[18px] w-[18px] animate-spin" aria-hidden="true" />
        ) : (
          <RefreshCw className="h-[18px] w-[18px]" strokeWidth={2.25} aria-hidden="true" />
        )}
      </IconActionButton>
      {onDelete ? (
        <IconActionButton
          label={`Delete ${name}`}
          onClick={onDelete}
          disabled={loading || statusToggleLoading}
          className="text-rose-600 hover:border-rose-100 hover:bg-rose-50 hover:text-rose-700"
        >
          <Trash2 className="h-[18px] w-[18px]" strokeWidth={2.25} aria-hidden="true" />
        </IconActionButton>
      ) : null}
    </div>
  )
}
