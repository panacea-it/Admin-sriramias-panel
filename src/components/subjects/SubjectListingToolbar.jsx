import { Search, X, ChevronDown } from 'lucide-react'
import { cn } from '../../utils/cn'

function FilterSelect({ label, value, onChange, options, className }) {
  return (
    <div className={cn('relative w-full sm:w-auto sm:min-w-[148px]', className)}>
      <select
        value={value}
        onChange={onChange}
        aria-label={label}
        className="h-10 w-full min-h-[40px] cursor-pointer appearance-none rounded-lg border-0 bg-gradient-to-b from-[#55ace7] to-[#3d8fd4] pl-4 pr-9 text-sm font-semibold text-white shadow-sm outline-none transition hover:from-[#4a9fd8] hover:to-[#3589c8] focus:ring-2 focus:ring-[#246392]/40"
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

export default function SubjectListingToolbar({
  search,
  onSearchChange,
  onClearSearch,
  status,
  onStatusChange,
  teacher,
  onTeacherChange,
  teacherOptions = [],
  category,
  onCategoryChange,
  categoryOptions = [],
  onClearFilters,
  hasActiveFilters = false,
}) {
  return (
    <div className="space-y-3 rounded-2xl bg-white p-4 shadow-[0_8px_24px_rgba(15,23,42,0.07)] ring-1 ring-slate-100/80 sm:p-5">
      <div className="relative">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-[#55ace7]/70" />
        <input
          type="search"
          value={search}
          onChange={onSearchChange}
          placeholder="Search subjects by name, teacher, or ID…"
          className="h-11 w-full rounded-xl border border-slate-200/80 bg-slate-50/50 pl-11 pr-11 text-sm text-[#222] shadow-sm outline-none transition placeholder:text-slate-400 focus:border-[#55ace7] focus:bg-white focus:ring-2 focus:ring-[#55ace7]/20"
        />
        {search && (
          <button
            type="button"
            onClick={onClearSearch}
            aria-label="Clear search"
            className="absolute right-3 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2.5">
        <FilterSelect
          label="Status"
          value={status}
          onChange={onStatusChange}
          options={[
            { value: 'all', label: 'All Status' },
            { value: 'Active', label: 'Active' },
            { value: 'In Active', label: 'Disabled' },
          ]}
        />
        {teacherOptions.length > 1 && (
          <FilterSelect
            label="Teacher"
            value={teacher}
            onChange={onTeacherChange}
            options={teacherOptions}
          />
        )}
        {categoryOptions.length > 1 && (
          <FilterSelect
            label="Category"
            value={category}
            onChange={onCategoryChange}
            options={categoryOptions}
          />
        )}
        {hasActiveFilters && onClearFilters && (
          <button
            type="button"
            onClick={onClearFilters}
            className="inline-flex h-10 items-center gap-1.5 rounded-lg border border-red-200/80 bg-red-50/80 px-3.5 text-sm font-semibold text-[#c96565] transition hover:bg-red-50"
          >
            <X className="h-4 w-4" />
            Clear Filters
          </button>
        )}
      </div>
    </div>
  )
}
