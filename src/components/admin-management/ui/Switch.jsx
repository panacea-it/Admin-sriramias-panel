import { cn } from '../../../utils/cn'

export default function Switch({ checked, onChange, label, description, id, disabled, relaxed }) {
  return (
    <label
      htmlFor={id}
      className={cn(
        'flex cursor-pointer items-start justify-between gap-4 rounded-xl border border-slate-200/80 bg-white/60 px-4 py-3 backdrop-blur-sm transition hover:border-violet-200/80',
        relaxed &&
          'gap-5 px-5 py-4 sm:px-6 sm:py-[1.125rem]',
        disabled && 'cursor-not-allowed opacity-60',
      )}
    >
      <div className="min-w-0">
        {label && (
          <span
            className={cn(
              'block font-medium text-slate-800',
              relaxed ? 'text-[15px] leading-snug' : 'text-sm',
            )}
          >
            {label}
          </span>
        )}
        {description && (
          <span
            className={cn(
              'mt-1 block text-slate-500',
              relaxed ? 'text-[13px] leading-snug' : 'mt-0.5 text-xs',
            )}
          >
            {description}
          </span>
        )}
      </div>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange?.(!checked)}
        className={cn(
          'relative h-6 w-11 shrink-0 rounded-full transition-colors duration-200',
          checked ? 'bg-violet-600' : 'bg-slate-300',
        )}
      >
        <span
          className={cn(
            'absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform duration-200',
            checked && 'translate-x-5',
          )}
        />
      </button>
    </label>
  )
}
