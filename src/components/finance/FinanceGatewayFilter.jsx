import { cn } from '../../utils/cn'
import { FINANCE_PAYMENT_GATEWAYS } from '../../constants/financeConstants'

const SELECT_CLASS =
  'h-10 w-full min-w-0 rounded-lg border border-slate-200 bg-white px-3 text-sm focus:border-[#55ace7] focus:ring-2 focus:ring-[#55ace7]/20'

export default function FinanceGatewayFilter({ value = 'all', onChange, className, id = 'gateway-filter' }) {
  return (
    <select
      id={id}
      value={value}
      onChange={onChange}
      aria-label="Payment gateway"
      className={cn(SELECT_CLASS, className)}
    >
      {FINANCE_PAYMENT_GATEWAYS.map((g) => (
        <option key={g.value} value={g.value}>
          {g.label}
        </option>
      ))}
    </select>
  )
}
