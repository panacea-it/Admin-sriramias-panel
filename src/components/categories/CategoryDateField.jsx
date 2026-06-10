import { categoryInputClass } from './CategoryFormField'
import { cn } from '../../utils/cn'

/** Date input with calendar affordance (Figma-style) */
export default function CategoryDateField({ value, onChange, className, id }) {
  return (
    <div className={cn('relative', className)}>
      <input
        id={id}
        type="date"
        value={value}
        onChange={onChange}
        className={cn(
          categoryInputClass,
          'pr-12 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-0',
        )}
      />
      <span
        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-lg leading-none"
        aria-hidden
      >
        📅
      </span>
    </div>
  )
}
