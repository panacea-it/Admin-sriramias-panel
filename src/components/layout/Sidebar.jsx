import { useCallback, useEffect, useRef, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { cn } from '../../utils/cn'
import {
  SIDEBAR_DASHBOARD,
  getGroupIdForPath,
  getSubmenuIdForPath,
  isNavItemActive,
} from '../../constants/navigation'
import { usePermissions } from '../../hooks/usePermissions'
import AccordionSidebarSection from './sidebar/AccordionSidebarSection'

const groupShell = 'rounded-xl bg-[#2d2f58]'
const salesModuleShell =
  'rounded-xl bg-gradient-to-br from-[#1a2f4a] to-[#2d4a6f] ring-1 ring-[#55ace7]/35 shadow-[0_4px_20px_rgba(85,172,231,0.12)]'
const bookstoreModuleShell =
  'rounded-xl bg-gradient-to-br from-[#2a1f4a] to-[#4a3d8f] ring-1 ring-[#9b7ed9]/35 shadow-[0_4px_20px_rgba(124,92,191,0.15)]'
const childActive = 'rounded-lg bg-[#1e2145] text-white'
const childIdle = 'rounded-lg text-white/90 hover:bg-white/[0.06] hover:text-white'

function scrollElementIntoSidebarView(container, element) {
  if (!container || !element) return
  requestAnimationFrame(() => {
    const containerRect = container.getBoundingClientRect()
    const elementRect = element.getBoundingClientRect()
    const padding = 12

    if (elementRect.bottom > containerRect.bottom - padding) {
      container.scrollTop += elementRect.bottom - containerRect.bottom + padding
    } else if (elementRect.top < containerRect.top + padding) {
      container.scrollTop -= containerRect.top + padding - elementRect.top
    }
  })
}

function SubNavLink({ to, label, onNavigate, end = false }) {
  return (
    <NavLink
      to={to}
      onClick={onNavigate}
      end={end}
      className={({ isActive }) =>
        cn(
          'block px-4 py-2.5 text-[13px] font-medium leading-snug transition-colors duration-150',
          isActive ? childActive : childIdle,
        )
      }
    >
      {label}
    </NavLink>
  )
}

function NavGroup({ group, isOpen, onToggle, onNavigate, onExpand }) {
  const groupRef = useRef(null)
  const { label, icon: Icon, children, moduleType } = group
  const shellClass =
    moduleType === 'sales-analytics'
      ? salesModuleShell
      : moduleType === 'bookstore'
        ? bookstoreModuleShell
        : groupShell
  const location = useLocation()
  const routeSubmenuId = getSubmenuIdForPath(location.pathname)
  const [openSubmenuId, setOpenSubmenuId] = useState(routeSubmenuId)

  useEffect(() => {
    if (routeSubmenuId) setOpenSubmenuId(routeSubmenuId)
  }, [routeSubmenuId])

  useEffect(() => {
    if (isOpen && groupRef.current) {
      onExpand?.(groupRef.current)
    }
  }, [isOpen, onExpand])

  const visibleChildren = children
  const hasActiveChild = visibleChildren.some((c) =>
    isNavItemActive(c, location.pathname),
  )

  const handleGroupToggle = () => {
    const willOpen = !isOpen
    onToggle()
    if (willOpen && groupRef.current) {
      setTimeout(() => onExpand?.(groupRef.current), 320)
    }
  }

  const toggleSubmenu = (id) => {
    setOpenSubmenuId((prev) => (prev === id ? null : id))
  }

  if (!isOpen) {
    return (
      <div ref={groupRef} data-nav-group={group.id}>
        <button
          type="button"
          onClick={handleGroupToggle}
          className={cn(
            'flex w-full min-h-[44px] items-center gap-3 rounded-xl px-3.5 py-2.5 text-left text-[14px] font-semibold text-white transition-colors',
            hasActiveChild ? shellClass : 'hover:bg-white/[0.05]',
          )}
        >
          <Icon className="h-[18px] w-[18px] shrink-0" strokeWidth={2} />
          <span className="min-w-0 flex-1 truncate">{label}</span>
          {moduleType === 'sales-analytics' && (
            <span className="shrink-0 rounded-md bg-[#55ace7]/25 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-[#a8d4f0]">
              CRM
            </span>
          )}
          {moduleType === 'bookstore' && (
            <span className="shrink-0 rounded-md bg-[#9b7ed9]/25 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-[#e8dff8]">
              Shop
            </span>
          )}
          <ChevronDown className="h-4 w-4 shrink-0 opacity-90" strokeWidth={2.5} />
        </button>
      </div>
    )
  }

  return (
    <div ref={groupRef} data-nav-group={group.id} className={cn(shellClass, 'py-1')}>
      <button
        type="button"
        onClick={handleGroupToggle}
        className="flex w-full min-h-[44px] items-center gap-3 px-3.5 py-2.5 text-left text-[14px] font-semibold text-white"
      >
        <Icon className="h-[18px] w-[18px] shrink-0" strokeWidth={2} />
        <span className="min-w-0 flex-1 truncate">{label}</span>
        {moduleType === 'sales-analytics' && (
          <span className="shrink-0 rounded-md bg-[#55ace7]/25 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-[#a8d4f0]">
            CRM
          </span>
        )}
        {moduleType === 'bookstore' && (
          <span className="shrink-0 rounded-md bg-[#9b7ed9]/25 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-[#e8dff8]">
            Shop
          </span>
        )}
        <ChevronUp className="h-4 w-4 shrink-0 opacity-90" strokeWidth={2.5} />
      </button>
      <div className="flex flex-col gap-0.5 px-2 pb-2 pt-0">
        {visibleChildren.map((child) =>
          child.children ? (
            <AccordionSidebarSection
              key={child.id}
              submenu={child}
              isOpen={openSubmenuId === child.id}
              onToggle={() => toggleSubmenu(child.id)}
              onNavigate={onNavigate}
              onExpand={onExpand}
            />
          ) : (
            <SubNavLink
              key={child.path}
              to={child.path}
              label={child.label}
              onNavigate={onNavigate}
              end={
                !child.path.includes('/academics/batch') &&
                !child.path.startsWith('/academics/live-classes') &&
                !child.path.startsWith('/academics/content-library') &&
                !child.path.startsWith('/finance/') &&
                !child.path.startsWith('/sales-analytics/') &&
                !child.path.startsWith('/admin/bookstore/') &&
                !child.path.startsWith('/admin/rewards/') &&
                !child.path.startsWith('/student/') &&
                !child.path.startsWith('/test-management/test-configuration') &&
                !child.path.startsWith('/test-management/omr')
              }
            />
          ),
        )}
      </div>
    </div>
  )
}

export default function Sidebar({ isOpen, isMobile, onClose }) {
  const location = useLocation()
  const { sidebarGroups, showDashboard } = usePermissions()
  const routeGroupId = getGroupIdForPath(location.pathname, sidebarGroups)
  const [openGroupId, setOpenGroupId] = useState(routeGroupId)
  const [prevRouteGroupId, setPrevRouteGroupId] = useState(routeGroupId)
  const navScrollRef = useRef(null)

  if (routeGroupId !== prevRouteGroupId) {
    setPrevRouteGroupId(routeGroupId)
    if (routeGroupId) setOpenGroupId(routeGroupId)
  }

  const handleNavigate = isMobile ? onClose : undefined

  const scrollIntoView = useCallback((element) => {
    scrollElementIntoSidebarView(navScrollRef.current, element)
  }, [])

  const toggleGroup = (id) => {
    setOpenGroupId((prev) => (prev === id ? null : id))
  }

  useEffect(() => {
    if (!routeGroupId || !navScrollRef.current) return
    const el = navScrollRef.current.querySelector(`[data-nav-group="${routeGroupId}"]`)
    if (el) scrollElementIntoSidebarView(navScrollRef.current, el)
  }, [location.pathname, routeGroupId])

  const handleNavWheel = (e) => {
    e.stopPropagation()
  }

  return (
    <>
      {isMobile && isOpen && (
        <button
          type="button"
          aria-label="Close sidebar"
          className="fixed inset-0 z-40 bg-slate-950/50 backdrop-blur-[1px] lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={cn(
          'z-50 flex flex-col overflow-hidden bg-[#05092b] text-white shadow-[0_12px_40px_rgba(0,0,0,0.35)] transition-transform duration-300 ease-out',
          isMobile
            ? 'fixed left-4 top-4 bottom-4 w-[min(100%,288px)] rounded-2xl'
            : 'fixed inset-y-0 left-0 h-[100dvh] max-h-[100dvh] w-[var(--sidebar-width)] min-w-[260px] max-w-[288px] rounded-tr-[20px] rounded-br-[20px]',
          isMobile && !isOpen && '-translate-x-[calc(100%+2rem)]',
          !isMobile && 'translate-x-0',
        )}
        style={{ fontFamily: "'Poppins', 'Inter', sans-serif" }}
        onWheel={handleNavWheel}
      >
        <nav
          ref={navScrollRef}
          aria-label="Main navigation"
          className="sidebar-nav-scroll custom-scrollbar flex flex-col gap-1.5 px-3 py-7 sm:px-3.5"
        >
          {showDashboard && (
            <NavLink
              to={SIDEBAR_DASHBOARD.path}
              onClick={handleNavigate}
              end
              className={({ isActive }) =>
                cn(
                  'flex min-h-[44px] shrink-0 items-center gap-3 rounded-xl px-3.5 py-2.5 text-[14px] font-semibold transition-colors duration-150',
                  isActive ? groupShell : 'text-white hover:bg-white/[0.05]',
                )
              }
            >
              <SIDEBAR_DASHBOARD.icon className="h-[18px] w-[18px] shrink-0" strokeWidth={2} />
              <span>{SIDEBAR_DASHBOARD.label}</span>
            </NavLink>
          )}

          {sidebarGroups.map((group) => (
            <NavGroup
              key={group.id}
              group={group}
              isOpen={openGroupId === group.id}
              onToggle={() => toggleGroup(group.id)}
              onNavigate={handleNavigate}
              onExpand={scrollIntoView}
            />
          ))}
        </nav>
      </aside>
    </>
  )
}
