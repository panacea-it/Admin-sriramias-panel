import SearchableSelect from '../categories/SearchableSelect'
import { cn } from '../../utils/cn'
import { getLeadStatusChipClass } from './EnquiryTableSelect'

export default function EnquiryLeadStatusSelect({
  value,
  onChange,
  options,
  placeholder = 'Select Status',
  className,
  disabled = false,
  size = 'compact',
}) {
  const chipClass = getLeadStatusChipClass(value)
  const isCompact = size === 'compact'

  return (
    <div className={cn('w-full', isCompact ? 'min-w-[148px] max-w-[168px]' : 'max-w-none', className)}>
      <SearchableSelect
        value={value}
        onChange={onChange}
        options={options}
        placeholder={placeholder}
        emptyMessage="No statuses found"
        disabled={disabled}
        triggerClassName={cn(
          'flex w-full items-center justify-between rounded-lg border px-3 text-left font-semibold shadow-sm outline-none transition',
          'hover:shadow-md focus:ring-2 focus:ring-[#55ace7]/25',
          isCompact ? 'h-9 text-xs' : 'h-11 text-sm',
          chipClass,
        )}
        listClassName="max-h-60"
      />
    </div>
  )
}
