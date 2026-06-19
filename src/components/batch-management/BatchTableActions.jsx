import { Ban, CheckCircle2, Copy, Eye, Pencil } from 'lucide-react'
import { cn } from '../../utils/cn'

const actionButtonClass =
  'inline-flex h-8 shrink-0 items-center justify-center gap-0.5 rounded-lg px-1.5 py-1.5 text-[11px] font-semibold transition whitespace-nowrap sm:gap-1 sm:px-2 sm:text-xs'

const DISABLED_STATUSES = new Set(['Deactivated', 'In Active', 'Archived', 'Cancelled'])

function ActionBtn({ label, onClick, disabled, className, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={label}
      aria-label={label}
      className={cn(
        actionButtonClass,
        'disabled:cursor-not-allowed disabled:opacity-60',
        className,
      )}
    >
      {children}
      <span>{label}</span>
    </button>
  )
}

export default function BatchTableActions({
  batch,
  onView,
  onEdit,
  onDuplicate,
  onStatusToggle,
  onDelete,
  disabled = false,
}) {
  const isInactive = DISABLED_STATUSES.has(batch.status)
  const statusLabel = isInactive ? 'Enable' : 'Disable'
  const batchLabel = batch.batchName || batch.batchLabel || batch.displayName || 'batch'

  return (
    <div
      role="group"
      aria-label={`Actions for ${batchLabel}`}
      className="flex w-max max-w-full flex-nowrap items-center justify-center gap-0.5 sm:gap-1"
    >
      </div>
  )
}
