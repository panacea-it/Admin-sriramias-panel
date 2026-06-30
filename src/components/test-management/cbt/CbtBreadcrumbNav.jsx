import { Link } from 'react-router-dom'
import { ChevronRight, Home } from 'lucide-react'
import { TEST_MANAGEMENT_ROUTES } from '../../../constants/testManagementNav'
import { cn } from '../../../utils/cn'

export default function CbtBreadcrumbNav({ items = [], className }) {
  return (
    <nav
      className={cn('flex flex-wrap items-center gap-1 text-sm', className)}
      aria-label="Breadcrumb"
    >
      <Link
        to={TEST_MANAGEMENT_ROUTES.cbt}
        className="flex items-center gap-1 rounded px-1 py-0.5 text-slate-500 transition hover:bg-slate-100 hover:text-[#55ace7]"
      >
        <Home className="h-4 w-4 shrink-0" />
        <span className="hidden sm:inline">CBT Management</span>
      </Link>
      {items.map((item, idx) => (
        <span key={item.key || item.label} className="flex min-w-0 items-center gap-1">
          <ChevronRight className="h-4 w-4 shrink-0 text-slate-300" />
          {item.to ? (
            <Link
              to={item.to}
              className={cn(
                'max-w-[min(100%,280px)] truncate rounded px-1.5 py-0.5 font-medium transition sm:max-w-[320px]',
                idx === items.length - 1
                  ? 'bg-[#1a3a5c]/10 text-[#1a3a5c]'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-[#55ace7]',
              )}
              title={item.label}
            >
              {item.label}
            </Link>
          ) : (
            <span
              className={cn(
                'max-w-[min(100%,280px)] truncate rounded px-1.5 py-0.5 font-medium sm:max-w-[320px]',
                idx === items.length - 1 ? 'bg-[#1a3a5c]/10 text-[#1a3a5c]' : 'text-slate-600',
              )}
              title={item.label}
            >
              {item.label}
            </span>
          )}
        </span>
      ))}
    </nav>
  )
}
