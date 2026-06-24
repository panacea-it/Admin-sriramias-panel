import { cn } from '../../utils/cn'

const BASE_CLASS =
  'h-3.5 w-3.5 shrink-0 cursor-pointer rounded-[2px] border text-[#246392] accent-[#246392] focus:ring-1 focus:ring-[#55ace7]/50 focus:ring-offset-0'

export const TABLE_ROW_CHECKBOX_CLASS = cn(BASE_CLASS, 'border-[#55ace7]/50 bg-white')

export const TABLE_HEADER_CHECKBOX_CLASS = cn(BASE_CLASS, 'border-white/50')

/**
 * Compact square checkbox for table row/header selection.
 */
export default function TableSelectionCheckbox({
  checked,
  indeterminate = false,
  onChange,
  variant = 'row',
  className,
  'aria-label': ariaLabel,
}) {
  return (
    <span className="inline-flex items-center justify-center">
      <input
        type="checkbox"
        checked={!!checked}
        ref={(el) => {
          if (el) el.indeterminate = indeterminate
        }}
        onChange={onChange}
        aria-label={ariaLabel}
        className={cn(
          variant === 'header' ? TABLE_HEADER_CHECKBOX_CLASS : TABLE_ROW_CHECKBOX_CLASS,
          className,
        )}
      />
    </span>
  )
}
