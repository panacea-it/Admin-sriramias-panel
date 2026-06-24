import { Search, ChevronDown } from 'lucide-react'
import { cn } from '../../utils/cn'

function FilterSelect({ label, value, onChange, options, enhanced = false }) {
  return (
    <div className="relative w-full sm:w-auto sm:min-w-[148px]">
      <select
        value={value}
        onChange={onChange}
        aria-label={label}
        className={cn(
          'h-10 w-full min-h-[40px] appearance-none pl-4 pr-9 text-sm font-semibold outline-none transition',
          enhanced
            ? 'rounded-xl border border-[#55ace7]/30 bg-gradient-to-r from-[#55ace7] to-[#4899d4] text-white shadow-sm focus:ring-2 focus:ring-[#55ace7]/40'
            : 'rounded-full border-0 bg-[#55ace7] text-white focus:ring-2 focus:ring-[#246392]/50',
        )}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value} className="bg-white text-[#222]">
            {opt.label}
          </option>
        ))}
      </select>
      <ChevronDown
        className={cn(
          'pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2',
          enhanced ? 'text-white/90' : 'text-white',
        )}
      />
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
  enhanced = false,
}) {
  return (
    <div
      className={cn(
        'flex min-h-14 flex-wrap items-center justify-between gap-3 rounded-xl bg-white px-3 py-3 sm:px-5',
        enhanced
          ? 'shadow-[0_8px_24px_rgba(15,23,42,0.07)] ring-1 ring-slate-100/80'
          : 'py-2.5 shadow-[0_8px_20px_rgba(15,23,42,0.08)] sm:px-4',
      )}
    >
      <div className="relative w-full min-w-0 flex-1 sm:max-w-xl">
        <Search
          className={cn(
            'pointer-events-none absolute top-1/2 -translate-y-1/2 text-[#55ace7]/70',
            enhanced ? 'left-4 h-[18px] w-[18px]' : 'left-4 h-[18px] w-[18px] text-[#687180]',
          )}
        />
        <input
          type="search"
          value={search}
          onChange={onSearchChange}
          placeholder={searchPlaceholder}
          className={cn(
            'h-10 w-full min-h-[40px] bg-white pl-11 pr-4 text-sm text-[#222] outline-none transition placeholder:text-[#9ca0a8]',
            enhanced
              ? 'rounded-xl border border-slate-200/80 shadow-sm focus:border-[#55ace7] focus:ring-2 focus:ring-[#55ace7]/25'
              : 'rounded-full border border-slate-200/80 focus:border-[#55ace7] focus:ring-2 focus:ring-[#55ace7]/25',
          )}
        />
      </div>
      <div className="flex w-full flex-wrap gap-2 sm:w-auto">
        {showCategoryFilter && onCategoryChange && (
          <FilterSelect
            label="Category"
            value={category}
            onChange={onCategoryChange}
            enhanced={enhanced}
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
            enhanced={enhanced}
            options={[
              { value: 'all', label: 'Status' },
              { value: 'Active', label: 'Active' },
              { value: 'In Active', label: 'Deactivated' },
            ]}
          />
        )}
      </div>
    </div>
  )
}
