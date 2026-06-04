import { Search, ChevronDown } from 'lucide-react'
import { cn } from '../../utils/cn'

function FilterSelect({ label, value, onChange, options }) {
  return (
    <div className="relative w-full sm:w-auto sm:min-w-[140px]">
      <select
        value={value}
        onChange={onChange}
        aria-label={label}
        className="h-10 w-full min-h-[38px] appearance-none rounded-full border-0 bg-[#55ace7] pl-4 pr-9 text-sm font-semibold text-white outline-none focus:ring-2 focus:ring-[#246392]/50"
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

export default function SubjectFilters({
  search,
  onSearchChange,
  searchPlaceholder = 'Search Subjects',
  status,
  onStatusChange,
  category,
  onCategoryChange,
  showCategoryFilter = false,
}) {
  return (
    <div className="flex min-h-14 flex-wrap items-center justify-between gap-3 rounded-xl bg-white px-3 py-2.5 shadow-[0_8px_20px_rgba(15,23,42,0.08)] sm:px-4">
      <div className="relative w-full min-w-0 flex-1 sm:max-w-xl">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-[#687180]" />
        <input
          type="search"
          value={search}
          onChange={onSearchChange}
          placeholder={searchPlaceholder}
          className="h-10 w-full min-h-[38px] rounded-full border border-slate-200/80 bg-white pl-11 pr-4 text-sm text-[#222] outline-none placeholder:text-[#9ca0a8] focus:border-[#55ace7] focus:ring-2 focus:ring-[#55ace7]/25"
        />
      </div>
      <div className="flex w-full flex-wrap gap-2 sm:w-auto">
        {showCategoryFilter && onCategoryChange && (
          <FilterSelect
            label="Category"
            value={category}
            onChange={onCategoryChange}
            options={[
              { value: 'all', label: 'Live Class' },
              { value: 'Live Class', label: 'Live Class' },
              { value: 'Recorded Class', label: 'Recorded Class' },
              { value: 'Test Series', label: 'Test Series' },
            ]}
          />
        )}
        {onStatusChange && (
          <FilterSelect
            label="Status"
            value={status}
            onChange={onStatusChange}
            options={[
              { value: 'all', label: 'Status' },
              { value: 'Active', label: 'Active' },
              { value: 'In Active', label: 'In Active' },
            ]}
          />
        )}
      </div>
    </div>
  )
}
