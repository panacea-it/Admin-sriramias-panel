import { Search, ChevronDown, MapPin } from 'lucide-react'
import { cn } from '../../utils/cn'
import { formatCategoryStatusDisplayLabel } from '../../utils/categoryStatusHelpers'

function FilterSelect({ label, value, onChange, options, icon: Icon, formatOptionLabel }) {
  return (
    <div className="relative w-full sm:w-auto sm:min-w-[160px]">
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
            {formatOptionLabel ? formatOptionLabel(opt) : opt.label}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white" />
    </div>
  )
}

const STATUS_OPTIONS = [
  { value: 'all', label: 'Status' },
  { value: 'Active', label: 'Active' },
  { value: 'In Active', label: 'Inactive' },
]

const formatStatusOptionLabel = (opt) =>
  formatCategoryStatusDisplayLabel(opt.label ?? opt.value)

export default function ProgramsFilterBar({
  search,
  onSearchChange,
  searchPlaceholder = 'Search by program name or ID...',
  centre,
  onCentreChange,
  centreOptions = [],
  program,
  onProgramChange,
  programOptions,
  status,
  onStatusChange,
  statusOptions = STATUS_OPTIONS,
}) {
  return (
    <div className="flex min-h-[52px] flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/80 bg-white px-3 py-3 shadow-[0_8px_24px_rgba(15,23,42,0.08)] sm:px-4">
      <div className="relative w-full min-w-0 flex-1 lg:max-w-xl">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-[#687180]" />
        <input
          type="search"
          value={search}
          onChange={onSearchChange}
          placeholder={searchPlaceholder}
          className="h-10 w-full min-h-[38px] rounded-xl bg-[#eef2fc] pl-11 pr-4 text-sm text-[#222] outline-none transition placeholder:text-[#9ca0a8] focus:ring-2 focus:ring-[#55ace7]/40 sm:text-[15px]"
        />
      </div>
      <div className="flex w-full flex-wrap gap-2 sm:w-auto">
        <FilterSelect
          label="Centre Wise"
          value={centre}
          onChange={onCentreChange}
          options={centreOptions}
          icon={MapPin}
        />
        {programOptions?.length > 0 && onProgramChange && (
          <FilterSelect
            label="Program"
            value={program}
            onChange={onProgramChange}
            options={programOptions}
          />
        )}
        {onStatusChange && (
          <FilterSelect
            label="Status"
            value={status}
            onChange={onStatusChange}
            options={statusOptions}
            formatOptionLabel={formatStatusOptionLabel}
          />
        )}
      </div>
    </div>
  )
}
