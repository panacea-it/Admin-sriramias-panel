import { Search } from 'lucide-react'
import { cn } from '../../utils/cn'

export default function FinanceSearchInput({
  value,
  onChange,
  placeholder = 'Search…',
  className,
  inputClassName,
  id,
  'aria-label': ariaLabel = 'Search',
}) {
  return (
    <div className={cn('relative min-w-0 flex-1', className)}>
      <Search
        className="pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-[#687180]"
        aria-hidden
      />
      <input
        id={id}
        type="search"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        aria-label={ariaLabel}
        className={cn(
          'h-10 w-full rounded-lg border border-slate-200 bg-white pl-10 pr-3 text-sm text-[#222] outline-none transition placeholder:text-[#9ca0a8] focus:border-[#55ace7] focus:ring-2 focus:ring-[#55ace7]/20',
          inputClassName,
        )}
      />
    </div>
  )
}
