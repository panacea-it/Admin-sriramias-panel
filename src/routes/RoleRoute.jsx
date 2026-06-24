import PermissionDeniedPage from '../pages/auth/PermissionDeniedPage'
import { usePermissions } from '../hooks/usePermissions'

/**
 * Client-side role gate for UI routes. API must enforce permissions server-side.
 */
export default function RoleRoute({ children, allowedRoles }) {
  const { role, hasRole } = usePermissions()

  if (allowedRoles?.length && (!role || !hasRole(...allowedRoles))) {
    return <PermissionDeniedPage />
  }

  return children
}
