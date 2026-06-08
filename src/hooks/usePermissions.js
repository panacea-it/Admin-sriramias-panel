import { useMemo } from 'react'
import { useAuth } from '../contexts/AuthContext'
import {
  canAccessRoute,
  getDashboardSectionsForRole,
  getDefaultRouteForRole,
  getSidebarGroupsForRole,
  roleHasFullAccess,
  showDashboardNavForRole,
} from '../config/rbacAccess'
import { ROLE_LABELS } from '../constants/roles'

export function usePermissions() {
  const { user } = useAuth()
  const role = user?.role

  return useMemo(
    () => ({
      role,
      roleLabel: ROLE_LABELS[role] || 'Admin',
      isSuperAdmin: roleHasFullAccess(role),
      canAccessRoute: (pathname) => canAccessRoute(role, pathname),
      defaultRoute: getDefaultRouteForRole(role),
      sidebarGroups: getSidebarGroupsForRole(role),
      showDashboard: showDashboardNavForRole(role),
      dashboardSections: getDashboardSectionsForRole(role),
      hasRole: (...roles) => roles.includes(role),
    }),
    [role],
  )
}
