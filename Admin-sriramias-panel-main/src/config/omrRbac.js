import { ROLES } from '../constants/roles'
import { OMR_PERMS, getOmrPermissionsForRole, roleHasOmrPerm } from '../constants/omrPermissions'
import { TEST_MANAGEMENT_ROUTES } from '../constants/testManagementNav'
import { roleHasFullAccess } from './rbacAccess'

const OMR_ROUTE_PREFIX = TEST_MANAGEMENT_ROUTES.omr

export function canAccessOmrPermission(role, permission) {
  if (roleHasFullAccess(role)) return true
  return roleHasOmrPerm(role, permission)
}

export function canAccessOmrRoute(role, pathname) {
  if (!pathname.startsWith(OMR_ROUTE_PREFIX)) return true
  if (roleHasFullAccess(role)) return true
  if (!getOmrPermissionsForRole(role).includes(OMR_PERMS.VIEW)) return false

  if (pathname.includes('/create')) {
    return canAccessOmrPermission(role, OMR_PERMS.CREATE)
  }
  if (pathname.includes('/edit/')) {
    return canAccessOmrPermission(role, OMR_PERMS.EDIT)
  }
  if (pathname.includes('/upload-results')) {
    return canAccessOmrPermission(role, OMR_PERMS.UPLOAD_RESULT)
  }

  return canAccessOmrPermission(role, OMR_PERMS.VIEW)
}

export function filterOmrNavForRole(role, navItem) {
  if (!navItem?.path?.startsWith(OMR_ROUTE_PREFIX)) return navItem
  if (!canAccessOmrPermission(role, OMR_PERMS.VIEW)) return null
  return navItem
}

export { OMR_PERMS, getOmrPermissionsForRole }
