import { Search } from 'lucide-react'
import { cn } from '../../../../utils/cn'

export default function CbtCardSearchInput({
  value,
  onChange,
  placeholder = 'Search…',
  disabled = false,
  className,
}) {
  return (
    <div className={cn('relative w-full sm:max-w-xs', className)}>
      <Search
        className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
        aria-hidden
      />
      <input
        type="search"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        className="h-10 w-full rounded-lg border border-slate-200 bg-white py-2 pl-10 pr-3 text-sm text-[#222] outline-none placeholder:text-slate-400 focus:border-[#55ace7] focus:ring-2 focus:ring-[#55ace7]/20 disabled:cursor-not-allowed disabled:opacity-60"
      />
    </div>
  )
}
