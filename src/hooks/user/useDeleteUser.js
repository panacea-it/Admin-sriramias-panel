import { useMutation, useQueryClient } from '@tanstack/react-query'
import userService from '../../services/userService'
import { userKeys } from './userKeys'

export function useDeleteUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, type }) => userService.deleteUser(id, type),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.lists() })
    },
  })
}
