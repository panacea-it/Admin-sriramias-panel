import { cn } from '../../utils/cn'
import { normalizeBatchUiStatus } from '../../utils/batchOperations'

export const BATCH_STATUS_STYLES = {
  Active:
    'bg-emerald-500 text-white shadow-[0_2px_8px_rgba(16,185,129,0.28)]',
  Inactive:
    'bg-amber-500 text-white shadow-[0_2px_8px_rgba(245,158,11,0.28)]',
}

const BATCH_STATUS_HOVER = {
  Active: 'hover:bg-emerald-600',
  Inactive: 'hover:bg-amber-600',
}

export default function BatchStatusBadge({
  status,
  className,
  interactive = false,
  onClick,
}) {
  const normalized = normalizeBatchUiStatus(status)
  const Tag = interactive ? 'button' : 'span'

  return (
    <Tag
      type={interactive ? 'button' : undefined}
      onClick={interactive ? onClick : undefined}
      className={cn(
        'inline-flex h-9 min-w-[5.75rem] max-w-full items-center justify-center rounded-[9px] px-4 text-xs font-bold uppercase tracking-wide whitespace-nowrap',
        BATCH_STATUS_STYLES[normalized] ?? BATCH_STATUS_STYLES.Active,
        interactive && [
          'cursor-pointer transition-all duration-200',
          BATCH_STATUS_HOVER[normalized],
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-[#55ace7]/60',
        ],
        !interactive && 'pointer-events-none select-none',
        className,
      )}
    >
      {normalized}
    </Tag>
  )
}
