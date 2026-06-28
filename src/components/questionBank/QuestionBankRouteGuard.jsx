import PermissionDeniedPage from '../../pages/auth/PermissionDeniedPage'
import { usePermissions } from '../../hooks/usePermissions'
import { canAccessQuestionBankRoute } from '../../config/questionBankRbac'

export default function QuestionBankRouteGuard({ children }) {
  const { role } = usePermissions()

  if (!canAccessQuestionBankRoute(role)) {
    return <PermissionDeniedPage />
  }

  return children
}
