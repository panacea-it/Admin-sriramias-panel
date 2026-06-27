import { useMutation, useQueryClient } from '@tanstack/react-query'
import adminManagementService from '../../services/adminManagementService'
import { adminKeys } from './adminKeys'

export function useUpdateAdmin() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, payload }) => adminManagementService.updateAdmin(id, payload),
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({ queryKey: adminKeys.lists() })
      queryClient.invalidateQueries({ queryKey: adminKeys.detail(id) })
    },
  })
}
