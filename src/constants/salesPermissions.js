import { ROLES } from './roles'
import { SALES_ROLES } from './salesRoles'

export const SALES_PERMS = {
  VIEW_OWN_LEADS: 'sales.view_own_leads',
  VIEW_TEAM_LEADS: 'sales.view_team_leads',
  VIEW_ALL_LEADS: 'sales.view_all_leads',
  EDIT_LEAD: 'sales.edit_lead',
  DELETE_LEAD: 'sales.delete_lead',
  REASSIGN_LEAD: 'sales.reassign_lead',
  UNLOCK_LEAD: 'sales.unlock_lead',
  EDIT_SOURCE: 'sales.edit_source',
  TEAM_ANALYTICS: 'sales.team_analytics',
  GLOBAL_ANALYTICS: 'sales.global_analytics',
  EXPORT: 'sales.export',
  CONFIGURE_TRACKING: 'sales.configure_tracking',
}

const SALES_ROLE_PERMS = {
  [SALES_ROLES.COUNSELOR]: [
    SALES_PERMS.VIEW_OWN_LEADS,
    SALES_PERMS.EDIT_LEAD,
    SALES_PERMS.EXPORT,
  ],
  [SALES_ROLES.TEAM_LEAD]: [
    SALES_PERMS.VIEW_TEAM_LEADS,
    SALES_PERMS.EDIT_LEAD,
    SALES_PERMS.REASSIGN_LEAD,
    SALES_PERMS.TEAM_ANALYTICS,
    SALES_PERMS.EXPORT,
  ],
  [SALES_ROLES.SALES_HEAD]: [
    SALES_PERMS.VIEW_ALL_LEADS,
    SALES_PERMS.EDIT_LEAD,
    SALES_PERMS.REASSIGN_LEAD,
    SALES_PERMS.UNLOCK_LEAD,
    SALES_PERMS.GLOBAL_ANALYTICS,
    SALES_PERMS.EXPORT,
  ],
  [SALES_ROLES.CENTER_HEAD]: [
    SALES_PERMS.VIEW_ALL_LEADS,
    SALES_PERMS.GLOBAL_ANALYTICS,
    SALES_PERMS.EXPORT,
  ],
  [SALES_ROLES.SUPER_ADMIN]: Object.values(SALES_PERMS),
}

/** Map admin panel roles to sales hierarchy for RBAC */
export function resolveSalesRole(adminRole) {
  switch (adminRole) {
    case ROLES.SUPER_ADMIN:
      return SALES_ROLES.SUPER_ADMIN
    case ROLES.CENTER_ADMIN:
      return SALES_ROLES.CENTER_HEAD
    case ROLES.COUNSELING_ADMIN:
      return SALES_ROLES.COUNSELOR
    case ROLES.MENTOR_ADMIN:
      return SALES_ROLES.TEAM_LEAD
    default:
      return SALES_ROLES.COUNSELOR
  }
}

export function getSalesPermissionsForRole(salesRole) {
  return SALES_ROLE_PERMS[salesRole] || []
}

export function salesRoleHasPerm(salesRole, perm) {
  const perms = getSalesPermissionsForRole(salesRole)
  return perms.includes(perm)
}
