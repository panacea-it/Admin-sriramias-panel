import { Eye, Pencil, RefreshCw } from 'lucide-react'
import IconActionButton from '../common/IconActionButton'
import { isRecordStatusActive, recordStatusActionLabel } from '../../constants/recordStatus'
import { cn } from '../../utils/cn'

export default function CategoryTableActions({
  status,
  onView,
  onEdit,
  onToggleStatus,
  compact = false,
  statusLabel: statusLabelOverride,
  /** @deprecated Use icon-only default. Kept for API compat — always renders icons. */
  variant = 'icons',
}) {
  const isActive = isRecordStatusActive(status)
  const statusLabel = statusLabelOverride ?? recordStatusActionLabel(status)

  return (
    <div
      role="group"
      aria-label="Row actions"
      className={cn(
        'inline-flex items-center justify-end gap-1 sm:gap-1.5',
        compact && 'gap-0.5',
      )}
    >
      <IconActionButton
        label="View"
        onClick={onView}
        className="text-[#555] hover:border-slate-200 hover:bg-slate-100 hover:text-[#246392] hover:shadow-sm"
      >
        <Eye className="h-[18px] w-[18px]" strokeWidth={2.25} aria-hidden="true" />
      </IconActionButton>
      <IconActionButton
        label="Edit"
        onClick={onEdit}
        className="text-[#555] hover:border-slate-200 hover:bg-slate-100 hover:text-[#246392] hover:shadow-sm"
      >
        <Pencil className="h-[18px] w-[18px]" strokeWidth={2.25} aria-hidden="true" />
      </IconActionButton>
      <IconActionButton
        label={statusLabel}
        onClick={onToggleStatus}
        className="text-[#246392] hover:border-[#cbeeff] hover:bg-[#eef2fc] hover:text-[#1a5276] hover:shadow-sm"
      >
        <RefreshCw className="h-[18px] w-[18px]" strokeWidth={2.25} aria-hidden="true" />
      </IconActionButton>
    </div>
  )
}
