import SearchableSelect from '../categories/SearchableSelect'
import { cn } from '../../utils/cn'
import { getLeadStatusChipClass } from './EnquiryTableSelect'

const TABLE_TRIGGER_BASE = cn(
  'flex w-full items-center justify-between rounded-lg border pl-3 pr-9 text-left text-xs font-semibold leading-normal shadow-sm outline-none transition',
  'hover:border-[#55ace7]/50 focus:border-[#55ace7] focus:ring-2 focus:ring-[#55ace7]/25',
)

const MODAL_TRIGGER_BASE = cn(
  'flex h-11 w-full items-center justify-between rounded-xl border px-4 text-left text-sm font-medium shadow-sm outline-none transition',
  'hover:border-[#55ace7]/50 focus:border-[#55ace7] focus:bg-white focus:ring-2 focus:ring-[#55ace7]/25',
)

export default function EnquiryLeadStatusSelect({
  value,
  onChange,
  options,
  placeholder = 'Select Status',
  className,
  disabled = false,
  size = 'compact',
  usePortal = true,
  ariaLabel,
}) {
  const chipClass = getLeadStatusChipClass(value)
  const isCompact = size === 'compact'
  const isPlaceholder = !value

  return (
    <div className={cn('w-full', className)}>
      <SearchableSelect
        value={value}
        onChange={onChange}
        options={options}
        placeholder={placeholder}
        emptyMessage="No statuses found"
        disabled={disabled}
        usePortal={usePortal}
        maxMenuHeight={280}
        triggerClassName={cn(
          isCompact ? TABLE_TRIGGER_BASE : MODAL_TRIGGER_BASE,
          isCompact ? 'h-9' : 'h-11',
          isCompact
            ? cn(chipClass, isPlaceholder && 'text-[#8b98bb]')
            : cn(
                chipClass,
                'bg-[#eef2fc]/60',
                isPlaceholder ? 'text-[#8b98bb]' : '',
              ),
        )}
        listClassName="max-h-[228px]"
      />
      {ariaLabel && <span className="sr-only">{ariaLabel}</span>}
    </div>
  )
}
