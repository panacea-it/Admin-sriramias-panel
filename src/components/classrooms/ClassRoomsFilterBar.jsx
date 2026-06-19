import { Search, ChevronDown } from 'lucide-react'
import { cn } from '../../utils/cn'

function FilterSelect({ label, value, onChange, options }) {
  return (
    <div className="relative min-w-0 w-full">
      <select
        value={value}
        onChange={onChange}
        aria-label={label}
        className={cn(
          'h-10 w-full min-h-[38px] appearance-none truncate rounded-lg border-0 bg-[#55ace7] pl-4 pr-9 text-sm font-semibold text-white outline-none transition hover:bg-[#4a9ad4] focus:ring-2 focus:ring-[#246392]/50',
        )}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value} className="bg-white text-[#222]">
            {opt.label}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white" />
    </div>
  )
}

const DEFAULT_STATUS_OPTIONS = [
  { value: 'all', label: 'Status' },
  { value: 'Active', label: 'Active' },
  { value: 'Deactivated', label: 'Deactivated' },
]

export default function ClassRoomsFilterBar({
  search,
  onSearchChange,
  searchPlaceholder = 'Search by Code, Center or City / Place...',
  cityFilter,
  onCityFilterChange,
  cityOptions = [],
  centerFilter,
  onCenterFilterChange,
  centerOptions,
  status,
  onStatusChange,
  statusOptions = DEFAULT_STATUS_OPTIONS,
}) {
  return (
    <div className="w-full rounded-xl bg-white/90 px-3 py-2.5 shadow-[0_8px_24px_rgba(15,23,42,0.08)] backdrop-blur-sm sm:px-4">
      <div
        className={cn(
          'grid w-full min-w-0 items-center gap-3',
          'grid-cols-1 sm:grid-cols-2',
          'lg:grid-cols-[minmax(0,3fr)_minmax(0,2.5fr)_minmax(0,2.5fr)_minmax(0,2fr)]',
        )}
      >
        <div className="relative min-w-0 sm:col-span-2 lg:col-span-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-[#687180]" />
          <input
            type="search"
            value={search}
            onChange={onSearchChange}
            placeholder={searchPlaceholder}
            aria-label={searchPlaceholder}
            className="h-10 w-full min-h-[38px] rounded-lg bg-[#eef2fc] pl-10 pr-3 text-sm text-[#222] outline-none transition placeholder:text-[#9ca0a8] focus:ring-2 focus:ring-[#55ace7]"
          />
        </div>

        {cityOptions.length > 0 && onCityFilterChange && (
          <FilterSelect
            label="City"
            value={cityFilter}
            onChange={onCityFilterChange}
            options={cityOptions}
          />
        )}

        {centerOptions && onCenterFilterChange && (
          <FilterSelect
            label="Center"
            value={centerFilter}
            onChange={onCenterFilterChange}
            options={centerOptions}
          />
        )}

        {onStatusChange && (
          <FilterSelect
            label="Status"
            value={status}
            onChange={onStatusChange}
            options={statusOptions}
          />
        )}
      </div>
    </div>
  )
}
