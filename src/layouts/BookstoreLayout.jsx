import { lazy, Suspense } from 'react'
import '../components/bookstore/modal/bookstore-modal.css'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import BookstoreErrorBoundary from '../components/bookstore/BookstoreErrorBoundary'
import BookstoreDashboardSkeleton from '../components/bookstore/BookstoreDashboardSkeleton'
import PermissionDeniedPage from '../pages/auth/PermissionDeniedPage'
import { usePermissions } from '../hooks/usePermissions'
import { canAccessBookstoreRoute } from '../config/bookstoreRbac'
const BookstoreDashboardPage = lazy(() => import('../pages/bookstore/BookstoreDashboardPage'))
const BookstoreProductsPage = lazy(() => import('../pages/bookstore/BookstoreProductsPage'))
const BookstoreInventoryPage = lazy(() => import('../pages/bookstore/BookstoreInventoryPage'))
const BookstoreCombosPage = lazy(() => import('../pages/bookstore/BookstoreCombosPage'))
const BookstoreBundlesPage = lazy(() => import('../pages/bookstore/BookstoreBundlesPage'))
const BookstoreOrdersPage = lazy(() => import('../pages/bookstore/BookstoreOrdersPage'))
const BookstorePaymentsPage = lazy(() => import('../pages/bookstore/BookstorePaymentsPage'))
const BookstoreWalletPage = lazy(() => import('../pages/bookstore/BookstoreWalletPage'))
const BookstoreRecommendationsPage = lazy(() => import('../pages/bookstore/BookstoreRecommendationsPage'))
const BookstoreInvoicesPage = lazy(() => import('../pages/bookstore/BookstoreInvoicesPage'))
const BookstoreReportsPage = lazy(() => import('../pages/bookstore/BookstoreReportsPage'))

function BookstoreRouteGuard({ children }) {
  const { role } = usePermissions()
  const { pathname } = useLocation()
  if (!canAccessBookstoreRoute(role, pathname)) {
    return <PermissionDeniedPage />
  }
  return children
}

function PageFallback() {
  return (
    <div className="p-6">
      <BookstoreDashboardSkeleton />
    </div>
  )
}

export default function BookstoreLayout() {
  return (
    <BookstoreErrorBoundary>
      <div className="figma-admin-section min-h-screen bg-[#f7f7f7] px-4 pb-8 pt-6 sm:px-5 lg:px-6">
        <section className="mx-auto max-w-screen-2xl">
          <BookstoreRouteGuard>
            <Suspense fallback={<PageFallback />}>
              <Routes>
                <Route index element={<Navigate to="dashboard" replace />} />
                <Route path="dashboard" element={<BookstoreDashboardPage />} />
                <Route path="products" element={<BookstoreProductsPage />} />
                <Route path="inventory" element={<BookstoreInventoryPage />} />
                <Route path="combos" element={<BookstoreCombosPage />} />
                <Route path="bundles" element={<BookstoreBundlesPage />} />
                <Route path="orders" element={<BookstoreOrdersPage />} />
                <Route path="payments" element={<BookstorePaymentsPage />} />
                <Route path="wallet" element={<BookstoreWalletPage />} />
                <Route path="recommendations" element={<BookstoreRecommendationsPage />} />
                <Route path="invoices" element={<BookstoreInvoicesPage />} />
                <Route path="reports" element={<BookstoreReportsPage />} />
                <Route path="*" element={<Navigate to="dashboard" replace />} />
              </Routes>
            </Suspense>
          </BookstoreRouteGuard>
        </section>
      </div>
    </BookstoreErrorBoundary>
  )
}
