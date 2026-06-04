import { Suspense } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { BatchManagementProvider } from '../contexts/BatchManagementContext'
import RouteErrorBoundary from '../components/feedback/RouteErrorBoundary'
import { lazyRoute } from '../routes/lazyRoute'

const BatchesPage = lazyRoute(
  () => import('../pages/academics/BatchesPage'),
  'Batches page',
)
const BatchDetailsPage = lazyRoute(
  () => import('../pages/academics/BatchDetailsPage'),
  'Batch details page',
)

function BatchListFallback() {
  return (
    <div className="figma-admin-section min-h-screen bg-[#f7f7f7] px-4 py-12 text-center">
      <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-[#55ace7] border-t-transparent" />
      <p className="mt-4 text-sm text-[#686868]">Loading…</p>
    </div>
  )
}

export default function BatchManagementLayout() {
  const location = useLocation()

  return (
    <BatchManagementProvider>
      <Suspense fallback={<BatchListFallback />}>
        <RouteErrorBoundary resetKey={location.pathname}>
          <Routes>
            <Route index element={<BatchesPage />} />
            <Route path=":batchId" element={<BatchDetailsPage />} />
            <Route path="*" element={<Navigate to="/academics/batch" replace />} />
          </Routes>
        </RouteErrorBoundary>
      </Suspense>
    </BatchManagementProvider>
  )
}
