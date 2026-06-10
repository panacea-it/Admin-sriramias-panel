import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { getDefaultRouteForRole } from '../config/rbacAccess'
import LoadingState from '../components/feedback/LoadingState'

/** Login and other public pages — signed-in users go to their role home route. */
export default function GuestRoute({ children }) {
  const { isAuthenticated, loading, user } = useAuth()

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f7f7f7]">
        <LoadingState message="Loading..." />
      </div>
    )
  }

  if (isAuthenticated) {
    return <Navigate to={getDefaultRouteForRole(user?.role)} replace />
  }

  return children
}
