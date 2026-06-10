import { Search } from 'lucide-react'
import { cn } from '../../utils/cn'

export default function FilterToolbar({
  search,
  onSearchChange,
  searchPlaceholder = 'Search...',
  filterValue,
  onFilterChange,
  filterOptions = [],
  className,
}) {
  return (
    <div
      className={cn(
        'flex min-h-14 flex-wrap items-center justify-between gap-3 rounded-lg bg-white px-3 py-2 shadow-[0_8px_20px_rgba(15,23,42,0.08)] sm:px-4',
        className,
      )}
    >
      <div className="relative w-full min-w-0 flex-1 sm:max-w-xs">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-[#687180] sm:left-4" />
        <input
          type="search"
          value={search}
          onChange={onSearchChange}
          placeholder={searchPlaceholder}
          className="h-10 w-full min-h-[38px] rounded-lg bg-[#eef2fc] pl-10 pr-3 text-sm font-normal text-[#222222] outline-none placeholder:text-[#9ca0a8] focus:ring-2 focus:ring-[#55ace7] sm:pl-11 sm:text-base"
        />
      </div>
      {filterOptions.length > 0 && (
        <select
          value={filterValue}
          onChange={onFilterChange}
          className="h-10 min-h-[38px] w-full rounded-lg border-0 bg-[#eef2fc] px-3 text-sm font-medium text-[#222222] outline-none focus:ring-2 focus:ring-[#55ace7] sm:w-auto sm:min-w-[140px] sm:text-base"
        >
          {filterOptions.map((opt) => (
            <option key={opt.value ?? opt} value={opt.value ?? opt}>
              {opt.label ?? opt}
            </option>
          ))}
        </select>
      )}
    </div>
  )
}
