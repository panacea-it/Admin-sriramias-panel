import { ChevronDown } from 'lucide-react'
import { cn } from '../../utils/cn'

const STATUS_CHIP_STYLES = {
  NEW: 'border-[#55ace7]/40 bg-[#eef6fc] text-[#246392]',
  ASSIGNED: 'border-indigo-200 bg-indigo-50 text-indigo-700',
  CONTACT_ATTEMPTED: 'border-amber-200 bg-amber-50 text-amber-800',
  CONTACTED: 'border-cyan-200 bg-cyan-50 text-cyan-800',
  FOLLOW_UP: 'border-violet-200 bg-violet-50 text-violet-800',
  INTERESTED: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  NOT_INTERESTED: 'border-red-200 bg-red-50 text-red-700',
  INFO_SHARED: 'border-teal-200 bg-teal-50 text-teal-800',
  MEETING_SCHEDULED: 'border-purple-200 bg-purple-50 text-purple-800',
  MEETING_COMPLETED: 'border-green-200 bg-green-50 text-green-800',
  NEGOTIATION: 'border-orange-200 bg-orange-50 text-orange-800',
  VERIFICATION_IN_PROGRESS: 'border-yellow-200 bg-yellow-50 text-yellow-800',
  APPROVED: 'border-lime-200 bg-lime-50 text-lime-800',
  CONVERTED: 'border-emerald-300 bg-emerald-100 text-emerald-900',
  ON_HOLD: 'border-slate-200 bg-slate-100 text-slate-700',
  LOST: 'border-rose-200 bg-rose-50 text-rose-700',
  DUPLICATE: 'border-slate-200 bg-slate-50 text-slate-600',
  CLOSED: 'border-slate-300 bg-slate-100 text-slate-800',
  SENT: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  UNSENT: 'border-[#55ace7]/40 bg-[#eef6fc] text-[#246392]',
  IN_PROGRESS: 'border-amber-200 bg-amber-50 text-amber-800',
}

export function getLeadStatusChipClass(status) {
  if (!status) return 'border-slate-200/90 bg-white text-[#8b98bb]'
  return STATUS_CHIP_STYLES[status] ?? 'border-slate-200 bg-white text-[#1a3a5c]'
}

export default function EnquiryTableSelect({
  value,
  onChange,
  options,
  ariaLabel,
  className,
  compact = false,
  variant = 'default',
}) {
  const isStatus = variant === 'status'
  const chipClass = isStatus ? getLeadStatusChipClass(value) : ''

  return (
    <div
      className={cn(
        'relative inline-flex w-full transition-all duration-200',
        compact ? 'min-w-[120px] max-w-[160px]' : 'min-w-[140px] max-w-[200px]',
        isStatus && 'max-w-[210px]',
        className,
      )}
    >
      <select
        value={value}
        onChange={onChange}
        aria-label={ariaLabel}
        className={cn(
          'h-9 w-full cursor-pointer appearance-none rounded-lg border pl-3 pr-8 text-xs font-semibold shadow-sm outline-none transition-all duration-200',
          'hover:shadow-md focus:ring-2 focus:ring-[#55ace7]/25',
          compact ? 'text-[11px]' : 'text-xs',
          isStatus
            ? cn('focus:border-[#55ace7]', chipClass)
            : 'border-slate-200/90 bg-white text-[#1a3a5c] hover:border-[#55ace7]/50 focus:border-[#55ace7]',
        )}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value} className="bg-white text-[#222]">
            {opt.label}
          </option>
        ))}
      </select>
      <ChevronDown
        className={cn(
          'pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 transition-transform duration-200',
          isStatus ? 'text-current opacity-70' : 'text-[#246392]',
        )}
      />
    </div>
  )
}
