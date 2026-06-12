import { cn } from '../../utils/cn'

const TONE_CLASS = {
  default: 'text-slate-500 hover:bg-slate-100 hover:text-[#246392]',
  accent: 'text-amber-700 hover:bg-amber-50',
  danger: 'text-rose-600 hover:bg-rose-50',
}

const BTN_BASE =
  'inline-flex h-8 w-8 items-center justify-center rounded-lg transition sm:h-auto sm:w-auto sm:gap-1 sm:px-2.5 sm:py-1.5 sm:text-[12px] sm:font-semibold'

/** Inline row actions — matches Center Management table action styling */
export default function FinanceTableRowActions({ actions = [], className }) {
  const visible = actions.filter((a) => a.show !== false)
  if (!visible.length) return null

  return (
    <div className={cn('flex flex-nowrap items-center justify-end gap-1 sm:gap-1.5', className)}>
      {visible.map((action) => {
        const Icon = action.icon
        return (
          <button
            key={action.label}
            type="button"
            onClick={action.onClick}
            title={action.label}
            aria-label={action.ariaLabel || action.label}
            disabled={action.disabled}
            className={cn(
              BTN_BASE,
              TONE_CLASS[action.variant || 'default'],
              action.disabled && 'pointer-events-none opacity-50',
            )}
          >
            {Icon ? <Icon className="h-3.5 w-3.5" strokeWidth={2.5} /> : null}
            <span className="hidden sm:inline">{action.label}</span>
          </button>
        )
      })}
    </div>
  )
}
