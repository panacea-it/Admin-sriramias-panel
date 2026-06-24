import { ChevronDown } from 'lucide-react'
import { cn } from '../../utils/cn'

export const categoryInputClass =
  'h-11 w-full rounded-lg bg-[#e8f4fc] px-4 text-sm font-medium text-[#222] outline-none transition placeholder:text-[#9ca0a8] focus:ring-2 focus:ring-[#55ace7]'

export function CategoryFormField({ label, required, children, error, className }) {
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <label className="text-xs font-medium text-[#686868]">
        {label}
        {required && <span className="text-[#dc2626]"> *</span>}
      </label>
      {children}
      {error && <p className="text-xs font-medium text-[#dc2626]">{error}</p>}
    </div>
  )
}

export function CategorySelect({ className, children, ...props }) {
  return (
    <div className="relative">
      <select
        {...props}
        className={cn(categoryInputClass, 'appearance-none pr-10', className)}
      >
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9ca0a8]" />
    </div>
  )
}
