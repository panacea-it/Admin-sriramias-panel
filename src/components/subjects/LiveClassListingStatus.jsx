import { cn } from '../../utils/cn'
import AdminTooltip from './AdminTooltip'

export default function LiveClassListingStatus({ status, onChange, disabled = false }) {
  const active = status === 'Active'

  const handleToggle = () => {
    if (disabled) return
    onChange?.(active ? 'In Active' : 'Active')
  }

  return (
    <AdminTooltip label={active ? 'Click to deactivate' : 'Click to activate'}>
      <button
        type="button"
        role="switch"
        aria-checked={active}
        aria-label={active ? 'Active — click to deactivate' : 'Inactive — click to activate'}
        disabled={disabled}
        onClick={handleToggle}
        className={cn(
          'inline-flex items-center gap-2 rounded-full border px-2.5 py-1 transition-all duration-200',
          'hover:scale-[1.02] active:scale-[0.98]',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#55ace7]/40 focus-visible:ring-offset-1',
          active
            ? 'border-emerald-200/80 bg-emerald-50/90 text-emerald-800 shadow-sm'
            : 'border-amber-200/80 bg-amber-50/90 text-amber-800 shadow-sm',
          disabled && 'cursor-not-allowed opacity-60 hover:scale-100',
        )}
      >
        <span
          className={cn(
            'h-2 w-2 shrink-0 rounded-full transition-colors duration-200',
            active ? 'bg-emerald-500 shadow-[0_0_0_3px_rgba(16,185,129,0.2)]' : 'bg-amber-500 shadow-[0_0_0_3px_rgba(245,158,11,0.15)]',
          )}
        />
        <span className="text-[11px] font-bold tracking-wide">
          {active ? 'Active' : 'Deactivated'}
        </span>
        <span
          className={cn(
            'relative ml-0.5 inline-flex h-4 w-7 shrink-0 rounded-full transition-colors duration-200',
            active ? 'bg-emerald-400/80' : 'bg-slate-300',
          )}
        >
          <span
            className={cn(
              'absolute top-0.5 left-0.5 h-3 w-3 rounded-full bg-white shadow transition-transform duration-200',
              active ? 'translate-x-3' : 'translate-x-0',
            )}
          />
        </span>
      </button>
    </AdminTooltip>
  )
}
