import { Link } from 'react-router-dom'
import { ChevronRight, Wallet } from 'lucide-react'
import { FINANCE_BASE } from '../../constants/financeNav'
import { cn } from '../../utils/cn'

export default function FinanceBreadcrumbs({ items = [], className }) {
  const crumbs = [{ label: 'Finance', path: `${FINANCE_BASE}/dashboard`, icon: Wallet }, ...items]

  return (
    <nav
      aria-label="Finance breadcrumb"
      className={cn(
        'flex flex-wrap items-center gap-1 rounded-lg border border-[#55ace7]/20 bg-[#eef6fc] px-3 py-2 text-xs sm:text-sm',
        className,
      )}
    >
      {crumbs.map((item, idx) => {
        const isLast = idx === crumbs.length - 1
        const Icon = item.icon
        return (
          <span key={item.path || item.label} className="inline-flex items-center gap-1">
            {idx > 0 && <ChevronRight className="h-3.5 w-3.5 shrink-0 text-[#9ca0a8]" aria-hidden />}
            {isLast ? (
              <span className="font-semibold text-[#246392]" aria-current="page">
                {Icon && <Icon className="mr-1 inline h-3.5 w-3.5" aria-hidden />}
                {item.label}
              </span>
            ) : (
              <Link
                to={item.path}
                className="font-medium text-[#686868] transition hover:text-[#246392]"
              >
                {Icon && idx === 0 && <Icon className="mr-1 inline h-3.5 w-3.5" aria-hidden />}
                {item.label}
              </Link>
            )}
          </span>
        )
      })}
    </nav>
  )
}
