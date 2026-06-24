import { Navigate, useLocation } from 'react-router-dom'

/**
 * Fallback for unmatched nested layout segments — redirects to a default child route.
 */
export default function NestedRouteRedirect({ defaultSegment = 'dashboard' }) {
  const { pathname } = useLocation()
  const base = pathname.replace(/\/[^/]+\/?$/, '') || pathname
  const target = `${base.replace(/\/$/, '')}/${defaultSegment}`
  return <Navigate to={target} replace />
}
