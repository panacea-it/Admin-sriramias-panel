import { Link } from 'react-router-dom'
import { ArrowLeft, ClipboardList } from 'lucide-react'
import { FINANCE_ROUTES } from '../../../constants/financeNav'
import { cn } from '../../../utils/cn'

export default function PaymentAttemptBackNav({ className }) {
  return (
    <Link
      to={FINANCE_ROUTES.attempts}
      className={cn(
        'inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-[#246392] shadow-sm transition hover:bg-[#eef6fc] hover:text-[#1a4d73]',
        className,
      )}
    >
      <ArrowLeft className="h-4 w-4 shrink-0" strokeWidth={2.5} />
      <ClipboardList className="h-4 w-4 shrink-0 text-[#686868]" strokeWidth={2.5} />
      <span>Back to Payment Attempt Logs</span>
    </Link>
  )
}
