import { useQuery } from '@tanstack/react-query'
import adminManagementService from '../../services/adminManagementService'
import { adminKeys } from './adminKeys'

/** Active roles for admin create/edit forms — GET /api/admin/roles/dropdown */
export function useAdminRolesDropdown(options = {}) {
  return useQuery({
    queryKey: adminKeys.rolesDropdown(),
    queryFn: () => adminManagementService.getRolesDropdown(),
    staleTime: 5 * 60 * 1000,
    ...options,
  })
}

/** @deprecated Use useAdminRolesDropdown — avoids conflict with AdminRolesContext.useAdminRoles */
export const useAdminRoles = useAdminRolesDropdown
