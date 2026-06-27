import { useQuery } from '@tanstack/react-query'
import adminManagementService from '../../services/adminManagementService'
import { adminKeys } from './adminKeys'

/** GET /api/admin/permissions/my-access — sidebar / route gating */
export function useMyAdminPermissions(options = {}) {
  return useQuery({
    queryKey: adminKeys.myPermissions(),
    queryFn: () => adminManagementService.getMyPermissions(),
    staleTime: 2 * 60 * 1000,
    ...options,
  })
}

/** GET /api/admin/permissions/role/:roleId — permission matrix for a role */
export function useAdminPermissions(roleId, options = {}) {
  return useQuery({
    queryKey: adminKeys.rolePermissions(roleId),
    queryFn: () => adminManagementService.getPermissionsByRole(roleId),
    enabled: Boolean(roleId),
    staleTime: 2 * 60 * 1000,
    ...options,
  })
}
