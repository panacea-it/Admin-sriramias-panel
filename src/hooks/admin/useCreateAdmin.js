import { useMutation, useQueryClient } from '@tanstack/react-query'
import adminManagementService from '../../services/adminManagementService'
import { adminKeys } from './adminKeys'

export function useCreateAdmin() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload) => adminManagementService.createAdmin(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.lists() })
    },
  })
}
