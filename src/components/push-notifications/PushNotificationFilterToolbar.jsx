import { Search, ChevronDown } from 'lucide-react'

function FilterSelect({ label, value, onChange, options }) {
  return (
    <div className="relative w-full sm:w-auto sm:min-w-[120px]">
      <select
        value={value}
        onChange={onChange}
        aria-label={label}
        className="h-10 w-full min-h-[38px] appearance-none rounded-lg border-0 bg-[#55ace7] pl-4 pr-9 text-sm font-semibold text-white outline-none focus:ring-2 focus:ring-[#246392]/50 sm:text-base"
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

export default function PushNotificationFilterToolbar({
  search,
  onSearchChange,
  center,
  onCenterChange,
  dateRange,
  onDateRangeChange,
  type,
  onTypeChange,
}) {
  return (
    <div className="flex min-h-14 flex-wrap items-center justify-between gap-3 rounded-lg bg-white px-3 py-2 shadow-[0_8px_20px_rgba(15,23,42,0.08)] sm:px-4">
      <div className="relative w-full min-w-0 flex-1 sm:max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-[#687180] sm:left-4" />
        <input
          type="search"
          value={search}
          onChange={onSearchChange}
          placeholder="Search Notifications"
          className="h-10 w-full min-h-[38px] rounded-lg bg-[#eef2fc] pl-10 pr-3 text-sm text-[#222] outline-none placeholder:text-[#9ca0a8] focus:ring-2 focus:ring-[#55ace7] sm:pl-11 sm:text-base"
        />
      </div>
      <div className="flex w-full flex-wrap gap-2 sm:w-auto">
        <FilterSelect
          label="Center"
          value={center}
          onChange={onCenterChange}
          options={[
            { value: 'all', label: 'Center' },
            { value: 'New Delhi', label: 'New Delhi' },
            { value: 'Hyderabad', label: 'Hyderabad' },
            { value: 'Pune', label: 'Pune' },
          ]}
        />
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
        <FilterSelect
          label="Type"
          value={type}
          onChange={onTypeChange}
          options={[
            { value: 'all', label: 'Type' },
            { value: 'All', label: 'All' },
            { value: 'Video', label: 'Video' },
            { value: 'Text', label: 'Text' },
          ]}
        />
      </div>
    </div>
  )
}
