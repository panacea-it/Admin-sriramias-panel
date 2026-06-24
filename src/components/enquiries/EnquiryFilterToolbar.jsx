import { Search, ChevronDown } from 'lucide-react'
import CrmDateFilterPicker from '../crm/CrmDateFilterPicker'
import { ENQUIRY_SOURCE_PAGE_OPTIONS } from '../../data/enquiriesData'

function FilterSelect({ label, value, onChange, options }) {
  return (
    <div className="relative w-full sm:w-auto sm:min-w-[148px]">
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

export default function EnquiryFilterToolbar({
  search,
  onSearchChange,
  center,
  onCenterChange,
  selectedDate,
  onDateChange,
  type,
  onTypeChange,
  sourcePage,
  onSourcePageChange,
}) {
  return (
    <div className="flex min-h-14 flex-wrap items-center justify-between gap-3 rounded-2xl bg-white px-4 py-3 shadow-[0_8px_24px_rgba(15,23,42,0.07)] ring-1 ring-slate-100/80 sm:px-5">
      <div className="relative w-full min-w-0 flex-1 sm:max-w-xl">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-[#55ace7]/70" />
        <input
          type="search"
          value={search}
          onChange={onSearchChange}
          placeholder="Search By Username"
          className="h-10 w-full min-h-[40px] rounded-xl border border-slate-200/80 bg-[#eef2fc]/80 pl-11 pr-4 text-sm text-[#222] shadow-sm outline-none transition placeholder:text-[#9ca0a8] focus:border-[#55ace7] focus:bg-white focus:ring-2 focus:ring-[#55ace7]/25"
        />
      </div>
      <div className="flex w-full flex-wrap gap-2.5 sm:w-auto sm:flex-nowrap">
        <FilterSelect
          label="Center"
          value={center}
          onChange={onCenterChange}
          options={[
            { value: 'all', label: 'Center' },
            { value: 'New Delhi', label: 'New Delhi' },
            { value: 'Hyderabad', label: 'Hyderabad' },
            { value: 'Pune', label: 'Pune' },
          ]}
        />
        <CrmDateFilterPicker value={selectedDate} onChange={onDateChange} />
        <FilterSelect
          label="Type"
          value={type}
          onChange={onTypeChange}
          options={[
            { value: 'all', label: 'Type' },
            { value: 'Admission', label: 'Admission' },
            { value: 'Demo', label: 'Demo' },
          ]}
        />
        <FilterSelect
          label="Source Page"
          value={sourcePage}
          onChange={onSourcePageChange}
          options={[
            { value: 'all', label: 'Source Page' },
            ...ENQUIRY_SOURCE_PAGE_OPTIONS.map((page) => ({
              value: page,
              label: page,
            })),
          ]}
        />
      </div>
    </div>
  )
}
