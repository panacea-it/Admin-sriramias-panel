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
          'h-10 w-full min-h-[38px] appearance-none rounded-lg border-0 bg-[#55ace7] pl-4 pr-9 text-sm font-semibold text-white outline-none transition hover:bg-[#4a9ad4] focus:ring-2 focus:ring-[#246392]/50 sm:text-base',
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
  { value: 'In Active', label: 'Deactivated' },
]

const LG_GRID_BY_FILTER_COUNT = {
  1: 'lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]',
  2: 'lg:grid-cols-[minmax(0,1.4fr)_repeat(2,minmax(0,1fr))]',
  3: 'lg:grid-cols-[minmax(0,1.4fr)_repeat(3,minmax(0,1fr))]',
  4: 'lg:grid-cols-[minmax(0,1.4fr)_repeat(4,minmax(0,1fr))]',
}

export default function CategoryFilterBar({
  search,
  onSearchChange,
  searchPlaceholder = 'Search Category',
  status,
  onStatusChange,
  statusOptions = DEFAULT_STATUS_OPTIONS,
  centerFilter,
  onCenterFilterChange,
  centerOptions,
  categoryFilter,
  onCategoryFilterChange,
  categoryOptions,
  subjectFilter,
  onSubjectFilterChange,
  subjectOptions,
}) {
  const showCategory = Boolean(categoryOptions)
  const showSubject = Boolean(subjectOptions)
  const showCenter = Boolean(centerOptions && onCenterFilterChange)
  const showStatus = Boolean(onStatusChange)
  const filterCount = [showCategory, showSubject, showCenter, showStatus].filter(Boolean).length

  return (
    <div className="rounded-xl bg-white/90 px-3 py-2.5 shadow-[0_8px_24px_rgba(15,23,42,0.08)] backdrop-blur-sm sm:px-4">
      <div
        className={cn(
          'grid grid-cols-1 gap-3 sm:grid-cols-2 lg:items-center',
          LG_GRID_BY_FILTER_COUNT[filterCount],
        )}
      >
        <div
          className={cn(
            'relative min-w-0 w-full',
            filterCount > 0 && 'sm:col-span-2 lg:col-span-1',
          )}
        >
          <Search className="pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-[#687180] sm:left-4" />
          <input
            type="search"
            value={search}
            onChange={onSearchChange}
            placeholder={searchPlaceholder}
            className="h-10 w-full min-h-[38px] rounded-lg bg-[#eef2fc] pl-10 pr-3 text-sm text-[#222] outline-none transition placeholder:text-[#9ca0a8] focus:ring-2 focus:ring-[#55ace7] sm:pl-11 sm:text-base"
          />
        </div>

        {showCategory && (
          <FilterSelect
            label="Category"
            value={categoryFilter}
            onChange={onCategoryFilterChange}
            options={categoryOptions}
          />
        )}
        {showSubject && (
          <FilterSelect
            label="Subject"
            value={subjectFilter}
            onChange={onSubjectFilterChange}
            options={subjectOptions}
          />
        )}
        {showCenter && (
          <FilterSelect
            label="Center"
            value={centerFilter}
            onChange={onCenterFilterChange}
            options={centerOptions}
          />
        )}
        {showStatus && (
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
