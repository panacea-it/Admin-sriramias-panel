import { cn } from '../../../utils/cn'

const INPUT_CLASS =
  'h-4 w-4 shrink-0 cursor-pointer rounded border-[#55ace7]/40 text-[#246392] accent-[#246392] focus:ring-2 focus:ring-[#55ace7]/50 disabled:cursor-not-allowed disabled:opacity-50'

/**
 * Styled checkbox matching admin panel tables and forms.
 */
export default function AdminCheckbox({
  id,
  label,
  checked,
  onChange,
  disabled = false,
  className,
  inputClassName,
  'aria-label': ariaLabel,
}) {
  const input = (
    <input
      id={id}
      type="checkbox"
      checked={!!checked}
      disabled={disabled}
      aria-label={ariaLabel || (typeof label === 'string' ? label : undefined)}
      onChange={(e) => onChange?.(e.target.checked)}
      className={cn(INPUT_CLASS, inputClassName)}
    />
  )

  if (!label) {
    return <span className={cn('inline-flex items-center', className)}>{input}</span>
  }

  return (
    <label
      htmlFor={id}
      className={cn(
        'inline-flex cursor-pointer items-center gap-2.5',
        disabled && 'cursor-not-allowed opacity-60',
        className,
      )}
    >
      {input}
      <span className="text-sm font-medium text-slate-700">{label}</span>
    </label>
  )
}
