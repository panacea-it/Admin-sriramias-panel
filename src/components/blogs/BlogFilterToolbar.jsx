import { Search } from 'lucide-react'
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
      <svg
        className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        aria-hidden
      >
        <path d="M6 9l6 6 6-6" />
      </svg>
    </div>
  )
}

export default function BlogFilterToolbar({
  search,
  onSearchChange,
  selectedDate,
  onDateChange,
  status,
  onStatusChange,
}) {
  return (
    <div className="flex min-h-[56px] flex-wrap items-center justify-between gap-3 rounded-xl bg-white px-4 py-3 shadow-[0_8px_20px_rgba(15,23,42,0.07)] sm:gap-4">
      <div className="relative w-full min-w-0 flex-1 lg:max-w-lg">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-[#687180]" />
        <input
          type="search"
          value={search}
          onChange={onSearchChange}
          placeholder="Search blog"
          className={cn(
            controlHeight,
            'w-full rounded-lg bg-[#eef2fc] pl-10 pr-3 text-sm text-[#222] outline-none placeholder:text-[#9ca0a8] focus:ring-2 focus:ring-[#55ace7]/45',
          )}
        />
      </div>
      <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:gap-2.5">
        <CrmDateFilterPicker value={selectedDate} onChange={onDateChange} tone="gradient" />
        <FilterSelect
          label="Status"
          value={status}
          onChange={onStatusChange}
          options={[
            { value: 'all', label: 'Status' },
            { value: 'published', label: 'Active' },
            { value: 'draft', label: 'Deactivated' },
          ]}
        />
      </div>
    </div>
  )
}
