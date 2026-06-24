import PermissionDeniedPage from '../../../pages/auth/PermissionDeniedPage'
import { usePermissions } from '../../../hooks/usePermissions'

export default function CbtTestRouteGuard({ children }) {
  const { isSuperAdmin } = usePermissions()

  if (!isSuperAdmin) {
    return <PermissionDeniedPage />
  }

  return children
}
