import { useLocation } from 'react-router-dom'
import PermissionDeniedPage from '../../../pages/auth/PermissionDeniedPage'
import { usePermissions } from '../../../hooks/usePermissions'
import { canAccessOmrRoute } from '../../../config/omrRbac'

export default function OmrRouteGuard({ children }) {
  const { role } = usePermissions()
  const { pathname } = useLocation()

  if (!canAccessOmrRoute(role, pathname)) {
    return <PermissionDeniedPage />
  }

  return children
}
