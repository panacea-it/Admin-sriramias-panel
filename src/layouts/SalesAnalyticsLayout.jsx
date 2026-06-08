import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import LeadDashboardPage from '../pages/sales-analytics/LeadDashboardPage'
import UserJourneyTrackingPage from '../pages/sales-analytics/UserJourneyTrackingPage'
import LeadManagementPage from '../pages/sales-analytics/LeadManagementPage'
import ConversionFunnelPage from '../pages/sales-analytics/ConversionFunnelPage'
import SourceAnalyticsPage from '../pages/sales-analytics/SourceAnalyticsPage'
import CounselorPerformancePage from '../pages/sales-analytics/CounselorPerformancePage'
import FollowUpManagerPage from '../pages/sales-analytics/FollowUpManagerPage'
import PaymentFailureTrackingPage from '../pages/sales-analytics/PaymentFailureTrackingPage'
import ReportsExportsPage from '../pages/sales-analytics/ReportsExportsPage'
import TrackingConfigurationPage from '../pages/sales-analytics/TrackingConfigurationPage'
import RoleRoute from '../routes/RoleRoute'
import { ROLES } from '../constants/roles'
import NestedRouteRedirect from '../components/feedback/NestedRouteRedirect'
import RouteErrorBoundary from '../components/feedback/RouteErrorBoundary'

export default function SalesAnalyticsLayout() {
  const location = useLocation()

  return (
    <div className="figma-admin-section min-h-screen bg-[#f7f7f7] px-4 pb-8 pt-6 sm:px-5 lg:px-6">
      <section className="mx-auto max-w-screen-2xl">
        <RouteErrorBoundary resetKey={location.pathname}>
          <Routes>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<LeadDashboardPage />} />
            <Route path="journey" element={<UserJourneyTrackingPage />} />
            <Route path="leads" element={<LeadManagementPage />} />
            <Route path="funnel" element={<ConversionFunnelPage />} />
            <Route path="sources" element={<SourceAnalyticsPage />} />
            <Route path="counselors" element={<CounselorPerformancePage />} />
            <Route path="follow-ups" element={<FollowUpManagerPage />} />
            <Route path="payment-failures" element={<PaymentFailureTrackingPage />} />
            <Route path="reports" element={<ReportsExportsPage />} />
            <Route
              path="configuration"
              element={
                <RoleRoute allowedRoles={[ROLES.SUPER_ADMIN]}>
                  <TrackingConfigurationPage />
                </RoleRoute>
              }
            />
            <Route path="*" element={<NestedRouteRedirect defaultSegment="dashboard" />} />
          </Routes>
        </RouteErrorBoundary>
      </section>
    </div>
  )
}
