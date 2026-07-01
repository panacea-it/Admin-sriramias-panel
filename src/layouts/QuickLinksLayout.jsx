import { Suspense } from 'react'
import { Navigate, Route, Routes, useLocation, useParams } from 'react-router-dom'
import RouteErrorBoundary from '../components/feedback/RouteErrorBoundary'
import { lazyRoute } from '../routes/lazyRoute'
import { QUICK_LINKS_DEFAULT_SLUG, resolveSectionKeyFromParam, getSectionSlug } from '../constants/quickLinksConstants'

const QuickLinksSectionEditPage = lazyRoute(
  () => import('../pages/marketing/QuickLinksSectionEditPage'),
  'Edit Quick Links Section',
)
const QuickLinksSectionViewPage = lazyRoute(
  () => import('../pages/marketing/QuickLinksSectionViewPage'),
  'View Quick Links Section',
)

function LegacySectionKeyRedirect() {
  const { sectionKey } = useParams()
  const location = useLocation()
  const viewSuffix = location.pathname.includes('/view/') ? '/view' : ''
  const resolvedKey = resolveSectionKeyFromParam(sectionKey)
  const slug = getSectionSlug(resolvedKey) || QUICK_LINKS_DEFAULT_SLUG
  return <Navigate to={`/marketing/quick-links/${slug}${viewSuffix}`} replace />
}

function PageFallback() {
  return (
    <div className="figma-admin-section min-h-screen bg-[#f7f7f7] px-4 py-12 text-center">
      <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-[#55ace7] border-t-transparent" />
      <p className="mt-4 text-sm text-[#686868]">Loading…</p>
    </div>
  )
}

export default function QuickLinksLayout() {
  const location = useLocation()

  return (
    <Suspense fallback={<PageFallback />}>
      <RouteErrorBoundary resetKey={location.pathname}>
        <Routes>
          <Route index element={<Navigate to={QUICK_LINKS_DEFAULT_SLUG} replace />} />
          <Route path=":sectionSlug/view" element={<QuickLinksSectionViewPage />} />
          <Route path=":sectionSlug" element={<QuickLinksSectionEditPage />} />
          <Route path="view/:sectionKey" element={<LegacySectionKeyRedirect />} />
          <Route path="edit/:sectionKey" element={<LegacySectionKeyRedirect />} />
          <Route path="*" element={<Navigate to={QUICK_LINKS_DEFAULT_SLUG} replace />} />
        </Routes>
      </RouteErrorBoundary>
    </Suspense>
  )
}
