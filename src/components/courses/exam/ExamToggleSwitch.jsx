import { cn } from '../../../utils/cn'

/** Accessible toggle — switch and label are siblings (avoids overlap/wrap bugs). */
export default function ExamToggleSwitch({
  checked,
  onChange,
  label,
  description,
  disabled = false,
  id,
}) {
  const switchId = id || `toggle-${label?.slice(0, 12)?.replace(/\s/g, '-')}`

  return (
    <div className="flex w-full items-start gap-3 sm:items-center sm:gap-4">
      <button
        id={switchId}
        type="button"
        role="switch"
        aria-checked={checked}
        aria-labelledby={`${switchId}-label`}
        disabled={disabled}
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          onChange(!checked)
        }}
        className={cn(
          'relative inline-flex h-7 w-12 shrink-0 rounded-full transition-colors',
          checked ? 'bg-[#55ace7]' : 'bg-[#cbd5e1]',
          disabled && 'cursor-not-allowed opacity-50',
        )}
      >
        <span
          className={cn(
            'pointer-events-none absolute top-0.5 left-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform',
            checked ? 'translate-x-5' : 'translate-x-0',
          )}
        />
      </button>
      <div className="min-w-0 flex-1">
        <span
          id={`${switchId}-label`}
          className="block text-sm font-semibold leading-snug text-[#1a3a5c] sm:text-[15px]"
        >
          {label}
        </span>
        {description ? (
          <span className="mt-0.5 block text-xs leading-relaxed text-[#686868]">
            {description}
          </span>
        ) : null}
      </div>
    </div>
  )
}
