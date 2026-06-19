import { Search, ChevronDown, MapPin } from 'lucide-react'
import { cn } from '../../utils/cn'

function FilterSelect({ label, value, onChange, options, icon: Icon }) {
  return (
    <div className="relative min-w-0 w-full">
      {Icon && (
        <Icon className="pointer-events-none absolute left-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-white/90" />
      )}
      <select
        value={value}
        onChange={onChange}
        aria-label={label}
        className={cn(
          'h-10 w-full min-h-[38px] appearance-none rounded-xl border-0 bg-[#55ace7] text-sm font-semibold text-white outline-none transition hover:bg-[#4a9ad4] focus:ring-2 focus:ring-[#246392]/50',
          Icon ? 'pl-9 pr-9' : 'pl-4 pr-9',
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

export default function ExamSubCategoryFilterBar({
  search,
  onSearchChange,
  searchPlaceholder = 'Search Sub Category',
  program,
  onProgramChange,
  programOptions = [],
  category,
  onCategoryChange,
  categoryOptions = [],
  centerFilter,
  onCenterFilterChange,
  centerOptions = [],
  status,
  onStatusChange,
  statusOptions = [],
}) {
  return (
    <div className="rounded-2xl border border-white/80 bg-white px-3 py-3 shadow-[0_8px_24px_rgba(15,23,42,0.08)] sm:px-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-[minmax(0,1.4fr)_repeat(4,minmax(0,1fr))] lg:items-center">
        <div className="relative min-w-0 w-full sm:col-span-2 lg:col-span-1">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-[#687180]" />
          <input
            type="search"
            value={search}
            onChange={onSearchChange}
            placeholder={searchPlaceholder}
            className="h-10 w-full min-h-[38px] rounded-xl bg-[#eef2fc] pl-11 pr-4 text-sm text-[#222] outline-none transition placeholder:text-[#9ca0a8] focus:ring-2 focus:ring-[#55ace7]/40 sm:text-[15px]"
          />
        </div>

        <FilterSelect
          label="Program"
          value={program}
          onChange={onProgramChange}
          options={programOptions}
        />
        <FilterSelect
          label="Exam Category"
          value={category}
          onChange={onCategoryChange}
          options={categoryOptions}
        />
        <FilterSelect
          label="Center"
          value={centerFilter}
          onChange={onCenterFilterChange}
          options={centerOptions}
          icon={MapPin}
        />
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
