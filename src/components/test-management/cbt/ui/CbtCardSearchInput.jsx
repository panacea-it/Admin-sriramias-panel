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
    <div className={cn('relative w-full sm:max-w-md', className)}>
      <Search
        className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-slate-400"
        aria-hidden
      />
      <input
        type="search"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        className="h-12 w-full rounded-xl border border-slate-200 bg-white py-2 pl-11 pr-4 text-[15px] text-[#222] outline-none placeholder:text-slate-400 focus:border-[#55ace7] focus:ring-2 focus:ring-[#55ace7]/20 disabled:cursor-not-allowed disabled:opacity-60"
      />
    </div>
  )
}
