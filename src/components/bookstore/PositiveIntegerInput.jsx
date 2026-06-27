import { forwardRef } from 'react'
import { BOOKSTORE_INPUT_CLASS } from './modal/bookstoreFormStyles'
import { cn } from '../../utils/cn'

function sanitizePositiveInteger(value) {
  return String(value ?? '').replace(/\D/g, '')
}

const PositiveIntegerInput = forwardRef(function PositiveIntegerInput(
  {
    value,
    onChange,
    placeholder = 'Enter quantity',
    className,
    id,
    name,
    autoFocus = false,
    disabled = false,
    'aria-label': ariaLabel,
  },
  ref,
) {
  return (
    <input
      ref={ref}
      type="text"
      inputMode="numeric"
      pattern="[0-9]*"
      autoComplete="off"
      autoFocus={autoFocus}
      id={id}
      name={name}
      aria-label={ariaLabel}
      disabled={disabled}
      placeholder={placeholder}
      className={cn(BOOKSTORE_INPUT_CLASS, className)}
      value={value}
      onChange={(e) => onChange(sanitizePositiveInteger(e.target.value))}
    />
  )
})

export default PositiveIntegerInput
