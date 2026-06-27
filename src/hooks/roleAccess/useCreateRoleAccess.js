import { useMutation, useQueryClient } from '@tanstack/react-query'
import roleAccessService from '../../services/roleAccessService'
import { roleAccessKeys } from './roleAccessKeys'

export function useCreateRoleAccess() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload) => roleAccessService.createRoleAccess(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: roleAccessKeys.all })
    },
  })
}
