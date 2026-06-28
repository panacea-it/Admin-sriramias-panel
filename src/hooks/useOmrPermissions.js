import { useMemo } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { OMR_PERMS, getOmrPermissionsForRole } from '../constants/omrPermissions'
import { canAccessOmrPermission } from '../config/omrRbac'
import { roleHasFullAccess } from '../config/rbacAccess'

/**
 * Permission model (backend):
 * - Read + first upload + download: OMR_MANAGEMENT or Super Admin
 * - Create / update / delete exam, replace sheet, delete sheet: Super Admin only
 */
export function useOmrPermissions() {
  const { user, isSuperAdmin } = useAuth()
  const role = user?.role

  return useMemo(() => {
    const perms = getOmrPermissionsForRole(role)
    const hasOmrAccess = (permission) =>
      isSuperAdmin || canAccessOmrPermission(role, permission)

    return {
      role,
      isSuperAdmin,
      permissions: perms,
      canView: hasOmrAccess(OMR_PERMS.VIEW),
      canCreate: isSuperAdmin,
      canEdit: isSuperAdmin,
      canDelete: isSuperAdmin,
      canUploadResult: hasOmrAccess(OMR_PERMS.UPLOAD_RESULT),
      canReplaceResult: isSuperAdmin,
      canDownloadResult: hasOmrAccess(OMR_PERMS.DOWNLOAD_RESULT),
      canDeleteResult: isSuperAdmin,
    }
  }, [role, isSuperAdmin])
}
