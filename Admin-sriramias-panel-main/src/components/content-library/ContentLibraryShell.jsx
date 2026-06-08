import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { FolderOpen } from 'lucide-react'
import { cn } from '../../utils/cn'
import { CONTENT_LIBRARY_ROUTE_TABS } from '../../constants/contentLibraryNav'
import { contentLibraryTw } from '../../constants/contentLibraryTheme'
import PageBanner from '../figma/PageBanner'

export default function ContentLibraryShell({ bannerActions }) {
  const location = useLocation()

  return (
    <div className="figma-admin-section min-h-full bg-[#f7f7f7] px-4 pb-8 pt-6 sm:px-5 lg:px-6">
      <section className="mx-auto max-w-screen-2xl space-y-5 sm:space-y-6">
        <PageBanner
          icon={FolderOpen}
          iconClassName="text-[#246392]"
          title="Content Library"
          className={contentLibraryTw.statGradient}
        >
          {bannerActions}
        </PageBanner>

        <nav
          className="sticky top-0 z-20 -mx-1 flex gap-2 overflow-x-auto rounded-2xl border border-white/60 bg-white/80 p-2 shadow-[0_8px_24px_rgba(15,23,42,0.06)] backdrop-blur-md scrollbar-thin sm:gap-2.5 sm:p-2.5"
          aria-label="Content library sections"
        >
          {CONTENT_LIBRARY_ROUTE_TABS.map((tab) => {
            const isActive =
              location.pathname === tab.path ||
              location.pathname.startsWith(`${tab.path}/`)
            const Icon = tab.icon
            return (
              <NavLink
                key={tab.id}
                to={tab.path}
                className={cn(
                  'inline-flex shrink-0 min-h-[40px] items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold transition-all duration-200 sm:gap-2 sm:px-4 sm:text-sm',
                  isActive ? contentLibraryTw.tabActive : contentLibraryTw.tabIdle,
                )}
              >
                {Icon && <Icon className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" strokeWidth={2} />}
                {tab.label}
              </NavLink>
            )
          })}
        </nav>

        <Outlet />
      </section>
    </div>
  )
}
