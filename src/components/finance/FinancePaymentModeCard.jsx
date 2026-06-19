import { Pencil, X } from 'lucide-react'
import FinanceCategoryBadge from './FinanceCategoryBadge'
import FinanceToggleSwitch from './FinanceToggleSwitch'
import FinanceIconButton from './FinanceIconButton'
import FinanceActionControls from './FinanceActionControls'
import { PaymentModeIcon } from './FinancePaymentModeCard.icons'
import { formatCategoryDateTime } from '../../utils/formatDateTime'
import { cn } from '../../utils/cn'

export { PaymentModeIcon } from './FinancePaymentModeCard.icons'

export default function FinancePaymentModeCard({
  mode,
  onToggle,
  onEdit,
  onDelete,
  canDelete = false,
}) {
  const updatedLabel = mode.lastUpdated ? formatCategoryDateTime(mode.lastUpdated) : '—'
  const hasActions = onEdit || onToggle || (canDelete && onDelete)

  return (
    <article
      className={cn(
        'grid gap-3 rounded-xl border bg-white p-3 transition sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:gap-4 sm:p-3.5',
        mode.enabled
          ? 'border-[#55ace7]/25 shadow-sm hover:border-[#55ace7]/40 hover:shadow-md'
          : 'border-slate-200 bg-slate-50/60',
      )}
    >
      <div className="flex min-w-0 items-start gap-2.5 sm:items-center">
        <PaymentModeIcon icon={mode.icon} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <p className="truncate text-sm font-semibold text-[#111111]">{mode.label}</p>
            <FinanceCategoryBadge category={mode.category} />
            <span
              className={cn(
                'inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase',
                mode.enabled ? 'bg-[#69df66]/15 text-[#1a3a5c]' : 'bg-slate-200 text-slate-600',
              )}
            >
              {mode.enabled ? 'Active' : 'Deactivated'}
            </span>
          </div>
          {mode.description ? (
            <p className="mt-0.5 line-clamp-2 text-xs text-[#686868] sm:line-clamp-1">{mode.description}</p>
          ) : null}
          <p className="mt-1 text-[10px] tabular-nums text-[#9ca0a8]">Updated {updatedLabel}</p>
        </div>
      </div>

      {hasActions ? (
        <FinanceActionControls label={`Actions for ${mode.label}`} className="w-full sm:w-auto">
          {onEdit ? (
            <FinanceIconButton icon={Pencil} label={`Edit ${mode.label}`} onClick={() => onEdit(mode)} />
          ) : null}
          {canDelete && onDelete ? (
            <FinanceIconButton
              icon={X}
              label={`Remove ${mode.label}`}
              variant="danger"
              onClick={() => onDelete(mode)}
            />
          ) : null}
          {onToggle ? (
            <div className="flex h-9 items-center pl-0.5 sm:pl-1">
              <FinanceToggleSwitch
                checked={mode.enabled}
                onChange={() => onToggle(mode)}
                aria-label={`Toggle ${mode.label}`}
                size="md"
              />
            </div>
          ) : null}
        </FinanceActionControls>
      ) : null}
    </article>
  )
}
