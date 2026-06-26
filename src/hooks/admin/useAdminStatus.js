import { useMutation, useQueryClient } from '@tanstack/react-query'
import adminManagementService from '../../services/adminManagementService'
import { adminKeys } from './adminKeys'

export function useAdminStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, status }) => adminManagementService.updateAdminStatus(id, status),
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({ queryKey: adminKeys.lists() })
      queryClient.invalidateQueries({ queryKey: adminKeys.detail(id) })
    },
  })
}
