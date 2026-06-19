import { Search, X, ChevronDown } from 'lucide-react'
import { cn } from '../../utils/cn'

function FilterChip({ label, value, onChange, options }) {
  return (
    <div className="relative inline-flex">
      <select
        value={value}
        onChange={onChange}
        aria-label={label}
        className="h-9 min-w-[120px] cursor-pointer appearance-none rounded-full border border-slate-200/90 bg-white pl-3.5 pr-8 text-xs font-semibold text-[#1a3a5c] shadow-sm outline-none transition hover:border-[#55ace7]/40 focus:border-[#55ace7] focus:ring-2 focus:ring-[#55ace7]/20"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
    </div>
  )
}

export default function LiveClassListingToolbar({
  search,
  onSearchChange,
  onClearSearch,
  status,
  onStatusChange,
  category,
  onCategoryChange,
  showCategoryFilter = false,
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
          placeholder="Search live classes by title, center, or ID…"
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

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[11px] font-bold uppercase tracking-wide text-slate-400">Filters</span>
        {showCategoryFilter && onCategoryChange && (
          <FilterChip
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
          <FilterChip
            label="Status"
            value={status}
            onChange={onStatusChange}
            options={[
              { value: 'all', label: 'All Status' },
              { value: 'Active', label: 'Active' },
              { value: 'In Active', label: 'Deactivated' },
            ]}
          />
        )}
        {hasActiveFilters && onClearFilters && (
          <button
            type="button"
            onClick={onClearFilters}
            className={cn(
              'inline-flex h-9 items-center gap-1 rounded-full border border-red-200/80 bg-red-50/80 px-3 text-xs font-semibold text-[#c96565] transition hover:bg-red-50',
            )}
          >
            <X className="h-3.5 w-3.5" />
            Clear Filters
          </button>
        )}
      </div>
    </div>
  )
}
