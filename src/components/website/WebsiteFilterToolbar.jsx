import { Search, ChevronDown } from 'lucide-react'
import { cn } from '../../utils/cn'

const controlHeight = 'h-10 min-h-[40px]'

function FilterSelect({ label, value, onChange, options }) {
  return (
    <div className="relative w-full sm:w-auto sm:min-w-[118px]">
      <select
        value={value}
        onChange={onChange}
        aria-label={label}
        className={cn(
          controlHeight,
          'w-full cursor-pointer appearance-none rounded-lg border-0 bg-gradient-to-b from-[#55ace7] to-[#3d8fd4] pl-4 pr-9 text-sm font-semibold text-white shadow-sm outline-none transition hover:from-[#4a9fd8] hover:to-[#3589c8] focus:ring-2 focus:ring-[#246392]/40',
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

export default function WebsiteFilterToolbar({
  search,
  onSearchChange,
  searchPlaceholder,
  dateRange,
  onDateRangeChange,
  statusFilter,
  onStatusFilterChange,
  showStatusFilter = false,
  priorityFilter,
  onPriorityFilterChange,
  showPriorityFilter = false,
  priorityFilterOptions,
}) {
  return (
    <div className="flex min-h-[56px] flex-wrap items-center justify-between gap-3 rounded-xl bg-white px-4 py-3 shadow-[0_8px_20px_rgba(15,23,42,0.07)] sm:gap-4">
      <div className="relative w-full min-w-0 flex-1 lg:max-w-lg">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-[#687180]" />
        <input
          type="search"
          value={search}
          onChange={onSearchChange}
          placeholder={searchPlaceholder}
          className={cn(
            controlHeight,
            'w-full rounded-lg bg-[#eef2fc] pl-10 pr-3 text-sm text-[#222] outline-none placeholder:text-[#9ca0a8] focus:ring-2 focus:ring-[#55ace7]/45',
          )}
        />
      </div>
      <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:gap-2.5">
        <FilterSelect
          label="Today"
          value={dateRange}
          onChange={onDateRangeChange}
          options={[
            { value: 'all', label: 'Today' },
            { value: 'Today', label: 'Today' },
            { value: 'This Week', label: 'This Week' },
            { value: 'This Month', label: 'This Month' },
          ]}
        />
        {showStatusFilter && (
          <FilterSelect
            label="Status"
            value={statusFilter}
            onChange={onStatusFilterChange}
            options={[
              { value: 'all', label: 'Status' },
              { value: 'Active', label: 'Active' },
              { value: 'Inactive', label: 'Inactive' },
            ]}
          />
        )}
        {showPriorityFilter && (
          <FilterSelect
            label="Priority"
            value={priorityFilter}
            onChange={onPriorityFilterChange}
            options={
              priorityFilterOptions ?? [{ value: 'all', label: 'Priority' }]
            }
          />
        )}
      </div>
    </div>
  )
}
