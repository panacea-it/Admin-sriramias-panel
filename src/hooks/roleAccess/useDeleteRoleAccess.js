import { useMutation, useQueryClient } from '@tanstack/react-query'
import roleAccessService from '../../services/roleAccessService'
import { roleAccessKeys } from './roleAccessKeys'

export function useDeleteRoleAccess() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id) => roleAccessService.deleteRoleAccess(id),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: roleAccessKeys.all })
      queryClient.invalidateQueries({ queryKey: roleAccessKeys.permissionMatrix(id) })
    },
  })
}
