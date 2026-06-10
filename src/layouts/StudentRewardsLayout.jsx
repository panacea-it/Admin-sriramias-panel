import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import LoadingState from '../components/feedback/LoadingState'
import NestedRouteRedirect from '../components/feedback/NestedRouteRedirect'

const StudentRewardsOverviewPage = lazy(() => import('../pages/rewards/student/StudentRewardsOverviewPage'))
const StudentWalletPage = lazy(() => import('../pages/rewards/student/StudentWalletPage'))
const StudentRedeemPage = lazy(() => import('../pages/rewards/student/StudentRedeemPage'))
const StudentLeaderboardPage = lazy(() => import('../pages/rewards/student/StudentLeaderboardPage'))
const StudentAchievementsPage = lazy(() => import('../pages/rewards/student/StudentAchievementsPage'))
const StudentReferralsPage = lazy(() => import('../pages/rewards/student/StudentReferralsPage'))

export default function StudentRewardsLayout() {
  return (
    <div className="figma-admin-section min-h-screen bg-[#f7f7f7] px-4 pb-8 pt-6 sm:px-5 lg:px-6">
      <section className="mx-auto max-w-screen-2xl">
        <Suspense fallback={<LoadingState message="Loading…" className="m-6" />}>
          <Routes>
            <Route index element={<Navigate to="rewards" replace />} />
            <Route path="rewards" element={<StudentRewardsOverviewPage />} />
            <Route path="wallet" element={<StudentWalletPage />} />
            <Route path="wallet/redeem" element={<StudentRedeemPage />} />
            <Route path="leaderboard" element={<StudentLeaderboardPage />} />
            <Route path="achievements" element={<StudentAchievementsPage />} />
            <Route path="referrals" element={<StudentReferralsPage />} />
            <Route path="*" element={<NestedRouteRedirect defaultSegment="rewards" />} />
          </Routes>
        </Suspense>
      </section>
    </div>
  )
}
