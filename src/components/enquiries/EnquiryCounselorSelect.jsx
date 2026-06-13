import SearchableSelect from '../categories/SearchableSelect'
import { cn } from '../../utils/cn'

export default function EnquiryCounselorSelect({
  value,
  onChange,
  options,
  placeholder = 'Select counselor',
  className,
  disabled = false,
  size = 'compact',
}) {
  const isCompact = size === 'compact'

  return (
    <div className={cn('w-full', isCompact ? 'min-w-[148px] max-w-[168px]' : 'max-w-none', className)}>
      <SearchableSelect
        value={value}
        onChange={onChange}
        options={options}
        placeholder={placeholder}
        emptyMessage="No counselors found"
        disabled={disabled}
        triggerClassName={cn(
          'flex w-full items-center justify-between rounded-lg border border-slate-200/90 bg-white px-3 text-left font-semibold text-[#1a3a5c] shadow-sm outline-none transition',
          'hover:border-[#55ace7]/50 hover:shadow-md focus:ring-2 focus:ring-[#55ace7]/25',
          isCompact ? 'h-9 text-xs' : 'h-11 text-sm',
        )}
      />
    </div>
  )
}
