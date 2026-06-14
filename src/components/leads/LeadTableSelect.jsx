import { ChevronDown } from 'lucide-react'
import { cn } from '../../utils/cn'

export default function LeadTableSelect({
  value,
  onChange,
  options,
  ariaLabel,
  className,
  compact = false,
  placeholder,
}) {
  const isPlaceholder = !value && placeholder

  return (
    <div
      className={cn(
        'relative inline-flex w-full',
        compact ? 'min-w-[120px] max-w-[150px]' : 'min-w-[140px] max-w-[200px]',
        className,
      )}
    >
      <select
        value={value}
        onChange={onChange}
        aria-label={ariaLabel}
        className={cn(
          'h-9 w-full cursor-pointer appearance-none rounded-lg border border-slate-200/90 bg-white pl-3 pr-8 text-xs font-semibold shadow-sm outline-none transition',
          'hover:border-[#55ace7]/50 focus:border-[#55ace7] focus:ring-2 focus:ring-[#55ace7]/25',
          compact ? 'text-[11px]' : 'text-xs',
          isPlaceholder ? 'text-[#8b98bb]' : 'text-[#1a3a5c]',
        )}
      >
        {options.map((opt) => (
          <option
            key={opt.value}
            value={opt.value}
            disabled={opt.disabled}
            className="bg-white text-[#222]"
          >
            {opt.label}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#246392]" />
    </div>
  )
}
