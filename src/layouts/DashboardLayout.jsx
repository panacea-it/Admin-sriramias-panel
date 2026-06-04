import { Suspense, useCallback, useEffect, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import LoadingState from '../components/feedback/LoadingState'
import RouteErrorBoundary from '../components/feedback/RouteErrorBoundary'
import Sidebar from '../components/layout/Sidebar'
import Header from '../components/layout/Header'

export default function DashboardLayout() {
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(
    typeof window !== 'undefined' ? window.innerWidth < 1024 : false,
  )

  const closeSidebar = useCallback(() => setSidebarOpen(false), [])
  const toggleSidebar = useCallback(() => setSidebarOpen((v) => !v), [])

  useEffect(() => {
    const onResize = () => {
      const mobile = window.innerWidth < 1024
      setIsMobile(mobile)
      if (mobile) setSidebarOpen(false)
    }
    onResize()
    window.addEventListener('resize', onResize, { passive: true })
    return () => window.removeEventListener('resize', onResize)
  }, [])

  useEffect(() => {
    document.documentElement.classList.add('dashboard-layout-active')
    return () => document.documentElement.classList.remove('dashboard-layout-active')
  }, [])

  useEffect(() => {
    if (!isMobile || !sidebarOpen) return undefined
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [isMobile, sidebarOpen])

  return (
    <div
      className="app-shell flex h-full w-full overflow-hidden bg-[#f7f7f7] text-[#111111]"
      style={{ fontFamily: "'Poppins', 'Inter', sans-serif" }}
    >
      <Sidebar isOpen={sidebarOpen} isMobile={isMobile} onClose={closeSidebar} />

      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden lg:pl-[272px]">
        <Header onMenuClick={toggleSidebar} />

        <main className="admin-main-scroll min-h-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-contain bg-[#f7f7f7]">
          <Suspense fallback={<LoadingState message="Loading page..." className="m-6" />}>
            <RouteErrorBoundary resetKey={location.pathname}>
              <Outlet />
            </RouteErrorBoundary>
          </Suspense>
        </main>
      </div>
    </div>
  )
}
