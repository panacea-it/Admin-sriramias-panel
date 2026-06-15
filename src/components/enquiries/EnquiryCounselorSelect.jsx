import SearchableSelect from '../categories/SearchableSelect'
import { cn } from '../../utils/cn'

const TABLE_TRIGGER = cn(
  'flex w-full items-center justify-between rounded-lg border border-slate-200/90 bg-white pl-3 pr-9 text-left text-xs font-semibold leading-normal shadow-sm outline-none transition',
  'hover:border-[#55ace7]/50 focus:border-[#55ace7] focus:ring-2 focus:ring-[#55ace7]/25',
)

const MODAL_TRIGGER = cn(
  'flex h-11 w-full items-center justify-between rounded-xl border border-slate-200/80 bg-[#eef2fc]/60 px-4 text-left text-sm font-medium text-[#222] shadow-sm outline-none transition',
  'hover:border-[#55ace7]/50 focus:border-[#55ace7] focus:bg-white focus:ring-2 focus:ring-[#55ace7]/25',
)

export default function EnquiryCounselorSelect({
  value,
  onChange,
  options,
  placeholder = 'Select Counselor',
  className,
  disabled = false,
  size = 'compact',
  usePortal = true,
  ariaLabel,
}) {
  const isCompact = size === 'compact'
  const isPlaceholder = !value

  return (
    <div className={cn('w-full', className)}>
      <SearchableSelect
        value={value}
        onChange={onChange}
        options={options}
        placeholder={placeholder}
        emptyMessage="No counselors found"
        disabled={disabled}
        usePortal={usePortal}
        maxMenuHeight={280}
        triggerClassName={cn(
          isCompact ? TABLE_TRIGGER : MODAL_TRIGGER,
          isCompact ? 'h-9' : 'h-11',
          isPlaceholder && isCompact && 'text-[#8b98bb]',
          !isPlaceholder && isCompact && 'text-[#1a3a5c]',
        )}
        listClassName="max-h-[228px]"
      />
      {ariaLabel && <span className="sr-only">{ariaLabel}</span>}
    </div>
  )
}
