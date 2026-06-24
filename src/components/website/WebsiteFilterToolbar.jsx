import { Search, ChevronDown } from 'lucide-react'
import { cn } from '../../utils/cn'
import CrmDateFilterPicker from '../crm/CrmDateFilterPicker'

const controlHeight = 'h-10 min-h-[40px]'

function FilterSelect({ label, value, onChange, options, className }) {
  return (
    <div className={cn('relative w-full sm:w-auto sm:min-w-[118px]', className)}>
      <select
        value={value}
        onChange={onChange}
        aria-label={label}
        className={cn(
          controlHeight,
          'w-full cursor-pointer appearance-none rounded-lg border-0 bg-gradient-to-b from-[#55ace7] to-[#3d8fd4] pl-4 pr-9 text-sm font-semibold text-white shadow-sm outline-none transition hover:from-[#4a9fd8] hover:to-[#3589c8] focus:ring-2 focus:ring-[#246392]/40',
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

function RankRangeInputs({ min, max, onMinChange, onMaxChange, minError, maxError }) {
  const inputClass = cn(
    controlHeight,
    'w-full rounded-lg bg-[#eef2fc] px-3 text-sm font-semibold text-[#222] outline-none placeholder:font-normal placeholder:text-[#9ca0a8] focus:ring-2 focus:ring-[#55ace7]/45',
  )

  return (
    <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:gap-2.5">
      <span className="text-xs font-semibold text-[#686868]">Rank range</span>
      <div className="flex items-center gap-2">
        <div className="flex flex-col gap-0.5">
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            placeholder="Min"
            value={min}
            onChange={onMinChange}
            aria-label="Minimum rank"
            aria-invalid={Boolean(minError)}
            className={cn(inputClass, 'w-[72px] sm:w-20', minError && 'ring-2 ring-[#dc2626]/50')}
          />
          {minError && (
            <span className="text-[10px] font-medium text-[#dc2626]">{minError}</span>
          )}
        </div>
        <span className="text-sm font-medium text-[#9ca0a8]">–</span>
        <div className="flex flex-col gap-0.5">
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            placeholder="Max"
            value={max}
            onChange={onMaxChange}
            aria-label="Maximum rank"
            aria-invalid={Boolean(maxError)}
            className={cn(inputClass, 'w-[72px] sm:w-20', maxError && 'ring-2 ring-[#dc2626]/50')}
          />
          {maxError && (
            <span className="text-[10px] font-medium text-[#dc2626]">{maxError}</span>
          )}
        </div>
      </div>
    </div>
  )
}

export default function WebsiteFilterToolbar({
  search,
  onSearchChange,
  searchPlaceholder,
  dateRange,
  onDateRangeChange,
  selectedDate,
  onDateChange,
  useDatePicker = false,
  statusFilter,
  onStatusFilterChange,
  showStatusFilter = false,
  priorityFilter,
  onPriorityFilterChange,
  showPriorityFilter = false,
  priorityFilterOptions,
  rankMin,
  rankMax,
  onRankMinChange,
  onRankMaxChange,
  rankMinError,
  rankMaxError,
  showRankRange = false,
}) {
  return (
    <div className="flex min-h-[56px] flex-wrap items-center justify-between gap-3 rounded-xl bg-white px-4 py-3 shadow-[0_8px_20px_rgba(15,23,42,0.07)] sm:gap-4">
      <div className="relative w-full min-w-0 flex-1 lg:max-w-lg">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-[#687180]" />
        <input
          type="search"
          value={search}
          onChange={onSearchChange}
          placeholder={searchPlaceholder}
          className={cn(
            controlHeight,
            'w-full rounded-lg bg-[#eef2fc] pl-10 pr-3 text-sm text-[#222] outline-none placeholder:text-[#9ca0a8] focus:ring-2 focus:ring-[#55ace7]/45',
          )}
        />
      </div>
      <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:gap-2.5">
        {useDatePicker ? (
          <CrmDateFilterPicker value={selectedDate} onChange={onDateChange} tone="gradient" />
        ) : (
          <FilterSelect
            label="Date range"
            value={dateRange}
            onChange={onDateRangeChange}
            options={[
              { value: 'all', label: 'All dates' },
              { value: 'Today', label: 'Today' },
              { value: 'This Week', label: 'This Week' },
              { value: 'This Month', label: 'This Month' },
            ]}
          />
        )}
        {showStatusFilter && (
          <FilterSelect
            label="Status"
            value={statusFilter}
            onChange={onStatusFilterChange}
            options={[
              { value: 'all', label: 'Status' },
              { value: 'Active', label: 'Active' },
              { value: 'Deactivated', label: 'Deactivated' },
            ]}
          />
        )}
        {showPriorityFilter && (
          <FilterSelect
            label="Priority"
            value={priorityFilter}
            onChange={onPriorityFilterChange}
            options={
              priorityFilterOptions ?? [{ value: 'all', label: 'Priority' }]
            }
            className="sm:min-w-[140px]"
          />
        )}
        {showRankRange && (
          <RankRangeInputs
            min={rankMin}
            max={rankMax}
            onMinChange={onRankMinChange}
            onMaxChange={onRankMaxChange}
            minError={rankMinError}
            maxError={rankMaxError}
          />
        )}
      </div>
    </div>
  )
}
