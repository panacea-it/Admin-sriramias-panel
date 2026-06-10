import { Outlet, useLocation } from 'react-router-dom'
import PermissionDeniedPage from '../pages/auth/PermissionDeniedPage'
import { usePermissions } from '../hooks/usePermissions'

/** Blocks outlet routes the signed-in role cannot access */
export default function RoutePermissionGuard() {
  const location = useLocation()
  const { canAccessRoute } = usePermissions()

  if (!canAccessRoute(location.pathname)) {
    return <PermissionDeniedPage />
  }

  return <Outlet />
}
