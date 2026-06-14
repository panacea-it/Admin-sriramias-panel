import SearchableSelect from '../categories/SearchableSelect'
import { cn } from '../../utils/cn'
import { getLeadStatusChipClass } from '../enquiries/EnquiryTableSelect'

export default function LeadStatusSearchableSelect({
  value,
  onChange,
  options,
  placeholder = 'Select Status',
  loading = false,
  error,
  disabled = false,
}) {
  const chipClass = getLeadStatusChipClass(value)

  return (
    <SearchableSelect
      value={value}
      onChange={onChange}
      options={options}
      placeholder={placeholder}
      emptyMessage="No statuses found"
      loading={loading}
      error={error}
      disabled={disabled}
      triggerClassName={cn(
        'flex h-11 w-full items-center justify-between rounded-lg border px-4 text-left text-sm font-semibold shadow-sm outline-none transition',
        'hover:shadow-md focus:ring-2 focus:ring-[#55ace7]/25',
        chipClass,
      )}
      listClassName="max-h-60"
    />
  )
}
