import { Ban, CheckCircle2 } from 'lucide-react'
import ViewButton from '../../../../components/common/ViewButton'
import EditButton from '../../../../components/common/EditButton'
import IconActionButton from '../../../../components/common/IconActionButton'
import { isRecordStatusActive, recordStatusActionLabel } from '../../../../constants/recordStatus'
import { TABLE_ACTIONS_WRAP_CENTER } from '../../../../utils/tableColumnHelpers'
import { cn } from '../../../../utils/cn'

export default function ClassTableActions({ row, onView, onEdit, onToggleStatus }) {
  const isActive = isRecordStatusActive(row.status)
  const statusAction = recordStatusActionLabel(row.status)
  const rowLabel = row.name || 'class'

  return (
    <div className={TABLE_ACTIONS_WRAP_CENTER}>
      <ViewButton onClick={() => onView?.(row)} label={`View ${rowLabel}`} />
      <EditButton onClick={() => onEdit?.(row)} label={`Edit ${rowLabel}`} />
      <IconActionButton
        label={`${statusAction} ${rowLabel}`}
        onClick={() => onToggleStatus?.(row)}
        className={cn(
          isActive
            ? 'text-rose-600 hover:border-rose-100 hover:bg-rose-50 hover:text-rose-700'
            : 'text-emerald-600 hover:border-emerald-100 hover:bg-emerald-50 hover:text-emerald-700',
        )}
      >
        {isActive ? (
          <Ban className="h-[18px] w-[18px]" strokeWidth={2.25} aria-hidden />
        ) : (
          <CheckCircle2 className="h-[18px] w-[18px]" strokeWidth={2.25} aria-hidden />
        )}
      </IconActionButton>
    </div>
  )
}
