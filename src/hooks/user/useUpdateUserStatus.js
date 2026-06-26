import { useMutation, useQueryClient } from '@tanstack/react-query'
import userService from '../../services/userService'
import { userKeys } from './userKeys'

export function useUpdateUserStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, status, type, recordType }) => {
      const resolvedType = type || recordType
      if (resolvedType === 'ADMIN') {
        return userService.updateAdminStatus(id, status)
      }
      return userService.updateUserStatus(id, status, resolvedType)
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: userKeys.lists() })
      queryClient.invalidateQueries({
        queryKey: userKeys.detail(variables.id, variables.type || variables.recordType),
      })
    },
  })
}
