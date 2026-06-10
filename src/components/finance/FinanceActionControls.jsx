import { cn } from '../../utils/cn'

/**
 * Aligned action cluster for finance settings cards — icon buttons + toggle.
 */
export default function FinanceActionControls({ children, className, label = 'Actions' }) {
  return (
    <div
      role="group"
      aria-label={label}
      className={cn(
        'flex shrink-0 items-center justify-end gap-2',
        'rounded-lg bg-slate-50/80 px-2 py-1.5 ring-1 ring-inset ring-slate-200/80',
        'sm:gap-2.5 sm:px-2.5',
        className,
      )}
    >
      {children}
    </div>
  )
}
