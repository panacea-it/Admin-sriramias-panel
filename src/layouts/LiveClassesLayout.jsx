import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { LiveClassesProvider } from '../contexts/LiveClassesContext'
import ScheduleClassPage from '../pages/academics/live-classes/ScheduleClassPage'
import RecordedClassesPage from '../pages/academics/live-classes/RecordedClassesPage'
import LiveSessionsPage from '../pages/academics/live-classes/LiveSessionsPage'
import CalendarViewPage from '../pages/academics/live-classes/CalendarViewPage'
import LiveClassDetailPage from '../pages/academics/live-classes/LiveClassDetailPage'
import NestedRouteRedirect from '../components/feedback/NestedRouteRedirect'
import RouteErrorBoundary from '../components/feedback/RouteErrorBoundary'

export default function LiveClassesLayout() {
  const location = useLocation()

  return (
    <LiveClassesProvider>
      <RouteErrorBoundary resetKey={location.pathname}>
        <Routes>
          <Route index element={<Navigate to="schedule" replace />} />
          <Route path="schedule" element={<ScheduleClassPage />} />
          <Route path="recordings" element={<RecordedClassesPage />} />
          <Route path="live-sessions" element={<LiveSessionsPage />} />
          <Route path="calendar" element={<CalendarViewPage />} />
          <Route path=":id" element={<LiveClassDetailPage />} />
          <Route path="*" element={<NestedRouteRedirect defaultSegment="schedule" />} />
        </Routes>
      </RouteErrorBoundary>
    </LiveClassesProvider>
  )
}
