import { useMutation, useQueryClient } from '@tanstack/react-query'
import adminManagementService from '../../services/adminManagementService'
import { adminKeys } from './adminKeys'

export function useDeleteAdmin() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id) => adminManagementService.deleteAdmin(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.lists() })
    },
  })
}
