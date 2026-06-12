import { Ban, Copy, Eye, Pencil } from 'lucide-react'
import { cn } from '../../utils/cn'

const actionButtonClass =
  'inline-flex h-8 min-w-[2rem] shrink-0 items-center justify-center gap-1 rounded-lg px-2 py-1.5 text-[12px] font-semibold transition sm:min-w-0 sm:px-2.5'

const DISABLED_STATUSES = new Set(['Inactive', 'In Active', 'Archived', 'Cancelled'])

export default function BatchTableActions({
  batch,
  onView,
  onEdit,
  onDuplicate,
  onStatusToggle,
}) {
  const isDisabled = DISABLED_STATUSES.has(batch.status)
  const statusLabel = isDisabled ? 'Enable' : 'Disable'

  return (
    <div className="flex flex-nowrap items-center justify-end gap-1 sm:gap-1.5">
      <button
        type="button"
        onClick={() => onView?.(batch)}
        title="View"
        aria-label={`View ${batch.displayName || 'batch'}`}
        className={cn(actionButtonClass, 'text-slate-500 hover:bg-slate-100 hover:text-[#246392]')}
      >
        <Eye className="h-3.5 w-3.5 shrink-0" />
        <span className="hidden sm:inline">View</span>
      </button>
      <button
        type="button"
        onClick={() => onEdit?.(batch)}
        title="Edit"
        aria-label={`Edit ${batch.displayName || 'batch'}`}
        className={cn(actionButtonClass, 'text-slate-500 hover:bg-slate-100 hover:text-[#246392]')}
      >
        <Pencil className="h-3.5 w-3.5 shrink-0" />
        <span className="hidden sm:inline">Edit</span>
      </button>
      <button
        type="button"
        onClick={() => onDuplicate?.(batch)}
        title="Duplicate"
        aria-label={`Duplicate ${batch.displayName || 'batch'}`}
        className={cn(actionButtonClass, 'text-slate-500 hover:bg-slate-100 hover:text-[#246392]')}
      >
        <Copy className="h-3.5 w-3.5 shrink-0" />
        <span className="hidden sm:inline">Duplicate</span>
      </button>
      <button
        type="button"
        onClick={() => onStatusToggle?.(batch)}
        title={statusLabel}
        aria-label={`${statusLabel} ${batch.displayName || 'batch'}`}
        className={cn(actionButtonClass, 'text-amber-700 hover:bg-amber-50')}
      >
        <Ban className="h-3.5 w-3.5 shrink-0" />
        <span className="hidden sm:inline">{statusLabel}</span>
      </button>
    </div>
  )
}
