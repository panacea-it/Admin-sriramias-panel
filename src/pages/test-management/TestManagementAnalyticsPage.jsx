import { Navigate } from 'react-router-dom'
import { TEST_MANAGEMENT_ROUTES } from '../../constants/testManagementNav'

/** Analytics merged into Dashboard — kept for legacy route redirects. */
export default function TestManagementAnalyticsPage() {
  return <Navigate to={TEST_MANAGEMENT_ROUTES.dashboard} replace />
}
