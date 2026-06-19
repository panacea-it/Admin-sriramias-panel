import { Copy, RefreshCw } from 'lucide-react'
import ViewButton from '../common/ViewButton'
import EditButton from '../common/EditButton'
import IconActionButton from '../common/IconActionButton'
import { recordStatusActionLabel } from '../../constants/recordStatus'
import { TABLE_ACTIONS_WRAP } from '../../utils/tableColumnHelpers'

export default function BatchTableActions({
  batch,
  onView,
  onEdit,
  onDuplicate,
  onStatusToggle,
  onDelete: _onDelete,
  disabled = false,
}) {
  const statusAction = recordStatusActionLabel(batch.status)
  const batchLabel = batch.batchName || batch.batchLabel || batch.displayName || 'batch'

  return (
    <div
      role="group"
      aria-label={`Actions for ${batchLabel}`}
      className={TABLE_ACTIONS_WRAP}
    >
      <ViewButton onClick={() => onView?.(batch)} disabled={disabled} />
      <EditButton onClick={() => onEdit?.(batch)} disabled={disabled} />
      <IconActionButton
        label="Duplicate"
        onClick={() => onDuplicate?.(batch)}
        disabled={disabled}
        className="text-[#555] hover:border-slate-200 hover:bg-slate-100 hover:text-[#246392] hover:shadow-sm"
      >
        <Copy className="h-[18px] w-[18px]" strokeWidth={2.25} aria-hidden="true" />
      </IconActionButton>
      <IconActionButton
        label={statusAction}
        onClick={() => onStatusToggle?.(batch)}
        disabled={disabled}
        className="text-[#246392] hover:border-[#cbeeff] hover:bg-[#eef2fc] hover:text-[#1a5276] hover:shadow-sm"
      >
        <RefreshCw className="h-[18px] w-[18px]" strokeWidth={2.25} aria-hidden="true" />
      </IconActionButton>
    </div>
  )
}
