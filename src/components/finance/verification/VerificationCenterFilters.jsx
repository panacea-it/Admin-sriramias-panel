import { Search, ChevronDown } from 'lucide-react'
import { cn } from '../../../utils/cn'

function FilterSelect({ label, value, onChange, options }) {
  return (
    <div className="relative min-w-0">
      <select
        value={value}
        onChange={onChange}
        aria-label={label}
        className={cn(
          'h-10 w-full appearance-none rounded-lg border-0 bg-[#55ace7] pl-3 pr-8 text-sm font-semibold text-white outline-none transition',
          'hover:bg-[#4a9ad4] focus:ring-2 focus:ring-[#246392]/50',
        )}
      >
        {options.map((opt, index) => (
          <option
            key={`${String(opt.value ?? 'option')}-${index}`}
            value={opt.value}
            className="bg-white text-[#222]"
          >
            {opt.label}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white" />
    </div>
  )
}

function DateInput({ label, value, onChange }) {
  return (
    <div className="min-w-0">
      <label className="sr-only">{label}</label>
      <input
        type="date"
        value={value}
        onChange={onChange}
        aria-label={label}
        className="h-10 w-full rounded-lg border border-[#55ace7]/30 bg-white px-3 text-sm font-medium text-[#222] outline-none transition focus:ring-2 focus:ring-[#55ace7]/40"
      />
    </div>
  )
}

export default function VerificationCenterFilters({
  search,
  onSearchChange,
  searchPlaceholder,
  dateFrom,
  onDateFromChange,
  dateTo,
  onDateToChange,
  selects = [],
}) {
  return (
    <div className="rounded-xl bg-white/90 px-4 py-4 shadow-[0_8px_24px_rgba(15,23,42,0.08)] backdrop-blur-sm sm:px-5">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-[#687180]" />
        <input
          type="search"
          value={search}
          onChange={onSearchChange}
          placeholder={searchPlaceholder}
          className="h-10 w-full rounded-lg bg-[#eef2fc] pl-10 pr-3 text-sm text-[#222] outline-none transition placeholder:text-[#9ca0a8] focus:ring-2 focus:ring-[#55ace7] sm:text-base"
        />
      </div>

      <div className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7">
        <DateInput label="From date" value={dateFrom} onChange={onDateFromChange} />
        <DateInput label="To date" value={dateTo} onChange={onDateToChange} />
        {selects.map((sel) => (
          <FilterSelect
            key={sel.key || sel.label}
            label={sel.label}
            value={sel.value}
            onChange={sel.onChange}
            options={sel.options}
          />
        ))}
      </div>
    </div>
  )
}
