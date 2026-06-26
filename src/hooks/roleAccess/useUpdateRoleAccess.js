import { useMutation, useQueryClient } from '@tanstack/react-query'
import roleAccessService from '../../services/roleAccessService'
import { roleAccessKeys } from './roleAccessKeys'

export function useUpdateRoleAccess() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, payload }) => roleAccessService.updateRoleAccess(id, payload),
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({ queryKey: roleAccessKeys.all })
      queryClient.invalidateQueries({ queryKey: roleAccessKeys.detail(id) })
    },
  })
}

export function useUpdateRoleAccessStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, status }) => roleAccessService.updateRoleAccessStatus(id, status),
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({ queryKey: roleAccessKeys.all })
      queryClient.invalidateQueries({ queryKey: roleAccessKeys.detail(id) })
    },
  })
}
