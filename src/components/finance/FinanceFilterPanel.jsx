import { Search, ChevronDown, RotateCcw } from 'lucide-react'
import { cn } from '../../utils/cn'

function FilterSelect({ label, value, onChange, options }) {
  return (
    <div className="relative w-full sm:w-auto sm:min-w-[150px]">
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

function DateInput({ label, value, onChange }) {
  return (
    <div className="relative w-full sm:w-auto sm:min-w-[140px]">
      <label className="sr-only">{label}</label>
      <input
        type="date"
        value={value}
        onChange={onChange}
        aria-label={label}
        className="h-10 w-full min-h-[38px] rounded-lg border border-[#55ace7]/30 bg-white px-3 text-sm font-medium text-[#222] outline-none transition focus:ring-2 focus:ring-[#55ace7]/40"
      />
    </div>
  )
}

export default function FinanceFilterPanel({
  search = '',
  onSearchChange,
  searchPlaceholder = 'Search student, course, txn…',
  dateFrom = '',
  onDateFromChange,
  dateTo = '',
  onDateToChange,
  selects = [],
  onSearch,
  onReset,
  className,
}) {
  return (
    <div
      className={cn(
        'flex min-h-14 flex-wrap items-center justify-between gap-3 rounded-xl bg-white/90 px-3 py-2.5 shadow-[0_8px_24px_rgba(15,23,42,0.08)] backdrop-blur-sm sm:px-4',
        className,
      )}
    >
      <div className="relative w-full min-w-0 flex-1 sm:max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-[#687180] sm:left-4" />
        <input
          type="search"
          value={search}
          onChange={onSearchChange}
          placeholder={searchPlaceholder}
          className="h-10 w-full min-h-[38px] rounded-lg bg-[#eef2fc] pl-10 pr-3 text-sm text-[#222] outline-none transition placeholder:text-[#9ca0a8] focus:ring-2 focus:ring-[#55ace7] sm:pl-11 sm:text-base"
        />
      </div>

      <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
        {onDateFromChange && (
          <DateInput label="From date" value={dateFrom} onChange={onDateFromChange} />
        )}
        {onDateToChange && (
          <DateInput label="To date" value={dateTo} onChange={onDateToChange} />
        )}
        {selects.map((sel) => (
          <FilterSelect
            key={sel.key || sel.label}
            label={sel.label}
            value={sel.value}
            onChange={sel.onChange}
            options={sel.options}
          />
        ))}
        {onSearch && (
          <button
            type="button"
            onClick={onSearch}
            className="inline-flex h-10 min-h-[38px] items-center gap-1.5 rounded-lg bg-gradient-to-r from-[#1a3a5c] to-[#246392] px-4 text-sm font-semibold text-white shadow-sm transition hover:brightness-110"
          >
            <Search className="h-4 w-4" />
            Search
          </button>
        )}
        {onReset && (
          <button
            type="button"
            onClick={onReset}
            className="inline-flex h-10 min-h-[38px] items-center gap-1.5 rounded-lg border border-[#55ace7]/40 bg-white px-4 text-sm font-semibold text-[#246392] transition hover:bg-[#eef2fc]"
          >
            <RotateCcw className="h-4 w-4" />
            Reset
          </button>
        )}
      </div>
    </div>
  )
}
