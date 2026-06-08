import { NavLink } from 'react-router-dom'
import { cn } from '../../utils/cn'

const ROUTE_TABS = [
  { label: 'Main', path: '/academics/categories', end: true },
  { label: 'Subject', path: '/academics/categories/subject', end: true },
]

export default function CategoryRouteTabs() {
  return (
    <nav
      className="flex flex-wrap gap-2 sm:gap-2.5"
      aria-label="Category sections"
    >
      {ROUTE_TABS.map((tab) => (
        <NavLink
          key={tab.path}
          to={tab.path}
          end={tab.end ?? false}
          className={({ isActive }) =>
            cn(
              'inline-flex min-h-[40px] items-center justify-center rounded-lg px-4 py-2 text-sm font-semibold transition-all duration-200 sm:px-5 sm:text-[15px]',
              isActive
                ? 'scale-[1.02] bg-gradient-to-r from-[#55ace7] to-[#246392] text-white shadow-[0_4px_14px_rgba(36,99,146,0.35)]'
                : 'bg-white text-[#222] shadow-[0_4px_12px_rgba(15,23,42,0.08)] hover:scale-[1.02] hover:shadow-[0_6px_16px_rgba(15,23,42,0.1)]',
            )
          }
        >
          {tab.label}
        </NavLink>
      ))}
    </nav>
  )
}
