import { cn } from '../../utils/cn'

/**
 * Finance-grade toggle — padding-inset track keeps thumb inside bounds.
 */
export default function FinanceToggleSwitch({
  checked = false,
  onChange,
  disabled = false,
  id,
  'aria-label': ariaLabel,
  size = 'md',
  className,
}) {
  const sizes = {
    sm: {
      track: 'h-5 w-9 p-0.5',
      thumb: 'h-4 w-4',
      on: 'translate-x-4',
      off: 'translate-x-0',
    },
    md: {
      track: 'h-6 w-11 p-0.5',
      thumb: 'h-5 w-5',
      on: 'translate-x-5',
      off: 'translate-x-0',
    },
  }
  const s = sizes[size] || sizes.md

  return (
    <button
      type="button"
      role="switch"
      id={id}
      aria-checked={checked}
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={() => onChange?.(!checked)}
      className={cn(
        'relative inline-flex shrink-0 items-center rounded-full transition-colors duration-200',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#55ace7] focus-visible:ring-offset-2',
        'disabled:cursor-not-allowed disabled:opacity-50',
        s.track,
        checked ? 'bg-[#246392]' : 'bg-slate-300',
        className,
      )}
    >
      <span
        className={cn(
          'block rounded-full bg-white shadow-sm transition-transform duration-200 ease-out',
          s.thumb,
          checked ? s.on : s.off,
        )}
      />
    </button>
  )
}
