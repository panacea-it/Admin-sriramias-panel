import { useMemo } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { OMR_PERMS, getOmrPermissionsForRole } from '../constants/omrPermissions'
import { canAccessOmrPermission } from '../config/omrRbac'
import { roleHasFullAccess } from '../config/rbacAccess'

export function useOmrPermissions() {
  const { user } = useAuth()
  const role = user?.role

  return useMemo(() => {
    const perms = getOmrPermissionsForRole(role)
    const can = (p) => roleHasFullAccess(role) || canAccessOmrPermission(role, p)

    return {
      role,
      permissions: perms,
      canView: can(OMR_PERMS.VIEW),
      canCreate: can(OMR_PERMS.CREATE),
      canEdit: can(OMR_PERMS.EDIT),
      canDelete: can(OMR_PERMS.DELETE),
      canUploadResult: can(OMR_PERMS.UPLOAD_RESULT),
      canDownloadResult: can(OMR_PERMS.DOWNLOAD_RESULT),
      canDeleteResult: can(OMR_PERMS.DELETE_RESULT),
    }
  }, [role])
}
