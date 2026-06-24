import { Search, ChevronDown } from 'lucide-react'
import { PAYMENT_FAILURE_CATEGORIES } from '../../../constants/paymentAttemptConstants'
import { cn } from '../../../utils/cn'

const GATEWAY_OPTIONS = [
  { value: 'all', label: 'All gateways' },
  { value: 'Razorpay', label: 'Razorpay' },
  { value: 'Cashfree', label: 'Cashfree' },
  { value: 'PayU', label: 'PayU' },
]

const COUNSELOR_ASSIGNMENT_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'assigned', label: 'Assigned Counselor' },
  { value: 'unassigned', label: 'Unassigned Counselor' },
]

function FilterSelect({ label, value, onChange, options, disabled }) {
  return (
    <div className="relative w-full sm:w-auto sm:min-w-[150px]">
      <select
        value={value}
        onChange={onChange}
        aria-label={label}
        disabled={disabled}
        className={cn(
          'h-10 w-full min-h-[38px] appearance-none rounded-lg border-0 bg-[#55ace7] pl-4 pr-9 text-sm font-semibold text-white outline-none focus:ring-2 focus:ring-[#246392]/50 disabled:opacity-60 sm:text-base',
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

function DateInput({ label, value, onChange, disabled }) {
  return (
    <input
      type="date"
      value={value}
      onChange={onChange}
      aria-label={label}
      disabled={disabled}
      className="h-10 w-full min-h-[38px] rounded-lg border border-slate-200 bg-white px-3 text-sm text-[#222] outline-none focus:border-[#55ace7] focus:ring-2 focus:ring-[#55ace7]/20 disabled:opacity-60 sm:min-w-[150px] sm:w-auto"
    />
  )
}

export default function PaymentAttemptFilters({
  search,
  onSearchChange,
  gatewayFilter,
  onGatewayChange,
  failureFilter,
  onFailureChange,
  counselorAssignmentFilter,
  onCounselorAssignmentChange,
  dateFrom,
  onDateFromChange,
  dateTo,
  onDateToChange,
  disabled = false,
  className,
}) {
  const failureOptions = [
    { value: 'all', label: 'All failure reasons' },
    ...PAYMENT_FAILURE_CATEGORIES.map((c) => ({ value: c, label: c })),
  ]

  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex min-h-14 flex-wrap items-center justify-between gap-3 rounded-lg bg-white px-3 py-2 shadow-[0_8px_20px_rgba(15,23,42,0.08)] sm:px-4">
        <div className="relative w-full min-w-0 flex-1 sm:max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-[#687180] sm:left-4" />
          <input
            type="search"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search by attempt ID, student, mobile, or email…"
            disabled={disabled}
            className="h-10 w-full min-h-[38px] rounded-lg bg-[#eef2fc] pl-10 pr-3 text-sm text-[#222] outline-none placeholder:text-[#9ca0a8] focus:ring-2 focus:ring-[#55ace7] disabled:opacity-60 sm:pl-11 sm:text-base"
          />
        </div>
        <div className="flex w-full flex-wrap gap-2 sm:w-auto">
          <FilterSelect
            label="Gateway"
            value={gatewayFilter}
            onChange={(e) => onGatewayChange(e.target.value)}
            options={GATEWAY_OPTIONS}
            disabled={disabled}
          />
          <FilterSelect
            label="Failure reason"
            value={failureFilter}
            onChange={(e) => onFailureChange(e.target.value)}
            options={failureOptions}
            disabled={disabled}
          />
          <FilterSelect
            label="Counselor assignment"
            value={counselorAssignmentFilter}
            onChange={(e) => onCounselorAssignmentChange(e.target.value)}
            options={COUNSELOR_ASSIGNMENT_OPTIONS}
            disabled={disabled}
          />
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-semibold uppercase tracking-wide text-[#686868]">Date range</span>
        <DateInput label="From date" value={dateFrom} onChange={(e) => onDateFromChange(e.target.value)} disabled={disabled} />
        <span className="text-sm text-[#686868]">to</span>
        <DateInput label="To date" value={dateTo} onChange={(e) => onDateToChange(e.target.value)} disabled={disabled} />
      </div>
    </div>
  )
}
