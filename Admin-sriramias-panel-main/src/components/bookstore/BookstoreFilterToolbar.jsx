import { Search } from 'lucide-react'
import { cn } from '../../utils/cn'

export default function BookstoreFilterToolbar({
  search,
  onSearchChange,
  searchPlaceholder = 'Search…',
  filters,
  actions,
  className,
}) {
  return (
    <div
      className={cn(
        'flex flex-col gap-3 rounded-xl bg-white p-4 shadow-[0_8px_24px_rgba(15,23,42,0.06)] sm:flex-row sm:flex-wrap sm:items-center sm:justify-between',
        className,
      )}
    >
      <div className="relative min-w-[200px] flex-1 sm:max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9ca0a8]" />
        <input
          type="search"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={searchPlaceholder}
          className="w-full rounded-lg border border-[#e8e8e8] py-2.5 pl-10 pr-3 text-sm outline-none focus:border-[#7c5cbf] focus:ring-2 focus:ring-[#7c5cbf]/20"
        />
      </div>
      {filters && <div className="flex flex-wrap items-center gap-2">{filters}</div>}
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  )
}
