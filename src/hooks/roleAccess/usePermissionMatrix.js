import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import roleAccessService from '../../services/roleAccessService'
import { roleAccessKeys } from './roleAccessKeys'

export function usePermissionModules(options = {}) {
  return useQuery({
    queryKey: roleAccessKeys.permissionModules(),
    queryFn: async () => {
      const data = await roleAccessService.getPermissionModules()
      return Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : []
    },
    staleTime: 10 * 60 * 1000,
    ...options,
  })
}

export function usePermissionMatrixByRole(roleId, options = {}) {
  return useQuery({
    queryKey: roleAccessKeys.permissionMatrix(roleId),
    queryFn: async () => {
      const data = await roleAccessService.getPermissionMatrixByRole(roleId)
      return data?.data ?? data
    },
    enabled: Boolean(roleId),
    ...options,
  })
}

export function useUpdateFeaturePermission(roleId) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ permissionId, featureKey, allowed }) =>
      roleAccessService.updateFeaturePermission(permissionId, { featureKey, allowed }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: roleAccessKeys.permissionMatrix(roleId) })
    },
  })
}

export function useModulePermissionAction(roleId) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ permissionId, action }) => {
      if (action === 'enable_all') {
        return roleAccessService.enableAllModulePermissions(permissionId)
      }
      if (action === 'restrict_all') {
        return roleAccessService.restrictAllModulePermissions(permissionId)
      }
      if (action === 'reset') {
        return roleAccessService.resetModulePermissions(permissionId)
      }
      throw new Error('Unknown module permission action')
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: roleAccessKeys.permissionMatrix(roleId) })
    },
  })
}

export function useSyncPermissionMatrixBulk(roleId) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (updates) => roleAccessService.syncPermissionMatrixBulk({ updates }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: roleAccessKeys.permissionMatrix(roleId) })
      queryClient.invalidateQueries({ queryKey: roleAccessKeys.all })
    },
  })
}
