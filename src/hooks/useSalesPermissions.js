import { useMemo } from 'react'
import { useAuth } from '../contexts/AuthContext'
import {
  SALES_PERMS,
  getSalesPermissionsForRole,
  resolveSalesRole,
  salesRoleHasPerm,
} from '../constants/salesPermissions'
import { SALES_ROLES } from '../constants/salesRoles'
import { roleHasFullAccess } from '../config/rbacAccess'
import { ROLES } from '../constants/roles'

export function useSalesPermissions() {
  const { user } = useAuth()
  const adminRole = user?.role
  const salesRole = user?.salesRole || resolveSalesRole(adminRole)

  return useMemo(() => {
    const isSuperAdmin = adminRole === ROLES.SUPER_ADMIN || salesRole === SALES_ROLES.SUPER_ADMIN
    const can = (p) => isSuperAdmin || salesRoleHasPerm(salesRole, p)

    return {
      adminRole,
      salesRole,
      counselorId: user?.counselorId || 'c1',
      counselorName: user?.name || 'Current User',
      permissions: getSalesPermissionsForRole(salesRole),
      canViewOwnLeads: can(SALES_PERMS.VIEW_OWN_LEADS),
      canViewTeamLeads: can(SALES_PERMS.VIEW_TEAM_LEADS),
      canViewAllLeads: can(SALES_PERMS.VIEW_ALL_LEADS),
      canEditLead: can(SALES_PERMS.EDIT_LEAD),
      canDeleteLead: can(SALES_PERMS.DELETE_LEAD),
      canReassign: can(SALES_PERMS.REASSIGN_LEAD),
      canUnlock: can(SALES_PERMS.UNLOCK_LEAD),
      canEditSource: can(SALES_PERMS.EDIT_SOURCE),
      canTeamAnalytics: can(SALES_PERMS.TEAM_ANALYTICS),
      canGlobalAnalytics: can(SALES_PERMS.GLOBAL_ANALYTICS),
      canExport: can(SALES_PERMS.EXPORT),
      canConfigure: can(SALES_PERMS.CONFIGURE_TRACKING),
      isCounselor: salesRole === SALES_ROLES.COUNSELOR,
      isTeamLead: salesRole === SALES_ROLES.TEAM_LEAD,
      isSalesHead: salesRole === SALES_ROLES.SALES_HEAD,
      isCenterHead: salesRole === SALES_ROLES.CENTER_HEAD,
      isSuperAdmin,
      filterLeadsForRole: (leads) => {
        if (can(SALES_PERMS.VIEW_ALL_LEADS) || roleHasFullAccess(adminRole)) return leads
        if (can(SALES_PERMS.VIEW_TEAM_LEADS)) {
          const team = user?.team
          return team ? leads.filter((l) => l.team === team) : leads
        }
        return leads.filter((l) => l.counselorId === (user?.counselorId || 'c1'))
      },
    }
  }, [adminRole, salesRole, user?.counselorId, user?.name, user?.team])
}
