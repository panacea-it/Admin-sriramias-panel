import { Loader2 } from 'lucide-react'
import { cn } from '../../utils/cn'

const VARIANT_STYLES = {
  display: {
    active: 'bg-[#55ace7]',
    spinner: 'text-[#55ace7]',
  },
  top10: {
    active: 'bg-amber-500',
    spinner: 'text-amber-500',
  },
}

export default function TopperTableToggle({
  checked,
  disabled = false,
  loading = false,
  onChange,
  ariaLabelOn,
  ariaLabelOff,
  variant = 'display',
}) {
  const styles = VARIANT_STYLES[variant] ?? VARIANT_STYLES.display

  return (
    <div className="flex items-center justify-center gap-2">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={checked ? ariaLabelOn : ariaLabelOff}
        disabled={disabled || loading}
        onClick={(event) => {
          event.stopPropagation()
          onChange?.()
        }}
        className={cn(
          'relative inline-flex h-7 w-12 shrink-0 rounded-full transition-colors duration-200',
          checked ? styles.active : 'bg-[#cbd5e1]',
          (disabled || loading) && 'cursor-not-allowed opacity-60',
        )}
      >
        <span
          className={cn(
            'pointer-events-none absolute top-0.5 left-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform duration-200',
            checked ? 'translate-x-5' : 'translate-x-0',
          )}
        />
      </button>
      {loading ? (
        <Loader2
          className={cn('h-4 w-4 shrink-0 animate-spin', styles.spinner)}
          aria-hidden
        />
      ) : null}
    </div>
  )
}
