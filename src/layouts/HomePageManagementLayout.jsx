import { Suspense } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { YoutubeVideosProvider } from '../contexts/YoutubeVideosContext'
import RouteErrorBoundary from '../components/feedback/RouteErrorBoundary'
import { lazyRoute } from '../routes/lazyRoute'

const YoutubeManagementPage = lazyRoute(
  () => import('../pages/marketing/YoutubeManagementPage'),
  'Youtube Management',
)
const RankManagementPage = lazyRoute(
  () => import('../pages/marketing/RankManagementPage'),
  'Rank Management',
)
const FreeLearningResourcesPage = lazyRoute(
  () => import('../pages/marketing/FreeLearningResourcesPage'),
  'Free Learning Resources',
)
const FreeLearningResourceViewPage = lazyRoute(
  () => import('../pages/marketing/FreeLearningResourceViewPage'),
  'View Free Learning Resource',
)
const FreeLearningResourceEditPage = lazyRoute(
  () => import('../pages/marketing/FreeLearningResourceEditPage'),
  'Edit Free Learning Resource',
)

function PageFallback() {
  return (
    <div className="figma-admin-section min-h-screen bg-[#f7f7f7] px-4 py-12 text-center">
      <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-[#55ace7] border-t-transparent" />
      <p className="mt-4 text-sm text-[#686868]">Loading…</p>
    </div>
  )
}

export default function HomePageManagementLayout() {
  const location = useLocation()

  return (
    <YoutubeVideosProvider>
      <Suspense fallback={<PageFallback />}>
        <RouteErrorBoundary resetKey={location.pathname}>
          <Routes>
            <Route index element={<Navigate to="website" replace />} />
            <Route path="website" element={<YoutubeManagementPage />} />
            <Route path="rank-management" element={<RankManagementPage />} />
            <Route path="free-learning-resources" element={<FreeLearningResourcesPage />} />
            <Route
              path="free-learning-resources/view/:resourceType"
              element={<FreeLearningResourceViewPage />}
            />
            <Route
              path="free-learning-resources/edit/:resourceType"
              element={<FreeLearningResourceEditPage />}
            />
            <Route path="*" element={<Navigate to="/marketing/website" replace />} />
          </Routes>
        </RouteErrorBoundary>
      </Suspense>
    </YoutubeVideosProvider>
  )
}
