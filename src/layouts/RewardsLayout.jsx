import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import NestedRouteRedirect from '../components/feedback/NestedRouteRedirect'
import RewardsTableSkeleton from '../components/rewards/RewardsTableSkeleton'

const RewardDashboardPage = lazy(() => import('../pages/rewards/admin/RewardDashboardPage'))
const RewardRulesPage = lazy(() => import('../pages/rewards/admin/RewardRulesPage'))
const StudentWalletsPage = lazy(() => import('../pages/rewards/admin/StudentWalletsPage'))
const ManualAdjustmentsPage = lazy(() => import('../pages/rewards/admin/ManualAdjustmentsPage'))
const RedemptionsPage = lazy(() => import('../pages/rewards/admin/RedemptionsPage'))
const LeaderboardsPage = lazy(() => import('../pages/rewards/admin/LeaderboardsPage'))
const BadgesPage = lazy(() => import('../pages/rewards/admin/BadgesPage'))
const FraudMonitoringPage = lazy(() => import('../pages/rewards/admin/FraudMonitoringPage'))
const RewardReportsPage = lazy(() => import('../pages/rewards/admin/RewardReportsPage'))
const RewardSettingsPage = lazy(() => import('../pages/rewards/admin/RewardSettingsPage'))

function PageFallback() {
  return (
    <div className="p-6">
      <RewardsTableSkeleton />
    </div>
  )
}

export default function RewardsLayout() {
  return (
    <div className="figma-admin-section min-h-screen bg-[#f7f7f7] px-4 pb-8 pt-6 sm:px-5 lg:px-6">
      <section className="mx-auto max-w-screen-2xl">
        <Suspense fallback={<PageFallback />}>
          <Routes>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<RewardDashboardPage />} />
            <Route path="rules" element={<RewardRulesPage />} />
            <Route path="wallets" element={<StudentWalletsPage />} />
            <Route path="adjustments" element={<ManualAdjustmentsPage />} />
            <Route path="redemptions" element={<RedemptionsPage />} />
            <Route path="leaderboards" element={<LeaderboardsPage />} />
            <Route path="badges" element={<BadgesPage />} />
            <Route path="fraud" element={<FraudMonitoringPage />} />
            <Route path="reports" element={<RewardReportsPage />} />
            <Route path="settings" element={<RewardSettingsPage />} />
            <Route path="*" element={<NestedRouteRedirect defaultSegment="dashboard" />} />
          </Routes>
        </Suspense>
      </section>
    </div>
  )
}
