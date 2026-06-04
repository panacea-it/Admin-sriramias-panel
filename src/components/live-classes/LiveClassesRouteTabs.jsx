import { NavLink } from 'react-router-dom'
import { cn } from '../../utils/cn'
import { LIVE_CLASSES_ROUTE_TABS } from '../../constants/liveClassesNav'
import { liveClassesTw } from '../../constants/liveClassesTheme'

export default function LiveClassesRouteTabs() {
  return (
    <nav className="flex flex-wrap gap-2 sm:gap-2.5" aria-label="Live classes sections">
      {LIVE_CLASSES_ROUTE_TABS.map((tab) => (
        <NavLink
          key={tab.path}
          to={tab.path}
          end
          className={({ isActive }) =>
            cn(
              'inline-flex min-h-[40px] items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-all duration-200 sm:px-5 sm:text-[15px]',
              isActive ? liveClassesTw.tabActive : liveClassesTw.tabIdle,
            )
          }
        >
          {tab.icon && <tab.icon className="h-4 w-4 shrink-0" strokeWidth={2} />}
          {tab.label}
        </NavLink>
      ))}
    </nav>
  )
}
